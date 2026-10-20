# LangGraph 如何清空带 reducer 的状态？Overwrite 和普通更新有什么区别？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/langchain/q704-langgraph-overwrite-reset-reducer-state/) · [题库目录](../../README.md)

*下面是一段用于讲题的模拟面试对话。*

🧑‍💻 面试官：检索结果用追加 reducer 保存，现在想开始新一轮，返回 `results: []` 能清空吗？

🙋‍♂️ 我：如果 reducer 是列表拼接，旧列表加空列表，结果还是旧列表。

🧑‍💻 面试官：那不改 reducer，能不能只在这一次重置？

🙋‍♂️ 我：可以用 Overwrite，让这次更新绕过 reducer，直接替换字段值。

🧑‍💻 面试官：如果两个并行节点同时重置同一个字段，谁最后写入就听谁的吗？

> 要清空状态，先看更新会不会经过 reducer；要并发重置，再看这一轮谁负责最终决定。

## 面试速答（60 秒版）

LangGraph 的字段如果配置了追加 reducer，普通更新会与已有值合并。返回空列表只是“追加零项”，不能清空旧数据。

Overwrite 用来显式跳过该字段的 reducer，直接设置新值。比如把一个检索结果列表重置为空，再让后面的节点重新追加本轮资料。

它只影响本次更新，不会永久删除 reducer，也不表示旧检查点中的内容被物理删除。同一 super-step 对同一字段出现多个 Overwrite，会产生冲突，不能依赖节点完成先后来决定谁覆盖谁。

因此，重置最好交给单独的串行节点，或者先汇总并行结果，再由一个节点统一替换。普通合并、一次替换、历史数据删除，是三件不同的事。

![空列表是追加，Overwrite 才是替换](https://note.lgdsunday.club/img/Q704/01-overwrite-overview.webp)

## 知识点详解：为什么空列表没有清空旧结果？

### reducer 处理的是“旧值加本次更新”

假设当前结果是 `[旧资料]`，reducer 的逻辑是把左右两个列表拼起来。节点返回 `[新资料]` 后，就得到 `[旧资料, 新资料]`。

同样的规则放到空列表上，结果自然还是 `[旧资料]`。框架没有把空列表理解成“清空命令”，它只是照着开发者提供的 reducer 合并了一次。

因此，遇到状态没清掉时，先检查字段的更新规则，别急着怀疑 Checkpointer 读到了缓存。默认替换字段和追加字段，对同一个输入会有不同结果。[官方 reducer 说明](https://docs.langchain.com/oss/python/langgraph/graph-api#reducers)给出了这层机制。

### 用 Overwrite 表达一次明确的替换

下面的图先做一次空追加，再做一次显式重置。运行输出可以看到，两次更新并不等价。

#### TypeScript

```ts
import {
  Annotation, StateGraph, START, END, Overwrite,
} from "@langchain/langgraph";

const State = Annotation.Root({
  items: Annotation<string[]>({
    reducer: (oldValue, update) => oldValue.concat(update),
    default: () => [],
  }),
});

const graph = new StateGraph(State)
  .addNode("appendEmpty", () => ({ items: [] }))
  .addNode("clear", () => ({ items: new Overwrite<string[]>([]) }))
  .addEdge(START, "appendEmpty")
  .addEdge("appendEmpty", "clear")
  .addEdge("clear", END)
  .compile();

async function main() {
  const stream = await graph.stream(
    { items: ["old"] }, { streamMode: "values" },
  );
  for await (const state of stream) console.log(state.items);
  // ["old"] → ["old"] → []
}
main();
```

#### Python

```python
import operator
from typing import Annotated, TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.types import Overwrite

class State(TypedDict):
    items: Annotated[list[str], operator.add]

graph = (
    StateGraph(State)
    .add_node("append_empty", lambda s: {"items": []})
    .add_node("clear", lambda s: {"items": Overwrite([])})
    .add_edge(START, "append_empty")
    .add_edge("append_empty", "clear")
    .add_edge("clear", END)
    .compile()
)
for state in graph.stream({"items": ["old"]}, stream_mode="values"):
    print(state["items"])
# ['old'] → ['old'] → []
```

本次在 JS LangGraph 1.5.0、Python LangGraph 1.2.15 中验证了这三个快照。注意 JS 构造器直接接收新值，写成 `new Overwrite({ value: [] })` 会把那个对象当作新值，结果与清空列表完全不同。

### 清空以后，后面的更新还会合并吗？

会。Overwrite 只是让当前这次写入走替换语义，没有修改字段原来的 reducer。

假设重置后，下一个节点返回 `[本轮资料]`，字段仍按追加规则得到 `[本轮资料]`。这很适合分阶段工作，阶段开始时清理工作列表，阶段内部继续积累结果。

不过，直接在拿到的状态列表上调用 `clear()`，又不返回更新，是另一种做法。不要依赖就地修改来表达图状态变化；明确返回更新，执行轨迹和恢复行为才更容易检查。

![只替换这一次，后面仍能追加](https://note.lgdsunday.club/img/Q704/02-overwrite-once.webp)

### 并行节点不能各自抢着重置

同一步里，两个分支可能同时完成。如果都对 `items` 返回 Overwrite，这个字段就出现两个“我要替换最终值”的决定。

LangGraph 对同一 super-step 中同一通道的多个 Overwrite 会报冲突，而不是提供业务可依赖的“最后写入获胜”。对应限制也可以在 [Overwrite API](https://reference.langchain.com/python/langgraph/types/Overwrite)核对。

可以把重置节点放在分叉之前。也可以让分支各自返回带来源的信息，汇总节点按明确规则筛选，再做一次替换。关键是让同一轮的重置责任只有一处，而不是靠调度运气。

![并行重置，先统一谁来决定](https://note.lgdsunday.club/img/Q704/03-overwrite-conflict.webp)

### 清空当前状态，不等于删除历史

配置持久化以后，重置通常产生一个新的状态版本。之前的检查点、日志、Trace 和长期存储中，可能仍保存着旧内容。

如果需求是删除个人敏感数据，就需要沿存储链路处理保留策略、历史记录和备份，不能给当前列表返回一个空值就宣布完成删除。

## 面试官继续追问

### 不使用 Overwrite，可以自定义一个带清空标记的 reducer 吗？

可以，但要把更新类型、清空优先级和并发语义定义完整。已有公开机制能够表达时，通常更容易让维护者读懂，不必再发明隐式的特殊值约定。

### 只想删除列表中的一项呢？

需要看字段的具体语义。普通列表可以重新计算保留项后替换；消息状态还有自己的消息合并与删除机制，不能把所有列表都当成同一种数据。

### 重置字段以后，任务也就重新开始了吗？

不一定。路由、其他状态字段和下一执行节点仍按图规则决定。清空一个列表，不会自动重置整个工作流。

## 面试速记卡

> - 追加 reducer 下，空列表表示追加零项，不表示清空。
> - Overwrite 显式绕过本次 reducer，直接替换字段值。
> - 一次替换不会永久移除 reducer。
> - 同一步同一字段多个 Overwrite 会冲突，应统一重置责任。
> - 当前状态清空，不等于检查点、日志和历史数据都已删除。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
