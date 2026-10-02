import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const syncScript = fileURLToPath(new URL("../sync-content.mjs", import.meta.url));
const fullstackSource = JSON.parse(fs.readFileSync(new URL("../sources.json", import.meta.url), "utf8"))
  .sources.find((source) => source.module === "programmer");

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "aiguide-sync-test-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, "scripts"));
  fs.copyFileSync(syncScript, path.join(root, "scripts/sync-content.mjs"));
  fs.mkdirSync(path.join(root, "src/lib"), { recursive: true });
  fs.mkdirSync(path.join(root, "src/data"), { recursive: true });
  fs.copyFileSync(new URL("../../src/lib/article-topics.mjs", import.meta.url), path.join(root, "src/lib/article-topics.mjs"));
  fs.writeFileSync(path.join(root, "src/data/topics.json"), "[]");
  fs.writeFileSync(path.join(root, "scripts/article-topics.json"), "[]");
  const sourceFile = path.join(root, "source/面试题/Q001-测试/正文.md");
  const fallbackFile = path.join(root, "source/教程/T009-测试/正文.md");
  const source = "# 原始公众号标题｜Agent 面试题\n\n正文保持原样。\n\n## 面试速答（60 秒版）\n\n任务状态需要持久化，重试需要核对执行结果。\n\n## 知识点详解\n\n文章里的原始内容。\n";
  const fallback = "# 新文章沿用源稿标题\n\n这是一篇没有配置网站标题的新文章，正文保持原样。\n";
  for (const [file, body] of [[sourceFile, source], [fallbackFile, fallback]]) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, body);
  }
  fs.writeFileSync(path.join(root, "scripts/sources.json"), JSON.stringify({ sources: [
    { module: "interview", root: "source", categories: { 面试题: "agent" } },
    { module: "tutorial", root: "source", categories: { 教程: "tools" } },
  ] }));
  const config = path.join(root, "scripts/article-titles.json");
  fs.writeFileSync(config, JSON.stringify({ Q001: "网站专用标题：如何保存任务状态？" }));
  return { root, sourceFile, source, fallbackFile, fallback, config,
    output: path.join(root, "src/content/articles/agent/q001-agent-vs-workflow.md"),
    run: () => spawnSync(process.execPath, ["scripts/sync-content.mjs"], { cwd: root, encoding: "utf8" }),
  };
}

test("网站标题覆盖、未配置文章回退，重复同步保持 URL、正文及源稿不变", (t) => {
  const f = fixture(t);
  const first = f.run();
  assert.equal(first.status, 0, first.stderr);
  const generated = fs.readFileSync(f.output, "utf8");
  assert.match(generated, /^title: "网站专用标题：如何保存任务状态？"$/m);
  assert.ok(generated.endsWith(f.source.slice(f.source.indexOf("\n") + 1).trimStart() + "\n"));
  assert.match(fs.readFileSync(path.join(f.root, "src/content/articles/tools/t009.md"), "utf8"), /^title: "新文章沿用源稿标题"$/m);
  assert.equal(f.run().status, 0);
  assert.equal(fs.readFileSync(f.output, "utf8"), generated);
  assert.equal(fs.readFileSync(f.sourceFile, "utf8"), f.source);
  assert.equal(fs.readFileSync(f.fallbackFile, "utf8"), f.fallback);

  fs.writeFileSync(f.config, "{}");
  assert.equal(f.run().status, 0);
  const restored = fs.readFileSync(f.output, "utf8");
  assert.match(restored, /^title: "原始公众号标题"$/m);
  assert.equal(restored.replace(/^title: .+$/m, ""), generated.replace(/^title: .+$/m, ""));
});

test("损坏的标题配置在清理前失败，保留上一次文章和图片产物", (t) => {
  const f = fixture(t);
  assert.equal(f.run().status, 0);
  const generated = fs.readFileSync(f.output, "utf8");
  const image = path.join(f.root, "img-src/previous.png");
  fs.mkdirSync(path.dirname(image), { recursive: true });
  fs.writeFileSync(image, "previous image");
  for (const invalid of ["{", JSON.stringify({ Q001: "" })]) {
    fs.writeFileSync(f.config, invalid);
    assert.notEqual(f.run().status, 0);
    assert.equal(fs.readFileSync(f.output, "utf8"), generated);
    assert.equal(fs.readFileSync(image, "utf8"), "previous image");
  }
});

test("全栈面试题独立同步，沿用速答摘要与全局 Q 编号，不改动其他模块", (t) => {
  const f = fixture(t);
  const configPath = path.join(f.root, "scripts/sources.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  config.sources.splice(1, 0, {
    ...fullstackSource, root: "source/全栈面试题",
  });
  fs.writeFileSync(configPath, JSON.stringify(config));
  const sourceFile = path.join(f.root, "source/全栈面试题/数据库与缓存面试题/Q076-测试/正文.md");
  const source = "# 缓存失效后如何控制回源压力？\n\n这是开场对话，不应作为优先摘要。\n\n## 面试速答（60 秒版）\n\n要先判断缓存为什么没有命中，再控制同时回源的请求数。\n\n## 知识点详解\n\n正文示例。\n";
  fs.mkdirSync(path.dirname(sourceFile), { recursive: true });
  fs.writeFileSync(sourceFile, source);
  assert.equal(f.run().status, 0);
  const output = path.join(f.root, "src/content/articles/database/q076.md");
  const generated = fs.readFileSync(output, "utf8");
  assert.match(generated, /^module: "programmer"$/m);
  assert.match(generated, /^category: "database"$/m);
  assert.match(generated, /^qnum: "Q076"$/m);
  assert.match(generated, /^description: "要先判断缓存为什么没有命中，再控制同时回源的请求数。"$/m);
  assert.match(generated, /^faqAnswer: "要先判断缓存为什么没有命中，再控制同时回源的请求数。"$/m);
  assert.equal(fs.readFileSync(sourceFile, "utf8"), source);
  assert.ok(fs.existsSync(f.output));
  assert.ok(fs.existsSync(path.join(f.root, "src/content/articles/tools/t009.md")));
  assert.equal(f.run().status, 0);
  assert.equal(fs.readFileSync(output, "utf8"), generated);
});

test("五个全栈子分类均可从嵌套目录同步，不混入 AI 或教程目录", (t) => {
  const f = fixture(t);
  const configPath = path.join(f.root, "scripts/sources.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  config.sources.splice(1, 0, { ...fullstackSource, root: "source/全栈面试题" });
  fs.writeFileSync(configPath, JSON.stringify(config));
  const cases = Object.entries(fullstackSource.categories).map(([name, slug], i) => {
    const num = `Q${900 + i}`;
    const input = path.join(f.root, `source/全栈面试题/${name}/${num}-测试/正文.md`);
    fs.mkdirSync(path.dirname(input), { recursive: true });
    fs.writeFileSync(input, `# ${name}同步测试\n\n## 面试速答（60 秒版）\n\n这是一段用于检查分类归属的完整回答。\n\n## 知识点详解\n\n测试正文。\n`);
    return { name, slug, num };
  });
  assert.equal(cases.length, 5);
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  for (const { slug, num } of cases) {
    const output = path.join(f.root, `src/content/articles/${slug}/${num.toLowerCase()}.md`);
    const generated = fs.readFileSync(output, "utf8");
    assert.match(generated, /^module: "programmer"$/m);
    assert.ok(generated.includes(`category: "${slug}"`));
    assert.ok(generated.includes(`qnum: "${num}"`));
    assert.ok(!fs.existsSync(path.join(f.root, `src/content/articles/engineering/${num.toLowerCase()}.md`)));
  }
  assert.ok(fs.existsSync(f.output));
  assert.ok(fs.existsSync(path.join(f.root, "src/content/articles/tools/t009.md")));
});

test("专题按原始编号同步，错误及重复归属在清理前失败", (t) => {
  const f = fixture(t);
  const registry = path.join(f.root, "src/data/topics.json");
  const mapping = path.join(f.root, "scripts/article-topics.json");
  fs.writeFileSync(registry, JSON.stringify([{ id: "agent:tools", category: "agent", name: "工具调用" }, { id: "tools:setup", category: "tools", name: "配置" }]));
  fs.writeFileSync(mapping, JSON.stringify([{ qnum: "Q001", topic: "agent:tools" }]));
  assert.equal(f.run().status, 0);
  const generated = fs.readFileSync(f.output, "utf8");
  assert.match(generated, /^topic: "agent:tools"$/m);
  assert.equal(fs.readFileSync(f.sourceFile, "utf8"), f.source);
  const image = path.join(f.root, "img-src/previous.png");
  fs.mkdirSync(path.dirname(image), { recursive: true }); fs.writeFileSync(image, "previous image");
  for (const assignments of [
    [{ qnum: "Q001", topic: "agent:unknown" }],
    [{ qnum: "Q001", topic: "tools:setup" }],
    [{ qnum: "Q001", topic: "agent:tools" }, { qnum: "Q001", topic: "agent:tools" }],
  ]) {
    fs.writeFileSync(mapping, JSON.stringify(assignments));
    assert.notEqual(f.run().status, 0);
    assert.equal(fs.readFileSync(f.output, "utf8"), generated);
    assert.equal(fs.readFileSync(image, "utf8"), "previous image");
  }
  fs.writeFileSync(mapping, "[]");
  assert.equal(f.run().status, 0);
  assert.equal(fs.readFileSync(f.output, "utf8"), generated.replace(/^topic: .+\n/m, ""));
});
