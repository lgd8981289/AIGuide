# 字节Agent开发面试真题及答案 · Sunday面试指南

[全部公司真题](./README.md) · [在线阅读](https://note.lgdsunday.club/companies/bytedance/agent/)

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

## Agent面试题

- [什么是 Tool Calling？大模型是如何调用外部工具的？](../agent/q004-tool-calling-execution-flow.md)
  Tool Calling 并不是大模型自己去执行某个工具，而是模型和应用之间约定的一套调用方式。应用会先把工具名称、用途和参数结构告诉模型。模型判断需要使用工具时，会返回一份结构化的调用请求，里面通常包含工具名称、参数和调用标识。
- [Agent 上下文太长怎么办？压缩与关键信息保留](../agent/q056-agent-context-compression.md)
  Agent 的上下文压缩，不能只是把聊天记录缩写一遍。因为后面的执行依赖前面留下的目标、限制、证据和进度，漏掉其中一项，任务就可能走偏。因此，我会先把这些内容分开处理：当前目标和操作限制单独保留；已经完成的过程整理成摘要；
- [Agent Harness 是什么？模型之外的执行与状态管理](../agent/q057-agent-harness.md)
  Agent Harness 可以理解为围绕模型搭建的一套运行系统。模型负责根据当前信息做判断，Harness 则负责把需要的信息交给模型、执行允许的工具调用，再把结果送回去。
- [Computer Use 是什么？Agent 如何看懂页面并操作电脑？](../agent/q070-computer-use.md)
  Computer Use 是让 Agent 通过电脑界面完成任务的一种方式。模型可以读取截图，判断当前页面，并提出点击、输入、滚动等操作；真正操作鼠标和键盘的，仍然是应用中的执行工具。

## AI应用工程面试题

- [AI 文件解析与建索引的异步任务怎么设计？](../engineering/q012-async-file-parsing-indexing.md)
  文件上传和解析建索引要分开。上传接口把文件可靠保存下来，再创建一条任务，返回文件 ID、任务 ID 和当前状态；OCR、切片、Embedding、写索引由后台 Worker 执行。
- [大模型结构化输出怎么校验？JSON 入库与失败处理](../engineering/q019-structured-output-validation.md)
  合法 JSON 不能直接入库。它只说明语法上能解析；即使用 JSON Schema 约束了字段和类型，也只能说明结构符合预期，不能证明金额、订单归属和业务条件正确。我会把链路分几关：先检查模型调用是否完成、有没有拒答或截断；再做结构校验；
- [Agent 执行越来越慢，应该怎么定位性能瓶颈？](../engineering/q067-agent-performance-bottleneck.md)
  Agent 执行变慢，不能直接判断是大模型的问题，需要先把一次任务的耗时拆开。例如，用户提交任务后，可能先在队列里等待。开始执行以后，又会经历模型判断、工具调用和多轮重试。

## 数据库与缓存面试题

- [MySQL 索引为什么用 B+ 树？与 B 树、哈希索引有什么区别？](../database/q087-b-plus-tree-index.md)
  这里通常讨论的是 InnoDB 的常见索引，不能把所有 MySQL 索引都说成同一种结构。B+ 树内部节点主要保存键和指向下一层的指针，一个页能容纳较多分支，因此树通常较矮。

