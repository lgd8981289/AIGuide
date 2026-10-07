import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import rehypeCodeTabs from "./src/lib/rehype-code-tabs.mjs";
import rehypeReadmoreBoundary from "./src/lib/rehype-readmore-boundary.mjs";

// 空分类页（目前是 /agent-ext/）会渲染成「共 0 篇文章」的薄内容页。
// 这类页面正是 Google 判定「已抓取 - 尚未编入索引」的典型画像，因此：
//   · 页面本身保留（左侧导航要用，直接访问也不报错），
//   · 但不进 sitemap，并由页面自己输出 noindex（见 ArticleBrowser.astro 的 noindex 传参）。
// 判定方式：读 src/data/site.ts 里声明的分类 slug，对照 src/content/articles/ 的实际目录，
// 算出「已声明但一篇文章都没有」的分类。补上文章后这里会自动恢复正常，无需改动配置。
const declaredCategorySlugs = [
  ...readFileSync(new URL("./src/data/site.ts", import.meta.url), "utf8").matchAll(
    /^\s*slug:\s*'([^']+)'/gm
  ),
].map((match) => match[1]);
const articlesDir = fileURLToPath(new URL("./src/content/articles/", import.meta.url));
const emptyCategoryPaths = new Set(
  declaredCategorySlugs
    .filter((slug) => {
      const dir = `${articlesDir}${slug}/`;
      return !existsSync(dir) || !readdirSync(dir).some((name) => name.endsWith(".md"));
    })
    .map((slug) => `/${slug}/`)
);
if (emptyCategoryPaths.size > 0) {
  console.log(`[sitemap] 排除空分类页：${[...emptyCategoryPaths].join("、")}`);
}

// 指南独立部署在子域名根目录；旧 /note/ 地址由 Nginx 逐页 301。
export default defineConfig({
  site: "https://note.lgdsunday.club",
  base: "/",
  trailingSlash: "always",
  integrations: [
    sitemap({
      filter: (page) => {
        const { pathname } = new URL(page);
        if (/\/404(?:\.html|\/)?$/.test(pathname)) return false;
        return !emptyCategoryPaths.has(pathname);
      },
    }),
  ],
  markdown: {
    rehypePlugins: [rehypeCodeTabs, rehypeReadmoreBoundary],
    shikiConfig: {
      theme: "one-dark-pro",
      wrap: true,
    },
  },
});
