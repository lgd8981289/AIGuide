# Python 的 Mock、patch 和 AsyncMock 怎么用？为什么 patch 了却没生效？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/python/q617-python-mock-patch-asyncmock/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：Mock、patch 和 AsyncMock 分别干什么？

🙋‍♂️ 我：Mock 可以代替依赖，patch 临时替换名字，AsyncMock 用于异步依赖。

🧑‍💻 面试官：service.py 用 from client import fetch 导入函数。我 patch client.fetch，为什么测试还在调用原函数？

🙋‍♂️ 我：service 已经保存了自己的 fetch 引用，调用时不再去 client 里取。

🧑‍💻 面试官：那该替换哪个名字？如果只调用了异步替身却没有 await，assert\_called 能发现这个错误吗？

> 替身要放在代码实际查找依赖的位置；异步测试还要区分“调用过”与“等待过”。

## 面试速答（60 秒版）

Mock 用来模拟依赖的返回、异常和调用记录；patch 则在指定范围临时替换一个名字，退出后恢复。两者可以配合，但不是同一件事。

patch 没生效时，需要看被测代码到哪里找这个函数。用了 from client import fetch，通常要替换 service.fetch；用了 import client，再调用 client.fetch，则查找路径不同。

异步函数用 AsyncMock，除了检查参数，还要检查是否真的 await。assert\_called 只能证明发生过调用，不能证明协程被执行到了等待点。

替身应该帮助隔离网络等外部依赖，不能把要测试的业务判断也替掉。autospec 可以约束调用签名，但真实接口是否正确，仍需要集成测试。

![替身放到正在查找的入口](https://note.lgdsunday.club/img/Q617/01-overview-v2.webp)

## 知识点详解：替换依赖时，先找到正在被使用的名字

### Mock 负责模拟，patch 负责临时替换

假设一个服务查询商品信息，再给结果加上展示字段。单元测试不需要每次访问远程接口，可以让替身返回固定商品，也可以让它抛超时异常，检查服务怎样处理。

Mock 会记录参数和调用次数，也允许配置 return\_value 与 side\_effect。patch 负责把依赖入口临时换成这个替身。替身直接作为函数参数传进去，也能完成测试，并不一定要 patch。

不要把 Mock 默认生成的各种属性误当成真实接口。它太宽松时，拼错方法名也可能得到另一个 Mock。spec\_set 限制可访问或设置的属性，autospec 进一步按真实对象生成调用签名约束，但都不会替我们证明远程服务真的遵守合同。

### 定义在 client，查找却发生在 service

下面把三段分别保存成 client.py、service.py、test\_service.py，再运行 pytest。

#### Python

```python
# client.py
def fetch(item_id):
    raise RuntimeError("本例不访问真实接口")
```

#### Python

```python
# service.py
from client import fetch

def get_name(item_id):
    return fetch(item_id)["name"]
```

#### Python

```python
# test_service.py
from unittest.mock import patch
import service

def test_get_name():
    with patch("service.fetch", autospec=True) as fake:
        fake.return_value = {"name": "键盘"}
        assert service.get_name("A") == "键盘"
        fake.assert_called_once_with("A")
```

service 导入后，它的 fetch 名字已经指向原函数。此时改 client.fetch，并不会自动改掉 service.fetch。因此替换位置看使用方的查找过程，不能只看函数在哪个文件定义。

如果 service 写的是 import client，然后调用 client.fetch，那么它会从 client 模块取属性。判断要跟着实际代码走，不能把“永远 patch 使用方函数名”背成没有条件的口诀。

![改了定义处，不一定改到使用处](https://note.lgdsunday.club/img/Q617/02-namespace.webp)

### 异步替身，必须检查等待行为

调用 AsyncMock 会得到可等待对象。只有 await 以后，配置的异步返回值才进入后续逻辑。

#### Python

```python
import asyncio
from unittest.mock import AsyncMock

async def main():
    fetch = AsyncMock(return_value={"name": "键盘"})
    result = await fetch("A")
    assert result["name"] == "键盘"
    fetch.assert_awaited_once_with("A")

asyncio.run(main())
```

assert\_called 检查调用；assert\_awaited 检查等待。这两个动作在异步程序里可能分开发生。测试只看 called 为真，就可能漏掉忘记 await 的错误。

![调用过和等待过，是两条记录](https://note.lgdsunday.club/img/Q617/03-await.webp)

### 能注入依赖时，不必依赖修改模块

#### TypeScript（显式注入依赖的行为对照）

```typescript
import assert from "node:assert/strict";
type Fetch = (id: string) => Promise<{ name: string }>;
async function getName(id: string, fetch: Fetch) {
  return (await fetch(id)).name;
}
const calls: string[] = [];
const fake: Fetch = async id => {
  calls.push(id);
  return { name: "键盘" };
};
async function main() {
  assert.equal(await getName("A", fake), "键盘");
  assert.deepEqual(calls, ["A"]);
}
void main();
```

这是依赖注入对照，没有假装 TS 提供 unittest.mock.patch。Python 同样可以设计显式参数，让测试不必猜模块引用。

最后还要保留少量真实依赖测试。例如远程字段改名，替身仍返回旧结构，单元测试会继续通过。Mock 验证的是我们设定的合同，不会主动发现外部系统已经变了。

依据：[unittest.mock 与替换位置](https://docs.python.org/3.11/library/unittest.mock.html#where-to-patch)、[AsyncMock](https://docs.python.org/3.11/library/unittest.mock.html#unittest.mock.AsyncMock)。

![替身合同，还要和真实接口对齐](https://note.lgdsunday.club/img/Q617/04-coverage.webp)

## 面试官继续追问

### patch 为什么最好限制在 with 或测试范围？

避免临时替换污染其他用例。需要手动 start 的 patcher，也要明确安排 stop。

### autospec 能替代集成测试吗？

它能帮助发现签名不匹配，不能验证真实网络响应、权限和错误行为。

### 把 get\_name 也 Mock 掉，能测它的处理逻辑吗？

被替换的逻辑没有执行。测试对象与隔离依赖应分开。

## 面试速记卡

> - Mock 模拟结果、异常和调用记录。
> - patch 临时替换名字，按实际查找位置选目标。
> - from import 保存的引用，不随原模块属性替换自动变化。
> - AsyncMock 要同时考虑调用和 await。
> - 单元替身隔离依赖，真实合同仍需要集成验证。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
