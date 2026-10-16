# Python 的 asyncio.timeout、wait_for 和 shield 有什么区别？超时后任务还会执行吗？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/python/q595-python-asyncio-timeout-wait-for-shield/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：asyncio.timeout、wait\_for 和 shield 都和超时有关，区别是什么？

🙋‍♂️ 我：timeout 和 wait\_for 设置等待期限，shield 可以保护任务不被外层取消。

🧑‍💻 面试官：wait\_for 超时后，执行的协程会立即停止吗？

🙋‍♂️ 我：它会发起取消，协程还需要处理取消和清理。

🧑‍💻 面试官：如果外面套 shield，等待方收到超时以后，里面的任务由谁继续跟踪和收尾？

> 超时是等待期限，取消是向任务发出的请求。把被取消的是谁、谁还在运行说清楚，才能解释这三个 API。

## 面试速答（60 秒版）

asyncio.wait\_for 等待一个 awaitable，超时时通常取消它，并等待取消处理完成，因此实际耗时可能超过设置的 timeout。

asyncio.timeout 是 Python 3.11 的异步上下文管理器。它给当前任务的一段等待代码设置期限，超时时取消当前任务，并在上下文退出时把它处理成 TimeoutError；通常在 with 外捕获这个错误。

shield 则隔开等待方的取消传播。外层等待被取消，受保护任务仍可能继续；但外层本身仍能收到取消或超时，并不会因此得到成功结果。

所以用了 shield，就要保留任务引用，明确谁读取后续结果、谁处理异常和关闭资源。真正停止外部请求，还得看底层库是否支持取消，不能只凭一个 Python 超时异常作保证。

![超时和取消，先看作用到谁](https://note.lgdsunday.club/img/Q595/01-overview.webp)

## 知识点详解：等待期限到了，任务到底发生了什么

### 先把等待方和工作任务分开

假设一个请求要等待报告生成。等待方是处理用户请求的任务，工作方可能是另一个 Task。两者都能有自己的状态，不能把“用户不再等了”当成“报告已经停了”。

协程取消通常在可让出的等待点注入 CancelledError。工作代码可以执行 finally 清理，然后传播取消。它不是立即杀掉任意同步代码的指令；阻塞事件循环的计算也不会因为设置了一秒期限，就及时收到处理机会。

外部服务还可能已经接受请求甚至完成写入。本地停止等待，不提供外部操作自动回滚的保证。

### wait\_for 超时，会等待取消处理

wait\_for 是围绕一个 awaitable 的等待。超时后，它通常向这个等待对象发起取消，再等待相应处理完成。

如果工作协程正在 finally 中做异步清理，调用方可能在期限之后才拿到 TimeoutError。若工作代码压住取消或抛出其他错误，最后结果还需要按实际实现分析。

因此期限更像触发超时处理的时间，不是任何情况下精确返回的墙钟上限。真正的端到端响应期限，还要考虑资源清理和底层 I/O。

![期限到了，还要完成取消清理](https://note.lgdsunday.club/img/Q595/02-cleanup.webp)

### timeout 包住的是当前任务的代码范围

下面的工作函数会主动让出执行。第一段超时后进入外层 except；第二段用 shield 保留工作任务，等待方先超时，随后明确取回任务结果。

#### Python

```python
import asyncio

async def work():
    await asyncio.sleep(0.05)
    return "完成"

async def main():
    try:
        async with asyncio.timeout(0.01):
            await work()
    except TimeoutError:
        print("当前等待范围超时")

    task = asyncio.create_task(work())
    try:
        await asyncio.wait_for(asyncio.shield(task), timeout=0.01)
    except TimeoutError:
        print("不再等待，受保护任务仍可能运行")
    print(await task)  # 明确跟踪并读取最终结果

asyncio.run(main())
```

时间值只是演示触发逻辑，不是性能基准。生产中还要处理工作自身失败、请求关闭和应用退出。本题用一次明确的后续 await，展示受保护任务不能丢在后台不管。

![外面不再等，里面仍要有人接手](https://note.lgdsunday.club/img/Q595/03-shield.webp)

### shield 保护的是传播关系，不是所有取消

直接 task.cancel 仍然可以取消那个任务。任务自身异常也会照常存在，shield 不把失败变成成功，更不提供磁盘或网络操作的事务保障。

#### TypeScript（等待超时不自动取消的对照）

```typescript
async function work(): Promise<string> {
  return new Promise(resolve => setTimeout(() => resolve("完成"), 50));
}
async function main(): Promise<void> {
  const job = work();
  try {
    await Promise.race([
      job,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("等待超时")), 10))
    ]);
  } catch { console.log("等待超时"); }
  console.log(await job); // 原任务仍运行
}
void main();
```

Promise.race 不等于 Python 的取消传播机制。要取消 JS 外部请求，通常需要它实际支持 AbortSignal 等接口；这段只说明等待失败和任务停止不同。

验证超时设计时，用事件或可控假客户端观测任务是否取消、清理何时结束，以及 shield 后结果由谁消费。只检查捕获到 TimeoutError，还没覆盖最关键的资源寿命。

依据：[Python 3.11 asyncio.timeout、wait\_for 与 shield](https://docs.python.org/3.11/library/asyncio-task.html)、[PEP 654 中的取消处理背景](https://peps.python.org/pep-0654/)、[ECMAScript Promise.race](https://tc39.es/ecma262/#sec-promise.race)。

![本地超时，不代表外部操作撤回](https://note.lgdsunday.club/img/Q595/04-external.webp)

## 面试官继续追问

### shield 以后外层还能报取消吗？

能。它主要保护内部任务不因等待方取消而被一同取消，外层仍收到取消信号。

### 捕获 CancelledError 后可以继续返回吗？

需要明确为什么压住取消，并理解对调用者和结构化并发的影响。一般完成清理后继续传播，不能随手吞掉。

### timeout 能中断死循环计算吗？

它依赖事件循环调度和取消处理。一直不让出执行的同步计算，不能靠这个上下文及时中断。

## 面试速记卡

> - 超时触发处理，不等于任务立即停止。
> - wait\_for 通常取消等待对象并等待处理。
> - timeout 给当前任务的一段范围设期限。
> - shield 阻断部分外层取消传播，内部仍可能继续。
> - 受保护任务需要引用、结果消费和资源收尾。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
