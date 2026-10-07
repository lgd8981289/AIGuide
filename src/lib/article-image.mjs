// 取文章正文的第一张配图，用作 og:image 与 Article.image。
//
// 背景：379 篇文章原本共用一张 /og-cover.jpg。文章正文平均有 2.35 张专门画的示意图，
// 却完全没有进入结构化数据与社交分享——同一批读者在搜索结果、微信、掘金看到的缩略图
// 全都一样，无法区分内容，也拿不到 Google Discover 需要的「文章相关大图」。
//
// 数据来源：public/img/.manifest.json（由 scripts/optimize-images.py 生成），
// 记录了每张原图对应的 WebP 文件名与真实尺寸。构建顺序上 img:optimize 先于 astro build，
// 因此这里读到的清单一定是本次构建的产物。

import fs from "node:fs";
import path from "node:path";

/** Discover 大图与文章富结果的门槛：宽度 ≥ 1200px */
const MIN_WIDTH = 1200;

const MANIFEST_PATH = path.join(process.cwd(), "public", "img", ".manifest.json");

let cache;
function loadManifest() {
  if (cache !== undefined) return cache;
  try {
    cache = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));
  } catch {
    cache = {};
  }
  return cache;
}

// Markdown 图片：![alt](/img/xxx.png "可选标题")
const MARKDOWN_IMAGE = /!\[[^\]]*\]\(\s*([^)\s]+)(?:\s+"[^"]*")?\s*\)/;

/**
 * @param {string} body 文章 Markdown 正文（不含 frontmatter）
 * @returns {{ src: string, w: number, h: number } | null} 可直接用于 <meta> 的绝对路径
 */
export function resolveArticleImage(body) {
  if (!body) return null;

  const match = MARKDOWN_IMAGE.exec(body);
  if (!match) return null;

  let key = match[1];
  try {
    key = decodeURIComponent(key);
  } catch {
    /* 保持原样 */
  }

  const hit = loadManifest()[key];
  // 尺寸不达标就不换——宽高不满足要求时，搜索引擎反而拿不到大图，不如回落通用封面
  if (!hit || !hit.w || hit.w < MIN_WIDTH) return null;

  return { src: encodeURI(hit.src), w: hit.w, h: hit.h };
}
