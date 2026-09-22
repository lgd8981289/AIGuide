# AI 面试指南（AIGuide）

部署形态：`https://lgdsunday.club/note/`（主站子目录，SEO 权重直接继承主域名）。

技术栈：Astro 静态生成（纯 HTML 输出）+ Pagefind 全文搜索 + 亮暗主题切换 + TechGrow 公众号引流（可选，默认关闭）。

布局：顶部栏（站点模块导航 + 右上角搜索/主题/GitHub）+ 左侧系列目录（分类页与文章页）。

内容源头：上级目录的《AI 工程面试手册》写作仓库，通过 `scripts/sync-content.mjs` 单向同步，**不要直接改 `src/content/` 下的文件**，改了会被下次同步覆盖。

## 日常发布流程

```bash
# 1. 在写作仓库写完文章（文章/{分类}/{Q编号}-{主题}/正文.md）
# 2. 若是新题号，在 scripts/sync-content.mjs 的 SLUGS 里补一行英文 slug
npm run sync     # 同步正文与图片，自动生成 frontmatter
npm run build    # 构建到 dist/
# 3. 部署到服务器（见下）
```

本地预览：`npm run dev`（开发热更新，地址 http://localhost:4321/note/）

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
- **顶部模块导航**：`src/data/site.ts` 的 `MODULES`。当前「首页」→ `/`、「AI 面试题」→ `/ai/`（模块落地页在 `src/pages/ai/index.astro`，含六系列卡片 + 全部分组题目）。新方向上线时补一行 MODULES + 建一个对应落地页即可。
- **新增一级分类**：改两处——`src/data/site.ts` 的 `CATEGORIES` 和 `scripts/sync-content.mjs` 的 `CATEGORIES`（保持一致）
- **新题号补 slug**：`scripts/sync-content.mjs` 的 `SLUGS`（URL 带英文关键词利于 SEO；不补也能构建，URL 会退化为题号）
- **文章元数据**：标题取正文 H1（自动去掉「｜分类」后缀），描述取「面试速答」段落，日期取正文文件的修改时间——全部自动，写作层零负担
- **多语言代码块**：正文里连续排布的「`#### 语言名` + 代码块」（两个及以上）会在渲染时自动合并成可切换语言的代码块（标签名取标题文字，选择会全站同步并记住）。写作层用普通 Markdown 即可，无需特殊语法。
- **题号展示规则**：写作仓库目录里的 Q 编号（如 Q003）只是维护编号，站内展示的是**分类内序号**——由 `src/data/articles.ts` 统一计算（`displayNum`），侧边栏、分类页、文章页、首页全部走这一个入口。URL 仍用写作仓库编号，已发布链接不会变。
- **简历汪推广位**：`src/components/ResumeCta.astro`，三种形态 `banner`（首页主推）/ `inline`（文章末尾）/ `sidebar`（左侧栏底部），文案在组件内改。
- **站点 logo**：`public/avatar.jpg`，路径配置在 `src/data/site.ts` 的 `SITE.logo`（顶栏品牌用）。favicon 与它独立：`public/favicon.svg`（渐变底 + 白色问号）+ `public/apple-touch-icon.png`（180×180）。
- **顶部模块高亮**：按当前路径动态计算（首页路径高亮「首页」，其余高亮所属模块），不再依赖 MODULES 的 active 硬编码。
- **文章页阅读组件**：右侧目录（`Toc.astro`，展示 1~3 级标题、滚动高亮，≥1180px 显示）/ 回到顶部 + 阅读进度环（`BackTop.astro`）/ 沉浸式阅读（`ImmersiveToggle.astro`，隐藏侧栏与目录、正文居中，Esc 退出）。均为纯前端交互，不影响 SEO。

## 搜索与主题

- **搜索**（Pagefind）：构建时生成索引到 `dist/pagefind/`，零后端。快捷键 `⌘K` / `Ctrl+K`。注意：`npm run dev` 开发模式下索引不存在，搜索会提示「未就绪」，构建后（`npm run build`）即可用。导航、侧边栏、页脚已用 `data-pagefind-ignore` 排除出索引。
- **主题切换**：右上角按钮切换亮 / 暗，首次访问跟随系统，选择存 localStorage。防闪烁脚本在 `<head>` 内联。

## 目录结构

```
AIGuide/
├── astro.config.mjs        # site + base(/note) + sitemap
├── scripts/sync-content.mjs # 发布同步脚本（写作仓库 → 站点）
├── src/
│   ├── content.config.ts   # 文章集合定义（zod 校验）
│   ├── data/site.ts        # 站名、模块导航、分类、TechGrow、GitHub（集中改这里）
│   ├── data/articles.ts    # 题号展示规则（分类内序号 displayNum，全站唯一入口）
│   ├── content/articles/   # 同步产物（勿手改）
│   ├── layouts/BaseLayout.astro   # 主题初始化、页面骨架
│   ├── components/         # Topbar（模块导航+工具区）/ Sidebar（系列树）/ SearchDialog / TechGrow / ResumeCta / Footer
│   ├── pages/              # 首页 / ai 模块页 / [category] 分类页与文章页 / 404 / robots
│   └── styles/global.css   # 亮暗变量、布局、prose 排版
├── public/img/             # 文章图片（同步产物，按题号归档）
└── dist/                   # 构建产物（含 pagefind 索引，部署这个）
```
