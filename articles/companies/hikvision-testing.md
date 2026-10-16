# 海康威视测试面试真题及答案 · Sunday面试指南

[全部公司真题](./README.md) · [在线阅读](https://note.lgdsunday.club/companies/hikvision/testing/)

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

## Python面试题

- [Python 切片的 start、stop、step 怎么理解？负数索引和倒序切片怎么计算？](../python/q572-python-slicing-negative-index.md)
  Python 切片通常写成 start:stop:step。start 指定起点，stop 指定停止边界，访问不包含 stop，step 决定移动方向和距离。
- [Python 的 and、or 为什么不一定返回布尔值？默认值判断有哪些坑？](../python/q576-python-and-or-truthiness.md)
  Python 的 and、or 会根据操作数的真值决定是否继续计算，结果通常直接返回某个操作数，不一定是布尔值。
- [Python 的 try、except、else、finally 按什么顺序执行？return 遇到异常会怎样？](../python/q578-python-try-except-else-finally.md)
  try 中的代码先执行。出现异常时，解释器寻找匹配的 except；try 正常执行到末尾，才进入 else。finally 在这段控制流离开前执行，通常用来收尾。

