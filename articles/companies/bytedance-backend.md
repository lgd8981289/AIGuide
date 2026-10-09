# 字节后端面试真题及答案 · Sunday面试指南

[全部公司真题](./README.md) · [在线阅读](https://note.lgdsunday.club/companies/bytedance/backend/)

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

## 前端面试题

- [从输入 URL 到页面显示，浏览器到底经历了什么？](../frontend/q129-browser-navigation-rendering.md)
  浏览器先解析 URL，确定导航目标，再按缓存、已有连接和协议情况获取页面。需要时进行域名解析与连接建立；HTTPS 还涉及安全握手，但不能把每次导航都说成重新走完整 TCP 流程，HTTP/3 也不使用 TCP。

## 后端面试题

- [消息队列如何保证消息不丢失？为什么收到 ACK 还不一定代表业务完成？](../backend/q113-message-queue-reliability.md)
  消息是否可靠，需要分别检查业务到生产者、生产者到 Broker、Broker 存储与复制，以及消费者处理这几段。生产者要处理发送失败和确认不确定，Broker 要按产品机制配置持久化、复制与故障恢复。
- [HashMap 和 ConcurrentHashMap 有什么区别？并发读写为什么不能混用？](../backend/q158-hashmap-vs-concurrenthashmap.md)
  HashMap 不提供并发读写的同步保证。多个线程共享并修改时，需要外部同步或选择合适的并发容器。ConcurrentHashMap 支持安全的并发访问，但它不是给整个 Map 加一把大锁。读取通常不阻塞，更新按其实现协调。
- [Spring 的 @Transactional 为什么会失效？事务传播行为怎么选？](../backend/q162-spring-transaction-failure.md)
  @Transactional 是事务配置元数据，不是写上去就一定生效。默认代理模式下，要通过容器管理的代理进入匹配的方法；内部调用、自己创建对象或不合适的方法与代理配置，都可能让预期事务没有建立。事务建立后，还要看回滚规则。
- [ThreadLocal 是什么？为什么在线程池中容易出现内存泄漏和数据串用？](../backend/q228-threadlocal.md)
  ThreadLocal 让不同线程分别保存和读取自己的变量值。同一个 ThreadLocal 对象，在不同线程中可以对应不同的值，不是让所有线程共享一个普通字段。线程池会复用线程，因此任务结束不等于线程结束。
- [Spring 的 @Async 为什么会失效？异步方法的线程池和异常怎么处理？](../backend/q474-spring-async-execution.md)
  解释 Spring @Async 的代理调用与自身调用失效，区分线程池排队、Future 和 void 异常处理，讲清事务、ThreadLocal 与重要任务持久化的边界。

## 数据库与缓存面试题

- [Redis 分布式锁怎么实现？为什么加了锁仍然可能重复执行？](../database/q088-redis-distributed-lock.md)
  Redis 分布式锁常见的基础做法，是用一条 SET 命令同时完成“不存在才设置”和“设置有效期”。锁值使用本次申请的唯一标识，释放时只有值仍属于自己，才原子删除。但这只是有租期的互斥。锁过期以后，原来的程序不会自动停止；
- [MySQL 主从复制是怎么工作的？主从延迟时怎样保证读到刚写的数据？](../database/q175-mysql-replication.md)
  MySQL 常见主从复制，是主库把变更记录到 binlog，从库接收后写入 relay log，再由应用线程执行这些变更。接收和应用是两个阶段，所以从库可能落后。异步复制不要求主库每次提交都等从库。
- [Redis 事务和 Lua 脚本有什么区别？原子执行等于失败回滚吗？](../database/q188-redis-transaction-lua.md)
  Redis 的 MULTI 把命令入队，EXEC 时按顺序集中执行，其间不会插入其他客户端的普通命令。但执行期某条命令报错，不会自动回滚此前成功的修改，其他排队命令仍可能继续执行。
- [Redis Pipeline 为什么能提高吞吐量？和批量命令、事务有什么区别？](../database/q189-redis-pipeline.md)
  Redis Pipeline 是客户端连续发送多条命令，不在每条后都停下来等待回复，再按顺序处理结果。它主要减少往返等待，并提高批量 IO 效率。服务器仍要执行这些命令，Pipeline 不把十条操作变成一条，也不保证整批原子执行。
- [MySQL Online DDL 是什么？ALGORITHM=INSTANT、INPLACE 和 COPY 有什么区别？](../database/q321-mysql-online-ddl.md)
  MySQL Online DDL 是什么？ALGORITHM=INSTANT、INPLACE 和 COPY 有什么区别？在线能力取决于具体操作和版本，不代表完全无锁、无重建。讲清三种算法的代价与适用条件。

## 计算机基础面试题

- [进程、线程和协程有什么区别？CPU 密集与 I/O 密集任务怎么选？](../cs-basics/q091-process-thread-coroutine.md)
  进程是操作系统中的资源与隔离单位，通常有独立地址空间；同一进程里的线程共享很多资源，各自有执行状态，可以由操作系统调度。协程则通常由语言运行时或库安排。
- [TCP 为什么要三次握手、四次挥手？TIME_WAIT 有什么作用？](../cs-basics/q092-tcp-handshake-termination.md)
  TCP 三次握手的核心，是同步双方初始序号，并确认各自发送的 SYN 已经被对方收到。客户端先发 SYN，服务端用 SYN 加 ACK 既确认客户端，又提出自己的序号，客户端再发 ACK 确认服务端。
- [HTTP 和 HTTPS 有什么区别？TLS 怎样防止窃听、篡改和冒充？](../cs-basics/q093-https-tls.md)
  HTTP 定义请求和响应的语义，HTTPS 通常指通过 TLS 保护的 HTTP 通信。HTTP/3 使用 QUIC，而 QUIC 也集成了 TLS 1.3 的安全机制。TLS 主要处理保密性、完整性和身份验证。
- [虚拟内存是什么？页表、TLB 和缺页异常如何配合？](../cs-basics/q196-virtual-memory.md)
  程序通常使用虚拟地址，硬件结合页表把它翻译到物理页。这样可以隔离进程、控制访问，也能让不连续物理页组成连续的虚拟地址范围。页表保存映射，TLB 缓存地址翻译。
- [进程间通信有哪些方式？管道、消息队列、共享内存怎么选？](../cs-basics/q198-ipc-process-communication.md)
  IPC 是进程间交换数据或通知的机制。管道适合连接生产者和消费者；消息队列强调消息组织；共享内存让进程访问同一片数据；Socket 适合连接式通信，Unix 域 Socket 用于本机，网络 Socket 可以跨机器。
- [互斥锁、自旋锁和信号量有什么区别？等待资源时该睡眠还是忙等？](../cs-basics/q199-mutex-spinlock-semaphore.md)
  互斥锁主要提供独占临界区，并通常有持有者语义。自旋锁获取失败时反复检查，消耗 CPU，适合很短、能很快结束的临界区，不适合在持锁期间做耗时或阻塞操作。信号量管理可用许可计数。计数为零时等待，释放后允许继续；
- [OSI 七层模型和 TCP/IP 四层模型有什么区别？一次请求经过哪些层？](../cs-basics/q290-osi-vs-tcpip.md)
  OSI 七层是理解通信职责的参考模型；TCP/IP 四层则更贴近互联网协议体系的组织方式。两者不是两套需要同时逐层运行的机器。常见对应是：OSI 的应用、表示、会话合到 TCP/IP 应用层；传输层对应传输层；网络层对应网际层；
- [操作系统的进程调度算法有哪些？时间片轮转和多级反馈队列有什么区别？](../cs-basics/q293-process-scheduling.md)
  进程调度从就绪任务中选择下一位使用 CPU 的任务。先来先服务按到达顺序，短任务优先更关注完成时间，优先级调度按优先级，时间片轮转则让就绪任务轮流运行一段时间。
- [HTTP Keep-Alive 和 TCP Keepalive 有什么区别？长连接能保证对方一直在线吗？](../cs-basics/q326-http-keepalive-tcp-keepalive.md)
  HTTP Keep-Alive 和 TCP Keepalive 有什么区别？长连接能保证对方一直在线吗？连接复用、空闲探测和业务健康是三个不同目的。讲清三者各自解决什么、又解决不了什么。
- [最长无重复子串怎么用滑动窗口实现？为什么左边界只能向前移动？](../cs-basics/q332-longest-substring-without-repeating.md)
  最长无重复子串怎么用滑动窗口实现？为什么左边界只能向前移动？重复字符只影响当前窗口，已经离开窗口的位置不能把左边界拉回去。讲清窗口收缩的判断依据。
- [僵尸进程和孤儿进程有什么区别？为什么 kill 不掉僵尸进程？](../cs-basics/q355-zombie-orphan-process.md)
  僵尸进程和孤儿进程有什么区别？为什么 kill 不掉僵尸进程？僵尸已经退出但尚未被回收，孤儿只是父进程先退出，两者不能混为一谈。讲清资源回收的责任在谁手上。
- [fork 和 exec 有什么区别？写时复制 COW 是怎么工作的？](../cs-basics/q356-fork-exec-copy-on-write.md)
  fork 和 exec 有什么区别？写时复制 COW 是怎么工作的？fork 创建子进程，exec 替换程序映像，私有内存通常在写入时才复制页面。讲清两个调用为何总是成对出现。
- [哈希冲突怎么解决？链地址法和开放寻址法有什么区别？](../cs-basics/q489-hash-collision-resolution.md)
  对比链地址法与开放寻址法，通过冲突和删除算例解释探测路径、墓碑、实际键比较、负载因子与扩容，说明平均复杂度和最坏情况边界。
- [合并区间怎么做？为什么要先按区间左端点排序？](../cs-basics/q491-merge-intervals.md)
  提供 TS、Python 合并区间实现，解释左端点排序、包含关系与不变条件，区分闭区间和半开区间，分析最后追加、输入校验及时间空间复杂度。

## 系统设计面试题

- [分布式事务怎么实现？2PC、TCC、Saga 有什么区别？](../fullstack-system-design/q207-distributed-transaction.md)
  跨服务各自使用本地事务，无法直接靠一个普通数据库事务覆盖全部资源。2PC 让支持协议的参与者准备后统一决定提交或回滚，但有协调、等待和恢复成本。
- [分库分表怎么设计？分片键、跨库查询和在线扩容怎么处理？](../fullstack-system-design/q210-sharding.md)
  分库分表可以按职责垂直拆分，也可以按分片键把同结构数据水平分到多个表或库。它用于处理单节点容量与负载约束，不是数据库变大就自动必须做。水平分片先看访问模式。能带分片键的查询可以定向路由，不带就可能散射到多片再汇总；

