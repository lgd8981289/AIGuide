import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

test('重建保留真实日期，覆盖公司岗位两层，未知日期不冒充今天', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aiguide-sitemap-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (file, text) => {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), text);
  };
  write('scripts/postbuild.mjs', fs.readFileSync(new URL('../postbuild.mjs', import.meta.url)));
  write('src/content/articles/agent/q001-example.md', '---\ndate: 2026-10-01\n---\n正文');
  const dates = {
    '/guides/ai-interview/': '2026-10-03',
    '/companies/': '2026-10-12',
    '/companies/example/': '2026-10-11',
    '/companies/example/backend/': '2026-10-09',
  };
  for (const [url, date] of Object.entries(dates)) {
    write(`dist${url}index.html`, `<script type="application/ld+json">{"dateModified":"${date}"}</script>`);
  }
  const paths = ['/', '/ai/', '/agent/', '/agent/q001-example/', ...Object.keys(dates), '/unknown/'];
  const sitemap = `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(url => `<url><loc>https://note.lgdsunday.club${url}</loc></url>`).join('')}</urlset>`;
  const build = () => {
    write('dist/sitemap-0.xml', sitemap);
    execFileSync(process.execPath, ['scripts/postbuild.mjs'], { cwd: root, stdio: 'pipe' });
    return fs.readFileSync(path.join(root, 'dist/sitemap-0.xml'), 'utf8');
  };
  const result = build();
  for (const [url, date] of Object.entries({
    '/': '2026-10-01', '/ai/': '2026-10-01', '/agent/': '2026-10-01',
    '/agent/q001-example/': '2026-10-01', ...dates,
  })) {
    assert.ok(result.includes(`<loc>https://note.lgdsunday.club${url}</loc><lastmod>${date}</lastmod>`), url);
  }
  assert.ok(result.includes('<url><loc>https://note.lgdsunday.club/unknown/</loc></url>'));
  assert.equal(fs.readFileSync(path.join(root, 'dist/sitemap.xml'), 'utf8'), result);
  assert.equal(build(), result, '仅重建不刷新 lastmod');
});
