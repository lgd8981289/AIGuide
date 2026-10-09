# 快手AI应用开发面试真题及答案 · Sunday面试指南

[全部公司真题](./README.md) · [在线阅读](https://note.lgdsunday.club/companies/kuaishou/ai-application/)

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

## 大模型基础面试题

- [大模型为什么会产生幻觉？把 Temperature 调到 0 能解决吗？](../llm/q010-hallucination-temperature.md)
  大模型的幻觉，简单说就是它给出了看似合理、却没有事实依据或者与已有证据冲突的内容。比如知识库根本没有今年的报销标准，它却报出一个具体金额。把 Temperature 调到 0，通常会让采样结果更集中、更稳定，但不会帮模型核实事实。

## RAG面试题

- [RAG 文档切片越小越好吗？Chunk Size 应该怎么选？](../rag/q017-rag-chunking.md)
  RAG 切片不是越小越好。小块通常更聚焦，检索时容易定位到某句话，但可能把主规则、前提和例外拆开；大块能保留更多上下文，却可能混入无关内容，增加重排和模型输入的负担。
- [向量数据库是怎么快速检索的？HNSW 和 IVF 有什么区别？](../rag/q068-hnsw-vs-ivf.md)
  向量检索最直接的做法，是把查询向量和全部文档向量比较，再选出最接近的几个结果。数据量大以后，这样的全量扫描可能比较慢，因此会使用近似最近邻索引。HNSW 把向量组织成分层的邻近图。

## Agent面试题

- [什么是 Tool Calling？大模型是如何调用外部工具的？](../agent/q004-tool-calling-execution-flow.md)
  Tool Calling 并不是大模型自己去执行某个工具，而是模型和应用之间约定的一套调用方式。应用会先把工具名称、用途和参数结构告诉模型。模型判断需要使用工具时，会返回一份结构化的调用请求，里面通常包含工具名称、参数和调用标识。
- [Agent 的 Context、Memory 和 State 有什么区别？](../agent/q007-context-memory-state.md)
  Context 可以理解成这一轮真正交给模型看的信息。用户刚说的话、任务目标、最近的工具结果，都可能放进去；但系统保存过的内容，不代表模型这一轮一定看到了。State 记录的是任务现在进行到哪里。
- [Agent 的长期记忆怎么设计？用户改口后，旧记忆怎么办？](../agent/q060-agent-long-term-memory.md)
  Agent 的长期记忆，是把跨会话仍然有用的信息保存下来，并在后续任务需要时取用，不是把所有聊天都永久保存。设计时，我会给记忆记录用户、适用范围、来源、更新时间和有效状态。
- [ReAct 和 CoT 有什么区别？为什么一步步推理不等于 Agent？](../agent/q096-react-vs-cot.md)
  CoT，也就是思维链，主要是让模型通过中间推理步骤来解决问题。它本身不要求连接工具，也不保证能拿到新的外部信息。ReAct 则把推理和行动交替安排。模型根据当前信息决定做什么，应用执行工具，把实际结果交回来，模型再判断下一步。

## AI应用工程面试题

- [vLLM 为什么快？PagedAttention 和连续批处理分别解决什么问题？](../engineering/q083-vllm-inference-serving.md)
  vLLM 是大模型推理服务系统，它的性能来自多项设计，不能只归因于一个算子。PagedAttention 的核心思路，是把 KV Cache 按块管理，再用映射找到请求需要的缓存，减少大块连续预留和碎片带来的浪费。

## LangChain生态面试题

- [LangGraph 的 Checkpointer 和 Store 有什么区别？](../langchain/q038-checkpointer-vs-store.md)
  LangGraph 的 Checkpointer 保存图在某个 thread 上的状态快照，适合对话续接、暂停后恢复、查看执行历史。使用时需要稳定的 thread_id；换了 thread_id，就不是继续原任务。
- [LangChain、LangGraph 和自研 Agent 应该怎么选？](../langchain/q063-agent-framework-selection.md)
  这三个选择并不是按“简单、中等、复杂”排成一条线。LangChain 提供比较高层的模型、工具和 Agent 组织方式，它的 Agent 底层使用 LangGraph；LangGraph 则让我们更直接地定义状态、节点和执行路径。

## 后端面试题

- [Python 装饰器是什么？functools.wraps 为什么不能随便省略？](../backend/q155-python-decorator.md)
  Python 装饰器接收一个函数或其他可装饰对象，返回处理后的对象。对函数来说，@decorator 可以理解为定义完成后执行 func = decorator(func)。

## 计算机基础面试题

- [GET 和 POST 有什么区别？安全性、幂等性和参数位置该怎么理解？](../cs-basics/q194-get-vs-post.md)
  GET 的语义是获取目标资源的表示，POST 是让目标资源按自己的规则处理提交的内容。参数放在哪里，不是二者的定义。GET 属于安全、幂等的方法。这里安全指客户端没有请求改变资源状态，不是密码传输安全；
- [最长无重复子串怎么用滑动窗口实现？为什么左边界只能向前移动？](../cs-basics/q332-longest-substring-without-repeating.md)
  最长无重复子串怎么用滑动窗口实现？为什么左边界只能向前移动？重复字符只影响当前窗口，已经离开窗口的位置不能把左边界拉回去。讲清窗口收缩的判断依据。

