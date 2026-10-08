import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { parseArticle } from './lib/github-articles.mjs';
import { getInterviewCollections, questionTags, realQuestionsForArticle, validateInterviewSources } from '../src/lib/company-interviews.mjs';

const root = new URL('../', import.meta.url);
const read = file => fs.readFileSync(new URL(file, root), 'utf8');
const articles = fs.readdirSync(new URL('src/content/articles/', root), { recursive: true }).filter(file => file.endsWith('.md')).map(relative => ({
  ...parseArticle(read(`src/content/articles/${relative}`)), relative,
}));
validateInterviewSources(articles);
let sourced = 0;
for (const article of articles) {
  const html = read(`dist/${article.relative.replace(/\.md$/, '')}/index.html`);
  assert.equal([...html.matchAll(/<section\b[^>]*\bdata-real-question-section\b/g)].length, 1, `${article.qnum} 真题环节缺失或重复`);
  assert.ok(html.includes('href="#company-interview-questions"'), `${article.qnum} 目录没有真题入口`);
  const tags = questionTags(article.qnum);
  const nav = html.match(/<nav\b[^>]*class="company-tags"[^>]*>[\s\S]*?<\/nav>/)?.[0] ?? '';
  assert.equal([...nav.matchAll(/<a\b/g)].length, tags.length, `${article.qnum} 标签不一致`);
  if (tags.length) {
    sourced++;
    assert.ok(html.indexOf(nav) > html.indexOf('</h1>') && html.indexOf(nav) < html.indexOf('class="article-meta"'), `${article.qnum} 标签位置不在标题下`);
    for (const tag of tags) assert.ok(nav.includes(`href="${tag.href}"`) && nav.includes(tag.label), `${article.qnum} 标签或地址错误`);
    for (const match of realQuestionsForArticle(article.qnum)) assert.ok(html.includes(match.source.url) && html.includes(match.question), `${article.qnum} 来源或题意缺失`);
    assert.ok(!html.includes('data-real-question-empty'), `${article.qnum} 已收录来源却显示为空`);
  } else {
    assert.ok(html.includes('data-real-question-empty') && html.includes('暂未收录可核验'), `${article.qnum} 没有明确说明来源状态`);
  }
  assert.ok(!html.includes('相关面试考点') && !html.includes('article-companies'), `${article.qnum} 残留旧关联卡片`);
  const github = read(`articles/${article.relative}`);
  assert.equal([...github.matchAll(/^## 公司面试真题$/gm)].length, 1, `${article.qnum} GitHub 真题环节缺失或重复`);
  assert.ok(!github.includes('## 相关公司面试考点'), `${article.qnum} GitHub 残留旧附录`);
}

const collections = getInterviewCollections();
for (const view of collections) {
  const html = read(`dist${view.href}index.html`);
  const ids = [...html.matchAll(/data-company-question="([^\"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, new Set(ids).size, `${view.id} 列表重复文章`);
  assert.deepEqual([...ids].sort(), [...view.qnums].sort(), `${view.id} 列表收录范围错误`);
  assert.ok(html.includes(`rel="canonical" href="https://note.lgdsunday.club${view.href}"`), `${view.id} canonical 错误`);
  assert.ok(!html.includes('noindex'), `${view.id} 真题列表被禁止索引`);
  const github = read(`articles/companies/${view.company.id}-${view.role.id}.md`);
  for (const id of ids) {
    const article = articles.find(article => article.qnum === id);
    assert.ok(html.includes(`href="/${article.relative.replace(/\.md$/, '')}/"`), `${view.id} 正文入口缺失`);
    assert.ok(github.includes(`](../${article.relative})`), `${view.id} GitHub 正文入口缺失`);
  }
}
// GitHub 新增的相对目录链接需要在仓库内真实存在。
for (const relative of fs.readdirSync(new URL('articles/', root), { recursive: true }).filter(file => file.endsWith('.md'))) {
  const markdown = read(`articles/${relative}`);
  for (const [, target] of markdown.matchAll(/\]\(([^\s)]+)\)/g)) {
    if (/^(https?:|#)/.test(target)) continue;
    const file = path.resolve(fileURLToPath(new URL('articles/', root)), path.dirname(relative), decodeURI(target.split('#')[0]));
    assert.ok(fs.existsSync(file), `GitHub 内链不存在：${relative} → ${target}`);
  }
}
console.log(`公司真题检查通过：${articles.length} 篇文章均有真题环节；${sourced} 篇有来源标签；${collections.length} 个公司岗位列表无重复，网站与 GitHub 内链有效。`);
