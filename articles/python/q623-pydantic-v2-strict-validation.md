# Pydantic v2 怎么校验数据？为什么字符串能变成整数，strict 模式又会报错？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/python/q623-pydantic-v2-strict-validation/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：Pydantic 字段声明 int，传字符串为什么可能成功？

🙋‍♂️ 我：默认校验允许一些转换，例如可解析的数字字符串转整数。

🧑‍💻 面试官：我开启 strict，就能保证所有输入都不发生转换了吗？

🙋‍♂️ 我：还要看类型与输入方式，JSON 和 Python 对象的规则可能不同。

🧑‍💻 面试官：那 quantity=-1 能不能过？类型符合，与业务范围符合，是不是两件事？

> 类型转换、字段约束和业务规则，要分别说明；strict 也需要按具体类型与输入方式理解。

## 面试速答（60 秒版）

Pydantic v2 在运行时按模型规则校验输入。默认较宽松的模式会尝试允许的类型转换，例如把数字字符串解析成整数，但不代表任何字符串都能变成数字。

strict 模式减少这类转换，让类型不符的输入报错。可以在调用、字段或模型配置层控制，具体规则仍要看字段类型；Python 对象输入与 JSON 输入也可能不同，例如 JSON 没有原生日期对象。

字段类型符合以后，还可以用范围等约束检查值，例如数量必须大于零。更深的业务规则，如库存是否足够和用户有没有权限，仍然要在业务处理里判断。

最后，输入校验与输出序列化也要分开。模型通过校验，不代表之后任意修改都自动重新校验，更不代表数据可以随意暴露。

![转换、类型、范围，逐项确认](https://note.lgdsunday.club/img/Q623/01-overview-v2.webp)

## 知识点详解：输入怎样成为一份符合约定的数据

### 类型注解，在这里有了运行时处理

假设接口接收购买数量。普通 Python 的 quantity: int 注解不会自动拒绝字符串；Pydantic 模型会读取这份声明，按自己的校验规则处理输入。

默认模式下，符合转换规则的字符串可能被解析。这样方便接收来自参数、环境变量等渠道的数据，但也可能让调用方一直没发现自己传错类型。

所以要先决定接口合同。愿意接受数字字符串，就明确记录转换；要求原生整数，就把对应入口设严格。不能只从 int 这个单词推断全部输入行为。

### 用同一个字段观察宽松、严格与范围

下面代码使用 Pydantic v2。

#### Python

```python
from pydantic import BaseModel, Field, ValidationError

class Purchase(BaseModel):
    quantity: int = Field(gt=0)

assert Purchase.model_validate({"quantity": "3"}).quantity == 3
for data, strict in [({"quantity": "3"}, True),
                     ({"quantity": -1}, False)]:
    try:
        Purchase.model_validate(data, strict=strict)
    except ValidationError as exc:
        assert exc.errors()[0]["loc"] == ("quantity",)
    else:
        raise AssertionError("本例应当校验失败")
```

第一个输入说明允许的转换。第二个类型不满足严格模式，第三个虽然是整数，却不满足 gt=0。两种失败都定位到 quantity，但错误原因不同。

errors() 中的位置和类型适合定位字段。错误内容可能包含原始输入，不应未经脱敏就写进公开日志，尤其是密码或令牌。

![同一个字段，也可能有不同错误](https://note.lgdsunday.club/img/Q623/02-errors.webp)

### strict 的边界，仍然跟着类型走

strict 不是“输入字节必须与 Python 内部表示完全一致”。JSON 没有原生 date 类型，因此某些日期类型即使严格校验 JSON，也仍允许相应字符串表示。

判断时需要明确使用 model\_validate 处理 Python 对象，还是 model\_validate\_json 处理 JSON，再看具体字段转换表。不要把一个 int 例子的结论扩大到所有类型。

模型配置可以设默认严格，字段也可以有自己的安排。大量接口突然改严格，原来被默默转换的输入会开始失败，需要先核对调用方合同与测试样本。

### 校验后，还有修改与业务边界

模型初次通过校验，不代表之后每次赋值都会自动检查。需要赋值校验时按 v2 配置启用；嵌套对象和直接原地修改又有自己的边界，不能以一项开关当完整防线。

库存、权限、数据库唯一性等信息不只存在于这份输入里，应由业务与存储规则继续保证。model\_dump 是序列化出口，也要明确哪些字段允许返回。

Pydantic 是 Python 库，TS 类型声明本身不能代替运行时校验；若项目采用其他校验库，需要按该库的真实转换与严格规则另写实现，不提供虚构的 TS BaseModel。

依据：[Pydantic 模型](https://docs.pydantic.dev/latest/concepts/models/)、[strict 模式](https://docs.pydantic.dev/latest/concepts/strict_mode/)、[转换表](https://docs.pydantic.dev/latest/concepts/conversion_table/)、[赋值校验](https://docs.pydantic.dev/latest/api/config/#pydantic.config.ConfigDict.validate_assignment)。

![校验输入，还没检查库存与权限](https://note.lgdsunday.club/img/Q623/03-boundaries-v2.webp)

## 面试官继续追问

### 字段是 int，就代表数量一定可用吗？

还要检查正数、上限等值约束，并结合库存等业务状态。

### strict 下日期字符串一定失败吗？

取决于字段类型和 Python/JSON 输入方式，按对应规则判断。

### 模型创建以后写入非法值，会自动报错吗？

默认不能这样保证。赋值校验和容器原地修改需要分别确认。

## 面试速记卡

> - Pydantic 按规则进行运行时校验。
> - 宽松模式允许特定转换，不接受任意格式。
> - strict 依字段类型与输入方式确定。
> - 类型约束、数值范围与业务权限分开判断。
> - 输入校验、后续修改与输出序列化分别设合同。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
