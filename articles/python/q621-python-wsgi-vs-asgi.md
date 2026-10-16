# Python 的 WSGI 和 ASGI 有什么区别？为什么支持 async 不等于换成了 ASGI？

[字节后端面试真题](../companies/bytedance-backend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/python/q621-python-wsgi-vs-asgi/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：WSGI 和 ASGI 的区别是什么？

🙋‍♂️ 我：WSGI 常见于同步 Web 应用，ASGI 支持异步消息接口。

🧑‍💻 面试官：Flask 的视图写成 async def，就能直接处理 WebSocket 了吗？

🙋‍♂️ 我：还要看服务器与应用之间使用的协议，函数语法不够。

🧑‍💻 面试官：那一次 HTTP 请求和一条长期 WebSocket 连接，在 ASGI 中各活多久？

> 看服务器怎样调用应用、怎样交付消息，才知道使用什么协议；一个 async 关键字改变不了整条接入链路。

## 面试速答（60 秒版）

WSGI 和 ASGI 都规定 Python Web 服务器怎样和应用交互。它们是接口规范，不是具体框架。

WSGI 主要围绕 HTTP 请求响应，服务器把 environ 和 start\_response 交给应用，应用返回响应字节的可迭代结果。ASGI 则提供 scope、receive 和 send，把输入输出组织成可等待的消息。

因此 ASGI 更适合承载 WebSocket 等持续双向交互，也能处理普通 HTTP。HTTP scope 通常对应一次请求，WebSocket scope 则覆盖连接生命周期，不能把它们都等同于 TCP 连接。

框架支持 async 视图，不代表整套部署已经改成 ASGI。选型还要看服务器、框架与实际依赖是否匹配，异步链路中仍要避免阻塞操作。

![服务器与应用，使用哪种接口？](https://note.lgdsunday.club/img/Q621/01-overview.webp)

## 知识点详解：从一次请求，看服务器与应用怎么配合

### 规范负责衔接，框架负责应用功能

假设浏览器请求一个商品页面。服务器接收网络数据，解析请求，再把它交给 Python 应用。应用处理业务，服务器把响应送回浏览器。

这两边怎么传参数、怎么返回内容，需要有共同约定。WSGI 与 ASGI 就负责这层接口。路由、数据库、模板等能力通常由框架和应用提供，不能把规范当成框架功能清单。

ASGI 应用也可以包含同步代码。规范提供异步友好的接口，不会自动让数据库查询或文件读写都变成非阻塞。

### WSGI 的入口，围绕请求与响应

下面是最小 WSGI 应用，可以直接用测试函数观察输出。

#### Python

```python
def app(environ, start_response):
    body = b"ok"
    start_response("200 OK", [("Content-Type", "text/plain")])
    return [body]

seen = []
output = app({}, lambda status, headers: seen.append(status))
assert b"".join(output) == b"ok"
assert seen == ["200 OK"]
```

environ 提供请求环境，start\_response 交出状态和响应头，返回值提供响应字节。真实请求输入与服务器责任远比这个测试完整，本例只演示调用形状。

可迭代结果允许响应逐段提供，所以不能说 WSGI 连流式 HTTP 都做不了。它的核心限制在请求响应接口模型，不能直接拿这套标准表达 WebSocket 的持续双向消息。

### ASGI 把连接信息和消息拆开

scope 保存当前协议交互的基本信息，receive 获取后续输入消息，send 发送输出消息。下面是只支持 HTTP 的最小片段，不处理请求体，也没有 lifespan 和 WebSocket。

#### Python

```python
async def app(scope, receive, send):
    if scope["type"] != "http":
        raise RuntimeError("本例只支持 HTTP")
    await send({"type": "http.response.start", "status": 200,
                "headers": [(b"content-type", b"text/plain")]})
    await send({"type": "http.response.body", "body": b"ok"})
```

HTTP 下，scope 生命周期对应一次请求，不是整条复用的 TCP 连接。WebSocket 则要接收连接、消息和断开等事件，scope 会活到连接结束。

所以 ASGI 不能只解释成“异步版 WSGI”。消息格式和交互生命周期也发生了变化。它们是 Python 生态协议，没有同名 TS 官方实现；Node 自己的 HTTP/WebSocket API 不能机械改名代替。

![同一连接，可能包含多次 HTTP scope](https://note.lgdsunday.club/img/Q621/02-scope-v2.webp)

### 换协议以后，还要检查整条链路

一个 WSGI 框架允许 async 视图，可能是通过适配让该视图运行，并没有因此改变服务器入口。具体并发能力应看框架适配与 worker 模型。

换成 ASGI 以后，阻塞式网络调用仍可能卡住事件循环。验证时检查目标协议真的能接入、依赖调用是否阻塞、断开与清理是否处理，最后才测目标负载下的性能。

依据：[WSGI 规范](https://peps.python.org/pep-3333/)、[ASGI 主规范](https://asgi.readthedocs.io/en/latest/specs/main.html)、[HTTP 与 WebSocket scope](https://asgi.readthedocs.io/en/latest/specs/www.html)、[Flask async 适配边界](https://flask.palletsprojects.com/en/stable/async-await/)。

![async 视图，不会自动替换服务器入口](https://note.lgdsunday.club/img/Q621/03-adapter-v2.webp)

## 面试官继续追问

### WSGI 能不能流式返回 HTTP？

可以返回可迭代响应字节。流式 HTTP 与 WebSocket 双向消息不是同一能力。

### HTTP keep-alive 一条连接只有一个 scope 吗？

不能这样推断。ASGI HTTP scope 通常按单次请求划分。

### ASGI 一定比 WSGI 快吗？

不能脱离负载、依赖与部署比较。阻塞工作和 CPU 密集任务都需要单独处理。

## 面试速记卡

> - WSGI/ASGI 是服务器与应用的接口规范。
> - WSGI 使用 environ、start\_response 和响应迭代结果。
> - ASGI 使用 scope、receive、send 和事件消息。
> - HTTP 请求与 WebSocket 连接的 scope 生命周期不同。
> - async 语法、部署协议和非阻塞依赖需要分别确认。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **字节跳动 · Python后端 · 社招**：Flask 与 WSGI 如何交互？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353156424916213760)；原帖编辑于 2020-05-11；标题中的 2019 届是毕业届次。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
