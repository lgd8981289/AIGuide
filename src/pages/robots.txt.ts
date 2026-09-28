import type { APIRoute } from "astro";

export const GET: APIRoute = () => {
  // 子域名根目录的 robots，独立管理指南的抓取规则。
  const body = [
    "User-agent: *",
    "Allow: /",
    "",
    "# 站内搜索的索引文件（前端按需加载，不是内容页），别浪费抓取配额",
    "Disallow: /pagefind/",
    "",
    "Sitemap: https://note.lgdsunday.club/sitemap-index.xml",
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
