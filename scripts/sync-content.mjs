#!/usr/bin/env node
// 发布同步脚本：把写作仓库的正文同步进站点
//
// 用法：npm run sync（= 正文同步 + 图片水印）
//
// 做四件事：
//   1. 按 scripts/sources.json 配置，读取各来源 {分类}/{编号-主题}/正文.md
//   2. 自动提取元数据：网站标题配置优先、H1 兜底；描述与 FAQ 答案；文件修改时间 → 日期
//   3. 改写图片路径（正文.assets/ → /img/{编号}/），并把图片拷贝到 public/img/
//   4. 生成带 frontmatter 的 Markdown 到 src/content/articles/{分类}/{编号}-{slug}.md
//
// 注意：已发布文章的 slug 必须保持稳定；更换地址时需要先安排永久重定向。
//      新增来源/分类：改 scripts/sources.json（分类 slug 需与 src/data/site.ts 的 CATEGORIES 一致）

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { validateArticleTopics } from "../src/lib/article-topics.mjs";
import { readSlugs, planURLs, assertProtected } from './article-url-policy.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "src", "content", "articles");
// 原图（打水印后的）先落到 img-src/，再由 optimize-images.py 压成 WebP 输出到 public/img/
const IMG_SRC_DIR = path.join(ROOT, "img-src");
const BASE = "";
const started = performance.now();

// 限定编号时保留其他已同步文章和配图，避免带入写作目录中的待审改稿。
const args = process.argv.slice(2);
if (args.length > 1 || (args.length && !args[0].startsWith("--only="))) {
  throw new Error("用法：node scripts/sync-content.mjs [--only=T002,Q005,Q028]");
}
const selected = args.length ? new Set(args[0].slice(7).split(",")) : null;
if (selected && [...selected].some((num) => !/^[QT]\d{3,}$/.test(num))) {
  throw new Error("--only 需要逗号分隔的原始文章编号，例如 T002,Q005,Q028");
}

const SOURCES = JSON.parse(
  fs.readFileSync(path.join(__dirname, "sources.json"), "utf-8")
).sources;

const TOPICS = JSON.parse(fs.readFileSync(path.join(ROOT, "src/data/topics.json"), "utf8"));
const TOPIC_ASSIGNMENTS = JSON.parse(fs.readFileSync(path.join(__dirname, "article-topics.json"), "utf8"));
const sourceArticles = new Map();
for (const source of SOURCES) {
  const root = path.resolve(ROOT, source.root);
  if (!fs.existsSync(root)) throw new Error(`找不到写作仓库，保留已有同步产物：${root}`);
  for (const [name, category] of Object.entries(source.categories)) {
    const directory = path.resolve(ROOT, source.root, name);
    if (!fs.existsSync(directory)) continue;
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const num = entry.name.match(/^([A-Z]\d+)/)?.[1];
      if (entry.isDirectory() && num && fs.existsSync(path.join(directory, entry.name, "正文.md"))) {
        if (sourceArticles.has(num)) throw new Error(`正文编号重复：${num}`);
        sourceArticles.set(num, category);
      }
    }
  }
}
const ARTICLE_TOPICS = validateArticleTopics(TOPICS, TOPIC_ASSIGNMENTS,
  SOURCES.flatMap((source) => Object.values(source.categories)), sourceArticles);
if (selected) {
  for (const num of selected) {
    if (!sourceArticles.has(num)) throw new Error(`限定同步的文章不存在：${num}`);
  }
}

// 使用写作仓库的固定编号，不使用网站按分类重排后的 Q/T 展示编号。
// 在清理产物之前校验，配置损坏时保留上一次同步结果。
const WEBSITE_TITLES = JSON.parse(
  fs.readFileSync(path.join(__dirname, "article-titles.json"), "utf-8")
);
if (!WEBSITE_TITLES || typeof WEBSITE_TITLES !== "object" || Array.isArray(WEBSITE_TITLES)) {
  throw new Error("article-titles.json 必须是文章编号到网站标题的对象");
}
const configuredTitles = new Set();
for (const [num, title] of Object.entries(WEBSITE_TITLES)) {
  if (!/^[QT]\d{3,}$/.test(num)) {
    throw new Error(`网站标题编号无效：${num}（请使用原始 Q001 / T001 等编号）`);
  }
  if (typeof title !== "string" || !title.trim() || title !== title.trim() || /[\r\n]/.test(title)) {
    throw new Error(`网站标题无效：${num}（需要无首尾空白的单行非空文本）`);
  }
  if (configuredTitles.has(title)) throw new Error(`网站标题重复：${title}`);
  configuredTitles.add(title);
}

// 有修订记录的页面显式保留原 datePublished，新克隆也不依赖旧生成目录。
const publicationPath = path.join(__dirname, "article-published-dates.json");
const WEBSITE_DATES = fs.existsSync(publicationPath)
  ? JSON.parse(fs.readFileSync(publicationPath, "utf8")) : {};
if (!WEBSITE_DATES || typeof WEBSITE_DATES !== "object" || Array.isArray(WEBSITE_DATES)) {
  throw new Error("article-published-dates.json 必须是文章编号到原页面日期的对象");
}
for (const [num, date] of Object.entries(WEBSITE_DATES)) {
  if (!/^[QT]\d{3,}$/.test(num) || typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)
    || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) {
    throw new Error(`原页面日期无效：${num}`);
  }
}

// 编号 → URL slug（英文关键词）。统一维护在 scripts/article-slugs.json，新增题目时补一条。
// 缺少 slug、变更已发布路径或删除已发布文章，必须在写入/清理正文和图片前失败。
const SLUGS = readSlugs(ROOT);
assertProtected(ROOT, planURLs(sourceArticles, SLUGS, selected), selected);

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
 * 单独读取手写 SEO 描述；描述、摘要、简介与学习成果保留旧回退顺序。
 *   - SEO 描述：xxx      ← 各模块均优先使用
 *   - 读完能掌握什么：xxx ← 教程类用它拼一句话
 */
function fromTopicCard(dir) {
  const cardPath = path.join(dir, "选题卡.md");
  if (!fs.existsSync(cardPath)) return { seo: "", fallback: "" };
  const card = fs.readFileSync(cardPath, "utf-8");

  const seo = cleanInline(card.match(/^[-*][ \t]*SEO[ \t]*描述[ \t]*[：:][ \t]*([^\r\n]*)$/m)?.[1] ?? "");

  const explicit = card.match(
    /^[-*][ \t]*(?:描述|摘要|简介)[ \t]*[：:][ \t]*([^\r\n]+)$/m
  );
  if (explicit) return { seo, fallback: cleanInline(explicit[1]) };

  const outcome = card.match(/^[-*]\s*读完能掌握什么\s*[：:]\s*(.+)$/m);
  if (outcome) {
    const value = cleanInline(outcome[1]).replace(/^(能够|可以|能)/, "");
    return { seo, fallback: `教你${value}` };
  }
  return { seo, fallback: "" };
}

function rewriteImages(md, num) {
  // Markdown 图片和正文中的 HTML <img src="..."> 都要改写。
  // 保留原稿不动，避免每次 --sync 又把 HTML 图片变回失效的相对路径。
  return md.replace(
    /(\(|\bsrc\s*=\s*["'])(?:\.\/)?(?:%E6%AD%A3%E6%96%87\.assets|正文\.assets)\//gi,
    `$1${BASE}/img/${num}/`
  );
}

// ---- 主流程 ----

function filesIn(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? filesIn(file) : entry.isFile() ? [file] : [];
  });
}

function writeChanged(file, content) {
  if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === content) return false;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(temporary, content);
    fs.renameSync(temporary, file);
  } finally {
    fs.rmSync(temporary, { force: true });
  }
  return true;
}

function watermarkEntries() {
  try {
    const cache = JSON.parse(fs.readFileSync(path.join(ROOT, '.cache/image-pipeline/watermark.json'), 'utf8'));
    return cache?.version === 1 && cache.entries && typeof cache.entries === 'object' && !Array.isArray(cache.entries)
      ? cache.entries : {};
  } catch { return {}; }
}

function syncImage(src, dst, cached) {
  const content = fs.readFileSync(src);
  const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
  const source = digest(content);
  if (fs.existsSync(dst)) {
    const output = digest(fs.readFileSync(dst));
    // 原图未变时保留经过核对的水印产物，不能再次用原图覆盖它。
    if (source === output || (cached?.source === source && cached?.output === output)) return false;
  }
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  const temporary = `${dst}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(temporary, content);
    fs.renameSync(temporary, dst);
  } finally {
    fs.rmSync(temporary, { force: true });
  }
  return true;
}

function main() {
  // 保留页面已经声明的原日期，正文修订时间另用 date，避免修订变成重新发布。
  const publishedDates = new Map(Object.entries(WEBSITE_DATES));
  if (fs.existsSync(OUT_DIR)) {
    for (const category of fs.readdirSync(OUT_DIR)) {
      const dir = path.join(OUT_DIR, category);
      if (!fs.statSync(dir).isDirectory()) continue;
      for (const file of fs.readdirSync(dir).filter((name) => name.endsWith('.md'))) {
        const existing = fs.readFileSync(path.join(dir, file), 'utf8').split('---')[1] ?? '';
        const num = existing.match(/^qnum:\s*"?([QT]\d+)"?\s*$/m)?.[1];
        const date = existing.match(/^publishedDate:\s*"?(\d{4}-\d{2}-\d{2})/m)?.[1]
          ?? existing.match(/^date:\s*"?(\d{4}-\d{2}-\d{2})/m)?.[1];
        if (num && date && !publishedDates.has(num)) publishedDates.set(num, date);
      }
    }
  }
  // 先生成期望清单，再写变化文件及清理删除项，不清空整棵目录。
  const articles = new Map();
  const images = new Map();

  let total = 0;
  let changedTitles = 0;
  const appliedTitles = new Set();

  for (const source of SOURCES) {
    const sourceRoot = path.resolve(ROOT, source.root);
    const label = source.label || source.module;

    if (!fs.existsSync(sourceRoot)) {
      throw new Error(`找不到写作仓库，保留已有同步产物：${label}（${sourceRoot}）`);
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
        if (selected && !selected.has(num)) continue;
        const src = path.join(catDir, entry.name, "正文.md");
        if (!fs.existsSync(src)) continue;

        const raw = fs.readFileSync(src, "utf-8");
        const sourceTitle = extractTitle(raw, entry.name);
        const title = WEBSITE_TITLES[num] ?? sourceTitle;
        if (WEBSITE_TITLES[num] !== undefined) appliedTitles.add(num);
        if (title !== sourceTitle) changedTitles++;
        const dir = path.join(catDir, entry.name);
        const answer = extractInterviewAnswer(raw);
        const card = fromTopicCard(dir);
        const isInterview = source.module === "interview" || source.module === "programmer";

        // 非空 SEO 描述优先；未配置时面试题用「面试速答」，教程用选题卡；
        // 都没有时退回正文里有信息量的前几句（自动跳过问候语）。
        const description = tidyText(
          trimAtBoundary(
            (card.seo || (isInterview
              ? answer || card.fallback || extractBodySummary(raw)
              : card.fallback || extractBodySummary(raw)
            )).trim() || sourceTitle,
            120
          )
        );
        const faqAnswer =
          isInterview && answer
            ? tidyText(answer).slice(0, 600)
            : undefined;
        const date = new Date(fs.statSync(src).mtime).toISOString().slice(0, 10);

        const fileStem = `${num.toLowerCase()}-${SLUGS[num]}`;

        const body = rewriteImages(stripH1(raw), num).replace(/^\s+/, "");

        const fm = [
          "---",
          `title: ${JSON.stringify(title)}`,
          `description: ${JSON.stringify(description)}`,
          `category: ${JSON.stringify(catSlug)}`,
          ...(ARTICLE_TOPICS.has(num) ? [`topic: ${JSON.stringify(ARTICLE_TOPICS.get(num))}`] : []),
          `module: ${JSON.stringify(source.module)}`,
          `qnum: ${JSON.stringify(num)}`,
          `date: ${date}`,
          `publishedDate: ${publishedDates.get(num) ?? date}`,
          ...(faqAnswer ? [`faqAnswer: ${JSON.stringify(faqAnswer)}`] : []),
          "---",
          "",
        ].join("\n");

        const outCatDir = path.join(OUT_DIR, catSlug);
        articles.set(path.join(outCatDir, `${fileStem}.md`), fm + body + "\n");

        // 拷贝图片（实验素材等子目录不处理，只拷贝 正文.assets）
        const assets = path.join(catDir, entry.name, "正文.assets");
        for (const file of filesIn(assets)) {
          images.set(path.join(IMG_SRC_DIR, num, path.relative(assets, file)), file);
        }

        count++;
        total++;
        console.log(`  [${label}] ${num} → /${catSlug}/${fileStem}/ ：${title}`);
      }
    }

    console.log(`  ${label}：${count} 篇\n`);
  }

  let written = 0, copied = 0, removed = 0;
  for (const [file, content] of articles) written += Number(writeChanged(file, content));
  const cached = watermarkEntries();
  for (const [dst, src] of images) {
    const key = path.relative(IMG_SRC_DIR, dst).split(path.sep).join('/');
    copied += Number(syncImage(src, dst, cached[key]));
  }
  for (const file of filesIn(OUT_DIR)) {
    if (!file.endsWith('.md') || articles.has(file)) continue;
    const num = fs.readFileSync(file, 'utf8').match(/^qnum:\s*"?([QT]\d+)"?\s*$/m)?.[1];
    if (!selected || selected.has(num)) { fs.unlinkSync(file); removed++; }
  }
  for (const file of filesIn(IMG_SRC_DIR)) {
    const num = path.relative(IMG_SRC_DIR, file).split(path.sep)[0];
    if (!images.has(file) && (!selected || selected.has(num))) { fs.unlinkSync(file); removed++; }
  }
  console.log(`完成：${total} 篇文章（更新 ${written}，复用 ${total-written}），图片复制 ${copied}、复用 ${images.size-copied}，清理 ${removed} 个旧文件；耗时 ${((performance.now()-started)/1000).toFixed(2)}s。`);
  console.log(`网站标题：${appliedTitles.size} 篇使用配置，其中 ${changedTitles} 篇与源稿标题不同；其余沿用源稿标题。`);
  for (const num of Object.keys(WEBSITE_TITLES)) {
    if (selected && !selected.has(num)) continue;
    if (!appliedTitles.has(num)) console.warn(`网站标题配置 ${num} 未匹配到源稿，请核对原始编号。`);
  }
  if (total === 0) console.warn("警告：没有同步到任何文章，请检查 sources.json 里的目录。");
}

main();
