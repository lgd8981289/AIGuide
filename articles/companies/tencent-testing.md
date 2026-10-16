# 腾讯测试面试真题及答案 · Sunday面试指南

[全部公司真题](./README.md) · [在线阅读](https://note.lgdsunday.club/companies/tencent/testing/)

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

## Python面试题

- [Python 的 list 和 tuple 有什么区别？什么情况下应该用元组？](../python/q566-python-list-vs-tuple.md)
  list 和 tuple 都是有顺序的序列，可以按下标读取，也可以遍历。主要区别是，列表允许修改自己的成员位置和数量，元组创建以后，这些成员引用就固定下来了。
- [pytest 的 fixture 是什么？scope 和 yield 如何影响测试隔离？](../python/q615-pytest-fixture-scope-yield.md)
  pytest fixture 把测试资源的准备、依赖和清理组织在一起。测试通过名字请求它，pytest 在适当时机创建并提供结果。

