# Python 的 with 是怎么工作的？发生异常后为什么还能关闭文件？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q317-python-with-context-manager/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 **面试官：** with 为什么能自动关闭文件？

🙋‍♂️ **我：** with 后面执行完，Python 就会把资源关掉。

🧑‍💻 **面试官：** 读到一半抛异常，还会执行退出吗？退出以后，异常会继续抛吗？

🙋‍♂️ **我：** 应该会清理，不过是否继续抛还要看退出方法。

🧑‍💻 **面试官：** 如果进入资源时就失败，退出方法也一定会执行吗？

> with 不是“所有异常都自动处理”。它约定的是进入与退出协议，清理和异常传播要分别看。

## 面试速答（60 秒版）

with 使用上下文管理协议。先取得管理器，调用 **enter**，把返回值绑定给 as 后面的变量；正文结束后，再调用 **exit**。

如果正文抛出异常，**exit** 会拿到异常信息，所以它有机会释放资源。返回真值可以抑制这个异常；返回假值或 None，异常会继续传播。

但如果 **enter** 自己失败，正文不会执行，with 也不会自动调用这个管理器的 **exit**。进入过程里已经取得的部分资源，需要由实现负责处理。

所以，文件能自动关闭，是文件对象正确实现了协议，不是 with 会理解所有对象该怎样清理。

![with 的进入、正文与退出](https://note.lgdsunday.club/img/Q317/01-overview.webp)

*图：with 的进入、正文与退出。*

## 知识点详解：自动退出靠协议，不靠猜资源类型

### 一次 with 先后做什么？

假设我们打开文件，读取内容，然后解析。上下文管理器负责进入和退出，as 绑定的是 **enter** 的返回值，未必就是管理器本身。

正文正常结束，退出方法得到没有异常的参数。正文异常结束，退出方法得到异常的类型、对象和回溯信息，随后决定是否抑制。

这些顺序可以核对 [Python with 语句说明](https://docs.python.org/3/reference/compound_stmts.html)。文件只是这个协议的一个常见使用者，锁、事务等也可以有自己的进入和退出行为。

### 清理完了，不代表错误应该消失

下面用一个最小管理器记录顺序，不涉及真实文件 I/O。

#### Python

```python
class Scope:
    def __init__(self, events):
        self.events = events

    def __enter__(self):
        self.events.append("enter")
        return self

    def __exit__(self, kind, value, traceback):
        self.events.append("exit")
        return False

events = []
try:
    with Scope(events):
        events.append("body")
        raise ValueError("parse failed")
except ValueError:
    events.append("caught")
assert events == ["enter", "body", "exit", "caught"]
```

退出确实发生了，但它返回 False，因此错误仍然到外层。这正是很多资源清理需要的行为：句柄关闭了，处理失败也不能被伪装成成功。

#### TypeScript

```typescript
const events: string[] = [];
try {
  events.push("enter");
  try {
    events.push("body");
    throw new Error("parse failed");
  } finally {
    events.push("exit");
  }
} catch {
  events.push("caught");
}
console.assert(events.join(",") === "enter,body,exit,caught");
```

这里用 try/finally 演示“清理后继续传播”，不是声称 TS 有同一个 **exit** 协议，也没有用 return 覆盖原异常。

### 进入失败，谁收拾已经取得的资源？

假设 **enter** 先打开一个连接，再申请另一个资源，第二步失败。它没有成功完成进入，with 不会替它调用 **exit**。

因此，**enter** 自己要保证失败路径能清理前面已经取得的资源。多个资源的组合，也可以使用合适的上下文管理工具，按明确的生命周期组织。

“用了 with，所以没有泄漏”这个结论太快。协议入口的实现同样需要检查。

![进入失败，与正文失败不同](https://note.lgdsunday.club/img/Q317/02-paths.webp)

*图：进入失败，与正文失败不同。*

### 退出本身失败，又会怎样？

如果 **exit** 再抛一个异常，外层观察到的异常可能变成退出异常，原异常则通过异常上下文等机制保留。这时既要定位正文失败，也要定位清理失败。

另外，返回 True 是主动抑制异常，不是“清理成功”的通用标志。只应抑制真正处理过、符合契约的错误，否则很容易把解析失败、事务失败藏起来。

with 也不天然等于数据库事务成功提交。提交还是回滚，由具体管理器根据其协议决定。

## 面试官继续追问

**异步资源也用相同两个方法吗？**

异步上下文管理使用 async with 与相应异步进入、退出方法。不能把同步管理器直接当成异步实现。

**break 或 return 离开正文，会退出吗？**

成功进入后，通过这些控制流离开正文，仍会执行退出流程。但进程强制终止等外部情况，不属于“任何时候都保证清理”的承诺。

## 面试速记卡

> - 进入：**enter** 的返回值绑定给 as。
> - 退出：正文正常或异常结束，都按协议调用 **exit**。
> - 传播：真值可抑制异常，假值让异常继续传播。
> - 进入失败：不自动调用这个管理器的 **exit**。
> - 清理：检查进入、正文和退出三条失败路径。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
