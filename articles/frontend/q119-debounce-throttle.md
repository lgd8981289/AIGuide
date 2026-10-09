# 防抖和节流有什么区别？搜索框和滚动事件分别怎么选？

[百度前端面试真题](../companies/baidu-frontend.md) · [字节前端面试真题](../companies/bytedance-frontend.md) · [腾讯前端面试真题](../companies/tencent-frontend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q119-debounce-throttle/) · [题库目录](../../README.md)

<!-- 以下对话为教学模拟，非真实面经。 -->

🧑‍💻 面试官：搜索框输入时，应该用防抖还是节流？

🙋‍♂️ 我：通常用防抖，等用户停一下再搜索。

🧑‍💻 面试官：用户一直输入，防抖是不是就一直不发请求？

🙋‍♂️ 我：如果只有尾部触发，确实会这样，可以设置最长等待时间。

🧑‍💻 面试官：已经发出的旧请求比新请求晚返回，防抖能保证搜索结果不串吗？

> 防抖和节流决定「什么时候触发」；请求已经发出以后，结果是否仍然有效，还需要单独判断。

## 面试速答（60 秒版）

防抖会把一段连续触发合并处理。常见的尾部防抖，是每次触发重新计时，等一段时间没有新触发，再执行最后一次。因此，搜索建议、输入校验这类关心最终输入的功能，通常适合防抖。

节流则控制执行频率。即使事件一直发生，也会按约定的时间间隔提供执行机会，适合滚动位置统计、拖动过程更新等持续反馈的场景。

两者都需要明确是否立即执行、结束时是否补一次，以及要不要支持取消。一直输入时也需要定期反馈，可以考虑带最长等待时间的防抖。

另外，它们只限制触发，并不自动解决请求乱序。搜索接口还需要取消旧请求，或者在响应回来时检查它对应的输入版本，避免旧结果盖住新结果。

![防抖等待连续事件结束，节流在持续事件期间控制执行频率](https://note.lgdsunday.club/img/Q119/00-60s-overview.webp)

图中上轨为 200ms 尾部防抖，下轨按 300ms 首部节流示意；两条轨道使用同一串触发事件，但时间窗口不同。

## 知识点详解：沿着一串输入事件，看看函数在哪个时刻运行

### 为什么每次按键都搜索会有问题？

假设咱们在搜索框里输入 agent。每次按键都请求，后端可能依次收到 a、ag、age、agen、agent。

用户主要关心最后的完整输入，中间几个请求却占用了网络和服务端资源。尾部防抖会保留最新输入，每次按键把等待时间往后推。

例如约定等待 300 毫秒，只要还在连续输入，就继续等待。最后一次输入以后，安静了 300 毫秒，才执行搜索。这是演示参数，不是所有搜索框都应使用的标准值。

### 防抖不能直接代替持续反馈

如果页面滚动时需要更新当前位置，只有尾部防抖可能让位置提示一直不变，直到用户停止。

节流会给持续事件留出规律的执行机会。不过，“每 300 毫秒最多一次”还不够完整：第一次是否立即执行，最后一次事件是否补执行，也会影响用户看到的结果。

因此，在选择工具以前，先问当前功能是关心最终状态，还是需要看到过程。防抖和节流的各种 leading/trailing 选项，是在细化这个约定。

### 先实现一个范围明确的尾部防抖

下面两个版本都使用各自的事件循环定时器，只演示“最后一次输入后再执行”。不包含立即触发、最长等待时间或生产组件的完整清理封装。

#### TypeScript

```typescript
function debounce<T extends unknown[]>(
  fn: (...args: T) => void, delay: number
) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: T) => {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
const search = debounce((text: string) => console.log(text), 300);
search("ag");
search("agent"); // 安静 300 ms 后，只输出 agent
```

#### Python

```python
import asyncio

def debounce(fn, delay):
    handle = None
    def wrapped(*args):
        nonlocal handle
        if handle is not None:
            handle.cancel()
        loop = asyncio.get_running_loop()
        handle = loop.call_later(delay, fn, *args)
    return wrapped

async def main():
    search = debounce(print, 0.3)  # 秒
    search("ag")
    search("agent")
    await asyncio.sleep(0.35)

asyncio.run(main())
```

这两个示例限定同步回调。实际搜索通常会发起异步请求，还要补取消、异常处理和组件卸载清理。

### 为什么少发请求以后，结果仍可能不对？

假设搜索 A 已经发出。用户停一下，继续输入 B，又发出了搜索 B。B 先返回，页面显示 B；随后 A 返回，如果直接覆盖页面，用户又看到了旧结果。

防抖并不能撤回已经执行的请求。可以在发请求时保存递增的 requestVersion，响应回来以后，与当前版本比较。只有当前版本才能更新界面。

支持取消时，也可以终止旧请求。但取消和完成可能竞争，版本检查仍然有价值。

检查这套逻辑时，要分别测试持续输入、短暂停顿、长时间不停输入、组件卸载，以及响应倒序返回。只检查请求次数，很容易漏掉最后这一种问题。

本题机制参考：[MDN 防抖](https://developer.mozilla.org/en-US/docs/Glossary/Debounce)、[MDN 节流](https://developer.mozilla.org/en-US/docs/Glossary/Throttle)、[Python asyncio 定时调用](https://docs.python.org/3/library/asyncio-eventloop.html#scheduling-delayed-callbacks)。

![搜索响应通过请求版本检查，旧响应不再覆盖当前结果](https://note.lgdsunday.club/img/Q119/01-detail.webp)

## 面试官继续追问

### 防抖能防止重复付款吗？

不能。它最多合并一部分前端触发。网络重试、多设备提交和页面刷新仍可能造成重复请求，可靠防重需要服务端业务幂等。

### 拖动动画一定要用固定时间节流吗？

与绘制相关的更新，也可以通过 requestAnimationFrame 合并到渲染节奏。先看更新的目的，再决定用时间窗口还是绘制机会。

### 用户持续输入，也想定期搜索怎么办？

可以约定最长等待时间，或者采用适合的节流策略。要说明是最新输入、当前过程还是最后状态需要反馈，不仅是给函数加一个参数。

## 面试速记卡

> - 尾部防抖：连续触发后，安静一段时间再执行。
> - 节流：持续触发期间，按约定频率执行。
> - 行为契约：说明 leading、trailing、取消与最长等待。
> - 异步结果：减少触发不等于解决响应乱序。
> - 测试：同时检查次数、时刻和最终显示内容。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **百度 · 前端 · 实习（原帖标签）**：防抖与节流有什么区别，怎样实现防抖？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/530709141912829952)；原帖编辑于 2023-09-15。
- **字节跳动 · 前端 · 原帖未明确批次**：防抖和节流分别怎样实现？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353156819747020800)；原帖编辑于 2020-08-24。
- **腾讯 · 前端（TEG / QQ音乐 / PCG） · 暑期实习**：防抖和节流怎样工作？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353156343349583872)；面试记录为 2020 年 3 月；原帖编辑于 2020-04-19。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
