# 腾讯AI应用开发面试真题及答案 · Sunday面试指南

[全部公司真题](./README.md) · [在线阅读](https://note.lgdsunday.club/companies/tencent/ai-application/)

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

## RAG面试题

- [RAG 知识库里的文档更新、删除后，为什么还会搜到旧答案？](../rag/q025-knowledge-base-update-delete.md)
  RAG 的文档通常会被解析、切片、生成向量，再写入检索索引。修改源文件只完成了第一步，旧片段可能还留在索引、搜索副本或缓存里，所以用户仍会搜到旧答案。我会给文档和片段带上稳定 ID、版本和有效状态。

## Agent面试题

- [单 Agent 和多 Agent 应该怎么选？什么时候才需要 Handoff？](../agent/q018-single-vs-multi-agent.md)
  我不会默认把任务拆成多个 Agent。先用单 Agent 加明确工具，看看它是否已经能稳定完成任务。如果主要问题只是步骤多，未必需要多 Agent；真正值得拆分的，往往是专业上下文、工具权限或对话责任需要分开。
- [Agent 调用工具超时了，可以直接重试吗？](../agent/q028-tool-timeout-retry-idempotency.md)
  Agent 调用工具超时后能否重试？区分查询与写入操作，理解结果未知、退避重试、幂等键和状态核对，避免重复创建工单等副作用，附面试速答。

## AI应用工程面试题

- [Agent 任务中断后如何恢复？Checkpoint 与幂等设计](../engineering/q065-agent-task-failure-recovery.md)
  Agent 故障恢复不能只保存聊天记录。需要持久化任务标识、运行状态、已完成步骤、待处理动作和必要的结果引用，重启后才知道从哪里接着做。恢复时，执行器先取得任务的执行权，再读取最后保存的状态。已确认完成的步骤可以复用结果；

## 计算机基础面试题

- [BFS 和 DFS 有什么区别？什么时候能用 BFS 求最短路径？](../cs-basics/q205-bfs-vs-dfs.md)
  BFS 按距离起点的层次扩展，常用队列；DFS 沿分支深入再回退，用递归栈或显式栈。邻接表下完整遍历常见复杂度都是 O(V+E)。在无权图或各边等权的情况下，BFS 可以找最少边数的路径；

