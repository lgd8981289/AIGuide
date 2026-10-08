# 百度Agent开发面试真题及答案 · Sunday面试指南

[全部公司真题](./README.md) · [在线阅读](https://note.lgdsunday.club/companies/baidu/agent/)

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

## RAG面试题

- [RAG 文档切片越小越好吗？Chunk Size 应该怎么选？](../rag/q017-rag-chunking.md)
  RAG 切片不是越小越好。小块通常更聚焦，检索时容易定位到某句话，但可能把主规则、前提和例外拆开；大块能保留更多上下文，却可能混入无关内容，增加重排和模型输入的负担。
- [RAG 混合检索怎么做？关键词与向量检索的融合](../rag/q023-hybrid-retrieval.md)
  RAG 用混合检索，主要是因为关键词和向量检索擅长的题不一样。像 E_CONN_RESET 这样的错误码、订单号或条款编号，关键词匹配通常更直接；用户把原文换一种说法来问时，向量检索又更容易找到语义相近的片段。

## Agent面试题

- [Agent 的长期记忆怎么设计？用户改口后，旧记忆怎么办？](../agent/q060-agent-long-term-memory.md)
  Agent 的长期记忆，是把跨会话仍然有用的信息保存下来，并在后续任务需要时取用，不是把所有聊天都永久保存。设计时，我会给记忆记录用户、适用范围、来源、更新时间和有效状态。
- [MCP 的 stdio 和 Streamable HTTP 有什么区别？“流式”到底指什么？](../agent/q071-mcp-transport.md)
  stdio 和 Streamable HTTP 都是 MCP 的传输方式，区别主要是 Client 和 Server 怎样连接、怎样交换消息。

## AI应用工程面试题

- [Agent 任务中断后如何恢复？Checkpoint 与幂等设计](../engineering/q065-agent-task-failure-recovery.md)
  Agent 故障恢复不能只保存聊天记录。需要持久化任务标识、运行状态、已完成步骤、待处理动作和必要的结果引用，重启后才知道从哪里接着做。恢复时，执行器先取得任务的执行权，再读取最后保存的状态。已确认完成的步骤可以复用结果；
- [Agent 执行越来越慢，应该怎么定位性能瓶颈？](../engineering/q067-agent-performance-bottleneck.md)
  Agent 执行变慢，不能直接判断是大模型的问题，需要先把一次任务的耗时拆开。例如，用户提交任务后，可能先在队列里等待。开始执行以后，又会经历模型判断、工具调用和多轮重试。

