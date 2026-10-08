# 网站开发与维护

## 关于这个仓库

本站内容覆盖 **AI 与全栈面试准备**，面向校招、实习与社招读者。GitHub 的 articles/ 目录提供已发布文章的完整 Markdown。

- 网站：<https://note.lgdsunday.club/>
- 公众号：微信搜「**程序员Sunday**」，新文章第一时间推送（二维码见下）
- 姊妹站点：[简历汪](https://lgdsunday.club/)（简历模板与求职工具）

<div align="center">

<img src="assets/wechat-qrcode.jpg" alt="微信搜一搜或扫码关注公众号：程序员Sunday" width="520">

<br>

<b>微信搜一搜「程序员Sunday」，或扫码关注</b>

</div>

> 本仓库保存站点源码、运维说明和 articles/ 公开正文；网站构建用的同步文件与图片原图保留本地。
> 开发与部署文档见下方「仓库维护说明」。

---

# 仓库维护说明（开发文档）

## 公司面试真题与文章标签

在 `src/data/company-interviews.mjs` 维护公司、岗位 `roleKey`、公开面经来源、核验日期和文章全局题号。原帖明确出现的问题用 `mentioned`，同时维护题意 `question`；编辑补充的阅读方向用 `related`。只有已核验的 `mentioned` 生成真题标签和列表，禁止根据文章关键词自动贴公司。`dateLabel` 区分发布、编辑与面试时间，页面没有年份时保留“未明确年份”。问题题意需逐条核对原帖，不把本站模拟对话写成真实问答。

文章 H1 下方用真实 `<a href>` 展示“公司＋岗位＋面试真题”标签，指向 `/companies/{company}/{role}/`。所有文章都有文末“公司面试真题”环节，未收录来源的题目显示明确空状态。公司与岗位列表按文章去重并链接回原有正文；GitHub 同步正文、标题标签与 `articles/companies/` 真题目录。旧公司指南地址保留兼容访问，`noindex` 并规范到新列表，不重复进入 sitemap。

更新后运行 `node --test scripts/tests/company-interviews.test.mjs scripts/tests/github-articles.test.mjs`、`npm run export:github`、`npm run build`、`npm run check:companies` 和 `npm run check:urls`。不得把构建和导出当成已部署或已推送；来源引用也不替代文章技术结论的核验。

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

执行 `./deploy.sh --sync` 时，同步脚本优先使用配置里的标题；没有配置的文章沿用源稿一级标题。H1、列表、相关文章、结构化数据和站内搜索使用同步后的标题；网页 title 统一追加 Sunday面试指南，公众号源稿与文章 URL 不变。配置中保留的标题会固定使用；以后源稿改题时，也应复查这一配置。

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
