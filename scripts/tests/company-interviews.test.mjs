import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { INTERVIEW_SOURCES } from '../../src/data/company-interviews.mjs';
import { realQuestionsForArticle, questionTags, getInterviewCollections, getInterviewCoverage, interviewDescription, companyMarkdown, validateInterviewSources } from '../../src/lib/company-interviews.mjs';
import { publicMarkdown } from '../lib/github-articles.mjs';

test('面经只关联已发布文章，缺失文章阻止导出', () => {
  const published = JSON.parse(fs.readFileSync(new URL('../article-published-urls.json', import.meta.url))).articles;
  validateInterviewSources(Object.keys(published).map(qnum => ({ qnum })));
  assert.throws(() => validateInterviewSources([{ qnum: 'Q104' }]), /无效面经关联/);
});

test('延伸内容永远不进入真题标签、列表、描述和导出', () => {
  const source = INTERVIEW_SOURCES.find(s => s.id === 'meituan-development');
  assert.deepEqual(realQuestionsForArticle('Q060', [source]), []);
  assert.deepEqual(questionTags('Q060', [source]), []);
  assert.ok(!getInterviewCollections([source])[0].qnums.includes('Q060'));
  assert.equal(interviewDescription('描述', [{ relation: 'related' }]), '描述');
  assert.ok(!companyMarkdown('Q060').includes(source.url));
  assert.ok(INTERVIEW_SOURCES.find(s => s.id === 'netease-youdao').dateLabel.includes('面试年份未明确'));
});

test('相同公司岗位的多个来源只生成一个标签，列表文章去重', () => {
  const byte = questionTags('Q104').filter(t => t.company === 'bytedance');
  assert.equal(byte.length, 1);
  assert.equal(byte[0].label, '字节前端面试真题');
  assert.equal(byte[0].href, '/companies/bytedance/frontend/');
  for (const view of getInterviewCollections()) assert.equal(view.qnums.length, new Set(view.qnums).size);
  assert.equal(getInterviewCollections().find(v => v.id === 'bytedance/frontend').qnums.filter(n => n === 'Q104').length, 1);
});

test('缺少题意、岗位或核验日期时拒绝将来源登记为真题', () => {
  const source = INTERVIEW_SOURCES[0];
  const articles = source.topics.map(t => ({ qnum: t.qnum }));
  for (const changes of [{ roleKey: 'unknown' }, { reviewedAt: '' }, { topics: [{ ...source.topics[0], question: '' }] }]) {
    assert.throws(() => validateInterviewSources(articles, [{ ...source, ...changes }]));
  }
  assert.throws(() => validateInterviewSources(articles, [source, source]), /无效面经来源/);
});

test('所有文章都有真题环节，未核验文章使用明确空状态', () => {
  assert.match(companyMarkdown('Q999999'), /公司面试真题[\s\S]*暂未收录可核验/);
  assert.doesNotMatch(companyMarkdown('Q999999'), /字节|百度|阿里/);
  const result = publicMarkdown({ qnum: 'Q104', title: '事件循环', body: '正文不能丢失。' }, '/frontend/test/');
  assert.match(result, /^# 事件循环\n\n\[字节前端面试真题\]/);
  assert.match(result, /正文不能丢失。[\s\S]*公司面试真题[\s\S]*字节跳动[\s\S]*面经来源/);
  assert.doesNotMatch(result, /相关公司面试考点/);
});

test('覆盖统计排除教程和延伸阅读，待核验新文章按题号倒序排列', () => {
  const source = { ...INTERVIEW_SOURCES[0], topics: [
    { qnum: 'Q104', topic: '事件循环', relation: 'mentioned', question: '怎样决定执行顺序？' },
    { qnum: 'Q060', topic: '延伸阅读', relation: 'related' },
  ] };
  const report = getInterviewCoverage([
    { qnum: 'Q104', category: 'frontend', title: '事件循环' },
    { qnum: 'Q060', category: 'agent', title: '长期记忆' },
    { qnum: 'Q495', category: 'cs-basics', title: '权限' },
    { qnum: 'T001', category: 'tools', title: '教程' },
  ], [source]);
  assert.equal(report.articleCount, 3);
  assert.equal(report.matchedArticleCount, 1);
  assert.equal(report.questionSourceCount, 1);
  assert.deepEqual(report.unmatched.map(article => article.qnum), ['Q495', 'Q060']);
  assert.ok(!report.categories.some(group => group.category === 'tools'));
});

test('新增文章由具体原帖承接，来源问法不扩写为文章全部追问', () => {
  const expectations = { Q376: 'byte-xingfuli-campus', Q383: 'byte-risk-algorithm',
    Q452: 'meituan-java-spring-intern', Q466: 'byte-feishu', Q473: 'jd-java-campus-history',
    Q475: 'meituan-java-spring-intern', Q490: 'meituan-ai-application-march', Q491: 'byte-tomato-backend' };
  for (const [qnum, id] of Object.entries(expectations)) {
    assert.ok(realQuestionsForArticle(qnum).some(match => match.source.id === id), `${qnum} 缺少核验来源`);
  }
  assert.equal(realQuestionsForArticle('Q474')[0].question, 'Spring 中怎样通过注解启用异步处理？');
  assert.equal(INTERVIEW_SOURCES.find(source => source.id === 'byte-ads').reviewedAt, '2026-10-08');
  assert.equal(INTERVIEW_SOURCES.find(source => source.id === 'byte-feishu').reviewedAt, '2026-10-09');
  assert.equal(getInterviewCollections().find(view => view.id === 'shopee/agent').qnums.length, 11);
});
