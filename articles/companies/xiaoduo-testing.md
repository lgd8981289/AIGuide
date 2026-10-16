# 晓多科技测试面试真题及答案 · Sunday面试指南

[全部公司真题](./README.md) · [在线阅读](https://note.lgdsunday.club/companies/xiaoduo/testing/)

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

## Python面试题

- [Python 的 list 和 tuple 有什么区别？什么情况下应该用元组？](../python/q566-python-list-vs-tuple.md)
  list 和 tuple 都是有顺序的序列，可以按下标读取，也可以遍历。主要区别是，列表允许修改自己的成员位置和数量，元组创建以后，这些成员引用就固定下来了。
- [pytest 的 parametrize 怎么用？参数化测试怎样覆盖正常、边界和异常输入？](../python/q616-pytest-parametrize-boundary-tests.md)
  pytest.mark.parametrize 把多组参数交给同一个测试函数，让每组输入独立运行并报告结果。它适合相同合同下的正常、边界和异常用例。

