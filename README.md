# Sunday 的面试指南（AIGuide）

部署形态：`https://lgdsunday.club/note/`（主站子目录，SEO 权重直接继承主域名）。

技术栈：Astro 静态生成（纯 HTML 输出）+ Pagefind 全文搜索 + 亮暗主题切换 + TechGrow 公众号引流（可选，默认关闭）。

布局：顶部栏（站点模块导航 + 右上角搜索/主题/GitHub）+ 左侧系列目录（分类页与文章页，只显示当前模块的分类）+ 文章页右侧目录。

**站点分两个顶层模块**（顶部导航）：

| 模块 | URL | 内容源 | 编号 |
| --- | --- | --- | --- |
| AI 面试题 | `/note/ai/` | `AI 工程面试手册/文章` | Q001… |
| AI 编程教程 | `/note/tutorial/` | `一起来玩 AI 呀～/文章` | T001… |

内容由 `scripts/sync-content.mjs` 按 `scripts/sources.json` 单向同步，**不要直接改 `src/content/` 与 `public/img/` 下的文件**，改了会被下次同步覆盖。

## 日常发布流程

```bash
# 1. 在对应写作仓库写完文章（{分类}/{编号-主题}/正文.md）
# 2. 若是新编号，在 scripts/sync-content.mjs 的 SLUGS 里补一行英文 slug
npm run sync     # 同步两个源的正文 + 图片水印（正文.assets → public/img，从原图重生成）
npm run build    # 构建到 dist/
# 3. 部署到服务器（见下）
```

本地预览：`npm run dev`（开发热更新，地址 http://localhost:4321/note/）

> 只想同步正文、跳过图片水印：`npm run sync:content`；只重打水印：`npm run sync:img`。
> 水印脚本需要 Pillow（`pip3 install Pillow`），没装时只警告、不会中断发布。
> 两个源都要同步完整跑一遍（脚本是幂等的，先清空产物再生成）。

## 服务器部署（腾讯云）

```bash
# 构建产物推到服务器
rsync -av --delete dist/ user@你的服务器IP:/var/www/aiguide/
```

主站 nginx 配置中增加：

```nginx
location /note/ {
    alias /var/www/aiguide/;
    index index.html;
    error_page 404 /note/404.html;
}
```

重载：`nginx -s reload`。证书与域名解析沿主站（已备案，无需额外操作）。

## TechGrow 公众号引流

当前**默认关闭**（文章全文直接可见，不加载任何外部脚本）。开启步骤：

1. 到 https://open.techgrow.cn 注册博客，记录 `博客 ID`
2. 微信公众号后台 → 自动回复 → 关键词回复，配置关键词与验证码链接（格式见 TechGrow 官方文档「使用步骤」第二步）
3. 修改 `src/data/site.ts` 里的 `TECHGROW`：补齐 `blogId`、`name`（公众号名）、`keyword`、`qrcode`（二维码图片地址），把 `enabled` 改为 `true`
4. 重新 `npm run build` 并部署

已内置的策略：

- 遮罩起点自动定位到「知识点详解」标题处——「面试速答」保持免费可见，作为解锁钩子
- 移动端默认关闭引流（`allowMobile: false`），保护移动搜索体验
- 锁定发生在浏览器端，HTML 源码始终完整，SEO 无损

## SEO 收录提交（上线后做一次）

| 平台 | 操作 |
| --- | --- |
| 百度搜索资源平台 | 添加站点 `lgdsunday.club` → 验证 → 提交 `https://lgdsunday.club/note/sitemap-index.xml`，开启自动推送 |
| Google Search Console | 添加资源 `https://lgdsunday.club/note/` → 提交 sitemap |
| Bing 站长工具 | 同上 |

## 维护备忘

- **改站名 / 文案**：只改 `src/data/site.ts`
- **顶部模块导航**：`src/data/site.ts` 的 `MODULES` + `MODULE_META`。加一个模块 = ① `MODULE_META` 补一条（导航名、落地页、列表标题、计数单位、上下篇文案）② `MODULES` 补一行 ③ `CATEGORIES` 里给新分类加 `module: '<新模块 key>'` ④ 建落地页 `src/pages/<slug>/index.astro`（一行 `<ModuleLanding module="..." />`）⑤ `scripts/sources.json` 加一个来源。
- **新增分类**：`scripts/sources.json` 的 `categories`（写作仓库目录名 → URL slug）与 `src/data/site.ts` 的 `CATEGORIES` 两处都要加，slug 保持全局唯一
- **新编号补 slug**：`scripts/sync-content.mjs` 的 `SLUGS`（URL 带英文关键词利于 SEO；不补也能构建，URL 会退化为编号）
- **文章元数据**：标题取正文 H1（自动去掉「｜分类」后缀），日期取正文文件修改时间。
  - **描述 / SEO description** 按优先级取值：面试题 → 「面试速答」段落；教程 → 选题卡里的 `- 描述：xxx`（手写，最准）→ 选题卡里的 `- 读完能掌握什么：`（自动拼成「教你……」）→ 正文前几句。
  - 兜底的正文提取会自动跳过「大家好，我是 Sunday」这类开场白、口语短句与图片/列表，并在句末标点处截断（上限 120 字）。**想精确控制某篇的 SEO 描述，在选题卡里加一行 `- 描述：……` 即可**，不用改脚本。
  - FAQ 结构化数据（`FAQPage`）只对面试题生成，取自「面试速答」。
- **多语言代码块**：正文里连续排布的「`#### 语言名` + 代码块」（两个及以上）会在渲染时自动合并成可切换语言的代码块（标签名取标题文字，选择会全站同步并记住）。写作层用普通 Markdown 即可，无需特殊语法。
- **编号展示规则**：写作仓库目录里的 Q003 / T001 只是维护编号，站内展示的是**分类内序号**——由 `src/data/articles.ts` 统一计算（`displayNum`，面试题前缀 Q、教程前缀 T），侧边栏、分类页、文章页、模块页、首页全部走这一个入口。URL 仍用写作仓库编号。
- **简历汪推广位**：`src/components/ResumeCta.astro`，三种形态 `banner`（首页主推）/ `inline`（文章末尾）/ `sidebar`（左侧栏底部），文案在组件内改。
- **站点 logo**：`public/avatar.jpg`，路径配置在 `src/data/site.ts` 的 `SITE.logo`（顶栏品牌用）。favicon 与它独立：`public/favicon.svg`（渐变底 + 白色问号）+ `public/apple-touch-icon.png`（180×180）。
- **顶部模块高亮**：由 `moduleOfPath()` 按路径推断所属模块（分类页看分类归属，模块页看自身），再传给 Topbar 高亮。
- **文章页阅读组件**：右侧目录（`Toc.astro`，展示 1~3 级标题、滚动高亮，≥1180px 显示）/ 回到顶部 + 阅读进度环（`BackTop.astro`）/ 沉浸式阅读（`ImmersiveToggle.astro`，隐藏侧栏与目录、正文居中，Esc 退出）/ 图片点击放大（`ImageZoom.astro`，Esc 关闭、←/→ 切换）。均为纯前端交互，不影响 SEO。
- **复制防护**：默认**关闭**（`src/data/site.ts` 的 `COPY_GUARD.enabled`），读者可自由复制引用。改成 `true` 后 `CopyGuard.astro` 会拦截正文的复制/剪切/右键/拖图/选区并弹提示条（仅命中正文范围内的事件，输入框不受影响）。**这只是劝阻，源码本身公开**，真正防搬运靠图片水印与署名。
- **代码复制按钮**：`CodeCopy.astro` 给每个 `.prose pre` 注入「复制」按钮（悬停显示，触屏常显，点完变「已复制」），与复制防护相互独立。
- **图片水印**：`scripts/watermark-images.py`（Pillow）+ `scripts/watermark-images.mjs`（挑解释器）。样式是**斜向平铺的浅水印**，铺满整张图（不是角落一个小标记）；底图明暗会自动切换——浅色区域用深灰字、深色区域用白字，逐像素判断，所以明暗交界处也清晰。原始素材（写作仓库的 `正文.assets/`）保持干净，只给站点产物 `public/img/{题号}/` 打水印；每次从原图重新生成，重复跑不会叠加。gif 会跳过。
  - 想调浓淡 / 密度：改 py 文件顶部常量——`WATERMARK_ALPHA_ON_LIGHT`（浅色底上文字透明度，越小越浅，当前 26）、`WATERMARK_ALPHA_ON_DARK`（深色底，当前 46）、`WATERMARK_SCALE`（字号 = 图宽 × 该比例）、`WATERMARK_GAP_X/Y`（平铺间距系数）、`WATERMARK_ANGLE`（倾斜角度）。
  - 想换成角落小标记：把 `add_watermark` 里的平铺逻辑换成一次 `draw.text` 即可。
- **误删救援**：源码都在 git 里。若工作区文件被误操作清空，用 `git checkout <commit> -- .` 从任意历史提交恢复（例如 `git checkout 84e48ea -- .`）。

## 搜索与主题

- **搜索**（Pagefind）：构建时生成索引到 `dist/pagefind/`，零后端。快捷键 `⌘K` / `Ctrl+K`。注意：`npm run dev` 开发模式下索引不存在，搜索会提示「未就绪」，构建后（`npm run build`）即可用。导航、侧边栏、页脚已用 `data-pagefind-ignore` 排除出索引。
- **主题切换**：右上角按钮切换亮 / 暗，首次访问跟随系统，选择存 localStorage。防闪烁脚本在 `<head>` 内联。

## 目录结构

```
AIGuide/
├── astro.config.mjs        # site + base(/note) + sitemap + rehype 代码块插件
├── scripts/sources.json    # 内容来源配置（两个写作仓库 + 分类映射，同步与水印共用）
├── scripts/sync-content.mjs # 发布同步脚本（写作仓库 → 站点）
├── scripts/watermark-images.py  # 图片水印（Pillow）
├── scripts/watermark-images.mjs # 水印调度（自动找带 Pillow 的 python3）
├── src/
│   ├── content.config.ts   # 文章集合定义（zod 校验，含 module 字段）
│   ├── data/site.ts        # 站名、模块与分类、开关（集中改这里）
│   ├── data/articles.ts    # 编号展示规则（分类内序号 displayNum，全站唯一入口）
│   ├── content/articles/   # 同步产物（勿手改）
│   ├── layouts/BaseLayout.astro   # 主题初始化、页面骨架、模块推断
│   ├── components/         # Topbar / Sidebar / ModuleLanding / Toc / ImageZoom / BackTop / Immersive / CodeTabs / CodeCopy / CopyGuard / TechGrow / ResumeCta / Footer / SearchDialog
│   ├── pages/              # 首页 / ai 与 tutorial 模块页 / [category] 分类页与文章页 / 404 / robots
│   └── styles/global.css   # 亮暗变量、布局、prose 排版
├── public/img/             # 文章图片（同步产物，按编号归档）
└── dist/                   # 构建产物（含 pagefind 索引，部署这个）
```
