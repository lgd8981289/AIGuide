# LangGraph 如何实现流式输出？messages、updates、values 有什么区别？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/langchain/q388-langgraph-streaming-modes/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：LangGraph 的流式输出，直接选 messages 就行吗？

🙋‍♂️ 我：如果要逐步展示模型生成的文字，可以使用 messages。

🧑‍💻 面试官：检索节点没有调用模型，页面怎么知道检索结束了？为什么 updates 里又出现一份完整答案？

🙋‍♂️ 我：模型片段与节点状态更新不是一回事，需要按事件用途分开处理。

🧑‍💻 面试官：那收到 values 后，把里面的答案再追加到页面，是不是会重复？浏览器断线了，这些事件还能自动补回来吗？

> 先决定页面需要什么：模型正在说的话、节点刚改了什么，还是当前整份状态。三者不能当成同一种文本流。

## 面试速答（60 秒版）

LangGraph 可以在执行过程中输出不同类型的数据。messages 主要提供模型调用产生的消息片段和元数据，适合逐步展示文字；updates 提供节点完成相应执行后返回的状态更新，适合展示步骤结果；values 提供每一步后的完整状态。

例如一个检索再回答的图，检索节点完成后，可以从 updates 看见文档更新；回答节点调用模型时，可以从 messages 展示文字；需要查看整份图状态时，再使用 values。

因此，前端不能把所有输出都追加到答案里。文字增量、节点结果和完整状态，应该进入不同的处理逻辑，还要过滤节点来源及不适合公开的数据。

同时，这些是图运行时的输出方式，不自动等于浏览器的 SSE 协议、持久化事件日志或断线补发机制。接入产品时，还需要单独设计传输、任务标识、结束和失败事件。

![一次检索回答图的模型片段、节点更新和完整状态进入不同消费区域](https://note.lgdsunday.club/img/Q388/01-stream-modes-overview.webp)

## 知识点详解：一次图执行，为什么会有三种输出？

### 先看一个检索再回答的图

假设图里有 retrieve 和 answer 两个节点。状态包含 question、documents 和 answer 三个字段。

retrieve 查到资料后，返回 documents 的更新。接着 answer 使用问题和资料调用模型，最后返回完整的 answer。

在模型生成期间，用户可以已经看到一些文字。但此时节点还没有返回最终状态更新。这是理解 messages 与 updates 时间差的关键。

一个没有模型调用的普通节点，也可以产生状态更新；不能因为没有 Token，就认为图没有执行。

### messages 里面，一定只有可展示文字吗？

它携带消息片段及元数据。元数据可以帮助确认来源节点或调用标签，消息内容则可能不只是一段字符串，还可能涉及内容块或工具调用信息。

因此，接到数据以后，要按当前模型与消息格式处理。多次模型调用时，还要区分谁属于最终回答，谁只是内部分类或工具选择。

这里的 messages 是流模式名称，不代表它只能来自状态中名叫 messages 的字段。

### updates 与 values，差别在哪里？

retrieve 返回的更新可以示意为：

```json
{"retrieve": {"documents": ["文档A"]}}
```

对应的完整状态则可能是：

```json
{"question": "怎么迁移配置？", "documents": ["文档A"], "answer": ""}
```

updates 告诉调用方某个节点返回了什么更新；values 展示经过图状态合并后的完整结果。字段使用什么 reducer，会影响更新怎样合并进状态。

如果更新是追加列表，就不能把它当成全量替换；反过来，收到完整状态也不能把整个答案再追加一次，否则可能出现重复内容。

同一步有多个节点更新时，还要遵循框架实际事件语义，别把任意到达顺序当成稳定的业务顺序。

![updates是节点提交的增量values是reducer后的完整状态](https://note.lgdsunday.club/img/Q388/02-updates-values-reducer.webp)

### TypeScript 和 Python，怎么消费文字流？

下面只展示消费片段。前提是已有编译后的 graph、匹配状态结构的 inputs，以及名为 answer 的模型节点；不是复制即可独立运行的完整项目。

TypeScript 使用官方 JavaScript SDK。Python 使用 LangGraph 1.1 及以后支持的 v2 流格式。参数名与外层数据形状不同，不能逐字互换，核验依据是 [JavaScript 文档](https://docs.langchain.com/oss/javascript/langgraph/streaming) 与 [Python 文档](https://docs.langchain.com/oss/python/langgraph/streaming)。

#### TypeScript

```ts
for await (const [part, metadata] of await graph.stream(inputs, {
  streamMode: "messages",
})) {
  if (
    metadata.langgraph_node === "answer" &&
    typeof part.content === "string"
  ) {
    process.stdout.write(part.content);
  }
}
```

#### Python

```python
async for event in graph.astream(
    inputs, stream_mode="messages", version="v2"
):
    if event["type"] != "messages":
        continue
    part, metadata = event["data"]
    if (
        metadata.get("langgraph_node") == "answer"
        and isinstance(part.content, str)
    ):
        print(part.content, end="", flush=True)
```

这两个片段只消费选定节点的字符串内容。实际模型使用结构化内容块时，需要对应解析，不能悄悄丢掉后还声称答案完整。

旧版 Python 输出形状可能不同。升级后要检查自己是否明确选择了 v2，以及业务代码使用的是哪一种结构。

### 放进网页，为什么还要一层事件协议？

SDK 迭代器运行在服务端或调用方进程里。浏览器需要通过 SSE、WebSocket 或其他方式收到产品层事件。

应用可以把允许公开的消息片段转成 answer\_delta，把节点进度转成 step\_update，再明确发送完成或失败。内部完整状态、工具参数和敏感资料不能直接全量透传。

断线恢复则需要任务身份和保存策略。图状态持久化与网页文字事件补发，也不是同一件事。是否补发、从哪里继续、怎样去重，要按产品协议设计。

## 面试官继续追问

![LangGraph流片段需由应用映射为浏览器事件且持久化独立](https://note.lgdsunday.club/img/Q388/03-graph-browser-events.webp)

### 为什么节点里调用 invoke，也可能收到 messages？

在支持的 LangChain 模型集成中，图的消息流机制可以捕获模型调用的流事件。是否可用还要看集成与配置，不能认为只有手写 model.stream 才能流式输出。

### 检索百分之多少完成，用哪种模式？

如果需要节点内部自定义进度，可以使用 custom 等适合的机制。updates 通常不能代替节点运行中每一小步的自定义进度。

### 怎么验证页面没有重复或泄露内容？

准备多个模型节点、工具调用、空片段和失败情况，检查最终文字与应公开结果一致。再核对状态快照不会重复追加，内部节点内容不会误进入用户回答。

## 面试速记卡

> - messages 是模型片段与元数据，不是整份图状态。
> - updates 看节点更新，values 看合并后的完整状态。
> - 节点返回完整答案，不代表页面应该再追加一次。
> - 按节点与内容类型过滤，不把内部状态全量透传。
> - TS 与 Python 的参数和输出封装，需要按版本核对。
> - SDK 流、网络传输、持久化和断线恢复分别设计。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
