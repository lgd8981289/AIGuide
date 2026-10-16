# LangChain 结构化输出怎么选？ProviderStrategy 和 ToolStrategy 有什么区别？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/langchain/q641-langchain-provider-tool-strategy/) · [题库目录](../../README.md)

*下面是用于讲题的模拟面试对话。*

🧑‍💻 面试官：LangChain 想让模型返回固定字段，为什么有 ProviderStrategy 和 ToolStrategy 两种做法？

🙋‍♂️ 我：一种利用模型服务原生的结构化输出，另一种通过工具调用格式接回结构化数据。

🧑‍💻 面试官：ToolStrategy 生成了“提交结果”这个调用，是不是就已经把数据写进我们的数据库了？

🙋‍♂️ 我：它首先是在表达输出，不能把这个结构化结果当成业务写入。

🧑‍💻 面试官：换一个模型以后，字段格式通过了，但金额是编出来的，换策略能解决吗？

> 两种策略改变的是结构化数据怎样生成和接回。结构符合 Schema 以后，字段内容有没有依据，还需要另外检查。

## 面试速答（60 秒版）

ProviderStrategy 使用模型服务原生的结构化输出能力，把目标 Schema 交给支持它的提供方。ToolStrategy 则借助工具调用，让模型用结构化参数提交目标结果，再由 LangChain 解析和校验。

如果目标模型和接口确实支持需要的原生结构化输出，通常优先考虑 ProviderStrategy；只有工具调用能力时，可以用 ToolStrategy。直接传 Schema 时，框架还可能根据模型能力自动选择，具体行为要看 LangChain 版本和模型适配信息。

需要注意，ToolStrategy 用于承载输出，不等于已经执行真实业务工具。它也可能和搜索、查询等普通工具出现在同一个 Agent 里，所以还要确认模型支持这些能力的组合。

最终结果拿到以后，仍需检查事实、范围和业务约束。比如金额字段是数字，不代表它与发票一致；入库、扣款等动作也不能因为结构通过就自动获得授权。

![两条结构化输出路径怎么选？](https://note.lgdsunday.club/img/Q641/01-langchain-provider-tool-strategy.webp)

## 知识点详解：同一个 Schema，怎样走两条生成路径？

### 先把期望的结果说清楚

假设要从一张发票里提取编号和金额。目标结构可以有 `invoiceId` 和 `amount` 两个字段，金额还要求非负。

Schema 描述这些要求，但它本身不决定模型服务支持什么。模型可能支持工具调用，不支持某类原生 JSON Schema；也可能只支持 Schema 的一部分约束。因此，选策略之前要核对模型、接口和适配库，不能只看模型名字。

Python 的 [结构化输出文档](https://docs.langchain.com/oss/python/langchain/structured-output)和 [TypeScript 文档](https://docs.langchain.com/oss/javascript/langchain/structured-output)分别说明了策略、自动选择与最终状态字段。

### ProviderStrategy 把格式约束交给提供方

这条路径利用服务端原生能力，返回数据时遵守它支持的结构要求。应用再通过框架接收和处理结果。

它的优点是少依赖模型用普通文本“自觉排好格式”。但接口支持、Schema 限制、拒绝回答和生成未完成等情况仍需处理。不要把“原生支持”扩大成任何模型、任何 Schema 都能工作。

### ToolStrategy 把结果装进工具调用参数

这条路径会把目标结果描述成模型能够调用的结构化输出工具。模型提交参数以后，框架检查字段并捕获结果。

这里的“工具”是在传递最终数据。它与一个真正发送邮件或写数据库的业务工具不同。只有应用随后发起了那项业务操作，外部世界才发生对应变化。

如果模型返回不符合 Schema 的参数，或者本来只需要一个结构化结果却返回多个候选，框架可以按配置反馈错误并要求重试。重试也需要预算；一直纠正格式，仍然可能拿不到正确的事实。

![输出工具，和真的业务工具有什么不同？](https://note.lgdsunday.club/img/Q641/02-langchain-provider-tool-strategy.webp)

### 两种语言怎样表达策略？

下面只构造策略与校验模型，不调用任何在线模型。TypeScript 使用 Zod，Python 使用 Pydantic，它们的对象和返回形式不同，不能只替换函数名就认为 API 完全相同。

#### TypeScript

```typescript
import { providerStrategy, toolStrategy } from "langchain";
import { z } from "zod";

const Invoice = z.object({
  invoiceId: z.string(),
  amount: z.number().nonnegative(),
});
const nativeOutput = providerStrategy(Invoice);
const toolOutput = toolStrategy(Invoice);
// 在 createAgent 中按模型能力选择 responseFormat。
const checked = Invoice.parse({ invoiceId: "INV-1", amount: 12.5 });
console.log(checked.amount);
```

#### Python

```python
from pydantic import BaseModel, Field
from langchain.agents.structured_output import ProviderStrategy, ToolStrategy

class Invoice(BaseModel):
    invoiceId: str
    amount: float = Field(ge=0)

native_output = ProviderStrategy(Invoice)
tool_output = ToolStrategy(Invoice)
# 在 create_agent 中按模型能力选择 response_format。
checked = Invoice.model_validate({"invoiceId": "INV-1", "amount": 12.5})
print(checked.amount)
```

TypeScript Agent 的最终结果使用 `structuredResponse`，Python 对应 `structured_response`。这两段代码只验证对象构造与本地数据约束，不能证明某个提供方已经接受这份 Schema。

### 换模型时，怎样避免只测正常样本？

除了完整发票，还要准备缺字段、低清晰度、金额无法确认、输入包含多个发票等情况。分别检查框架是否返回结构、怎样报告失败，以及它有没有猜出材料里不存在的值。

同时测试普通业务工具和结构化输出一起启用的配置。模型分别支持两项能力，不代表当前组合方式一定可用。最终再记录失败率、修复轮数和耗时，判断原生与工具策略在这套任务里的表现。

![字段类型对了，内容还要对原件](https://note.lgdsunday.club/img/Q641/03-langchain-provider-tool-strategy.webp)

## 面试官继续追问

### 自动选择以后，就不用关心版本了吗？

自动选择依赖框架掌握的模型能力信息，也受到适配器版本影响。模型或依赖升级时，仍要记录实际策略并跑回归；显式指定策略，也不能让原本不支持的模型凭空支持。

### ToolStrategy 能替代真正的函数工具吗？

它可以承载最终输出，查询和写操作仍要由真实工具实现。把一个结果字段命名成“已退款”，不会让退款服务真的完成退款。

### Pydantic 校验通过，内容就可信了吗？

校验可以检查类型与声明的约束，发票编号、金额和主体是否符合原件，则需要证据核对。结构校验与业务真值应分开统计。

## 面试速记卡

> - ProviderStrategy 利用提供方原生结构化输出。
> - ToolStrategy 借工具调用参数承载目标结果。
> - 自动选择依赖框架版本、模型能力与适配信息。
> - 输出工具不等于业务操作，结构通过不代表内容真实。
> - 测试缺失、歧义和工具组合，再比较修复成本。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
