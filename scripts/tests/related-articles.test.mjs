import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectRelatedArticles } from '../../src/lib/related-articles.mjs';

const article = (qnum) => ({ entry: { id: `agent/${qnum.toLowerCase()}`, data: { qnum, title: qnum } } });

test('精选题目在前，排除自身和重复项，按原有顺序补齐', () => {
  const all = ['Q001', 'Q002', 'Q003', 'Q004', 'Q005', 'Q006'].map(article);
  const chosen = selectRelatedArticles('Q001', all, ['Q004', 'Q001', 'Q004'], all);
  assert.deepEqual(chosen.map((item) => item.entry.data.qnum), ['Q004', 'Q002', 'Q003', 'Q005']);
  assert.equal(chosen[0], all[3]);
});

test('没有精选关系时保留旧顺序，不存在或重复的全局编号明确报错', () => {
  const all = ['Q001', 'Q002', 'Q003'].map(article);
  assert.deepEqual(selectRelatedArticles('Q001', all, [], all), all.slice(1));
  assert.throws(() => selectRelatedArticles('Q001', all, ['Q999'], all), /不存在/);
  assert.throws(() => selectRelatedArticles('Q001', [...all, all[1]], [], all), /编号重复/);
});
