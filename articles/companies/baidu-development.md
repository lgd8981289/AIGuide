# 百度开发面试真题及答案 · Sunday面试指南

[全部公司真题](./README.md) · [在线阅读](https://note.lgdsunday.club/companies/baidu/development/)

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

## Go面试题

- [Go Mutex 和 RWMutex 怎么选？为什么不能重入，也不该复制？](../go/q719-go-mutex-rwmutex-locking.md)
  Go Mutex 与 RWMutex 怎么选？解释读写互斥、等待写者导致的递归读锁死锁、锁不能复制，以及为什么读多不保证更快。

## 数据库与缓存面试题

- [MySQL 的 Nested Loop Join 和 Hash Join 有什么区别？关联查询为什么会慢？](../database/q525-mysql-nested-loop-vs-hash-join.md)
  MySQL Nested Loop Join 和 Hash Join 有什么区别？用逐行索引查找与哈希匹配图解连接过程，说明重复键、过滤和内存溢出的影响，以及如何检查实际执行计划。

## 计算机基础面试题

- [滑动窗口最大值怎么求？单调队列为什么能做到 O(n)？](../cs-basics/q692-sliding-window-maximum-deque.md)
  滑动窗口最大值怎么求？维护仍可能成为最大值的下标，处理过期和被支配候选。

