# 百度AI应用开发面试真题及答案 · Sunday面试指南

[全部公司真题](./README.md) · [在线阅读](https://note.lgdsunday.club/companies/baidu/ai-application/)

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

## 大模型基础面试题

- [余弦相似度、点积和欧氏距离有什么区别？向量检索应该怎么选？](../llm/q431-cosine-dot-product-euclidean-distance.md)
  用二维向量比较余弦、点积和欧氏距离，解释长度、方向、归一化等价条件与分数方向，并说明向量检索度量的选型方法。

## Agent面试题

- [什么是 Tool Calling？大模型是如何调用外部工具的？](../agent/q004-tool-calling-execution-flow.md)
  Tool Calling 并不是大模型自己去执行某个工具，而是模型和应用之间约定的一套调用方式。应用会先把工具名称、用途和参数结构告诉模型。模型判断需要使用工具时，会返回一份结构化的调用请求，里面通常包含工具名称、参数和调用标识。
- [Agent 如何规划任务？什么时候需要重新规划？](../agent/q029-agent-planning-replanning.md)
  Agent 做计划，是为了把复杂任务拆成可验证的阶段，避免拿到一个工具结果就漫无目的地调用下一个工具。计划里应有当前假设、下一步要取的证据和完成条件。但计划不能锁死执行路径。
- [Agent 如何选择和加载 Skill？](../agent/q059-skill-selection-loading.md)
  Agent 使用 Skill，一般可以分为发现、选择和加载。应用先提供名称、描述等简要信息；模型判断当前任务需要哪些 Skill，再读取对应的完整说明和必要材料。

## 后端面试题

- [Python 装饰器是什么？functools.wraps 为什么不能随便省略？](../backend/q155-python-decorator.md)
  Python 装饰器接收一个函数或其他可装饰对象，返回处理后的对象。对函数来说，@decorator 可以理解为定义完成后执行 func = decorator(func)。

## 系统设计面试题

- [工厂模式和策略模式有什么区别？如何配合管理多种实现？](../fullstack-system-design/q361-factory-vs-strategy-pattern.md)
  工厂模式和策略模式有什么区别？如何配合管理多种实现？工厂负责准备实现，策略负责替换行为，两者可以沿明确接口配合。讲清两种模式的职责划分与协作方式。

