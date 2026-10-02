#!/usr/bin/env node
// 私有源稿只在同步进程内读取；第三章起仅将 15% 试读及其配图写入网站。
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { parseLesson, previewTree, stringify } from './lib/course-content.mjs';
import { courseSourceHash } from './lib/course-validation.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const config = JSON.parse(fs.readFileSync(new URL('./course-lessons.json', import.meta.url), 'utf8'));
const source = path.resolve(ROOT, process.env.AIGUIDE_COURSE_SOURCE || config.source);
const stage = fs.mkdtempSync(path.join(ROOT, '.course-sync-'));
const markdownDir = path.join(stage, 'content');
const assetDir = path.join(stage, 'assets');
const links = new Map(config.lessons.map((lesson) => [path.resolve(source, lesson.source), `/agent-course/${lesson.id}/`]));
const escape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
let images = 0;
const ratios = [];

try {
  if (!fs.existsSync(source)) throw new Error('找不到课程源目录；请设置 AIGUIDE_COURSE_SOURCE 或修改 scripts/course-lessons.json');
  const ids = new Set();
  for (const lesson of config.lessons) {
    if (!/^chapter-\d{2}\/(?:lesson-\d{2}(?:-(?:a|b|c|d))?|exercises)$/.test(lesson.id) || ids.has(lesson.id)) throw new Error(`无效或重复课程 ID: ${lesson.id}`);
    ids.add(lesson.id);
    const file = path.resolve(source, lesson.source);
    if (!file.startsWith(source + path.sep)) throw new Error('课程源文件必须位于课程目录内');
    const raw = fs.readFileSync(file, 'utf8');
    // 只报告文件名，不把疑似密钥输出到日志。
    if (/\bsk-[a-zA-Z0-9]{20,}\b/.test(raw)) throw new Error(`源稿包含疑似真实 API 密钥，请先处理: ${lesson.id}`);
    const parsed = parseLesson(raw);
    const title = lesson.title || parsed.title;
    if (!title) throw new Error(`课程缺少标题: ${lesson.id}`);
    const free = lesson.chapter <= 2;
    const selected = free ? { tree: parsed.tree, ratio: 1 } : previewTree(parsed.tree);
    if (!free && (selected.ratio < 0.10 || selected.ratio > 0.16)) throw new Error(`试读比例异常: ${lesson.id} ${selected.ratio}`);
    ratios.push(selected.ratio);
    let imageNumber = 0;
    async function rewrite(parent) {
      for (let index = 0; index < parent.children.length; index++) {
        let node = parent.children[index];
        if (node.type === 'image') {
          if (/^(?:https?:)?\/\//.test(node.url)) continue;
          const original = node.url.startsWith('file:')
            ? fileURLToPath(new URL(node.url))
            : path.resolve(path.dirname(file), decodeURIComponent(node.url.split('?')[0].split('#')[0]));
          if (!original.startsWith(source + path.sep) || !fs.existsSync(original)) throw new Error(`课程配图不存在或越界: ${lesson.id} ${node.url}`);
          const bytes = fs.readFileSync(original);
          const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 16);
          const target = `${lesson.id.replaceAll('/', '-')}/${hash}.webp`;
          const destination = path.join(assetDir, target);
          fs.mkdirSync(path.dirname(destination), { recursive: true });
          const cached = path.join(ROOT, 'public/course-assets', target);
          let info;
          if (fs.existsSync(cached)) {
            fs.copyFileSync(cached, destination);
            info = await sharp(cached).metadata();
          } else {
            const output = await sharp(bytes).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 88 }).toBuffer({ resolveWithObject: true });
            fs.writeFileSync(destination, output.data);
            info = output.info;
          }
          imageNumber++;
          const alt = !node.alt || /^(image|img|chatgpt|截屏|屏幕截图)/i.test(node.alt) ? `${title} 配图 ${imageNumber}` : node.alt;
          parent.children[index] = { type: 'html', value: `<img src="/course-assets/${target}" alt="${escape(alt)}" width="${info.width}" height="${info.height}" loading="lazy" decoding="async" />` };
          images++;
        } else if (node.type === 'link' && !/^(?:https?:|mailto:|#)/.test(node.url)) {
          const target = path.resolve(path.dirname(file), decodeURIComponent(node.url.split('#')[0]));
          if (links.has(target)) node.url = links.get(target);
          else parent.children.splice(index--, 1, ...(node.children ?? []));
        }
        if (node.children) await rewrite(node);
      }
    }
    await rewrite(selected.tree);
    const description = `慕课网《从 0 到 1 转型 Agent 应用开发工程师》第 ${lesson.chapter} 章：${title}。${free ? '本节全文免费阅读。' : '本节提供约 15% 免费试读，完整课程 499 元，添加作者微信购买。'}`;
    // 指纹对应实际读取的原稿版本，仅用于本地构建校验，不把原稿保存到站点。
    const metadata = { title, description, chapter: lesson.chapter, chapterTitle: lesson.chapterTitle, order: lesson.order, free, previewRatio: Number(selected.ratio.toFixed(4)), sourceHash: courseSourceHash(raw), date: fs.statSync(file).mtime.toISOString().slice(0, 10) };
    const output = path.join(markdownDir, `${lesson.id}.md`);
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, `---\n${Object.entries(metadata).map(([key,value]) => `${key}: ${JSON.stringify(value)}`).join('\n')}\n---\n\n${stringify(selected.tree)}`);
  }
  // 全部源稿、比例与图片通过检查后才替换旧产物，清理此前可能残留的课程文件。
  for (const [from, to] of [[markdownDir, path.join(ROOT, 'src/content/course')], [assetDir, path.join(ROOT, 'public/course-assets')]]) {
    fs.mkdirSync(from, { recursive: true });
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.rmSync(to, { recursive: true, force: true });
    fs.renameSync(from, to);
  }
  const paidRatios = ratios.filter((r) => r < 1);
  console.log(`课程同步完成：${config.lessons.length} 节，${ratios.length-paidRatios.length} 节全文、${paidRatios.length} 节试读；${images} 张公开配图。试读比例 ${(Math.min(...paidRatios)*100).toFixed(1)}%–${(Math.max(...paidRatios)*100).toFixed(1)}%。`);
} finally {
  fs.rmSync(stage, { recursive: true, force: true });
}
