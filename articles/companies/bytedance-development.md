# 字节开发面试真题及答案 · Sunday面试指南

[全部公司真题](./README.md) · [在线阅读](https://note.lgdsunday.club/companies/bytedance/development/)

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

## Java 面试题

- [ReentrantReadWriteLock 和 StampedLock 有什么区别？读多写少时怎么选？](../backend/q522-reentrantreadwritelock-vs-stampedlock.md)
  ReentrantReadWriteLock 与 StampedLock 怎么选？图解悲观读、乐观读验证与失败回退，解释局部副本、重入及锁降级，避免把读多写少当成性能保证。
- [Java 泛型的 extends 和 super 怎么选？PECS 为什么这样规定？](../backend/q731-java-generics-wildcards-pecs.md)
  通过集合复制解释 Java 泛型不变性、extends 与 super 的读写限制，以及 PECS 的适用条件。

## Python面试题

- [Python 切片的 start、stop、step 怎么理解？负数索引和倒序切片怎么计算？](../python/q572-python-slicing-negative-index.md)
  Python 切片通常写成 start:stop:step。start 指定起点，stop 指定停止边界，访问不包含 stop，step 决定移动方向和距离。
- [Python 的 LEGB 作用域是什么？global、nonlocal 和闭包变量怎么理解？](../python/q581-python-legb-global-nonlocal.md)
  LEGB 是理解普通函数名称查找的一种顺序。L 是当前函数，E 是包围它的外层函数，G 是所在模块，B 是内置名称。
- [Python 的 metaclass 是什么？和 `__init_subclass__` 各适合做什么？](../python/q591-python-metaclass-init-subclass.md)
  Python 的类本身也是对象。metaclass 参与创建这个类对象，默认通常是 type。它可以影响类命名空间准备、类对象创建和初始化等过程。

