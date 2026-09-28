import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import rehypeCodeTabs from "./src/lib/rehype-code-tabs.mjs";
import rehypeReadmoreBoundary from "./src/lib/rehype-readmore-boundary.mjs";

// 指南独立部署在子域名根目录；旧 /note/ 地址由 Nginx 逐页 301。
export default defineConfig({
  site: "https://note.lgdsunday.club",
  base: "/",
  trailingSlash: "always",
  integrations: [sitemap({ filter: (page) => !/\/404(?:\.html|\/)?$/.test(new URL(page).pathname) })],
  markdown: {
    rehypePlugins: [rehypeCodeTabs, rehypeReadmoreBoundary],
    shikiConfig: {
      theme: "one-dark-pro",
      wrap: true,
    },
  },
});
