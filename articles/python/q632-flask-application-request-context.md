# Flask 的应用上下文和请求上下文有什么区别？为什么会报 Working outside of application context？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/python/q632-flask-application-request-context/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：应用上下文和请求上下文有什么区别？

🙋‍♂️ 我：current\_app 和 g 依赖应用上下文，request 和 session 依赖请求上下文。

🧑‍💻 面试官：脚本里 with app.app\_context() 后，可以直接读 request 吗？

🙋‍♂️ 我：不能，只有应用上下文不代表存在请求。

🧑‍💻 面试官：那 g 是整个服务共享的全局变量吗？新线程拿到 request 的代理，就能继续用原来的请求了吗？

> 代理名字可以一直导入，但它背后是否有当前对象，要看你正在什么上下文里。

## 面试速答（60 秒版）

Flask 的 current\_app、g、request 等名字通常是上下文代理。访问时，它们寻找当前执行上下文里的对象，不能只因为已经 import 就随处使用。

应用上下文提供当前应用及 g 等应用范围信息，请求上下文提供当前请求及 session。处理请求时通常会同时推入相应应用上下文，但手动进入 app\_context 并不会自动创建请求。

g 跟着当前应用上下文存在，不是所有请求永久共享的全局缓存。上下文结束会执行相应清理，后台线程和任务也不能默认继承原请求对象。

排错要确认代码运行位置与资源范围。脚本可按需要手动进入应用上下文；后台工作更适合接收明确的数据，并创建自己的资源范围，不把延长请求上下文当成长期任务方案。

![应用范围和请求范围，分别提供什么](https://note.lgdsunday.club/img/Q632/01-overview-v2.webp)

## 知识点详解：导入的代理，为什么有时找不到对象

### 同一个名字，运行时才找到当前对象

假设模块导入 current\_app，随后在请求里读取配置。这个名字没有直接固定成某一个 app，它会在当前上下文中找到相应应用。

因此导入通常没问题，真正访问属性时才可能出现 Working outside of application context。报错说明缺少对应运行范围，不是简单的模块没有安装。

request 也是类似代理，但依赖请求上下文。把代理保存到另一个线程，不等于把背后的当前请求和执行环境完整搬过去。

### 应用上下文，不自动附赠一个请求

下面是 Flask 3.1 的可运行例子。

#### Python

```python
from flask import Flask, current_app, g, request

app = Flask(__name__)
with app.app_context():
    assert current_app._get_current_object() is app
    g.task_id = "A"
    assert g.task_id == "A"
    try:
        _ = request.path
    except RuntimeError:
        pass
    else:
        raise AssertionError("这里没有请求上下文")

with app.app_context():
    assert not hasattr(g, "task_id")
```

第一个范围能访问应用与 g，但没有请求。退出以后再进入新的应用上下文，得到新的 g 范围，不会自动保留 A。

如果测试需要请求，可以用 test\_request\_context 等真实机制。不要为了压住异常到处套 app\_context，结果调用 request 仍然失败，或者把资源留得比任务更久。

![代理访问时，才寻找当前对象](https://note.lgdsunday.club/img/Q632/02-proxy.webp)

### 请求进入和退出，也带着应用范围

正常请求处理中，Flask 推入请求上下文；需要时同时推入应用上下文。结束时按相应顺序弹出，并运行 teardown\_request、teardown\_appcontext 等清理。

teardown 与 after\_request 不是同一职责。清理应考虑异常情况下的资源释放，不要把只有正常响应处理才需要的逻辑当成资源释放的唯一入口。

g 常用于同一上下文里暂存资源，例如首次使用时获得连接，退出时关闭。跨请求长期缓存应该放在明确的共享存储或应用资源中，并考虑并发和生命周期，不能只靠 g 这个字母像 global。

### 后台任务，传数据比传代理清楚

假设请求创建一项后台工作，后台真正执行时请求已经结束。此时传一个 request 代理让它读用户信息，可能没有对应上下文，也可能把本来应结束的资源和数据留住。

更清楚的安排是，在请求范围内提取已验证的必要字段和任务 ID，后台按自己的范围创建资源。如果确有上下文复制需求，按 Flask 官方机制确认边界，但复制也不解决事务共享、线程安全和长期资源管理。

这属于 Flask/Python 的框架机制，TS 请求对象与其他框架的上下文存储没有官方同名 API。验证脚本环境、正常请求、异常退出和后台入口，分别确认访问与清理范围。

依据：[Flask 应用上下文与 g](https://flask.palletsprojects.com/en/stable/appcontext/)、[请求上下文与清理](https://flask.palletsprojects.com/en/stable/reqcontext/)、[LocalProxy](https://werkzeug.palletsprojects.com/en/stable/local/)。

![请求结束以后，后台另建资源范围](https://note.lgdsunday.club/img/Q632/03-lifetime.webp)

## 面试官继续追问

### g 为什么不叫全局缓存？

它跟当前应用上下文的生命周期，不能当所有请求永久共享的存储。

### app\_context 能让 request.path 可用吗？

没有真实请求上下文时不能，需要对应请求范围。

### 后台任务复制上下文就万事大吉吗？

没有解决资源寿命、事务共享和线程安全，仍应明确数据与资源所有权。

## 面试速记卡

> - 导入代理，与存在当前对象是两件事。
> - current\_app/g 依赖应用上下文。
> - request/session 依赖请求上下文。
> - 手动 app\_context 不自动创建请求，g 也不跨所有请求共享。
> - 后台任务传必要数据，并管理自己的资源。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
