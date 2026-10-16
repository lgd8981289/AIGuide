# 网易后端面试真题及答案 · Sunday面试指南

[全部公司真题](./README.md) · [在线阅读](https://note.lgdsunday.club/companies/netease/backend/)

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

## Java 面试题

- [Java 自动装箱和拆箱是什么？Integer 缓存与空指针异常怎么产生？](../backend/q654-java-boxing-unboxing-integer-cache.md)
  Java 自动装箱和拆箱是什么？解释基本类型与包装类型转换、引用比较和隐式拆箱风险。

## Python面试题

- [Python 的 metaclass 是什么？和 `__init_subclass__` 各适合做什么？](../python/q591-python-metaclass-init-subclass.md)
  Python 的类本身也是对象。metaclass 参与创建这个类对象，默认通常是 type。它可以影响类命名空间准备、类对象创建和初始化等过程。
- [Python 程序运行慢怎么排查？cProfile 如何区分热点函数和等待时间？](../python/q618-python-cprofile-performance.md)
  排查 Python 性能，先固定输入和测量范围，再记录整体耗时。接口响应慢时，还要区分计算、网络等待、数据库等待和排队。

