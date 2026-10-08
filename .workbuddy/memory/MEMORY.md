# AIGuide 项目长期记忆

项目：`/Users/lgd_sunday/Desktop/AI 工程面试手册/AIGuide` · 线上 https://note.lgdsunday.club/（Astro 文章站）
同域：www.lgdsunday.club（简历汪，Nuxt）、resume 子域 · GitHub：https://github.com/lgd8981289/AIGuide

> **工程/构建细节** → `docs/aiguide-engineering-notes.md`（标题三层机制、页面结构、构建坑、发布链路、nginx）
> **SEO 专题** → `docs/seo-diagnosis-2026-10-07.md`、`seo-playbook-2026-10-07.md`、`seo-content-audit-2026-10-07.md`、`seo-crawl-diagnosis-2026-10-07.md`、`seo-keyword-gap-2026-10-07.md`、`seo-subdomain-vs-subdirectory.md`

## 北极星：点击

> 「所有文章、代码和任何内容都是为 SEO 服务的。核心目的是更多点击。」

**点击 = 展示 × CTR。绑定约束是展示（收录 + 排名），不是 CTR。**

### 三渠道「病得不一样」（明细见 seo-diagnosis / seo-crawl-diagnosis）

| | Google | Bing |
|---|---|---|
| 抓取 | 正常，~395 页 | 0 页，从未抓取 |
| 收录 | 355 页（72%，最好） | 近 0 |
| 主要矛盾 | **收录了但排不上名** | **根本没被收录** |
| 解法 | 内容质量 + 选题匹配 + 权威度 | 域名信任 + 外链 |

- note vs www（Bing 实测）：有数据 4 天 vs 284 天；展示 146 vs 151,449；点击 5 vs 53,698；排名词 22 vs 1,181；抓取 0 页 vs 177 天日抓 197–433 页。www 点击几乎全来自品牌词「简历汪」(1–2 位) → **搬主站继承的是抓取预算与信任，不是流量**。
- Google 覆盖率 71 未编入 = **备用网页 24**（✅ 语义化做对了，**别修**）+ **已抓取未编入 40**（⚠️ 唯一可行动的 = 内容质量）+ 已发现未编入 7（抓取预算，忽略）。
- Google 效果近 3 月：**3 点击 / 127 展示**，均排 7.3，**仅 3 个查询词**（`prefill 中文`、`ai agent 记忆系统…`、`createagent`）→ **内容基本没有搜索词足迹**。首页占 41.7% 展示（CTR 3.77%）。
- **美国 61 展示 0 点击 = 用户自测流量**（用户确认）→ 站长自测系统性拉低 CTR，**新站看 GSC 国家数据前先排除自测**。
- Bing 关键词报告（22 词）：点击几乎全是品牌词；真实技术词有排名但**全卡 5–10 位**（`rlhf` 4/8.5、`tls` 5/9、`context engineering` 1/9）；引擎仍把正文整句当查询词。
- **查 Bing 必须显式传日期**（不传窗口极窄）；真实报告 `~/Downloads/note.lgdsunday.club_KeywordReport_*.csv`。

## 关键词需求与内容缺口（`docs/seo-keyword-gap-2026-10-07.md`）

**方法**：中文搜索量 API 拿不到 → 只能取**下拉词**（`api.bing.com/osjson.aspx`、`suggestion.baidu.com/su` GBK、`sug.so.360.cn/suggest`），证明「有人搜」但**不给量级**。

1. **缺口是「形态」不是「主题」（最重要）**：下拉词高频是**形态词** —— 及答案/大全/题库/合集/汇总/200问/60问/八股文/手撕/代码题/必刷题，而站内 379 篇**标题命中这些词全为 0**。我们只有单点问答，用户在搜汇总入口；竞品 xiaolinnote.com 每个专题都有独立 `*_info.html` 索引页。
2. **「AI 面试题」意图不符**：其下拉词是「吉利ai面试题/去哪儿ai面试题/ai面试官/ai面试是不是骗局」= 企业用 AI 系统面我 → 不主推，让「大模型面试题」（意图干净）担主位。
3. **「xxx github」高频意图**：`大模型面试题 github` 等 → 建公开仓库同时命中意图 + 产出外链（✅ 已做）。

## 站点规模

**14 分类 / 379 文章 / sitemap 495 URL**：
- 全栈 282（74%）：frontend 92、backend 77、database 50、cs-basics 44、fullstack-system-design 19
- AI 面试题 93（25%）：agent 26、rag 18、engineering 18、llm 15、langchain 9、system-design 7
- AI 编程教程 5：tools 2、practice 1、reviews 1、**agent-ext 1（T002，原为 0 篇空分类）**

URL 形态 `/{分类}/{编号}-{英文关键词}/`（2026-10-07 全站语义化，已上线）。**唯一真源 `scripts/article-slugs.json`** —— **新增题目必须补英文 slug**，否则 sync 打告警并回落编号地址。

## SEO / 提交通道

- **Bing API** `scripts/submit-bing.py`（`npm run bing:preview` / `bing:submit -- --site all`）。密钥在 `.env` 的 `BING-API—KEY`（键名含连字符与长破折号，读取已归一化）。状态在 `.bing/`。含预检 canonical/robots + sha256 记忆 + 额度预检 + `pending` 锁防重复。
- **IndexNow 已启用**：`deploy.sh` 顶部 `INDEXNOW_KEY`，密钥文件 `public/{key}.txt`。覆盖 Bing/Yandex/Naver/Seznam。
- **百度**：token `O77VS8F6Br5oe0OD` 实测**归属 www**（配 note 返 `401 site error`）—— **token 按域名发放**。已改为 `BAIDU_SITE` 变量（空则跳过）+ 裸域名 + 识别 `error` 打 warn（原来硬编码 note → 每次静默 401 且日志假报成功）。**用户反馈百度暂加不了新站点** → note 独立验证暂缓；搬回 `/note/` 可复用 www 验证与 token。线上仅 www 有 `baidu-site-verification` meta。
- **note 的 Google 验证是「HTML 文件」方式**：`public/google679e7cb325cb9c18.html`。⚠️ **别用「首页有没有 google meta」判断** —— 文件验证首页本就无 meta。
- **Google 无可自动化通道**：`ping?sitemap=` 2023-06 弃用（404）；Indexing API 仅 JobPosting/BroadcastEvent；URL Inspection API 只读 → 靠 robots.txt Sitemap 指令 + GSC 手动提交。
- **站点验证开关** `src/data/site.ts` 的 `SITE_VERIFICATION = { baidu, google }`，留空不输出。

## 内容门禁（2026-10-07 全量开放，最终态）

`TECHGROW.enabled=false` + `FOLLOW.enabled=false`（页脚关注引导撤下）→ 全文开放。构建实测 readmore.js/css、`isAccessibleForFree:false`、`hasPart` **全 0 处**。用户决策：「暂不引导关注，先把搜索流量做起来」。付费课 `agent-course` 的 course-paywall 不受影响。
- 恢复：改回 `true`（分层抽样 `selectGatedArticles()` **保留未删**）。
- **改配置前必读**：TechGrow 自带 `random` 是**浏览器端随机**，而 JSON-LD 是**构建时写死** → 直接改数字会造成「实锁 30% 却声明 100% 免费」。故改为 `site.ts` 的 `selectGatedArticles()` **构建时按分类分层抽样**（`stableHash` 可复现）；`TechGrow.astro` 的 `random` 固定传 `"1.0"`。
- **竞品对照（实测）**：JavaGuide 与 xiaolinnote **都没门禁**，正文全在 HTML。「竞品也门禁」不成立。

## 已上线的 SEO 改动（按时间）

1. **内容层第一批 6 项**（审计 `docs/seo-content-audit-2026-10-07.md`）：
   - **FAQPage**：`src/lib/faq.mjs` 的 `extractFaqPairs()` 抽「面试官继续追问」H2 下的 H3 → 325 篇 / 975 Question。**如实口径**：Google 2023-08 起 FAQ 富结果限权威站，收益在 Bing/百度/AI 搜索抽取。
   - **og:image 分文章化**：`src/lib/article-image.mjs` 读 `public/img/.manifest.json` 取正文首图，**要求 width ≥ 1200**（Discover 门槛，不达标回落 `og-cover.jpg`）。
   - **文章页标题去品牌后缀**。
   - **描述优先级的坑**：`sync-content.mjs` 优先级 `选题卡 SEO 描述 > 正文面试速答 > 选题卡兜底 > 正文摘要`（选题卡批量模板句会盖掉更好的正文摘录），`trimAtBoundary(text,120)`，中文 SERP 显示 **≈78 字**；改描述须同时满足 ≤120 字与 ≈78 字显示，否则截出「……」。
   - **图片 alt 排查要覆盖两种语法**：markdown `![]()` 之外还有**裸 HTML `<img alt="image-xxx">`**。**agent-course 的 410 个「配图N」来自 `sync-course.mjs` 独立路径，正常勿误判**；装饰图与 lightbox 占位 `alt=""` 是正确写法。
   - **首页标题/描述重写**：`<title>` = `AI 面试题与大模型面试题｜Agent、RAG 高频考点`（28 字）。竞品 xiaolinnote 首页也是「关键词在前、品牌在后」。主张 AI（差异化 + 增长方向），全栈类只在描述尾部提及。
2. **第二轮标题**：`MODULE_META.interview.title` → `大模型面试题大全：Agent、RAG 高频题与答案`；`llm`/`agent`/`rag` 的 `intro` 前加「…面试题合集：」；**非文章页品牌后缀全部去掉**。
3. **空分类治理（已构建验证）**：`/agent-ext/` 曾渲染「共 0 篇文章」thin page → `astro.config.mjs` 构建时把**无 `.md` 的分类从 sitemap 排除** + `ArticleBrowser.astro` 对空列表输出 `noindex, follow`。sitemap **496→495**。
4. **GitHub 仓库 README 重写**（202→687 行，用户向导航 + 全 379 篇链接）：站内链接 **2→399**，是本站**站外唯一发现路径** + 命中「xxx 面试题 github」。
5. **T002 教程上线**（`/agent-ext/t002-codex-mcp-playwright/`，约 5600 字），填掉 0 篇分类。配套：`ARTICLE_RELATED` 给 `Q008/Q050/Q064/Q071` 加 `['T002']`（打通 interview↔tutorial 内链断层）；`postbuild.mjs` 的 `NEVER_NUMERIC` 补 `T002`（否则为从未存在的编号地址生成跳转页）。⚠️ **这篇是我写的，之后用户明确「不希望你去写新的文章」**（见职责边界）。
6. **18 个汇总入口页标题修复**：整站体检发现分类/模块页 `<title>` 是纯导航标签（9–22 列）→ 新增 `Category.seoTitle`。修后 22–46 列，`og:title`/`twitter:title` 同步而 `<h1>` 不变。
7. **整站体检脚本 `scripts/audit-onpage.py`**（纯标准库，扫 `dist/`）：查标题/描述显示宽度、重复、正文体量、入链分布、索引指令、canonical。口径：Google 桌面标题区 ≈ **30 全角字 ≈ 60 列**，描述 ≈ **78 全角字 ≈ 156 列**（列 = 全角 2 / ASCII 1）。⚠️ 两个坑：别按「30 列」判标题；列表页**不能**用 `<article>` 取正文（那是列表卡片，会误判 thin）。首轮结果：**技术卫生全绿**（孤儿/弱链/重复标题/重复描述/缺描述/canonical/noindex/thin 全 0），唯一缺陷 = 上述 18 个标题。

**尚未做（内容侧，非我执行）**：171 篇「A vs B」缺对比表格、栏目落地页正文、AI 类外链密度（0.25–0.55/千字 vs 标准 2.0）、36 篇短文扩写。**67 篇 >45 字标题已结论不做批量重写**。

## 职责边界（2026-10-07 用户明确划定，重要）

> 「我不希望你去写新的文章，文章我会让别人去写。」

- **我不写文章**（不写 `正文.md` / `选题卡.md`，不新建文章目录，不续写 T003 等预告过的下篇）。内容创作**由用户另行安排的人负责**。
- **我的职责 = 技术层 + 站内 SEO**：站点架构与抓取、URL 结构、sitemap/robots、结构化数据、标题与描述（走 `article-titles.json` 与源选题卡 `SEO 描述` 这类**既有机制**）、内链、模板与构建链路、搜索引擎提通道、数据诊断。
- 需要内容侧配合时，**只输出选题建议与理由，不动手写稿**。

## 关键结构事实（决定能做/不能做什么）

- **分类页与模块页的文章列表是 SSR 的** → `/ai/`、`/llm/` 等**本身就是带完整列表的汇总型入口页**，**不需要另建「大全」页**（另建会与它们重复，撞「已抓取-尚未编入索引」的重复判定）。
- **模块页 / 分类页的 `h1` 与 `<title>` 是两个字段** → 做 SEO **只改标题字段，不动 h1、侧边栏与导航**：模块页 `MODULE_META[x].title`（h1 用 `meta.name`）；分类页 `Category.seoTitle`（h1 用 `category.name`）。两者**必须全站唯一**，控制在 **~30 全角字**内。
- **改描述/alt 要写回源仓库**（源选题卡 `- SEO 描述：` 行 / 源 `正文.md`），只改 `src/content/articles/` 会被下次 `--sync` 冲掉；`--sync` 与 SEO 改动**不冲突**（实测「更新 0，复用 379」）。
- `check-seo.py` 硬约束：`<title>` 全站唯一、description 全站唯一、首页 `og:site_name` == `Sunday 的面试指南`。**不**校验 robots meta，**不**校验 sitemap 数量。
- 完整机制见 `docs/aiguide-engineering-notes.md` 第一、二、三节。

## 子域名 vs 二级路径（2026-10-07 评估，用户暂不执行）

结论：**应搬回 `www.lgdsunday.club/note/`**。收益排序：**百度（0→1，确定）> Bing（收录覆盖率）> Google（最小）**，不承诺排名与流量。
核心理由：实测差距三个数量级（主站 sitemap 仅 39 URL 却日抓 200–400 页；note 有 456 URL 抓取 0 页）→ **差距是抓取预算**；搬回后可**直接复用 www 的百度验证与 token**，绕过「百度加不了新站点」。
风险：二次迁移（note 权重近零 → **现在是历史最低成本时机**）、Nuxt+Astro 共存运维复杂度、战略取舍。**成本几乎全在 nginx**（改动面 11 文件约 25 行）。细节见 `docs/seo-subdomain-vs-subdirectory.md`。
**用户态度：明确「只确认，暂不执行」（已问过两轮）→ 不要主动开工迁移。**

## 诊断工具与用户偏好

- `.env` 的 Bing API Key 可直接查真实搜索数据：`https://ssl.bing.com/webmaster/api.svc/json/{Method}?apikey=<key>&siteUrl=<url>`
  - 可用 `GetUserSites` / `GetRankAndTrafficStats` / `GetQueryStats` / `GetCrawlStats` / `GetCrawlIssues` / `GetUrlSubmissionQuota`；`GetUrlTrafficInfo` 对 https 报 `SiteUriSchemeIsNotSupported`
- **北极星是点击**：判断任何改动先问「这能多带来多少次点击」；偏好中文，不喜欢中英夹杂；会追问根因
- **⚠️ 职责边界：我不写文章**（见上一节）→ 只做技术层 + 站内 SEO，内容侧只出建议
- **待用户决策**：① 是否搬回 `www.lgdsunday.club/note/`（暂不执行）；② 那 40 个「已抓取-尚未编入索引」页是哪些（取数方法已给，**建议不追**）；③ 外链建设（**只能用户做**：掘金/思否、公众号阅读原文、GitHub、知乎/CSDN）
- **用户仍在持续新增文章** → 每新增一篇**必须在 `scripts/article-slugs.json` 补英文 slug**；新增文章**不必逐篇**去 GSC「请求编入索引」（配额有限且对质量判定类无效）
- 2026-10-07 用户授予**广泛授权**：「按照你的想法去做，只要可以提高流量，我都支持你」+ 开放 GitHub 仓库随意使用
