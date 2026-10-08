// 只记录公开面经明确出现的考点；related 表示由考点延伸到本站解析。
// 日期描述保留“发表 / 编辑 / 面试”区别，不用页面更新时间冒充面试时间。
export const INTERVIEW_REVIEWED_AT = '2026-10-08';
export const INTERVIEW_NOTE = '真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。';
export const INTERVIEW_EMPTY_NOTE = '这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。';
export const INTERVIEW_ROLES = [
  { id: 'frontend', name: '前端' },
  { id: 'backend', name: '后端' },
  { id: 'development', name: '开发' },
  { id: 'agent', name: 'Agent开发' },
  { id: 'ai-application', name: 'AI应用开发' },
];

export const COMPANIES = [
  { id: 'bytedance', name: '字节跳动', label: '字节前端面试题', href: '/guides/bytedance-interview/', focus: '事件循环、Promise、React 与 TypeScript', guideSlug: 'bytedance-interview' },
  { id: 'baidu', name: '百度', label: '百度前端面试题', href: '/guides/baidu-frontend-interview/', focus: '闭包、浏览器缓存、Vue 与渲染', guideSlug: 'baidu-frontend-interview' },
  { id: 'alibaba', name: '阿里巴巴', label: '阿里后端面试题', href: '/guides/alibaba-backend-interview/', focus: 'ThreadLocal、并发与网络基础', guideSlug: 'alibaba-backend-interview' },
  { id: 'tencent', name: '腾讯', label: '腾讯后端面试题', href: '/companies/tencent/', focus: 'Java 并发、Redis 与 MySQL' },
  { id: 'meituan', name: '美团', label: '美团开发面试题', href: '/companies/meituan/', focus: 'Agent 上下文与记忆、Java 与缓存' },
  { id: 'jd', name: '京东', label: '京东后端校招面试题', href: '/companies/jd/', focus: 'Redis 数据类型、事务隔离与 I/O' },
  { id: 'xiaomi', name: '小米', label: '小米前端面试题', href: '/companies/xiaomi/', focus: 'JavaScript、浏览器与计算机基础' },
  { id: 'netease', name: '网易', label: '网易前端面试题', href: '/companies/netease/', focus: '跨域、缓存与服务端渲染' },
  { id: 'qunar', name: '去哪儿', label: '去哪儿AI应用开发面试题', href: '/companies/qunar/', focus: 'Java 并发与 AI 应用工程' },
];

const topic = (qnum, topic, relation = 'mentioned') => ({ qnum, topic, relation });
const sources = [
  { id: 'byte-ads', company: 'bytedance', title: '字节跳动商业化广告前端社招面经', url: 'https://www.nowcoder.com/discuss/786037843704479744', role: '前端', stage: '社招', dateLabel: '原帖编辑于 2025-09-01', topics: [
    topic('Q104', '事件循环'), topic('Q105', '强缓存与协商缓存'), topic('Q120', 'Promise.all 与 allSettled'), topic('Q116', '原型与继承'), topic('Q123', 'any、unknown、never'), topic('Q294', 'Error Boundary 与异步错误'), topic('Q301', 'useEffect 与 useLayoutEffect'),
  ] },
  { id: 'byte-feishu', company: 'bytedance', title: '字节跳动飞书多维表格实习面经（三面挂）', url: 'https://www.nowcoder.com/discuss/756639561995870208', role: '前端', stage: '实习', dateLabel: '原帖发布于 2025-05-26', topics: [topic('Q104', '事件循环代码输出'), topic('Q136', 'Fiber 中断与调度')] },
  { id: 'baidu-education', company: 'baidu', title: '百度教育 前端面经（已oc）', url: 'https://www.nowcoder.com/discuss/530709141912829952', role: '前端', stage: '实习（原帖标签）', dateLabel: '原帖编辑于 2023-09-15', topics: [
    topic('Q119', '防抖与节流'), topic('Q147', 'SSR 及其问题'), topic('Q149', '虚拟列表'), topic('Q236', 'var、let、const'), topic('Q105', '浏览器缓存'), topic('Q093', 'HTTP 与 HTTPS'), topic('Q110', '闭包'), topic('Q116', '原型'), topic('Q104', '事件循环'), topic('Q109', '从 Vue 响应式继续理解 Vue 3 实现', 'related'),
  ] },
  { id: 'baidu-campus', company: 'baidu', title: '百度秋招提前批前端一二三面面经（已意向书）', url: 'https://www.nowcoder.com/discuss/353158492217352192', role: '前端', stage: '校招', dateLabel: '面试记录为 2021 年 9 月；原帖编辑于 2021-10-04', topics: [
    topic('Q110', '闭包及使用场景'), topic('Q117', 'this 指向'), topic('Q105', '协商缓存'), topic('Q111', 'XSS 与 CSRF'),
  ] },
  { id: 'ali-cloud', company: 'alibaba', title: '阿里云后端面经', url: 'https://www.nowcoder.com/discuss/353159441665171456', role: '后端', stage: '原帖未明确批次', dateLabel: '原帖发布于 2022-03-29', topics: [
    topic('Q228', 'ThreadLocal'), topic('Q091', '进程与线程'), topic('Q328', '死锁'), topic('Q093', 'HTTP 与 HTTPS'), topic('Q106', '从 Cookie、Session 延伸比较 JWT', 'related'), topic('Q087', '从索引与最左匹配延伸理解 B+ 树', 'related'),
  ] },
  { id: 'tencent-backend', company: 'tencent', title: '腾讯后台开发面经（HR 部门）', url: 'https://www.nowcoder.com/discuss/721777560887013376', role: '后台开发', stage: '原帖未明确批次', dateLabel: '原帖编辑于 2025-02-19', topics: [
    topic('Q222', 'synchronized 与 ReentrantLock'), topic('Q157', '线程池参数'), topic('Q343', '线程安全单例'), topic('Q158', 'HashMap 与 ConcurrentHashMap'), topic('Q090', '索引失效与慢 SQL'), topic('Q245', '乐观锁与悲观锁'), topic('Q088', 'Redis 分布式锁'), topic('Q094', 'Redis 持久化'), topic('Q198', '进程间通信'), topic('Q074', 'Redis 与 MySQL 一致性'),
  ] },
  { id: 'meituan-development', company: 'meituan', title: '美团面经', url: 'https://www.nowcoder.com/discuss/794987987544133632', role: '开发（含 AI 项目追问）', stage: '原帖未明确批次', dateLabel: '原帖发布于 2025-09-09', topics: [
    topic('Q056', 'Agent 上下文超限'), topic('Q007', 'Agent 短期与长期记忆'), topic('Q060', '从长期记忆延伸到用户信息变化', 'related'), topic('Q062', '从 AI 问答数据集延伸到 RAG 评测集', 'related'), topic('Q026', '从 AI 评测延伸到 RAG 评测指标', 'related'), topic('Q241', 'CAS'), topic('Q157', '线程池'), topic('Q086', '缓存穿透与雪崩'), topic('Q187', 'Redis 集群分片与扩容'), topic('Q184', 'Redis 热 Key'),
  ] },
  { id: 'jd-campus', company: 'jd', title: '京东数据开发工程师后端一面', url: 'https://www.nowcoder.com/discuss/791720598454935552', role: '数据开发 / 后端', stage: '校招', dateLabel: '原帖发布于 2025-08-31（秋招记录）', topics: [
    topic('Q217', 'Redis 类型与底层结构'), topic('Q216', 'MySQL 隔离级别与可重复读'), topic('Q197', 'I/O 多路复用'), topic('Q074', 'Redis 与 MySQL 配合写入'), topic('Q343', '从单例延伸到线程安全实现', 'related'), topic('Q089', '从可重复读延伸到 MVCC', 'related'),
  ] },
  { id: 'xiaomi-frontend', company: 'xiaomi', title: '小米前端二面', url: 'https://www.nowcoder.com/discuss/625366409853280256', role: '前端', stage: '原帖未明确批次', dateLabel: '原帖编辑于 2024-05-29', topics: [
    topic('Q110', '闭包'), topic('Q116', '原型链'), topic('Q091', '进程与线程'), topic('Q328', '死锁'), topic('Q093', 'HTTP 与 HTTPS'), topic('Q105', '浏览器缓存'), topic('Q107', '跨域'), topic('Q106', '从 Cookie、Session 延伸比较 JWT', 'related'),
  ] },
  { id: 'netease-youdao', company: 'netease', title: '网易，腾讯，阿里前端面筋 · 网易有道部分', url: 'https://www.nowcoder.com/discuss/353156404150214656', role: '前端', stage: '原帖未明确批次', dateLabel: '历史面经，面试年份未明确；页面编辑于 2025-03-08', topics: [
    topic('Q107', '跨域'), topic('Q105', 'HTTP 缓存'), topic('Q147', 'SSR 与 SPA、服务端渲染问题'), topic('Q251', 'HTTP 状态码'),
  ] },
];

// 新增来源都逐条核对问题正文；不按文章关键词自动分配公司。
sources.push(
  { id: 'byte-agent-autumn', company: 'bytedance', title: '字节 Agent 秋招一面', url: 'https://www.nowcoder.com/discuss/929731481189044224', role: 'Agent开发', roleKey: 'agent', stage: '校招', dateLabel: '页面显示 09-16 编辑，未明确年份；标题为秋招', topics: [
    topic('Q056', '滑动窗口与摘要压缩的取舍'), topic('Q057', 'Agent Harness 的职责与选型'), topic('Q070', 'Computer Use 操作电脑的实现机制'), topic('Q087', 'MySQL 索引采用 B+ 树的原因'),
  ] },
  { id: 'byte-agent-september', company: 'bytedance', title: '字节跳动9.3 Agent开发一面面经', url: 'https://www.nowcoder.com/discuss/925342611194286080', role: 'Agent开发', roleKey: 'agent', stage: '校招（原帖标签）', dateLabel: '标题记录 9 月 3 日面试，页面显示 09-04 编辑；未明确年份', topics: [
    topic('Q057', 'Agent Harness 的含义'), topic('Q067', 'Agent 长任务延迟增加的定位方式'), topic('Q056', '上下文增大后的压缩与信息保留'), topic('Q019', '简历评分结果的结构化输出'),
  ] },
  { id: 'baidu-agent-intern', company: 'baidu', title: '9.7百度agent开发日常实习面经', url: 'https://www.nowcoder.com/feed/main/detail/bb8c28105f364770b57ff5eb5649cc60', role: 'Agent开发', roleKey: 'agent', stage: '实习', dateLabel: '标题记录 9 月 7 日面试，页面显示 09-07 发布；未明确年份', topics: [
    topic('Q023', '混合检索的实现'), topic('Q017', 'RAG 文档切片粒度的选择'), topic('Q060', 'Agent 长期记忆的实现'), topic('Q071', 'MCP stdio 与 Streamable HTTP 的机制'), topic('Q065', 'Agent 任务中断后的继续执行'), topic('Q067', '通过日志定位 Agent 执行卡点'),
  ] },
  { id: 'ali-frontend-history', company: 'alibaba', title: '网易，腾讯，阿里前端面筋 · 阿里钉钉部分', url: 'https://www.nowcoder.com/discuss/353156404150214656', role: '前端', stage: '原帖未明确批次', dateLabel: '历史面经，面试年份未明确；页面编辑于 2025-03-08', topics: [
    topic('Q104', '事件循环'), topic('Q110', '闭包'), topic('Q190', 'HTTP/2 的新特性'), topic('Q129', '从网络请求到页面渲染的过程'),
  ] },
  { id: 'tencent-frontend-history', company: 'tencent', title: '网易，腾讯，阿里前端面筋 · 腾讯 CDG 部分', url: 'https://www.nowcoder.com/discuss/353156404150214656', role: '前端', stage: '原帖未明确批次', dateLabel: '历史面经，面试年份未明确；页面编辑于 2025-03-08', topics: [
    topic('Q104', '事件循环'), topic('Q105', '浏览器缓存'), topic('Q126', 'BFC'), topic('Q298', '数组去重的实现方法'),
  ] },
  { id: 'qunar-ai-autumn', company: 'qunar', title: '去哪儿 AI应用开发(Java) 秋招', url: 'https://www.nowcoder.com/discuss/930185770202038272', role: 'AI应用开发（Java）', roleKey: 'ai-application', stage: '校招', dateLabel: '页面显示 09-17 发布，未明确年份；标题为秋招', topics: [
    { ...topic('Q157', '线程池的任务提交顺序与拒绝策略'), question: '任务到来时，线程池怎样在核心线程、队列和非核心线程之间分配？' },
  ] },
);

const additions = {
  'byte-feishu': [topic('Q331', '用哈希表实现两数之和'), topic('Q150', 'pnpm 与 npm 的安装机制')],
  'baidu-education': [topic('Q129', '浏览器输入 URL 后的请求与渲染'), topic('Q251', 'HTTP 状态码'), topic('Q233', 'CSS position 定位方式'), topic('Q143', 'Vue Router 的路由模式')],
  'ali-cloud': [topic('Q219', '从 JVM 模型延伸阅读内存区域', 'related'), topic('Q279', 'Java OOM 的原因'), topic('Q290', '网络分层与交换机、路由器'), topic('Q239', 'equals 与对象比较的关系', 'related')],
  'meituan-development': [topic('Q282', 'Java 接口与抽象类'), topic('Q309', 'Java 内存模型'), topic('Q246', '垃圾回收算法'), topic('Q222', 'synchronized 与 Lock'), topic('Q129', '浏览器输入网址的过程'), topic('Q087', 'MySQL 索引的数据结构')],
  'jd-campus': [topic('Q095', 'Redis 高性能的原因'), topic('Q161', 'Spring AOP 的含义')],
  'xiaomi-frontend': [topic('Q118', '深拷贝与浅拷贝'), topic('Q221', 'JavaScript 数据类型'), topic('Q190', 'HTTP 协议版本'), topic('Q194', 'GET 与 POST'), topic('Q125', 'CSS 盒模型'), topic('Q129', '浏览器请求与页面渲染'), topic('Q233', 'CSS 定位'), topic('Q256', 'Vue 3 生命周期'), topic('Q141', 'Vue 父子组件通信')],
  'netease-youdao': [topic('Q307', 'CSS 伪类与伪元素')],
};

// 明确的问题意图摘要。只概括原帖已有考点，不补写假想追问。
const questions = {
  Q007: 'Agent 的短期记忆和长期记忆分别适用于什么场景？',
  Q017: 'RAG 文档切片的粒度怎样确定？',
  Q019: 'AI 项目的评分结果如何结构化输出？',
  Q023: '项目中的混合检索如何实现？',
  Q056: 'Agent 上下文过长时怎样压缩，并减少信息损失？',
  Q057: 'Agent Harness 的职责是什么？',
  Q060: '项目中的长期记忆如何实现？',
  Q065: 'Agent 执行中断后怎样继续任务？',
  Q067: '怎样定位 Agent 执行延迟和卡点？',
  Q070: 'Computer Use 怎样操作本地或云端电脑？',
  Q071: 'MCP 的 stdio 与 Streamable HTTP 如何工作？',
  Q074: 'Redis 与 MySQL 结合使用时怎样处理缓存写入？',
  Q086: '怎样区分并处理缓存穿透与雪崩？',
  Q087: 'MySQL 索引使用什么数据结构？',
  Q088: '怎样使用 Redis 实现分布式锁？',
  Q090: '如何分析索引失效和慢 SQL？',
  Q091: '进程与线程有什么区别？',
  Q093: 'HTTP 与 HTTPS 有什么区别？',
  Q094: 'Redis 怎样进行持久化？',
  Q095: 'Redis 为什么能提供较高的访问性能？',
  Q104: '事件循环怎样决定 JavaScript 的执行顺序？',
  Q105: '浏览器缓存有哪些机制？',
  Q107: '浏览器跨域有哪些处理方式？',
  Q110: '闭包是什么，通常用于什么场景？',
  Q111: 'XSS 与 CSRF 有什么区别？',
  Q116: 'JavaScript 原型链怎样实现继承？',
  Q117: 'JavaScript 的 this 怎样确定？',
  Q118: '深拷贝和浅拷贝有什么区别？',
  Q119: '防抖与节流有什么区别，怎样实现防抖？',
  Q120: 'Promise.all 与其他组合方法怎样使用？',
  Q123: 'TypeScript 的 any、unknown、never 有什么区别？',
  Q125: 'CSS 盒模型怎样影响页面布局？',
  Q126: 'BFC 是什么？',
  Q129: '从输入网址到页面渲染经历哪些步骤？',
  Q136: 'React Fiber 怎样中断和调度渲染？',
  Q141: 'Vue 父子组件怎样通信？',
  Q143: 'Vue Router 的路由模式有哪些区别？',
  Q147: 'SSR 怎样工作，使用时遇到哪些问题？',
  Q149: '虚拟列表怎样实现？',
  Q150: 'pnpm 为什么可能比 npm 安装更快？',
  Q157: '线程池有哪些核心参数？',
  Q158: 'HashMap 与 ConcurrentHashMap 有哪些区别？',
  Q161: 'Spring AOP 怎样实现切面功能？',
  Q184: '怎样处理 Redis 热 Key？',
  Q187: 'Redis 分片集群增删节点有什么影响？',
  Q190: 'HTTP 的不同版本有哪些变化？',
  Q194: 'GET 与 POST 有什么区别？',
  Q197: 'I/O 多路复用怎样工作？',
  Q198: '进程之间有哪些通信方式？',
  Q216: 'MySQL 的事务隔离级别有哪些？',
  Q217: 'Redis 的数据类型和底层结构有哪些？',
  Q219: 'JVM 内存模型包含哪些区域？',
  Q221: 'JavaScript 有哪些数据类型？',
  Q222: 'synchronized 与 Lock 有哪些区别？',
  Q228: 'ThreadLocal 怎样工作？',
  Q233: 'CSS position 提供哪些定位方式？',
  Q236: 'var、let、const 的作用域有什么区别？',
  Q241: 'CAS 怎样实现原子更新？',
  Q245: '乐观锁与悲观锁有什么区别？',
  Q246: '垃圾回收有哪些基本算法？',
  Q251: '常见 HTTP 状态码表示什么？',
  Q256: 'Vue 3 有哪些生命周期钩子？',
  Q279: 'Java OOM 可能由哪些原因引起？',
  Q282: 'Java 接口与抽象类有什么区别？',
  Q290: '网络分层中交换机和路由器各负责什么？',
  Q294: 'React 错误边界能捕获哪些错误？',
  Q298: '怎样实现数组去重？',
  Q301: 'useEffect 与 useLayoutEffect 有什么区别？',
  Q307: 'CSS 伪类和伪元素有什么区别？',
  Q309: 'Java 内存模型怎样工作？',
  Q328: '死锁怎样产生，怎样避免？',
  Q331: '怎样用线性时间求两数之和？',
  Q343: '怎样实现线程安全的单例？',
};

export const INTERVIEW_SOURCES = sources.map(source => ({
  ...source,
  roleKey: source.roleKey ?? (source.role === '前端' ? 'frontend' : source.company === 'meituan' ? 'development' : 'backend'),
  reviewedAt: INTERVIEW_REVIEWED_AT,
  topics: [...source.topics, ...(additions[source.id] ?? [])].map(item => ({
    ...item,
    ...(item.relation === 'mentioned' ? { question: item.question ?? questions[item.qnum] } : {}),
  })),
}));
