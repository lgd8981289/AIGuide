# 大模型面试题 · AI Agent / RAG / LangChain 面试题合集

> **379 篇** AI 与大模型面试题。每题都从一个真实的工程场景出发，先还原面试官的追问链路，
> 再给出能落地、经得起追问的答案。
>
> 📖 **在线阅读（全文免费，无需登录）**：<https://note.lgdsunday.club/>

## 专题入口

| 专题 | 题数 | 在线阅读 |
| --- | ---: | --- |
| 大模型基础面试题 | 15 | [大模型基础面试题](https://note.lgdsunday.club/llm/) |
| RAG 面试题 | 18 | [RAG 面试题](https://note.lgdsunday.club/rag/) |
| Agent 面试题 | 26 | [Agent 面试题](https://note.lgdsunday.club/agent/) |
| AI 应用工程面试题 | 18 | [AI 应用工程面试题](https://note.lgdsunday.club/engineering/) |
| 项目与系统设计面试题 | 7 | [项目与系统设计面试题](https://note.lgdsunday.club/system-design/) |
| LangChain 生态面试题 | 9 | [LangChain 生态面试题](https://note.lgdsunday.club/langchain/) |
| 前端面试题 | 92 | [前端面试题](https://note.lgdsunday.club/frontend/) |
| 后端面试题 | 77 | [后端面试题](https://note.lgdsunday.club/backend/) |
| 数据库与缓存面试题 | 50 | [数据库与缓存面试题](https://note.lgdsunday.club/database/) |
| 计算机基础面试题 | 44 | [计算机基础面试题](https://note.lgdsunday.club/cs-basics/) |
| 系统设计面试题（全栈） | 19 | [系统设计面试题（全栈）](https://note.lgdsunday.club/fullstack-system-design/) |
| AI 编程教程 | 4 | [AI 编程教程](https://note.lgdsunday.club/tutorial/) |

其他入口：[首页](https://note.lgdsunday.club/) · [AI 面试题大全](https://note.lgdsunday.club/ai/) · [全栈面试题](https://note.lgdsunday.club/programmer/) · 
[AI 应用开发面试准备路线](https://note.lgdsunday.club/guides/ai-interview/) · [RAG 复习路线](https://note.lgdsunday.club/guides/rag/) · 
[AI 编程实操路线](https://note.lgdsunday.club/guides/ai-coding/) · [Agent 大模型系统课](https://note.lgdsunday.club/agent-course/)

## 大模型基础面试题（15 篇）

1. [大模型为什么会产生幻觉？把 Temperature 调到 0 能解决吗？](https://note.lgdsunday.club/llm/q010-hallucination-temperature/)
2. [大模型长上下文为什么会漏信息？长文档处理与排查](https://note.lgdsunday.club/llm/q011-long-context-missed-info/)
3. [Token 是什么？为什么不能按中文字符数估算上下文和费用？](https://note.lgdsunday.club/llm/q020-token-counting-cost/)
4. [Embedding 是什么？向量相似就代表内容可信吗？](https://note.lgdsunday.club/llm/q021-embedding-similarity/)
5. [做 AI 应用怎么选大模型？为什么排行榜第一不一定适合你的项目？](https://note.lgdsunday.club/llm/q022-llm-selection-evaluation/)
6. [Few-shot Prompting 是什么？示例怎么选、效果怎么测？](https://note.lgdsunday.club/llm/q041-few-shot-prompting/)
7. [LLM-as-a-Judge 是什么？让大模型给答案打分，靠谱吗？](https://note.lgdsunday.club/llm/q045-llm-as-judge/)
8. [大模型首字延迟为什么高？Prefill、Decode 与 KV Cache](https://note.lgdsunday.club/llm/q046-llm-inference-kv-cache/)
9. [LoRA 是什么？为什么只训练少量参数，也能微调大模型？](https://note.lgdsunday.club/llm/q047-lora-finetuning/)
10. [Transformer 的 Attention 是怎么计算的？Q、K、V 分别有什么用？](https://note.lgdsunday.club/llm/q072-attention-qkv/)
11. [SFT、RLHF 和 DPO 有什么区别？大模型后训练到底在训练什么？](https://note.lgdsunday.club/llm/q080-sft-rlhf-dpo/)
12. [MoE 混合专家模型是什么？总参数和激活参数有什么区别？](https://note.lgdsunday.club/llm/q081-moe-mixture-of-experts/)
13. [大模型量化是什么？INT8、INT4 如何影响显存、速度和效果？](https://note.lgdsunday.club/llm/q082-llm-quantization/)
14. [大模型知识蒸馏是什么？与微调、量化有什么区别？](https://note.lgdsunday.club/llm/q084-knowledge-distillation/)
15. [FlashAttention 为什么更快、更省显存？它改变了 Attention 的计算结果吗？](https://note.lgdsunday.club/llm/q085-flash-attention/)

## RAG 面试题（18 篇）

1. [RAG 检索不到知识库里的文档，应该怎么排查？](https://note.lgdsunday.club/rag/q005-rag-no-documents-retrieved/)
2. [RAG 检索正确却回答错误，应该怎么排查？](https://note.lgdsunday.club/rag/q009-rag-retrieved-but-wrong-answer/)
3. [RAG 文档切片越小越好吗？Chunk Size 应该怎么选？](https://note.lgdsunday.club/rag/q017-rag-chunking/)
4. [RAG 混合检索怎么做？关键词与向量检索的融合](https://note.lgdsunday.club/rag/q023-hybrid-retrieval/)
5. [RAG 中 Rerank 是什么？为什么重排不能代替召回？](https://note.lgdsunday.club/rag/q024-rerank/)
6. [RAG 知识库里的文档更新、删除后，为什么还会搜到旧答案？](https://note.lgdsunday.club/rag/q025-knowledge-base-update-delete/)
7. [RAG 系统怎么评测？为什么不能只看答案对不对？](https://note.lgdsunday.club/rag/q026-rag-layered-evaluation/)
8. [RAG 和微调有什么区别？企业知识库应该怎么选？](https://note.lgdsunday.club/rag/q040-rag-vs-finetuning/)
9. [RAG 多轮对话怎么检索？追问理解与 Query 改写](https://note.lgdsunday.club/rag/q042-rag-multi-turn-followup/)
10. [RAG 父子检索是什么？为什么搜小片段，回答时却给大段落？](https://note.lgdsunday.club/rag/q048-parent-child-retrieval/)
11. [RAG 怎么处理 PDF 表格？为什么数字都识别出来了，答案还是错？](https://note.lgdsunday.club/rag/q049-pdf-table-parsing/)
12. [RAG 评测集怎么构建？让大模型自己出题、自己打分靠谱吗？](https://note.lgdsunday.club/rag/q062-rag-evaluation-dataset/)
13. [向量数据库是怎么快速检索的？HNSW 和 IVF 有什么区别？](https://note.lgdsunday.club/rag/q068-hnsw-vs-ivf/)
14. [GraphRAG 是什么？与传统 RAG 有什么区别，什么时候值得用？](https://note.lgdsunday.club/rag/q076-graphrag/)
15. [Agentic RAG 是什么？与传统 RAG 有什么区别？](https://note.lgdsunday.club/rag/q077-agentic-rag/)
16. [RAG 向量数据库怎么选？Milvus、FAISS 和 pgvector 有什么区别？](https://note.lgdsunday.club/rag/q099-vector-database-selection/)
17. [多模态 RAG 是什么？图片和文字应该怎样一起检索？](https://note.lgdsunday.club/rag/q100-multimodal-rag/)
18. [HyDE 是什么？为什么先生成假设文档，可能改善 RAG 检索？](https://note.lgdsunday.club/rag/q101-hyde-hypothetical-document/)

## Agent 面试题（26 篇）

1. [Agent 和 Workflow 有什么区别？实际项目中应该怎么选？](https://note.lgdsunday.club/agent/q001-agent-vs-workflow/)
2. [Agent 工作原理是什么？一次 Agent Loop 如何执行？](https://note.lgdsunday.club/agent/q002-agent-loop/)
3. [什么是 Tool Calling？大模型是如何调用外部工具的？](https://note.lgdsunday.club/agent/q004-tool-calling-execution-flow/)
4. [Agent 的 Context、Memory 和 State 有什么区别？](https://note.lgdsunday.club/agent/q007-context-memory-state/)
5. [MCP 和 Tool Calling 有什么区别？](https://note.lgdsunday.club/agent/q008-mcp-vs-tool-calling/)
6. [单 Agent 和多 Agent 应该怎么选？什么时候才需要 Handoff？](https://note.lgdsunday.club/agent/q018-single-vs-multi-agent/)
7. [Agent 如何防止提示词注入？以网页读取为例](https://note.lgdsunday.club/agent/q027-tool-output-prompt-injection/)
8. [Agent 调用工具超时了，可以直接重试吗？](https://note.lgdsunday.club/agent/q028-tool-timeout-retry-idempotency/)
9. [Agent 如何规划任务？什么时候需要重新规划？](https://note.lgdsunday.club/agent/q029-agent-planning-replanning/)
10. [Agent 任务完成情况怎么评测？结果验证与过程追踪](https://note.lgdsunday.club/agent/q030-agent-task-completion-evaluation/)
11. [Agent 为什么选错工具？工具定义与动态筛选](https://note.lgdsunday.club/agent/q043-agent-tool-selection/)
12. [Agent Skill 和 MCP 有什么区别？](https://note.lgdsunday.club/agent/q050-skill-vs-mcp/)
13. [Agent 执行代码为什么需要沙箱？放进 Docker 就安全吗？](https://note.lgdsunday.club/agent/q051-code-execution-sandbox/)
14. [Agent 上下文太长怎么办？压缩与关键信息保留](https://note.lgdsunday.club/agent/q056-agent-context-compression/)
15. [Agent Harness 是什么？模型之外的执行与状态管理](https://note.lgdsunday.club/agent/q057-agent-harness/)
16. [Agent 如何选择和加载 Skill？](https://note.lgdsunday.club/agent/q059-skill-selection-loading/)
17. [Agent 的长期记忆怎么设计？用户改口后，旧记忆怎么办？](https://note.lgdsunday.club/agent/q060-agent-long-term-memory/)
18. [多 Agent 如何传递上下文？怎样避免信息丢失和相互污染？](https://note.lgdsunday.club/agent/q061-multi-agent-context-passing/)
19. [Agent 调用 MCP 工具时，用户权限应该在哪里校验？](https://note.lgdsunday.club/agent/q064-mcp-tool-auth/)
20. [Agent 的多个工具可以并行调用吗？什么时候必须串行？](https://note.lgdsunday.club/agent/q066-agent-parallel-tool-calls/)
21. [Computer Use 是什么？Agent 如何看懂页面并操作电脑？](https://note.lgdsunday.club/agent/q070-computer-use/)
22. [MCP 的 stdio 和 Streamable HTTP 有什么区别？“流式”到底指什么？](https://note.lgdsunday.club/agent/q071-mcp-transport/)
23. [A2A 协议是什么？它和 MCP 有什么区别？](https://note.lgdsunday.club/agent/q078-a2a-vs-mcp/)
24. [ReAct 和 CoT 有什么区别？为什么一步步推理不等于 Agent？](https://note.lgdsunday.club/agent/q096-react-vs-cot/)
25. [Agent 的 Reflection 反思机制是什么？为什么自查也可能越改越错？](https://note.lgdsunday.club/agent/q097-agent-reflection/)
26. [Agent 强化学习的奖励怎么设计？怎样避免模型只会刷分？](https://note.lgdsunday.club/agent/q103-agent-rl-reward/)

## AI 应用工程面试题（18 篇）

1. [AI 聊天流式输出用 SSE 还是 WebSocket？页面刷新后如何恢复？](https://note.lgdsunday.club/engineering/q006-streaming-output-refresh-recovery/)
2. [AI 文件解析与建索引的异步任务怎么设计？](https://note.lgdsunday.club/engineering/q012-async-file-parsing-indexing/)
3. [大模型结构化输出怎么校验？JSON 入库与失败处理](https://note.lgdsunday.club/engineering/q019-structured-output-validation/)
4. [AI 应用为什么要做模型路由？怎样避免把难题错送给小模型？](https://note.lgdsunday.club/engineering/q031-model-routing/)
5. [Prompt Cache 和答案缓存有什么区别？](https://note.lgdsunday.club/engineering/q032-prompt-cache-answer-cache/)
6. [大模型 API 限流怎么办？排队、重试与降级策略](https://note.lgdsunday.club/engineering/q033-rate-limiting-queue-fallback/)
7. [多租户 AI 应用如何隔离聊天记录和知识库？](https://note.lgdsunday.club/engineering/q034-multi-tenant-data-isolation/)
8. [AI 聊天如何停止生成？后端任务取消与状态处理](https://note.lgdsunday.club/engineering/q044-ai-task-cancellation/)
9. [Prompt 为什么也要做版本管理？线上出错怎么回滚？](https://note.lgdsunday.club/engineering/q052-prompt-versioning/)
10. [AI 生成的代码如何验收？测试、需求与 Diff 审查](https://note.lgdsunday.club/engineering/q058-ai-coding-acceptance/)
11. [Agent 任务中断后如何恢复？Checkpoint 与幂等设计](https://note.lgdsunday.club/engineering/q065-agent-task-failure-recovery/)
12. [Agent 执行越来越慢，应该怎么定位性能瓶颈？](https://note.lgdsunday.club/engineering/q067-agent-performance-bottleneck/)
13. [Python 的 async/await 是怎么工作的？为什么用了异步，接口还是会卡住？](https://note.lgdsunday.club/engineering/q069-async-event-loop/)
14. [MySQL 明明只更新一条记录，为什么还会阻塞其他请求？](https://note.lgdsunday.club/engineering/q073-mysql-update-lock-scope/)
15. [Redis 和数据库如何保持一致？为什么更新数据库后删缓存，仍然可能读到旧数据？](https://note.lgdsunday.club/engineering/q074-cache-database-consistency/)
16. [Kafka 消息交给后台异步处理后，Offset 应该什么时候提交？](https://note.lgdsunday.club/engineering/q075-kafka-consumer-offset/)
17. [vLLM 为什么快？PagedAttention 和连续批处理分别解决什么问题？](https://note.lgdsunday.club/engineering/q083-vllm-inference-serving/)
18. [SWE-bench 是什么？AI 编程 Agent 的跑分能直接比较吗？](https://note.lgdsunday.club/engineering/q102-swe-bench-evaluation/)

## 项目与系统设计面试题（7 篇）

1. [如何设计企业知识库问答系统？文档更新、权限和评测怎么做？](https://note.lgdsunday.club/system-design/q013-enterprise-knowledge-base-design/)
2. [智能客服系统里，RAG、工具调用和人工转接应该怎么配合？](https://note.lgdsunday.club/system-design/q014-ai-customer-service-design/)
3. [AI 编程助手怎么设计？代码检索、修改与测试执行](https://note.lgdsunday.club/system-design/q035-ai-coding-assistant-design/)
4. [Agent Demo 能跑，为什么离生产上线还很远？](https://note.lgdsunday.club/system-design/q036-agent-productionization/)
5. [AI 应用如何灰度发布与回滚？从离线评测到线上验证](https://note.lgdsunday.club/system-design/q053-canary-release-rollback/)
6. [Text2SQL 是什么？如何让大模型准确、安全地查询数据库？](https://note.lgdsunday.club/system-design/q079-text2sql/)
7. [Deep Research Agent 怎么设计？怎样保证研究报告的引用可靠？](https://note.lgdsunday.club/system-design/q098-deep-research-citation-reliability/)

## LangChain 生态面试题（9 篇）

1. [LangGraph 如何实现暂停和恢复？人工审批后从哪里继续执行？](https://note.lgdsunday.club/langchain/q003-langgraph-pause-resume/)
2. [LangGraph 的 State、Node、Edge 各负责什么？](https://note.lgdsunday.club/langchain/q015-langgraph-graph-state/)
3. [LangSmith 的 Trace 和 Evaluation 有什么区别？](https://note.lgdsunday.club/langchain/q016-langsmith-tracing-evaluation/)
4. [LangChain 中 Runnable、Chain、Agent 有什么区别？](https://note.lgdsunday.club/langchain/q037-runnable-chain-agent/)
5. [LangGraph 的 Checkpointer 和 Store 有什么区别？](https://note.lgdsunday.club/langchain/q038-checkpointer-vs-store/)
6. [LangGraph 的 Send 怎么实现动态并行？与普通分支有什么不同？](https://note.lgdsunday.club/langchain/q039-langgraph-send-fanout/)
7. [LangGraph 子图是什么？父图和子图怎么传状态？](https://note.lgdsunday.club/langchain/q054-langgraph-subgraph/)
8. [LangChain Middleware 是什么？和 Tool、Callback 有什么区别？](https://note.lgdsunday.club/langchain/q055-langchain-middleware/)
9. [LangChain、LangGraph 和自研 Agent 应该怎么选？](https://note.lgdsunday.club/langchain/q063-agent-framework-selection/)

## AI 编程教程（4 篇）

1. [Claude Code APP 接入 DeepSeek 教程：安装配置与使用技巧](https://note.lgdsunday.club/tools/t001-claude-code-deepseek/)
2. [WorkBuddy 使用教程：安装配置、Skill 与自动化任务](https://note.lgdsunday.club/tools/t004-workbuddy-guide/)
3. [Codex 如何重构大型旧项目？任务拆分、测试与验收](https://note.lgdsunday.club/practice/t006-github-ai-rewrite/)
4. [GPT-6 Sol、Luna 与 Opus 5.5 怎么选？价格与使用场景](https://note.lgdsunday.club/reviews/t008-gpt-6-sol-luna-opus-5-5/)

<details>
<summary><b>前端面试题（92 篇）</b> — 点击展开全部题目</summary>

1. [JavaScript 事件循环是什么？宏任务、微任务和 async/await 怎么执行？](https://note.lgdsunday.club/frontend/q104-js-event-loop/)
2. [HTTP 强缓存和协商缓存有什么区别？Cache-Control、ETag 和 304 怎么配合？](https://note.lgdsunday.club/frontend/q105-http-browser-cache/)
3. [浏览器为什么会跨域？CORS 预检请求和携带 Cookie 怎么处理？](https://note.lgdsunday.club/frontend/q107-cors-cross-origin/)
4. [React 的 useEffect 怎么工作？依赖数组、清理函数和重复执行如何理解？](https://note.lgdsunday.club/frontend/q108-react-useeffect/)
5. [Vue 3 响应式原理是什么？Proxy、ref 和 reactive 有什么区别？](https://note.lgdsunday.club/frontend/q109-vue3-reactivity/)
6. [JavaScript 闭包是什么？为什么变量没有被释放，什么时候会内存泄漏？](https://note.lgdsunday.club/frontend/q110-js-closure-memory/)
7. [XSS 和 CSRF 有什么区别？HttpOnly、SameSite 和 Token 分别防什么？](https://note.lgdsunday.club/frontend/q111-xss-csrf/)
8. [JavaScript 原型链是什么？new 和继承是怎么实现的？](https://note.lgdsunday.club/frontend/q116-prototype-chain-new/)
9. [JavaScript 的 this 指向谁？箭头函数、call、apply、bind 有什么区别？](https://note.lgdsunday.club/frontend/q117-this-binding/)
10. [JavaScript 深拷贝和浅拷贝有什么区别？structuredClone 能替代 JSON 拷贝吗？](https://note.lgdsunday.club/frontend/q118-deep-shallow-copy/)
11. [防抖和节流有什么区别？搜索框和滚动事件分别怎么选？](https://note.lgdsunday.club/frontend/q119-debounce-throttle/)
12. [Promise.all、allSettled、race、any 有什么区别？失败后其他任务会停止吗？](https://note.lgdsunday.club/frontend/q120-promise-concurrency-methods/)
13. [ES Module 和 CommonJS 有什么区别？循环依赖时会发生什么？](https://note.lgdsunday.club/frontend/q121-esm-vs-commonjs/)
14. [TypeScript 的 type 和 interface 有什么区别？实际项目怎么选？](https://note.lgdsunday.club/frontend/q122-type-vs-interface/)
15. [TypeScript 的 any、unknown、never 有什么区别？](https://note.lgdsunday.club/frontend/q123-any-unknown-never/)
16. [TypeScript 泛型怎么用？keyof 和 infer 如何保留类型信息？](https://note.lgdsunday.club/frontend/q124-typescript-generics/)
17. [CSS 盒模型有什么区别？box-sizing 怎样影响元素宽高？](https://note.lgdsunday.club/frontend/q125-css-box-model/)
18. [BFC 是什么？为什么能解决浮动塌陷和部分外边距重叠问题？](https://note.lgdsunday.club/frontend/q126-bfc-block-formatting-context/)
19. [Flex 和 Grid 有什么区别？一维布局、二维布局怎么选？](https://note.lgdsunday.club/frontend/q127-flex-vs-grid/)
20. [z-index 为什么有时不生效？层叠上下文是怎么决定遮挡顺序的？](https://note.lgdsunday.club/frontend/q128-z-index-stacking-context/)
21. [从输入 URL 到页面显示，浏览器到底经历了什么？](https://note.lgdsunday.club/frontend/q129-browser-navigation-rendering/)
22. [事件冒泡、事件捕获和事件委托有什么区别？](https://note.lgdsunday.club/frontend/q130-dom-event-propagation/)
23. [浏览器重排和重绘有什么区别？怎样减少页面卡顿？](https://note.lgdsunday.club/frontend/q131-reflow-repaint-composite/)
24. [localStorage、sessionStorage、Cookie 和 IndexedDB 怎么选？](https://note.lgdsunday.club/frontend/q132-browser-storage/)
25. [React 的 setState 为什么不能立即读到新值？函数式更新解决什么问题？](https://note.lgdsunday.club/frontend/q133-react-state-update/)
26. [React 的 key 有什么作用？为什么不建议随便用数组下标？](https://note.lgdsunday.club/frontend/q134-react-key-state-reuse/)
27. [React.memo、useMemo、useCallback 有什么区别？什么时候值得用？](https://note.lgdsunday.club/frontend/q135-react-render-cache/)
28. [React Fiber 是什么？为什么渲染可以暂停和继续？](https://note.lgdsunday.club/frontend/q136-react-fiber/)
29. [React Context、Redux 和 Zustand 怎么选？全局状态越多越好吗？](https://note.lgdsunday.club/frontend/q137-react-state-management/)
30. [React Server Components 是什么？和 SSR 有什么区别？](https://note.lgdsunday.club/frontend/q138-react-server-components/)
31. [Vue 的 computed、watch、watchEffect 有什么区别？](https://note.lgdsunday.club/frontend/q139-vue-computed-watch/)
32. [Vue 3 的 v-model 是怎么实现的？自定义组件如何支持双向绑定？](https://note.lgdsunday.club/frontend/q140-vue-v-model/)
33. [Vue 组件通信有哪些方式？props、emit、provide/inject、Pinia 怎么选？](https://note.lgdsunday.club/frontend/q141-vue-component-communication/)
34. [Vue 的 KeepAlive 是什么？组件缓存后，生命周期会怎样变化？](https://note.lgdsunday.club/frontend/q142-vue-keep-alive/)
35. [Vue Router 的 hash 和 history 模式有什么区别？刷新为什么会 404？](https://note.lgdsunday.club/frontend/q143-vue-router-modes/)
36. [Vite 和 Webpack 有什么区别？开发启动和生产构建为什么要分开看？](https://note.lgdsunday.club/frontend/q144-vite-vs-webpack/)
37. [Tree Shaking 是什么？为什么没用到的代码仍然进了包？](https://note.lgdsunday.club/frontend/q145-tree-shaking/)
38. [前端代码分割和懒加载怎么做？拆包越细越好吗？](https://note.lgdsunday.club/frontend/q146-code-splitting-lazy-loading/)
39. [CSR、SSR、SSG、ISR 有什么区别？Next.js 项目怎么选？](https://note.lgdsunday.club/frontend/q147-ssr-csr-ssg-isr/)
40. [前端性能怎么衡量？LCP、INP、CLS 分别反映什么问题？](https://note.lgdsunday.club/frontend/q148-web-vitals/)
41. [虚拟列表是什么？几万条数据怎样做到滚动不卡顿？](https://note.lgdsunday.club/frontend/q149-virtual-list/)
42. [pnpm 和 npm 有什么区别？lockfile 为什么应该提交？](https://note.lgdsunday.club/frontend/q150-pnpm-lockfile/)
43. [微前端是什么？什么时候值得用，什么时候只是增加复杂度？](https://note.lgdsunday.club/frontend/q151-micro-frontend/)
44. [Vue nextTick 是什么？为什么修改数据后，DOM 没有立即更新？](https://note.lgdsunday.club/frontend/q218-vue-nexttick/)
45. [JavaScript 怎么判断数据类型？typeof、instanceof 和 Array.isArray 有什么区别？](https://note.lgdsunday.club/frontend/q221-js-type-checking/)
46. [React Hooks 为什么不能放在条件判断和循环里？调用顺序为什么重要？](https://note.lgdsunday.club/frontend/q225-react-hooks-order/)
47. [JavaScript 的 ==、=== 和 Object.is 有什么区别？隐式类型转换怎么判断？](https://note.lgdsunday.club/frontend/q229-js-equality-comparison/)
48. [CSS 定位有哪些方式？absolute、fixed 和 sticky 有什么区别？](https://note.lgdsunday.club/frontend/q233-css-position-containing-block/)
49. [Git merge 和 rebase 有什么区别？为什么共享分支要谨慎变基？](https://note.lgdsunday.club/frontend/q234-git-merge-vs-rebase/)
50. [var、let、const 有什么区别？暂时性死区和变量提升怎么理解？](https://note.lgdsunday.club/frontend/q236-var-let-const-tdz/)
51. [Vue 的 v-if 和 v-show 有什么区别？频繁切换时应该怎么选？](https://note.lgdsunday.club/frontend/q237-vue-v-if-vs-v-show/)
52. [Promise 的 then、catch、finally 怎么传递结果？为什么漏写 return 会出错？](https://note.lgdsunday.club/frontend/q247-promise-chaining/)
53. [React 受控组件和非受控组件有什么区别？value 和 defaultValue 怎么选？](https://note.lgdsunday.club/frontend/q248-react-controlled-uncontrolled/)
54. [Vue 3 生命周期有哪些？父子组件的执行顺序是什么？](https://note.lgdsunday.club/frontend/q256-vue-lifecycle-parent-child/)
55. [为什么 JavaScript 的 0.1 + 0.2 不等于 0.3？精度问题怎么处理？](https://note.lgdsunday.club/frontend/q259-js-float-precision/)
56. [JavaScript 的 Map、Object 和 WeakMap 有什么区别？分别适合存什么？](https://note.lgdsunday.club/frontend/q260-map-object-weakmap/)
57. [React 的 useRef 和 useState 有什么区别？为什么修改 ref 页面不更新？](https://note.lgdsunday.club/frontend/q262-react-useref-vs-usestate/)
58. [CSS 选择器优先级怎么算？!important 一定能覆盖其他样式吗？](https://note.lgdsunday.club/frontend/q265-css-selector-specificity/)
59. [CSS 的 display: none、visibility: hidden 和 opacity: 0 有什么区别？](https://note.lgdsunday.club/frontend/q267-css-hide-elements/)
60. [JavaScript 的 for...in 和 for...of 有什么区别？为什么普通对象不能直接 for...of？](https://note.lgdsunday.club/frontend/q271-for-in-vs-for-of/)
61. [Web Worker 和 Service Worker 有什么区别？计算任务和离线缓存怎么选？](https://note.lgdsunday.club/frontend/q274-web-worker-service-worker/)
62. [Vue 3 的 Diff 算法怎么工作？最长递增子序列有什么用？](https://note.lgdsunday.club/frontend/q277-vue3-diff-lis/)
63. [JavaScript 的 map 和 forEach 有什么区别？为什么不能直接用 forEach 等待异步任务？](https://note.lgdsunday.club/frontend/q280-map-foreach-async/)
64. [CSS 的 px、em、rem、vw、vh 有什么区别？响应式布局怎么选单位？](https://note.lgdsunday.club/frontend/q283-css-units-responsive/)
65. [Vue 插槽 slot 是什么？默认插槽、具名插槽和作用域插槽有什么区别？](https://note.lgdsunday.club/frontend/q286-vue-slots-scoped/)
66. [React 合成事件是什么？和原生 DOM 事件有什么区别？](https://note.lgdsunday.club/frontend/q289-react-synthetic-events/)
67. [React 错误边界 Error Boundary 是什么？为什么捕获不到所有错误？](https://note.lgdsunday.club/frontend/q294-react-error-boundary/)
68. [script 的 defer 和 async 有什么区别？会影响执行顺序和 DOMContentLoaded 吗？](https://note.lgdsunday.club/frontend/q296-defer-vs-async/)
69. [requestAnimationFrame 和 setTimeout 有什么区别？为什么动画不应该固定每帧移动几像素？](https://note.lgdsunday.club/frontend/q297-requestanimationframe-vs-timer/)
70. [JavaScript 数组去重有哪些方法？为什么 Set 去不掉内容相同的对象？](https://note.lgdsunday.club/frontend/q298-array-dedup-business-key/)
71. [TypeScript 结构化类型是什么？为什么对象多一个字段，有时能赋值、有时却报错？](https://note.lgdsunday.club/frontend/q299-typescript-structural-typing/)
72. [TypeScript 的 satisfies、as 和类型注解有什么区别？能校验接口返回的数据吗？](https://note.lgdsunday.club/frontend/q300-typescript-satisfies-assertion/)
73. [React 的 useLayoutEffect 和 useEffect 有什么区别？什么时候需要在绘制前测量 DOM？](https://note.lgdsunday.club/frontend/q301-uselayouteffect-vs-useeffect/)
74. [React 的 useTransition 和 useDeferredValue 有什么区别？它们等于防抖吗？](https://note.lgdsunday.club/frontend/q302-react-transition-urgent-update/)
75. [React 的 useReducer 是什么？和 useState 有什么区别，异步请求应该写在哪里？](https://note.lgdsunday.club/frontend/q303-react-usereducer/)
76. [Vue 3 的 Composable 是什么？和普通函数、Mixin 有什么区别？](https://note.lgdsunday.club/frontend/q304-vue-composable/)
77. [Vue Teleport 是什么？弹窗移动到 body 后，组件关系和事件会改变吗？](https://note.lgdsunday.club/frontend/q305-vue-teleport/)
78. [CSS 媒体查询和容器查询有什么区别？响应式组件为什么不能只看屏幕宽度？](https://note.lgdsunday.club/frontend/q306-media-query-container-query/)
79. [CSS 伪类和伪元素有什么区别？::before 能代替真正的 HTML 内容吗？](https://note.lgdsunday.club/frontend/q307-css-pseudo-class-element/)
80. [Webpack 的 HMR 热更新是什么？为什么有时保留状态，有时整页刷新？](https://note.lgdsunday.club/frontend/q308-hmr-hot-module-replacement/)
81. [TypeScript 的 Partial、Required、Pick、Omit 有什么区别？怎么选择工具类型？](https://note.lgdsunday.club/frontend/q337-typescript-utility-types/)
82. [Object.freeze、Object.seal 和 Object.preventExtensions 有什么区别？能冻结嵌套对象吗？](https://note.lgdsunday.club/frontend/q340-object-freeze-seal/)
83. [React Suspense 是什么？为什么包住组件以后，接口请求仍然没有显示 loading？](https://note.lgdsunday.club/frontend/q341-react-suspense/)
84. [TypeScript 联合类型和交叉类型有什么区别？类型收窄怎么做？](https://note.lgdsunday.club/frontend/q346-union-intersection-narrowing/)
85. [Vue 3 自定义指令怎么写？什么时候用指令，什么时候用组件？](https://note.lgdsunday.club/frontend/q347-vue-custom-directive/)
86. [Flex 布局为什么会被长文本撑开？min-width: 0 为什么能解决？](https://note.lgdsunday.club/frontend/q353-flex-min-size-overflow/)
87. [IntersectionObserver 是什么？如何实现图片懒加载和滚动加载？](https://note.lgdsunday.club/frontend/q354-intersection-observer-lazy-load/)
88. [Vue 3 的 shallowRef 和 markRaw 有什么区别？什么时候不需要深度响应式？](https://note.lgdsunday.club/frontend/q362-shallowref-markraw/)
89. [AbortController 怎么取消请求？为什么旧请求的结果还可能覆盖新结果？](https://note.lgdsunday.club/frontend/q363-abortcontroller-request-race/)
90. [ResizeObserver 和 MutationObserver 有什么区别？监听元素变化该用哪个？](https://note.lgdsunday.club/frontend/q364-resize-mutation-observer/)
91. [Object.defineProperty 是什么？writable、enumerable、configurable 分别控制什么？](https://note.lgdsunday.club/frontend/q365-object-property-descriptor/)
92. [HTML 的 srcset、sizes 和 picture 有什么区别？响应式图片怎么选？](https://note.lgdsunday.club/frontend/q366-srcset-sizes-responsive-image/)

</details>

<details>
<summary><b>后端面试题（77 篇）</b> — 点击展开全部题目</summary>

1. [JWT 和 Session 有什么区别？Cookie 在登录认证中负责什么？](https://note.lgdsunday.club/backend/q106-jwt-vs-session/)
2. [消息队列如何保证消息不丢失？为什么收到 ACK 还不一定代表业务完成？](https://note.lgdsunday.club/backend/q113-message-queue-reliability/)
3. [Node.js 如何利用多核？worker_threads、cluster、child_process 怎么选？](https://note.lgdsunday.club/backend/q152-node-multicore-concurrency/)
4. [Node.js Stream 是什么？背压如何防止内存越积越多？](https://note.lgdsunday.club/backend/q153-node-stream-backpressure/)
5. [Python 的 GIL 是什么？多线程与 free-threaded 构建该怎么理解？](https://note.lgdsunday.club/backend/q154-python-gil/)
6. [Python 装饰器是什么？functools.wraps 为什么不能随便省略？](https://note.lgdsunday.club/backend/q155-python-decorator/)
7. [Python 迭代器和生成器有什么区别？yield 为什么能节省内存？](https://note.lgdsunday.club/backend/q156-python-generator/)
8. [Java 线程池的核心参数怎么设置？队列越大越安全吗？](https://note.lgdsunday.club/backend/q157-java-thread-pool/)
9. [HashMap 和 ConcurrentHashMap 有什么区别？并发读写为什么不能混用？](https://note.lgdsunday.club/backend/q158-hashmap-vs-concurrenthashmap/)
10. [NestJS 的依赖注入是什么？Provider 的作用域为什么会影响请求？](https://note.lgdsunday.club/backend/q159-nestjs-dependency-injection/)
11. [Express 和 Koa 的中间件有什么区别？洋葱模型是怎么执行的？](https://note.lgdsunday.club/backend/q160-express-vs-koa-middleware/)
12. [Spring AOP 是什么？JDK 动态代理和 CGLIB 有什么区别？](https://note.lgdsunday.club/backend/q161-spring-aop/)
13. [Spring 的 @Transactional 为什么会失效？事务传播行为怎么选？](https://note.lgdsunday.club/backend/q162-spring-transaction-failure/)
14. [Spring Boot 自动配置是怎么实现的？自定义配置为什么能覆盖默认配置？](https://note.lgdsunday.club/backend/q163-spring-boot-autoconfiguration/)
15. [OAuth 2.0 和 OpenID Connect 有什么区别？授权码与 PKCE 解决什么问题？](https://note.lgdsunday.club/backend/q164-oauth-oidc-pkce/)
16. [REST、GraphQL 和 gRPC 有什么区别？接口设计应该怎么选？](https://note.lgdsunday.club/backend/q165-rest-graphql-grpc/)
17. [RBAC 和 ABAC 有什么区别？权限系统怎么避免角色越建越多？](https://note.lgdsunday.club/backend/q166-rbac-vs-abac/)
18. [Kafka、RabbitMQ、RocketMQ 有什么区别？消息队列怎么选？](https://note.lgdsunday.club/backend/q167-message-queue-selection/)
19. [消息队列如何保证顺序消费？增加消费者为什么可能破坏顺序？](https://note.lgdsunday.club/backend/q168-message-ordering/)
20. [消息队列积压怎么排查？加消费者为什么不一定有用？](https://note.lgdsunday.club/backend/q169-message-queue-backlog/)
21. [延迟队列怎么实现？定时扫描、时间轮和延迟消息怎么选？](https://note.lgdsunday.club/backend/q170-delay-queue/)
22. [Nginx 的反向代理和负载均衡怎么工作？轮询与一致性哈希怎么选？](https://note.lgdsunday.club/backend/q171-nginx-reverse-proxy/)
23. [Docker 镜像和容器有什么区别？分层构建为什么能复用缓存？](https://note.lgdsunday.club/backend/q172-docker-image-layers/)
24. [Kubernetes 的 Pod、Deployment、Service 有什么区别？请求怎样找到容器？](https://note.lgdsunday.club/backend/q173-kubernetes-workloads/)
25. [JVM 内存区域有哪些？堆、虚拟机栈和元空间分别存什么？](https://note.lgdsunday.club/backend/q219-jvm-memory-areas/)
26. [Spring Bean 的生命周期是什么？实例化、依赖注入和初始化有什么区别？](https://note.lgdsunday.club/backend/q220-spring-bean-lifecycle/)
27. [synchronized 和 ReentrantLock 有什么区别？Java 并发加锁应该怎么选？](https://note.lgdsunday.club/backend/q222-synchronized-vs-reentrantlock/)
28. [JVM 垃圾回收怎么判断对象可以回收？GC Roots 和可达性分析是什么？](https://note.lgdsunday.club/backend/q223-gc-roots-reachability/)
29. [Java volatile 有什么作用？为什么不能保证 i++ 的线程安全？](https://note.lgdsunday.club/backend/q224-volatile-atomicity/)
30. [Java 双亲委派机制是什么？类加载器为什么要先委托给父加载器？](https://note.lgdsunday.club/backend/q226-java-parent-delegation/)
31. [ThreadLocal 是什么？为什么在线程池中容易出现内存泄漏和数据串用？](https://note.lgdsunday.club/backend/q228-threadlocal/)
32. [SQL 注入是什么？为什么参数化查询能防注入，拼接排序字段却仍有风险？](https://note.lgdsunday.club/backend/q232-sql-injection-parameterized/)
33. [ArrayList 和 LinkedList 有什么区别？为什么链表插入不一定更快？](https://note.lgdsunday.club/backend/q238-arraylist-vs-linkedlist/)
34. [为什么重写 equals 就要重写 hashCode？HashMap 的键为什么不宜修改？](https://note.lgdsunday.club/backend/q239-equals-hashcode/)
35. [String、StringBuilder、StringBuffer 有什么区别？字符串拼接怎么选？](https://note.lgdsunday.club/backend/q240-string-concatenation/)
36. [CAS 是什么？ABA 问题怎么产生，为什么加版本号能解决？](https://note.lgdsunday.club/backend/q241-cas-aba/)
37. [Spring 循环依赖怎么解决？三级缓存为什么解决不了构造器循环依赖？](https://note.lgdsunday.club/backend/q242-spring-circular-dependency/)
38. [JVM 垃圾回收算法有哪些？标记清除、复制和标记整理有什么区别？](https://note.lgdsunday.club/backend/q246-gc-algorithms/)
39. [Spring MVC 请求处理流程是什么？DispatcherServlet 怎么把请求交给 Controller？](https://note.lgdsunday.club/backend/q249-spring-mvc-request-flow/)
40. [数据库连接池是什么？连接数为什么不是越大越好，借出的连接怎么归还？](https://note.lgdsunday.club/backend/q250-database-connection-pool/)
41. [Java 的 sleep 和 wait 有什么区别？分别会不会释放锁？](https://note.lgdsunday.club/backend/q257-java-sleep-vs-wait/)
42. [Java 异常体系怎么分？Exception、Error 和 RuntimeException 有什么区别？](https://note.lgdsunday.club/backend/q258-java-exception-hierarchy/)
43. [Java 反射机制是什么？运行时如何创建对象和调用方法？](https://note.lgdsunday.club/backend/q264-java-reflection/)
44. [Java 服务 CPU 飙高怎么排查？如何定位到具体线程和代码？](https://note.lgdsunday.club/backend/q266-java-high-cpu-troubleshooting/)
45. [Docker 和虚拟机有什么区别？容器的隔离是怎么实现的？](https://note.lgdsunday.club/backend/q268-docker-vs-vm/)
46. [Kafka 消费者组如何分配分区？Rebalance 为什么会频繁发生？](https://note.lgdsunday.club/backend/q273-kafka-consumer-group-rebalance/)
47. [Kubernetes 三种探针有什么区别？存活、就绪和启动检查失败后会怎样？](https://note.lgdsunday.club/backend/q275-kubernetes-probes/)
48. [Java AQS 是什么？它如何实现线程排队、阻塞和唤醒？](https://note.lgdsunday.club/backend/q276-aqs-queue/)
49. [MyBatis 一级缓存和二级缓存有什么区别？为什么会查到旧数据？](https://note.lgdsunday.club/backend/q278-mybatis-cache/)
50. [Java 内存溢出 OOM 怎么排查？如何用 Heap Dump 找到问题对象？](https://note.lgdsunday.club/backend/q279-java-oom-heapdump/)
51. [CompletableFuture 和 Future 有什么区别？异步任务如何组合、处理异常？](https://note.lgdsunday.club/backend/q281-completablefuture/)
52. [Java 接口和抽象类有什么区别？有了 default 方法还需要抽象类吗？](https://note.lgdsunday.club/backend/q282-java-interface-vs-abstract-class/)
53. [Java 是值传递还是引用传递？为什么方法里能修改对象，却换不掉外面的引用？](https://note.lgdsunday.club/backend/q285-java-pass-by-value/)
54. [JVM 的 G1 和 ZGC 有什么区别？低延迟服务应该怎么选垃圾收集器？](https://note.lgdsunday.club/backend/q288-g1-vs-zgc/)
55. [Python 函数默认参数为什么不建议用空列表？多次调用为什么会共享数据？](https://note.lgdsunday.club/backend/q295-python-mutable-default-argument/)
56. [Java 内存模型 JMM 是什么？happens-before 等于代码先执行吗？](https://note.lgdsunday.club/backend/q309-jmm-happens-before/)
57. [Java 的 final 有什么作用？final 修饰对象引用，就代表对象不可变吗？](https://note.lgdsunday.club/backend/q310-java-final-immutability/)
58. [Java 泛型为什么要类型擦除？List<String> 和 List<Integer> 在运行时是不同类型吗？](https://note.lgdsunday.club/backend/q311-java-generics-type-erasure/)
59. [Java 虚拟线程是什么？能代替线程池、让 CPU 密集任务更快吗？](https://note.lgdsunday.club/backend/q312-java-virtual-threads/)
60. [Java 的 fail-fast 和 fail-safe 是什么？为什么遍历 ArrayList 时删除元素会报错？](https://note.lgdsunday.club/backend/q313-java-iterator-fail-fast/)
61. [Spring 的 Filter、Interceptor 和 AOP 有什么区别？鉴权和日志应该放在哪里？](https://note.lgdsunday.club/backend/q314-filter-interceptor-aop/)
62. [Spring 单例 Bean 是线程安全的吗？为什么不能把用户信息保存在成员变量里？](https://note.lgdsunday.club/backend/q315-spring-singleton-thread-safety/)
63. [Python 的 is 和 == 有什么区别？为什么判断 None 用 is，比较字符串却不用？](https://note.lgdsunday.club/backend/q316-python-is-vs-equals/)
64. [Python 的 with 是怎么工作的？发生异常后为什么还能关闭文件？](https://note.lgdsunday.club/backend/q317-python-with-context-manager/)
65. [Java 字符串常量池是什么？String.intern()、字面量和 new String 有什么区别？](https://note.lgdsunday.club/backend/q336-java-string-pool-intern/)
66. [Spring 的 @Autowired 和 @Resource 有什么区别？多个 Bean 时怎么选择？](https://note.lgdsunday.club/backend/q338-autowired-vs-resource/)
67. [CountDownLatch、CyclicBarrier 和 Semaphore 有什么区别？并发任务怎么协调？](https://note.lgdsunday.club/backend/q339-java-concurrency-tools/)
68. [Java 单例模式怎么实现？双重检查锁为什么需要 volatile？](https://note.lgdsunday.club/backend/q343-singleton-safe-publication/)
69. [LongAdder 和 AtomicLong 有什么区别？为什么高并发计数不一定选 AtomicLong？](https://note.lgdsunday.club/backend/q348-longadder-vs-atomiclong/)
70. [Java 类什么时候初始化？静态变量、静态代码块和构造方法按什么顺序执行？](https://note.lgdsunday.club/backend/q349-java-class-initialization-order/)
71. [Java 序列化是什么？Serializable、transient 和 serialVersionUID 有什么作用？](https://note.lgdsunday.club/backend/q350-java-serialization-compatibility/)
72. [Java interrupt 能直接终止线程吗？如何正确停止正在运行的任务？](https://note.lgdsunday.club/backend/q351-java-thread-interrupt/)
73. [Node.js 的 process.nextTick、Promise 和 setImmediate 按什么顺序执行？](https://note.lgdsunday.club/backend/q352-node-event-loop-phases/)
74. [JIT 和 AOT 编译有什么区别？Java 服务为什么需要预热？](https://note.lgdsunday.club/backend/q367-jit-aot-warmup/)
75. [Python 中什么对象可以作为字典的 key？tuple 一定可哈希吗？](https://note.lgdsunday.club/backend/q368-python-hashable/)
76. [用户密码应该怎么存？为什么 MD5 加盐还不够？](https://note.lgdsunday.club/backend/q369-password-hashing/)
77. [SSRF 是什么？为什么后端不能直接请求用户传入的 URL？](https://note.lgdsunday.club/backend/q370-ssrf-protection/)

</details>

<details>
<summary><b>数据库与缓存面试题（50 篇）</b> — 点击展开全部题目</summary>

1. [Redis 缓存穿透、击穿、雪崩有什么区别？分别怎么解决？](https://note.lgdsunday.club/database/q086-cache-penetration-breakdown-avalanche/)
2. [MySQL 索引为什么用 B+ 树？与 B 树、哈希索引有什么区别？](https://note.lgdsunday.club/database/q087-b-plus-tree-index/)
3. [Redis 分布式锁怎么实现？为什么加了锁仍然可能重复执行？](https://note.lgdsunday.club/database/q088-redis-distributed-lock/)
4. [MySQL 的 MVCC 是什么？Read View 如何决定一条记录是否可见？](https://note.lgdsunday.club/database/q089-mvcc-readview/)
5. [MySQL 索引为什么会失效？如何用 EXPLAIN 判断 SQL 有没有用好索引？](https://note.lgdsunday.club/database/q090-index-explain/)
6. [Redis 的 RDB 和 AOF 有什么区别？宕机后哪些数据可能丢失？](https://note.lgdsunday.club/database/q094-redis-rdb-aof/)
7. [Redis 为什么快？“单线程”与多线程 I/O 应该怎样理解？](https://note.lgdsunday.club/database/q095-redis-single-thread-model/)
8. [MySQL 的 redo log、undo log 和 binlog 有什么区别？为什么需要两阶段提交？](https://note.lgdsunday.club/database/q112-mysql-three-logs/)
9. [MySQL 深分页为什么越来越慢？游标分页和延迟关联怎么优化？](https://note.lgdsunday.club/database/q174-mysql-deep-pagination/)
10. [MySQL 主从复制是怎么工作的？主从延迟时怎样保证读到刚写的数据？](https://note.lgdsunday.club/database/q175-mysql-replication/)
11. [MySQL Buffer Pool 是什么？数据修改后为什么不马上写入磁盘？](https://note.lgdsunday.club/database/q176-mysql-buffer-pool/)
12. [MySQL 为什么需要 Doublewrite？有了 redo log 还不够吗？](https://note.lgdsunday.club/database/q177-mysql-doublewrite/)
13. [MySQL 死锁怎么排查？为什么统一加锁顺序能减少死锁？](https://note.lgdsunday.club/database/q178-mysql-deadlock/)
14. [MySQL 的 INNER JOIN 和 LEFT JOIN 有什么区别？条件放 ON 还是 WHERE？](https://note.lgdsunday.club/database/q179-mysql-join/)
15. [MySQL 的 COUNT(*)、COUNT(1)、COUNT(字段) 有什么区别？](https://note.lgdsunday.club/database/q180-mysql-count/)
16. [MySQL 的 CHAR 和 VARCHAR 有什么区别？长度、字符集和存储怎么理解？](https://note.lgdsunday.club/database/q181-mysql-char-vs-varchar/)
17. [Redis 的 ZSet 是怎么实现的？为什么会用跳表？](https://note.lgdsunday.club/database/q182-redis-zset-skiplist/)
18. [Redis 过期删除和内存淘汰有什么区别？LRU、LFU 怎么选？](https://note.lgdsunday.club/database/q183-redis-expiration-eviction/)
19. [Redis 的大 Key 和热 Key 有什么区别？应该怎么发现和处理？](https://note.lgdsunday.club/database/q184-redis-big-key-hot-key/)
20. [Redis 主从复制怎么工作？全量同步和增量同步如何切换？](https://note.lgdsunday.club/database/q185-redis-replication/)
21. [Redis Sentinel 哨兵如何实现故障转移？为什么仍可能丢数据？](https://note.lgdsunday.club/database/q186-redis-sentinel/)
22. [Redis Cluster 为什么使用哈希槽？扩容时数据和请求怎么迁移？](https://note.lgdsunday.club/database/q187-redis-cluster/)
23. [Redis 事务和 Lua 脚本有什么区别？原子执行等于失败回滚吗？](https://note.lgdsunday.club/database/q188-redis-transaction-lua/)
24. [Redis Pipeline 为什么能提高吞吐量？和批量命令、事务有什么区别？](https://note.lgdsunday.club/database/q189-redis-pipeline/)
25. [MySQL 事务的四种隔离级别是什么？脏读、不可重复读和幻读有什么区别？](https://note.lgdsunday.club/database/q216-mysql-isolation-levels/)
26. [Redis 常用数据类型有哪些？String、Hash、List、Set、ZSet 应该怎么选？](https://note.lgdsunday.club/database/q217-redis-data-types/)
27. [数据库三大范式是什么？为什么实际项目有时需要反范式设计？](https://note.lgdsunday.club/database/q231-database-normal-forms/)
28. [MySQL 的 DELETE、TRUNCATE、DROP 有什么区别？哪些操作可以回滚？](https://note.lgdsunday.club/database/q243-delete-truncate-drop/)
29. [SQL 的 WHERE 和 HAVING 有什么区别？GROUP BY 之后怎么筛选？](https://note.lgdsunday.club/database/q244-where-having-group-by/)
30. [数据库乐观锁和悲观锁有什么区别？version 字段怎么防止覆盖更新？](https://note.lgdsunday.club/database/q245-optimistic-vs-pessimistic-lock/)
31. [Redis HyperLogLog 怎么统计 UV？为什么不能查询成员，也不能直接删除用户？](https://note.lgdsunday.club/database/q253-redis-hyperloglog/)
32. [SQL 窗口函数怎么用？ROW_NUMBER、RANK 和 DENSE_RANK 有什么区别？](https://note.lgdsunday.club/database/q261-sql-window-functions/)
33. [MySQL 的 InnoDB 和 MyISAM 有什么区别？为什么默认使用 InnoDB？](https://note.lgdsunday.club/database/q263-innodb-vs-myisam/)
34. [Redis Bitmap 是什么？如何用位图统计签到和活跃用户？](https://note.lgdsunday.club/database/q270-redis-bitmap/)
35. [SQL 的 UNION 和 UNION ALL 有什么区别？什么时候不能省略去重？](https://note.lgdsunday.club/database/q272-union-vs-union-all/)
36. [MySQL 的 IN 和 EXISTS 有什么区别？为什么 NOT IN 遇到 NULL 容易出错？](https://note.lgdsunday.club/database/q284-in-vs-exists-null/)
37. [MySQL 的 DATETIME 和 TIMESTAMP 有什么区别？时区变化会影响查询结果吗？](https://note.lgdsunday.club/database/q287-datetime-vs-timestamp/)
38. [Redis 的 Pub/Sub 和 Stream 有什么区别？消费者离线后还能收到消息吗？](https://note.lgdsunday.club/database/q292-redis-pubsub-vs-stream/)
39. [MySQL 回表、覆盖索引和索引下推有什么区别？它们分别减少了什么开销？](https://note.lgdsunday.club/database/q318-covering-index-icp/)
40. [MySQL 普通索引和唯一索引有什么区别？Change Buffer 为什么不能随便用于唯一索引？](https://note.lgdsunday.club/database/q319-unique-index-change-buffer/)
41. [MySQL 自增 ID 为什么不连续？事务回滚和并发插入会影响 AUTO_INCREMENT 吗？](https://note.lgdsunday.club/database/q320-mysql-auto-increment-gap/)
42. [MySQL Online DDL 是什么？ALGORITHM=INSTANT、INPLACE 和 COPY 有什么区别？](https://note.lgdsunday.club/database/q321-mysql-online-ddl/)
43. [MySQL 的 utf8mb4 和 utf8 有什么区别？Collation 为什么会影响比较和唯一索引？](https://note.lgdsunday.club/database/q322-charset-collation/)
44. [Redis 的 SCAN 和 KEYS 有什么区别？COUNT 是每次固定返回的数量吗？](https://note.lgdsunday.club/database/q323-redis-scan-vs-keys/)
45. [Redis 为什么使用 SDS 而不是 C 字符串？二进制安全和预分配是什么？](https://note.lgdsunday.club/database/q324-redis-sds/)
46. [Redis 的 listpack 和 ziplist 有什么区别？为什么 listpack 能避免连锁更新？](https://note.lgdsunday.club/database/q325-redis-listpack-ziplist/)
47. [Redis 内存碎片是什么？为什么删除数据后，内存占用没有明显下降？](https://note.lgdsunday.club/database/q342-redis-memory-fragmentation/)
48. [MySQL 分区表和分库分表有什么区别？分区后查询一定更快吗？](https://note.lgdsunday.club/database/q357-mysql-partitioning/)
49. [MySQL 的 REPLACE 和 INSERT ON DUPLICATE KEY UPDATE 有什么区别？](https://note.lgdsunday.club/database/q358-replace-vs-upsert/)
50. [MySQL 的 CTE 和子查询有什么区别？WITH RECURSIVE 怎么查询树形数据？](https://note.lgdsunday.club/database/q371-cte-recursive-query/)

</details>

<details>
<summary><b>计算机基础面试题（44 篇）</b> — 点击展开全部题目</summary>

1. [进程、线程和协程有什么区别？CPU 密集与 I/O 密集任务怎么选？](https://note.lgdsunday.club/cs-basics/q091-process-thread-coroutine/)
2. [TCP 为什么要三次握手、四次挥手？TIME_WAIT 有什么作用？](https://note.lgdsunday.club/cs-basics/q092-tcp-handshake-termination/)
3. [HTTP 和 HTTPS 有什么区别？TLS 怎样防止窃听、篡改和冒充？](https://note.lgdsunday.club/cs-basics/q093-https-tls/)
4. [HTTP/1.1、HTTP/2、HTTP/3 有什么区别？队头阻塞是怎么解决的？](https://note.lgdsunday.club/cs-basics/q190-http-versions/)
5. [TCP 和 UDP 有什么区别？实时通信为什么不总是选择 TCP？](https://note.lgdsunday.club/cs-basics/q191-tcp-vs-udp/)
6. [TCP 流量控制和拥塞控制有什么区别？滑动窗口控制的是什么？](https://note.lgdsunday.club/cs-basics/q192-tcp-flow-congestion-control/)
7. [DNS 解析过程是什么？递归查询、迭代查询和 DNS 缓存有什么区别？](https://note.lgdsunday.club/cs-basics/q193-dns-resolution/)
8. [GET 和 POST 有什么区别？安全性、幂等性和参数位置该怎么理解？](https://note.lgdsunday.club/cs-basics/q194-get-vs-post/)
9. [HTTP 301、302、307、308 有什么区别？重定向后请求方法会变吗？](https://note.lgdsunday.club/cs-basics/q195-http-redirect/)
10. [虚拟内存是什么？页表、TLB 和缺页异常如何配合？](https://note.lgdsunday.club/cs-basics/q196-virtual-memory/)
11. [select、poll、epoll 有什么区别？I/O 多路复用到底在复用什么？](https://note.lgdsunday.club/cs-basics/q197-io-multiplexing/)
12. [进程间通信有哪些方式？管道、消息队列、共享内存怎么选？](https://note.lgdsunday.club/cs-basics/q198-ipc-process-communication/)
13. [互斥锁、自旋锁和信号量有什么区别？等待资源时该睡眠还是忙等？](https://note.lgdsunday.club/cs-basics/q199-mutex-spinlock-semaphore/)
14. [零拷贝是什么？sendfile 和 mmap 分别减少了哪些数据复制？](https://note.lgdsunday.club/cs-basics/q200-zero-copy/)
15. [LRU 缓存怎么实现？为什么通常需要哈希表加双向链表？](https://note.lgdsunday.club/cs-basics/q201-lru-cache/)
16. [Top K 问题怎么解决？堆、排序和快速选择分别适合什么场景？](https://note.lgdsunday.club/cs-basics/q202-top-k/)
17. [二分查找的边界怎么写？查找第一个和最后一个匹配项有什么区别？](https://note.lgdsunday.club/cs-basics/q203-binary-search-boundary/)
18. [快速排序和归并排序有什么区别？稳定性、空间和最坏复杂度怎么比较？](https://note.lgdsunday.club/cs-basics/q204-quicksort-vs-mergesort/)
19. [BFS 和 DFS 有什么区别？什么时候能用 BFS 求最短路径？](https://note.lgdsunday.club/cs-basics/q205-bfs-vs-dfs/)
20. [布隆过滤器是什么？为什么会误判，又为什么不能直接删除元素？](https://note.lgdsunday.club/cs-basics/q227-bloom-filter/)
21. [TCP 粘包和拆包怎么解决？长度字段协议如何处理半包和连续消息？](https://note.lgdsunday.club/cs-basics/q230-tcp-framing-half-packet/)
22. [HTTP 常见状态码有哪些？401、403 和 502、503、504 怎么区分？](https://note.lgdsunday.club/cs-basics/q251-http-status-codes/)
23. [TCP 超时重传和快速重传有什么区别？SACK 为什么能减少重复发送？](https://note.lgdsunday.club/cs-basics/q252-tcp-retransmission/)
24. [Linux 软链接和硬链接有什么区别？删除原文件后还能访问吗？](https://note.lgdsunday.club/cs-basics/q254-linux-soft-hard-link/)
25. [用户态和内核态有什么区别？系统调用一定会切换进程吗？](https://note.lgdsunday.club/cs-basics/q269-user-mode-kernel-mode/)
26. [OSI 七层模型和 TCP/IP 四层模型有什么区别？一次请求经过哪些层？](https://note.lgdsunday.club/cs-basics/q290-osi-vs-tcpip/)
27. [如何反转单链表？迭代和递归的写法、复杂度有什么区别？](https://note.lgdsunday.club/cs-basics/q291-reverse-linked-list/)
28. [操作系统的进程调度算法有哪些？时间片轮转和多级反馈队列有什么区别？](https://note.lgdsunday.club/cs-basics/q293-process-scheduling/)
29. [HTTP Keep-Alive 和 TCP Keepalive 有什么区别？长连接能保证对方一直在线吗？](https://note.lgdsunday.club/cs-basics/q326-http-keepalive-tcp-keepalive/)
30. [TCP 半连接队列和全连接队列有什么区别？backlog 满了会发生什么？](https://note.lgdsunday.club/cs-basics/q327-tcp-syn-backlog-accept-queue/)
31. [死锁产生的四个必要条件是什么？预防、避免和检测有什么区别？](https://note.lgdsunday.club/cs-basics/q328-deadlock-four-conditions/)
32. [如何用两个栈实现队列？为什么出队可以做到均摊 O(1)？](https://note.lgdsunday.club/cs-basics/q329-queue-with-two-stacks/)
33. [二叉树前序、中序、后序遍历有什么区别？递归和迭代怎样实现？](https://note.lgdsunday.club/cs-basics/q330-binary-tree-traversal/)
34. [两数之和怎么用哈希表实现？为什么要先查再存，不能重复使用同一个元素？](https://note.lgdsunday.club/cs-basics/q331-two-sum/)
35. [最长无重复子串怎么用滑动窗口实现？为什么左边界只能向前移动？](https://note.lgdsunday.club/cs-basics/q332-longest-substring-without-repeating/)
36. [动态规划是什么？爬楼梯直接递归为什么会慢，滚动数组怎么优化空间？](https://note.lgdsunday.club/cs-basics/q333-climbing-stairs/)
37. [如何判断链表有环并找到入环节点？快慢指针为什么有效？](https://note.lgdsunday.club/cs-basics/q344-linked-list-cycle/)
38. [僵尸进程和孤儿进程有什么区别？为什么 kill 不掉僵尸进程？](https://note.lgdsunday.club/cs-basics/q355-zombie-orphan-process/)
39. [fork 和 exec 有什么区别？写时复制 COW 是怎么工作的？](https://note.lgdsunday.club/cs-basics/q356-fork-exec-copy-on-write/)
40. [如何判断括号字符串是否合法？为什么要用栈？](https://note.lgdsunday.club/cs-basics/q359-valid-parentheses/)
41. [如何合并两个有序链表？递归和迭代的复杂度有什么区别？](https://note.lgdsunday.club/cs-basics/q360-merge-sorted-lists/)
42. [服务器出现大量 CLOSE_WAIT 怎么排查？和 TIME_WAIT 堆积有什么区别？](https://note.lgdsunday.club/cs-basics/q372-close-wait-troubleshooting/)
43. [Linux Page Cache 是什么？write 成功后，为什么数据还可能丢失？](https://note.lgdsunday.club/cs-basics/q373-page-cache-fsync/)
44. [并查集是什么？路径压缩和按秩合并为什么能提高效率？](https://note.lgdsunday.club/cs-basics/q374-union-find/)

</details>

<details>
<summary><b>系统设计面试题（全栈）（19 篇）</b> — 点击展开全部题目</summary>

1. [秒杀系统怎么设计？如何限流、扣库存并避免超卖？](https://note.lgdsunday.club/fullstack-system-design/q114-flash-sale-system-design/)
2. [大文件上传怎么设计？分片上传、断点续传和秒传有什么区别？](https://note.lgdsunday.club/fullstack-system-design/q115-large-file-upload/)
3. [CAP 和 BASE 是什么？为什么不能简单理解成“三选二”？](https://note.lgdsunday.club/fullstack-system-design/q206-cap-vs-base/)
4. [分布式事务怎么实现？2PC、TCC、Saga 有什么区别？](https://note.lgdsunday.club/fullstack-system-design/q207-distributed-transaction/)
5. [分布式 ID 怎么生成？Snowflake、UUID、号段模式怎么选？](https://note.lgdsunday.club/fullstack-system-design/q208-distributed-id/)
6. [一致性哈希是什么？虚拟节点如何减少扩容时的数据迁移？](https://note.lgdsunday.club/fullstack-system-design/q209-consistent-hashing/)
7. [分库分表怎么设计？分片键、跨库查询和在线扩容怎么处理？](https://note.lgdsunday.club/fullstack-system-design/q210-sharding/)
8. [限流算法有哪些？固定窗口、滑动窗口、令牌桶、漏桶怎么选？](https://note.lgdsunday.club/fullstack-system-design/q211-rate-limiting-algorithms/)
9. [CDN 是什么？回源、缓存刷新和缓存命中率应该怎么理解？](https://note.lgdsunday.club/fullstack-system-design/q212-cdn-cache-origin/)
10. [短链接系统怎么设计？短码生成、跳转和高并发访问怎么处理？](https://note.lgdsunday.club/fullstack-system-design/q213-short-url-system-design/)
11. [单体架构和微服务有什么区别？什么时候应该拆分服务？](https://note.lgdsunday.club/fullstack-system-design/q214-monolith-vs-microservices/)
12. [DDD 是什么？限界上下文、聚合和微服务是什么关系？](https://note.lgdsunday.club/fullstack-system-design/q215-ddd-bounded-context/)
13. [服务熔断和降级有什么区别？熔断器如何判断故障与恢复？](https://note.lgdsunday.club/fullstack-system-design/q235-circuit-breaker-degradation/)
14. [Raft 算法是什么？Leader 选举、日志复制和多数派提交怎么理解？](https://note.lgdsunday.club/fullstack-system-design/q255-raft-consensus/)
15. [日志、指标和链路追踪有什么区别？Trace ID 怎样串起跨服务请求？](https://note.lgdsunday.club/fullstack-system-design/q334-observability-tracing/)
16. [RPO 和 RTO 是什么？备份、主从复制和容灾有什么区别？](https://note.lgdsunday.club/fullstack-system-design/q335-rpo-rto-disaster-recovery/)
17. [QPS、TPS、RT 和并发数有什么区别？如何估算并验证系统容量？](https://note.lgdsunday.club/fullstack-system-design/q345-qps-rt-capacity-planning/)
18. [工厂模式和策略模式有什么区别？如何配合管理多种实现？](https://note.lgdsunday.club/fullstack-system-design/q361-factory-vs-strategy-pattern/)
19. [SLI、SLO 和 SLA 有什么区别？错误预算怎么计算、怎么用？](https://note.lgdsunday.club/fullstack-system-design/q375-slo-error-budget/)

</details>

---

## 关于这个仓库

本站内容聚焦 **AI Agent / 大模型方向的面试准备**，面向准备 AI 应用开发岗位、
或从前后端转型 AI 的开发者。全部文章免费阅读，不设登录与付费墙。

- 网站：<https://note.lgdsunday.club/>
- 公众号：微信搜「**程序员Sunday**」，新文章第一时间推送（二维码见下）
- 姊妹站点：[简历汪](https://lgdsunday.club/)（简历模板与求职工具）

<div align="center">

<img src="assets/wechat-qrcode.jpg" alt="微信搜一搜或扫码关注公众号：程序员Sunday" width="520">

<br>

<b>微信搜一搜「程序员Sunday」，或扫码关注</b>

</div>

> 本仓库同时保存站点源码与运维说明；文章正文与配图不提交，仅保留本地。
> 开发与部署文档见下方「仓库维护说明」。

---

# 仓库维护说明（开发文档）

网站入口：[note.lgdsunday.club](https://note.lgdsunday.club/)。指南部署在独立子域名的根目录；原 `lgdsunday.club/note/` 和 `www.lgdsunday.club/note/` 均逐页 301 到新地址。

## 服务器目录

服务器只保留 `/sunday/resume2/AIGuide/` 一个项目目录：

```text
AIGuide/
├── index.html、文章、图片等网站文件
├── BingSiteAuth.xml
└── _ops/                    # 运维文件，网站禁止访问
    ├── nginx-note.conf      # 新域名的 Nginx 配置
    ├── main-site-robots.txt # 简历汪主站使用的 robots
    └── backups/             # 内容和配置备份
```

`/etc/nginx/conf.d/aiguide-note.conf` 是指向上述 `nginx-note.conf` 的符号链接。证书仍由系统 `/etc/letsencrypt/` 管理。上传站长验证文件时，放在 `AIGuide/` 根目录；本地同时放入 `public/`，以便随构建发布。

发布脚本会保护 `_ops/` 和 Bing 验证文件；打包内容备份时排除 `_ops/`，避免重复备份历史备份。目录合并详情见 [单目录维护记录](docs/audits/2026-09-29-single-directory.md)。

<div align="center">

<img src="assets/wechat-qrcode.jpg" alt="微信搜一搜或扫码关注公众号：程序员Sunday" width="520">

<br>

<b>微信搜一搜「程序员Sunday」，或扫码关注</b>
<br>
新文章第一时间推送 · 站点文章需要解锁时，回复「验证码」领取链接

</div>

## 仓库范围

本仓库只保存站点代码和配置，不提交文章正文、文章配图及生成缓存：

- `src/content/articles/`：由 `npm run sync` 从本地文章目录同步。
- `public/img/`、`img-src/`：同步、处理生成的文章配图。
- `.astro/`、`dist/`：构建缓存和产物。

这些文件保留在本地，仍可通过 `./deploy.sh --sync` 同步、构建和部署。
新克隆仓库需要先准备 `scripts/sources.json` 指定的本地文章来源，再运行同步。

### 固定 SEO 发布流程

日常仍执行 `./deploy.sh --sync`。新文章生成时同步登记英文 slug；脚本先检查再同步，缺少 slug 不再回落编号地址。已发布网址受保护，修改标题不会改变网址，改 slug、换路由分类或删除文章会阻止发布。构建后检查 canonical/sitemap，上传后核验线上清单及新增页面，再登记已发布地址。

只检查、不发布可运行 `npm run check:urls`。完整规则、失败恢复、限定发布和测试命令见 [SEO 与发布流程](SEO发布流程.md)。保护记录 `scripts/article-published-urls.json` 应随代码保存，不得删除以绕过检查；它不代表搜索引擎已经收录。

### 增量同步与图片缓存

`./deploy.sh --sync` 会比较最终正文和图片内容：正文未变化时不重写；图片按原图 SHA-256、处理脚本/参数、字体、Pillow/WebP 版本和输出哈希判断是否复用。仅修改文字不会重新打水印或压缩全部图片；同名换图、调整水印或压缩设置、删除/损坏输出都会触发相应更新。全量扫描成功后清理已删除资源，来源根目录不可用时停止以保留已有结果。

缓存位于 `.cache/image-pipeline/`，不提交、不上传。升级后的第一次运行需要建立可信缓存，会完整处理图片；之后自动复用。默认最多 4 个图片工作进程，内存紧张时可用 `AIGUIDE_IMAGE_WORKERS=1 ./deploy.sh --sync`。画质、尺寸和水印样式沿用原设置。

排查或强制重建图片时可分别执行：

```bash
npm run img:watermark -- --force
npm run img:optimize -- --force
npm run test:sync
```

水印、压缩和正文同步会打印更新/缓存数量及耗时；部署脚本另外显示构建、备份、上传等阶段和总耗时。原有 SEO、课程公开范围和搜索索引检查继续执行。缺少 Pillow 时停止处理，不跳过图片步骤。

## 搜索摘要与指定文章修订

在文章源目录的 `选题卡.md` 中填写 `- SEO 描述：...`，可单独设置页面搜索摘要。没有这个字段时，面试题继续从「面试速答」提取，教程继续使用选题卡描述或学习成果；`faqAnswer` 始终来自速答。搜索引擎可能根据正文重新生成摘要。

仅修订指定文章时，使用下面的限定同步，保留其他已同步正文与课程：

```bash
npm run sync:content -- --only=T002,Q005,Q028
node scripts/py.mjs scripts/watermark-images.py --only=T002,Q005,Q028
npm run build
```

`--only` 使用源稿全局编号；内容同步遇到空值、格式错误或未知编号会在清理前停止。配图命令按同一组编号限定处理范围。全量同步仍用于明确需要同步全部来源的场景。文章正文与摘要应修改源稿和选题卡，生成目录会被同步覆盖。

`src/data/article-related.ts` 为重点文章指定相关阅读编号，其余位置继续按同分类、同模块补齐至四篇。标题和地址读取真实文章集合，重复项和自身排除，未知编号阻止构建。

修订时 `date` 更新为源稿实际修改日期，`publishedDate` 优先读取 `scripts/article-published-dates.json`，否则沿用已生成页面的原日期。首批三篇的日期来自修订前线上 HTML 快照，配置留档使新克隆或清空生成目录后仍能保留既有 `datePublished`；这不代表重新核验了公众号首次发布日期。其他首次生成文章仍使用原有日期口径。

## 全栈面试题

顶部导航顺序为「首页 → AI 面试题 → 全栈面试题 → AI 编程教程 → Agent 大模型系统课」。模块入口保持为 `/programmer/`，收录前端、后端、数据库、缓存、网络、操作系统与并发等题；AI 面试题原有六个分类不变。

源稿放在 `../文章/全栈面试题/所属分类/Q编号-主题/正文.md`，沿用整个面试题库的唯一 Q 编号。模块内部分类、同步配置与网站侧栏对应如下：

| 本地分类 | 分类 URL | 内容边界 |
| --- | --- | --- |
| 前端面试题 | `/frontend/` | 浏览器、页面、前端框架与工程化 |
| 后端面试题 | `/backend/` | 接口、鉴权、队列、服务端实现与治理 |
| 数据库与缓存面试题 | `/database/` | MySQL、Redis、索引、事务与缓存机制 |
| 计算机基础面试题 | `/cs-basics/` | 网络、操作系统、数据结构与算法 |
| 系统设计面试题 | `/fullstack-system-design/` | 组合多个模块完成业务目标的系统方案 |

`scripts/sources.json` 的来源根目录为 `../文章/全栈面试题`，五个子目录均同步为 `module: programmer`。文章地址使用 `/{分类 slug}/q编号/`。原先暂用的 `programming` 分类尚无正文、未发布，已由这五类替代；模块入口 `/programmer/` 与顶部导航顺序保持不变。

2026-10-01 候选清单的第 11～20 题已划入此模块，仍为候选，不计入公开文章数量。现有文章不在此次调整中迁移，因此旧链接保持不变。未来若移动已发布文章，须同时设计永久重定向并更新题库记录。

验证：先运行 `npm run build`，再运行 `node --test scripts/tests/sync-content.test.mjs scripts/tests/programmer-module.test.mjs`。

## 左侧目录与下级分类

首页最新文章上方提供「从这里开始」：准备 AI 面试、集中复习 RAG、上手 AI 编程。桌面三个入口横排，手机纵向紧凑排列；首页选择分类或翻到后续页时收起引导区。独立路线分别位于 `/guides/ai-interview/`、`/guides/rag/`、`/guides/ai-coding/`，按阶段提供阅读目标、文章导读和自查问题。RAG 文章、其他 AI 面试题与教程的正文末尾连接对应路线。

`src/data/learning-guides.ts` 维护阅读顺序，按源稿全局 Q/T 编号选题，标题和地址直接读取同步后的文章集合。新增路线文章时填写编号和导读；引用缺失或重复文章会阻止构建。路线具有独立 SEO 元信息、面包屑和精选文章列表，站内搜索继续只索引正文。

列表页、文章页和课程页共用目录收起功能：桌面端收起后释放左侧空间，顶部保留「展开目录」，并记住偏好；手机端使用抽屉。列表页的分类名称用于筛选，旁边的独立箭头展开/收起下级专题，多个分支可同时展开，展开状态保存在当前会话。课程页继续使用章节目录。

全栈题的下级分类采用可选专题，不改正文目录、文章地址或分类内展示编号：

1. 在 `src/data/topics.json` 增加专题定义，使用稳定 ID，例如 `frontend:react`，`category` 对应既有分类 slug。
2. 在 `scripts/article-topics.json` 登记文章归属，例如 `{ "qnum": "Q096", "topic": "frontend:react" }`。编号使用源稿维护编号，每篇最多登记一个专题。
3. 执行 `npm run sync:content`，同步脚本生成 `topic` 元数据；不要手改生成的 Markdown。

仅展示已有正文的专题，空专题默认隐藏。一个主分类已有专题时，未登记专题的旧文章保留在「综合与其他」。列表页左栏始终保留主分类，没有专题的分类直接筛选右侧文章；空分类仍可进入筹备中的列表。文章页左栏改为「阅读目录」，只列当前分类或专题的文章，通过「← 全部分类」返回来源列表，恢复筛选、排序、分页及分类展开状态；直接进入文章时返回所属分类/专题。

阅读目录的短标题在 `src/data/article-navigation.json` 中按源稿全局编号（例如 `Q086`、`T001`）人工维护。新增文章未登记短标题时使用完整原标题，单行省略，悬停或键盘聚焦可查看完整问题。此配置只影响菜单，不修改正文标题、SEO、文章地址、编号或上一篇/下一篇顺序。专题筛选沿用分类页或模块页的 `?topic=` 参数，排序、分页、后退及分享链接均保留筛选状态，canonical 继续使用既有分类/模块页面。

MySQL、Redis、计算机网络、操作系统和前后端等专题随正文加入自然显示。未知专题、跨分类归属、重复登记或不存在的文章编号，会在同步清理旧产物之前报错。

## Agent 大模型系统课

课程入口为 `/agent-course/`，导航名为「Agent 大模型系统课」，页面主标题为「Agent 大模型 0 到 1 系统课」，副标题为「从大模型基础、RAG、MCP，到 LangChain、LangGraph 与多 Agent 应用开发」。SEO 继续保留慕课网《从 0 到 1 转型 Agent 应用开发工程师》的平台课名，正文不展示平台宣传。前两章 25 节全文免费，第三章起 69 节展示约 15% 试读，解锁按钮展示个人微信二维码与 **499 元**购买提示；购买后通过微信由作者提供学习方式，本站没有在线支付或账户授权系统。

```bash
npm run sync:course   # 只同步课程
npm run build         # 完整构建、SEO、搜索与内容公开范围检查
npm run preview      # 本地预览
```

`npm run sync` 与 `./deploy.sh --sync` 也包含课程同步。默认来源为 `../../Agent 全栈实战课/Agent 全栈课程文案`；可用 `AIGUIDE_COURSE_SOURCE` 指定另一位置。`scripts/course-lessons.json` 保存实际课程目录与固定 URL，新增小节时增加记录，改标题时保留 `id`。重复副本不导入，章内习题按章节采用相同的开放规则。

同步时会记录课程原稿的 SHA-256 指纹。同步完成到构建校验结束之间若继续编辑原稿，构建会提示具体小节“原稿在同步后发生了修改”并停止；保存编辑后重新执行 `npm run sync:course && npm run build`，或重新执行 `./deploy.sh --sync`。这类版本不一致不代表正文已泄漏，不应通过跳过保护检查解决。

同步脚本先解析 Markdown，在原稿中取前约 15% 的可读内容（文本、代码字符，图片按固定权重计），最多向前退到相邻完整句子或代码行。**先截取，再写入站点**，仅复制公开内容引用的图片；不使用 CSS 遮罩或本地密码隐藏全文。原稿、全文下载、后半部分配图不会复制到静态站点。生成内容在 `src/content/course/`，公开配图在 `public/course-assets/`，都不提交 Git；个人微信图片 `public/course-wechat.jpg` 是公开购买入口。

课程名称、价格、关键词和二维码配置在 `src/data/course.ts`；课程概览与文章具备独立标题、描述、canonical、面包屑、Course / Article JSON-LD、sitemap 与首页内链。试读页使用 `isAccessibleForFree: false`，且不加载面试文章的 TechGrow 验证码功能。搜索引擎与访客获得同一份试读内容。配置并不保证收录时间或排名；发布后可沿用已有 IndexNow / Bing 提交流程。

页面可见文案只展示课程与 Sunday，不展示慕课网平台宣传。平台名称仅保留在 SEO 标题、描述、关键词及对应分享元信息、结构化数据中；`seoTitle` / `seoDescription` 不用于页面正文。

Pagefind 是可被浏览器下载的站内搜索索引，只允许收录公开正文与试读，不能为了 SEO 将付费全文单独写入索引、JSON、JavaScript 或 source map。站内索引不等于百度或 Google 的搜索索引。若将来需要让外部搜索引擎收录付费全文，必须另行设计服务端内容存储、可靠的爬虫身份验证、付费内容标记及缓存隔离；目前未启用这类全文访问。

验证命令：`npm run test:course`（裁剪边界）；`npm run check:course`（94 节逐篇对照原稿、资源白名单、HTML / JS / JSON 等发布文本与解压后的 Pagefind 片段扫描、搜索标题一致性，需要本地课程源稿）。完整构建自动执行后者。新克隆仓库需要先准备课程源目录，再执行同步。

参考：[付费内容标记](https://developers.google.com/search/docs/appearance/structured-data/paywalled-content)、[搜索标题](https://developers.google.com/search/docs/appearance/title-link)、[Course 类型](https://schema.org/Course)。

## 网站文章标题

`scripts/article-titles.json` 按写作仓库的原始编号（如 `Q007`、`T009`，不是分类内重排后的展示编号）维护网站标题。现有 72 篇已逐篇审查，其中 37 篇调整、35 篇保留原标题；完整对照见 [网站标题审查](docs/audits/2026-09-29-website-titles.md)。这些是编辑优化，不代表已验证的排名提升。

执行 `./deploy.sh --sync` 时，同步脚本优先使用配置里的标题；没有配置的文章沿用源稿一级标题。网页 title、H1、列表、相关文章、结构化数据和站内搜索统一使用同步后的标题，公众号源稿与文章 URL 不变。配置中保留的标题会固定使用；以后源稿改题时，也应复查这一配置。

只在本地更新并检查：

```bash
npm run sync:content
npm run build
```

新增文章不强制填写配置。要让某篇恢复跟随源稿标题，删除对应项后重新同步。空标题、无效编号或损坏的 JSON 会在清理产物前报错；配置中的标题与同步结果不一致时，构建中的 SEO 检查会提示先同步。

同步链路的集成检查：`node --test scripts/tests/sync-content.test.mjs`。

## Bing URL 批量提交

运行环境为 macOS／Linux 与 Python 3，无需安装额外 Python 库。项目根目录 `.env` 中配置 `BING_API_KEY`，也兼容现有的 `BING-API—KEY` 键名。密钥与 `.bing/` 本地提交状态均不进入 Git。

```bash
# 查询文章站剩余额度、读取线上 sitemap 并预检页面，不提交
npm run bing:preview

# 默认仅提交文章站，兼容原有用法
npm run bing:submit

# 先提交简历汪，再提交文章站（自动任务使用此命令）
npm run bing:submit -- --site all

# 仅检查／提交简历汪的网站地图页面
npm run bing:preview -- --site www
npm run bing:submit -- --site www
```

脚本分别从简历汪 `https://www.lgdsunday.club/sitemap.xml` 和文章站 `https://note.lgdsunday.club/sitemap-index.xml` 自动读取并去重 URL，验证页面响应、canonical 与索引指令。简历汪覆盖地图中的首页、简历模板入口、指南等公开页面，新增到地图的页面会自动纳入。`--site all` 固定按简历汪、文章站顺序串行处理，各站分别查询验证状态与实际日／月剩余额度，每站每轮最多提交 500 条；超额部分留待下次运行。成功提交后保存线上 HTML 指纹，后续运行跳过未变化的页面。

文章站继续使用 `.bing/state.json` 和 `.bing/receipt-*.json`，简历汪单独使用 `.bing/www.lgdsunday.club/` 下的状态与回执。不要随意删除状态文件，否则脚本无法识别之前已提交的页面。网络超时、服务端错误或进程中断造成结果不确定时，脚本会保留该站在途状态并阻止自动重试，需要先核对回执和 Bing 后台。各站分别通过本地文件锁互斥；某站失败或额度不足不会阻止另一站检查。退出码 1 表示有站点失败，2 表示有站点额度不足，0 表示本轮正常结束；同时检查分站输出和回执，不把整体非零退出码误判为两站都未提交。

2026-09-29 检查发现简历汪有 8 个地图地址会永久跳转到带尾斜杠的页面，但落地页 canonical 仍声明地图原地址。脚本仅允许简历汪这类同站、同路径、只追加尾斜杠的 301／308 跳转，读取落地页验证其 canonical 与原地址一致且允许索引，然后按声明地址提交；回执中记录 `trailing_slash_redirects`。其他跳转与 API 重定向仍会停止处理。此兼容不等于修复了网站的跳转与 canonical 不一致，网站配置后续仍需统一。

这条命令使用站长后台 URL 提交对应的 API，与发布脚本已有的 IndexNow 通知是两种提交途径。一般发布更新继续使用现有 IndexNow 即可，无需为用完额度而重复提交。接口返回成功仅表示接收提交，不保证收录或排名。

本机已于 2026-09-29 在 Codex 中启用并更新「Bing URL 自动提交」任务，每天北京时间 10:00 在当前聊天执行 `npm run bing:submit -- --site all`，先简历汪、后文章站。没有页面变化时不输出例行通知，有提交结果或新的异常时按站点报告；额度不足或已知尾斜杠提示未变化时不重复通知。运行需要电脑开机、Codex 保持运行，并保留本地项目、`.env` 和 `.bing/`；任务配置由 Codex 管理，不会随 Git 克隆自动安装。可以直接在聊天中要求调整时间或暂停，也可以随时运行上面的命令手动检查或提交。[本地自动任务运行条件](https://learn.chatgpt.com/docs/automations?surface=app)。

提交逻辑的离线检查：`python3 -m unittest discover -s scripts/tests -p test_submit_bing.py -v`。

接口说明：[SubmitUrlBatch](https://learn.microsoft.com/en-us/dotnet/api/microsoft.bing.webmaster.api.interfaces.iwebmasterapi.submiturlbatch?view=bing-webmaster-dotnet)、[GetUrlSubmissionQuota](https://learn.microsoft.com/en-us/dotnet/api/microsoft.bing.webmaster.api.interfaces.iwebmasterapi.geturlsubmissionquota?view=bing-webmaster-dotnet)。

迁移验收与恢复位置见 [2026-09-28 子域名迁移记录](docs/audits/2026-09-28-note-migration.md)。旧 `/note/` 的跳转至少保留至 2027-09-28，建议长期保留。
