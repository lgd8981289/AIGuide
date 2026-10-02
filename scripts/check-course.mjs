#!/usr/bin/env node
// 用原稿重新计算公开范围，核对同步正文及图片，防止误把全文带入发布目录。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateCourseMarkdown } from './lib/course-validation.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const config = JSON.parse(fs.readFileSync(new URL('./course-lessons.json', import.meta.url)));
const source = path.resolve(root, process.env.AIGUIDE_COURSE_SOURCE || config.source);
const assets = new Set();

for (const lesson of config.lessons) {
  const publicMarkdown = validateCourseMarkdown({
    lesson,
    sourceMarkdown: fs.readFileSync(path.join(source, lesson.source), 'utf8'),
    publicMarkdown: fs.readFileSync(path.join(root, 'src/content/course', `${lesson.id}.md`), 'utf8'),
  });
  for (const match of publicMarkdown.matchAll(/src="(\/course-assets\/[^"\s]+)"/g)) assets.add(match[1]);
  assert.ok(fs.existsSync(path.join(root, 'dist/agent-course', lesson.id, 'index.html')), `缺少课程页面: ${lesson.id}`);
}

function files(dir) {
  return fs.readdirSync(dir, {withFileTypes:true}).flatMap((entry) => entry.isDirectory() ? files(path.join(dir,entry.name)) : [path.join(dir,entry.name)]);
}
for (const folder of ['public/course-assets', 'dist/course-assets']) {
  const actual = files(path.join(root,folder));
  assert.equal(actual.length, assets.size, `${folder} 包含未被公开正文使用的配图`);
  for (const file of actual) assert.ok(assets.has('/course-assets/' + path.relative(path.join(root,folder),file)), `意外公开的课程资源: ${path.basename(file)}`);
}
assert.ok(files(path.join(root,'dist/agent-course')).every((file)=>file.endsWith('.html')), '课程输出包含非网页文件');
console.log(`课程公开范围检查通过：${config.lessons.length} 节正文与原稿授权范围一致，${assets.size} 张配图均被公开正文引用，无多余资源。`);
