import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { SITE, LEDGER, PENDING, planURLs, assertProtected, syncedPlan, builtPlan,
  sitemapArticles, verifyHTML, initialize, prepare, recordPublished } from '../article-url-policy.mjs';

const paths = { Q001: '/agent/q001-agent-loop/', Q002: '/agent/q002-tool-calling/' };
const html = (url) => `<html><head><link href="${SITE + url}" rel="canonical"></head><body>正文</body></html>`;
const xml = (articles) => `<urlset>${Object.values(articles).map((url) => `<url><loc>${SITE + url}</loc></url>`).join('')}</urlset>`;
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aiguide-url-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (relative, value) => {
    const file = path.join(root, relative);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value));
  };
  write('scripts/article-slugs.json', { Q001: 'agent-loop', Q002: 'tool-calling' });
  write(LEDGER, { version: 1, site: SITE, verifiedAt: '2026-10-07T00:00:00Z', articles: { Q001: paths.Q001 } });
  for (const [id, url] of Object.entries(paths)) {
    write(`src/content/articles${url.slice(0, -1)}.md`, `---\nqnum: "${id}"\ncategory: "agent"\n---\n正文\n`);
    write(`dist${url}index.html`, html(url));
  }
  write('dist/sitemap-0.xml', xml(paths));
  const requests = [];
  const responses = new Map([[`${SITE}/sitemap-0.xml`, xml(paths)],
    ...Object.values(paths).map((url) => [SITE + url, html(url)])]);
  const fetcher = async (url, options) => {
    assert.equal(options.redirect, 'manual');
    requests.push(url);
    const value = responses.get(url);
    return value instanceof Response
      ? new Response(await value.clone().text(), { status: value.status, headers: value.headers })
      : new Response(value ?? 'not found', { status: value ? 200 : 404 });
  };
  return { root, write, requests, responses, fetcher, read: (relative) => fs.readFileSync(path.join(root, relative), 'utf8') };
}

test('网址计划必填 slug；已发布和待核验记录均保护路径，但允许限定同步', (t) => {
  const f = fixture(t);
  assert.throws(() => planURLs(new Map([['Q003', 'agent']]), {}), /缺少英文 slug/);
  assert.throws(() => assertProtected(f.root, { Q001: '/backend/q001-agent-loop/' }), /网址受保护/);
  assert.throws(() => assertProtected(f.root, {}), /被删除/);
  assert.deepEqual(assertProtected(f.root, { Q002: paths.Q002 }, new Set(['Q002'])), { Q002: paths.Q002 });
  prepare(f.root);
  assert.throws(() => assertProtected(f.root, { Q001: paths.Q001, Q002: '/agent/q002-new/' }), /Q002.*网址受保护/);
});

test('缺少/损坏已发布记录不得静默放行', (t) => {
  const f = fixture(t);
  f.write(LEDGER, {});
  assert.throws(() => assertProtected(f.root, paths), /记录格式无效/);
  fs.unlinkSync(path.join(f.root, LEDGER));
  assert.throws(() => assertProtected(f.root, paths), /urls:init/);
});

test('生成文件改名、重复编号和 sitemap/canonical 失配均阻止构建发布', (t) => {
  const f = fixture(t);
  assert.deepEqual(syncedPlan(f.root), paths);
  assert.deepEqual(builtPlan(f.root), paths);
  const source = path.join(f.root, `src/content/articles${paths.Q002.slice(0, -1)}.md`);
  const renamed = path.join(path.dirname(source), 'q002.md');
  fs.renameSync(source, renamed);
  assert.throws(() => syncedPlan(f.root), /同步产物与 slug 配置不一致/);
  fs.copyFileSync(renamed, source);
  assert.throws(() => syncedPlan(f.root), /编号重复/);
  fs.unlinkSync(renamed);
  f.write('dist/sitemap-0.xml', xml({ Q001: paths.Q001 }));
  assert.throws(() => builtPlan(f.root), /sitemap 与文章网址清单不一致/);
  f.write('dist/sitemap-0.xml', xml(paths));
  f.write(`dist${paths.Q002}index.html`, html(paths.Q001));
  assert.throws(() => builtPlan(f.root), /canonical/);
});

test('canonical 必须唯一且准确，不能把 noindex/none 当作可索引', () => {
  for (const content of [html(paths.Q002), '<html><head></head></html>',
    html(paths.Q001).replace('</head>', `<link rel="canonical" href="${SITE + paths.Q001}"></head>`),
    html(paths.Q001).replace('</head>', '<meta name="robots" content="noindex, follow"></head>'),
    html(paths.Q001).replace('</head>', '<meta name="googlebot" content="none"></head>')]) {
    assert.throws(() => verifyHTML(content, SITE + paths.Q001));
  }
  assert.throws(() => verifyHTML(html(paths.Q001), SITE + paths.Q001, 'googlebot: noindex'));
  verifyHTML(html(paths.Q001), SITE + paths.Q001);
});

test('sitemap 拒绝空清单、外域、重复 Q 编号及编号地址与英文地址并存', () => {
  for (const content of ['<sitemapindex></sitemapindex>', '<urlset></urlset>',
    xml(paths).replace(SITE, 'https://example.com'),
    xml({ ...paths, alias: '/agent/q001/' })]) assert.throws(() => sitemapArticles(content));
});

test('初始化仅从 HTTP 200 且 canonical 正确的线上页面建立记录，禁止覆盖', async (t) => {
  const f = fixture(t);
  fs.unlinkSync(path.join(f.root, LEDGER));
  assert.equal(await initialize(f.root, f.fetcher), 2);
  assert.deepEqual(JSON.parse(f.read(LEDGER)).articles, paths);
  assert.ok(f.requests.includes(SITE + paths.Q001));
  assert.ok(f.requests.includes(SITE + paths.Q002));
  await assert.rejects(initialize(f.root, f.fetcher), /禁止.*覆盖/);
});

test('初始化期间 sitemap 改变或页面失败，不产生已发布记录', async (t) => {
  const f = fixture(t);
  fs.unlinkSync(path.join(f.root, LEDGER));
  f.responses.set(SITE + paths.Q002, new Response('moved', { status: 301 }));
  await assert.rejects(initialize(f.root, f.fetcher), /HTTP 301/);
  assert.ok(!fs.existsSync(path.join(f.root, LEDGER)));
  f.responses.set(SITE + paths.Q002, html(paths.Q002));
  let maps = 0;
  await assert.rejects(initialize(f.root, async (url, options) => {
    if (url.endsWith('.xml') && ++maps === 2) return new Response(xml({ Q001: paths.Q001 }));
    return f.fetcher(url, options);
  }), /sitemap 已变化/);
  assert.ok(!fs.existsSync(path.join(f.root, LEDGER)));
});

test('上传准备不标记已发布；验证只请求新增页面，通过后登记并移除待核验清单', async (t) => {
  const f = fixture(t);
  const before = f.read(LEDGER);
  assert.equal(prepare(f.root), 2);
  assert.equal(f.read(LEDGER), before);
  assert.ok(fs.existsSync(path.join(f.root, PENDING)));
  assert.equal(await recordPublished(f.root, f.fetcher), 1);
  assert.deepEqual(JSON.parse(f.read(LEDGER)).articles, paths);
  assert.ok(!fs.existsSync(path.join(f.root, PENDING)));
  assert.ok(!f.requests.includes(SITE + paths.Q001));
  assert.ok(f.requests.includes(SITE + paths.Q002));
});

test('发布后页面 404/重定向/错误 canonical/noindex 或 sitemap 不一致，均保留待核验清单', async (t) => {
  const f = fixture(t);
  prepare(f.root);
  const before = f.read(LEDGER);
  for (const response of [new Response('404', { status: 404 }), new Response('301', { status: 301 }),
    html(paths.Q001), new Response(html(paths.Q002), { headers: { 'x-robots-tag': 'noindex' } })]) {
    f.responses.set(SITE + paths.Q002, response);
    await assert.rejects(recordPublished(f.root, f.fetcher));
    assert.equal(f.read(LEDGER), before);
    assert.ok(fs.existsSync(path.join(f.root, PENDING)));
  }
  f.responses.set(SITE + paths.Q002, html(paths.Q002));
  f.responses.set(`${SITE}/sitemap-0.xml`, xml({ Q001: paths.Q001 }));
  await assert.rejects(recordPublished(f.root, f.fetcher), /线上 sitemap/);
  assert.equal(f.read(LEDGER), before);
});

test('新增文章的临时 503 可重试，未做上传准备不得登记', async (t) => {
  const f = fixture(t);
  await assert.rejects(recordPublished(f.root, f.fetcher), /pending.json/);
  prepare(f.root);
  let attempts = 0;
  const fetcher = async (url, options) => {
    if (url === SITE + paths.Q002 && attempts++ === 0) return new Response('retry', { status: 503 });
    return f.fetcher(url, options);
  };
  assert.equal(await recordPublished(f.root, fetcher), 1);
  assert.equal(attempts, 2);
});
