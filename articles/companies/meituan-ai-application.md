# 美团AI应用开发面试真题及答案 · Sunday面试指南

[全部公司真题](./README.md) · [在线阅读](https://note.lgdsunday.club/companies/meituan/ai-application/)

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

## 大模型基础面试题

- [大模型为什么会产生幻觉？把 Temperature 调到 0 能解决吗？](../llm/q010-hallucination-temperature.md)
  大模型的幻觉，简单说就是它给出了看似合理、却没有事实依据或者与已有证据冲突的内容。比如知识库根本没有今年的报销标准，它却报出一个具体金额。把 Temperature 调到 0，通常会让采样结果更集中、更稳定，但不会帮模型核实事实。

## RAG面试题

- [RAG 混合检索怎么做？关键词与向量检索的融合](../rag/q023-hybrid-retrieval.md)
  RAG 用混合检索，主要是因为关键词和向量检索擅长的题不一样。像 E_CONN_RESET 这样的错误码、订单号或条款编号，关键词匹配通常更直接；用户把原文换一种说法来问时，向量检索又更容易找到语义相近的片段。
- [RAG 多轮对话怎么检索？追问理解与 Query 改写](../rag/q042-rag-multi-turn-followup.md)
  多轮 RAG 不能只拿用户最后一句话去检索，因为“企业版呢”“这个怎么开通”这样的追问，单独看并不完整。一种常见做法是，先结合相关聊天记录，把当前问题补成能够独立理解的检索问题。
- [RAG 查询分解和 Multi-Query 有什么区别？复杂问题应该怎么拆开检索？](../rag/q428-rag-query-decomposition-multi-query.md)
  通过比较任务与依赖任务，区分 RAG 查询分解和 Multi-Query，讲清子问题生成、检索依赖、证据合并与延迟预算。

## Agent面试题

- [MCP 和 Tool Calling 有什么区别？](../agent/q008-mcp-vs-tool-calling.md)
  MCP 和 Tool Calling 并不是二选一。Tool Calling 是模型提出工具调用的方式：应用告诉模型有哪些工具，模型返回想调用的工具和参数，真正执行仍然由应用处理。MCP 则是 AI 应用连接外部能力的一套协议。
- [Agent 如何规划任务？什么时候需要重新规划？](../agent/q029-agent-planning-replanning.md)
  Agent 做计划，是为了把复杂任务拆成可验证的阶段，避免拿到一个工具结果就漫无目的地调用下一个工具。计划里应有当前假设、下一步要取的证据和完成条件。但计划不能锁死执行路径。
- [Agent 为什么选错工具？工具定义与动态筛选](../agent/q043-agent-tool-selection.md)
  Agent 的工具不是越多越好。工具多了，模型可以处理更多类型的任务，但如果把大量相似的工具定义一次性放进去，也会增加输入长度，让选择变得更容易混淆。
- [Agent Skill 和 MCP 有什么区别？](../agent/q050-skill-vs-mcp.md)
  Agent Skill 通常是一份可复用的任务说明包，里面有适用场景、处理步骤，也可以附带脚本、模板和参考资料。例如，告诉 Agent 写周报时先检查哪些进展，再按什么格式整理。MCP 是 AI 应用连接外部能力的协议。
- [Agent 如何选择和加载 Skill？](../agent/q059-skill-selection-loading.md)
  Agent 使用 Skill，一般可以分为发现、选择和加载。应用先提供名称、描述等简要信息；模型判断当前任务需要哪些 Skill，再读取对应的完整说明和必要材料。
- [Agent 的长期记忆怎么设计？用户改口后，旧记忆怎么办？](../agent/q060-agent-long-term-memory.md)
  Agent 的长期记忆，是把跨会话仍然有用的信息保存下来，并在后续任务需要时取用，不是把所有聊天都永久保存。设计时，我会给记忆记录用户、适用范围、来源、更新时间和有效状态。
- [ReAct 和 CoT 有什么区别？为什么一步步推理不等于 Agent？](../agent/q096-react-vs-cot.md)
  CoT，也就是思维链，主要是让模型通过中间推理步骤来解决问题。它本身不要求连接工具，也不保证能拿到新的外部信息。ReAct 则把推理和行动交替安排。模型根据当前信息决定做什么，应用执行工具，把实际结果交回来，模型再判断下一步。
- [Agent 意图识别怎么做？什么时候应该先澄清，而不是直接执行？](../agent/q380-agent-intent-recognition.md)
  从含糊指令解释 Agent 意图识别与参数检查，说明何时澄清、怎样绑定候选身份，以及高风险动作为什么仍需权限与确认。

## 计算机基础面试题

- [三数之和怎么去重？排序加双指针为什么能做到 O(n²)？](../cs-basics/q490-three-sum-two-pointers.md)
  提供 TypeScript、Python 三数之和实现，解释排序双指针的移动依据、固定数与命中去重，用重复负数算例说明下标与数值区别及完整复杂度。

