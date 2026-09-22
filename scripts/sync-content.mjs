#!/usr/bin/env node
// 发布同步脚本：把写作仓库（../文章）的正文同步进站点
//
// 用法：npm run sync
//
// 做四件事：
//   1. 从 文章/{分类}/{Q编号}-{主题}/正文.md 读取文章
//   2. 自动提取元数据：H1 → 标题；「面试速答」段落 → 描述与 FAQ 答案；文件修改时间 → 日期
//   3. 改写图片路径（正文.assets/ → /note/img/{题号}/），并把图片拷贝到 public/img/
//   4. 生成带 frontmatter 的 Markdown 到 src/content/articles/{分类}/{题号}-{slug}.md
//
// 注意：新增题目时在下方 SLUGS 里补一行英文 slug（URL 里带关键词，对 SEO 有利）
//      分类映射如调整，需同步修改 src/data/site.ts

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MANUAL_DIR = path.resolve(ROOT, "..", "文章");
const OUT_DIR = path.join(ROOT, "src", "content", "articles");
const IMG_DIR = path.join(ROOT, "public", "img");
const BASE = "/note";

// 写作仓库分类目录名 → URL slug（与 src/data/site.ts 的 CATEGORIES 保持一致）
const CATEGORIES = {
  大模型基础面试题: "llm",
  RAG面试题: "rag",
  Agent面试题: "agent",
  AI应用工程面试题: "engineering",
  AI项目与系统设计面试题: "system-design",
  LangChain生态面试题: "langchain",
};

// 题号 → URL slug（英文关键词，新增题目时补一行）
const SLUGS = {
  Q001: "agent-vs-workflow",
  Q002: "agent-loop",
  Q003: "langgraph-pause-resume",
};

// ---- 提取逻辑 ----

function extractTitle(md, fallback) {
  const m = md.match(/^#\s+(.+)$/m);
  if (!m) return fallback;
  // 去掉「｜Agent 面试题」这类分类后缀
  return m[1].split("｜")[0].trim();
}

function extractAnswer(md) {
  // 「面试速答」小节到下一个二级标题之间的文本
  const m = md.match(/^##\s*面试速答[^\n]*\n([\s\S]*?)(?=^##\s)/m);
  if (!m) return "";
  return m[1]
    .split("\n")
    .map((l) => l.trim().replace(/^[-*]\s+/, ""))
    .filter((l) => l && !l.startsWith("!["))
    .join(" ")
    .replace(/[*`>#]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripH1(md) {
  return md.replace(/^#\s+.+\n/, "");
}

function rewriteImages(md, qnum) {
  // 兼容 URL 编码（%E6%AD%A3%E6%96%87 = 正文）与中文原文两种引用形态
  return md.replace(
    /\((?:%E6%AD%A3%E6%96%87\.assets|正文\.assets)\//g,
    `(${BASE}/img/${qnum}/`
  );
}

// ---- 主流程 ----

function main() {
  if (!fs.existsSync(MANUAL_DIR)) {
    console.error(`错误：找不到写作仓库目录 ${MANUAL_DIR}`);
    process.exit(1);
  }

  // 幂等：先清空旧产物
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.rmSync(IMG_DIR, { recursive: true, force: true });

  let total = 0;

  for (const [catName, catSlug] of Object.entries(CATEGORIES)) {
    const catDir = path.join(MANUAL_DIR, catName);
    if (!fs.existsSync(catDir)) continue;

    for (const entry of fs.readdirSync(catDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const qm = entry.name.match(/^(Q\d+)/);
      if (!qm) continue;

      const qnum = qm[1];
      const src = path.join(catDir, entry.name, "正文.md");
      if (!fs.existsSync(src)) continue;

      const raw = fs.readFileSync(src, "utf-8");
      const title = extractTitle(raw, entry.name);
      const answer = extractAnswer(raw);
      const description =
        answer.slice(0, 120) + (answer.length > 120 ? "……" : "");
      const faqAnswer = answer.slice(0, 600) || undefined;
      const date = new Date(fs.statSync(src).mtime).toISOString().slice(0, 10);

      let fileStem = qnum.toLowerCase();
      if (SLUGS[qnum]) {
        fileStem = `${qnum.toLowerCase()}-${SLUGS[qnum]}`;
      } else {
        console.warn(
          `  提示：${qnum} 未配置英文 slug，URL 将是 /${catSlug}/${fileStem}/（建议在 scripts/sync-content.mjs 的 SLUGS 中补充，URL 带关键词更利于 SEO）`
        );
      }

      let body = rewriteImages(stripH1(raw), qnum).replace(/^\s+/, "");

      const fm = [
        "---",
        `title: ${JSON.stringify(title)}`,
        `description: ${JSON.stringify(description)}`,
        `category: ${JSON.stringify(catSlug)}`,
        `qnum: ${JSON.stringify(qnum)}`,
        `date: ${date}`,
        ...(faqAnswer ? [`faqAnswer: ${JSON.stringify(faqAnswer)}`] : []),
        "---",
        "",
      ].join("\n");

      const outCatDir = path.join(OUT_DIR, catSlug);
      fs.mkdirSync(outCatDir, { recursive: true });
      fs.writeFileSync(path.join(outCatDir, `${fileStem}.md`), fm + body + "\n");

      // 拷贝图片
      const assets = path.join(catDir, entry.name, "正文.assets");
      if (fs.existsSync(assets)) {
        fs.cpSync(assets, path.join(IMG_DIR, qnum), { recursive: true });
      }

      total++;
      console.log(`  同步 ${qnum} → /${catSlug}/${fileStem}/ ：${title}`);
    }
  }

  console.log(`\n完成：共同步 ${total} 篇文章。`);
  if (total === 0) console.warn("警告：没有同步到任何文章，请检查 ../文章 目录。");
}

main();
