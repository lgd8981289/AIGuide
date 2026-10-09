# FastAPI 的 def 和 async def 有什么区别？线程池和事件循环如何配合？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q479-fastapi-def-async-def/) · [题库目录](../../README.md)

*以下对话为教学模拟，不是真实面经。*

🧑‍💻 面试官：FastAPI 路由用 def 还是 async def？

🙋‍♂️ 我：async def 可以并发，应该优先使用。

🧑‍💻 面试官：里面调用的是同步数据库驱动呢？普通 def 工具函数，被 async 路由直接调用，也会自动进线程池吗？

> 关键不是函数名字里有没有 async，而是阻塞工作到底在哪个线程执行。

## 面试速答（60 秒版）

FastAPI 对两种路由的执行方式不同。普通 def 路由通常交给线程池执行，async def 路由则在事件循环中运行，适合等待真正支持异步的调用。

如果 async 路由直接执行同步阻塞操作，就会占住事件循环，影响其他请求。把同步函数写在普通 helper 里，也不会因为被 FastAPI 路由调用就自动卸载到线程池。

所以，使用同步阻塞库时，可以采用同步路由，或明确把阻塞部分交给线程池；使用异步库时，采用 async 路由并 await 对应操作。

线程池也有容量限制，CPU 密集任务又需要另外评估。不能把 def 或 async def 当成所有场景都更快的答案。

![速答总览：FastAPI 按入口决定同步卸载，普通 helper 仍按调用位置执行；async 不会自动消除阻塞。](https://note.lgdsunday.club/img/Q479/01-overview-v2.webp)

## 知识点详解：请求进入以后，哪些代码在事件循环里

### FastAPI 会特殊处理路由和依赖

[FastAPI 的异步说明](https://fastapi.tiangolo.com/async/)明确区分同步路由、异步路由以及依赖的调用方式。

普通 def 路由不会简单地在事件循环中直接执行，而是由相应线程池机制处理。同步依赖也有对应处理。这样可以让等待同步 I/O 的工作不直接阻塞事件循环。

但这只是框架管理的入口。你在函数内部直接调用的普通工具函数，并不会仅因为它是 def，就被框架重新安排到线程池。

### helper 调用，仍然在当前调用位置执行

咱们假设路由需要调用一个只有同步接口的数据库客户端。把查询写进 helper，再从 async 路由直接调用，阻塞行为仍然存在。

#### Python：显式卸载同步工作

```python
from fastapi import FastAPI
from starlette.concurrency import run_in_threadpool

app = FastAPI()

def legacy_query():
    # 教学占位：这里代表同步阻塞库调用
    return {"status": "ok"}

@app.get("/status")
async def status():
    result = await run_in_threadpool(legacy_query)
    return result
```

示例中的 legacy\_query 没有真正访问数据库，只展示执行边界。实际库还要确认线程安全、连接管理和超时。

另一种选择是把整个路由写成 def，让框架按同步路由处理。如果只有少量阻塞步骤，显式卸载能让边界更清楚；如果整个处理都依赖同步库，同步路由可能更直接。

### await 需要等待真正的异步操作

把函数声明成 async，不会把所有内部代码自动变成非阻塞。执行普通计算、time.sleep 或同步网络调用时，仍然可能占住事件循环。

反过来，异步数据库、异步 HTTP 客户端等操作，能在等待期间把执行机会交还给事件循环。但要确保使用的是实际异步接口，而不是同名同步函数。

TypeScript 的常见 Node Web 框架没有 FastAPI 的同一套 def 路由自动线程池协议。下面只展示异步 I/O 写法，不把两边的执行模型硬套在一起。

#### TypeScript：Node 中等待异步请求

```typescript
async function loadStatus(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("HTTP " + response.status);
  return await response.json();
}
```

Node 中执行同步阻塞工作也可能影响事件循环，需要独立选择 Worker、进程或其他机制，不能认为普通函数会自动进线程池。

![同一阻塞工作在事件循环与线程池的影响](https://note.lgdsunday.club/img/Q479/02-event-loop-blocking.webp)

### 线程池容量，也会成为瓶颈

[Starlette 的线程池说明](https://starlette.dev/threadpool/)介绍了 AnyIO 的线程限制器，以及默认可用 token 的限制。当前文档给出的默认值是 40，而且部分同步功能会共享这项资源；部署时仍需核对实际版本和配置。

当很多同步查询同时等待，事件循环可能没有被直接堵住，但请求会在有限的线程资源前排队。增加上限又可能压垮数据库连接或外部服务。

因此，需要同时看线程等待、连接池、接口延迟和超时。CPU 密集工作也不能仅靠更多线程解决，尤其要结合 Python 解释器、扩展库及实际并行方式判断。

![同步入口共享有限线程资源](https://note.lgdsunday.club/img/Q479/03-shared-thread-limiter.webp)

## 面试官继续追问

### 同步路由可以并发处理吗？

可以通过线程池等方式处理多个请求，所以 def 不等于整个服务只能串行。但容量和阻塞时间仍然有限。

### 把所有代码放进线程池安全吗？

不一定。库可能不是线程安全的，数据库连接也可能有使用约束。需要检查资源生命周期，不能只解决事件循环阻塞。

### 为什么 async 路由里普通计算也要注意？

计算在 await 之间仍然同步执行。长时间 CPU 工作可能阻止事件循环处理其他任务，需要额外安排执行方式。

## 面试速记卡

> - def 路由：通常由框架交给线程池。
> - async 路由：在事件循环中执行，等待真正异步操作。
> - helper 边界：直接调用普通函数，不会自动卸载。
> - 线程池限制：避免事件循环阻塞，不等于容量无限。
> - 选型依据：库的实际执行方式和资源约束。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
