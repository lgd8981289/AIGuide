# 腾讯后端面试真题及答案 · Sunday面试指南

[全部公司真题](./README.md) · [在线阅读](https://note.lgdsunday.club/companies/tencent/backend/)

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

## AI应用工程面试题

- [Redis 和数据库如何保持一致？为什么更新数据库后删缓存，仍然可能读到旧数据？](../engineering/q074-cache-database-consistency.md)
  Redis 和数据库使用 Cache-Aside 时，通常先读缓存，未命中再查数据库并回填；修改数据时，先提交数据库更新，再删除对应缓存。但是，这个顺序不能保证每个并发请求都读到最新值。

## 后端面试题

- [Java 线程池的核心参数怎么设置？队列越大越安全吗？](../backend/q157-java-thread-pool.md)
  Java 的 ThreadPoolExecutor 接到任务后，通常先补足核心线程，再尝试入队；队列放不下时，才继续创建线程，直到最大线程数。再接不下，就执行拒绝策略。因此，队列越大并不一定越安全。
- [HashMap 和 ConcurrentHashMap 有什么区别？并发读写为什么不能混用？](../backend/q158-hashmap-vs-concurrenthashmap.md)
  HashMap 不提供并发读写的同步保证。多个线程共享并修改时，需要外部同步或选择合适的并发容器。ConcurrentHashMap 支持安全的并发访问，但它不是给整个 Map 加一把大锁。读取通常不阻塞，更新按其实现协调。
- [synchronized 和 ReentrantLock 有什么区别？Java 并发加锁应该怎么选？](../backend/q222-synchronized-vs-reentrantlock.md)
  synchronized 和 ReentrantLock 都可以实现可重入的互斥访问，并提供相应的内存可见性保证。一个线程已经持有这把锁，还能再次进入受同一把锁保护的代码。
- [Java 单例模式怎么实现？双重检查锁为什么需要 volatile？](../backend/q343-singleton-safe-publication.md)
  Java 单例模式怎么实现？双重检查锁为什么需要 volatile？单例要同时说清实例创建、发布与唯一范围，实例唯一也不代表成员操作线程安全。讲清指令重排带来的风险。

## 数据库与缓存面试题

- [Redis 分布式锁怎么实现？为什么加了锁仍然可能重复执行？](../database/q088-redis-distributed-lock.md)
  Redis 分布式锁常见的基础做法，是用一条 SET 命令同时完成“不存在才设置”和“设置有效期”。锁值使用本次申请的唯一标识，释放时只有值仍属于自己，才原子删除。但这只是有租期的互斥。锁过期以后，原来的程序不会自动停止；
- [MySQL 索引为什么会失效？如何用 EXPLAIN 判断 SQL 有没有用好索引？](../database/q090-index-explain.md)
  所谓索引失效，实际要分清两种情况：查询条件无法利用索引有效定位，以及索引可用，但优化器没有选择它。例如，对索引列做函数处理、发生某些隐式转换，或者字符串查询以通配符开头，可能无法按原索引缩小范围。
- [Redis 的 RDB 和 AOF 有什么区别？宕机后哪些数据可能丢失？](../database/q094-redis-rdb-aof.md)
  RDB 保存某个时点的数据快照，文件较紧凑，恢复时直接加载快照，但快照完成以后发生的写入，单靠这份 RDB 无法找回。AOF 记录用于重建数据的写入操作。
- [数据库乐观锁和悲观锁有什么区别？version 字段怎么防止覆盖更新？](../database/q245-optimistic-vs-pessimistic-lock.md)
  悲观方案通常在事务中先锁住相关记录，再基于受保护的数据判断和更新，其他冲突操作需要等待或按配置失败。乐观方案先读取，写入时再验证数据是否仍符合旧前提。

## 计算机基础面试题

- [进程间通信有哪些方式？管道、消息队列、共享内存怎么选？](../cs-basics/q198-ipc-process-communication.md)
  IPC 是进程间交换数据或通知的机制。管道适合连接生产者和消费者；消息队列强调消息组织；共享内存让进程访问同一片数据；Socket 适合连接式通信，Unix 域 Socket 用于本机，网络 Socket 可以跨机器。

