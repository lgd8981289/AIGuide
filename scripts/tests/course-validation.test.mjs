import assert from 'node:assert/strict';
import test from 'node:test';
import { parseLesson, previewTree, stringify, nodeText } from '../lib/course-content.mjs';
import { courseSourceHash, validateCourseMarkdown } from '../lib/course-validation.mjs';

const source = '# 课程标题\n\n' + '公开试读中的内容。'.repeat(100) + '\n\nPRIVATE_PAID_BODY_A';
const lesson = { id: 'chapter-08/lesson-06', chapter: 8 };
function synced(markdown, chapter = 8) {
  const original = parseLesson(markdown).tree;
  const tree = chapter <= 2 ? original : previewTree(original).tree;
  return `---\nsourceHash: "${courseSourceHash(markdown)}"\n---\n\n${stringify(tree)}`;
}

test('同步版本一致时允许免费全文和付费试读', () => {
  for (const chapter of [1, 8]) {
    const body = validateCourseMarkdown({ lesson: { ...lesson, chapter }, sourceMarkdown: source, publicMarkdown: synced(source, chapter) });
    assert.equal(nodeText(parseLesson(body).tree).includes('PRIVATE_PAID_BODY_A'), chapter <= 2);
  }
});

test('同步后修改原稿即使不改变试读，也明确要求重新同步', () => {
  const changed = source.replace('PRIVATE_PAID_BODY_A', 'PRIVATE_PAID_BODY_B');
  assert.equal(stringify(previewTree(parseLesson(source).tree).tree), stringify(previewTree(parseLesson(changed).tree).tree));
  assert.throws(() => validateCourseMarkdown({ lesson, sourceMarkdown: changed, publicMarkdown: synced(source) }), (error) => {
    assert.equal(error.cause, 'COURSE_SOURCE_CHANGED');
    assert.match(error.message, /chapter-08\/lesson-06/);
    assert.match(error.message, /npm run sync:course/);
    assert.doesNotMatch(error.message, /PRIVATE_PAID_BODY/);
    return true;
  });
});

test('原稿指纹匹配也不能放行额外付费正文，报错不输出正文差异', () => {
  assert.throws(() => validateCourseMarkdown({ lesson, sourceMarkdown: source, publicMarkdown: synced(source) + '\n\nPRIVATE_PAID_BODY_A\n' }), (error) => {
    assert.equal(error.cause, 'COURSE_PUBLIC_CONTENT_MISMATCH');
    assert.doesNotMatch(error.message, /PRIVATE_PAID_BODY|公开试读中的内容/);
    assert.equal('actual' in error, false);
    assert.equal('expected' in error, false);
    return true;
  });
});

test('旧同步文件缺少原稿指纹时提示重新同步', () => {
  assert.throws(() => validateCourseMarkdown({ lesson, sourceMarkdown: source, publicMarkdown: '---\ntitle: "旧同步文件"\n---\n\n公开试读' }), { cause: 'COURSE_SOURCE_VERSION_MISSING' });
});
