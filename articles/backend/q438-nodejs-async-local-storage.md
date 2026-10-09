# Node.js AsyncLocalStorage 是什么？如何在异步调用中保存请求上下文？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q438-nodejs-async-local-storage/) · [题库目录](../../README.md)

*下面是一段教学模拟，不是真实面试记录。*

🧑‍💻 面试官：一个请求经过路由、数据库和日志模块，你怎么让每条日志带上 requestId？

🙋‍♂️ 我：存到全局变量，日志模块直接读取。

🧑‍💻 面试官：请求 A 等数据库时，请求 B 覆盖了全局变量，会发生什么？

🙋‍♂️ 我：A 的日志就可能记成 B。

🧑‍💻 面试官：那 AsyncLocalStorage 怎么区分这两条同时运行的异步调用链？

> 我们需要的不是“所有代码都能看到一个变量”，而是「每条异步链看到自己的上下文」。

## 面试速答（60 秒版）

AsyncLocalStorage 用来沿异步调用链传递上下文。请求入口通过 run 建立一个上下文，后续异步任务可以使用 getStore 读取对应信息。

这样 requestId 不必层层传参，也不会像普通全局变量一样，被另一条并发请求直接覆盖。

不过，它不是自动复制所有对象。上下文中保存的对象仍可能被修改，脱离传播链的特殊异步实现也需要检查。

实际使用时，保存请求标识、追踪信息等少量数据，在入口建立边界，日志模块读取。不要把它当成自动鉴权机制，也不要把数据库连接或全局可变数据随意放进去长期保留。

![异步上下文：各自认回请求：传递上下文，不自动鉴权](https://note.lgdsunday.club/img/Q438/01-overview.webp)

## 知识点详解：等待期间，为什么还能找回当前请求？

### 全局变量只有一份，异步请求却有多条

假设 A 把全局 requestId 设为 A，随后等待查询。B 在这段时间把它改成 B。A 恢复后读到的也是 B。

这不是两个线程同时写变量才会出现的问题。即使 JavaScript 主线程逐段运行，不同请求也能在 await 前后交错。

解决方向是让变量归属一次调用链，而不是归属整个进程。

![全局变量怎样串请求：await 允许请求交错](https://note.lgdsunday.club/img/Q438/02-mechanism.webp)

### run 建立范围，getStore 读取当前范围

请求入口使用 run 传入上下文和回调。回调及沿着它创建的异步工作，能够取得这一范围的 store；范围之外，getStore 可能返回 undefined。

下面是独立演示，不是完整服务器：

**TypeScript**

```typescript
import { AsyncLocalStorage } from "node:async_hooks";
import { setTimeout as delay } from "node:timers/promises";

const context = new AsyncLocalStorage<{ requestId: string }>();

async function handle(requestId: string, waitMs: number) {
  return context.run({ requestId }, async () => {
    await delay(waitMs);
    return context.getStore()?.requestId;
  });
}

console.log(await Promise.all([
  handle("A", 20),
  handle("B", 5),
])); // ["A", "B"]
```

即使 B 先完成，A 恢复后读取的还是自己的 ID。Promise.all 的结果顺序是输入顺序，不是完成顺序。[Node.js 官方说明](https://nodejs.org/api/async_context.html)

Python 可以使用 contextvars 表达类似需求，但这是另一套运行时机制，不是 Node API 的翻译：

**Python**

```python
import asyncio
from contextvars import ContextVar

request_id = ContextVar("request_id", default=None)

async def handle(value, wait_seconds):
    token = request_id.set(value)
    try:
        await asyncio.sleep(wait_seconds)
        return request_id.get()
    finally:
        request_id.reset(token)

async def main():
    print(await asyncio.gather(
        handle("A", 0.02),
        handle("B", 0.005),
    ))  # ["A", "B"]

asyncio.run(main())
```

这里使用 reset 恢复设置前的值，避免同一执行范围里的后续代码继续使用本次请求信息。[Python 官方说明](https://docs.python.org/3/library/contextvars.html)

### 上下文隔离，不代表对象深拷贝

假设我们把一个数组放进两个 store，而且这个数组本来就是同一个对象。修改数组依然可能影响两个请求。

因此建立上下文时，应创建本次请求需要的独立数据，尽量保持只读。不要误以为换了存储方式，共享可变对象就自动消失。

对于自定义回调、特殊异步库等情况，如果 getStore 丢失，需要定位在哪个边界断开，再按 Node 的异步资源机制处理。不能直接用全局变量补回去。

### 它帮忙传身份，不替我们证明身份

请求入口可以在完成鉴权后，把已验证的身份放入上下文，供下游使用。但 requestId 本身只是追踪标识，不是用户权限。

如果浏览器能随便传一个 userId，服务端直接放进 store，下游再信任它，AsyncLocalStorage 并不会让这份数据变得可信。

另外，后台任务可能比请求活得更久。启动任务时要明确哪些数据需要继承，哪些身份和资源不应无限保留；必要时建立新的任务上下文。

## 面试官继续追问

### run 和 enterWith 可以随便替换吗？

不能。enterWith 会影响当前同步执行及后续异步范围，可能把上下文带到未预期的处理逻辑。请求边界通常优先使用范围明确的 run，再按具体需求判断其他接口。

### 为什么不全部显式传参数？

显式参数有清楚依赖，适合业务数据。追踪标识在很多基础设施层使用时，上下文存储能减少重复传递。它不应该成为隐藏所有业务依赖的理由。

### 怎么验证没有串请求？

并发发出不同 ID，安排不同等待顺序，检查每层日志对应关系；同时覆盖异常、回调库和后台任务。一个顺序执行样例不足以证明隔离。

## 面试速记卡

> - 用途：沿异步调用链传递当前请求的上下文。
> - run：建立明确作用范围。
> - getStore：读取当前范围，范围之外可能为空。
> - 隔离边界：不自动深拷贝共享对象，不保证所有特殊异步资源都无需适配。
> - 安全边界：上下文传递身份，身份仍需由可信入口验证。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
