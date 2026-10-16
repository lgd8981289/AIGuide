# FastAPI 的 lifespan 怎么管理资源？和 Depends 的 yield 有什么区别？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/python/q626-fastapi-lifespan-dependencies/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：lifespan 和 Depends 的 yield 有什么区别？

🙋‍♂️ 我：lifespan 管应用启动和关闭，yield 依赖管请求使用的资源。

🧑‍💻 面试官：连接池在每个请求都创建，数据库会不会很快吃不消？

🙋‍♂️ 我：可复用池通常应该放应用生命周期里，请求借用单次资源。

🧑‍💻 面试官：那四个 worker 只会建一份池吗？测试只调用端点，却没进入 lifespan，会发生什么？

> 先确定资源跟着应用进程，还是跟着一次请求；两种生命周期不能互相替代。

## 面试速答（60 秒版）

FastAPI lifespan 适合初始化和关闭应用级资源，比如可复用客户端、连接池或模型。yield 前准备资源，应用运行时使用，正常关闭后执行收尾。

Depends 的 yield 通常组织单次请求需要的资源，例如借出的会话或事务。池可以长期复用，请求资源仍然要按范围释放，不能把一份可变会话给所有请求共用。

多 worker 一般各自运行应用生命周期，所以应用级不等于全站只有一份。初始化成本、内存和连接上限都要按进程算。

测试也需要真正触发生命周期，例如使用 TestClient 上下文管理器。yield 依赖的精确退出时点与 FastAPI 版本、scope、流式响应有关，需要按实际配置核对，不能把它和整个应用关闭混为一谈。

![池长期复用，请求资源各自借还](https://note.lgdsunday.club/img/Q626/01-overview-v3.webp)

## 知识点详解：长时间复用的池，和每次借出的资源

### 资源有不同的使用期限

假设服务用一个 HTTP 客户端访问外部系统。每个请求都重新创建客户端，会反复准备连接；让所有请求共用同一份可变业务状态，又容易互相影响。

可以在应用启动时创建可复用客户端，关闭时释放。请求只使用它提供的能力，自己的输入、会话和业务状态仍然独立。

数据库也是类似区别。连接池是管理可借用连接的设施，一次请求借出的会话或事务具有更短的生命周期。能复用池，不代表可以跨请求共用同一会话。

### lifespan 把初始化和关闭放在一起

下面用真实 httpx.AsyncClient 观察生命周期，但不访问外部网络。

#### Python

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
import httpx

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with httpx.AsyncClient() as client:
        app.state.http = client
        yield

app = FastAPI(lifespan=lifespan)

@app.get("/ready")
def ready(request: Request):
    return {"client_open": not request.app.state.http.is_closed}
```

应用进入 lifespan 时创建客户端，yield 期间端点可以访问，退出 async with 时关闭。真实项目还要根据初始化失败和已获得资源安排清理，不能期待尚未到达的 yield 自动收尾。

配置 lifespan 后，不要再假设旧 startup/shutdown 事件一定会按另一套方式同时执行，按官方建议统一管理。该机制属于 Python/FastAPI，没有同名 TS 生命周期 API。

![先创建，运行期间使用，退出后关闭](https://note.lgdsunday.club/img/Q626/02-yield-v2.webp)

### 请求资源，在自己的依赖范围内释放

一次请求借出的资源，可以由 yield 依赖交给端点，再在对应退出阶段释放。复杂依赖图与异常路径见相关题 Q401，本题重点是范围差异。

对于流式响应，资源是否需要一直活到内容发送结束，会影响退出范围的选择。FastAPI 历史版本对 yield 退出时点有过调整，当前也有 scope 等机制，不能拿旧图给所有版本作保证。

同样，不要把请求资源直接传给可能晚于请求结束的后台工作。后台任务应获得自己需要的数据，并按自己的生命周期获取资源。

![应用级资源，仍然按进程创建](https://note.lgdsunday.club/img/Q626/03-workers.webp)

### 每个 worker 都要经过启动，测试也一样

多个 worker 通常各自建立客户端、池和缓存。某一个进程启动成功，不能证明其他进程都完成初始化。健康检查要针对实际服务实例。

测试里可以把前面的 app 和 lifespan 放到同一文件，再继续运行下面代码。

#### Python

```python
from fastapi.testclient import TestClient
with TestClient(app) as client:
    assert client.get("/ready").json() == {"client_open": True}
    held = app.state.http
assert held.is_closed
```

这能验证正常进入、使用与退出，不代表进程被强制杀死时也有相同清理保证。运行环境仍需要处理异常退出和资源回收。

依据：[FastAPI lifespan](https://fastapi.tiangolo.com/advanced/events/)、[yield 依赖与版本说明](https://fastapi.tiangolo.com/tutorial/dependencies/dependencies-with-yield/)、[测试生命周期](https://fastapi.tiangolo.com/advanced/testing-events/)、[HTTPX 客户端关闭](https://www.python-httpx.org/async/)。

![测试也要走进入与退出](https://note.lgdsunday.club/img/Q626/04-testing-v2.webp)

## 面试官继续追问

### 应用级客户端就是整个集群只有一份吗？

一般按进程实例创建，多 worker 与多副本需要分别计账。

### 请求结束后的后台任务能继续用同一会话吗？

不应依赖已经结束的请求资源，后台任务要有自己的获取与释放范围。

### 测试能调通端点，就代表启动正常吗？

测试可能没有触发生命周期。应明确进入 lifespan，断言初始化与关闭。

## 面试速记卡

> - lifespan 管应用实例启动与关闭。
> - yield 依赖管对应请求资源范围。
> - 长期复用的池与短期借出的会话要拆开。
> - 多 worker 通常各自初始化资源。
> - 精确退出时点按版本、scope 和响应方式核对。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
