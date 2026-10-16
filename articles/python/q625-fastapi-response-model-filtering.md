# FastAPI 的 response_model 有什么作用？返回对象为什么会少字段？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/python/q625-fastapi-response-model-filtering/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：response\_model 为什么会让返回字段变少？

🙋‍♂️ 我：FastAPI 会按声明的输出模型处理结果，只保留相应字段。

🧑‍💻 面试官：那么我返回一个含 secret 的 JSONResponse，它也会自动删掉 secret 吗？

🙋‍♂️ 我：直接返回 Response 会走不同路径，不能依赖同一过滤保证。

🧑‍💻 面试官：那权限检查和字段过滤谁负责？输出模型不符合，应该让客户端改请求吗？

> 输出模型管理返回合同，但直接 Response、权限和敏感字段仍要单独守住。

## 面试速答（60 秒版）

FastAPI 的 response\_model 用来定义响应结构，参与输出校验、序列化和字段过滤，也会进入接口文档。返回内部对象包含额外字段时，正常模型路径会按公开模型处理，所以看到的字段可能变少。

请求模型和响应模型最好按各自用途设计。例如内部用户对象有密码摘要，公开响应只声明 ID 和用户名，避免直接把内部数据作为 API 合同。

不过直接返回 Response 或 JSONResponse，会绕过通常的响应模型处理，内容需要调用方自己保证。字段过滤也不是权限校验，某个用户能不能读取这条记录，仍要在业务层判断。

返回值违反输出模型，属于服务端合同错误，不能当成默认的请求 422。测试既要断言应该出现的字段，也要断言敏感字段确实没有出现。

![内部数据，经过公开模型再返回](https://note.lgdsunday.club/img/Q625/01-overview.webp)

## 知识点详解：内部对象，怎样变成公开响应

### 先分清内部存什么，外部能看什么

假设服务查询到一个用户对象，里面既有昵称，也有密码摘要和内部备注。数据库需要这些字段，不代表浏览器需要看到它们。

公开模型可以只定义 id 与 name。正常返回值交给 FastAPI 以后，响应处理按这个合同校验并生成对外内容。少字段在这里可能是设计结果，不一定是数据库没有查询出来。

但公开模型同样可能写错。如果把敏感字段也声明进去，框架不会判断它不应该公开。因此字段允许名单需要我们自己定义。

### 观察正常模型路径的过滤

下面代码可直接保存并运行，当前测试环境为 FastAPI 0.143.0、Starlette 1.8.0，TestClient 使用 httpx2；较旧版本的依赖要求以对应文档为准。

#### Python

```python
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import BaseModel

app = FastAPI()
class PublicUser(BaseModel):
    id: int
    name: str

@app.get("/user", response_model=PublicUser)
def read_user():
    return {"id": 1, "name": "小周", "password_hash": "仅教学占位"}

with TestClient(app) as client:
    response = client.get("/user")
    assert response.status_code == 200
    assert response.json() == {"id": 1, "name": "小周"}
    assert "password_hash" not in response.json()
```

例子特意返回字典来观察输出合同。生产代码仍应明确数据读取与权限，不要因为最后可能过滤，就让敏感字段在日志和其他路径里到处传。

这属于 FastAPI 的 Python 框架机制，没有官方同名 TS response\_model。TS 类型注解在运行时不会自动删字段，其他框架需要自己的序列化或校验实现。

### 直接返回 Response，责任又回到你手里

返回 JSONResponse 等 Response 对象时，FastAPI 不会再按通常的模型路径重新过滤内容。它适合需要明确控制响应体、状态和头的情况，但也意味着要自己完成输出合同。

如果在这种路径里把内部字典直接放进去，声明了 response\_model 也不能当作敏感字段的保险。文档写公开模型，与真实响应有没有遵守，是两个需要一起验证的事实。

另外，response\_model\_exclude 等参数可以改变实际输出，文档与客户端生成代码是否仍能正确表达，也要检查。长期稳定 API 更适合清楚的专属公开模型。

![直接 Response，绕开通常模型处理](https://note.lgdsunday.club/img/Q625/02-bypass.webp)

### 输出校验失败，应当回到服务代码

返回的必填字段缺失，或者值无法满足输出模型，说明服务内部产生的结果不符合承诺。默认不应该包装成“你传错参数了”。

测试要检查正常响应、缺失必填值的失败行为，以及直接 Response 的路径。权限失败另外测，避免把“输出没有密码”误认为“用户只能看到自己的记录”。

依据：[FastAPI 响应模型与字段过滤](https://fastapi.tiangolo.com/tutorial/response-model/)、[直接返回 Response](https://fastapi.tiangolo.com/advanced/response-directly/)。

![测应该有的，也测不能有的](https://note.lgdsunday.club/img/Q625/03-tests-v2.webp)

## 面试官继续追问

### 过滤了 password\_hash，就完成权限控制了吗？

没有。记录是否属于当前用户，必须在访问和业务判断中检查。

### JSONResponse 也会自动按模型删字段吗？

直接 Response 路径不应依赖通常的模型过滤，需要自己构造安全内容。

### 少字段一定是 bug 吗？

先对照公开模型与排除设置；符合响应合同的过滤可能正是预期。

## 面试速记卡

> - response\_model 定义公开输出合同。
> - 正常路径参与校验、序列化与字段过滤。
> - 内部对象不直接等于外部 API 数据。
> - 直接 Response 的内容需要自己保证。
> - 输出校验、敏感字段与权限分别测试。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
