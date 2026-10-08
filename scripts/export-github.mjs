#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArticle, publicMarkdown, selectPublished } from './lib/github-articles.mjs';
import { BRAND } from '../src/lib/brand.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(root, 'src/content/articles');
const output = path.join(root, 'articles');
const readJSON = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const published = readJSON('scripts/article-published-urls.json').articles;
const manifest = readJSON('public/img/.manifest.json');
const categories = readJSON('scripts/sources.json').sources.flatMap((source) =>
  Object.entries(source.categories).map(([name, slug]) => ({ name: name.replace(/^\d+-/, ''), slug })));
const articles = fs.readdirSync(source, { recursive: true }).filter((file) => file.endsWith('.md')).map((relative) => ({
  ...parseArticle(fs.readFileSync(path.join(source, relative), 'utf8')), relative,
}));
const selected = selectPublished(articles, published).sort((a, b) => a.qnum.localeCompare(b.qnum));
if (!selected.length) throw new Error('没有可导出的已发布文章，保留原目录');
if (selected.length !== Object.keys(published).length) throw new Error('已发布文章未全部同步，保留原目录');

// 先生成全部文件并校验，再落盘；重复执行只写实际变化。
const files = new Map(selected.map((article) => [article.relative, publicMarkdown(article, published[article.qnum], manifest)]));
let readme = `# ${BRAND.name} · AI 与全栈面试题\n\n` +
  `**${selected.length} 篇完整文章**，由 **${BRAND.author}** 整理，覆盖大模型、Agent、RAG、JavaScript、Vue、React、后端、MySQL、Redis、计算机基础和系统设计。每道题讲清原理、工程取舍与面试追问，适合校招、实习与社招复习。\n\n` +
  `📖 [在线阅读 ${BRAND.name}](${BRAND.url}/) · [GitHub 正文目录](articles/)\n\n` +
  `你也可以通过 **sunday面试指南**、**程序员Sunday** 找到本站。建议先按岗位选路线，再按具体问题查阅。\n\n` +
  `## 校招与公司备考\n\n` +
  `| 复习目标 | 阅读入口 |\n| --- | --- |\n` +
  `| 校招、实习与秋招基础 | [校招面试题准备路线](${BRAND.url}/guides/campus-interview/) |\n` +
  `| 字节跳动开发岗位 | [字节面试题备考](${BRAND.url}/guides/bytedance-interview/) |\n` +
  `| 百度校招开发岗位 | [百度校招面试题备考](${BRAND.url}/guides/baidu-campus-interview/) |\n` +
  `| 百度前端开发岗位 | [百度前端面试题备考](${BRAND.url}/guides/baidu-frontend-interview/) |\n` +
  `| 阿里巴巴后端开发岗位 | [阿里后端面试题备考](${BRAND.url}/guides/alibaba-backend-interview/) |\n\n` +
  `公司专题按岗位能力整理通用技术题，未标注可核验面经来源的内容不代表该公司的实际考题或官方题库。\n\n` +
  `## 分类目录\n\n| 分类 | 篇数 | GitHub 阅读 | 在线阅读 |\n| --- | ---: | --- | --- |\n`;
for (const { name, slug } of categories) {
  const group = selected.filter((article) => article.category === slug);
  if (!group.length) continue;
  readme += `| ${name} | ${group.length} | [正文目录](articles/${slug}/README.md) | [网站专题](${BRAND.url}/${slug}/) |\n`;
  let directory = `# ${name} · ${BRAND.name}\n\n[返回总目录](../../README.md) · [在线阅读](${BRAND.url}/${slug}/)\n\n`;
  for (const article of group) directory += `- [${article.title}](./${path.basename(article.relative)}) · [在线阅读](${BRAND.url}${published[article.qnum]})\n`;
  files.set(`${slug}/README.md`, directory);
}
readme += '\n## 全部文章\n\n';
for (const { name, slug } of categories) {
  const group = selected.filter((article) => article.category === slug);
  if (!group.length) continue;
  readme += `### ${name}\n\n`;
  for (const article of group) readme += `- [${article.title}](articles/${article.relative}) · [在线阅读](${BRAND.url}${published[article.qnum]})\n`;
  readme += '\n';
}
readme += `## 使用与维护\n\n文章在 GitHub 可直接阅读，配图引用网站公开图片。课程不在本仓库文章导出范围内。内容版权归原作者，转载请保留署名与原文链接；本次未新增开源许可。\n\n维护者完成网站发布并核验后，运行 \`npm run export:github\` 更新正文和目录，再检查 Git 差异并提交。导出仅接受已发布网址登记表中的文章，保留稳定地址。\n\n[网站开发与维护说明](CONTRIBUTING.md)\n`;
files.set('README.md', `# ${BRAND.name} 正文\n\n[按分类和题目浏览](../README.md)\n`);
function writeChanged(file, content) {
  if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === content) return;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}
// 导出目录由脚本管理；失去发布登记的旧文件需要人工确认，不能静默留在公开目录。
const stale = fs.existsSync(output) ? fs.readdirSync(output, { recursive: true }).filter((file) => file.endsWith('.md') && !files.has(file)) : [];
if (stale.length) throw new Error(`导出目录有未登记的旧文件，请人工核对：${stale.join(', ')}`);
for (const [relative, content] of files) writeChanged(path.join(output, relative), content);
writeChanged(path.join(root, 'README.md'), readme);
console.log(`GitHub 导出完成：${selected.length} 篇正文，${files.size - selected.length - 1} 个分类目录；图片使用线上公开地址。`);
