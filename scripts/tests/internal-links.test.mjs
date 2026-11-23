import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import rehypeInternalLinks from "../../src/lib/rehype-internal-links.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const el = (tagName, children = [], properties = {}) => ({
  type: "element",
  tagName,
  properties,
  children,
});
const text = (value) => ({ type: "text", value });

function collectLinks(node, out = []) {
  if (!node) return out;
  if (node.type === "element" && node.tagName === "a") {
    out.push({
      href: node.properties?.href,
      text: (node.children ?? []).map((c) => c.value ?? "").join(""),
      className: node.properties?.className ?? [],
    });
  }
  for (const child of node.children ?? []) collectLinks(child, out);
  return out;
}

test("anchor 配置表里的每一个 qnum 都指向实际已同步文章", () => {
  const anchors = JSON.parse(
    fs.readFileSync(path.join(ROOT, "src/data/internal-link-anchors.json"), "utf8")
  );
  const articlesDir = path.join(ROOT, "src/content/articles");
  const qnums = new Set();
  for (const rel of fs.readdirSync(articlesDir, { recursive: true })) {
    if (!String(rel).endsWith(".md")) continue;
    const raw = fs.readFileSync(path.join(articlesDir, String(rel)), "utf8");
    const m = raw.match(/^qnum:\s*"?([QT]\d+)"?\s*$/m);
    if (m) qnums.add(m[1]);
  }
  assert.ok(anchors.length >= 90);
  for (const entry of anchors) {
    assert.ok(qnums.has(entry.qnum), `缺少文章 ${entry.qnum}（词条：${entry.term}）`);
  }
});

test("在 p/li 注入站内链接，跳过 code/pre/h2/blockquote/a，不自链且每篇最多 4 条", () => {
  const articlesByQnum = new Map([
    ["Q001", { qnum: "Q001", category: "agent", module: "interview", title: "Agent vs Workflow", url: "/agent/q001-agent-vs-workflow/" }],
    ["Q002", { qnum: "Q002", category: "agent", module: "interview", title: "Agent Loop", url: "/agent/q002-agent-loop/" }],
    ["Q004", { qnum: "Q004", category: "agent", module: "interview", title: "Tool Calling", url: "/agent/q004-tool-calling/" }],
    ["Q008", { qnum: "Q008", category: "agent", module: "interview", title: "MCP", url: "/agent/q008-mcp/" }],
    ["Q023", { qnum: "Q023", category: "rag", module: "interview", title: "混合检索", url: "/rag/q023-hybrid/" }],
    ["Q024", { qnum: "Q024", category: "rag", module: "interview", title: "Rerank", url: "/rag/q024-rerank/" }],
    ["Q104", { qnum: "Q104", category: "frontend", module: "programmer", title: "事件循环", url: "/frontend/q104-event-loop/" }],
  ]);
  const anchors = [
    { term: "Agent Loop", qnum: "Q002" },
    { term: "Tool Calling", qnum: "Q004" },
    { term: "MCP", qnum: "Q008", caseSensitive: true },
    { term: "混合检索", qnum: "Q023" },
    { term: "Rerank", qnum: "Q024" },
    { term: "事件循环", qnum: "Q104", categories: ["frontend"] },
  ];
  const plugin = rehypeInternalLinks({ articlesByQnum, anchors });

  const tree = el("root", [
    el("h2", [text("Agent Loop 与 Tool Calling")]),
    el("blockquote", [el("p", [text("面试官：Agent Loop 怎么走？")])]),
    el("p", [text("不能在 "), el("code", [text("Agent Loop")]), text(" 代码块外误链自己 Agent Loop？")]),
    el("p", [text("先走 "), el("a", [text("Tool Calling")], { href: "/custom" }), text(" 再看 MCP 协议。")]),
    el("p", [text("生产里常见 Tool Calling 与混合检索配合，")]),
    el("ul", [
      el("li", [text("用 Rerank 提升相关性")]),
      el("li", [text("再次出现 Tool Calling 不会重复建链")]),
      el("li", [text("后端文章提到事件循环不应跨界链到前端")]),
    ]),
    el("p", [text("最后还有 Agent Loop 作为第 4 条测试：Agent Loop。")]),
  ]);

  plugin(tree, { data: { astro: { frontmatter: { qnum: "Q002", category: "agent", module: "interview" } } } });
  const links = collectLinks(tree);
  assert.deepEqual(
    links.map((l) => l.href),
    ["/custom", "/agent/q008-mcp/", "/agent/q004-tool-calling/", "/rag/q024-rerank/", "/rag/q023-hybrid/"]
      .filter((href) => href === "/custom" || links.some((l) => l.href === href))
  );
  const injected = links.filter((l) => l.className.includes("prose-ilink"));
  assert.ok(injected.length <= 4);
  assert.ok(!injected.some((l) => l.href === "/agent/q002-agent-loop/"), "不应自链");
  assert.ok(!injected.some((l) => l.href === "/frontend/q104-event-loop/"), "不应跨分类错误链接");
  assert.equal(new Set(injected.map((l) => l.href)).size, injected.length, "同一目标只链一次");
});
