# 百度算法面试真题及答案 · Sunday面试指南

[全部公司真题](./README.md) · [在线阅读](https://note.lgdsunday.club/companies/baidu/algorithm/)

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

## Python面试题

- [Python 的 set 和 frozenset 怎么选？交集、差集和集合去重有哪些限制？](../python/q570-python-set-frozenset.md)
  set 和 frozenset 都用于保存不重复的成员，也支持交集、并集、差集等集合运算。set 可以调整成员，frozenset 创建以后成员集合固定。
- [Python 的 read、readline、readlines 有什么区别？大文件应该怎么读取？](../python/q605-python-file-read-streaming.md)
  read 不给大小时通常读取剩余内容；readline 读取一行；readlines 返回行列表，可能一次保留大量字符串。文件迭代也按行提供内容，适合逐行处理。

## 计算机基础面试题

- [最长公共子序列怎么求？为什么它和最长公共子串不是同一道题？](../cs-basics/q691-longest-common-subsequence.md)
  最长公共子序列怎么求？用不要求连续的匹配目标推导二维前缀状态，比较连续子串。

