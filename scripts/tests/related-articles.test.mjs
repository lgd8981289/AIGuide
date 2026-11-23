import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRelatedArticleSelector } from '../../src/lib/related-articles.mjs';

const article = (qnum, title, category = 'backend', topic) => ({ entry: { id: `${category}/${qnum.toLowerCase()}`, data: { qnum, title, category, topic } } });
const ids = list => list.map(item => item.entry.data.qnum);

test('同专题和技术实体优先，目录首篇不再占据全部推荐', () => {
  const all = [article('Q001', 'Node Stream 背压'), article('Q002', 'JWT 验证'),
    article('Q003', 'Java JVM 垃圾回收', 'backend', 'jvm'),
    article('Q004', 'JVM G1 与 ZGC 垃圾回收', 'backend', 'jvm'),
    article('Q005', 'JVM 堆内存分配', 'backend', 'jvm')];
  const select = createRelatedArticleSelector(all);
  assert.deepEqual(ids(select('Q003', [], 2)), ['Q004', 'Q005']);
  assert.deepEqual(ids(createRelatedArticleSelector([...all].reverse())('Q003')), ids(select('Q003')));
  assert.deepEqual(ids(select('Q003', ['Q001', 'Q003', 'Q001'], 3)), ['Q001', 'Q004', 'Q005']);
});

test('跨分类候选需要主题关联，数量不足时不塞入无关文章', () => {
  const all = [article('Q001', 'MCP 工具配置', 'agent'), article('T001', 'MCP 工具配置教程', 'tools'),
    article('Q002', 'CSS 图片尺寸', 'frontend')];
  assert.deepEqual(ids(createRelatedArticleSelector(all)('Q001')), ['T001']);
});

test('重排与委托等同名概念不跨领域混推，垃圾回收不自动跨语言', () => {
  const all = [article('Q001', 'RAG 检索重排', 'rag'), article('Q002', '浏览器重排重绘', 'frontend'),
    article('Q003', 'JVM 垃圾回收算法', 'backend'), article('Q004', 'JavaScript 垃圾回收算法', 'frontend'),
    article('Q005', 'JVM G1 垃圾回收', 'backend')];
  const select = createRelatedArticleSelector(all);
  assert.deepEqual(ids(select('Q001')), []);
  assert.deepEqual(ids(select('Q003')), ['Q005']);
  assert.deepEqual(ids(select('Q003', ['Q004'])), ['Q004', 'Q005'], '明确的人工对比关系允许跨语言');
});

test('不存在或重复的全局编号明确报错', () => {
  const all = [article('Q001', 'Agent'), article('Q002', 'RAG')];
  const select = createRelatedArticleSelector(all);
  assert.throws(() => select('Q001', ['Q999']), /不存在/);
  assert.throws(() => select('Q999'), /不存在/);
  assert.throws(() => createRelatedArticleSelector([...all, all[1]]), /编号重复/);
});
