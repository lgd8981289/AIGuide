# 观察者模式和发布订阅模式有什么区别？事件通知应该怎么设计？

[百度前端面试真题](../companies/baidu-frontend.md) · [美团前端面试真题](../companies/meituan-frontend.md) · [网易开发面试真题](../companies/netease-development.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/fullstack-system-design/q528-observer-vs-publish-subscribe/) · [题库目录](../../README.md)

下面是一段模拟面试对话。

🧑‍💻 面试官：保存草稿以后，预览和状态栏都要更新，怎么通知？

🙋‍♂️ 我：可以用观察者，也可以加事件总线做发布订阅。

🧑‍💻 面试官：加了事件总线以后，保存模块还需要保存两个模块的引用吗？

🙋‍♂️ 我：不需要，它只发布事件，事件中心管理订阅。

🧑‍💻 面试官：预览组件卸载以后忘记退订，会怎样？一个订阅回调抛错，另一个还能执行吗？

> 把订阅关系放进事件中心以后，耦合位置变了，生命周期和错误处理仍然需要有人负责。

## 面试速答（60 秒版）

通常说观察者模式时，被观察对象维护观察者关系，状态变化以后直接通知这些观察者。

发布订阅则通过一个事件中心或消息中介管理关系。发布者发送某个主题的事件，订阅者提前登记处理方法，两边不必直接保存对方引用。

例如保存草稿后发布 draft-saved，预览和状态栏分别订阅。保存模块不用知道有多少个界面模块，但仍要定义事件内容、退订方式和异常处理。

同时，有没有中介不直接决定同步或异步。Node.js EventEmitter 会同步调用监听器；分布式消息系统还有另外的交付和失败问题。[Node.js Events](https://nodejs.org/api/events.html)。术语在不同资料中也有重叠，面试时把对象关系和运行语义说清楚更重要。

![观察者与发布订阅：关系放哪里？](https://note.lgdsunday.club/img/Q528/01-events-overview.webp)

## 知识点详解：一次保存通知怎样到达两个模块

### 观察者关系由主题对象维护

假设草稿对象保存一组观察者。保存成功后，它逐个通知预览和状态栏，告诉它们当前版本。

这不一定要求主题认识观察者的具体类。主题可以只依赖统一的 update 接口，但仍要管理订阅列表。

因此，说它“耦合”时，要具体到谁维护关系，不是认为主题必须知道每个观察者的全部内部实现。

### 事件中心把关系放到另一个位置

换成发布订阅以后，保存模块向事件中心发出 draft-saved，事件中心找到对应回调，再通知各订阅者。

消息可以包含草稿 ID 和版本，而不是把整个保存模块对象都传出去。订阅者根据明确数据处理，就不必依赖发布者的内部字段。

下面实现进程内、同步、按订阅快照通知的最小事件中心。相同回调重复登记不产生重复项；异常会向发布者传播，后续回调不会继续。这些都是明确选择，不代表所有事件总线都必须这样做。

#### TypeScript

```typescript
type Handler = (event: unknown) => void;

class EventBus {
  private topics = new Map<string, Set<Handler>>();

  on(topic: string, handler: Handler) {
    const handlers = this.topics.get(topic) ?? new Set<Handler>();
    handlers.add(handler);
    this.topics.set(topic, handlers);
    let active = true;
    return () => {
      if (!active) return;
      active = false;
      handlers.delete(handler);
      if (handlers.size === 0 && this.topics.get(topic) === handlers) {
        this.topics.delete(topic);
      }
    };
  }

  emit(topic: string, event: unknown) {
    for (const handler of [...(this.topics.get(topic) ?? [])]) {
      handler(event);
    }
  }
}
```

#### Python

```python
class EventBus:
    def __init__(self):
        self.topics = {}

    def on(self, topic, handler):
        handlers = self.topics.setdefault(topic, {})
        handlers[handler] = None
        active = True

        def unsubscribe():
            nonlocal active
            if not active:
                return
            active = False
            handlers.pop(handler, None)
            if not handlers and self.topics.get(topic) is handlers:
                self.topics.pop(topic, None)

        return unsubscribe

    def emit(self, topic, event):
        for handler in list(self.topics.get(topic, {})):
            handler(event)
```

TypeScript 的 Set 与 Python 的字典在这里都用于去重并保存登记顺序。Python 示例限定普通可哈希回调，不是多线程安全的通用事件库。

退订函数可以重复调用，但只有第一次生效。这样，旧组件已经退订以后，即使它再次执行清理，也不会误删后来重新建立的订阅。

通知时先取快照，因此某回调取消另一项订阅，另一项仍可能在本次通知中执行，下一次才消失。注册和退订过程中的语义需要提前规定，不能让调用方靠猜。

![中介接管订阅关系，不是自动可靠](https://note.lgdsunday.club/img/Q528/02-direct-vs-hub.webp)

### 退订不是可有可无的清理

组件订阅以后，事件中心保存了它的回调。回调可能继续引用组件状态，组件从页面消失不意味着这条引用自动清除。

因此，on 返回一个退订函数，组件销毁时调用它。反复打开同一页面时，还要检查是否重复登记，否则一次保存可能触发多次更新。

一次性订阅也要有明确时机：应该在调用之前解除，还是调用以后解除，重入发事件时会产生不同结果。选用现成库时，应按它的契约处理。

![通知快照与退订时机](https://note.lgdsunday.club/img/Q528/03-snapshot-unsubscribe.webp)

这个时序对应本文先复制回调列表的实现，不是所有事件总线都必须遵守的规则。换一个库时，要重新确认通知期间退订的行为。

### 回调失败以后，是继续通知还是中止？

本文代码选择传播错误并中止。本来想更新两个模块，第一个抛错，第二个就不会执行。

如果这些消费者应互不影响，可以逐个捕获异常并报告，但不能默默吞掉。若需要等待异步回调，也要额外定义等待和失败聚合，不能以同步 emit 冒充完成全部异步工作。

当发布者与订阅者分布在不同进程，问题还会增加：交付失败、重复消息、积压与顺序。[发布订阅架构模式](https://learn.microsoft.com/en-us/azure/architecture/patterns/publisher-subscriber)。进程内解耦不自动具备这些保证。

## 面试官继续追问

### 发布订阅一定比观察者更好吗？

不一定。只有少量对象、关系很清楚时，直接维护观察者更容易追踪。事件中心减少直接引用，却可能让调用关系分散，事件名称和数据契约也要维护。

### emit 返回，表示所有订阅工作都完成了吗？

只在当前契约下解释。同步回调正常返回，表示同步执行结束；回调启动后台工作或返回 Promise，不表示后台任务已经完成。

### 怎么验证没有监听器泄漏？

反复挂载、卸载订阅组件，检查登记数量回到原值，再发布事件确认已卸载模块不再响应。同时覆盖退订、重复登记、通知期间退订和异常回调。

## 面试速记卡

> - 观察者：主题维护观察者关系并通知。
> - 发布订阅：事件中心维护主题与回调关系。
> - 解耦边界：减少直接引用，不免除事件契约和生命周期责任。
> - 执行语义：同步、异步、快照、异常与顺序分别明确。
> - 清理要求：销毁时退订，测试重复挂载和错误路径。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **百度 · 前端 · 原帖未明确批次**：怎样用 JavaScript 实现一个简单的发布订阅模式？（题意整理）。[面经来源](https://www.nowcoder.com/feed/main/detail/d088a8c478cd4256b098776b0d143918)；原帖发布于 2025-09-28。
- **美团 · 前端 · 暑期实习**：观察者模式和发布订阅模式有什么不同？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/606480513750007808)；标题记录 4 月 1 日二面；原帖发布于 2024-04-07。
- **网易 · 游戏研发工程师 · 27届暑期实习（原帖标题）**：观察者模式和发布订阅模式有什么区别，它们的通知关系如何组织？（题意整理）。[面经来源](https://www.nowcoder.com/feed/main/detail/17005da380b74636be2b5b4a7049b709)；页面显示 04-27 编辑，未明确年份；标题为 27 届暑期。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
