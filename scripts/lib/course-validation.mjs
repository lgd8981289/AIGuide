import { createHash } from 'node:crypto';
import { parseLesson, previewTree } from './course-content.mjs';

export const courseSourceHash = (markdown) => createHash('sha256').update(markdown).digest('hex');
const compact = (value) => value.replace(/\s/g, '');
const textOnly = (node) => ['image', 'html'].includes(node.type) ? '' : node.value ?? (node.children ?? []).map(textOnly).join('');
const resync = '请重新执行 npm run sync:course && npm run build，或重新执行 ./deploy.sh --sync；同步与构建期间请勿修改课程原稿。';

export function validateCourseMarkdown({ lesson, sourceMarkdown, publicMarkdown }) {
  const frontmatter = publicMarkdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  const recordedHash = frontmatter?.[1].match(/^sourceHash: "([a-f0-9]{64})"\s*$/m)?.[1];
  if (!recordedHash) {
    throw new Error(`课程同步版本记录缺失: ${lesson.id}。${resync}`, { cause: 'COURSE_SOURCE_VERSION_MISSING' });
  }
  if (recordedHash !== courseSourceHash(sourceMarkdown)) {
    throw new Error(`课程原稿在同步后发生了修改: ${lesson.id}。${resync}`, { cause: 'COURSE_SOURCE_CHANGED' });
  }

  const body = publicMarkdown.slice(frontmatter[0].length);
  const original = parseLesson(sourceMarkdown).tree;
  const expected = lesson.chapter <= 2 ? original : previewTree(original).tree;
  const actual = parseLesson(body).tree;
  if (compact(textOnly(actual)) !== compact(textOnly(expected))) {
    // 禁止让 AssertionError 把原稿/付费正文作为 actual / expected 输出到发布日志。
    throw new Error(`课程公开正文与授权范围不同: ${lesson.id}。已停止构建，请检查同步或裁剪逻辑，不要跳过正文保护校验。`, { cause: 'COURSE_PUBLIC_CONTENT_MISMATCH' });
  }
  return body;
}
