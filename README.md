# Sunday 的面试指南（AIGuide）

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
# 查询剩余额度、读取线上 sitemap 并预检页面，不提交
npm run bing:preview

# 通过 Bing Webmaster SubmitUrlBatch 接口提交
npm run bing:submit
```

脚本从 `https://note.lgdsunday.club/sitemap-index.xml` 自动读取并去重 URL，验证页面响应、canonical 与索引指令。每轮最多提交 500 条，并同时受实际剩余日额度、月额度限制；超额部分留待下次运行。成功提交后保存线上 HTML 指纹，后续运行跳过未变化的页面。

`.bing/state.json` 和 `.bing/receipt-*.json` 记录提交状态与回执。不要随意删除状态文件，否则脚本无法识别之前已提交的页面。网络超时、服务端错误或进程中断造成结果不确定时，脚本会保留在途状态并阻止自动重试，需要先核对回执和 Bing 后台。并发运行通过本地文件锁互斥。

这条命令使用站长后台 URL 提交对应的 API，与发布脚本已有的 IndexNow 通知是两种提交途径。一般发布更新继续使用现有 IndexNow 即可，无需为用完额度而重复提交。接口返回成功仅表示接收提交，不保证收录或排名。

本机已于 2026-09-29 在 Codex 中启用「Bing URL 自动提交」任务，每天北京时间 10:00 在当前聊天执行 `npm run bing:submit`。没有页面变化时不输出例行通知，有提交结果或新的异常时报告。运行需要电脑开机、Codex 保持运行，并保留本地项目、`.env` 和 `.bing/`；任务配置由 Codex 管理，不会随 Git 克隆自动安装。可以直接在聊天中要求调整时间或暂停，也可以随时运行上面的命令手动检查或提交。[本地自动任务运行条件](https://learn.chatgpt.com/docs/automations?surface=app)。

接口说明：[SubmitUrlBatch](https://learn.microsoft.com/en-us/dotnet/api/microsoft.bing.webmaster.api.interfaces.iwebmasterapi.submiturlbatch?view=bing-webmaster-dotnet)、[GetUrlSubmissionQuota](https://learn.microsoft.com/en-us/dotnet/api/microsoft.bing.webmaster.api.interfaces.iwebmasterapi.geturlsubmissionquota?view=bing-webmaster-dotnet)。

迁移验收与恢复位置见 [2026-09-28 子域名迁移记录](docs/audits/2026-09-28-note-migration.md)。旧 `/note/` 的跳转至少保留至 2027-09-28，建议长期保留。
