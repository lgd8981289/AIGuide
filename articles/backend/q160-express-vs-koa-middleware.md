# Express 和 Koa 的中间件有什么区别？洋葱模型是怎么执行的？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q160-express-vs-koa-middleware/) · [题库目录](../../README.md)

<!-- 以下对话为教学模拟，非真实面经。 -->

🧑‍💻 面试官：Express 和 Koa 中间件有什么区别？

🙋‍♂️ 我：都按顺序执行，Koa 叫洋葱模型。

🧑‍💻 面试官：第一个 Koa 中间件写 await next()，它后面的代码什么时候执行？

🙋‍♂️ 我：等下一个中间件完成以后再执行。

🧑‍💻 面试官：那 Express 的 next() 也能直接 await，保证等所有异步路由结束吗？

> 关键不在「都有 next」，而在 next 交出去的控制权，能不能沿着等待链回来。

## 面试速答（60 秒版）

Express 和 Koa 都用中间件组织请求处理，但 `next` 的约定不同。

Express 调用 `next()`，把处理交给后面的中间件。它不是一个代表整条下游完成的 Promise，不能把 `await next()` 当作 Koa 的等待语义。需要响应完成后的统计时，应使用响应生命周期事件等合适的机制。

Koa 的中间件通常用 `await next()` 等待下游。请求按注册顺序进入，下游结束后再反向回到前面的中间件，所以形成洋葱结构。外层可以在前后做计时，也可以通过 try/catch 捕获被正确等待的下游异常。

实际写代码时，要检查有没有漏掉 await 或 return，以及鉴权、异常处理和响应提交的顺序。

![Express 继续处理与 Koa 等待下游反向返回的中间件区别](https://note.lgdsunday.club/img/Q160/00-60s-overview.webp)

## 知识点详解：把进入、等待和返回三件事分开看

### Koa 的洋葱不是一句「先进后出」

假设有三个中间件 A、B、C，A 和 B 都在 `await next()` 的前后打印日志，C 直接生成响应。那么执行次序是 A 前、B 前、C、B 后、A 后。

A 并不是执行完就消失了。它把后续处理交出去，同时等待那条 Promise 链完成。B 也是一样。到 C 不再继续调用 next，结果才一路返回。

所以外层可以记录开始时间，等待下游后再计算耗时。它测到的是被等待的处理过程，不等于客户端已完整收到响应；网络发送与连接结束另有生命周期。

### Express 的 next，不承诺整条下游已经结束

Express 的 next 用来继续路由或传递错误。调用以后，当前函数后面的同步代码仍然可以运行；如果后面的处理遇到异步等待，它不会让这个 next 自动变成下游完成通知。

因此，不能把 Koa 的 `await next()` 原样搬到 Express。要统计实际响应结束，可以监听 `finish`，还要考虑 `close` 等提前断开的情况；如果只是等待自己的异步操作，就等待该操作本身。

Express 5 能把返回的 Promise 拒绝交给错误处理流程，但这也没有改变 next 的上述约定。异常自动转交与洋葱式等待，是两回事。

### 用两段小代码理解等待链

下面只演示「等待内层完成，再返回外层」这个通用原理，不是完整 Koa 或 Python Web 框架的实现。

**TypeScript：**

```ts
async function outer(next: () => Promise<void>) {
  console.log("外层进入");
  await next();
  console.log("外层返回");
}
await outer(async () => {
  await Promise.resolve();
  console.log("内层处理");
});
```

**Python：**

```python
import asyncio

async def outer(next_step):
    print("外层进入")
    await next_step()
    print("外层返回")

async def inner():
    await asyncio.sleep(0)
    print("内层处理")

asyncio.run(outer(inner))
```

两段都按外层进入、内层处理、外层返回输出。Python 例子只是相同等待结构，不是给 Koa 换一个语言后缀。

### 漏掉 await，会破坏你以为存在的顺序

如果 Koa 外层调用 next 后既不 await，也不 return，外层可能提前结束，计时和响应修改也会提前发生。下游的拒绝还可能脱离外层 try/catch 的范围。

鉴权中间件也不能无条件继续：发现没有权限后，应明确终止并设置响应，避免下游仍然执行写操作。异常中间件则通常放在能包住后续处理的位置。

测试时不要只用同步路由。让下游延迟后成功、延迟后抛错，再模拟客户端断开，分别检查执行日志、状态码和是否重复写响应。

本题机制参考：[Koa 官方文档](https://koajs.com/)、[Express 中间件指南](https://expressjs.com/en/guide/using-middleware/)、[Express 错误处理](https://expressjs.com/en/guide/error-handling.html)。

## 面试官继续追问

### Koa 不调用 next，会怎样？

当前中间件不再继续进入后面的处理。它需要自己完成响应或明确的终止行为，不是每个中间件都必须调用 next。

### 外层 try/catch 能捕获任意异步任务吗？

不能。它能捕获这条被 await 的下游链上的异常。脱离链路的定时器、后台任务或未等待 Promise，需自己安排异常处理。

### Express 5 支持 async，是不是就变成洋葱了？

不是。支持 async 返回值的异常转交，不等于 next 变成下游完成 Promise。框架 API 约定仍然不同。

## 面试速记卡

> - Express next：继续处理或转交错误，不是下游完成 Promise。
> - Koa await next：进入下游，再等待返回。
> - 洋葱顺序：A 前 → B 前 → 内层 → B 后 → A 后。
> - 异常捕获依赖正确等待，响应完成还要看生命周期。

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
