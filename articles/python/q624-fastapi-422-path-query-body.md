# FastAPI 为什么返回 422？Path、Query 和 Body 参数是怎么区分的？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/python/q624-fastapi-422-path-query-body/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：FastAPI 为什么返回 422？

🙋‍♂️ 我：请求里的参数不符合接口声明，默认会给请求校验错误。

🧑‍💻 面试官：函数参数叫 quantity，我放进 JSON 里却仍提示 query 缺失，为什么？

🙋‍♂️ 我：参数名相同不代表来源相同，它可能声明成了查询参数。

🧑‍💻 面试官：那怎么从错误里的 loc 定位？一个 Body 参数和多个 Body 参数，JSON 形状又有什么差别？

> 先确认数据应该从哪里读取，再检查那个位置里的值和形状；只改字段值，可能一直修错地方。

## 面试速答（60 秒版）

FastAPI 默认的 422 常见于请求校验失败。先看响应 detail 中的 loc，确认问题出在 path、query 还是 body，再看是缺失、类型错误或约束不满足。

路径中声明的参数来自 Path，普通标量通常按 Query 处理，Pydantic 模型通常来自 Body；也可以用 Annotated 与 Path、Query、Body 把来源写明确。把同名字段发到另一个位置，不能满足原位置的要求。

请求体还要看整体形状。单个模型 body 默认直接接收模型结构；多个 body 参数或 embed 设置会改变外层结构。

因此排错时对照 OpenAPI、实际 URL、Content-Type 和 JSON 内容。422 是请求合同问题，不应统一改成返回 200 来掩盖，也不要与服务输出模型失败混淆。

![名字、位置、形状，都要对应](https://note.lgdsunday.club/img/Q624/01-overview-v4.webp)

## 知识点详解：字段名字对了，位置也要对

### 从 loc 找到该改哪份输入

假设一个接口路径是 /items/{item\_id}，查询参数是 quantity，JSON 请求体是商品信息。它们都进入同一个处理函数，但来自不同地方。

错误 loc 的第一段通常指出来源，例如 query 后跟 quantity，表示去检查 URL 查询参数。body 后面的字段路径，则提示请求体结构。数组与嵌套模型还可能有更深的位置。

先看这个定位，再看缺失或类型错误。服务校验返回 422 时，反复调整 JSON 中的 quantity，可能根本没有触及被要求的 query.quantity。

### 用显式来源，把接口合同写在一起

下面是完整可导入的 FastAPI 示例。

#### Python

```python
from typing import Annotated
from fastapi import FastAPI, Path, Query
from pydantic import BaseModel

app = FastAPI()
class Item(BaseModel):
    name: str

@app.post("/items/{item_id}")
def create_item(
    item_id: Annotated[int, Path(gt=0)],
    quantity: Annotated[int, Query(gt=0)],
    item: Item,
):
    return {"id": item_id, "quantity": quantity, "name": item.name}
```

正确请求可以是 POST /items/1?quantity=3，JSON 为 {"name":"键盘"}。quantity 没有默认值，所以必填；传到 body 里不能代替查询参数。

下面保存为同一文件后继续执行，当前测试环境为 FastAPI 0.143.0、Starlette 1.8.0，TestClient 使用 httpx2；较旧版本的依赖要求以对应文档为准。

#### Python

```python
from fastapi.testclient import TestClient
client = TestClient(app)
response = client.post("/items/1?quantity=3", json={"name": "键盘"})
assert response.status_code == 200
bad = client.post("/items/1", json={"name": "键盘", "quantity": 3})
assert bad.status_code == 422
assert bad.json()["detail"][0]["loc"] == ["query", "quantity"]
```

这是 FastAPI 的 Python API，没有同名 TS 实现。前端可按实际 HTTP 合同请求它，但不能把 TS 类型当作服务端来源声明。

![JSON 中有 quantity，查询参数仍可能缺失](https://note.lgdsunday.club/img/Q624/02-locations-v2.webp)

### Body 是整个模型，还是外面再套一层

只有一个模型参数时，默认请求体直接是该模型结构。模型 Item 有 name，那么发 {"name":"键盘"}，通常不需要再写一层 item。

如果采用 Body(embed=True)，或者有多个独立 body 参数，接口会要求相应的外层对象结构。此时发同一份扁平 JSON，仍可能提示缺少 item。

所以不能只问“字段是否存在”。还要问它位于哪一层。最终以当前接口生成的 OpenAPI 和声明为准；修改嵌套形状也属于接口合同变化，要同步调用方。

![一份模型，是否需要外层包装？](https://note.lgdsunday.club/img/Q624/03-shape-v2.webp)

### 请求校验失败，与输出错误分开查

请求 JSON 解析失败、必填值缺失或类型不符，都可能进入请求校验错误；其他状态码还有路由、权限等原因。不能看到所有 4xx 都认定是 Pydantic。

返回值违反 response\_model 则是服务端输出错误，不应让客户端承担“输入错误”的责任。日志要能区分两个方向，同时避免把含敏感输入的错误原样公开。

验证至少覆盖正确位置、错位置、缺字段、非法范围和不符合嵌套形状的输入。比起统一捕获后返回成功，这些用例能真正让合同稳定。

依据：[FastAPI 请求体与参数来源](https://fastapi.tiangolo.com/tutorial/body/)、[多个 Body 参数](https://fastapi.tiangolo.com/tutorial/body-multiple-params/)、[请求校验异常](https://fastapi.tiangolo.com/tutorial/handling-errors/)。

![输入不合格，和输出不合格分开查](https://note.lgdsunday.club/img/Q624/04-directions-v3.webp)

## 面试官继续追问

### 字段同名，Query 和 Body 会自动互相补吗？

不会按同名自动替换来源，必须满足声明位置。

### 单模型为什么不一定需要 item 包装？

默认直接接收模型结构；embed 或多个 body 参数会改变外层合同。

### 可以把 422 全改成 200 吗？

可自定义错误表示，但不能假装成功。调用方仍需要明确知道输入被拒绝。

## 面试速记卡

> - 先看 detail.loc，再看错误原因。
> - Path、Query、Body 对应不同输入位置。
> - 同名字段发错位置，仍可能缺失。
> - 单模型、embed 和多个 body 参数有不同形状。
> - 请求校验与响应模型错误分开处理。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
