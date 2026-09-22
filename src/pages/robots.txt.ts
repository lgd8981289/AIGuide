import type { APIRoute } from "astro";

export const GET: APIRoute = () => {
  const body = [
    "User-agent: *",
    "Allow: /",
    "",
    "# 站内搜索的索引文件（前端按需加载，不是内容页），别浪费抓取配额",
    "Disallow: /note/pagefind/",
    "",
    "Sitemap: https://lgdsunday.club/note/sitemap-index.xml",
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
