# 快手测试开发面试真题及答案 · Sunday面试指南

[全部公司真题](./README.md) · [在线阅读](https://note.lgdsunday.club/companies/kuaishou/test-development/)

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

## Python面试题

- [Python 的 sort 和 sorted 有什么区别？为什么 sort 的返回值是 None？](../python/q571-python-sort-vs-sorted.md)
  list.sort 会直接调整当前列表里的顺序，返回 None。sorted 接收可迭代对象，生成一个新的排序列表，原容器通常不会因此被重新排列。

## 计算机基础面试题

- [全排列怎么用回溯实现？数组有重复元素时怎样去重？](../cs-basics/q690-permutations-backtracking-deduplication.md)
  全排列怎么用回溯实现？解释路径、候选、撤销选择，以及同一层重复分支的消除。
- [最长递增子序列怎么求？动态规划和二分 tails 为什么都正确？](../cs-basics/q751-longest-increasing-subsequence-dp-binary-search.md)
  用动态规划状态和最小结尾不变量解释最长递增子序列，证明 tails 二分替换为何正确，给出双语言实现、重复值边界与恢复序列思路。

