// Q529–Q564：逐条核对候选人原帖。题意仅概括实际问题，
// 参考回答中的框架名称、版本与追问不反推为面试官提问。
const question = (qnum, topic, question) => ({ qnum, topic, question, relation: 'mentioned' });
export const REVIEWED_AT = '2026-10-12';

export const REVIEWED_INTERVIEW_TOPICS = {
  'baidu-education': [
    question('Q537', '数组扁平化', '怎样手写数组扁平化？'),
    question('Q539', '水平垂直居中', '怎样实现水平垂直居中？'),
    question('Q543', 'Vue 组件 data', 'Vue 2 组件的 data 为什么是函数？'),
  ],
  'ali-frontend-history': [question('Q539', '水平垂直居中', '有哪些实现水平垂直居中的方法？')],
  'tencent-frontend-history': [
    question('Q539', '水平垂直居中', '有哪些实现水平垂直居中的方案？'),
    question('Q559', 'WebSocket 协议机制', 'WebSocket 位于哪一层，升级握手、通信方式和传输格式怎样工作？'),
  ],
  'ctrip-frontend-autumn-dependencies': [question('Q539', '水平垂直居中', '如何实现水平垂直居中？')],
  'tencent-backend': [question('Q553', 'RPC', '什么是 RPC，用过哪些 RPC 框架？')],
  'meituan-java-spring-intern': [question('Q553', 'RPC 调用原理', '是否了解 Dubbo，RPC 机制的原理是什么？')],
  'byte-backend-social-history': [
    question('Q556', '慢查询定位', '线上遇到慢查询时，怎样定位并优化？'),
    question('Q562', '最长回文子串', '给定字符串，怎样求最长回文子串的长度？'),
    question('Q563', '二叉树最近公共祖先', '给定二叉树，怎样找到两个指定节点的最近公共祖先？'),
  ],
  'byte-risk-algorithm': [question('Q561', '最大子数组和', '怎样求最大连续子数组和？')],
  'youzan-python-property': [question('Q563', '二叉树最近公共祖先', '怎样找出二叉树节点的最近公共祖先？')],
};

export const NEW_INTERVIEW_SOURCES = [
  { id: 'byte-openclaw-intern', company: 'bytedance', role: '后端开发', roleKey: 'backend', stage: '日常实习',
    title: '字节跳动 后端开发 日常实习 二面', url: 'https://www.nowcoder.com/feed/main/detail/73bce80cf20842ffa05a797d844713ff',
    dateLabel: '正文记录 4 月 13 日二面；页面显示 04-28 编辑，未明确年份', topics: [
      question('Q529', 'OpenClaw', '是否使用过 OpenClaw？'),
    ] },
  { id: 'meituan-fullstack-sdd', company: 'meituan', role: '全栈开发', roleKey: 'development', stage: '原帖未明确批次',
    title: '美团全栈一面', url: 'https://www.nowcoder.com/feed/main/detail/f701394284684a3e8e535d2bc1e4cf89',
    dateLabel: '页面显示 04-24 发布，未明确年份', topics: [
      question('Q535', 'SDD 规格驱动开发', 'SDD 主要是什么？'),
    ] },
  { id: 'kuaishou-growth-sdd', company: 'kuaishou', role: '前端（增长）', roleKey: 'frontend', stage: '原帖未明确批次',
    title: '快手增长前端二面', url: 'https://www.nowcoder.com/discuss/919940466508857344',
    dateLabel: '面试记录为 2026-08-07；页面显示 08-20 发布，未明确发布年份', topics: [
      question('Q535', 'SDD 与 TDD 研发流程', 'SDD 与 TDD 全链路 AI 研发的远端执行架构是什么，你在这套流程中做了哪些工作？'),
    ] },
  { id: 'meituan-fullstack-voice-agent', company: 'meituan', role: '软件开发（全栈）', roleKey: 'development', stage: '暑期实习',
    title: '美团 软件开发（全栈）暑期实习 面经全记录（二面', url: 'https://www.nowcoder.com/feed/main/detail/6c36de1ad1354e17b3e6ab2d6b63167f',
    dateLabel: '正文记录 4 月 7 日二面；页面显示 04-11 编辑，未明确年份', topics: [
      question('Q536', '语音下单 Agent', '如何在美团 App 集成语音下单 Agent，用户长时间没有收到反馈时怎样改善体验？'),
    ] },
  { id: 'music-frontend-tree-preload', company: 'tencent', role: '前端（腾讯音乐）', roleKey: 'frontend', stage: '秋招（原帖标题）',
    title: '腾讯音乐内推腾讯音乐面经 · 前端一二面', url: 'https://www.nowcoder.com/discuss/727507402857127936',
    dateLabel: '正文记录 9 月 24 日、9 月 26 日面试，未明确面试年份；原帖发布于 2025-03-07', topics: [
      question('Q538', '数组转树', '怎样将数组转换成树形结构？'),
      question('Q540', 'preload 与 prefetch', 'preload 和 prefetch 有什么区别，分别适合哪些资源？'),
    ] },
  { id: 'byte-tomato-custom-hook', company: 'bytedance', role: '前端（番茄小说）', roleKey: 'frontend', stage: '原帖未明确批次',
    title: '字节跳动（番茄小说）前端一面挂', url: 'https://www.nowcoder.com/discuss/875772682124414976',
    dateLabel: '页面显示 04-22 编辑，未明确年份', topics: [
      question('Q541', '自定义 Hook 与工具函数', '自定义 Hook 与工具函数有什么区别，复用逻辑时为什么还需要自定义 Hook？'),
    ] },
  { id: 'byte-frontend-decorators', company: 'bytedance', role: '前端（商业变现）', roleKey: 'frontend', stage: '校招',
    title: '前端面经 - 字节、百度、阿里、腾讯 · 字节商业变现一面', url: 'https://www.nowcoder.com/discuss/353156557233922048',
    dateLabel: '字节校招一面记录为 2020-10-28；原帖编辑于 2022-03-02', topics: [
      question('Q544', '装饰器的使用范围', '是否使用过装饰器，装饰器能否用于函数？'),
    ] },
  { id: 'meituan-java-dynamic-sql-lca', company: 'meituan', role: 'Java后台开发', roleKey: 'backend', stage: '春招实习（原帖标签）',
    title: '美团一面面经，Java后台开发', url: 'https://www.nowcoder.com/discuss/353154361599664128',
    dateLabel: '原帖编辑于 2018-05-02', topics: [
      question('Q546', 'MyBatis 动态 SQL', 'MyBatis 动态 SQL 如何实现？'),
      question('Q563', '二叉树最近公共祖先', '怎样找到二叉树中两个节点的最近公共祖先？'),
    ] },
  { id: 'geely-java-dynamic-sql', company: 'geely', role: '后端开发（数字化）', roleKey: 'backend', stage: '原帖未明确批次',
    title: '吉利数字化后端面经', url: 'https://www.nowcoder.com/feed/main/detail/6fdc176992134a5187e4880131883e46',
    dateLabel: '原帖编辑于 2025-09-24', topics: [
      question('Q546', 'MyBatis 静态与动态 SQL', 'MyBatis 怎样解析 SQL，静态 SQL 与动态 SQL 的底层机制有什么区别？'),
    ] },
  { id: 'sangfor-python-memory', company: 'sangfor', role: 'Python开发', roleKey: 'development', stage: '校招（原帖标签）',
    title: '深信服python开发一二+hr面面经（已offer）', url: 'https://www.nowcoder.com/discuss/353157075456958464',
    dateLabel: '正文记录 9 月 19 日、9 月 20 日技术面；原帖编辑于 2020-09-27', topics: [
      question('Q547', 'Python 内存管理与 GC', 'Python 怎样管理内存，其垃圾回收方式和底层实现是什么？'),
    ] },
  { id: 'byte-python-args-intern', company: 'bytedance', role: '后端开发', roleKey: 'backend', stage: '实习',
    title: '字节跳动 后端开发实习生 一面+二面+三面+HR面 面经', url: 'https://www.nowcoder.com/discuss/353156033939972096',
    dateLabel: '正文记录 2 月 4 日一面；原帖编辑于 2020-02-10', topics: [
      question('Q548', 'Python 可变参数', 'Python 的可变参数 *args 和 **kwargs 怎样使用？'),
    ] },
  { id: 'suunto-frontend-buffer', company: 'suunto', role: 'Web前端', roleKey: 'frontend', stage: '原帖未明确批次',
    title: '颂拓运动前端面试（web）面经', url: 'https://www.nowcoder.com/feed/main/detail/eff555a434b4410aa7014ab2b0a2082b',
    dateLabel: '页面显示 08-31 编辑，未明确年份', topics: [
      question('Q549', 'Node.js Buffer', 'Node.js 的 Buffer 和普通 Array 有什么区别？'),
    ] },
  { id: 'huawei-od-python-frameworks', company: 'huawei', role: '开发（OD；原帖未明确细分岗位）', roleKey: 'development', stage: 'OD招聘（原帖自述）',
    title: '华为od面经（已OC）', url: 'https://www.nowcoder.com/discuss/393456265995751424',
    dateLabel: '正文记录 7 月技术面、8 月资面；原帖编辑于 2022-09-09', topics: [
      question('Q550', 'Flask 与 Django 选型', 'Flask 和 Django 的优劣势是什么，应该如何选择？'),
    ] },
  { id: 'jiawei-python-frameworks', company: 'jiawei', role: 'Python后端', roleKey: 'backend', stage: '原帖未明确批次',
    title: '嘉为Python后端', url: 'https://www.nowcoder.com/feed/main/detail/047e3f988b0e4bd69ec9ba2b19ba8fc2',
    dateLabel: '原帖发布于 2025-10-21', topics: [
      question('Q550', 'Python Web 框架选型', '为什么选择 Django，而不是 Flask 或 FastAPI？'),
    ] },
  { id: 'huawei-ict-comparator', company: 'huawei', role: '软件开发（南研所 ICT 通软）', roleKey: 'development', stage: '原帖未明确批次',
    title: '华为 南研所 ict 通软 面经', url: 'https://www.nowcoder.com/feed/main/detail/b49d06bb5cba4e05b1824845517a82df',
    dateLabel: '正文记录 9 月 30 日面试；原帖编辑于 2024-10-08', topics: [
      question('Q551', 'Comparable 与 Comparator', 'Comparable 和 Comparator 有什么区别？'),
    ] },
  { id: 'meituan-java-safepoint', company: 'meituan', role: 'Java后台开发', roleKey: 'backend', stage: '原帖未明确批次',
    title: '美团Java一面面经', url: 'https://www.nowcoder.com/discuss/353154090760871936',
    dateLabel: '正文记录 8 月 31 日面试；原帖发布于 2017-08-31', topics: [
      question('Q552', 'Safepoint 与安全区域', 'JVM 的 Safepoint 和安全区域是什么？'),
    ] },
  { id: 'shuzimali-java-safepoint', company: 'shuzimali', role: '开发（原帖未明确细分岗位）', roleKey: 'development', stage: '校招补录',
    title: '数字马力校招补录一二面[凉经]', url: 'https://www.nowcoder.com/discuss/504260101855850496',
    dateLabel: '正文记录 6 月 20 日、6 月 28 日技术面；原帖发布于 2023-06-30', topics: [
      question('Q552', 'JVM Safepoint', '是否了解 JVM 的 Safepoint？'),
    ] },
  { id: 'kuaishou-frontend-docker-volume', company: 'kuaishou', role: '前端', roleKey: 'frontend', stage: '暑期实习',
    title: '快手前端暑期实习面经', url: 'https://www.nowcoder.com/feed/main/detail/fd788c6b04504aa6b3bf26c492b3edb6',
    dateLabel: '正文记录 4 月 24 日一面；原帖编辑于 2025-05-08', topics: [
      question('Q554', 'Docker 数据卷', 'Docker 数据卷如何使用？'),
      question('Q539', 'Flex 居中', '怎样用 Flex 实现居中，flex 是哪些属性的组合？'),
    ] },
  { id: 'lilith-platform-statefulset', company: 'lilith', role: '平台运维', roleKey: 'operations', stage: '实习',
    title: '莉莉丝-平台运维实习面经', url: 'https://www.nowcoder.com/feed/main/detail/41883e388cc14abe97de11d46816e45d',
    dateLabel: '正文记录 5 月 11 日一面通知、5 月 15 日二面；页面显示 05-20 编辑，未明确年份', topics: [
      question('Q555', 'Deployment 与 StatefulSet', 'Deployment 和 StatefulSet 有什么区别？'),
    ] },
  { id: 'meituan-dianping-delete-space', company: 'meituan', role: 'Java开发（原帖标签）', roleKey: 'development', stage: '校招（原帖标签）',
    title: '美团点评二面面经（8.19下午4点-5点）', url: 'https://www.nowcoder.com/discuss/353156795281645568',
    dateLabel: '标题记录 8 月 19 日二面；原帖编辑于 2020-08-20', topics: [
      question('Q557', '删除数据与 B+ 树空洞', '数据库表删除数据后，B+ 树为什么会留下空洞？'),
    ] },
  { id: 'byte-tiktok-redis-latency', company: 'bytedance', role: '后端（TikTok）', roleKey: 'backend', stage: '26届秋招（原帖标签）',
    title: '字节tt后端一面', url: 'https://www.nowcoder.com/discuss/791748280790056960',
    dateLabel: '原帖发布于 2025-08-31', topics: [
      question('Q558', 'Redis 慢请求排查', 'Redis 慢查询可能由什么引起，怎样区分网络波动和大 Key 问题？'),
    ] },
  { id: 'byte-tiktok-mysql-slowlog', company: 'bytedance', role: 'Java后端（TikTok）', roleKey: 'backend', stage: '暑期实习',
    title: '字节tiktok后端一面凉经', url: 'https://www.nowcoder.com/discuss/353159601715617792',
    dateLabel: '原帖发布于 2022-04-23，正文称面试在前一晚', topics: [
      question('Q556', 'MySQL 慢查询日志', 'MySQL 慢查询日志是什么？'),
    ] },
  { id: 'pingtouge-false-sharing', company: 'pingtouge', role: '开发（原帖未明确细分岗位）', roleKey: 'development', stage: '秋招',
    title: '平头哥 秋招 一面', url: 'https://www.nowcoder.com/feed/main/detail/ca3803f5c0934d22b3d048feaeedf61a',
    dateLabel: '原帖发布于 2025-09-22', topics: [
      question('Q560', 'CPU 缓存伪共享', '什么是伪共享，怎样避免？'),
    ] },
  { id: 'cambricon-framework-false-sharing', company: 'cambricon', role: '深度学习框架开发', roleKey: 'development', stage: '校招（原帖标签）',
    title: '寒武纪深度学习框架开发一面面经', url: 'https://www.nowcoder.com/discuss/353156759772667904',
    dateLabel: '原帖编辑于 2020-08-15', topics: [
      question('Q560', 'CPU 缓存伪共享', '并行编程中的 CPU 缓存伪共享是什么？'),
    ] },
  { id: 'byte-backend-solid', company: 'bytedance', role: '后端', roleKey: 'backend', stage: '原帖未明确批次',
    title: '字节后端一面凉经', url: 'https://www.nowcoder.com/feed/main/detail/d8aaa09a1b0c4ae1b6eb9b2e0e96b68f',
    dateLabel: '页面显示 03-13 发布，未明确年份', topics: [
      question('Q564', 'SOLID 设计原则', '软件工程中的 SOLID 原则是什么？'),
    ] },
  { id: 'huawei-tongruan-solid', company: 'huawei', role: '软件开发（通软）', roleKey: 'development', stage: '原帖未明确批次',
    title: '华为-通软-线下一二面面经', url: 'https://www.nowcoder.com/discuss/694301375290687488',
    dateLabel: '正文记录 2024-09-25 面试；原帖编辑于 2024-12-05', topics: [
      question('Q564', 'SOLID 设计原则', '介绍 SOLID 设计原则。'),
    ] },
].map(source => ({ ...source, reviewedAt: REVIEWED_AT }));
