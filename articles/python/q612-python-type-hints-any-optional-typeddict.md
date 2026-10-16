# Python 类型注解会在运行时检查吗？Any、Optional、Union 和 TypedDict 怎么理解？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/python/q612-python-type-hints-any-optional-typeddict/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：Python 类型注解会在运行时检查吗？

🙋‍♂️ 我：默认不会，需要类型检查器或实际校验。

🧑‍💻 面试官：Optional\[int] 表示参数可以不传吗？

🙋‍♂️ 我：它表示可以是 int 或 None，是否能省略要看默认值。

🧑‍💻 面试官：TypedDict 声明了字典字段，json.loads 得到的字典就自动受约束了吗？Any 又会影响什么？

> 允许为空、允许省略和实际拒绝错误数据，各有一条规则。类型看起来写齐了，也要知道谁真正执行检查。

## 面试速答（60 秒版）

Python 类型注解主要为静态检查和开发工具提供信息，默认不会在函数调用时自动校验所有参数。运行时是否拒绝输入，要看实际代码或相应校验库。

Optional\[int] 等价于 int 与 None 的联合类型，说明值可以为空；参数能否不传还取决于有没有默认值。Union 描述允许的几种类型，也不会自己执行转换。

Any 会放宽静态约束，让许多操作被接受，但真实对象仍按自己的规则运行。TypedDict 描述字典的字段结构，通常也是静态合同，不会把普通 dict 变成自动校验模型。

所以我会给内部代码补清晰类型，让检查器提前发现问题；外部 JSON 则通过实际解析与校验进入业务，避免用类型断言或注解替代输入边界。

![类型写出来，谁真正执行检查？](https://note.lgdsunday.club/img/Q612/01-overview.webp)

## 知识点详解：静态合同、可空与运行时校验

### 注解把预期写出来，没有自动加检查代码

假设函数接收数量 int。给参数标注以后，类型检查器能够提醒调用方传错类型，但普通 Python 调用并不会自动生成一个 isinstance 关口。

如果函数只返回参数，字符串也可能被原样返回。如果函数做算术，错误可能在那一步才暴露，甚至得到与预期不同的结果。不要把“某次调用没抛异常”当成注解在验证输入。

类型检查依赖运行哪个检查器、检查范围和配置。它不是每个解释器启动时都自动执行的阶段。

### Optional 允许 None，不自动让参数变可选

下面 maybe 允许 None，但没有默认值，所以调用时仍要提供实参。

#### Python

```python
from typing import Any, TypedDict

def maybe(value: int | None) -> int | None:
    return value

print(maybe(None))
try:
    maybe()
except TypeError:
    print("缺少必需参数")

class Payload(TypedDict):
    count: int

external: Any = {"count": "三"}
payload: Payload = external
print(type(payload["count"]).__name__)  # str，运行时没有自动校验
```

如果想允许省略，可以明确写 value: int | None = None。这把类型允许集合和函数默认值两条规则组合起来。

TypedDict 中“字段可缺失”和“字段值可为 None”也不同。3.11 的 NotRequired 可以表达允许缺键，value 类型联合 None 则表达键存在但值可空。

![可为空，和可以不传是两条规则](https://note.lgdsunday.club/img/Q612/02-optional.webp)

### Any 放宽检查，不改变对象行为

示例的 external 标为 Any，检查器难以继续对内部值做足够严格的约束，payload 注解没有替它补一遍真实检查。

Any 适合逐步迁移或明确的动态接口，但到处使用会让类型检查的保护范围变小。拿到未知外部数据，可以先按 object 或实际验证模型处理，再缩小类型范围。

Python 的 object 和 Any 也不等同，object 仍要求先证明某项操作适用于对象，Any 则会放宽很多检查。Union 同样需要按分支缩小之后使用各类型独有能力。

![Any 让静态放宽，字符串仍是字符串](https://note.lgdsunday.club/img/Q612/03-any-v2.webp)

### 静态声明和接口校验配合使用

#### TypeScript（可空、必传与未知输入对照）

```typescript
function maybe(value: number | null): number | null {
  return value;
}
console.log(maybe(null));
// maybe(); // strict 检查下缺少必传参数

const external: unknown = { count: "三" };
function isPayload(value: unknown): value is { count: number } {
  return typeof value === "object" && value !== null &&
    typeof (value as { count?: unknown }).count === "number";
}
console.log(isPayload(external)); // false
```

TS 的 unknown 不能直接等同 Python object 的全部规则，但都提醒我们在使用未知数据前证明所需能力。类型谓词本身还需要实现正确，写一个函数签名不会自动完成校验。

接口入口可以用 Pydantic 或明确的验证函数，把字符串数字是否接受、空值和缺键是否允许、错误如何返回讲清楚。内部 TypedDict 则帮助使用方遵循已经确认的结构。

测试时同时看静态诊断和实际调用。准备错误类型、None 和缺参数三种输入，观察分别由哪层拒绝，才能回答“类型系统帮了什么，又没有帮什么”。

依据：[Python 3.11 typing](https://docs.python.org/3.11/library/typing.html)、[PEP 589 TypedDict](https://peps.python.org/pep-0589/)、[PEP 655 Required 与 NotRequired](https://peps.python.org/pep-0655/)、[TypeScript unknown](https://www.typescriptlang.org/docs/handbook/2/functions.html#unknown)。

![缺字段，和字段值为 None 不同](https://note.lgdsunday.club/img/Q612/04-fields.webp)

## 面试官继续追问

### Optional 就意味着默认 None 吗？

不是。它只描述允许的值类型，默认值和是否必传由函数签名另外决定。

### TypedDict 可以 isinstance 检查吗？

不能把它当普通运行时模型做相同检查。它主要服务静态字典结构合同，实际输入要验证。

### 写类型断言以后错误数据变对了吗？

没有。断言或注解可能影响检查器认识，不会自动修改真实值或补出字段。

## 面试速记卡

> - 注解默认不执行完整运行时校验。
> - Optional 表示可为 None，不等于可省略参数。
> - 默认值控制省略实参后的行为。
> - Any 放宽静态检查，不改变运行时类型。
> - TypedDict 描述静态字段结构，外部输入仍须验证。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
