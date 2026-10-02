import assert from 'node:assert/strict';
import test from 'node:test';
import { parseLesson, previewTree, stringify, weight, nodeText } from '../lib/course-content.mjs';

test('全文章节保留末尾正文；试读不包含末尾、后续图片或引用定义', () => {
  const source = '# 标题\n\n' + '这是一段公开内容。'.repeat(80) + '\n\n![私有配图](private.png)\n\n[付费下载][secret]\n\nPRIVATE_TAIL\n\n[secret]: https://example.com/private-full.md';
  const { tree } = parseLesson(source);
  assert.match(nodeText(tree), /PRIVATE_TAIL/);
  const preview = previewTree(tree);
  const result = stringify(preview.tree);
  assert.doesNotMatch(result, /PRIVATE_TAIL|private.png|private-full/);
  assert.ok(preview.ratio > .13 && preview.ratio <= .15);
});

test('长代码块按预算裁剪且保持闭合；列表和表格可以重新解析', () => {
  for (const source of [
    '# 标题\n\n```js\n' + 'console.log("line");\n'.repeat(100) + 'PRIVATE_CODE\n```',
    '# 标题\n\n' + '- **列表项**内容\n'.repeat(200),
    '# 标题\n\n| 列一 | 列二 |\n| --- | --- |\n' + '| a | b |\n'.repeat(200),
  ]) {
    const { tree } = parseLesson(source);
    const preview = previewTree(tree);
    const result = stringify(preview.tree);
    assert.doesNotMatch(result, /PRIVATE_CODE/);
    assert.ok(preview.ratio <= .15 && preview.ratio > .12);
    assert.ok(weight(parseLesson(result).tree) > 0);
    if (source.includes('```')) assert.equal((result.match(/```/g) ?? []).length, 2);
  }
});

test('HTML 图片参与裁剪，隐藏 HTML 不会作为 HTML 输出，引用图片可解析', () => {
  const { tree } = parseLesson('# 标题\n\n<img src="a.png" alt="示意图" />\n\n![b][image]\n\n<script>secret()</script>\n\n[image]: b.png');
  assert.equal(tree.children[0].children[0].type, 'image');
  assert.match(stringify(tree), /!\[b\]\(b.png\)/);
  assert.match(stringify(tree), /`<script>secret\(\)<\/script>`/);
});
