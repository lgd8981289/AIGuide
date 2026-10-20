# 阿里开发面试真题及答案 · Sunday面试指南

[全部公司真题](./README.md) · [在线阅读](https://note.lgdsunday.club/companies/alibaba/development/)

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

## Agent面试题

- [Mem0 是什么？如何从对话中提取并检索 Agent 的长期记忆？](../agent/q499-mem0-agent-memory-pipeline.md)
  解释 Mem0 如何抽取和检索长期记忆，提供 TypeScript 与 Python 读取示例，并说明身份过滤、异步写入和上下文注入仍需应用处理。

## Go面试题

- [Go Mutex 和 RWMutex 怎么选？为什么不能重入，也不该复制？](../go/q719-go-mutex-rwmutex-locking.md)
  Go Mutex 与 RWMutex 怎么选？解释读写互斥、等待写者导致的递归读锁死锁、锁不能复制，以及为什么读多不保证更快。

## 计算机基础面试题

- [K 个一组反转链表怎么实现？不足 K 个节点时怎样处理？](../cs-basics/q687-reverse-nodes-k-group.md)
  K 个一组反转链表怎么实现？维护组前驱、组尾和后继，先验证长度再反转并接回。
- [二叉树的直径怎么求？为什么最长路径不一定经过根节点？](../cs-basics/q754-binary-tree-diameter-postorder.md)
  推导二叉树直径的后序计算，区分向父节点返回的高度和全局最长路径，提供非递归双语言实现，说明边数与深链空间边界。

