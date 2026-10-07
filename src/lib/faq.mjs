// 从文章正文里抽取「面试官继续追问」板块的问答对，用于生成 FAQPage 结构化数据。
//
// 设计取舍：
// - 只认二级标题「面试官继续追问」这一块，其余板块（面试速答 / 知识点详解 / 面试速记卡）不参与，
//   避免把整篇文章变成 FAQ。
// - 答案文本必须与页面上可见的文字一致，因此只做「去掉 Markdown 标记」的清洗，
//   不重写、不概括、不补充——搜索引擎会拿它和渲染后的正文比对。
// - 拿不到这一块时返回空数组，调用方据此决定是否输出 FAQPage 节点。

/** 去掉 Markdown 标记，得到与页面正文一致的纯文本 */
function toPlainText(markdown) {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")        // 图片
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")      // 链接 → 锚文本
    .replace(/^\s*>\s?/gm, "")                    // 引用块标记
    .replace(/^\s*([-*+]|\d+\.)\s+/gm, "")        // 列表标记
    .replace(/`{1,3}/g, "")                       // 行内代码 / 代码块围栏
    .replace(/\*\*([^*]+)\*\*/g, "$1")            // 粗体
    .replace(/\*([^*]+)\*/g, "$1")                // 斜体
    .replace(/~~([^~]+)~~/g, "$1")                // 删除线
    .replace(/^\s*#{1,6}\s+/gm, "")               // 残留标题标记
    .replace(/\s+/g, " ")
    .trim();
}

const FOLLOWUP_HEADING = /^##\s+.*面试官继续追问.*$/m;

/**
 * @param {string} body 文章 Markdown 正文（不含 frontmatter）
 * @returns {{ q: string, a: string }[]}
 */
export function extractFaqPairs(body) {
  if (!body) return [];

  const headingMatch = FOLLOWUP_HEADING.exec(body);
  if (!headingMatch) return [];

  const rest = body.slice(headingMatch.index + headingMatch[0].length);
  // 到下一个二级标题为止
  const nextH2 = /^##\s+/m.exec(rest);
  const section = nextH2 ? rest.slice(0, nextH2.index) : rest;

  const pairs = [];
  // 按三级标题切块：第一段是问句，其余是答案
  const blocks = section.split(/^###\s+/m).slice(1);

  for (const block of blocks) {
    const newline = block.indexOf("\n");
    if (newline < 0) continue;
    const question = toPlainText(block.slice(0, newline));
    const answer = toPlainText(block.slice(newline + 1));
    if (question && answer) pairs.push({ q: question, a: answer });
  }

  return pairs;
}
