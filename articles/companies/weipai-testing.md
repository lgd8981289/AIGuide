# 微派测试面试真题及答案 · Sunday面试指南

[全部公司真题](./README.md) · [在线阅读](https://note.lgdsunday.club/companies/weipai/testing/)

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

## Python面试题

- [Python 的 pytest 和 unittest 有什么区别？已有 unittest 用例能继续用吗？](../python/q614-python-pytest-vs-unittest.md)
  unittest 是 Python 标准库测试框架，常用 TestCase、setUp、tearDown 和 assert 方法组织用例。pytest 支持函数式用例、普通 assert 的失败展示、fixture 和参数化等扩展。
- [pytest 的 fixture 是什么？scope 和 yield 如何影响测试隔离？](../python/q615-pytest-fixture-scope-yield.md)
  pytest fixture 把测试资源的准备、依赖和清理组织在一起。测试通过名字请求它，pytest 在适当时机创建并提供结果。

