import type { LearningGuide } from './learning-guides'

const companyNote = '本页由程序员Sunday按岗位能力整理，用于投递前的自主复习。所选文章是通用技术解析，尚未标注可核验的该公司面经来源，不代表公司官方题库、实际考题或命中率。具体要求请以目标岗位 JD 和面试通知为准。'

export const RECRUITMENT_GUIDES: LearningGuide[] = [
  {
    slug: 'campus-interview', label: '校招面试题',
    title: '校招面试题与准备路线：基础、算法和项目怎么复习',
    description: '校招与实习面试怎么准备？按计算机基础、前后端方向、算法练习和项目表达整理阅读顺序，每阶段提供精选面试题、练习任务与自查问题。',
    cardDescription: '先补基础，再选方向，把知识用到项目回答里。', action: '查看校招路线',
    audience: '准备软件开发实习、春招或秋招，还没有形成复习顺序的同学。',
    approach: '先用基础题找到薄弱环节，再按投递方向选前端或后端。算法需要自己写代码、跑边界用例；项目则只讲自己做过且能解释清楚的部分。这里是复习顺序，不是固定天数的速成承诺。',
    module: 'programmer', browseHref: '/programmer/', browseLabel: '查看全部全栈面试题', reviewedAt: '2026-10-08',
    stages: [
      { id: 'basics', title: '把一次请求经过的基础知识串起来', goal: '从浏览器请求走到服务端，解释连接、加密、进程与线程分别解决什么问题。', checkpoint: '打开一个 HTTPS 页面时，哪些步骤属于网络，哪些属于应用？进程与线程参与了什么？', articles: [
        { qnum: 'Q092', reason: '理解连接建立与关闭，不只记握手次数。' },
        { qnum: 'Q093', reason: '把 HTTPS 的安全目标和 TLS 的作用连起来。' },
        { qnum: 'Q091', reason: '根据任务类型讨论并发方式。' },
      ] },
      { id: 'direction', title: '按前端或后端方向选题', goal: '前端先看执行顺序与缓存；后端先看索引与事务。另一方向可作为补充，不必平均分配时间。', checkpoint: '前端能否画出异步代码执行顺序？后端能否解释同一事务两次读到的数据为什么可能不同？', articles: [
        { qnum: 'Q104', reason: '前端方向：用小段代码检查事件循环理解。' },
        { qnum: 'Q105', reason: '前端方向：结合浏览器 Network 面板解释缓存。' },
        { qnum: 'Q087', reason: '后端方向：从查询需求理解索引结构。' },
        { qnum: 'Q089', reason: '后端方向：理解 MVCC 与可见性。' },
      ] },
      { id: 'practice', title: '用算法和项目证明你会应用', goal: '算法写出复杂度与测试用例；项目讲清输入、处理、输出、失败和验证。', checkpoint: '能否不看答案完成一道题，再用自己的项目解释一个技术取舍？没有实测数据时不要编造性能提升。', articles: [
        { qnum: 'Q202', reason: '练习根据数据规模选择 Top K 的解法。' },
        { qnum: 'Q333', reason: '练习状态定义、递推关系和空间优化。' },
        { qnum: 'Q013', reason: 'AI 应用方向的项目拆解示例，读后对照自己的实际实现。' },
      ] },
    ],
  },
  {
    slug: 'bytedance-interview', label: '字节面试题备考',
    title: '字节面试题怎么准备？算法、前端与服务端复习路线',
    description: '面向准备字节跳动开发岗位的同学，按算法、前端异步交互、服务端缓存和项目追问整理通用面试题，附练习建议与自查任务，不冒充真实面经。',
    cardDescription: '按目标岗位选择算法、交互或服务端练习。', action: '查看字节备考路线',
    audience: '计划投递字节跳动软件开发岗位，需要将通用题库整理成个人复习清单的同学。',
    approach: '先根据岗位 JD 圈出技术栈，再从下列三个阶段选题。前端岗位重点练执行顺序与交互状态，服务端岗位重点练数据查询与并发边界；算法题都应亲手实现。这里不判断某道题在字节出现的频率。',
    note: companyNote, module: 'programmer', browseHref: '/programmer/', browseLabel: '查看全部开发面试题', reviewedAt: '2026-10-08',
    stages: [
      { id: 'algorithms', title: '先把算法解法讲成推导过程', goal: '写代码前说明输入规模和约束，再比较解法、复杂度和边界。', checkpoint: 'Top K 在全量数据与流式输入下会怎么选？动态规划的状态能否用一句话讲清？', articles: [
        { qnum: 'Q202', reason: '练习堆、排序与快速选择的取舍。' },
        { qnum: 'Q333', reason: '从递归重复计算推导动态规划。' },
        { qnum: 'Q092', reason: '补上网络基础，避免只练算法忽略请求链路。' },
      ] },
      { id: 'frontend', title: '前端方向：追到异步交互和状态恢复', goal: '从代码执行顺序走到请求、渲染、清理与恢复，解释用户可见的问题。', checkpoint: '页面卸载后请求才返回、刷新时流式响应还没结束，这两种情况分别怎样处理？', articles: [
        { qnum: 'Q104', reason: '推演任务与微任务的执行顺序。' },
        { qnum: 'Q108', reason: '用依赖与清理函数分析副作用。' },
        { qnum: 'Q006', reason: '用流式聊天案例检查前后端状态边界。' },
      ] },
      { id: 'backend', title: '服务端方向：从慢查询追到缓存与锁', goal: '把查询计划、缓存失效和并发写入放进同一个业务场景考虑。', checkpoint: '缓存失效后大量请求同时访问数据库，怎样找到瓶颈，并验证缓解措施没有破坏正确性？', articles: [
        { qnum: 'Q090', reason: '从执行计划而非 SQL 外观判断索引使用。' },
        { qnum: 'Q086', reason: '区分不同缓存故障，避免套用同一方案。' },
        { qnum: 'Q088', reason: '继续追问锁过期和重复执行的边界。' },
      ] },
    ],
  },
  {
    slug: 'baidu-campus-interview', label: '百度校招面试题备考',
    title: '百度校招面试题准备：计算机基础、开发方向与项目表达',
    description: '准备百度校招或实习开发岗位，怎样安排复习？从网络和进程基础出发，选择前后端方向，再用算法练习与项目拆解检查掌握程度。',
    cardDescription: '适合应届生：找基础缺口，选方向，练项目表达。', action: '查看百度校招路线',
    audience: '准备百度校招或实习，项目经验有限、需要先建立复习框架的开发岗候选人。',
    approach: '先核对目标岗位的毕业时间、方向与技术要求，再按这条路线复习技术内容。每阶段用自己的话回答检查问题，答不清的题再回到正文。招聘时间和资格条件不在本站推测，需查看当期官方公告。',
    note: companyNote, module: 'programmer', browseHref: '/guides/campus-interview/', browseLabel: '继续查看通用校招路线', reviewedAt: '2026-10-08',
    stages: [
      { id: 'fundamentals', title: '校招基础：解释机制与边界', goal: '把网络、并发与缓存的基础概念讲成一次真实请求的流程。', checkpoint: '浏览器发起请求时，缓存能省掉哪些步骤？并发任务多了是否就一定更快？', articles: [
        { qnum: 'Q091', reason: '比较进程、线程与协程的使用条件。' },
        { qnum: 'Q093', reason: '说明加密、身份验证与证书的关系。' },
        { qnum: 'Q105', reason: '用请求与响应头说明浏览器缓存。' },
      ] },
      { id: 'role', title: '方向题：选择自己准备投递的技术栈', goal: '前端练 JavaScript 和组件状态；后端练数据库与认证。这里只选择与你岗位相符的部分。', checkpoint: '能否把一个概念落到自己写过的代码上？没有使用过的框架不要写成项目经历。', articles: [
        { qnum: 'Q104', reason: '前端候选人先推演异步代码的执行顺序。' },
        { qnum: 'Q109', reason: 'Vue 方向理解状态变化怎样触发更新。' },
        { qnum: 'Q087', reason: '后端候选人从索引结构理解查询代价。' },
        { qnum: 'Q106', reason: '用登录功能串起前后端职责。' },
      ] },
      { id: 'project', title: '项目表达：从做了什么走到为什么这样做', goal: '算法题展示推导能力；AI 应用项目展示检索、权限和评测，不把 Demo 包装成生产系统。', checkpoint: '选择一个真实项目，能否明确哪些是你实现的、哪些是依赖库完成的、哪些还没有验证？', articles: [
        { qnum: 'Q333', reason: '练习从简单问题建立可解释的算法思路。' },
        { qnum: 'Q013', reason: '参考知识库项目的需求与工程边界。' },
        { qnum: 'Q026', reason: 'AI 方向补上项目结果如何评测。' },
      ] },
    ],
  },
  {
    slug: 'baidu-frontend-interview', label: '百度前端面试题备考',
    title: '百度前端面试题准备：JavaScript、浏览器与 Vue React',
    description: '面向百度前端岗位备考，按 JavaScript 作用域与事件循环、浏览器缓存和跨域、Vue React 状态与副作用串起复习路线，并提供调试练习。',
    cardDescription: '从语言执行到浏览器，再到框架和页面交互。', action: '查看前端备考路线',
    audience: '准备百度前端开发岗位，希望从背概念转向代码推演与页面调试的同学。',
    approach: '先推演 JavaScript，再打开开发者工具检查请求和状态变化。Vue、React 按目标岗位及已有项目选择主线，不要求同时精通两个框架。用一段可运行代码或一张请求时序图验证每个回答。',
    note: companyNote, module: 'programmer', browseHref: '/frontend/', browseLabel: '查看全部前端面试题', reviewedAt: '2026-10-08',
    stages: [
      { id: 'javascript', title: 'JavaScript：先预测结果，再验证原因', goal: '从变量作用域走到事件循环，讲清读取时机与执行顺序。', checkpoint: '改动变量声明方式、加入一次 await 后，执行结果会怎么变？你的预测能否通过代码验证？', articles: [
        { qnum: 'Q236', reason: '用作用域和暂时性死区解释变量访问。' },
        { qnum: 'Q104', reason: '结合输出顺序检查任务与微任务理解。' },
      ] },
      { id: 'browser', title: '浏览器：在 Network 面板找到证据', goal: '让缓存、跨域和身份认证成为可观察的请求行为。', checkpoint: '一次带 Cookie 的跨域请求为什么会失败？你会检查哪些请求头、响应头与浏览器提示？', articles: [
        { qnum: 'Q105', reason: '识别强缓存命中与 304 协商缓存。' },
        { qnum: 'Q107', reason: '拆开 CORS 预检与携带凭证的要求。' },
        { qnum: 'Q106', reason: '分清 Cookie、Session 与 JWT 的职责。' },
      ] },
      { id: 'frameworks', title: '框架与项目：解释状态、清理和用户体验', goal: '从响应式或副作用机制出发，分析重复请求、状态失效与刷新恢复。', checkpoint: '同一个页面的请求重复发送，你怎样区分组件逻辑、依赖变化和开发环境行为？', articles: [
        { qnum: 'Q108', reason: 'React 方向理解依赖与清理，而非背生命周期对照表。' },
        { qnum: 'Q109', reason: 'Vue 方向解释 Proxy、ref 和 reactive 的边界。' },
        { qnum: 'Q006', reason: '用 AI 聊天交互练习连接与任务状态的设计。' },
      ] },
    ],
  },
  {
    slug: 'alibaba-backend-interview', label: '阿里后端面试题备考',
    title: '阿里后端面试题准备：MySQL、Redis、并发与系统设计',
    description: '准备阿里后端开发岗位，从 MySQL 索引和事务、Redis 缓存与分布式锁、认证及并发处理组织复习，每阶段附故障场景和验证思路。',
    cardDescription: '沿着一次请求复习查询、事务、缓存与并发。', action: '查看后端备考路线',
    audience: '准备阿里巴巴后端开发岗位，需要把数据库、缓存和服务端知识连成工程回答的同学。',
    approach: '先讲正确性，再讲性能。用自己熟悉的查询或写入流程串联各阶段，逐步增加并发、超时、缓存失效等条件。Java、Python 或其他语言的专有知识需继续按岗位 JD 补齐，本页聚焦共通的服务端能力。',
    note: companyNote, module: 'programmer', browseHref: '/backend/', browseLabel: '查看全部后端面试题', reviewedAt: '2026-10-08',
    stages: [
      { id: 'mysql', title: 'MySQL：查询快不快，数据对不对', goal: '从索引结构到执行计划，再到事务可见性，分别解释性能与正确性。', checkpoint: '同一条 SQL 在不同数据分布下变慢，你会收集哪些证据？事务里的快照又影响了什么？', articles: [
        { qnum: 'Q087', reason: '理解 B+ 树适合哪些访问模式。' },
        { qnum: 'Q090', reason: '通过 EXPLAIN 检查实际访问路径。' },
        { qnum: 'Q089', reason: '说明 MVCC 与 Read View 的可见性规则。' },
      ] },
      { id: 'redis', title: 'Redis：从缓存失效继续追到重复执行', goal: '区分缓存故障与并发控制，明确每种措施保护的对象。', checkpoint: '锁在业务完成前过期时，另一个请求能否进入？你会在业务层怎样保护重复操作？', articles: [
        { qnum: 'Q086', reason: '分清穿透、击穿与雪崩对应的压力来源。' },
        { qnum: 'Q088', reason: '理解分布式锁不能自动保证所有业务正确性。' },
        { qnum: 'Q028', reason: '用工具调用超时案例练习未知结果与幂等，迁移到服务间调用。' },
      ] },
      { id: 'service', title: '服务端设计：说清身份、并发与验收', goal: '把局部机制放回接口和系统边界，解释故障时的行为。', checkpoint: '选择一个做过的接口，说明身份校验、数据读写、失败重试和效果验证分别放在哪里。', articles: [
        { qnum: 'Q106', reason: '比较认证方式，避免把存储介质和认证方案混为一谈。' },
        { qnum: 'Q091', reason: '按 CPU 或 I/O 压力解释并发模型。' },
        { qnum: 'Q013', reason: '用带权限的知识库设计检查服务边界与评测闭环。' },
      ] },
    ],
  },
]
