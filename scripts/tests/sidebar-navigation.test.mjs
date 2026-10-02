import { test } from 'node:test';
import assert from 'node:assert/strict';
import { navigationContextKey, resolveNavigationReturn } from '../../src/lib/navigation-context.mjs';

const target = { category: 'database', topic: 'database:redis', paths: ['/', '/programmer/', '/database/'], origin: 'https://note.lgdsunday.club' };
const context = { category: target.category, topic: target.topic, href: '/programmer/?category=database&topic=database%3Aredis&sort=series&page=2' };

test('返回列表保留筛选、排序及分页，支持首页来源', () => {
  assert.equal(resolveNavigationReturn(context, target), context.href);
  assert.equal(resolveNavigationReturn({ ...context, href: '/?category=database' }, target), '/?category=database');
});
test('不同分类、专题的阅读上下文互不覆盖', () => {
  assert.notEqual(navigationContextKey('programmer', 'database', 'database:redis'), navigationContextKey('programmer', 'database', 'database:mysql'));
  assert.equal(resolveNavigationReturn({ ...context, topic: 'database:mysql' }, target), null);
  assert.equal(resolveNavigationReturn({ ...context, category: 'frontend' }, target), null);
});
test('拒绝站外地址、脚本协议与文章地址，损坏记录使用静态返回链接', () => {
  for (const href of ['https://example.com/database/', '//example.com/database/', 'javascript:alert(1)', '/database/q086/', '/frontend/']) {
    assert.equal(resolveNavigationReturn({ ...context, href }, target), null);
  }
  for (const record of [null, {}, { ...context, href: 12 }, { ...context, href: '' }]) {
    assert.equal(resolveNavigationReturn(record, target), null);
  }
});
test('支持部署前缀，同源绝对地址规范化为站内地址', () => {
  assert.equal(resolveNavigationReturn({ ...context, href: 'https://note.lgdsunday.club/note/database/?topic=database%3Aredis#old' }, { ...target, paths: ['/note/database/'] }), '/note/database/?topic=database%3Aredis');
});
