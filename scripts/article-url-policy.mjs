import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export const SITE = 'https://note.lgdsunday.club';
export const LEDGER = 'scripts/article-published-urls.json';
export const PENDING = '.cache/article-urls/pending.json';
const ID = /^[QT]\d{3,}$/;
const SEGMENT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ARTICLE_PATH = /^\/([a-z0-9-]+)\/([qt]\d{3,})(?:-[a-z0-9]+(?:-[a-z0-9]+)*)?\/$/;
const readJSON = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const object = (value) => value && typeof value === 'object' && !Array.isArray(value);

export function readSlugs(root) {
  const slugs = readJSON(path.join(root, 'scripts/article-slugs.json'));
  if (!object(slugs)) throw new Error('article-slugs.json 必须是编号到英文 slug 的对象');
  for (const [id, slug] of Object.entries(slugs)) {
    if (!ID.test(id) || typeof slug !== 'string' || !SEGMENT.test(slug)) {
      throw new Error(`英文 slug 配置无效：${id}（只允许小写字母、数字和单个连字符）`);
    }
  }
  return slugs;
}

export function planURLs(categories, slugs, selected = null) {
  const plan = {};
  for (const id of selected ?? categories.keys()) {
    const category = categories.get(id);
    if (!ID.test(id) || !category || !SEGMENT.test(category)) throw new Error(`文章编号或分类无效：${id}`);
    if (!slugs[id]) throw new Error(`${id} 缺少英文 slug：请先在 scripts/article-slugs.json 登记。已停止，不生成编号地址。`);
    plan[id] = `/${category}/${id.toLowerCase()}-${slugs[id]}/`;
  }
  return plan;
}

function readRecord(root, relative, pending = false) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) {
    if (pending) throw new Error(`缺少 ${relative}：没有上传前清单，请通过 ./deploy.sh --sync 发布，不能直接登记成功。`);
    throw new Error(`缺少 ${relative}。已有站点需运行 npm run urls:init，从线上核验并建立网址保护记录；不要用本地草稿填充。`);
  }
  const record = readJSON(file);
  const timestamp = record[pending ? 'preparedAt' : 'verifiedAt'];
  if (record.version !== 1 || record.site !== SITE || !object(record.articles)
    || typeof timestamp !== 'string' || !Number.isFinite(Date.parse(timestamp))) {
    throw new Error(`网址记录格式无效：${relative}`);
  }
  for (const [id, url] of Object.entries(record.articles)) {
    const match = typeof url === 'string' && url.match(ARTICLE_PATH);
    if (!ID.test(id) || !match || match[2].toUpperCase() !== id) throw new Error(`网址记录无效：${relative} / ${id}`);
  }
  return record;
}

export function assertProtected(root, plan, selected = null) {
  const records = [readRecord(root, LEDGER)];
  if (fs.existsSync(path.join(root, PENDING))) records.push(readRecord(root, PENDING, true));
  for (const record of records) {
    for (const [id, oldURL] of Object.entries(record.articles)) {
      if (selected && !selected.has(id)) continue;
      if (plan[id] !== oldURL) {
        throw new Error(`${id} 已发布或待核验的网址受保护：${oldURL} → ${plan[id] ?? '被删除'}。请先安排旧址 301 重定向和迁移核验，不要直接改 slug、分类或删除文章。`);
      }
    }
  }
  return plan;
}

export function sourcePlan(root, selected = null) {
  const sources = readJSON(path.join(root, 'scripts/sources.json')).sources;
  const categories = new Map();
  for (const source of sources) {
    const directory = path.resolve(root, source.root);
    if (!fs.existsSync(directory)) throw new Error(`找不到写作仓库：${directory}`);
    for (const [name, category] of Object.entries(source.categories)) {
      const folder = path.join(directory, name);
      if (!fs.existsSync(folder)) continue;
      for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
        const id = entry.name.match(/^([A-Z]\d+)/)?.[1];
        if (!entry.isDirectory() || !id || !fs.existsSync(path.join(folder, entry.name, '正文.md'))) continue;
        if (categories.has(id)) throw new Error(`正文编号重复：${id}`);
        categories.set(id, category);
      }
    }
  }
  return assertProtected(root, planURLs(categories, readSlugs(root), selected), selected);
}

export function syncedPlan(root) {
  const base = path.join(root, 'src/content/articles');
  if (!fs.existsSync(base)) throw new Error('尚无同步正文，请先运行 npm run sync');
  const categories = new Map();
  const actual = {};
  for (const dir of fs.readdirSync(base, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    for (const file of fs.readdirSync(path.join(base, dir.name))) {
      if (!file.endsWith('.md')) continue;
      const md = fs.readFileSync(path.join(base, dir.name, file), 'utf8');
      const fm = md.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1] ?? '';
      const id = fm.match(/^qnum: "([QT]\d{3,})"$/m)?.[1];
      const category = fm.match(/^category: "([a-z0-9-]+)"$/m)?.[1];
      if (!id || category !== dir.name) throw new Error(`同步文章的编号或分类无效：${dir.name}/${file}`);
      if (categories.has(id)) throw new Error(`同步文章编号重复：${id}`);
      categories.set(id, category);
      actual[id] = `/${dir.name}/${file.slice(0, -3)}/`;
    }
  }
  const plan = assertProtected(root, planURLs(categories, readSlugs(root)));
  for (const [id, url] of Object.entries(plan)) {
    if (actual[id] !== url) throw new Error(`${id} 同步产物与 slug 配置不一致，请先同步；不能直接构建或发布旧产物。`);
  }
  return plan;
}

function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gs)]
    .map((match) => [match[1].toLowerCase(), match[3]]));
}

export function verifyHTML(html, expected, robots = '') {
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head\s*>/i)?.[1] ?? '';
  const links = [...head.matchAll(/<link\b[^>]*>/gi)].map(([tag]) => attributes(tag))
    .filter((tag) => tag.rel?.toLowerCase().split(/\s+/).includes('canonical'));
  if (links.length !== 1 || links[0].href !== expected) throw new Error(`canonical 与目标网址不一致：${expected}`);
  const directives = [robots, ...[...head.matchAll(/<meta\b[^>]*>/gi)].map(([tag]) => attributes(tag))
    .filter((tag) => /^(robots|googlebot|bingbot)$/i.test(tag.name ?? ''))
    .map((tag) => tag.content ?? '')].join(',');
  if (/\b(noindex|none)\b/i.test(directives)) throw new Error(`页面禁止索引：${expected}`);
}

export function sitemapArticles(xml) {
  if (!/<urlset\b/.test(xml)) throw new Error('需要 sitemap-0.xml 的 URL 清单，不能使用 sitemap 索引');
  const articles = {};
  for (const [, value] of xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)) {
    const url = new URL(value.trim());
    const match = url.pathname.match(ARTICLE_PATH);
    if (!match) continue;
    if (url.origin !== SITE || url.search || url.hash) throw new Error(`sitemap 文章网址异常：${url.href}`);
    const id = match[2].toUpperCase();
    if (articles[id]) throw new Error(`sitemap 中同一文章出现多个地址：${id}`);
    articles[id] = url.pathname;
  }
  if (!Object.keys(articles).length) throw new Error('sitemap 没有文章，拒绝建立空网址记录');
  return articles;
}

function samePlan(left, right) {
  return JSON.stringify(Object.entries(left).sort()) === JSON.stringify(Object.entries(right).sort());
}

export function builtPlan(root) {
  const plan = syncedPlan(root);
  const sitemap = sitemapArticles(fs.readFileSync(path.join(root, 'dist/sitemap-0.xml'), 'utf8'));
  if (!samePlan(plan, sitemap)) throw new Error('构建 sitemap 与文章网址清单不一致，请重新同步并构建');
  for (const url of Object.values(plan)) {
    verifyHTML(fs.readFileSync(path.join(root, 'dist', url.slice(1), 'index.html'), 'utf8'), SITE + url);
  }
  return plan;
}

function writeRecord(root, relative, articles, timestampField) {
  const file = path.join(root, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${randomUUID()}.tmp`;
  const data = { version: 1, site: SITE, [timestampField]: new Date().toISOString(),
    articles: Object.fromEntries(Object.entries(articles).sort(([a], [b]) => a.localeCompare(b))) };
  try {
    fs.writeFileSync(temp, JSON.stringify(data, null, 2) + '\n', { flag: 'wx' });
    fs.renameSync(temp, file);
  } finally {
    if (fs.existsSync(temp)) fs.unlinkSync(temp);
  }
}

async function get(url, fetcher) {
  // 只重试网络错误与临时状态；301/404/错误 canonical 都不能当作验证成功。
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetcher(url, { redirect: 'manual', signal: AbortSignal.timeout(15000) });
      if (response.status !== 200) {
        await response.body?.cancel();
        if ((response.status === 429 || response.status >= 500) && attempt < 2) continue;
        throw new Error(`线上 HTTP ${response.status}：${url}`, { cause: 'permanent' });
      }
      return { text: await response.text(), robots: response.headers.get('x-robots-tag') ?? '' };
    } catch (error) {
      if (error.cause === 'permanent' || attempt === 2) throw error;
    }
  }
}

async function verifyOnline(articles, fetcher) {
  const queue = Object.values(articles);
  let index = 0;
  let failure;
  await Promise.all(Array.from({ length: Math.min(6, queue.length) }, async () => {
    while (!failure && index < queue.length) {
      const url = SITE + queue[index++];
      try {
        const result = await get(url, fetcher);
        verifyHTML(result.text, url, result.robots);
      } catch (error) {
        failure ??= error;
      }
    }
  }));
  if (failure) throw failure;
}

export async function initialize(root, fetcher = fetch) {
  if (fs.existsSync(path.join(root, LEDGER))) throw new Error('已存在已发布网址记录；禁止从 sitemap 重新覆盖保护记录');
  const first = sitemapArticles((await get(`${SITE}/sitemap-0.xml`, fetcher)).text);
  await verifyOnline(first, fetcher);
  const second = sitemapArticles((await get(`${SITE}/sitemap-0.xml`, fetcher)).text);
  if (!samePlan(first, second)) throw new Error('核验期间线上 sitemap 已变化，请稍后重新初始化');
  // 再检查一次，防止耗时核验期间覆盖另一次初始化。
  if (fs.existsSync(path.join(root, LEDGER))) throw new Error('核验期间已生成网址记录，未覆盖');
  writeRecord(root, LEDGER, first, 'verifiedAt');
  return Object.keys(first).length;
}

export function prepare(root) {
  const plan = builtPlan(root);
  // 上传前保护本次计划。上传失败后仍保留，避免部分已上线的地址被下一次改掉。
  writeRecord(root, PENDING, plan, 'preparedAt');
  return Object.keys(plan).length;
}

export async function recordPublished(root, fetcher = fetch) {
  const pending = readRecord(root, PENDING, true);
  const plan = builtPlan(root);
  if (!samePlan(pending.articles, plan)) throw new Error('本地构建与上传前清单不同，不能登记发布成功，请重新发布');
  const online = sitemapArticles((await get(`${SITE}/sitemap-0.xml`, fetcher)).text);
  if (!samePlan(plan, online)) throw new Error('线上 sitemap 与本次构建不同，尚不能登记发布成功');
  const previous = readRecord(root, LEDGER).articles;
  const additions = Object.fromEntries(Object.entries(plan).filter(([id]) => !previous[id]));
  await verifyOnline(additions, fetcher);
  if (!samePlan(plan, sitemapArticles((await get(`${SITE}/sitemap-0.xml`, fetcher)).text))
    || !samePlan(plan, readRecord(root, PENDING, true).articles)) throw new Error('核验期间发布清单发生变化，请重新核验');
  assertProtected(root, plan);
  writeRecord(root, LEDGER, plan, 'verifiedAt');
  fs.unlinkSync(path.join(root, PENDING));
  return Object.keys(additions).length;
}
