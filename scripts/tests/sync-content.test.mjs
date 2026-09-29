import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const syncScript = fileURLToPath(new URL("../sync-content.mjs", import.meta.url));

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "aiguide-sync-test-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, "scripts"));
  fs.copyFileSync(syncScript, path.join(root, "scripts/sync-content.mjs"));
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
