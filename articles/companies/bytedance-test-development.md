# 字节测试开发面试真题及答案 · Sunday面试指南

[全部公司真题](./README.md) · [在线阅读](https://note.lgdsunday.club/companies/bytedance/test-development/)

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

## Java 面试题

- [TreeMap 和 HashMap 有什么区别？floorKey、ceilingKey 如何做范围查找？](../backend/q733-java-treemap-navigablemap-range-queries.md)
  对比 TreeMap 与 HashMap，解释 floorKey、ceilingKey 的边界、比较器身份和 subMap 关联视图。

## Python面试题

- [Python 的 list 和 tuple 有什么区别？什么情况下应该用元组？](../python/q566-python-list-vs-tuple.md)
  list 和 tuple 都是有顺序的序列，可以按下标读取，也可以遍历。主要区别是，列表允许修改自己的成员位置和数量，元组创建以后，这些成员引用就固定下来了。
- [Python 字典底层是什么结构？为什么查找快，还能保留插入顺序？](../python/q568-python-dict-implementation-order.md)
  Python 的 dict 是键值映射。CPython 使用哈希表相关结构，通过键的哈希值缩小查找范围，再结合键的相等关系确认目标。

## Go面试题

- [Go 的 make 和 new 有什么区别？为什么 new(map) 后不能直接写？](../go/q712-go-make-new-zero-values.md)
  Go make 和 new 有什么区别？拆开 new(map) 的指针与 nil map，比较 slice、map、channel 零值操作，并补充 Go1.26 new(表达式) 的变化。

## 计算机基础面试题

- [最小覆盖子串怎么求？重复字符为什么必须按数量匹配？](../cs-basics/q752-minimum-window-substring-counts.md)
  从重复字符计数推导最小覆盖子串，讲清缺口、扩张和收缩条件，提供 TypeScript、Python 线性实现及空串、Unicode 边界。

