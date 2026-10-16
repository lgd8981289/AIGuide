# 字节测试开发面试真题及答案 · Sunday面试指南

[全部公司真题](./README.md) · [在线阅读](https://note.lgdsunday.club/companies/bytedance/test-development/)

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

## Python面试题

- [Python 的 list 和 tuple 有什么区别？什么情况下应该用元组？](../python/q566-python-list-vs-tuple.md)
  list 和 tuple 都是有顺序的序列，可以按下标读取，也可以遍历。主要区别是，列表允许修改自己的成员位置和数量，元组创建以后，这些成员引用就固定下来了。
- [Python 字典底层是什么结构？为什么查找快，还能保留插入顺序？](../python/q568-python-dict-implementation-order.md)
  Python 的 dict 是键值映射。CPython 使用哈希表相关结构，通过键的哈希值缩小查找范围，再结合键的相等关系确认目标。

