# TypeScript 函数重载是什么？什么时候用重载，什么时候用联合类型？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q645-typescript-function-overloads/) · [题库目录](../../README.md)

*下面是用于讲题的模拟面试对话。*

🧑‍💻 面试官：函数既能接字符串，也能接字符串数组，写联合类型不就够了吗？

🙋‍♂️ 我：如果返回类型也一样，联合类型通常就够了。如果输入不同会得到不同返回类型，重载能表达这种对应。

🧑‍💻 面试官：实现签名写了联合类型，调用方就能把一个联合类型变量传进去吗？

🙋‍♂️ 我：还要看公开的重载签名有没有接住这类调用。

🧑‍💻 面试官：那运行时会生成两份函数，由 JavaScript 根据类型自动挑吗？

> 重载让调用处看清输入与输出的关系。运行时仍然只有一份实现，分支要自己写。

## 面试速答（60 秒版）

TypeScript 函数重载，是给同一个函数提供多条调用签名，再用一份实现处理这些输入。

例如传字符串时返回字符串，传字符串数组时返回字符串数组。只写一个宽泛的联合返回类型，调用方可能每次都需要重新判断；重载可以把两种关系分别告诉类型检查器。

但实现签名主要用于约束函数内部的实现，不自动成为调用方可选的重载。调用时要匹配公开签名，如果参数本身是联合类型，可能需要额外的联合签名，或者先收窄再调用。

如果几种输入的处理规则和返回类型都一样，优先用联合参数会更简单。只有输入输出之间确实有关系要表达时，再考虑重载或泛型，避免为了接更多类型写一长排签名。

![函数重载，分别让谁看到什么？](https://note.lgdsunday.club/img/Q645/01-typescript-function-overloads.webp)

## 知识点详解：类型检查器看到的，和运行时执行的不同

### 先看一个确实需要对应关系的函数

假设一个格式处理函数，把字符串转成大写；收到数组时，逐项转换并返回数组。调用者传入字符串，当然希望立刻知道返回值还是字符串。

#### TypeScript

```typescript
function upper(value: string): string;
function upper(value: string[]): string[];
function upper(value: string | string[]): string | string[] {
  return typeof value === "string"
    ? value.toUpperCase()
    : value.map(item => item.toUpperCase());
}

const text = upper("agent");        // string
const items = upper(["agent"]);     // string[]
console.log(text, items);
```

前两行是重载签名，带函数体的那一行是实现签名。编译以后，JavaScript 执行的是带分支的那一份函数，不会根据 TS 类型再创建一个分派器。[TypeScript 官方函数文档](https://www.typescriptlang.org/docs/handbook/2/functions.html)解释了这一边界。

#### Python（静态类型对应写法）

```python
from typing import overload

@overload
def upper(value: str) -> str: ...

@overload
def upper(value: list[str]) -> list[str]: ...

def upper(value: str | list[str]) -> str | list[str]:
    if isinstance(value, str):
        return value.upper()
    return [item.upper() for item in value]

print(upper("agent"), upper(["agent"]))
```

Python 的 [typing.overload](https://docs.python.org/3/library/typing.html#typing.overload) 同样服务类型检查，实际调用最后的实现函数。但两种语言的类型检查规则并不完全一样，这里只对照静态签名与运行实现的分工，不能把它当成 Python 自动执行多版本函数。

### 为什么联合参数有时匹配不到？

假设调用方拿到一个 `string | string[]`。它现在无法确认是哪一支，而两条公开签名分别只接受其中一种。实现里能处理两种，不等于公开调用签名已经接受这个联合参数。

可以先判断当前值再调用，也可以增加一条公开联合签名，允许这类输入并返回联合结果。这项选择取决于 API 是否真的要支持“不确定输入得到不确定输出”。不要只为了消掉报错就把所有签名改成 any。

![重载保留了哪条输入输出关系？](https://note.lgdsunday.club/img/Q645/02-typescript-function-overloads.webp)

### 什么时候联合类型更合适？

如果函数只是计算字符串或数组的长度，两种情况都返回 number，输入也不需要不同参数数量，直接接收联合类型通常已经清楚。

重载的收益来自关系更明确。签名太多时，调用者可能更难理解，而且实现并不会自动证明每条分支都返回了正确形状。可以用具体调用的类型断言测试配合运行测试，一边检查推断，一边检查实际结果。

![实现能接收，不代表公开接口允许](https://note.lgdsunday.club/img/Q645/03-typescript-function-overloads.webp)

### 空数组、可选参数和宽签名怎样检查？

空数组可能暴露类型推断边界，可选参数会引入更多允许的组合。签名顺序也可能影响匹配，因此更宽的签名不应轻易盖住希望保留的具体关系。

测试时至少覆盖每条公开签名、联合变量和非法调用。运行时还要检查分支行为；来自网络的值可能根本不符合声明，重载不会替你做入口校验。

## 面试官继续追问

### 返回类型不同，是否就必须用重载？

还可以用泛型表达输入输出关系。几种固定调用形态适合重载，统一的类型变换关系则可能更适合泛型。先写清调用者需要保留哪种信息，再选表达方式。

### 能否只写重载签名，不写函数体？

声明文件里可以描述已有实现，普通实现文件则需要匹配的实现。只有类型描述而没有运行时代码，真正调用时仍会失败。

### 实现能接更多类型，可以直接调用吗？

公开签名才是调用契约。实现的宽类型主要用于覆盖已声明的形态，不自动承诺额外输入。若确实需要开放，应该明确增加签名和测试。

## 面试速记卡

> - 重载提供多条调用签名，运行时仍执行一份函数体。
> - 实现签名不自动成为额外的公开调用签名。
> - 输入输出存在不同对应关系时，重载更有价值。
> - 返回契约相同且形态简单时，联合参数通常更直接。
> - 类型推断与运行行为分别测试，外部数据仍要校验。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
