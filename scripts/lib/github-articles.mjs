import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { toMarkdown } from 'mdast-util-to-markdown';
import { gfmToMarkdown } from 'mdast-util-gfm';
import { BRAND } from '../../src/lib/brand.mjs';

export function parseArticle(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error('文章缺少同步元数据');
  const fields = {};
  for (const key of ['title', 'category', 'qnum', 'description']) {
    const value = match[1].match(new RegExp(`^${key}: (.+)$`, 'm'))?.[1];
    if (!value) throw new Error(`文章缺少 ${key}`);
    fields[key] = JSON.parse(value);
  }
  return { ...fields, body: match[2].trim() };
}

export function publicMarkdown(article, articlePath, manifest = {}) {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(article.body);
  function rewrite(value) {
    if (/^(?:file:|\/Users\/|\/home\/)/i.test(value)) throw new Error(`${article.qnum} 包含本机路径`);
    if (!value.startsWith('/') || value.startsWith('//')) return value;
    const key = decodeURI(value);
    if (key.startsWith('/img/') && !manifest[key]) throw new Error(`${article.qnum} 图片未优化：${key}`);
    return new URL(encodeURI(manifest[key]?.src ?? key), BRAND.url).href;
  }
  function visit(node) {
    if (typeof node.url === 'string') node.url = rewrite(node.url);
    if (node.type === 'html') {
      node.value = node.value.replace(/\b(src|href)=(['"])(.*?)\2/g, (_, attr, quote, value) => `${attr}=${quote}${rewrite(value)}${quote}`);
    }
    node.children?.forEach(visit);
  }
  visit(tree);
  const body = toMarkdown(tree, { extensions: [gfmToMarkdown()], bullet: '-', fences: true });
  return `# ${article.title}\n\n> 作者：${BRAND.author} · [${BRAND.name}](${BRAND.url}/)\n>\n> [在线阅读与配图](${BRAND.url}${articlePath}) · [题库目录](../../README.md)\n\n${body}\n---\n\n本文收录于 [${BRAND.name}](${BRAND.url}/)。转载请注明作者与原文链接。\n`;
}

// 只开放已登记发布的文章，课程集合不在输入范围内。
export function selectPublished(articles, published) {
  const seen = new Set();
  return articles.filter((article) => {
    if (seen.has(article.qnum)) throw new Error(`文章编号重复：${article.qnum}`);
    seen.add(article.qnum);
    if (!published[article.qnum]) return false;
    if (published[article.qnum] !== `/${article.relative.replace(/\.md$/, '')}/`) {
      throw new Error(`公开地址与登记不一致：${article.qnum}`);
    }
    return true;
  });
}
