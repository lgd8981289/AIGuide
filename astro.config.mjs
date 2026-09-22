import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import rehypeCodeTabs from "./src/lib/rehype-code-tabs.mjs";

// 部署形态：https://lgdsunday.club/note/（主站子目录）
// 站内所有链接、sitemap、robots 都会自动带上 /note 前缀
export default defineConfig({
  site: "https://lgdsunday.club",
  base: "/note",
  trailingSlash: "always",
  integrations: [sitemap()],
  markdown: {
    rehypePlugins: [rehypeCodeTabs],
    shikiConfig: {
      theme: "one-dark-pro",
      wrap: true,
    },
  },
});
