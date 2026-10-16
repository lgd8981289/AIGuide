# LangGraph 的 Command 和条件边有什么区别？怎样同时更新状态并决定下一步？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/langchain/q640-langgraph-command-conditional-edges/) · [题库目录](../../README.md)

*下面是用于讲题的模拟面试对话。*

🧑‍💻 面试官：一个节点检查完任务风险，要写入检查原因，再决定转人工还是自动处理，怎么做？

🙋‍♂️ 我：可以先返回状态更新，再用条件边路由；也可以返回 Command，把 update 和 goto 一起给出来。

🧑‍💻 面试官：节点已经返回 goto="manual"，图上还留着它到 auto 的普通边，会怎样？

🙋‍♂️ 我：不能把 goto 当成覆盖已有边。

🧑‍💻 面试官：那如果两个后续节点都写同一个结果字段，你准备怎样定位问题？

> Command 把状态更新和动态路由放在一次返回里，但它不会帮你删除图上已有的路径。

## 面试速答（60 秒版）

LangGraph 的条件边，是在节点完成后，根据状态计算接下来去哪个节点。它适合把业务处理与路由规则分开写。

`Command` 则允许节点同时返回两件事，`update` 表示状态怎么更新，`goto` 表示动态安排哪些后续节点。比如风险检查后保存原因，再转到人工处理节点。

两种写法都能表达动态流程，主要区别是更新和路由放在哪里组织。需要同一处逻辑完成这两个决定时，Command 会比较直接。

但是，`goto` 添加的动态路径不会覆盖普通边。如果同一个节点还连着另一个静态后继，两条路径都可能执行。因此，同一处路由应选清楚表达方式，并检查实际执行节点，而不能只看最终返回值。

![状态更新与路由，放在哪里决定？](https://note.lgdsunday.club/img/Q640/01-langgraph-command-conditional-edges.webp)

## 知识点详解：更新数据以后，图会沿哪些路径继续？

### 用风险检查理解两种写法

假设任务有一个 `risky` 字段。检查节点要保存原因，高风险进入 `manual`，其他任务进入 `auto`。

条件边写法会让检查节点返回原因，再由路由函数读取状态，返回目标节点名。这样判断规则集中在边上，节点可以只负责产生业务信息。

Command 写法则在检查节点里直接产生更新和目标。对当前场景来说，原因和路线来自同一个判断，放在一起容易核对。两种机制及普通边的关系见 [Python Graph API](https://docs.langchain.com/oss/python/langgraph/graph-api)与 [TypeScript Graph API](https://docs.langchain.com/oss/javascript/langgraph/graph-api)。

### 让一个最小图实际跑起来

下面只用普通函数模拟风险判断，没有调用大模型。两种版本都使用各自真实的 LangGraph 库，变量名不同不影响它们表达相同的路由。

#### TypeScript

```typescript
import { Annotation, Command, END, START, StateGraph } from "@langchain/langgraph";

const State = Annotation.Root({
  risky: Annotation<boolean>(),
  reason: Annotation<string>(),
  result: Annotation<string>(),
});

const app = new StateGraph(State)
  .addNode("choose", (state: typeof State.State) => new Command({
    update: { reason: state.risky ? "需要人工确认" : "允许自动处理" },
    goto: state.risky ? "manual" : "auto",
  }), { ends: ["manual", "auto"] })
  .addNode("manual", () => ({ result: "review" }))
  .addNode("auto", () => ({ result: "automatic" }))
  .addEdge(START, "choose")
  .addEdge("manual", END)
  .addEdge("auto", END)
  .compile();

const answer = await app.invoke({ risky: true });
console.log(answer.result, answer.reason);
```

#### Python

```python
from typing import Literal, TypedDict
from langgraph.graph import END, START, StateGraph
from langgraph.types import Command

class State(TypedDict):
    risky: bool
    reason: str
    result: str

def choose(state: State) -> Command[Literal["manual", "auto"]]:
    return Command(
        update={"reason": "需要人工确认" if state["risky"] else "允许自动处理"},
        goto="manual" if state["risky"] else "auto",
    )

builder = StateGraph(State)
builder.add_node("choose", choose)
builder.add_node("manual", lambda state: {"result": "review"})
builder.add_node("auto", lambda state: {"result": "automatic"})
builder.add_edge(START, "choose")
builder.add_edge("manual", END)
builder.add_edge("auto", END)
app = builder.compile()

answer = app.invoke({"risky": True})
print(answer["result"], answer["reason"])
```

这里真正发生状态修改的是 `update`。`goto` 只负责安排后续位置，不会自动替换整个 State。TypeScript 的 `ends` 和 Python 返回类型中的节点名，则声明可能的动态目标，具体用途要结合各语言实现理解。

![一份 Command 怎样让后继读到原因？](https://note.lgdsunday.club/img/Q640/02-langgraph-command-conditional-edges.webp)

### 为什么加一条普通边，会多跑一个节点？

现在，假设再写一条 `choose` 到 `auto` 的普通边。高风险任务返回 Command，动态目标是 manual；普通边依然把 auto 安排出去。于是两个后继都可能执行。

它们恰好都写 `result` 时，如果没有合适的合并方式，就可能出现并发更新错误。即使加了 Reducer，不再报错，也没有解决“本来只想走人工”的路由错误。

这也是为什么不能见到状态冲突就立刻补 Reducer。先检查哪些节点被安排运行，再确认它们是否真的应该并行。

![goto 不会覆盖那条普通边](https://note.lgdsunday.club/img/Q640/03-langgraph-command-conditional-edges.webp)

### 怎样验证路由没有多走？

分别传入高风险和普通任务，记录实际进入的节点。除了检查最终 result，还要断言另一分支没有执行；原因字段也应和路线一致。

再故意给 choose 加上额外静态边，观察它是否触发另一个分支。这个反例能够帮助我们确认，Command 的动态跳转与静态路径是叠加关系。示例运行范围与实际版本保存在参考资料，不能用这个小图证明业务审批已经可靠。

## 面试官继续追问

### 用 Command 就不用定义任何边了吗？

仍然需要明确入口、结束位置和其他节点之间的连接。只是返回 Command 的这个路由点，可以由动态目标决定下一步，不必再额外加一条重复的普通后继边。

### Command(resume=...) 也是同一回事吗？

它用于中断恢复的输入场景，和节点返回 update/goto 的用途不同。本题讨论动态路由，不能把返回一个 Command 直接理解成人工审批或恢复已经实现。

### 想让两个分支都执行，可不可以用 goto？

可以按 API 支持的目标形式安排多个后继，但需要明确并行是否符合业务要求，以及共享字段怎样合并。路径都执行完和业务结果已经正确，仍需要分别检查。

## 面试速记卡

> - 条件边把路由逻辑放在节点之后，Command 可以把更新与路由一起返回。
> - update 更新状态，goto 安排动态后继，两者职责不同。
> - 动态路径不会覆盖已有静态边，混用可能使两个分支都执行。
> - 先检查不该发生的并行，再决定是否需要 Reducer。
> - 测试不仅检查结果，还要确认哪些节点实际运行过。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
