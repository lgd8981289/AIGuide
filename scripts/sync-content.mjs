#!/usr/bin/env node
// 发布同步脚本：把写作仓库的正文同步进站点
//
// 用法：npm run sync（= 正文同步 + 图片水印）
//
// 做四件事：
//   1. 按 scripts/sources.json 配置，读取各来源 {分类}/{编号-主题}/正文.md
//   2. 自动提取元数据：H1 → 标题；描述与 FAQ 答案；文件修改时间 → 日期
//   3. 改写图片路径（正文.assets/ → /note/img/{编号}/），并把图片拷贝到 public/img/
//   4. 生成带 frontmatter 的 Markdown 到 src/content/articles/{分类}/{编号}-{slug}.md
//
// 注意：新增题目时在下方 SLUGS 里补一行英文 slug（URL 里带关键词，对 SEO 有利）
//      新增来源/分类：改 scripts/sources.json（分类 slug 需与 src/data/site.ts 的 CATEGORIES 一致）

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "src", "content", "articles");
const IMG_DIR = path.join(ROOT, "public", "img");
const BASE = "/note";

const SOURCES = JSON.parse(
  fs.readFileSync(path.join(__dirname, "sources.json"), "utf-8")
).sources;

// 编号 → URL slug（英文关键词，新增题目时补一行）
const SLUGS = {
  // AI 面试题
  Q001: "agent-vs-workflow",
  Q002: "agent-loop",
  Q003: "langgraph-pause-resume",
  // AI 编程教程
  T001: "claude-code-deepseek",
  T002: "codex-mcp-playwright",
  T003: "chrome-devtools-mcp",
  T004: "workbuddy-guide",
  T005: "context-engineering",
  T006: "github-ai-rewrite",
  T007: "jev-review",
};

// ---- 提取逻辑 ----

function extractTitle(md, fallback) {
  const m = md.match(/^#\s+(.+)$/m);
  if (!m) return fallback;
  // 去掉「｜Agent 面试题」这类分类后缀
  return m[1].split("｜")[0].trim();
}

function cleanInline(text) {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // 图片
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // 链接保留文字
    .replace(/[*`>#]/g, " ")
    .replace(/^[-*]\s+/, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** 元数据里的标点/空格收尾：多行拼接后常留下「。 Workflow」这类空隙，中文之间不该有空格 */
function tidyText(text) {
  return text
    .replace(/\s+/g, " ")
    .replace(/\s+([，。、！？；：）】」》’”])/g, "$1")
    .replace(/([，。、！？；：）】」》’”])\s+/g, "$1")
    .replace(/([（【「《‘“])\s+/g, "$1")
    .replace(
      /([\u3000-\u303f\u4e00-\u9fa5\uff01-\uff60])\s+(?=[\u3000-\u303f\u4e00-\u9fa5\uff01-\uff60])/g,
      "$1"
    )
    .trim();
}

function stripH1(md) {
  return md.replace(/^#\s+.+\n/, "");
}

/** 面试题：优先用「面试速答」小节 */
function extractInterviewAnswer(md) {
  const m = md.match(/^##\s*面试速答[^\n]*\n([\s\S]*?)(?=^##\s)/m);
  if (!m) return "";
  return m[1]
    .split("\n")
    .map((l) => cleanInline(l))
    .filter((l) => l)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

// 开头常见的问候 / 口水句，不该进 meta description
const FILLER_PATTERNS = [
  /^(大家|各位|哈喽|嗨|你好|hi|hello)/i,
  /我是\s*Sunday/i,
  /^(ok|好的|那|那么|接下来|下面)\s*[，,]?\s*(咱们|我们)?\s*(直接)?(开始|来看|进入|说)/i,
  /^(这段时间|最近|前两天|昨天|今天)/,
  /(哈哈|嘿嘿|哦哦|～～)/,
];

function looksLikeFiller(text) {
  if (FILLER_PATTERNS.some((re) => re.test(text))) return true;
  if (text.length < 14) return true; // 短句多是口语感慨，信息量低
  if (/^[^，。！？；：]{0,10}[。！？~～]{1,3}$/.test(text)) return true;
  return false;
}

/** 在句末标点处截断，避免描述被切在半句中间 */
function trimAtBoundary(text, limit) {
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit);
  const lastStop = Math.max(
    cut.lastIndexOf("。"),
    cut.lastIndexOf("！"),
    cut.lastIndexOf("？"),
    cut.lastIndexOf("；")
  );
  return lastStop >= limit * 0.5 ? cut.slice(0, lastStop + 1) : `${cut}……`;
}

/** 兜底：取正文里第一批有信息量的句子（跳过标题、图片、引用、列表与问候语） */
function extractBodySummary(md) {
  const picked = [];
  for (const raw of stripH1(md).split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (/^[#>|`\-*!]/.test(line)) continue;
    const text = cleanInline(line);
    if (!text || looksLikeFiller(text)) continue;
    picked.push(text);
    if (picked.join("").length >= 160) break;
  }
  return picked.join("");
}

/**
 * 选题卡里的描述（优先级最高，作者手写的最准）
 *   - 描述：xxx          ← 显式指定（可选，加在选题卡任意位置）
 *   - 读完能掌握什么：xxx ← 教程类用它拼一句话
 */
function fromTopicCard(dir) {
  const cardPath = path.join(dir, "选题卡.md");
  if (!fs.existsSync(cardPath)) return "";
  const card = fs.readFileSync(cardPath, "utf-8");

  const explicit = card.match(
    /^[-*]\s*(?:SEO\s*描述|描述|摘要|简介)\s*[：:]\s*(.+)$/m
  );
  if (explicit) return cleanInline(explicit[1]);

  const outcome = card.match(/^[-*]\s*读完能掌握什么\s*[：:]\s*(.+)$/m);
  if (outcome) {
    const value = cleanInline(outcome[1]).replace(/^(能够|可以|能)/, "");
    return `教你${value}`;
  }
  return "";
}

function rewriteImages(md, num) {
  // 兼容 URL 编码（%E6%AD%A3%E6%96%87 = 正文）与中文原文两种引用形态
  return md.replace(
    /\((?:%E6%AD%A3%E6%96%87\.assets|正文\.assets)\//g,
    `(${BASE}/img/${num}/`
  );
}

// ---- 主流程 ----

function main() {
  // 幂等：先清空旧产物
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.rmSync(IMG_DIR, { recursive: true, force: true });

  let total = 0;

  for (const source of SOURCES) {
    const sourceRoot = path.resolve(ROOT, source.root);
    const label = source.label || source.module;

    if (!fs.existsSync(sourceRoot)) {
      console.warn(`  跳过「${label}」：找不到目录 ${sourceRoot}`);
      continue;
    }

    let count = 0;

    for (const [catName, catSlug] of Object.entries(source.categories)) {
      const catDir = path.join(sourceRoot, catName);
      if (!fs.existsSync(catDir)) continue;

      for (const entry of fs.readdirSync(catDir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const nm = entry.name.match(/^([A-Z]\d+)/);
        if (!nm) continue;

        const num = nm[1];
        const src = path.join(catDir, entry.name, "正文.md");
        if (!fs.existsSync(src)) continue;

        const raw = fs.readFileSync(src, "utf-8");
        const title = extractTitle(raw, entry.name);
        const dir = path.join(catDir, entry.name);
        const answer = extractInterviewAnswer(raw);
        const cardText = fromTopicCard(dir);

        // 描述优先级：面试题用「面试速答」；教程用选题卡（描述 → 读完能掌握什么）；
        // 都没有时退回正文里有信息量的前几句（自动跳过问候语）
        const description = tidyText(
          trimAtBoundary(
            (source.module === "interview"
              ? answer || cardText || extractBodySummary(raw)
              : cardText || extractBodySummary(raw)
            ).trim() || title,
            120
          )
        );
        const faqAnswer =
          source.module === "interview" && answer
            ? tidyText(answer).slice(0, 600)
            : undefined;
        const date = new Date(fs.statSync(src).mtime).toISOString().slice(0, 10);

        let fileStem = num.toLowerCase();
        if (SLUGS[num]) {
          fileStem = `${num.toLowerCase()}-${SLUGS[num]}`;
        } else {
          console.warn(
            `  提示：${num} 未配置英文 slug，URL 将是 /${catSlug}/${fileStem}/（建议在 scripts/sync-content.mjs 的 SLUGS 中补充）`
          );
        }

        const body = rewriteImages(stripH1(raw), num).replace(/^\s+/, "");

        const fm = [
          "---",
          `title: ${JSON.stringify(title)}`,
          `description: ${JSON.stringify(description)}`,
          `category: ${JSON.stringify(catSlug)}`,
          `module: ${JSON.stringify(source.module)}`,
          `qnum: ${JSON.stringify(num)}`,
          `date: ${date}`,
          ...(faqAnswer ? [`faqAnswer: ${JSON.stringify(faqAnswer)}`] : []),
          "---",
          "",
        ].join("\n");

        const outCatDir = path.join(OUT_DIR, catSlug);
        fs.mkdirSync(outCatDir, { recursive: true });
        fs.writeFileSync(path.join(outCatDir, `${fileStem}.md`), fm + body + "\n");

        // 拷贝图片（实验素材等子目录不处理，只拷贝 正文.assets）
        const assets = path.join(catDir, entry.name, "正文.assets");
        if (fs.existsSync(assets)) {
          fs.cpSync(assets, path.join(IMG_DIR, num), { recursive: true });
        }

        count++;
        total++;
        console.log(`  [${label}] ${num} → /${catSlug}/${fileStem}/ ：${title}`);
      }
    }

    console.log(`  ${label}：${count} 篇\n`);
  }

  console.log(`完成：共同步 ${total} 篇文章。`);
  if (total === 0) console.warn("警告：没有同步到任何文章，请检查 sources.json 里的目录。");
}

main();
