import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { toMarkdown } from 'mdast-util-to-markdown';
import { gfmToMarkdown } from 'mdast-util-gfm';

const parser = unified().use(remarkParse).use(remarkGfm);
export const stringify = (tree) => toMarkdown(tree, { extensions: [gfmToMarkdown()] });
export const nodeText = (node) => node.value ?? node.alt ?? (node.children ?? []).map(nodeText).join('');
export const weight = (node) => node.type === 'image' ? 80
  : node.children ? node.children.reduce((sum, child) => sum + weight(child), 0)
  : [...(node.value ?? '')].length;

// 先解析再裁剪：代码块、列表、表格不会因字符串截断而破坏结构。
// 引用链接先展开，避免把位于付费部分的未使用定义带入公开文件。
export function parseLesson(markdown) {
  const tree = parser.parse(markdown);
  const definitions = new Map(tree.children.filter((n) => n.type === 'definition').map((n) => [n.identifier, n]));
  const firstHeading = tree.children.findIndex((n) => n.type === 'heading' && n.depth === 1);
  const title = firstHeading >= 0 ? nodeText(tree.children[firstHeading]) : '';
  if (firstHeading >= 0) tree.children.splice(firstHeading, 1);
  function normalize(parent) {
    parent.children = parent.children.flatMap((node) => {
      if (node.type === 'definition') return [];
      if (node.type === 'heading' && node.depth === 1) node.depth = 2;
      if (node.type === 'imageReference' || node.type === 'linkReference') {
        const def = definitions.get(node.identifier);
        if (!def) throw new Error(`无法解析引用链接: ${node.identifier}`);
        node.type = node.type === 'imageReference' ? 'image' : 'link';
        node.url = def.url;
        node.title = def.title;
      }
      if (node.type === 'html') {
        const src = node.value.match(/^<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*\/?\s*>$/i);
        if (src) {
          const image = { type: 'image', url: src[1], alt: node.value.match(/\balt=["']([^"']*)["']/i)?.[1] ?? '' };
          return [parent.type === 'root' ? { type: 'paragraph', children: [image] } : image];
        }
        if (/^<!--/.test(node.value)) return [];
        // 原稿中的其他 HTML 作为文字展示，禁止把脚本、嵌入页或隐藏正文带入站点。
        const literal = { type: 'inlineCode', value: node.value };
        return [parent.type === 'root' ? { type: 'paragraph', children: [literal] } : literal];
      }
      if (node.children) normalize(node);
      return [node];
    });
  }
  normalize(tree);
  return { title, tree };
}

export function previewTree(tree, ratio = 0.15) {
  const total = weight(tree);
  let remaining = Math.floor(total * ratio);
  function take(node) {
    const size = weight(node);
    if (remaining <= 0) return null;
    if (size <= remaining) { remaining -= size; return structuredClone(node); }
    if (node.type === 'image') { remaining = 0; return null; }
    if (node.children) {
      const children = [];
      for (const child of node.children) {
        const result = take(child);
        if (result) children.push(result);
        if (remaining <= 0) break;
      }
      return children.length ? { ...node, children } : null;
    }
    let value = [...(node.value ?? '')].slice(0, remaining).join('');
    // 尽量停在完整句子或代码行，最多向前退 12%，不越过预算。
    const stops = node.type === 'code' ? /\n/g : /[。！？；\n]/g;
    const end = [...value.matchAll(stops)].at(-1)?.index;
    if (end !== undefined && end >= value.length * 0.88) value = value.slice(0, end + 1);
    remaining = 0;
    return value.trim() ? { ...node, value: value.trimEnd() } : null;
  }
  const preview = take(tree) ?? { type: 'root', children: [] };
  // 标题不独自悬挂在付费卡片前。
  while (preview.children.at(-1)?.type === 'heading') preview.children.pop();
  return { tree: preview, ratio: total ? weight(preview) / total : 0 };
}
