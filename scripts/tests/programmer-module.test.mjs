// 构建产物验收：先 npm run build，再运行此文件。
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const root = new URL("../../", import.meta.url);
const read = (relative) => fs.readFileSync(new URL(relative, root), "utf8");
const navigation = (html) => html.match(/<nav\b[^>]*aria-label="网站栏目"[^>]*>([\s\S]*?)<\/nav>/)?.[1] ?? "";
const source = JSON.parse(read("scripts/sources.json")).sources.find((s) => s.module === "programmer");
const categorySlugs = Object.values(source.categories);

test("全栈分类映射与本地五个归档目录一致", () => {
  assert.deepEqual(source.categories, {
    前端面试题: "frontend",
    后端面试题: "backend",
    数据库与缓存面试题: "database",
    计算机基础面试题: "cs-basics",
    系统设计面试题: "fullstack-system-design",
  });
  for (const name of Object.keys(source.categories)) {
    assert.ok(fs.statSync(new URL(`${source.root}/${name}/`, root)).isDirectory(), name);
  }
});

test("导航把全栈面试题放在 AI 面试题与 AI 编程教程之间", () => {
  for (const page of ["index.html", "ai/index.html", "programmer/index.html", ...categorySlugs.map((slug) => `${slug}/index.html`), "tutorial/index.html"]) {
    const nav = navigation(read(`dist/${page}`));
    const links = [...nav.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/g)].map((m) => m[1]);
    assert.deepEqual(links, ["/", "/ai/", "/programmer/", "/tutorial/", "/agent-course/"], page);
  }
});

test("模块页与分类页高亮正确，具备独立 canonical 和结构化数据", () => {
  for (const page of ["programmer", ...categorySlugs]) {
    const html = read(`dist/${page}/index.html`);
    assert.match(html, /全栈面试题/);
    assert.doesNotMatch(html, /程序员面试题/);
    const active = navigation(html).match(/<a\b[^>]*href="\/programmer\/"[^>]*>/)?.[0];
    assert.match(active ?? "", /aria-current="page"/);
    assert.match(html, new RegExp(`<link[^>]*rel="canonical"[^>]*href="https://note\\.lgdsunday\\.club/${page}/"`));
    const schemas = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
      .flatMap((m) => JSON.parse(m[1]));
    assert.ok(schemas.some((s) => s["@type"] === "CollectionPage"));
    assert.ok(schemas.some((s) => s["@type"] === "BreadcrumbList" && s.itemListElement[1].item.endsWith("/programmer/")));
    const sidebar = html.match(/<aside\b[^>]*class="browse-sidebar"[\s\S]*?<\/aside>/)?.[0] ?? "";
    // 叶子分类直接列文章，空分类不占用目录；分类页和列表筛选仍保留完整分类元数据。
    for (const slug of categorySlugs) assert.ok(sidebar.includes(`data-filter-category="${slug}"`), `${page}: ${slug}`);
    assert.ok(!sidebar.includes('href="/programming/"'));
    assert.ok(!sidebar.includes('href="/agent/"'));
  }
});

test("空模块显示准备中并能返回首页；未来有正文时展示文章而非候选清单", () => {
  const html = read("dist/programmer/index.html");
  assert.match(html, /<h1\b[^>]*>全栈面试题<\/h1>/);
  const articleCount = categorySlugs.reduce((total, slug) => {
    const sourceDir = new URL(`src/content/articles/${slug}/`, root);
    return total + (fs.existsSync(sourceDir) ? fs.readdirSync(sourceDir).filter((f) => f.endsWith(".md")).length : 0);
  }, 0);
  assert.equal([...html.matchAll(/<li\b[^>]*class="browse-post"/g)].length, articleCount);
  if (articleCount === 0) {
    assert.match(html, /全栈面试题正在准备中/);
    const empty = html.match(/<div\b[^>]*class="browse-empty"[\s\S]*?<\/div>/)?.[0] ?? "";
    assert.match(empty, /href="\/"/);
    assert.doesNotMatch(empty, /data-filter-category/);
  }
});

test("sitemap 收录独立模块，原有十篇文章地址仍然存在", () => {
  const sitemap = read("dist/sitemap-0.xml");
  assert.ok(sitemap.includes("https://note.lgdsunday.club/programmer/"));
  for (const slug of categorySlugs) assert.ok(sitemap.includes(`https://note.lgdsunday.club/${slug}/`));
  assert.ok(!sitemap.includes("https://note.lgdsunday.club/programming/"));
  for (const path of ["agent/q066", "engineering/q067", "rag/q068", "engineering/q069", "agent/q070", "agent/q071", "llm/q072", "engineering/q073", "engineering/q074", "engineering/q075"]) {
    assert.ok(fs.existsSync(new URL(`dist/${path}/index.html`, root)), path);
  }
});
