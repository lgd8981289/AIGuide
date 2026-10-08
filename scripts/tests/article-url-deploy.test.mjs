import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { spawnSync } from 'node:child_process';

const deploy = new URL('../../deploy.sh', import.meta.url);
// deploy.sh 是含本机连接配置的忽略文件；测试副本移除配置，所有网络命令都由本地桩接管。
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aiguide-deploy-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (name, value) => {
    fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
    fs.writeFileSync(path.join(root, name), value, { mode: 0o700 });
  };
  const script = fs.readFileSync(deploy, 'utf8').replace(/^(SERVER_IP|SERVER_PORT|SERVER_USER|SERVER_PASS|BAIDU_PUSH_TOKEN|INDEXNOW_KEY)=.*$/gm, '$1="test"');
  write('deploy.sh', script);
  write('package.json', '{}');
  write('dist/index.html', '<html>test</html>');
  write('bin/node', '#!/bin/sh\nprintf "url:%s\\n" "$2" >> "$TEST_LOG"\n[ "$2" != "$FAIL_URL_STAGE" ]\n');
  write('bin/npm', '#!/bin/sh\nprintf "npm:%s\\n" "$2" >> "$TEST_LOG"\n');
  write('bin/ssh', '#!/bin/sh\necho ssh >> "$TEST_LOG"\n');
  write('bin/rsync', '#!/bin/sh\necho rsync >> "$TEST_LOG"\necho ">f+++++++++ index.html"\n');
  write('bin/python3', '#!/bin/sh\necho fixture\n');
  write('bin/curl', '#!/bin/sh\necho curl >> "$TEST_LOG"\nprintf 200\n');
  return { root, run: (args = [], fail = '') => {
    const log = path.join(root, 'commands.log');
    fs.writeFileSync(log, '');
    const result = spawnSync('/bin/bash', ['./deploy.sh', ...args], { cwd: root, encoding: 'utf8',
      env: { PATH: `${root}/bin:/usr/bin:/bin`, TEST_LOG: log, FAIL_URL_STAGE: fail } });
    return { ...result, calls: fs.readFileSync(log, 'utf8').trim().split('\n') };
  } };
}

test('deploy --sync 保持入口；检查早于同步和 SSH，上传前准备、上传后核验', { skip: !fs.existsSync(deploy) }, (t) => {
  const f = fixture(t);
  const result = f.run(['--sync']);
  assert.equal(result.status, 0, result.stderr);
  const order = ['url:source', 'ssh', 'npm:sync', 'npm:build', 'url:prepare', 'rsync', 'url:record'];
  for (let i = 1; i < order.length; i++) {
    assert.ok(result.calls.indexOf(order[i]) > result.calls.indexOf(order[i - 1]), result.calls.join(','));
  }
  assert.match(result.stdout, /发布完成/);
});

test('发布前检查失败不接触服务器；发布后核验失败不得报告完成', { skip: !fs.existsSync(deploy) }, (t) => {
  const f = fixture(t);
  const before = f.run(['--sync'], 'source');
  assert.notEqual(before.status, 0);
  assert.deepEqual(before.calls, ['url:source']);
  const after = f.run(['--sync'], 'record');
  assert.notEqual(after.status, 0);
  assert.ok(after.calls.includes('rsync'));
  assert.doesNotMatch(after.stdout, /发布完成|推送新内容/);
});

test('演练不创建待发布记录；no-build 仍检查 SEO；拒绝同步却跳过构建', { skip: !fs.existsSync(deploy) }, (t) => {
  const f = fixture(t);
  const dry = f.run(['--sync', '--dry-run']);
  assert.equal(dry.status, 0, dry.stderr);
  assert.ok(!dry.calls.includes('url:prepare') && !dry.calls.includes('url:record'));
  const built = f.run(['--no-build']);
  assert.equal(built.status, 0, built.stderr);
  assert.ok(built.calls.includes('url:synced') && built.calls.includes('npm:check:seo'));
  assert.ok(!built.calls.includes('npm:sync') && !built.calls.includes('npm:build'));
  assert.notEqual(f.run(['--sync', '--no-build']).status, 0);
});
