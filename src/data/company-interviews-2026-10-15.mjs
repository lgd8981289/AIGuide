// Q633–Q695：只记录公开原帖的实际提问，混合面经按公司与岗位拆分。
// 旧问题不扩写成新版本 API；参考回答中的库名不反推为面试官提问。
const question = (qnum, topic, question) => ({ qnum, topic, question, relation: 'mentioned' });
export const OCTOBER_15_REVIEWED_AT = '2026-10-15';

export const OCTOBER_15_REVIEWED_TOPICS = {
  "baidu-frontend-dependencies": [question("Q647", "行内与块级元素", "常见的行内元素和块级元素分别有哪些？")],
  "ali-backend-social-history": [question("Q652", "HashMap 写入、扩容与树化", "HashMap 的 put、get、扩容与链表转红黑树怎样实现？"), question("Q653", "synchronized 实现", "synchronized 的原理是什么，怎样保证重入和可见性？")],
  "meituan-backend-social-history": [question("Q653", "锁实现与对象头", "锁状态怎样变化，对象头与锁升级有什么关系？")],
  "meituan-development": [question("Q652", "HashMap 实现", "介绍一下 Java 的 HashMap。"), question("Q656", "Java 重载与重写", "Java 的重载和重写有什么区别？")],
  "baidu-java-campus-copy-on-write": [question("Q652", "HashMap 底层与扩容", "HashMap 的底层结构是什么，何时扩容，链表何时转红黑树？")],
  "byte-backend-solid": [question("Q652", "HashMap 底层", "是否了解 HashMap 的底层实现？")],
  "byte-tomato-backend": [question("Q652", "HashMap 扩容", "HashMap 怎样实现，何时扩容，扩容的时间复杂度是多少？")],
  "jd-java-campus-history": [question("Q652", "HashMap 原理", "HashMap 的实现原理是什么？")],
  "kuaishou-java-copy-on-write": [question("Q653", "synchronized 实现", "synchronized 怎样保证线程安全，怎样实现可重入？")],
  "meituan-java-dynamic-sql-lca": [question("Q653", "synchronized 底层", "synchronized 关键字的底层怎样实现，锁升级过程是什么？")],
  "byte-feishu": [question("Q687", "K 组链表反转", "怎样实现 K 个一组反转链表？")],
  "ali-platform-mem0-intern": [question("Q687", "K 组链表反转", "怎样实现 LeetCode 25 的 K 个一组反转链表？")],
  "baidu-agent-intern": [question("Q685", "二叉树序列化", "怎样实现二叉树的序列化与反序列化？")],
  "shopee-agent-september": [question("Q684", "编辑距离", "怎样实现编辑距离算法？")],
  "sangfor-python-memory": [question("Q678", "ARP 与地址解析", "ARP 协议怎样工作，第二次访问同一主机是否还需要发送 ARP 请求？")],
  "youzan-python-property": [question("Q679", "TCP Socket 调用流程", "TCP 编程的系统调用过程是什么？")],
  "shuzimali-java-safepoint": [question("Q689", "岛屿数量", "怎样计算岛屿数量？")],
  "kuaishou-testing-python-sort": [question("Q690", "全排列", "怎样实现 LeetCode 46 的全排列？")],
  "baidu-algorithm-python-files": [question("Q691", "最长公共子序列", "怎样求两个字符串的最长公共子序列？")],
  "meituan-java-safepoint": [question("Q686", "旋转排序数组查找", "怎样在旋转有序数组中找到指定值？")],
};

export const OCTOBER_15_INTERVIEW_SOURCES = [
  { id: "ali-agents-sdk-intern", company: "alibaba", role: "Agent算法", roleKey: "algorithm", stage: "27届实习",
    title: "【面经】阿里淘宝闪购 · Agent 算法工程师 · 27届实习一面 时长约 60 分钟", url: "https://www.nowcoder.com/discuss/879393838081597440",
    dateLabel: "页面显示 04-30 编辑，未明确年份；27届为原帖届次", topics: [
      question("Q633", "OpenAI Agents SDK 选型", "为什么选择 OpenAI Agents SDK，与其他框架相比怎样权衡安全合规？"),
    ] },
  { id: "ant-nlp-tot", company: "ant", role: "NLP算法（AI Force）", roleKey: "algorithm", stage: "原帖未明确批次",
    title: "蚂蚁-NLP算法面经", url: "https://www.nowcoder.com/feed/main/detail/7a19a8175ce741908e2a1c4a48f179bb",
    dateLabel: "正文记录 10 月 21 日、10 月 24 日面试，未明确面试年份；原帖编辑于 2025-03-25", topics: [
      question("Q637", "ToT 路径选择", "ToT 怎样选择推理路径？"),
      question("Q684", "编辑距离", "口述编辑距离算法。"),
    ] },
  { id: "wangsu-go-intern", company: "wangsu", role: "Go后端", roleKey: "backend", stage: "实习",
    title: "【面经】网宿科技-Go后端开发实习-二面面经", url: "https://www.nowcoder.com/discuss/834864582727368704",
    dateLabel: "原帖发布于 2025-12-28", topics: [
      question("Q661", "Go GMP", "Go 的 GMP 调度模型是什么，为什么需要 P？"),
      question("Q669", "Go context 取消传播", "多个 goroutine 怎样协同，context 的 Done 信号怎样传播？"),
      question("Q674", "Go GC", "Go 垃圾回收的大致流程是什么，为什么会有 STW？"),
    ] },
  { id: "tencent-teg-go-intern", company: "tencent", role: "开发（TEG；原帖未明确细分岗位）", roleKey: "development", stage: "实习（原帖标签）",
    title: "腾讯TEG 一面", url: "https://www.nowcoder.com/feed/main/detail/33a9b4917b1344f783d6383667328c16",
    dateLabel: "原帖编辑于 2024-03-25", topics: [
      question("Q661", "Go GMP", "GMP 模型怎样工作，线程切换与协程切换有什么区别？"),
      question("Q666", "Go defer 与 return", "defer 和 return 谁先执行，为什么？"),
      question("Q669", "Go context 协同取消", "两个 goroutine 中一个失败时，怎样利用 context 等机制让另一个也结束？"),
      question("Q675", "ZooKeeper 分布式锁", "ZooKeeper 怎样实现分布式锁？"),
    ] },
  { id: "changtianyou-go-campus", company: "changtianyou", role: "Go开发（原帖未明确细分岗位）", roleKey: "development", stage: "校招",
    title: "golang校招面试经历分享 · 畅天游部分", url: "https://www.nowcoder.com/discuss/353156426820427776",
    dateLabel: "原帖编辑于 2020-05-12；只取畅天游段落", topics: [
      question("Q662", "Go channel 缓冲", "Go 的无缓冲 channel 与有缓冲 channel 有什么区别？"),
      question("Q664", "Go map 并发安全", "原生 map 为什么不是线程安全的，加锁 map 和 sync.Map 怎样实现？"),
      question("Q665", "Go 接口与 nil", "Go 的 interface 怎样与 nil 比较？"),
      question("Q669", "Go context 超时", "Go 怎样使用 context 控制查询超时？"),
    ] },
  { id: "xiaomi-go-campus", company: "xiaomi", role: "Go开发（原帖未明确细分岗位）", roleKey: "development", stage: "校招",
    title: "golang校招面试经历分享 · 小米部分", url: "https://www.nowcoder.com/discuss/353156426820427776",
    dateLabel: "原帖编辑于 2020-05-12；只取小米段落", topics: [
      question("Q661", "Go 调度模型", "Go 的调度模型是什么？"),
      question("Q663", "Go slice 与 array", "Go 的 slice 与 array 有什么区别，切片怎样扩容？"),
      question("Q674", "Go 三色标记", "Go 的三色标记垃圾回收怎样工作？"),
    ] },
  { id: "4399-go-once-campus", company: "4399", role: "Java后端（含 Go 提问）", roleKey: "backend", stage: "25届秋招（标题）",
    title: "25秋招 - 后端（主Go） - 面经分享&经历回顾 Part.1 · 4399 Java 部分", url: "https://www.nowcoder.com/feed/main/detail/fdcfe849626a4711abc8d125d9702fc7",
    dateLabel: "原帖发布于 2025-04-17；只取 4399 Java 岗段落", topics: [
      question("Q670", "Go sync.Once", "Go 的 sync.WaitGroup 和 sync.Once 有什么区别？"),
      question("Q669", "Go context 超时", "Go 怎样使用 context 实现请求超时？"),
    ] },
  { id: "byte-go-channel-intern", company: "bytedance", role: "后端（国际化）", roleKey: "backend", stage: "日常实习",
    title: "字节跳动 国际化方向后台开发 日常实习面经（已拿offer）", url: "https://www.nowcoder.com/discuss/353157524952129536",
    dateLabel: "三面为 2021-02-04；原帖编辑于 2021-02-12", topics: [
      question("Q662", "Go channel 关闭", "Go channel 怎样实现，关闭以后继续发送或接收会怎样？"),
    ] },
  { id: "baidu-go-escape-intern", company: "baidu", role: "后端（搜索）", roleKey: "backend", stage: "日常实习",
    title: "百度搜索后端二面 9.2", url: "https://www.nowcoder.com/feed/main/detail/827bbf23fcac4e8c9efc5dabc129cb68",
    dateLabel: "标题记录 9 月 2 日二面；页面显示 09-11 编辑，未明确年份", topics: [
      question("Q673", "Go 逃逸分析", "讲讲 Go 的逃逸分析。"),
    ] },
  { id: "codingcat-frontend-dts", company: "codingcat", role: "前端", roleKey: "frontend", stage: "社招",
    title: "02.14 编程猫前端社招一面面经", url: "https://www.nowcoder.com/feed/main/detail/ceceb105bbfd4bf8aadd5a810c6fe9e3",
    dateLabel: "原帖编辑于 2025-02-14", topics: [
      question("Q650", "TypeScript 声明文件", "项目中的 .d.ts 文件有什么作用？"),
    ] },
  { id: "taotian-frontend-ellipsis", company: "taotian", role: "前端", roleKey: "frontend", stage: "暑期实习",
    title: "面经分享 |淘天前端一面", url: "https://www.nowcoder.com/feed/main/detail/558d2cb9ac114d1ca35b564856a59e70",
    dateLabel: "原帖发布于 2024-04-07", topics: [
      question("Q648", "CSS 文本省略", "单行和多行文字怎样设置省略号？"),
    ] },
  { id: "xiaohongshu-frontend-guards", company: "xiaohongshu", role: "前端（社区技术）", roleKey: "frontend", stage: "原帖未明确批次",
    title: "8.19 小红书-社区技术 前端一面", url: "https://www.nowcoder.com/feed/main/detail/66d5fe85c5b545e1b23bd044791f368c",
    dateLabel: "原帖发布于 2023-08-19", topics: [
      question("Q646", "Vue 导航守卫", "Vue 的导航守卫有哪些？"),
    ] },
  { id: "cmbnet-bigdecimal", company: "cmbnt", role: "开发（原帖未明确细分岗位）", roleKey: "development", stage: "原帖未明确批次",
    title: "招银网络科技面经", url: "https://www.nowcoder.com/feed/main/detail/cdca3a0ab06746fcacaa1af550ca7df1",
    dateLabel: "正文记录 9 月 11 日一面；页面显示 09-17 编辑，未明确年份", topics: [
      question("Q655", "BigDecimal 使用原因", "为什么要使用 BigDecimal？"),
    ] },
  { id: "pingan-java-spi", company: "pingan", role: "开发（原帖未明确细分岗位）", roleKey: "development", stage: "社招（正文描述跳槽与薪资）",
    title: "平安银行面经", url: "https://www.nowcoder.com/discuss/410892469259313152",
    dateLabel: "正文记录 9 月 23 日一面；原帖发布于 2022-10-15", topics: [
      question("Q657", "Java SPI", "Dubbo SPI 与 Java SPI 有什么区别？"),
    ] },
  { id: "nomura-webflux-intern", company: "nomura", role: "开发（原帖未明确细分岗位）", roleKey: "development", stage: "实习",
    title: "野村证券实习面经（Offer）", url: "https://www.nowcoder.com/discuss/353159623052042240",
    dateLabel: "正文记录 4 月 29 日二面；原帖编辑于 2022-05-11", topics: [
      question("Q652", "HashMap 底层", "介绍 HashMap 的底层实现。"),
      question("Q659", "Spring WebFlux", "WebFlux 的原理是什么，用到了哪些类？"),
    ] },
  { id: "meituan-security-filters", company: "meituan", role: "后端", roleKey: "backend", stage: "原帖未明确批次",
    title: "美团后端一面凉经", url: "https://www.nowcoder.com/feed/main/detail/95edb6d168b442aa8801840a4f520db7",
    dateLabel: "原帖编辑于 2025-03-26", topics: [
      question("Q660", "Spring Security 过滤器", "Spring Security 基于过滤器还是拦截器，有哪些过滤器，认证与鉴权有什么区别？"),
    ] },
  { id: "shannon-docker-service-mesh", company: "shannon", role: "开发（基础架构）", roleKey: "development", stage: "实习",
    title: "香侬科技基础架构实习生面经", url: "https://www.nowcoder.com/discuss/353155118407294976",
    dateLabel: "原帖编辑于 2019-07-11；正文明确区分基础架构与后台岗位", topics: [
      question("Q668", "Dockerfile 启动指令", "Dockerfile 的 CMD 与 ENTRYPOINT 有什么区别？"),
      question("Q695", "服务网格", "是否了解服务网格？"),
    ] },
  { id: "thunder-nginx-location", company: "thunder", role: "运维开发", roleKey: "operations", stage: "秋招",
    title: "秋招回顾3-雷霆游戏运维岗面经", url: "https://www.nowcoder.com/discuss/418140005200146432",
    dateLabel: "正文记录 9 月 18 日一面；原帖发布于 2022-11-04", topics: [
      question("Q667", "Nginx location 优先级", "一个请求能匹配多个 location 时，Nginx 按怎样的规则和优先级选择？"),
    ] },
  { id: "byte-frontend-ot-crdt", company: "bytedance", role: "前端", roleKey: "frontend", stage: "实习",
    title: "字节跳动 前端开发实习 面经（二面已挂）", url: "https://www.nowcoder.com/discuss/899078261152509952",
    dateLabel: "一面为 2026-05-06；页面显示 06-23 发布，未明确发布年份", topics: [
      question("Q694", "OT 与 CRDT", "介绍并比较协同编辑算法 CRDT 与 OT。"),
    ] },
  { id: "tencent-cloud-service-mesh", company: "tencent", role: "后端（TEG云架构平台）", roleKey: "backend", stage: "原帖未明确批次",
    title: "腾讯TEG云架构平台后端面经", url: "https://www.nowcoder.com/discuss/353158325527322624",
    dateLabel: "正文记录 8 月 24 日 HR 面；原帖编辑于 2021-08-24", topics: [
      question("Q695", "Service Mesh", "是否了解微服务中的 Service Mesh，讲一下它的概念。"),
    ] },
  { id: "weibu-frontend-promise", company: "weibu", role: "前端", roleKey: "frontend", stage: "秋招",
    title: "前端面经合集（小红书， 去哪，欢聚，游卡， 微步在线） · 微步在线部分", url: "https://www.nowcoder.com/discuss/353158611784376320",
    dateLabel: "正文记录 9 月 26 日一面；原帖发布于 2021-09-26", topics: [
      question("Q644", "手写 Promise", "怎样手写 Promise，并实现链式调用？"),
    ] },
  { id: "vastai-driver-algorithms", company: "vastai", role: "GPU驱动开发", roleKey: "development", stage: "原帖未明确批次",
    title: "瀚博半导体GPU驱动开发一面面经", url: "https://www.nowcoder.com/feed/main/detail/c026920386c446039dd750b08ed7cd18",
    dateLabel: "原帖发布于 2023-03-24", topics: [
      question("Q683", "每日温度", "怎样解决每日温度问题？"),
      question("Q688", "合并 K 个链表", "怎样合并多个有序链表？"),
    ] },
  { id: "netease-integer-campus-2018", company: "netease", role: "后端（游戏）", roleKey: "backend", stage: "2018秋招（标题）",
    title: "2018年秋招面经 · 网易游戏后台部分", url: "https://www.nowcoder.com/discuss/353154960995065856",
    dateLabel: "标题为 2018 年秋招；原帖编辑于 2019-04-11", topics: [
      question("Q654", "Java int 与 Integer", "Java 的 int 和 Integer 有什么区别？"),
    ] },
  { id: "baidu-data-window", company: "baidu", role: "大数据研发", roleKey: "development", stage: "校招秋招",
    title: "百度-大数据研发工程师面经", url: "https://www.nowcoder.com/feed/main/detail/54e8743123f7489aa042752a805b0529",
    dateLabel: "正文记录 8 月 22 日三面结束；原帖发布于 2023-08-22", topics: [
      question("Q692", "滑动窗口最大值", "怎样求滑动窗口最大值，并将优先队列解法优化为单调队列？"),
    ] },
  { id: "tencent-cpp-endianness", company: "tencent", role: "C++后端", roleKey: "backend", stage: "校招（原帖标签）",
    title: "腾讯 C++后台开发面经", url: "https://www.nowcoder.com/discuss/353155945926696960",
    dateLabel: "原帖编辑于 2019-11-30", topics: [
      question("Q679", "Socket 与 POSIX API", "TCP 握手与挥手状态怎样对应到 POSIX Socket API？"),
      question("Q680", "大小端", "怎样判断大小端，并把 int 的大端表示转换为小端表示？"),
      question("Q684", "编辑距离", "怎样求最小编辑距离？"),
      question("Q691", "最长公共子序列", "怎样求最长公共子序列 LCS？"),
    ] },
  { id: "jd-ai-backend-quicklist", company: "jd", role: "AI后端（京东科技）", roleKey: "backend", stage: "原帖未明确批次",
    title: "京东科技 AI后端开发一面 拥抱AI中", url: "https://www.nowcoder.com/feed/main/detail/982e512939ba4284af35dd4974eca42e",
    dateLabel: "页面显示 04-01 发布，未明确年份", topics: [
      question("Q677", "Redis quicklist", "Redis 为什么用 listpack 替换压缩列表，quicklist 的查询复杂度是多少？"),
    ] },
  { id: "meituan-algorithm-rainwater", company: "meituan", role: "搜推算法", roleKey: "algorithm", stage: "26届秋招（原帖标签）",
    title: "美团搜推算法面经（约三面了！）", url: "https://www.nowcoder.com/feed/main/detail/064ff826ba01411294afe698056a759f",
    dateLabel: "正文记录 8 月技术面；原帖发布于 2025-08-29", topics: [
      question("Q682", "接雨水", "怎样解决接雨水问题？"),
    ] },
  { id: "tencent-frontend-mixed-css", company: "tencent", role: "前端（CSIG）", roleKey: "frontend", stage: "校招",
    title: "前端面经 - 字节、百度、阿里、腾讯 · 腾讯 CSIG 一面", url: "https://www.nowcoder.com/discuss/353156557233922048",
    dateLabel: "原帖编辑于 2022-03-02；仅取腾讯 CSIG 一面段落", topics: [
      question("Q647", "行内与块级元素", "行内元素和块级元素有什么区别？"),
    ] },
  { id: "jd-social-zookeeper-bst", company: "jd", role: "Java后端", roleKey: "backend", stage: "社招",
    title: "社招一年半面经分享 · 京东部分", url: "https://www.nowcoder.com/discuss/353157517968613376",
    dateLabel: "历史面经，面试年份未明确；原帖编辑于 2024-07-19", topics: [
      question("Q675", "ZooKeeper 分布式锁", "除了 Redis，ZooKeeper 怎样实现分布式锁，两者各有什么优缺点？"),
      question("Q693", "验证二叉搜索树", "怎样验证一棵二叉树是二叉搜索树？"),
    ] },
].map(source => ({ ...source, reviewedAt: OCTOBER_15_REVIEWED_AT }));
