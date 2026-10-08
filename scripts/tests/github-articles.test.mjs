import { test } from 'node:test';
import assert from 'node:assert/strict';
import { publicMarkdown, selectPublished } from '../lib/github-articles.mjs';

test('GitHub 只导出已发布且地址匹配的文章', () => {
  const articles = [{ qnum: 'Q001', relative: 'agent/q001-test.md' }, { qnum: 'Q002', relative: 'agent/q002-draft.md' }];
  assert.equal(selectPublished(articles, { Q001: '/agent/q001-test/' }).length, 1);
  assert.throws(() => selectPublished(articles, { Q001: '/agent/q001-old/' }), /地址/);
});

test('配图与内部链接可在 GitHub 阅读，代码中的示例保持原样', () => {
  const result = publicMarkdown({ qnum: 'Q001', title: '示例', body: '![图](/img/Q001/a%20b.png)\n\n[站内](/rag/)\n\n[图][image]\n\n[image]: /img/Q001/a%20b.png\n\n```js\nconst url = "/img/example.png";\n```' }, '/agent/q001-test/', { '/img/Q001/a b.png': { src: '/img/Q001/a b.webp' } });
  assert.match(result, /https:\/\/note.lgdsunday.club\/img\/Q001\/a%20b.webp/);
  assert.match(result, /https:\/\/note.lgdsunday.club\/rag\//);
  assert.match(result, /const url = "\/img\/example.png"/);
  assert.doesNotMatch(result, /\]\(\/img\//);
});

test('阻止本机资源路径或尚未优化的图片进入公开稿', () => {
  for (const body of ['[本机](file:///Users/test/a.md)', '![图](/img/Q001/missing.png)']) {
    assert.throws(() => publicMarkdown({ qnum: 'Q001', title: '示例', body }, '/agent/q001-test/'));
  }
});
