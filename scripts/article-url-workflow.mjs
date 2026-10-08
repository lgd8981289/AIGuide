#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sourcePlan, syncedPlan, builtPlan, initialize, prepare, recordPublished } from './article-url-policy.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [command, ...extra] = process.argv.slice(2);
try {
  if (extra.length || !['source', 'synced', 'built', 'init', 'prepare', 'record'].includes(command)) {
    throw new Error('用法：node scripts/article-url-workflow.mjs source|synced|built|init|prepare|record');
  }
  if (command === 'init') console.log(`已从线上核验并保护 ${await initialize(root)} 个文章网址。`);
  else if (command === 'prepare') console.log(`已保存 ${prepare(root)} 个待上传网址；线上验证前不标记为已发布。`);
  else if (command === 'record') console.log(`线上 sitemap 一致，新增 ${await recordPublished(root)} 个网址通过 HTTP/canonical/索引指令检查并登记。`);
  else {
    const plan = ({ source: sourcePlan, synced: syncedPlan, built: builtPlan })[command](root);
    console.log(`文章网址检查通过（${command}）：${Object.keys(plan).length} 篇；英文 slug 完整，受保护地址未改变。`);
  }
} catch (error) {
  console.error(`文章网址检查失败：${error.message}`);
  if (command === 'record') console.error('上传可能已完成，但验证未通过；已保留待核验清单。修复后可运行 npm run urls:record 重试，勿直接删除记录绕过检查。');
  process.exitCode = 1;
}
