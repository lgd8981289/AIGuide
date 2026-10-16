// 构建产物验收：先 npm run build，再运行此文件。
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const root = new URL("../../", import.meta.url);
const read = (relative) => fs.readFileSync(new URL(relative, root), "utf8");
const navigation = (html) => html.match(/<nav\b[^>]*aria-label="网站栏目"[^>]*>([\s\S]*?)<\/nav>/)?.[1] ?? "";
const source = JSON.parse(read("scripts/sources.json")).sources.find((s) => s.module === "programmer");
const categorySlugs = Object.values(source.categories);

test("全栈分类映射与本地七个归档目录一致", () => {
  assert.deepEqual(source.categories, {
    前端面试题: "frontend",
    后端面试题: "backend",
    Python面试题: "python",
    Go面试题: "go",
    数据库与缓存面试题: "database",
    计算机基础面试题: "cs-basics",
    系统设计面试题: "fullstack-system-design",
  });
  for (const name of Object.keys(source.categories)) {
    assert.ok(fs.statSync(new URL(`${source.root}/${name}/`, root)).isDirectory(), name);
  }
});

test("Go 使用独立平级分类与四个三级专题", () => {
  const site = read("src/data/site.ts");
  assert.match(site, /slug: 'go',[\s\S]*?name: 'Go 面试题',[\s\S]*?module: 'programmer'/);
  const topics = JSON.parse(read("src/data/topics.json")).filter((topic) => topic.category === "go");
  assert.deepEqual(topics.map(({ id, name }) => [id, name]), [
    ["go:language", "语言基础"],
    ["go:concurrency", "并发编程"],
    ["go:runtime", "运行时"],
    ["go:engineering", "工程与框架"],
  ]);
});

test("Java 栏目更名保留 backend 路由与历史来源目录", () => {
  assert.equal(source.categories.后端面试题, "backend");
  assert.equal(source.categoryLabels.backend, "Java 面试题");
  const site = read("src/data/site.ts");
  assert.ok(/slug: 'backend',[\s\S]*?name: 'Java 面试题',[\s\S]*?nav: 'Java'/.test(site));
  const html = read("dist/backend/index.html");
  assert.ok(/<h1\b[^>]*>Java 面试题<\/h1>/.test(html));
  assert.ok(/<title>Java 面试题及答案：JVM、并发与 Spring/.test(html));
  assert.ok(/rel="canonical"[^>]*href="https:\/\/note\.lgdsunday\.club\/backend\/"/.test(html));
  const module = read("dist/programmer/index.html");
  assert.ok(module.includes('data-category-title="Java 面试题"'));
  assert.ok(!module.includes('data-category-title="后端面试题"'));
  assert.ok(!module.includes('href="/java/"'));
  const schemas = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap((m) => JSON.parse(m[1]));
  assert.ok(schemas.some((s) => s["@type"] === "CollectionPage" && s.name === "Java 面试题"));
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
  for (const slug of categorySlugs) {
    const dir = new URL(`src/content/articles/${slug}/`, root);
    const hasArticles = fs.existsSync(dir) && fs.readdirSync(dir).some((name) => name.endsWith(".md"));
    assert.equal(sitemap.includes(`https://note.lgdsunday.club/${slug}/`), hasArticles, slug);
    if (!hasArticles) assert.match(read(`dist/${slug}/index.html`), /<meta[^>]*name="robots"[^>]*content="noindex[^"<>]*"/);
  }
  assert.ok(!sitemap.includes("https://note.lgdsunday.club/programming/"));
  const published = JSON.parse(read("scripts/article-published-urls.json")).articles;
  for (let number = 66; number <= 75; number++) {
    const qnum = `Q${String(number).padStart(3, "0")}`;
    const record = published[qnum];
    assert.ok(record, qnum);
    const pathname = record;
    assert.ok(fs.existsSync(new URL(`dist${pathname}index.html`, root)), pathname);
    assert.ok(sitemap.includes(`https://note.lgdsunday.club${pathname}`), pathname);
  }
});

test("Go 分类在全栈列表中有独立入口，未成文候选不充作正文", () => {
  const html = read("dist/programmer/index.html");
  assert.match(html, /href="\/go\/"/);
  const go = read("dist/go/index.html");
  assert.match(go, /<h1\b[^>]*>Go 面试题<\/h1>/);
  const dir = new URL("src/content/articles/go/", root);
  if (!fs.existsSync(dir) || !fs.readdirSync(dir).some((name) => name.endsWith(".md"))) {
    assert.match(go, /browse-empty/);
    assert.doesNotMatch(go, /<li\b[^>]*class="browse-post"[^>]*data-category="go"/);
  }
});
