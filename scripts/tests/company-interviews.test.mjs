import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { INTERVIEW_SOURCES } from '../../src/data/company-interviews.mjs';
import { realQuestionsForArticle, questionTags, getInterviewCollections, getInterviewCoverage, interviewDescription, companyMarkdown, validateInterviewSources } from '../../src/lib/company-interviews.mjs';
import { publicMarkdown } from '../lib/github-articles.mjs';

test('Q696至Q758按原帖公司段落匹配，不用通用框架题推断具体API', () => {
  const ant = realQuestionsForArticle('Q739').find(m => m.source.id === 'ant-misuan-request-binding');
  assert.equal(ant.company.id, 'ant');
  assert.equal(ant.source.roleKey, 'development');
  assert.ok(!questionTags('Q739').some(tag => tag.company === 'bytedance'));
  const baidu = realQuestionsForArticle('Q756').find(m => m.source.id === 'baidu-testing-median');
  assert.equal(baidu.source.roleKey, 'test-development');
  assert.ok(realQuestionsForArticle('Q718').some(m => m.source.id === 'zhihu-monitor-singleflight-trie'));
  assert.ok(!realQuestionsForArticle('Q718').some(m => m.company.id === '4399'));
  assert.ok(!realQuestionsForArticle('Q731').some(m => m.source.url.endsWith('/353150202716561408')),
    '明确混合多家公司且没有分段的问法不能反推为 TikTok 真题');
  for (const n of [696,697,698,699,700,701,702,703,704,705,706,707,708,709,711,713,715,721,725,728,729,730,734,735,736,737,738,742,743,744,745,746,747,748,749]) {
    assert.deepEqual(realQuestionsForArticle(`Q${n}`), [], `Q${n} 缺少明确原帖时应保留待核验`);
  }
});

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
  assert.ok(INTERVIEW_SOURCES.find(source => source.id === 'byte-feishu').reviewedAt >= '2026-10-09');
  assert.ok(getInterviewCollections().find(view => view.id === 'shopee/agent').qnums.includes('Q684'));
});

test('记忆专题只登记原帖明确的问题，不由通用记忆推导具体框架', () => {
  const expectations = { Q496: 'byte-agent-context-intern', Q497: 'taotian-agent-memory-social',
    Q499: 'ali-platform-mem0-intern', Q500: 'dongchedi-agent-autumn',
    Q501: 'tencent-backend-context', Q502: 'shuzimali-code-retrieval' };
  for (const [qnum, sourceId] of Object.entries(expectations)) {
    assert.ok(realQuestionsForArticle(qnum).some(match => match.source.id === sourceId), `${qnum} 缺少本批来源`);
  }
  const batchIds = [...new Set([...Object.values(expectations), 'meituan-keeta-mem0'])];
  const sources = INTERVIEW_SOURCES.filter(source => batchIds.includes(source.id));
  for (const qnum of ['Q498', 'Q503', 'Q504', 'Q505', 'Q506', 'Q507', 'Q508']) {
    assert.deepEqual(questionTags(qnum, sources), [], `${qnum} 不应由本批泛化问题推导真题标签`);
  }
  assert.equal(realQuestionsForArticle('Q499').find(match => match.source.id === 'ali-platform-mem0-intern').question, '是否了解 Mem0？');
  assert.ok(!realQuestionsForArticle('Q502').some(match => match.source.url.includes('/discuss/896102139431223296')),
    '代码检索问题须引用候选人原帖，不能引用他人的 AI 润色参考答案');
});

test('Q509至Q528保留核验边界，不把匿名公司、参考回答或通用框架贴成真题', () => {
  const expected = {
    Q509: ['bytedance/backend'], Q514: ['bytedance/frontend', 'ctrip/frontend'],
    Q515: ['baidu/frontend', 'ctrip/frontend'], Q516: ['duandian/frontend'],
    Q517: ['alibaba/frontend', 'baidu/frontend'], Q518: ['jd/frontend'],
    Q519: ['transwarp/backend'], Q520: ['baidu/backend', 'bytedance/backend'],
    Q521: ['baidu/backend', 'kuaishou/backend'], Q522: ['bytedance/development'],
    Q523: ['youzan/development'], Q524: ['bytedance/backend'], Q525: ['baidu/development'],
    Q526: ['bytedance/backend', 'netease/development'], Q527: ['tencent/development'],
    Q528: ['baidu/frontend', 'meituan/frontend', 'netease/development'],
  };
  for (const [qnum, ids] of Object.entries(expected)) {
    assert.deepEqual(questionTags(qnum).map(tag => tag.id).sort(), ids.sort(), `${qnum} 公司岗位不符`);
    assert.ok(realQuestionsForArticle(qnum).every(match => match.source.reviewedAt >= '2026-10-11'));
  }
  for (const qnum of ['Q510', 'Q511', 'Q512', 'Q513']) assert.deepEqual(questionTags(qnum), []);
  assert.equal(realQuestionsForArticle('Q523')[0].question, '怎样用 Python 的 property 创建只读属性？');
  assert.ok(!realQuestionsForArticle('Q524').some(match => match.company.id === 'meituan'), '混合面经只归属实际提问的公司');
  assert.doesNotMatch(realQuestionsForArticle('Q525')[0].question, /MySQL|8\.0/);
  assert.match(realQuestionsForArticle('Q509')[0].source.dateLabel, /未明确年份/);
});

test('Q529至Q564的来源区分原题、回答扩展、旧版本与实际岗位', () => {
  for (const qnum of ['Q530', 'Q531', 'Q532', 'Q533', 'Q534', 'Q542', 'Q545']) {
    assert.deepEqual(questionTags(qnum), [], `${qnum} 不应由相邻问题或不可读取的原帖推导真题`);
  }
  for (let number = 529; number <= 564; number++) {
    const qnum = `Q${number}`;
    for (const match of realQuestionsForArticle(qnum)) assert.ok(match.source.reviewedAt >= '2026-10-12');
  }
  assert.equal(realQuestionsForArticle('Q529')[0].question, '是否使用过 OpenClaw？');
  assert.doesNotMatch(realQuestionsForArticle('Q544')[0].question, /标准|experimentalDecorators/);
  const deployment = questionTags('Q555');
  assert.deepEqual(deployment.map(tag => tag.id), ['lilith/operations']);
  assert.equal(deployment[0].label, '莉莉丝运维面试真题');
  assert.doesNotMatch(realQuestionsForArticle('Q557')[0].question, /OPTIMIZE TABLE/);
  assert.doesNotMatch(realQuestionsForArticle('Q558')[0].question, /SLOWLOG/);
  assert.ok(!realQuestionsForArticle('Q563').some(match => match.source.id === 'byte-feishu'), '链表问题不能归成二叉树 LCA');
  const frameworks = realQuestionsForArticle('Q550');
  assert.doesNotMatch(frameworks.find(match => match.company.id === 'huawei').question, /FastAPI/);
  assert.match(frameworks.find(match => match.company.id === 'jiawei').question, /FastAPI/);
  assert.deepEqual(questionTags('Q560').map(tag => tag.company).sort(), ['cambricon', 'pingtouge']);
  assert.equal(INTERVIEW_SOURCES.find(source => source.id === 'byte-ads').reviewedAt, '2026-10-08');
});

test('Python 新批保留语言、版本、岗位与混合面经的公司边界', () => {
  const sources = INTERVIEW_SOURCES.filter(source => source.reviewedAt === '2026-10-14');
  assert.ok(realQuestionsForArticle('Q566').some(match => match.source.id === 'baidu-ai-ecosystem-intern'));
  assert.deepEqual(questionTags('Q568').map(tag => tag.id), ['bytedance/test-development']);
  assert.deepEqual(questionTags('Q585').map(tag => tag.id), ['dahua/development']);
  assert.deepEqual(questionTags('Q605').map(tag => tag.id).sort(), ['baidu/algorithm', 'shopee/operations']);
  assert.deepEqual(questionTags('Q627').map(tag => tag.id), ['tencent/test-development']);
  const wsgi = realQuestionsForArticle('Q621');
  assert.equal(wsgi.length, 1);
  assert.doesNotMatch(wsgi[0].question, /ASGI/);
  assert.ok(realQuestionsForArticle('Q591').every(match => !/init_subclass/.test(match.question)));
  assert.deepEqual(realQuestionsForArticle('Q618').map(match => match.company.id).sort(), ['netease', 'tencent']);
  assert.ok(!realQuestionsForArticle('Q605').some(match => match.company.id === 'tencent'), '同帖百度读取文件不能分给腾讯');
  assert.ok(realQuestionsForArticle('Q601').some(match => match.company.id === 'ant'));
  assert.ok(!realQuestionsForArticle('Q601').some(match => match.company.id === 'alibaba'), '蚂蚁原题保留实际公司');
  for (const qnum of ['Q565', 'Q587', 'Q593', 'Q594', 'Q595', 'Q612', 'Q617', 'Q619', 'Q623', 'Q624', 'Q625', 'Q626', 'Q628', 'Q629', 'Q630', 'Q631', 'Q632']) {
    assert.deepEqual(questionTags(qnum, sources), [], `${qnum} 不应由匿名公司、泛化问题或回答中的 API 推导标签`);
  }
  assert.ok(INTERVIEW_SOURCES.find(source => source.id === 'youzan-python-property').reviewedAt >= '2026-10-12');
  assert.equal(INTERVIEW_SOURCES.find(source => source.id === 'byte-ads').reviewedAt, '2026-10-08');
});

test('Q633至Q695不把新API、候选人回答、其他公司或另一语言的问题反推成原题', () => {
  assert.deepEqual(questionTags('Q633').map(tag => tag.id), ['alibaba/algorithm']);
  assert.doesNotMatch(realQuestionsForArticle('Q633')[0].question, /Runner|Responses/);
  assert.deepEqual(questionTags('Q637').map(tag => tag.id), ['ant/algorithm']);
  assert.doesNotMatch(realQuestionsForArticle('Q637')[0].question, /Self-Consistency/);
  for (const qnum of ['Q634','Q635','Q636','Q638','Q639','Q640','Q641','Q642','Q643','Q645','Q649','Q651','Q658','Q671','Q672','Q676','Q681']) {
    assert.deepEqual(questionTags(qnum), [], `${qnum} 缺少同一学习目标的具体原题，不应贴标签`);
  }
  assert.deepEqual(questionTags('Q644').map(tag => tag.id), ['weibu/frontend']);
  assert.ok(!realQuestionsForArticle('Q647').some(match => match.source.id === 'byte-frontend-decorators'), '腾讯段落的CSS问题不能归给字节');
  assert.ok(!realQuestionsForArticle('Q653').some(match => match.source.id === 'byte-development-stamped-lock'), '指定JDK6的MarkWord问题不替换成JDK21解析');
  assert.ok(!realQuestionsForArticle('Q656').some(match => match.source.id === 'arcsoft-testing-pyc' || match.source.id === 'vastai-driver-algorithms'), 'C++重载问题不能贴给Java');
  const jd = realQuestionsForArticle('Q675').find(match => match.source.id === 'jd-social-zookeeper-bst');
  assert.equal(jd.company.id, 'jd');
  assert.deepEqual(questionTags('Q693').map(tag => tag.id), ['jd/backend']);
  assert.equal(realQuestionsForArticle('Q669').find(match => match.source.id === '4399-go-once-campus').source.role, 'Java后端（含 Go 提问）');
  assert.deepEqual(questionTags('Q683').map(tag => tag.id), ['vastai/development']);
  assert.ok(realQuestionsForArticle('Q688').every(match => match.source.url.includes('/c026920386c446039dd750b08ed7cd18')));
  assert.equal(realQuestionsForArticle('Q692')[0].source.url, 'https://www.nowcoder.com/feed/main/detail/54e8743123f7489aa042752a805b0529');
  assert.ok(realQuestionsForArticle('Q695').every(match => !/Ambient|Sidecar/.test(match.question)), '原帖只问概念，不能反推新部署模式');
  assert.equal(INTERVIEW_SOURCES.find(source => source.id === 'byte-ads').reviewedAt, '2026-10-08');
});
