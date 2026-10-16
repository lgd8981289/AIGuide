# 大华开发面试真题及答案 · Sunday面试指南

[全部公司真题](./README.md) · [在线阅读](https://note.lgdsunday.club/companies/dahua/development/)

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

## Python面试题

- [Python 的 list 和 tuple 有什么区别？什么情况下应该用元组？](../python/q566-python-list-vs-tuple.md)
  list 和 tuple 都是有顺序的序列，可以按下标读取，也可以遍历。主要区别是，列表允许修改自己的成员位置和数量，元组创建以后，这些成员引用就固定下来了。
- [Python 的 set 和 frozenset 怎么选？交集、差集和集合去重有哪些限制？](../python/q570-python-set-frozenset.md)
  set 和 frozenset 都用于保存不重复的成员，也支持交集、并集、差集等集合运算。set 可以调整成员，frozenset 创建以后成员集合固定。
- [Python 的 LEGB 作用域是什么？global、nonlocal 和闭包变量怎么理解？](../python/q581-python-legb-global-nonlocal.md)
  LEGB 是理解普通函数名称查找的一种顺序。L 是当前函数，E 是包围它的外层函数，G 是所在模块，B 是内置名称。
- [Python 的类属性和实例属性有什么区别？为什么多个对象会共享同一个列表？](../python/q585-python-class-instance-attributes.md)
  类属性保存在类上，可以表达同一类对象共享的设置或状态。实例属性通常在初始化时通过 self.xxx 建立，用来保存每个对象自己的数据。
- [Python 的单下划线、双下划线和双端下划线有什么区别？](../python/q592-python-underscore-name-mangling.md)
  单前导下划线通常表示内部使用的约定，不是强制私有权限。普通 from module import 也会受它影响，但显式导入仍可以访问；__all__ 还能明确导出名单。

