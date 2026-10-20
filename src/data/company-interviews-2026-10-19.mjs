// Q696–Q758：按候选人原帖明确问法登记；混合面经按公司段落拆分。
const question = (qnum, topic, question) => ({ qnum, topic, question, relation: 'mentioned' });
export const OCTOBER_19_REVIEWED_AT = '2026-10-19';

export const OCTOBER_19_REVIEWED_TOPICS = {
  "changtianyou-go-campus": [question("Q716", "Go 包初始化", "Go 的 init 按什么顺序执行？")],
  "baidu-go-escape-intern": [question("Q714", "UTF-8 字符串截取", "用 Go 按 offset 和 length 截取 UTF-8 子串，不能隐式转换或深拷贝，怎样实现？"), question("Q722", "pprof 排障", "CPU 利用率报警时怎样排查，是否用过 pprof？")],
  "wangsu-go-intern": [question("Q717", "goroutine 协同与等待", "项目中怎样处理多个 goroutine 的协同工作？")],
  "4399-go-once-campus": [question("Q720", "Go 原子操作", "Go 语言中常见的原子操作有哪些？"), question("Q726", "Go 交叉编译", "如何在 Windows 开发环境打包 Go 代码，并使其在 Linux 上运行？")],
  "byte-xingfuli-campus": [question("Q750", "空闲回调与调度", "React scheduler 如何模拟 requestIdleCallback，安排任务执行时机？"), question("Q753", "前缀树与智能提示", "怎样设计电话号码智能提示的数据结构，在输入前缀后提示后续号码？")],
};

export const OCTOBER_19_INTERVIEW_SOURCES = [
  { id: "anker-go-pprof", company: "anker", role: "Go开发（原帖未明确细分岗位）", roleKey: "development", stage: "实习", title: "安克创新golang面经", url: "https://www.nowcoder.com/feed/main/detail/4eae9ad3eba54cf09d9df14a7bba18b1", dateLabel: "原帖编辑于 2025-07-16",
    reviewedAt: OCTOBER_19_REVIEWED_AT, topics: [
      question("Q722", "pprof", "怎样用 pprof 排查内存泄漏和 CPU 飙高？"),
      question("Q724", "HTTP 连接池", "Go HTTP 连接池有哪些配置参数？"),
    ] },
  { id: "yunlan-go-runtime", company: "yunlan", role: "Go开发（原帖未明确细分岗位）", roleKey: "development", stage: "社招", title: "云览科技一面", url: "https://www.nowcoder.com/discuss/927594026935554048", dateLabel: "正文明确面试于 2026-09-09；页面显示 09-10 发布，未明确发布年份",
    reviewedAt: OCTOBER_19_REVIEWED_AT, topics: [
      question("Q717", "WaitGroup 等待语义", "加了 sync.WaitGroup 以后，多个 goroutine 为什么仍不能保证按顺序输出？"),
      question("Q720", "原子指针更新", "并发更新 Map 指针是否安全，直接赋新指针与使用 atomic 有什么区别？"),
      question("Q722", "pprof 与 goroutine 排障", "线上 goroutine 从 2000 增长到 10 万，怎样用 pprof 确认泄漏位置？"),
      question("Q723", "goroutine 泄漏", "线上 goroutine 从 2000 增长到 10 万，怎样定位泄漏及其原因？"),
    ] },
  { id: "tencent-ieg-pprof", company: "tencent", role: "后台开发（IEG 天美）", roleKey: "backend", stage: "暑期实习（原帖说明）", title: "腾讯IEG 天美 后台开发面经", url: "https://www.nowcoder.com/discuss/593467348468715520", dateLabel: "原帖发布于 2024-03-02",
    reviewedAt: OCTOBER_19_REVIEWED_AT, topics: [
      question("Q722", "pprof", "怎样排查内存泄漏问题，pprof 怎样使用？"),
    ] },
  { id: "tencent-go-generics", company: "tencent", role: "后端开发", roleKey: "backend", stage: "日常实习", title: "腾讯日常一面面经", url: "https://www.nowcoder.com/feed/main/detail/63b4b82b0b8c476d9ab4474d551d8995", dateLabel: "原帖编辑于 2025-10-23",
    reviewedAt: OCTOBER_19_REVIEWED_AT, topics: [
      question("Q710", "Go 泛型与接口", "Go 的泛型和接口有什么区别？"),
      question("Q718", "singleflight", "singleflight 怎样实现，是否并发安全，怎样处理结果污染与调用失败后其他请求等待的问题？"),
      question("Q755", "回文链表", "怎样检测回文链表？"),
    ] },
  { id: "byte-ai-go-generics", company: "bytedance", role: "后端开发（AI中台）", roleKey: "backend", stage: "原帖未明确批次", title: "字节后端（AI中台）面经", url: "https://www.nowcoder.com/feed/main/detail/e788d5e5ce6f4c8c90e2d90b99ceeee3", dateLabel: "原帖发布于 2025-10-28",
    reviewedAt: OCTOBER_19_REVIEWED_AT, topics: [
      question("Q710", "Go 泛型", "Go 泛型是什么，与 Java 泛型有什么区别？"),
    ] },
  { id: "byte-testing-make", company: "bytedance", role: "研发工程师（质量保障方向）", roleKey: "test-development", stage: "提前批", title: "7.14 字节 提前批 研发工程师 质量保障方向 一面面经", url: "https://www.nowcoder.com/discuss/377123435464417280", dateLabel: "原帖发布于 2022-07-14",
    reviewedAt: OCTOBER_19_REVIEWED_AT, topics: [
      question("Q712", "make 与 new", "Go 语言中 new 和 make 有什么区别？"),
    ] },
  { id: "byte-live-make", company: "bytedance", role: "后端开发（抖音直播）", roleKey: "backend", stage: "秋招", title: "字节抖音直播 后端开发 秋招面经", url: "https://www.nowcoder.com/discuss/593466235547893760", dateLabel: "原帖编辑于 2024-03-02",
    reviewedAt: OCTOBER_19_REVIEWED_AT, topics: [
      question("Q712", "make 与 new", "Go 的 make 和 new 有什么区别？"),
    ] },
  { id: "tencent-mixed-go", company: "tencent", role: "后端开发", roleKey: "backend", stage: "社招", title: "腾讯、字节跳动、b站后端面经", url: "https://www.nowcoder.com/discuss/353156346994434048", dateLabel: "原帖编辑于 2020-04-20",
    reviewedAt: OCTOBER_19_REVIEWED_AT, topics: [
      question("Q712", "make 与 new", "Go 的 new 和 make 有什么区别？"),
      question("Q722", "pprof", "怎样用 pprof 定位问题并进行调优？"),
    ] },
  { id: "baidu-go-mutex", company: "baidu", role: "Go开发（原帖未明确细分岗位）", roleKey: "development", stage: "原帖未明确批次", title: "补面经 百度，云智", url: "https://www.nowcoder.com/feed/main/detail/b40868d110794bae847e11a10c992adb", dateLabel: "原帖编辑于 2025-04-29",
    reviewedAt: OCTOBER_19_REVIEWED_AT, topics: [
      question("Q719", "Mutex 与 RWMutex", "Go 的 mutex、rwmutex 怎样使用？"),
    ] },
  { id: "pingcap-go-mutex", company: "pingcap", role: "研发（TiDB方向）", roleKey: "development", stage: "校招", title: "PingCap 校招面经", url: "https://www.nowcoder.com/discuss/353157341598130176", dateLabel: "正文记录 2020 年秋招；原帖编辑于 2021-04-12",
    reviewedAt: OCTOBER_19_REVIEWED_AT, topics: [
      question("Q719", "Mutex 与 RWMutex", "Go 的 Mutex 怎样实现，与 RWMutex 有什么区别？"),
    ] },
  { id: "didi-social-singleflight", company: "didi", role: "Go开发（无人驾驶；原帖未明确细分岗位）", roleKey: "development", stage: "社招", title: "社招五年 Go 面经分享攒人品！", url: "https://www.nowcoder.com/discuss/882048490270904320", dateLabel: "原帖编辑于 05-07（页面未明确年份）",
    reviewedAt: OCTOBER_19_REVIEWED_AT, topics: [
      question("Q718", "singleflight", "singleflight 怎样实现？"),
    ] },
  { id: "ali-gaode-go-mutex", company: "alibaba", role: "Go开发（高德地图；原帖未明确细分岗位）", roleKey: "development", stage: "社招", title: "社招五年 Go 面经分享攒人品！", url: "https://www.nowcoder.com/discuss/882048490270904320", dateLabel: "原帖编辑于 05-07（页面未明确年份）",
    reviewedAt: OCTOBER_19_REVIEWED_AT, topics: [
      question("Q719", "互斥锁与读写锁", "是否了解 Go 的互斥锁和读写锁？"),
    ] },
  { id: "liblib-lovart-palindrome", company: "liblib", role: "开发（Lovart；原帖未明确细分岗位）", roleKey: "development", stage: "社招", title: "社招五年 Go 面经分享攒人品！", url: "https://www.nowcoder.com/discuss/882048490270904320", dateLabel: "原帖编辑于 05-07（页面未明确年份）",
    reviewedAt: OCTOBER_19_REVIEWED_AT, topics: [
      question("Q755", "回文链表", "怎样判断回文链表？"),
    ] },
  { id: "meituan-tlab", company: "meituan", role: "Java后端（地图）", roleKey: "backend", stage: "原帖未明确批次", title: "美团地图后端一面 二面 hr面 （已意向） java", url: "https://www.nowcoder.com/discuss/353158581811879936", dateLabel: "原帖编辑于 2021-10-09",
    reviewedAt: OCTOBER_19_REVIEWED_AT, topics: [
      question("Q740", "逃逸分析与 TLAB", "新建对象是否立即进入堆，能否被逃逸分析优化，TLAB 是什么？"),
    ] },
  { id: "netease-java-treemap", company: "netease", role: "Java研发", roleKey: "development", stage: "原帖未明确批次", title: "网易java研发面经", url: "https://www.nowcoder.com/discuss/353153897143410688", dateLabel: "原帖编辑于 2016-08-24",
    reviewedAt: OCTOBER_19_REVIEWED_AT, topics: [
      question("Q733", "TreeMap", "TreeMap 怎样实现？"),
    ] },
  { id: "xiaomi-java-treemap", company: "xiaomi", role: "Java开发", roleKey: "development", stage: "校招提前批", title: "小米Java面经（提前批已oc）", url: "https://www.nowcoder.com/discuss/353158357265620992", dateLabel: "原帖编辑于 2021-08-27",
    reviewedAt: OCTOBER_19_REVIEWED_AT, topics: [
      question("Q733", "TreeMap", "TreeMap 和 HashMap 有什么区别？"),
    ] },
  { id: "yuanfudao-java-treemap", company: "yuanfudao", role: "Java开发", roleKey: "development", stage: "秋招（原帖标签）", title: "猿辅导面经", url: "https://www.nowcoder.com/discuss/353154537596854272", dateLabel: "原帖编辑于 2018-09-12",
    reviewedAt: OCTOBER_19_REVIEWED_AT, topics: [
      question("Q733", "TreeMap", "TreeMap 和 HashMap 有什么区别，底层数据结构与增删查复杂度分别是什么？"),
    ] },
  { id: "ant-testing-treemap", company: "ant", role: "测试开发", roleKey: "test-development", stage: "校招", title: "蚂蚁金服测试开发一面面经", url: "https://www.nowcoder.com/discuss/353156130295717888", dateLabel: "原帖编辑于 2020-03-11",
    reviewedAt: OCTOBER_19_REVIEWED_AT, topics: [
      question("Q733", "TreeMap", "TreeMap 和 HashMap 有什么区别，底层怎样实现？"),
    ] },
  { id: "kuaishou-data-treemap", company: "kuaishou", role: "数据研发", roleKey: "development", stage: "24届秋招（原帖标签）", title: "快手一面二面三面 数开面经", url: "https://www.nowcoder.com/feed/main/detail/81f6499f37c54490ae9a1c685987520b", dateLabel: "原帖发布于 2023-08-28",
    reviewedAt: OCTOBER_19_REVIEWED_AT, topics: [
      question("Q733", "TreeMap", "Java TreeMap 和 HashMap 有什么区别？"),
    ] },
  { id: "tencent-ieg-treemap", company: "tencent", role: "Java开发（天美；原帖未明确细分岗位）", roleKey: "development", stage: "原帖未明确批次", title: "天美面经", url: "https://www.nowcoder.com/feed/main/detail/6baa4547d54742e68cf6e5c7443f9e97", dateLabel: "原帖发布于 2025-07-14",
    reviewedAt: OCTOBER_19_REVIEWED_AT, topics: [
      question("Q733", "TreeMap", "HashMap 和 TreeMap 各适合什么使用场景？"),
    ] },
  { id: "kuaishou-java-treemap", company: "kuaishou", role: "Java开发（原帖未明确细分岗位）", roleKey: "development", stage: "原帖未明确批次", title: "快手一二面经", url: "https://www.nowcoder.com/discuss/393516796408594432", dateLabel: "原帖编辑于 2022-08-29",
    reviewedAt: OCTOBER_19_REVIEWED_AT, topics: [
      question("Q733", "TreeMap", "HashMap 和 TreeMap 有什么区别，TreeMap 按什么顺序排列？"),
    ] },
  { id: "taotian-bst-kth", company: "taotian", role: "开发（原帖未明确细分岗位）", roleKey: "development", stage: "校招", title: "淘天一二面面经", url: "https://www.nowcoder.com/feed/main/detail/f827095869614a4f9cb3d485bdede83b", dateLabel: "原帖发布于 2023-09-20",
    reviewedAt: OCTOBER_19_REVIEWED_AT, topics: [
      question("Q758", "二叉搜索树第 K 小", "怎样找出二叉搜索树中第 K 小的节点或数值？"),
    ] },
  { id: "byte-backend-bst-kth", company: "bytedance", role: "后端开发", roleKey: "backend", stage: "校招", title: "字节跳动-后端开发-面经", url: "https://www.nowcoder.com/discuss/353155459655868416", dateLabel: "原帖编辑于 2019-09-17",
    reviewedAt: OCTOBER_19_REVIEWED_AT, topics: [
      question("Q758", "二叉搜索树第 K 小", "怎样找出二叉搜索树中第 K 小的节点或数值？"),
    ] },
  { id: "byte-frontend-bst-kth", company: "bytedance", role: "前端开发", roleKey: "frontend", stage: "原帖未明确批次", title: "字节跳动前端面试1-3面手撕代码题", url: "https://www.nowcoder.com/discuss/353156597843173376", dateLabel: "原帖编辑于 2020-07-14",
    reviewedAt: OCTOBER_19_REVIEWED_AT, topics: [
      question("Q758", "二叉搜索树第 K 小", "怎样找出二叉搜索树中第 K 小的节点或数值？"),
    ] },
  { id: "byte-go-bst-kth", company: "bytedance", role: "Go后端", roleKey: "backend", stage: "实习", title: "头条golang后台实习面经", url: "https://www.nowcoder.com/discuss/353156388954251264", dateLabel: "原帖编辑于 2020-04-30",
    reviewedAt: OCTOBER_19_REVIEWED_AT, topics: [
      question("Q758", "二叉搜索树第 K 小", "怎样找出二叉搜索树中第 K 小的节点或数值？"),
    ] },
  { id: "kuaishou-java-median", company: "kuaishou", role: "Java开发（原帖未明确细分岗位）", roleKey: "development", stage: "原帖未明确批次", title: "总结快手java面经（意向）", url: "https://www.nowcoder.com/feed/main/detail/faf4920a447046f2a879677f33e247b9", dateLabel: "原帖编辑于 2023-10-17",
    reviewedAt: OCTOBER_19_REVIEWED_AT, topics: [
      question("Q756", "两个有序数组的中位数", "怎样求两个有序数组的中位数，并分析不同方法的时间和空间复杂度？"),
    ] },
  { id: "baidu-testing-median", company: "baidu", role: "测试开发（商业质量服务部）", roleKey: "test-development", stage: "校招", title: "百度两个部门的面经（攒人品！）", url: "https://www.nowcoder.com/discuss/353155275400093696", dateLabel: "原帖编辑于 2019-08-23",
    reviewedAt: OCTOBER_19_REVIEWED_AT, topics: [
      question("Q756", "两个有序数组的中位数", "怎样用二分分割线求两个有序数组的中位数？"),
    ] },
  { id: "dongchedi-backend-median", company: "dongchedi", role: "后端开发", roleKey: "backend", stage: "校招", title: "03-21 懂车帝后端一面面经", url: "https://www.nowcoder.com/discuss/353159382588399616", dateLabel: "原帖编辑于 2022-03-22",
    reviewedAt: OCTOBER_19_REVIEWED_AT, topics: [
      question("Q756", "两个有序数组的中位数", "怎样求两个有序数组的中位数？"),
    ] },
  { id: "byte-backend-lis", company: "bytedance", role: "后端开发（国际化电商）", roleKey: "backend", stage: "实习", title: "字节跳动国际化电商后端一面面经", url: "https://www.nowcoder.com/discuss/353159571466297344", dateLabel: "原帖发布于 2022-04-19",
    reviewedAt: OCTOBER_19_REVIEWED_AT, topics: [
      question("Q751", "最长递增子序列", "怎样求最长递增子序列的长度？怎样返回一条对应的最长子序列？"),
    ] },
  { id: "kuaishou-testing-lis", company: "kuaishou", role: "测试开发", roleKey: "test-development", stage: "秋招", title: "快手秋招测开面经", url: "https://www.nowcoder.com/discuss/519138993645068288", dateLabel: "原帖编辑于 2023-09-06",
    reviewedAt: OCTOBER_19_REVIEWED_AT, topics: [
      question("Q751", "最长递增子序列", "怎样求最长递增子序列的长度？"),
    ] },
  { id: "microsoft-intern-lis", company: "microsoft", role: "研发（STCA；原帖未明确细分岗位）", roleKey: "development", stage: "暑期实习", title: "微软 stca 北京 暑期实习 一面面经", url: "https://www.nowcoder.com/discuss/353159329639505920", dateLabel: "原帖编辑于 2022-04-15",
    reviewedAt: OCTOBER_19_REVIEWED_AT, topics: [
      question("Q751", "最长递增子序列", "怎样求最长递增子序列的长度？怎样返回一条对应的最长子序列？"),
    ] },
  { id: "byte-testing-mincover", company: "bytedance", role: "测试开发", roleKey: "test-development", stage: "实习", title: "字节跳动测试开发实习面经一二三技术面+HR面", url: "https://www.nowcoder.com/discuss/353157801662947328", dateLabel: "原帖编辑于 2021-04-18",
    reviewedAt: OCTOBER_19_REVIEWED_AT, topics: [
      question("Q752", "最小覆盖子串", "怎样求最小覆盖子串？"),
      question("Q733", "TreeMap", "TreeMap 和 HashMap 有什么区别，底层实现与使用场景分别是什么？"),
    ] },
  { id: "shopee-java-mincover", company: "shopee", role: "Java开发", roleKey: "backend", stage: "校招提前批", title: "虾皮北京Java开发提前批7.14一面面经", url: "https://www.nowcoder.com/discuss/353158096702873600", dateLabel: "原帖发布于 2021-07-15",
    reviewedAt: OCTOBER_19_REVIEWED_AT, topics: [
      question("Q752", "最小覆盖子串", "怎样求最小覆盖子串？"),
    ] },
  { id: "tencent-intern-mincover", company: "tencent", role: "后台开发（广告）", roleKey: "backend", stage: "实习", title: "腾讯实习基地后台面经", url: "https://www.nowcoder.com/feed/main/detail/af7578c21bd24530bd8db37694fdc2b0", dateLabel: "原帖发布于 2024-03-21",
    reviewedAt: OCTOBER_19_REVIEWED_AT, topics: [
      question("Q752", "最小覆盖子串", "怎样求最小覆盖子串？"),
      question("Q733", "TreeMap", "HashMap 和 TreeMap 有什么区别？"),
    ] },
  { id: "dongchedi-java-colors", company: "dongchedi", role: "Java开发", roleKey: "backend", stage: "实习", title: "懂车帝java实习一面面经", url: "https://www.nowcoder.com/feed/main/detail/8479a060f1e04f9db4f164c720802cf4", dateLabel: "原帖发布于 2025-10-27",
    reviewedAt: OCTOBER_19_REVIEWED_AT, topics: [
      question("Q757", "颜色分类", "怎样实现 LeetCode 75 的颜色分类？"),
    ] },
  { id: "tencent-frontend-colors", company: "tencent", role: "前端（微信小店）", roleKey: "frontend", stage: "社招", title: "微信小店前端社招一面面经", url: "https://www.nowcoder.com/discuss/786035218225324032", dateLabel: "原帖编辑于 2025-08-16",
    reviewedAt: OCTOBER_19_REVIEWED_AT, topics: [
      question("Q757", "颜色分类", "怎样实现 LeetCode 75 的颜色分类？"),
    ] },
  { id: "alibaba-zebra-colors", company: "banma", role: "NLP算法", roleKey: "algorithm", stage: "秋招", title: "阿里斑马智行 - NLP算法工程师面经", url: "https://www.nowcoder.com/discuss/677124510016962560", dateLabel: "原帖发布于 2024-10-19",
    reviewedAt: OCTOBER_19_REVIEWED_AT, topics: [
      question("Q757", "颜色分类", "怎样实现 LeetCode 75 的颜色分类？"),
    ] },
  { id: "byte-social-diameter", company: "bytedance", role: "Go后端", roleKey: "backend", stage: "社招", title: "【社招】字节跳动后端开发四面面经", url: "https://www.nowcoder.com/discuss/353157357217718272", dateLabel: "原帖编辑于 2020-11-21",
    reviewedAt: OCTOBER_19_REVIEWED_AT, topics: [
      question("Q754", "二叉树直径", "怎样求二叉树的直径？"),
    ] },
  { id: "alibaba-cloud-diameter", company: "alibaba", role: "研发（基础平台）", roleKey: "development", stage: "实习", title: "阿里云基础平台研发一面面经", url: "https://www.nowcoder.com/discuss/353156165565620224", dateLabel: "原帖编辑于 2020-03-18",
    reviewedAt: OCTOBER_19_REVIEWED_AT, topics: [
      question("Q754", "二叉树直径", "怎样求二叉树中两个节点之间的最大距离，即二叉树直径？"),
    ] },
  { id: "pdd-frontend-sort", company: "pdd", role: "前端开发", roleKey: "frontend", stage: "校招", title: "拼多多前端感恩回馈", url: "https://www.nowcoder.com/discuss/353155431214292992", dateLabel: "原帖编辑于 2019-09-12",
    reviewedAt: OCTOBER_19_REVIEWED_AT, topics: [
      question("Q741", "sort 比较器", "sort 方法的返回类型可以是布尔值吗？"),
    ] },
  { id: "kunlun-request-binding", company: "kunlun", role: "开发（原帖未明确细分岗位）", roleKey: "development", stage: "原帖未明确批次", title: "昆仑数智", url: "https://www.nowcoder.com/discuss/603726385772855296", dateLabel: "原帖发布于 2024-03-30",
    reviewedAt: OCTOBER_19_REVIEWED_AT, topics: [
      question("Q739", "Spring 参数绑定", "Spring 接收参数的 RequestBody、RequestParam、PathVariable 注解有什么区别？"),
    ] },
  { id: "ant-misuan-request-binding", company: "ant", role: "开发（密算科技；原帖未明确细分岗位）", roleKey: "development", stage: "秋招", title: "211本，字节OC面经贴分享", url: "https://www.nowcoder.com/discuss/676821795248373760", dateLabel: "原帖编辑于 2024-10-26",
    reviewedAt: OCTOBER_19_REVIEWED_AT, topics: [
      question("Q739", "Spring 参数绑定", "Spring Controller 中 RequestParam 和 RequestBody 有什么区别？"),
    ] },
  { id: "alimama-request-binding", company: "alibaba", role: "后端开发（阿里妈妈）", roleKey: "backend", stage: "原帖未明确批次", title: "阿里妈妈 后端开发 一二面凉经", url: "https://www.nowcoder.com/discuss/670604259720785920", dateLabel: "原帖发布于 2024-10-01",
    reviewedAt: OCTOBER_19_REVIEWED_AT, topics: [
      question("Q739", "Spring 参数绑定", "RequestParam、RequestBody 怎样把 HTTP 请求的数据绑定到 Controller 入参，底层原理是什么？"),
    ] },
  { id: "nio-go-reader", company: "nio", role: "软件开发", roleKey: "development", stage: "实习（原帖标签）", title: "蔚来-软件开发二面面经", url: "https://www.nowcoder.com/feed/main/detail/9f92610c99b34894b35be91086df05a2", dateLabel: "原帖编辑于 09-17（页面未明确年份）",
    reviewedAt: OCTOBER_19_REVIEWED_AT, topics: [
      question("Q727", "Go io.Reader", "怎样用 Go 只读取大文件的一部分，io.Reader 和 os.ReadFile 有什么区别？"),
    ] },
  { id: "meituan-java-priorityqueue", company: "meituan", role: "Java后端", roleKey: "backend", stage: "秋招", title: "美团   秋招面经  一面", url: "https://www.nowcoder.com/discuss/650321430017495040", dateLabel: "原帖编辑于 2024-08-06",
    reviewedAt: OCTOBER_19_REVIEWED_AT, topics: [
      question("Q732", "PriorityQueue", "是否了解 Java PriorityQueue，其底层实现原理是什么？"),
    ] },
  { id: "byte-android-pecs", company: "bytedance", role: "客户端开发（Android 面试后调剂 iOS）", roleKey: "development", stage: "校招", title: "双非本科非科班 抖音Android面筋（被调剂到iOS了）", url: "https://www.nowcoder.com/discuss/353155672483241984", dateLabel: "原帖编辑于 2019-10-11",
    reviewedAt: OCTOBER_19_REVIEWED_AT, topics: [
      question("Q731", "Java 泛型边界", "Java 泛型的上界通配符与下界通配符有什么区别？"),
    ] },
  { id: "zhihu-monitor-singleflight-trie", company: "zhihu", role: "开发（监控组；原帖未明确细分岗位）", roleKey: "development", stage: "25秋招（原帖标题）", title: "25秋招 - 后端（主Go） - 面经分享&经历回顾 Part.1", url: "https://www.nowcoder.com/feed/main/detail/fdcfe849626a4711abc8d125d9702fc7", dateLabel: "原帖发布于 2025-04-17",
    reviewedAt: OCTOBER_19_REVIEWED_AT, topics: [
      question("Q718", "singleflight", "singleflight 的机制是什么？"),
      question("Q753", "Trie 前缀树", "前缀树是什么，有哪些使用场景？"),
    ] },
];
