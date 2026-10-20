# LangGraph 的 State、Runtime Context 和 Config 有什么区别？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/langchain/q702-langgraph-state-runtime-context-config/) · [题库目录](../../README.md)

*下面是一段用于讲题的模拟面试对话。*

🧑‍💻 面试官：用户问题、当前租户、数据库连接和 `thread_id`，你会放在 LangGraph 的什么位置？

🙋‍♂️ 我：用户问题放 State。租户身份、服务连接可以通过运行上下文传入；`thread_id` 属于执行配置。

🧑‍💻 面试官：既然都能被节点读到，为什么不全部塞进 State，保存和恢复还方便一些？

🙋‍♂️ 我：State 会参与状态更新和检查点。数据库连接不适合保存，身份也不能直接信任用户提交的字段。

🧑‍💻 面试官：那么，同一个 thread 下次恢复运行时，上次的 Context 会自动回来吗？

> 先问这份数据是“任务进度”“本次运行依赖”，还是“执行配置”，再决定放到哪里。

## 面试速答（60 秒版）

State 是图运行时的任务数据，例如用户问题、检索结果和当前处理状态。节点返回更新，再按各字段的 reducer 合并；配置 Checkpointer 后，状态可以进入检查点。

Runtime Context 用来传本次运行需要、但不作为状态更新保存的依赖，例如经过认证的用户身份、服务客户端或模型选择。节点通过 Runtime 读取，下一次调用时通常仍需要由应用重新提供。

Config 描述这次怎样执行和追踪，例如 `configurable.thread_id`、标签以及递归限制。具体字段位置要按语言 API 使用，不能都塞进 `configurable`。

三者能被代码读取，不代表都会自动发送给模型。是否进入模型输入，要看节点怎样组织消息。不过，Context 也不是权限系统；身份仍要由可信入口提供，工具执行前还要做真实授权。

![State、Context、Config，各放什么](https://note.lgdsunday.club/img/Q702/01-state-context-config.webp)

## 知识点详解：同一次请求里，三类数据走不同的路

### 先拿一次资料查询，把对象摆出来

假设咱们要查询某个租户的一份技术资料。用户说的是“解释文档 A 的部署方式”，应用还知道当前用户属于租户 B。

任务执行中会出现几类信息。问题和查到的片段，需要被后续节点继续处理；租户身份和资料服务客户端，决定这一轮去哪里查、允许查什么；线程标识则帮助 Checkpointer 找到同一个会话的记录。

它们恰好都出现在一次请求里，但生命周期不一样。判断位置时，别只看“能不能传过去”，还要看“谁更新、是否保存、下次能否继续使用”。

### State 保存会变化的任务数据

一个检索节点返回资料片段，下一节点生成回答，这些都属于任务状态的变化。节点可以只返回变动字段，不需要每次复制整个 State。

假设片段字段使用追加 reducer，新返回的一组片段会与已有内容合并。如果本意是替换，就不能以为返回新列表一定会覆盖。状态的更新规则由 Schema 与 reducer 共同决定，详见[Python Graph API](https://docs.langchain.com/oss/python/langgraph/graph-api)。

还要克制保存内容。把数据库连接对象、访问令牌都塞进 State，会增加序列化、泄露和过期风险。为了恢复任务，需要保存的是能够重新建立依赖的信息，而不是把整个运行进程装进检查点。

### Runtime Context 由本次调用重新提供

Context 可以保存应用确认的租户 ID，以及已经准备好的客户端。节点读取它来完成工作，不通过返回状态更新去修改这些运行参数。

这里所说的“运行期间不变”，是设计职责。不要把它理解成任意语言对象都会自动深度冻结，或者传进去的客户端一定没有内部可变状态。并发调用时，仍要避免多个请求共用一个不断改写的身份对象。

下面是有意缩小的调用片段，假设图已经声明相应的上下文 Schema。

#### TypeScript

```ts
await graph.invoke({ query: "document-a" }, {
  context: { userId: "u1" },
  configurable: { thread_id: "conversation-1" },
});
// 节点第二个参数中读取 runtime.context.userId
```

#### Python

```python
graph.invoke(
    {"query": "document-a"},
    {"configurable": {"thread_id": "conversation-1"}},
    context={"user_id": "u1"},
)
# 节点接收 Runtime，通过 runtime.context 读取上下文
# 上述字典写法对应字典型 Context Schema。
```

JS 可使用 Zod 声明上下文，Python 可以使用字典型 Schema 或 dataclass，读取方式随具体类型变化。不要照着示例把字典访问和属性访问混用。[JavaScript Graph API](https://docs.langchain.com/oss/javascript/langgraph/graph-api)介绍了它的上下文入口。

本次在 JS 1.5.0、Python 1.2.15 上验证了“节点读取本次身份、检查点 State 不包含该 Context 字段”。没有调用真实模型，也没有把字符串身份当成真实登录认证。

![恢复进度，重新准备本次依赖](https://note.lgdsunday.club/img/Q702/02-context-rebuild.webp)

### Config 管执行，不是业务数据收纳箱

`thread_id` 用来关联会话与检查点，它只是一个标识，不是访问该会话的凭证。后端必须验证调用人能否访问这个 thread，不能让用户换一个字符串就读到别人的任务。

标签和追踪参数帮助观察执行；递归限制约束运行步数。Python 的 `recursion_limit`、JS 的 `recursionLimit` 放在调用配置顶层，不要误放到 `configurable` 里面。

历史示例可能把业务参数也塞进 Config 的扩展配置。新代码更适合明确声明 Context，把业务依赖和框架执行参数分开。修改旧项目时要检查其真实版本与调用链，而不是只替换字段名。

### 不在 State 里，就一定不会泄露吗？

当然不能这样判断。节点如果把 Context 整体拼进系统提示词，密钥仍会进入模型；调试日志直接打印客户端配置，也可能暴露凭据。

因此，模型需要看到什么，就明确挑选什么。工具需要身份时直接从可信上下文取，返回给模型时只返回允许公开的业务结果。

![节点拿得到，不代表模型该看见](https://note.lgdsunday.club/img/Q702/03-model-input-selection.webp)

## 面试官继续追问

### 同一个 thread 可以切换用户继续调用吗？

框架不会替业务判断这种切换是否合理。通常应把线程归属与租户、用户绑定，先在应用入口鉴权，再读取状态，防止身份与历史记录错配。

### 恢复任务时，需要重建数据库连接吗？

通常需要重新准备本次依赖。保存的任务数据用于恢复进度，运行所需的连接和有效凭据由当前应用环境重新提供，不能指望从检查点复活旧连接。

### State 和 Context 会自动成为模型提示词吗？

不会因为定义了字段就自动让模型看见所有内容。要检查实际组装模型消息的位置，也要检查中间件是否额外注入数据。

## 面试速记卡

> - State 管任务数据与更新，可以进入检查点。
> - Context 管本次运行依赖，通常每次调用重新提供。
> - Config 管线程、追踪和执行限制，不等于业务状态。
> - thread\_id 是定位标识，不是会话访问凭证。
> - 数据放在哪，与是否送给模型、是否通过授权，是不同问题。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
