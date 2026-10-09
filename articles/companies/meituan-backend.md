# 美团后端面试真题及答案 · Sunday面试指南

[全部公司真题](./README.md) · [在线阅读](https://note.lgdsunday.club/companies/meituan/backend/)

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

## AI应用工程面试题

- [MySQL 明明只更新一条记录，为什么还会阻塞其他请求？](../engineering/q073-mysql-update-lock-scope.md)
  MySQL 的 UPDATE 只影响一条记录，不代表它只锁住这一条记录。要结合存储引擎、隔离级别和实际使用的索引来判断。在 InnoDB 的常见可重复读场景中，通过唯一索引定位一条已存在的记录，通常只需要锁住对应索引记录。
- [Redis 和数据库如何保持一致？为什么更新数据库后删缓存，仍然可能读到旧数据？](../engineering/q074-cache-database-consistency.md)
  Redis 和数据库使用 Cache-Aside 时，通常先读缓存，未命中再查数据库并回填；修改数据时，先提交数据库更新，再删除对应缓存。但是，这个顺序不能保证每个并发请求都读到最新值。

## 后端面试题

- [Java 线程池的核心参数怎么设置？队列越大越安全吗？](../backend/q157-java-thread-pool.md)
  Java 的 ThreadPoolExecutor 接到任务后，通常先补足核心线程，再尝试入队；队列放不下时，才继续创建线程，直到最大线程数。再接不下，就执行拒绝策略。因此，队列越大并不一定越安全。
- [Spring AOP 是什么？JDK 动态代理和 CGLIB 有什么区别？](../backend/q161-spring-aop.md)
  Spring AOP 把日志、鉴权等横切逻辑放到业务方法之外，通常通过代理在匹配的方法调用前后执行增强。JDK 动态代理基于接口，调用方通过代理暴露的接口访问；
- [Kafka、RabbitMQ、RocketMQ 有什么区别？消息队列怎么选？](../backend/q167-message-queue-selection.md)
  不能只给三种队列排一个固定性能名次。Kafka 的核心是分区日志，适合多组消费者独立读取与重放事件流；RabbitMQ 的传统队列模型通过交换机和绑定路由消息，常用于任务分发与灵活路由；
- [消息队列如何保证顺序消费？增加消费者为什么可能破坏顺序？](../backend/q168-message-ordering.md)
  先定义顺序范围，例如同一用户或同一业务实体，而不是默认追求全局顺序。同组消息应进入能维持顺序的同一分区、队列或消息组，并在消费端按组串行处理。Broker 的投递有序，不等于异步任务完成有序。
- [JVM 内存区域有哪些？堆、虚拟机栈和元空间分别存什么？](../backend/q219-jvm-memory-areas.md)
  JVM 规范把运行时内存分成程序计数器、虚拟机栈、堆、方法区和本地方法栈等逻辑区域，运行时常量池属于方法区的一部分。程序计数器和虚拟机栈是线程私有的。每次方法调用都会对应一个栈帧，保存局部变量、操作数栈等执行信息。
- [Java volatile 有什么作用？为什么不能保证 i++ 的线程安全？](../backend/q224-volatile-atomicity.md)
  volatile 是 Java 内存模型中的同步机制。对一个 volatile 字段的写，与后续对同一字段的读建立相应的 happens-before 关系，因此可以用于状态标记和满足条件的安全发布。但它没有提供互斥。
- [Java 双亲委派机制是什么？类加载器为什么要先委托给父加载器？](../backend/q226-java-parent-delegation.md)
  双亲委派通常指 ClassLoader 默认加载流程中的父委托模型。加载类时，先检查自己是否已经加载过；没有的话，先委托父加载器，父加载器找不到，再尝试自己查找和定义。这样可以让基础类尽量由一致的上层来源提供，也减少不必要的重复加载。
- [CAS 是什么？ABA 问题怎么产生，为什么加版本号能解决？](../backend/q241-cas-aba.md)
  CAS 是比较并交换：在一次原子操作中，比较当前位置与预期值；相同才更新，否则失败。它可以帮助实现单变量的条件更新，但普通读取、if 判断和赋值并不等于 CAS。常见做法是读取旧值、计算新值、尝试 CAS；失败后重新读取再计算。
- [JVM 垃圾回收算法有哪些？标记清除、复制和标记整理有什么区别？](../backend/q246-gc-algorithms.md)
  标记清除、复制和标记整理，是理解垃圾回收如何处理空间的几种基础办法，不是三个必须二选一的收集器品牌。标记清除先识别存活对象，再回收未存活对象占用的空间，通常不移动存活对象，但可能留下外部碎片。
- [Java 的 sleep 和 wait 有什么区别？分别会不会释放锁？](../backend/q257-java-sleep-vs-wait.md)
  Thread.sleep 让当前线程暂停指定时间，适合暂缓执行。线程不会因为 sleep 释放已经持有的监视器锁，所以在同步块里睡觉，其他需要这把锁的线程仍然进不来。Object.wait 则用来等待某个条件。
- [Docker 和虚拟机有什么区别？容器的隔离是怎么实现的？](../backend/q268-docker-vs-vm.md)
  虚拟机通常通过虚拟化层提供虚拟硬件，每台虚拟机运行自己的来宾操作系统和内核。普通 Linux 容器则是一组被隔离的进程，多个容器共享它们所在 Linux 环境的内核。
- [Kafka 消费者组如何分配分区？Rebalance 为什么会频繁发生？](../backend/q273-kafka-consumer-group-rebalance.md)
  在常见的消费者组订阅模式下，Kafka 把分区分配给组内成员，同一分区正常由一个成员负责。消费者可以负责多个分区，成员超过可分配分区数量时，部分成员可能空闲。
- [Java 内存溢出 OOM 怎么排查？如何用 Heap Dump 找到问题对象？](../backend/q279-java-oom-heapdump.md)
  排查 OOM，我会先保存完整错误信息和发生时间，区分 Java 堆、元空间、直接内存、线程等不同问题，同时查看进程和容器的资源限制。
- [Java 内存模型 JMM 是什么？happens-before 等于代码先执行吗？](../backend/q309-jmm-happens-before.md)
  Java 内存模型 JMM 是什么？happens-before 不等于代码先执行，跨线程正确性需要可见性与顺序保证。讲清四个动作与锁的作用，以及日志和 sleep 为什么不能当证明。
- [Kafka 的 Exactly-once 是什么？幂等生产者和事务能保证数据库只写一次吗？](../backend/q452-kafka-exactly-once-semantics.md)
  区分 Kafka 幂等生产者、事务和消费位点的保证范围，解释 read_committed，以及为什么 Kafka Exactly-once 不自动保证外部数据库只写一次。
- [Java 线程有哪几种状态？BLOCKED、WAITING 和 TIMED_WAITING 有什么区别？](../backend/q475-java-thread-states.md)
  按 Java Thread.State 六种状态解释线程生命周期，重点区分 BLOCKED、WAITING 和 TIMED_WAITING，说明 RUNNABLE、sleep、wait 与死锁判断的常见误区。
- [Kafka 为什么吞吐量高？顺序写、批处理和零拷贝分别起什么作用？](../backend/q481-kafka-high-throughput-design.md)
  从单位消息成本解释 Kafka 高吞吐，分析分区日志、批处理、页缓存、压缩与零拷贝，说明 TLS 条件、分区热点及吞吐、延迟和可靠性的取舍。
- [Nacos 如何实现服务注册与发现？服务下线后为什么还可能收到请求？](../backend/q482-nacos-service-registration-discovery.md)
  解释 Nacos 服务注册、订阅与客户端选择过程，分析实例下线后的缓存、传播、旧连接和在途请求，提供优雅退出与分层排查方法。
- [Java 的 BIO、NIO、AIO 有什么区别？阻塞、非阻塞和异步怎么区分？](../backend/q494-java-bio-nio-aio.md)
  准确区分 Java BIO、NIO、AIO 的阻塞、就绪和完成语义，说明 Selector、FileChannel、异步通道与虚拟线程边界，避免把 NIO 全部说成非阻塞。

## 数据库与缓存面试题

- [Redis 缓存穿透、击穿、雪崩有什么区别？分别怎么解决？](../database/q086-cache-penetration-breakdown-avalanche.md)
  缓存穿透、击穿和雪崩，都可能让请求大量访问数据库，但触发原因不同。穿透通常是反复查询本来就不存在的数据，缓存和数据库都没有结果。可以做参数检查、短期空值缓存，必要时用布隆过滤器提前筛选。击穿是某个热点缓存失效以后，大量请求同时回源。
- [MySQL 索引为什么用 B+ 树？与 B 树、哈希索引有什么区别？](../database/q087-b-plus-tree-index.md)
  这里通常讨论的是 InnoDB 的常见索引，不能把所有 MySQL 索引都说成同一种结构。B+ 树内部节点主要保存键和指向下一层的指针，一个页能容纳较多分支，因此树通常较矮。
- [MySQL 的 MVCC 是什么？Read View 如何决定一条记录是否可见？](../database/q089-mvcc-readview.md)
  MVCC 是多版本并发控制。InnoDB 为记录保留版本信息，并通过 undo 记录回溯旧版本，让普通一致性读能够读取符合自己快照的数据，而不必总等待其他事务的写锁。Read View 是判断版本是否可见的读取视图。
- [MySQL 索引为什么会失效？如何用 EXPLAIN 判断 SQL 有没有用好索引？](../database/q090-index-explain.md)
  所谓索引失效，实际要分清两种情况：查询条件无法利用索引有效定位，以及索引可用，但优化器没有选择它。例如，对索引列做函数处理、发生某些隐式转换，或者字符串查询以通配符开头，可能无法按原索引缩小范围。
- [Redis 为什么快？“单线程”与多线程 I/O 应该怎样理解？](../database/q095-redis-single-thread-model.md)
  Redis 快，是多个因素共同作用。常见数据操作主要访问内存，键查找和不同数据类型采用相应结构，网络事件处理也避免为每个连接都创建一个执行线程。“单线程”通常指常见命令的主要执行路径由主线程串行处理，不是说整个进程没有其他线程或子进程。
- [MySQL 的 redo log、undo log 和 binlog 有什么区别？为什么需要两阶段提交？](../database/q112-mysql-three-logs.md)
  redo log 是 InnoDB 的重做日志，支持在数据页尚未全部落盘时恢复相关修改。它不是 SQL 历史记录。undo log 保存回滚所需的记录，也参与构造一致性读所需要的旧版本。事务提交以后，不代表这些记录马上就可以全部清掉。
- [MySQL 主从复制是怎么工作的？主从延迟时怎样保证读到刚写的数据？](../database/q175-mysql-replication.md)
  MySQL 常见主从复制，是主库把变更记录到 binlog，从库接收后写入 relay log，再由应用线程执行这些变更。接收和应用是两个阶段，所以从库可能落后。异步复制不要求主库每次提交都等从库。
- [MySQL Buffer Pool 是什么？数据修改后为什么不马上写入磁盘？](../database/q176-mysql-buffer-pool.md)
  Buffer Pool 是 InnoDB 的内存缓冲区，主要缓存数据页、索引页等内容。查询先利用缓存里的页，缺少时再从磁盘读取，不是按 SQL 文本保存整份结果。更新通常先修改内存页。
- [Redis 的 ZSet 是怎么实现的？为什么会用跳表？](../database/q182-redis-zset-skiplist.md)
  ZSet 的成员唯一，每个成员有一个 score。它既支持按成员查分数，也支持按分数或排名读取有序范围。在常见的跳表编码中，字典帮助按成员定位，跳表负责维护顺序和范围。
- [Redis Sentinel 哨兵如何实现故障转移？为什么仍可能丢数据？](../database/q186-redis-sentinel.md)
  Sentinel 为 Redis 主从架构提供监控、通知、自动故障切换和主库发现。它不负责给数据分片，也不在每次业务请求中代转命令。单个 Sentinel 认为主库不可达，是主观下线；达到配置的 quorum 等条件后，才能判断客观下线。
- [Redis 常用数据类型有哪些？String、Hash、List、Set、ZSet 应该怎么选？](../database/q217-redis-data-types.md)
  Redis 常见的基础类型包括 String、Hash、List、Set 和 ZSet，但 Redis 的类型并不只有这五种。String 适合保存一个完整值，例如缓存 JSON，或者配合自增命令做计数。
- [MySQL 回表、覆盖索引和索引下推有什么区别？它们分别减少了什么开销？](../database/q318-covering-index-icp.md)
  MySQL 回表、覆盖索引和索引下推有什么区别？覆盖减少取整行的需求，下推减少不必要的取整行次数。讲清三者各自作用的环节，以及分别减少了哪一部分开销。
- [Redis 为什么使用 SDS 而不是 C 字符串？二进制安全和预分配是什么？](../database/q324-redis-sds.md)
  Redis 为什么使用 SDS 而不是 C 字符串？二进制安全和预分配是什么？显式保存长度与可用空间，才能既保存零字节，也安全管理扩容。讲清 C 字符串会踩到哪些坑。
- [Redis 渐进式 rehash 是什么？扩容时为什么还能继续处理请求？](../database/q406-redis-incremental-rehash.md)
  对照 Redis 8.2 字典源码解释渐进式 rehash 的新旧表、插入查询和迁移粒度，说明它不是零成本或必然由后台线程执行。

## 计算机基础面试题

- [select、poll、epoll 有什么区别？I/O 多路复用到底在复用什么？](../cs-basics/q197-io-multiplexing.md)
  select、poll 和 epoll 都能等待多个文件描述符的 I/O 状态。select 使用集合，常见 glibc fd_set 有大小限制；poll 使用描述符数组，没有同样的固定集合限制，但仍要处理扫描和传入的集合。
- [零拷贝是什么？sendfile 和 mmap 分别减少了哪些数据复制？](../cs-basics/q200-zero-copy.md)
  零拷贝通常指减少某条 I/O 路径上的数据复制，尤其避免数据为了转发而在内核和用户缓冲之间来回搬运，不代表完全没有设备传输和任何复制。普通 read 再 write 的文件转发，会经过用户缓冲。
- [布隆过滤器是什么？为什么会误判，又为什么不能直接删除元素？](../cs-basics/q227-bloom-filter.md)
  标准布隆过滤器用一个位数组和多个哈希函数，判断一个元素是否可能已经加入集合。加入元素时，把它映射到的多个位置设成一。查询时，只要有一个位置是零，就可以判定它没有加入；如果全部为一，只能说可能存在，因为这些位置也可能分别被其他元素设成一。
- [二叉树前序、中序、后序遍历有什么区别？递归和迭代怎样实现？](../cs-basics/q330-binary-tree-traversal.md)
  二叉树前序、中序、后序遍历有什么区别？递归和迭代怎样实现？前中后说的是根节点被处理的时机，遍历顺序与显式栈要一一对应。讲清两种写法的对应关系与常见错误。
- [最长无重复子串怎么用滑动窗口实现？为什么左边界只能向前移动？](../cs-basics/q332-longest-substring-without-repeating.md)
  最长无重复子串怎么用滑动窗口实现？为什么左边界只能向前移动？重复字符只影响当前窗口，已经离开窗口的位置不能把左边界拉回去。讲清窗口收缩的判断依据。

## 系统设计面试题

- [CAP 和 BASE 是什么？为什么不能简单理解成“三选二”？](../fullstack-system-design/q206-cap-vs-base.md)
  CAP 在其模型下说明：发生网络分区时，不能同时保证线性一致性和对所有非故障节点请求的可用性。这里的 C 不是泛指数据不出错，A 也不是服务每月可用率。不能把它理解为平时随意从三个按钮选两个。
- [分布式事务怎么实现？2PC、TCC、Saga 有什么区别？](../fullstack-system-design/q207-distributed-transaction.md)
  跨服务各自使用本地事务，无法直接靠一个普通数据库事务覆盖全部资源。2PC 让支持协议的参与者准备后统一决定提交或回滚，但有协调、等待和恢复成本。
- [分布式 ID 怎么生成？Snowflake、UUID、号段模式怎么选？](../fullstack-system-design/q208-distributed-id.md)
  常见方案有数据库序列或号段、Snowflake 类时间 ID、UUID 等。它们在协调成本、排序特性、长度和故障依赖上不同。
- [单体架构和微服务有什么区别？什么时候应该拆分服务？](../fullstack-system-design/q214-monolith-vs-microservices.md)
  单体通常作为一个部署单元，内部仍可做清晰模块化；微服务把能力拆成可独立部署的服务，强调明确职责和数据所有权。微服务适合确有独立扩缩、发布节奏和团队边界需求的系统，但增加网络失败、接口版本、跨服务一致性、可观测性和运维成本。
- [服务熔断和降级有什么区别？熔断器如何判断故障与恢复？](../fullstack-system-design/q235-circuit-breaker-degradation.md)
  服务熔断和降级解决的是两个不同的问题。熔断根据依赖调用的失败或慢调用情况，暂时阻止继续访问这个依赖，减少无效等待和故障扩散。降级则是在原能力不可用时，提供明确的替代结果，例如备用数据、缓存内容，或者直接说明暂时不可用。
- [Raft 算法是什么？Leader 选举、日志复制和多数派提交怎么理解？](../fullstack-system-design/q255-raft-consensus.md)
  Raft 是管理复制日志的共识算法，把 Leader 选举、日志复制和安全约束分别组织起来，让节点按一致的已提交命令推进状态机。节点主要有 Follower、Candidate、Leader 三种角色，用 term 区分任期。

