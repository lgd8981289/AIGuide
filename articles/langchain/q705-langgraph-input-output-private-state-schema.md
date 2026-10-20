# LangGraph 的 input、output 和 private state 有什么区别？怎样避免内部状态泄露？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/langchain/q705-langgraph-input-output-private-state-schema/) · [题库目录](../../README.md)

*下面是一段用于讲题的模拟面试对话。*

🧑‍💻 面试官：图里有用户问题、检索草稿和最终回答，只想把回答返回给页面，该怎么做？

🙋‍♂️ 我：可以为图分别定义输入和输出 Schema，内部再保留完整状态。

🧑‍💻 面试官：把草稿放在 private state，就一定不会被用户看到吗？

🙋‍♂️ 我：要看实际输出入口。普通 invoke 的输出过滤，不能直接等同于流式输出的字段范围。

🧑‍💻 面试官：如果接口把 `stream_mode="values"` 的每一帧都原样转给浏览器呢？

> Schema 能规定接口形状，但保密要检查每一个出口，尤其是流式事件和日志。

## 面试速答（60 秒版）

LangGraph 可以把图的输入、内部状态和最终输出分开定义。Input Schema 描述调用时接收的字段，Output Schema 控制普通调用返回哪些字段，内部状态则允许节点交换中间数据。

所谓 private state，主要是节点间使用、没有放在公开输入输出里的状态通道，不是一套自动加密或脱敏机制。

特别要注意流式输出。`values` 默认可以发出完整状态，其中可能包含内部字段；定义了 Output Schema，也不能假设所有 stream 模式都只返回最终答案。

所以，应用应该为公开接口明确投影允许输出的字段，并检查更新事件、调试信息和 Trace。密钥、连接等运行依赖尽量不要放进 State，授权也不能靠隐藏一个字段完成。

![公开输入输出，和内部状态分开](https://note.lgdsunday.club/img/Q705/01-schema-overview.webp)

## 知识点详解：内部能使用的数据，不一定都该返回页面

### 先分清三份 Schema 各自描述什么

假设咱们做一个资料问答图。用户提交 `question`，检索节点产生 `notes`，回答节点产生 `answer`。

那么，公开输入只需要 `question`，最终输出只需要 `answer`。图内部仍然要保存三个字段，不然回答节点拿不到前一步的资料。

节点还可以声明内部通道，用于局部数据交接。这些通道不出现在公开输入输出里，可以减少接口耦合。但“公开接口没声明”，并不等于这个字段从执行系统中消失，更不等于只有某个节点绝对能访问。

这种输入、输出与内部通道的组合方式，可核对[Python Graph API 的多 Schema 说明](https://docs.langchain.com/oss/python/langgraph/graph-api#multiple-schemas)。

### 同一份图，invoke 和 stream 看见的内容可能不同

下面保留内部 `notes`，用输出 Schema 只返回 `answer`。先观察普通调用，再观察完整状态流。

#### TypeScript

```ts
import { Annotation, StateGraph, START, END } from "@langchain/langgraph";

const Input = Annotation.Root({ question: Annotation<string>() });
const Output = Annotation.Root({ answer: Annotation<string>() });
const State = Annotation.Root({
  ...Input.spec, ...Output.spec, notes: Annotation<string>(),
});
const graph = new StateGraph({ stateSchema: State, input: Input, output: Output })
  .addNode("prepare", () => ({ notes: "internal draft" }))
  .addNode("respond", () => ({ answer: "public answer" }))
  .addEdge(START, "prepare")
  .addEdge("prepare", "respond")
  .addEdge("respond", END)
  .compile();

async function main() {
  console.log(await graph.invoke({ question: "q" }));
  // { answer: "public answer" }
  for await (const state of await graph.stream(
    { question: "q" }, { streamMode: "values" },
  )) console.log(state); // 后续快照包含 notes
}
main();
```

#### Python

```python
from typing import TypedDict
from langgraph.graph import StateGraph, START, END

class Input(TypedDict):
    question: str

class Output(TypedDict):
    answer: str

class State(Input, Output):
    notes: str

graph = (
    StateGraph(State, input_schema=Input, output_schema=Output)
    .add_node("prepare", lambda s: {"notes": "internal draft"})
    .add_node("respond", lambda s: {"answer": "public answer"})
    .add_edge(START, "prepare")
    .add_edge("prepare", "respond")
    .add_edge("respond", END)
    .compile()
)
print(graph.invoke({"question": "q"}))
# {'answer': 'public answer'}
for state in graph.stream({"question": "q"}, stream_mode="values"):
    print(state) # 后续快照包含 notes
```

本次在 JS LangGraph 1.5.0、Python LangGraph 1.2.15 中实际验证了这两种输出。例子中的 `notes` 只是普通内部草稿，没有放真实敏感信息。

![invoke 只回答案，values 可能带上草稿](https://note.lgdsunday.club/img/Q705/02-schema-stream-leak.webp)

### 只改成 updates，能保证安全吗？

也不能。`updates` 只发节点本次产生的更新，但如果节点更新里本来就有内部字段，它仍可能出现在事件中。输出少一点，与只输出允许公开的内容，并不是同一个约束。

对于 `values`，可以明确限制 `output_keys=["answer"]`，JS 对应 `outputKeys: ["answer"]`。更外层的 HTTP 接口还应定义自己的公开事件，只从允许字段组装数据，不能把框架的调试输出直接当成产品 API。

例如页面只需要 `answer_delta` 和任务完成状态，就没有必要收到检索草稿、内部错误堆栈和所有工具原始返回值。不同 stream 模式的行为，参照[JS 流式文档](https://docs.langchain.com/oss/javascript/langgraph/streaming)。

### private state 也不适合存放凭据

即使页面没有直接收到它，检查点、日志和观测平台也可能保存执行数据。把访问令牌放在内部 State，风险仍然存在。

可以把经过认证的身份和服务依赖放到 Runtime Context，在需要的节点或工具里读取；再检查返回值是否带出了这些数据。保密应该靠数据最小化与出口检查，而不是靠变量名里有一个 private。

![每一个出口，都要单独选字段](https://note.lgdsunday.club/img/Q705/03-schema-output-gates.webp)

### 应该怎样验收？

在内部字段里放一个无敏感含义的测试标记，分别调用 invoke、values、updates，以及产品真正使用的事件出口。检查浏览器响应、日志和追踪记录里有没有这个标记。

这比只检查最后一段回答更容易发现泄露。框架升级或换一种 stream 模式后，也要重新跑一遍，不能认为输出 Schema 一次配置就永久有效。

## 面试官继续追问

### Input Schema 可以直接充当 HTTP 参数校验吗？

要看实际 Schema 类型和校验入口。类型声明、状态字段选择与完整的请求验证并不完全等价。应用仍需要检查字段约束、大小、权限和恶意输入。

### 只给节点声明较小的输入 Schema，就能当权限隔离吗？

不能。它帮助限定节点的读取接口，不是进程级或服务级安全隔离。真正的敏感访问仍需在服务端执行授权。

### 输出过滤以后，模型就不知道内部草稿了吗？

这是两个方向。返回给用户的过滤，不会撤回已经发送给模型的内容。模型输入也要单独检查。

## 面试速记卡

> - Input 描述图输入，Output 控制普通调用的返回字段。
> - 内部通道方便节点交接数据，不等于自动保密。
> - values 流可能包含完整状态，updates 也可能包含内部更新。
> - 公开接口明确选字段，不直接转发框架调试事件。
> - 模型输入、浏览器输出、检查点和日志都要分别检查。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
