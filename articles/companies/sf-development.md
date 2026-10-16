# 顺丰开发面试真题及答案 · Sunday面试指南

[全部公司真题](./README.md) · [在线阅读](https://note.lgdsunday.club/companies/sf/development/)

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

## Python面试题

- [Python 的 list 和 tuple 有什么区别？什么情况下应该用元组？](../python/q566-python-list-vs-tuple.md)
  list 和 tuple 都是有顺序的序列，可以按下标读取，也可以遍历。主要区别是，列表允许修改自己的成员位置和数量，元组创建以后，这些成员引用就固定下来了。
- [Python 的 try、except、else、finally 按什么顺序执行？return 遇到异常会怎样？](../python/q578-python-try-except-else-finally.md)
  try 中的代码先执行。出现异常时，解释器寻找匹配的 except；try 正常执行到末尾，才进入 else。finally 在这段控制流离开前执行，通常用来收尾。
- [Python 代码是怎么执行的？字节码、pyc 和解释器分别做什么？](../python/q580-python-bytecode-pyc-execution.md)
  以 CPython 为例，源代码会经过解析和编译，形成代码对象，其中包含字节码等执行所需信息，再由解释器运行。

