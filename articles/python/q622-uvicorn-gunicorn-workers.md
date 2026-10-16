# Uvicorn 和 Gunicorn 有什么区别？Python 服务的 worker 数量怎么设置？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/python/q622-uvicorn-gunicorn-workers/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：Uvicorn 和 Gunicorn 有什么区别？

🙋‍♂️ 我：Uvicorn 可以运行 ASGI 应用，Gunicorn 主要提供服务进程管理与不同 worker 模型。

🧑‍💻 面试官：部署四个 worker，内存里的缓存和连接池会自动共享吗？

🙋‍♂️ 我：一般不会，它们属于各个进程，资源预算需要按实例算。

🧑‍💻 面试官：那 worker 数量按 CPU 核数套公式就行吗？如果每个进程都加载一个大模型呢？

> 先弄清 worker 运行什么协议、持有哪些资源，再决定开多少个进程。

## 面试速答（60 秒版）

Uvicorn 是 ASGI 服务器，也提供多进程运行方式。Gunicorn 是常见的 Python 服务部署工具，通过主进程和不同 worker 管理服务，运行 ASGI 应用时要配置相应 worker，不能直接套默认同步模式。

两者不要求必须一起用。可以使用 Uvicorn 的 workers，也可以在合适环境里用 Gunicorn 搭配专门的 ASGI worker，或者让容器平台管理实例。

worker 数量要同时考虑 CPU、内存、连接池和任务类型。多个进程通常各自初始化应用资源，一份模型或缓存可能变成多份；连接上限也会累加。

因此先给资源设预算，再用目标负载检查延迟、吞吐和错误。增多 worker 可能改善处理能力，也可能让数据库和内存先撑不住。

![协议入口与进程管理，分别确认](https://note.lgdsunday.club/img/Q622/01-overview.webp)

## 知识点详解：多开一个 worker，也多了一份资源账

### 服务器协议和进程管理，是两个判断

假设一个 FastAPI 服务准备部署。应用使用 ASGI 入口，需要能处理这一接口的服务器。Uvicorn 可以承担这层网络与协议服务。

Gunicorn 提供主进程管理 worker 的部署模式，不同 worker 的处理方式不同。它的默认同步 worker 不能因为应用叫 FastAPI，就自动把 ASGI 协议理解正确。

同时，Uvicorn 自己也能启动多个 worker。因此“Uvicorn 只管协议，Gunicorn 才能多进程”说得过于绝对。该使用哪种组合，还要看平台、进程管理和运维要求。

### 命令里的 worker 类，不能照搬旧教程

下面是 Uvicorn 的多进程配置示例，app.py 中需要已有 FastAPI 的 app 对象。

```bash
python -m uvicorn app:app --host 127.0.0.1 --port 8000 --workers 2
```

2 只是展示参数，不是推荐容量。开发热重载与 workers 的组合也有约束，不能把开发命令原样放到生产。

采用 Gunicorn 的环境，可以按 uvicorn-worker 包的文档配置 ASGI worker。

```bash
python -m pip install gunicorn uvicorn-worker
python -m gunicorn app:app -k uvicorn_worker.UvicornWorker --workers 2
```

不要把旧的 uvicorn.workers.UvicornWorker 当成后续默认教学方案；Uvicorn 文档已提示相应模块弃用并指向独立包。Gunicorn 面向 Unix 部署环境，不能把这条命令当作所有操作系统的通用方案。这些是 Python 部署工具，没有官方同名 TS API。

### 缓存、模型与连接池，先按进程看

假设每个 worker 在启动阶段创建一个客户端池和一份本地缓存。两个进程通常各有一套，不能靠其中一个进程修改字典通知另一个。

如果每个连接池允许十条数据库连接，两个 worker 理论允许的池容量就是二十条；实际使用还受连接创建策略和数据库限制影响。多个部署副本要继续乘进去。

模型占用更需要注意。进程间内存行为与预加载、写时复制和运行库有关，不能直接承诺完全共享，更不能默认 GPU 内存只有一份。应测实际资源，而不是按模型文件大小粗略推算。

![进程增加，资源也要重新计账](https://note.lgdsunday.club/img/Q622/02-resources-v2.webp)

### 把 worker 数量放进真实负载里验证

I/O 等待多、CPU 工作多、长连接多，可能需要不同组合。增加进程有调度与内存开销，还可能扩大对数据库或远程 API 的压力。

先记录每进程资源和总预算，逐步调整数量，使用相同输入和并发模型检查尾延迟、错误、CPU、内存与连接数量。限流与任务队列也可能比继续加进程更有效。

进程重启时还要确认服务怎样停止接收、完成或取消在途任务，以及 readiness 何时变为可用。多进程配置能启动，不等于容量和退出行为已经验证。

依据：[Uvicorn 部署](https://www.uvicorn.org/deployment/)、[uvicorn-worker](https://github.com/Kludex/uvicorn-worker)、[Gunicorn 设计](https://gunicorn.org/design/)、[FastAPI 多 worker 与内存](https://fastapi.tiangolo.com/deployment/server-workers/)。

![加进程之前，看看谁先到上限](https://note.lgdsunday.club/img/Q622/03-capacity.webp)

## 面试官继续追问

### worker 越多，吞吐越高吗？

资源竞争、下游限额和内存开销都可能限制收益，需要同负载测量。

### 两个 worker 的普通字典会同步吗？

通常各进程独立，需要外部存储或明确通信，不能当共享状态使用。

### 一份模型开四个进程，有什么风险？

逐进程初始化可能重复占用内存、显存或连接，应按实际加载策略测资源预算。

## 面试速记卡

> - ASGI 应用要匹配能处理 ASGI 的服务入口。
> - Uvicorn 自带多 worker 方式，不必须搭配 Gunicorn。
> - Gunicorn 的 worker 类决定处理模式。
> - 多个进程的本地资源通常要分别计账。
> - 数量通过容量与资源测试确定，不盲套公式。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
