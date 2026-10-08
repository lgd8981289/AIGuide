# 什么是 Tool Calling？大模型是如何调用外部工具的？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/agent/q004-tool-calling-execution-flow/) · [题库目录](../../README.md)

🧑‍💻 面试官：什么是 Tool Calling？大模型是怎么调用外部工具的？

🙋‍♂️ 我：Tool Calling 就是把一些函数提供给大模型。模型需要的时候，可以自己调用这些函数，查询外部数据或者完成操作。

🧑‍💻 面试官：你说“把函数提供给模型”，是把订单查询接口的代码也发给模型吗？模型怎么知道这个函数需要哪些参数？

🙋‍♂️ 我：不是把代码发给模型，而是提供工具的名称、用途和参数格式。模型根据这些说明生成调用参数。

🧑‍💻 面试官：模型已经生成了 `query_order` 和订单号，是不是说明订单已经查完了？

🙋‍♂️ 我：还没有。模型返回的只是工具调用请求，真正的订单查询要由后端执行。

🧑‍💻 面试官：如果模型生成了一个根本不存在的工具，或者拿别人的订单号来查询呢？参数已经是合法 JSON，后端是不是就可以直接执行？

🙋‍♂️ 我：不能。后端还需要检查工具白名单、参数结构和当前用户的权限，再决定是否执行。

🧑‍💻 面试官：工具执行完以后，结果怎样交回模型？如果一轮里有多个调用，模型怎么知道每个结果对应哪一次请求？

> 这道题真正要说清楚的是「执行边界」：模型只负责提出结构化的调用请求，应用负责校验和执行，再把真实结果交还模型。

## 面试速答（60 秒版）

`Tool Calling` 并不是大模型自己去执行某个工具，而是模型和应用之间约定的一套调用方式。

应用会先把工具名称、用途和参数结构告诉模型。模型判断需要使用工具时，会返回一份结构化的调用请求，里面通常包含工具名称、参数和调用标识。

但是咱们要知道，到这一步为止，工具还没有真正执行。

后端收到请求以后，会根据工具白名单找到对应的处理函数，然后检查参数、用户权限和业务状态。工具执行完成以后，后端再把结果和原来的调用标识一起交给模型。模型读取真实结果以后，决定继续调用其他工具，还是直接回答用户。

![Tool Calling 的执行流程：定义工具 Schema、模型输出调用请求、应用执行工具、把结果回传模型，直到模型给出最终答案](https://note.lgdsunday.club/img/Q004/ChatGPT%20Image%202026%E5%B9%B49%E6%9C%8823%E6%97%A5%2018_18_22.webp)

那么，除了 `Tool Calling` 之外，很多同学可能知道另外一个，叫做：`Function Calling`  的东西。

`Function Calling` 通常可以理解为 `Tool Calling` 的一种。它强调调用开发者提供的函数，而 Tool Calling 的范围更大，还可以包含平台内置工具和 MCP 工具。

他们之间的关系大概就是这样的：

![Function Calling 与 Tool Calling 的关系：Function Calling 属于 Tool Calling 的一部分，Tool Calling 还包含平台内置工具与 MCP 工具](https://note.lgdsunday.club/img/Q004/ChatGPT%20Image%202026%E5%B9%B49%E6%9C%8823%E6%97%A5%2018_21_05.webp)

但是，无论使用哪一种方式，参数符合 Schema 都不代表操作一定安全。退款、删除数据这类高风险动作，仍然要由后端完成权限校验、幂等控制和人工确认。

## 知识点详解：一次 Tool Calling 到底发生了什么？

### 第一步不是“注册函数”，而是向模型介绍工具

假设用户问：**帮我查一下订单 `ORD-20260923-001` 现在到哪一步了。**

模型本身其实是不知道这个订单是否存在的。

因此，应用需要先告诉模型：当前有一个叫作 `query_order` 的工具，可以根据订单号查询订单状态。

这份工具说明通常包含下面几个部分：

| 字段            | 告诉模型什么                 |
| ------------- | ---------------------- |
| `name`        | 工具叫什么，例如 `query_order` |
| `description` | 这个工具解决什么问题，应该在什么时候使用   |
| `parameters`  | 参数有哪些、分别是什么类型          |
| `required`    | 哪些参数必须提供               |

这里提供给模型的东西，叫做： **工具说明**

模型读取这些说明以后，可能返回下面这样的结构化请求：

```json
{
  "type": "function_call",
  "call_id": "call_order_001",
  "name": "query_order",
  "arguments": "{\"order_id\":\"ORD-20260923-001\"}"
}
```

这段数据表达的是：**模型认为下一步应该调用 `query_order`，并建议使用这个订单号。**

但是，订单此时还没有查询。

### 一次完整调用，需要在模型和应用之间走两个来回

从用户提问到最终拿到答案，一次完整的 Tool Calling 可以拆成下面五步：

1. 应用把用户问题和可用工具一起发给模型。
2. 模型返回工具名称、参数和 `call_id`。
3. 应用校验请求，并真正调用订单服务。
4. 应用把查询结果和原来的 `call_id` 一起交回模型。
5. 模型读取工具结果，生成最终回答；如果信息仍然不够，也可以继续请求其他工具。

`call_id` 的作用，就是把工具结果和原来的调用请求对应起来。如果同一轮产生了多个工具调用，后端不能只返回一组没有身份的结果，否则模型不知道哪一份结果属于哪个请求。

下面用 OpenAI Responses API 的代码，分别看一下 TypeScript 和 Python 怎样完成这个过程。为了突出 Tool Calling，示例省略了完整的订单服务、登录逻辑和异常类型。

#### TypeScript

```ts
import OpenAI from "openai";

const client = new OpenAI();
const MODEL_NAME = process.env.OPENAI_MODEL!;

const tools = [
  {
    type: "function",
    name: "query_order",
    description: "查询当前登录用户自己的订单状态",
    parameters: {
      type: "object",
      properties: {
        order_id: { type: "string", description: "订单编号" },
      },
      required: ["order_id"],
      additionalProperties: false,
    },
    strict: true,
  },
] as const;

const firstResponse = await client.responses.create({
  model: MODEL_NAME,
  input: "帮我查一下订单 ORD-20260923-001 现在到哪一步了",
  tools: [...tools],
});

const toolCall = firstResponse.output.find(
  (item) => item.type === "function_call" && item.name === "query_order",
);

if (!toolCall) throw new Error("模型没有请求 query_order");

const { order_id } = JSON.parse(toolCall.arguments);

// currentUser.id 来自后端登录态，不能由模型生成
const order = await queryOrder(order_id, currentUser.id);

const finalResponse = await client.responses.create({
  model: MODEL_NAME,
  previous_response_id: firstResponse.id,
  tools: [...tools],
  input: [
    {
      type: "function_call_output",
      call_id: toolCall.call_id,
      output: JSON.stringify(order),
    },
  ],
});

console.log(finalResponse.output_text);
```

#### Python

```python
import json
import os
from openai import OpenAI

client = OpenAI()
model_name = os.environ["OPENAI_MODEL"]

tools = [
    {
        "type": "function",
        "name": "query_order",
        "description": "查询当前登录用户自己的订单状态",
        "parameters": {
            "type": "object",
            "properties": {
                "order_id": {"type": "string", "description": "订单编号"}
            },
            "required": ["order_id"],
            "additionalProperties": False,
        },
        "strict": True,
    }
]

first_response = client.responses.create(
    model=model_name,
    input="帮我查一下订单 ORD-20260923-001 现在到哪一步了",
    tools=tools,
)

tool_call = next(
    (
        item
        for item in first_response.output
        if item.type == "function_call" and item.name == "query_order"
    ),
    None,
)

if tool_call is None:
    raise RuntimeError("模型没有请求 query_order")

arguments = json.loads(tool_call.arguments)

# current_user.id 来自后端登录态，不能由模型生成
order = query_order(arguments["order_id"], current_user.id)

final_response = client.responses.create(
    model=model_name,
    previous_response_id=first_response.id,
    tools=tools,
    input=[
        {
            "type": "function_call_output",
            "call_id": tool_call.call_id,
            "output": json.dumps(order, ensure_ascii=False),
        }
    ],
)

print(final_response.output_text)
```

这两段代码里，模型真正完成的是两件事：选择 `query_order`，以及生成 `order_id`。

真正访问订单系统的是 `queryOrder` 或 `query_order`。查询完成以后，应用再使用 `function_call_output` 把结果交回模型。

因此，面试时说“模型调用了订单接口”没有问题，但继续往下解释时一定要说清楚：**模型发起调用意图，应用才掌握真实执行权。**

### 参数符合 Schema，不代表这个操作可以执行

工具参数使用 JSON Schema，可以限制字段类型、必填项、枚举值和是否允许额外字段。严格模式还能让模型生成的参数更加稳定。

但是，Schema 解决的是 **参数长什么样**，不是 **这次操作应不应该执行**。

例如，模型传入的订单号完全符合字符串格式，但它可能属于另一个用户。后端不能因为 JSON 合法，就把订单信息直接返回。

一次工具执行至少还要经过下面几道检查：

- 工具名称是否在当前请求允许使用的白名单里。
- 参数是否符合 Schema，并且满足长度、格式和业务规则。
- 当前登录用户是否有权访问这个订单。
- 订单当前状态是否允许执行这项操作。
- 如果是退款、删除或发消息，是否需要幂等键和人工确认。

尤其要注意，`user_id`、角色和权限范围不能让模型自己填写。它们应该来自后端已经验证过的登录态。

否则，模型只要生成另一个用户的 ID，就可能绕过业务隔离。

### 怎么判断 Tool Calling 做得好不好？

首先要准备一批固定问题，检查模型是否在需要时选对工具，在不需要时不会乱调用。

例如，“查询订单状态”应该调用 `query_order`；“解释什么是物流中转”不一定需要查订单；缺少订单号时，模型应该先向用户补问，而不是自己编一个参数。

接着还要检查参数是否正确、权限是否被拦住，以及工具执行失败以后系统怎样处理。网络超时可以由执行器有限重试；订单不存在或者用户无权访问，则应该返回明确错误，不能换一个订单号继续试。

线上还需要保留完整的 Trace。至少记录 `trace_id`、`call_id`、工具名称、参数摘要、权限判断、执行结果、错误码和耗时。这样出现问题以后，才能分清究竟是模型选错了工具、参数生成错误，还是业务接口本身失败了。

## 面试官继续追问

### Function Calling 和 Tool Calling 有什么区别？

`Function Calling` 通常可以理解成 `Tool Calling` 的一种。

Function Calling 更强调开发者提供的函数。模型按照函数的参数 Schema 生成结构化请求，再由应用执行这个函数。

Tool Calling 的范围更宽。除了开发者函数，还可以包括平台内置的网页搜索、代码执行，以及通过 MCP 接入的外部工具。

开发者提供的函数通常由自己的应用执行，部分平台内置工具则会由模型服务商代为执行。不过，无论工具运行在哪里，都不是大模型自己拿着数据库账号或者服务器权限直接操作外部系统。

不同平台对这两个词的使用可能会有重叠。面试时不必死记名字，重点说清楚：工具在哪里执行，谁负责权限，以及结果怎样回到模型。

### 参数已经通过严格模式校验，可以直接执行吗？

不能。

严格模式可以提高参数遵守 Schema 的可靠性，例如保证订单号字段存在、不出现额外字段。但是它不会替后端判断当前用户是否拥有这个订单，也不会判断订单是不是已经退款。

所以，参数 Schema 是第一层结构校验。资源权限、业务状态、操作额度、幂等和人工审批，仍然要由业务代码负责。

### 使用了 Tool Calling，就一定是 Agent 吗？

不一定。

如果代码已经规定每次都必须调用 `query_order`，模型只负责从用户问题里提取订单号，那么这更像 Workflow 中的一个处理节点。

如果模型能够根据用户目标和当前结果，动态决定是否调用工具、调用哪一个工具，以及拿到结果以后还要不要继续，它才更接近 Agent。

所以，Tool Calling 解决的是模型怎样连接外部能力；一个系统是不是 Agent，仍然要看下一步的控制权在谁手里。

## 面试速记卡

> - 工具说明：用名称、用途和参数 Schema 告诉模型可以使用什么能力。
> - 模型职责：选择工具并生成结构化参数，不直接执行开发者提供的业务代码。
> - 应用职责：按白名单路由工具，校验参数、权限和业务状态，再完成真实调用。
> - 结果回填：使用 call\_id 把工具结果对应回原请求，再交给模型继续判断。
> - 安全边界：Schema 只保证参数结构，高风险操作还需要授权、幂等、审计和人工确认。

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
