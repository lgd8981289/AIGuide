import fs from 'node:fs';
import { parseArticle } from './lib/github-articles.mjs';
import { getInterviewCoverage } from '../src/lib/company-interviews.mjs';

const args = process.argv.slice(2);
if (args.some(arg => !['--json', '--unmatched'].includes(arg))) {
  throw new Error('用法：node scripts/report-company-coverage.mjs [--json] [--unmatched]');
}
const directory = new URL('../src/content/articles/', import.meta.url);
const articles = fs.readdirSync(directory, { recursive: true }).filter(file => file.endsWith('.md'))
  .map(file => parseArticle(fs.readFileSync(new URL(file, directory), 'utf8')));
const report = getInterviewCoverage(articles);
if (args.includes('--json')) {
  console.log(JSON.stringify(report, null, 2));
} else {
  const ratio = report.articleCount ? (report.matchedArticleCount / report.articleCount * 100).toFixed(1) : '0.0';
  console.log(`公司真题覆盖：${report.matchedArticleCount}/${report.articleCount} 篇面试题（${ratio}%），${report.questionSourceCount} 条文章与来源关系；${report.sourceCount} 篇面经（${report.sourceRecordCount} 份公司岗位记录），${report.companyCount} 家公司，${report.roleCollectionCount} 个岗位列表。`);
  for (const group of report.categories) console.log(`  ${group.category}: ${group.matchedArticleCount}/${group.articleCount}`);
  console.log(`未匹配 ${report.unmatched.length} 篇；以下按题号倒序列出${args.includes('--unmatched') ? '全部' : '最新 12 篇'}待核验文章：`);
  for (const article of args.includes('--unmatched') ? report.unmatched : report.unmatched.slice(0, 12)) {
    console.log(`  ${article.qnum} ${article.title}`);
  }
  console.log('未匹配不代表公司没有问过；需找到并阅读具体面经后再补录。');
}
