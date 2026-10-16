# 京东测试开发面试真题及答案 · Sunday面试指南

[全部公司真题](./README.md) · [在线阅读](https://note.lgdsunday.club/companies/jd/test-development/)

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

## Python面试题

- [Python 的 sort 和 sorted 有什么区别？为什么 sort 的返回值是 None？](../python/q571-python-sort-vs-sorted.md)
  list.sort 会直接调整当前列表里的顺序，返回 None。sorted 接收可迭代对象，生成一个新的排序列表，原容器通常不会因此被重新排列。
- [Python 的 JSON 和 pickle 有什么区别？为什么不能反序列化不可信 pickle？](../python/q603-python-json-pickle-serialization.md)
  JSON 是通用的数据交换格式，主要表达对象、数组、字符串、数字、布尔和空值。它适合跨语言接口，但不能原样保留所有 Python 类型，例如元组读回会成为列表，自定义类需要另设计字段格式。

