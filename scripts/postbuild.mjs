#!/usr/bin/env node
// 构建后处理（在 astro build 之后、pagefind 之前跑）：
//   1. 正文图片换成 WebP，并补 width/height（防布局偏移）+ 懒加载（首图不懒加载）
//   2. alt 兜底：把「image-20260917112313443」这种文件名式 alt 换成「文章标题 配图 N」
//   3. 给 sitemap 注入 lastmod（按文章 frontmatter 的 date，逐页取最新）
//
// 数据来源：public/img/.manifest.json（由 scripts/optimize-images.py 生成）

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const BASE = "/note";
const SITEMAP = path.join(DIST, "sitemap-0.xml");

// ---------------------------------------------------------------- 图片处理

const manifestPath = path.join(ROOT, "public", "img", ".manifest.json");
const manifest = fs.existsSync(manifestPath)
  ? JSON.parse(fs.readFileSync(manifestPath, "utf-8"))
  : {};

if (Object.keys(manifest).length === 0) {
  console.warn("  ⚠️  没找到 public/img/.manifest.json，跳过图片回写（先跑 npm run img:optimize）");
}

/** 把 img 的 src 还原成「不含 base、去 URL 编码」的站内路径，再查清单 */
function lookup(src) {
  if (!src.startsWith(BASE + "/img/") && !src.startsWith("/img/")) return null;
  let p = src.startsWith(BASE) ? src.slice(BASE.length) : src;
  try {
    p = decodeURIComponent(p);
  } catch {
    /* 保持原样 */
  }
  return manifest[p] || null;
}

// 「看起来像文件名」的 alt：image-20260917112313443 / ChatGPT Image xxx / 屏幕截图 之类
const BAD_ALT = /^(image|img|screenshot|chatgpt image|屏幕截图|截屏|未命名)[\s\S]*$/i;

function stripTags(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function rewriteImages(html) {
  const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const title = titleMatch ? stripTags(titleMatch[1]).slice(0, 40) : "";
  let index = 0;
  let changed = 0;

  const out = html.replace(/<img\b[^>]*>/g, (tag) => {
    const srcMatch = tag.match(/\bsrc="([^"]+)"/);
    if (!srcMatch) return tag;
    const hit = lookup(srcMatch[1]);
    if (!hit) return tag;

    index += 1;
    changed += 1;
    const isFirst = index === 1;

    let next = tag;
    const newSrc = encodeURI(BASE + hit.src);
    next = next.replace(/\bsrc="[^"]+"/, `src="${newSrc}"`);

    // 尺寸来自清单，避免图片加载前后跳版（CSS 里已配 height:auto，所以按原比例缩放）
    if (!/\bwidth="/.test(next)) next = next.replace(/<img\b/, `<img width="${hit.w}" height="${hit.h}"`);

    // 首图给高优先级（通常是 LCP 元素），其余懒加载
    if (isFirst) {
      if (!/\bloading="/.test(next)) next = next.replace(/<img\b/, '<img loading="eager" fetchpriority="high"');
    } else if (!/\bloading="/.test(next)) {
      next = next.replace(/<img\b/, '<img loading="lazy"');
    }
    if (!/\bdecoding="/.test(next)) next = next.replace(/<img\b/, '<img decoding="async"');

    // alt 兜底
    const altMatch = next.match(/\balt="([^"]*)"/);
    const alt = altMatch ? altMatch[1].trim() : "";
    if (title && (alt === "" || BAD_ALT.test(alt))) {
      const better = `${title} 配图${index}`;
      next = altMatch
        ? next.replace(/\balt="[^"]*"/, `alt="${better}"`)
        : next.replace(/<img\b/, `<img alt="${better}"`);
    }

    return next;
  });

  return { html: out, changed };
}

// ------------------------------------------------------------- sitemap lastmod

function collectDates() {
  const articlesDir = path.join(ROOT, "src", "content", "articles");
  const byUrl = new Map(); // 文章页 URL → 日期
  const byCategory = new Map(); // 分类页 URL → 最新日期
  const byModule = new Map(); // 模块页 URL → 最新日期
  let latest = "";

  if (!fs.existsSync(articlesDir)) return { byUrl, byCategory, byModule, latest };

  const MODULE_OF = {
    llm: "interview",
    rag: "interview",
    agent: "interview",
    engineering: "interview",
    "system-design": "interview",
    langchain: "interview",
    tools: "tutorial",
    "agent-ext": "tutorial",
    practice: "tutorial",
    reviews: "tutorial",
  };

  for (const category of fs.readdirSync(articlesDir)) {
    const catDir = path.join(articlesDir, category);
    if (!fs.statSync(catDir).isDirectory()) continue;

    for (const file of fs.readdirSync(catDir)) {
      if (!file.endsWith(".md")) continue;
      const raw = fs.readFileSync(path.join(catDir, file), "utf-8");
      const date = (raw.match(/^date:\s*(\d{4}-\d{2}-\d{2})/m) || [])[1];
      if (!date) continue;

      const slug = file.replace(/\.md$/, "");

      byUrl.set(`${BASE}/${category}/${slug}/`, date);
      const catUrl = `${BASE}/${category}/`;
      if (!byCategory.has(catUrl) || byCategory.get(catUrl) < date) byCategory.set(catUrl, date);

      const moduleUrl = `${BASE}/${MODULE_OF[category] === "tutorial" ? "tutorial" : "ai"}/`;
      if (!byModule.has(moduleUrl) || byModule.get(moduleUrl) < date) byModule.set(moduleUrl, date);

      if (!latest || latest < date) latest = date;
    }
  }
  return { byUrl, byCategory, byModule, latest };
}

function injectLastmod() {
  if (!fs.existsSync(SITEMAP)) return 0;
  const { byUrl, byCategory, byModule, latest } = collectDates();
  const today = new Date().toISOString().slice(0, 10);

  let count = 0;
  const xml = fs.readFileSync(SITEMAP, "utf-8").replace(
    /<url>\s*<loc>([^<]+)<\/loc>\s*<\/url>/g,
    (whole, loc) => {
      const url = loc.replace("https://lgdsunday.club", "");
      let date = byUrl.get(url) || byCategory.get(url) || byModule.get(url);
      if (!date && url === `${BASE}/`) date = latest || today;
      if (!date) date = today; // 其他页面（404 等）用构建日
      count += 1;
      return `<url><loc>${loc}</loc><lastmod>${date}</lastmod></url>`;
    }
  );

  fs.writeFileSync(SITEMAP, xml);
  return count;
}

// ------------------------------------------------------------------ 主流程

let imgChanged = 0;
let pages = 0;

if (fs.existsSync(DIST)) {
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!entry.name.endsWith(".html")) continue;
      const before = fs.readFileSync(full, "utf-8");
      const { html, changed } = rewriteImages(before);
      if (changed > 0) {
        fs.writeFileSync(full, html);
        pages += 1;
      }
      imgChanged += changed;
    }
  };
  walk(DIST);
}

const sitemapCount = injectLastmod();

console.log(
  `  构建后处理：${imgChanged} 张配图已换 WebP 并补尺寸/懒加载（涉及 ${pages} 个页面）；sitemap 注入 lastmod ${sitemapCount} 条`
);
