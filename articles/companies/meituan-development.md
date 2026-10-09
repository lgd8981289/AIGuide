# 美团开发面试真题及答案 · Sunday面试指南

[全部公司真题](./README.md) · [在线阅读](https://note.lgdsunday.club/companies/meituan/development/)

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

## Agent面试题

- [Agent 的 Context、Memory 和 State 有什么区别？](../agent/q007-context-memory-state.md)
  Context 可以理解成这一轮真正交给模型看的信息。用户刚说的话、任务目标、最近的工具结果，都可能放进去；但系统保存过的内容，不代表模型这一轮一定看到了。State 记录的是任务现在进行到哪里。
- [Agent 上下文太长怎么办？压缩与关键信息保留](../agent/q056-agent-context-compression.md)
  Agent 的上下文压缩，不能只是把聊天记录缩写一遍。因为后面的执行依赖前面留下的目标、限制、证据和进度，漏掉其中一项，任务就可能走偏。因此，我会先把这些内容分开处理：当前目标和操作限制单独保留；已经完成的过程整理成摘要；

## 前端面试题

- [从输入 URL 到页面显示，浏览器到底经历了什么？](../frontend/q129-browser-navigation-rendering.md)
  浏览器先解析 URL，确定导航目标，再按缓存、已有连接和协议情况获取页面。需要时进行域名解析与连接建立；HTTPS 还涉及安全握手，但不能把每次导航都说成重新走完整 TCP 流程，HTTP/3 也不使用 TCP。

## 后端面试题

- [Java 线程池的核心参数怎么设置？队列越大越安全吗？](../backend/q157-java-thread-pool.md)
  Java 的 ThreadPoolExecutor 接到任务后，通常先补足核心线程，再尝试入队；队列放不下时，才继续创建线程，直到最大线程数。再接不下，就执行拒绝策略。因此，队列越大并不一定越安全。
- [HashMap 和 ConcurrentHashMap 有什么区别？并发读写为什么不能混用？](../backend/q158-hashmap-vs-concurrenthashmap.md)
  HashMap 不提供并发读写的同步保证。多个线程共享并修改时，需要外部同步或选择合适的并发容器。ConcurrentHashMap 支持安全的并发访问，但它不是给整个 Map 加一把大锁。读取通常不阻塞，更新按其实现协调。
- [synchronized 和 ReentrantLock 有什么区别？Java 并发加锁应该怎么选？](../backend/q222-synchronized-vs-reentrantlock.md)
  synchronized 和 ReentrantLock 都可以实现可重入的互斥访问，并提供相应的内存可见性保证。一个线程已经持有这把锁，还能再次进入受同一把锁保护的代码。
- [CAS 是什么？ABA 问题怎么产生，为什么加版本号能解决？](../backend/q241-cas-aba.md)
  CAS 是比较并交换：在一次原子操作中，比较当前位置与预期值；相同才更新，否则失败。它可以帮助实现单变量的条件更新，但普通读取、if 判断和赋值并不等于 CAS。常见做法是读取旧值、计算新值、尝试 CAS；失败后重新读取再计算。
- [JVM 垃圾回收算法有哪些？标记清除、复制和标记整理有什么区别？](../backend/q246-gc-algorithms.md)
  标记清除、复制和标记整理，是理解垃圾回收如何处理空间的几种基础办法，不是三个必须二选一的收集器品牌。标记清除先识别存活对象，再回收未存活对象占用的空间，通常不移动存活对象，但可能留下外部碎片。
- [Java 接口和抽象类有什么区别？有了 default 方法还需要抽象类吗？](../backend/q282-java-interface-vs-abstract-class.md)
  Java 接口主要描述一组能力或约定，一个类可以实现多个接口。现代接口不只有抽象方法，还可以有 default、静态方法，以及符合规则的私有辅助方法，但没有每个实现对象独立保存的接口实例字段，也没有实例构造器。
- [Java 内存模型 JMM 是什么？happens-before 等于代码先执行吗？](../backend/q309-jmm-happens-before.md)
  Java 内存模型 JMM 是什么？happens-before 不等于代码先执行，跨线程正确性需要可见性与顺序保证。讲清四个动作与锁的作用，以及日志和 sleep 为什么不能当证明。

## 数据库与缓存面试题

- [Redis 缓存穿透、击穿、雪崩有什么区别？分别怎么解决？](../database/q086-cache-penetration-breakdown-avalanche.md)
  缓存穿透、击穿和雪崩，都可能让请求大量访问数据库，但触发原因不同。穿透通常是反复查询本来就不存在的数据，缓存和数据库都没有结果。可以做参数检查、短期空值缓存，必要时用布隆过滤器提前筛选。击穿是某个热点缓存失效以后，大量请求同时回源。
- [MySQL 索引为什么用 B+ 树？与 B 树、哈希索引有什么区别？](../database/q087-b-plus-tree-index.md)
  这里通常讨论的是 InnoDB 的常见索引，不能把所有 MySQL 索引都说成同一种结构。B+ 树内部节点主要保存键和指向下一层的指针，一个页能容纳较多分支，因此树通常较矮。
- [Redis 的大 Key 和热 Key 有什么区别？应该怎么发现和处理？](../database/q184-redis-big-key-hot-key.md)
  大 Key 指单键的数据量、元素量或操作代价过大；热 Key 指访问或修改集中在少数键。小值也能很热，大集合也可能几乎没人访问。大 Key 会影响内存、网络、命令耗时和删除回收；热 Key 则可能让单节点、CPU 或网络成为瓶颈。
- [Redis 主从复制怎么工作？全量同步和增量同步如何切换？](../database/q185-redis-replication.md)
  Redis 复制通常先让从库获得基准数据，再持续接收主库的变更流。全量同步会传输数据集，并补上同步期间的后续变更。断线重连时，从库带着复制 ID 和已处理的 offset 发起 PSYNC。
- [Redis Cluster 为什么使用哈希槽？扩容时数据和请求怎么迁移？](../database/q187-redis-cluster.md)
  Redis Cluster 把键空间划成 16384 个哈希槽，键通常按 CRC16(key) 对 16384 取模得到槽号，再由槽的归属找到主节点。节点增减通过迁移槽调整数据分布，不是简单改成 hash(key) % 节点数。

