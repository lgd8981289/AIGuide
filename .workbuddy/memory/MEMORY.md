# AIGuide 项目长期记忆

项目：`/Users/lgd_sunday/Desktop/AI 工程面试手册/AIGuide` · 线上 https://note.lgdsunday.club/（Astro 文章站）
同域：www.lgdsunday.club（简历汪，Nuxt）、resume 子域 · GitHub：https://github.com/lgd8981289/AIGuide

> **工程/构建细节 → `docs/aiguide-engineering-notes.md`**（标题三层机制、页面结构、构建坑、发布链路、nginx 细节）
> **SEO 专题文档** → `docs/seo-diagnosis-2026-10-07.md`、`seo-playbook-2026-10-07.md`、`seo-content-audit-2026-10-07.md`、`seo-crawl-diagnosis-2026-10-07.md`、`seo-keyword-gap-2026-10-07.md`、`seo-subdomain-vs-subdirectory.md`

## 北极星：点击

> 「所有文章、代码和任何内容都是为 SEO 服务的。核心目的是更多点击，其他都不重要。」

**点击 = 展示 × CTR。绑定约束是展示（收录 + 排名），不是 CTR。**

### 三渠道「病得不一样」

| | Google | Bing |
|---|---|---|
| 抓取 | 正常，~395 页 | 0 页，从未抓取 |
| 收录 | 355 页（72%，三渠道最好） | 近 0（note `DailyQuota=0`） |
| 主要矛盾 | **收录了但排不上名** | **根本没被收录** |
| 解法 | 内容质量 + 选题匹配 + 权威度 | 域名信任 + 外链 |

note vs www（Bing 实测）：有数据天数 4 vs 284；展示 146 vs 151,449；点击 5 vs 53,698；排名词 22 vs 1,181；抓取 0 页 vs 177 天日抓 197–433 页。
www 点击几乎全来自品牌词「简历汪」（位置 1–2）→ **搬主站继承的是抓取预算与信任，不是流量**。配额差万倍（note 月 2400 vs www 月 249961），**按域名信任分配**。

- **查 Bing 必须显式传日期**：`GetQueryStats` 不传日期时窗口极窄（实测 9 行全落在 10-02）。真实数据用 `~/Downloads/note.lgdsunday.club_KeywordReport_2026_10_5.csv`（22 词 / 41 展示 / 3 点击）。
- **根因**：note 排名词里有多个是**正文整句被当成查询词** → 内容与真实搜索需求不匹配。

### Google 覆盖率（GSC，截 10-04）

已编入 355，未编入 71。71 拆解 = **备用网页（有适当规范标记）24**（✅ 语义化做对了，**不要修**）+ **已抓取-尚未编入索引 40**（⚠️ 唯一值得行动 = 内容质量信号）+ 已发现-尚未编入索引 7（抓取预算，可忽略）。
逐日展示 `0→5→11→11→21→14→38→27=127` → **收录 355 页、8 天仅 127 展示**。

**「示例网址」取数**：覆盖率导出只有 4 表（`图表/严重问题/非严重问题/元数据`），**不含网址**。网址在**每个原因各自的详情页**：GSC → 索引 → 网页 → **点那一行文字本身**（不是点数字）→ 详情页出现「示例网址」表 → 再导出。Google 对「Google 系统」判定的状态常不提供示例网址。**建议不追**（站级质量信号，用户持续新增文章，快照会过期）。

### Google 效果（近 3 个月）

**3 点击 / 127 展示**，平均排名 ~7.3。**查询词仅 3 个**：`prefill 中文`(2)、`ai agent 记忆系统…`(4)、`createagent`(7) → **内容基本没有搜索词足迹**。网页 84 行：首页 2 点击/53 展示/**CTR 3.77%**/排名 4.36（占 41.7%）；其余 80 页 ≤2 展示。

- **美国 61 展示 0 点击 = 用户自测流量**（2026-10-07 用户确认），**不是市场信号**。剔除后有效展示 ~66，CTR ~4.5%。⚠️ **站长自测系统性拉低 CTR、污染国家维度** —— 新站看 GSC 国家数据前必须先排除自测。

### Bing 关键词报告的真相（22 词，2026-10-05）

1. **点击几乎全来自品牌词**：22 词共 3 点击，2 次来自 `sunday的面试指南`(1.75) / `sunday面试指南`(1.5) → 点进来的都是**已经知道这个站的人**
2. **真实技术词有排名但全卡 5–10 位**（拿不到点击）：`http和https，对百度收录有区别吗`6/5、`tls`5/9、`rlhf`4/8.5、`context engineering`1/9
3. **引擎仍把正文整句当查询词**：`+eedfield.stage.charlnfo`、`拆 速祚`、一条正文原句等

→ **选题没对准「有搜索量且能进前 3」的词**，这是 Google 与 Bing 的**共同根因**。

## 关键词需求与内容缺口（`docs/seo-keyword-gap-2026-10-07.md`）

**方法**：中文搜索量 API 拿不到（Bing `GetKeywordStats` 对 `country=CN&language=zh-CN` 返 **0 行**；Google Suggest 不可达）。
**可用的是下拉词**：`api.bing.com/osjson.aspx`、`suggestion.baidu.com/su`（GBK）、`sug.so.360.cn/suggest`（20 种子 × 3 引擎，400+ 条）。下拉词证明「有人在搜」，但**不给量级**。

**三个关键发现**：

1. **缺口是「形态」不是「主题」（最重要）**：下拉词高频出现的是**形态词** —— 及答案 / 大全 / 题库 / 合集 / 汇总 / 200问 / 60问 / 八股文 / 手撕 / 代码题 / 必刷题，而站内 379 篇**标题命中这些词全为 0**。我们只有单点问答，用户却在搜汇总入口。竞品 `xiaolinnote.com` 每个专题都有独立 `*_info.html` 索引页。
2. **「AI 面试题」意图不符**：其下拉词是「吉利ai面试题 / 去哪儿ai面试题 / ai面试官 / ai面试是不是骗局」= **「企业用 AI 系统面我，会问什么」**，不是「AI 领域技术面试题」。→ 保留不主推，让「大模型面试题」（意图干净）承担主位。
3. **「xxx github」是高频意图**：`大模型面试题 github`、`llm 面试题 github`、`ai agent 面试题 github` → 建公开 GitHub 仓库同时命中该查询意图 + 产出外链。

**内容 backlog（⚠️ 不是我执行，只作为选题建议输出给用户安排的人）**：P0 建 GitHub 仓库（✅ 已完成）、P0 补齐 `AI 编程教程` 模块（✅ T002 已上线，但见「职责边界」一节）；P1 做「八股文/100问」形态长文、补「面经」类；P2 扩写提示词工程（4→8+）与向量数据库（2→6+）、加「手撕/代码题」。
→ **这些是内容侧的事，我只出「应该写什么、为什么」的建议与数据支撑，不动手写稿。**

## 站点规模

**14 个分类目录 / 379 篇**（sitemap 495 URL）：

- **全栈 282 篇（74%）**：frontend 92、backend 77、database 50、cs-basics 44、fullstack-system-design 19
- **AI 面试题 93 篇（25%）**：agent 26、rag 18、engineering 18、llm 15、langchain 9、system-design 7
- **AI 编程教程仅 4 篇**：tools 2、practice 1、reviews 1，`agent-ext` 目录**不存在（0 篇）** → **导航里「AI 编程教程」这一栏基本是空的**，是明显内容缺口

URL 形态 `/{分类}/{编号}-{英文关键词}/`（2026-10-07 全站语义化，已上线）。**唯一真源 `scripts/article-slugs.json`** —— **新增题目必须补一条英文 slug**，否则 sync 打告警并回落编号地址。

## SEO / 提交通道

- **Bing API** `scripts/submit-bing.py`（`npm run bing:preview` / `bing:submit -- --site all`）。密钥在 `.env` 的 `BING-API—KEY`（键名含连字符与长破折号，读取做了归一化）。状态在 `.bing/`。特性：读线上 sitemap → 预检 canonical/robots → sha256 状态记忆 → 额度预检 → `pending` 锁防重复 → 回执落盘
- **IndexNow 已启用**：`deploy.sh` 顶部 `INDEXNOW_KEY=76a5dca42d09708f954824df3b1149b4`，密钥文件 `public/{key}.txt`（内容=文件名）。覆盖 Bing/Yandex/Naver/Seznam
- **百度**：token `O77VS8F6Br5oe0OD` 实测**归属 www**（配 note 返回 `401 site error`）—— **token 按域名发放**，note 必须单独申请。已改为 `BAIDU_SITE` 变量（空则跳过）+ 裸域名 + 识别 `error` 打 warn（原来硬编码 note → 每次静默 401 且日志假报成功）。**用户反馈百度暂时加不了新站点** → note 独立验证暂缓；搬回 www 的 `/note/` 可复用 www 验证与 token。线上仅 www 有 `baidu-site-verification` meta（`codeva-iAa19awTff`）
- **站点验证开关** `src/data/site.ts` 的 `SITE_VERIFICATION = { baidu, google }`，留空不输出
- **note 的 Google 验证是「HTML 文件」方式**：`public/google679e7cb325cb9c18.html`（53B）。⚠️ **别用「首页有没有 google meta」判断 note 是否验证过** —— 文件验证首页本就没有 meta。www 的 google meta = `8vei0yoKjoqXuDKZHox_mt-K3BudF4JYnCq06bAMWIA`
- **Google 无可自动化通道**：`ping?sitemap=` 2023-06 弃用（404）；Indexing API 仅支持 JobPosting/BroadcastEvent；URL Inspection API 只读 → 靠 robots.txt Sitemap 指令 + GSC 手动提交

## 内容门禁（2026-10-07 全量开放，方案 B，最终态）

`src/data/site.ts` 的 `TECHGROW.enabled=false` + `FOLLOW.enabled=false`（页脚关注引导撤下）→ 全文开放。构建实测 `readmore.js`/`readmore.css`/`isAccessibleForFree:false`/`hasPart` **全 0 处**。用户决策：「暂不引导关注，先把搜索流量做起来」。付费课 `agent-course` 的 course-paywall 不受影响。

- 恢复：改回 `enabled=true`（分层抽样 `selectGatedArticles()` 保留未删）
- **改配置前必读**：TechGrow 自带 `random` 是**浏览器端随机**，JSON-LD `isAccessibleForFree` 是**构建时写死** → 直接改数字会造成「实锁 30% 却声明 100% 免费」。故改为 `site.ts` 的 `selectGatedArticles(siblingIds)` **构建时按分类分层抽样**（`stableHash` 可复现）；`TechGrow.astro` 的 `random` 固定传 `"1.0"`
- **竞品对照（实测）**：JavaGuide 与 `xiaolinnote.com` **都没门禁**，正文全在 HTML，靠「内容免费 + 课程/书变现」。**「竞品也门禁」不成立**

## 已上线的 SEO 改动

### 内容层第一批（6 项，审计 `docs/seo-content-audit-2026-10-07.md`）

- **FAQPage**：`src/lib/faq.mjs` 的 `extractFaqPairs()` 从「面试官继续追问」H2 下的 H3 块抽 Q&A → `[slug].astro` 追加节点 → **325 篇 / 975 Question**。**如实口径**：Google 2023-08 起 FAQ 富结果限权威站点，收益在 Bing/百度/AI 搜索抽取
- **og:image 分文章化**：`src/lib/article-image.mjs` 读 `public/img/.manifest.json` 取正文首图，**要求 width ≥ 1200**（Discover 门槛，不达标回落 `og-cover.jpg`）→ 379 篇用真实首图
- **文章页标题去品牌后缀**
- **描述优先级的坑**：`sync-content.mjs` 优先级 `选题卡 SEO 描述 > 正文面试速答 > 选题卡兜底 > 正文摘要`（选题卡批量模板句会盖掉更好的正文摘录），`trimAtBoundary(text,120)`，中文 SERP 显示 **≈78 字**。改描述须同时满足 ≤120 字与 ≈78 字显示约束，否则截出「……」
- **图片 alt 排查覆盖两种语法**：markdown `![]()` 之外还有**裸 HTML `<img alt="image-xxx">`**。口径 `grep -rEn '<img[^>]*alt="(image|img|ChatGPT|[0-9])' src/content/articles/`。**agent-course 的 410 个「配图N」来自 `sync-course.mjs` 独立路径，正常勿误判**；装饰图（brand-logo/avatar）与 lightbox 占位（`lb-img`，由 `ImageZoom.astro` 回填）的 `alt=""` 是正确写法
- **尚未做**：171 篇「A vs B」缺对比表格、栏目落地页正文、AI 类外链密度（0.25–0.55/千字 vs 标准 2.0）、36 篇短文扩写。**67 篇 >45 字标题已结论不做批量重写**

### 首页标题/描述重写（已上线，curl 验证过）

旧 `<title>` = `${SITE.name}｜${SITE.tagline}` = 零搜索量品牌词在前 + 三模块罗列 → 有搜索量的关键词全被挤出中文 SERP 约 30 字截断线。
**竞品对照**：`xiaolinnote.com` 首页 = `图解 Agent+RAG+LLM 大模型面试题 | 小林面试笔记` —— **关键词在前、品牌在后**；本站品牌搜索量近零，故进一步去掉品牌后缀（品牌仍由 `og:site_name` / 顶部站点名 / 页脚承载）。

**最终文案**：`<title>` = `AI 面试题与大模型面试题｜Agent、RAG 高频考点`（28 字）；`description` ≈75 字；`<h1>` = `AI 面试题与大模型面试题`（原为「最新文章」）。
**选型**：首页主打 AI（差异化 + 增长方向，站内 93 篇 AI 类，引擎已用 LLM 词匹配到本站）；全栈类（282 篇）竞争被 JavaGuide/小林垄断，只在描述尾部提及。
实现细节见 `docs/aiguide-engineering-notes.md` 第四节。

### 第二轮标题优化（已上线）

- `MODULE_META.interview.title` → `大模型面试题大全：Agent、RAG 高频题与答案`（`/ai/` 的 `<title>`；h1 仍是「AI 面试题」）
- `llm`/`agent`/`rag` 三个分类的 `intro` 前加「…面试题合集：」（`/agent/` 描述第一版 83 字超 SERP 显示区，已收到 63 字）
- **非文章页品牌后缀全部去掉**：`pageTitle = path === "/" ? SITE.homeTitle : title`

### 空分类页处理（已构建验证）

`/agent-ext/` 渲染「共 0 篇文章」、20,061 字节 —— 典型 thin content，很可能贡献了那 40 篇「已抓取-未编入索引」。
`astro.config.mjs` 构建时把**无 `.md` 的分类从 sitemap 排除**；`ArticleBrowser.astro` 对空列表输出 `noindex, follow`。
实测 sitemap **496 → 495**，`/agent-ext/` robots = `noindex, follow`。细节见工程笔记第二节。

### GitHub 仓库（已推送，commit `3a83e52`）

README 重写为**用户向的面试题合集导航**（202 → 687 行）：专题入口表 + 主题索引 + **全部 379 篇文章链接**（AI 类平铺，全栈 282 篇包在 `<details>` 里），原 202 行运维文档原样保留在 `# 仓库维护说明（开发文档）` 下。
**站内链接 2 → 399 条**。理由：GitHub 每日被 Bing 抓取，README 链接是本站在**站外唯一的发现路径**（外链是 Bing 唯一解法）；同时命中「xxx 面试题 github」查询意图。生成方式见工程笔记第五节。

### T002「Codex 接入 Playwright MCP」教程（2026-10-07 上线）

`/agent-ext/t002-codex-mcp-playwright/`，约 5600 字，填掉了此前 0 篇的 `02-Agent能力扩展` 分类。选题依据：Bing 关键词报告里 `codex install playwright`（5）、`vscodexmcp`（6）已进展示，而站内 7 篇涉及 MCP 的文章全是面试问答、教程侧空白。源码在 `~/Desktop/一起来玩 AI 呀～/文章/02-Agent能力扩展/T002-Codex-MCP-Playwright/`（`选题卡.md` + `正文.md` + `参考资料.md`，无配图）。
配套改动：`ARTICLE_RELATED` 给 `Q008/Q050/Q064/Q071` 加 `['T002']`（打通 interview↔tutorial 的内链断层）；`postbuild.mjs` 的 `NEVER_NUMERIC` 补 `T002`（否则会为从未存在的纯编号地址生成跳转页）。
⚠️ **这篇是我写的，写完之后用户明确表示「不希望你去写新的文章，文章我会让别人去写」** → 后续不再由我撰写内容，T002 是否保留/替换由用户决定。

## 职责边界（2026-10-07 用户明确划定，重要）

> 「我不希望你去写新的文章，文章我会让别人去写。」

- **我不写文章**（不写 `正文.md` / `选题卡.md`，不新建文章目录，不续写 T003 等预告过的下篇）。内容创作**由用户另行安排的人负责**。
- **我的职责 = 技术层 + 站内 SEO**：站点架构与抓取、URL 结构、sitemap/robots、结构化数据、标题与描述（走 `article-titles.json` 与源选题卡 `SEO 描述` 这类**既有机制**）、内链、模板与构建链路、搜索引擎提交通道、数据诊断。
- 需要内容侧配合时（例如关键词缺口要落成新文章），**只输出选题建议与理由，不动手写稿**。

## 关键结构事实（决定能做/不能做什么）

- **分类页与模块页的文章列表是 SSR 的** → `/ai/`、`/llm/` 等**本身就是带完整列表的汇总型入口页**，**不需要另建「大全」页**（另建会与它们重复，正好撞上「已抓取-尚未编入索引」的内容重复判定）
- **模块页 / 分类页的 `h1` 与 `<title>` 都是两个字段** → 做 SEO **只改标题字段，不动 h1、侧边栏与导航**：
  - 模块页：`MODULE_META[x].title`（h1 用 `meta.name`）
  - 分类页：`site.ts` 里 `Category.seoTitle`（**2026-10-07 新增**，h1 用 `category.name`；`ArticleBrowser.astro` 的 `title={category?.seoTitle ?? category?.name ?? meta?.title}`）
  - `seoTitle` 与 `MODULE_META[x].title` **必须全站唯一**，且控制在 **~30 个全角字**内（SERP 展示区）
- **改描述/alt 要写回源仓库**（源选题卡 `- SEO 描述：` 行 / 源 `正文.md`），只改 `src/content/articles/` 会被下次 `--sync` 冲掉；`--sync` 与 SEO 改动**不冲突**（实测「更新 0，复用 379」）
- `check-seo.py` 硬约束：`<title>` 全站唯一、description 全站唯一、首页 `og:site_name` == `Sunday 的面试指南`。**不**校验 robots meta，**不**校验 sitemap 数量
- **整站体检脚本 `scripts/audit-onpage.py`**（纯标准库，扫 `dist/`）：查标题/描述显示宽度、重复、正文体量、入链分布、索引指令、canonical。**判定口径**：Google 桌面端标题区 ≈ **30 全角字 ≈ 60 列**，描述 ≈ **78 全角字 ≈ 156 列**（列 = 全角 2 / ASCII 1）。⚠️ 两个坑：别按「30 列」判标题；列表页**不能**用 `<article>` 取正文（那是列表卡片，会误判成 thin page）。
  - 2026-10-07 首轮体检结果：**技术卫生全绿**（孤儿页/弱链页/重复标题/重复描述/缺失描述/canonical 异常/noindex/thin 文章 全为 0）；唯一高价值缺陷是 **18 个汇总入口页标题是纯导航标签**，已用 `seoTitle` 修复

（以上四条的完整机制见 `docs/aiguide-engineering-notes.md` 第一、二、三节）

## 子域名 vs 二级路径（2026-10-07 评估，用户暂不执行）

结论：**应搬回 `www.lgdsunday.club/note/`**。收益排序：**百度（0→1，确定）> Bing（收录覆盖率）> Google（最小）**，不可承诺排名与流量。
核心理由：实测差距三个数量级（主站 sitemap 仅 39 URL 却日抓 200–400 页；note 有 456 URL 抓取 0 页）→ **差距是抓取预算**；且搬回后可**直接复用 www 的百度验证与 token**，绕过「百度加不了新站点」。
风险：二次迁移（note 权重近零 → **现在是历史最低成本时机**）、Nuxt+Astro 共存运维复杂度、战略取舍（生态一部分 vs 独立品牌）。
**成本几乎全在 nginx**（改动面 11 文件约 25 行）。工程细节见 `docs/aiguide-engineering-notes.md` 第八节与 `docs/seo-subdomain-vs-subdirectory.md`。
**用户态度：明确「只确认，暂不执行」，已问过两轮 → 不要主动开工迁移。**

## 诊断工具与用户偏好

- `.env` 的 Bing API Key 可直接查真实搜索数据：`https://ssl.bing.com/webmaster/api.svc/json/{Method}?apikey=<key>&siteUrl=<url>`
  - 可用 `GetUserSites` / `GetRankAndTrafficStats` / `GetQueryStats` / `GetCrawlStats` / `GetCrawlIssues` / `GetUrlSubmissionQuota`；`GetUrlTrafficInfo` 对 https 报 `SiteUriSchemeIsNotSupported`
- **北极星是点击**：判断任何改动先问「这能多带来多少次点击」；偏好中文，不喜欢中英夹杂；会追问根因
- **⚠️ 职责边界：我不写文章**（2026-10-07 用户明确：「我不希望你去写新的文章，文章我会让别人去写」）→ 只做技术层 + 站内 SEO，内容侧只出建议，不快稿
- **待用户决策**：① 是否搬回 `www.lgdsunday.club/note/`（暂不执行）；② 那 40 个「已抓取-尚未编入索引」页是哪些（取数方法已给，**建议不追**）；③ 外链建设（**只能用户做**：掘金/思否、公众号阅读原文、GitHub、知乎/CSDN）；④ **T002 教程的处置**（我写的，是我唯一的「越界」产出，留/删/换待定）
- **用户仍在持续新增文章** → 每新增一篇**必须在 `scripts/article-slugs.json` 补英文 slug**；新增文章**不必逐篇**去 GSC「请求编入索引」（配额有限且对质量判定类无效）
- 2026-10-07 用户授予**广泛授权**：「按照你的想法去做，只要可以提高流量，我都支持你」+ 开放 GitHub 仓库随意使用
