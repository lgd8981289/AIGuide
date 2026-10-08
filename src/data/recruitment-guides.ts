import type { LearningGuide } from './learning-guides'

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
]
