# 京东后端面试真题及答案 · Sunday面试指南

[全部公司真题](./README.md) · [在线阅读](https://note.lgdsunday.club/companies/jd/backend/)

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

## AI应用工程面试题

- [Redis 和数据库如何保持一致？为什么更新数据库后删缓存，仍然可能读到旧数据？](../engineering/q074-cache-database-consistency.md)
  Redis 和数据库使用 Cache-Aside 时，通常先读缓存，未命中再查数据库并回填；修改数据时，先提交数据库更新，再删除对应缓存。但是，这个顺序不能保证每个并发请求都读到最新值。

## 后端面试题

- [Java 线程池的核心参数怎么设置？队列越大越安全吗？](../backend/q157-java-thread-pool.md)
  Java 的 ThreadPoolExecutor 接到任务后，通常先补足核心线程，再尝试入队；队列放不下时，才继续创建线程，直到最大线程数。再接不下，就执行拒绝策略。因此，队列越大并不一定越安全。
- [HashMap 和 ConcurrentHashMap 有什么区别？并发读写为什么不能混用？](../backend/q158-hashmap-vs-concurrenthashmap.md)
  HashMap 不提供并发读写的同步保证。多个线程共享并修改时，需要外部同步或选择合适的并发容器。ConcurrentHashMap 支持安全的并发访问，但它不是给整个 Map 加一把大锁。读取通常不阻塞，更新按其实现协调。
- [Spring AOP 是什么？JDK 动态代理和 CGLIB 有什么区别？](../backend/q161-spring-aop.md)
  Spring AOP 把日志、鉴权等横切逻辑放到业务方法之外，通常通过代理在匹配的方法调用前后执行增强。JDK 动态代理基于接口，调用方通过代理暴露的接口访问；
- [消息队列如何保证顺序消费？增加消费者为什么可能破坏顺序？](../backend/q168-message-ordering.md)
  先定义顺序范围，例如同一用户或同一业务实体，而不是默认追求全局顺序。同组消息应进入能维持顺序的同一分区、队列或消息组，并在消费端按组串行处理。Broker 的投递有序，不等于异步任务完成有序。
- [JVM 内存区域有哪些？堆、虚拟机栈和元空间分别存什么？](../backend/q219-jvm-memory-areas.md)
  JVM 规范把运行时内存分成程序计数器、虚拟机栈、堆、方法区和本地方法栈等逻辑区域，运行时常量池属于方法区的一部分。程序计数器和虚拟机栈是线程私有的。每次方法调用都会对应一个栈帧，保存局部变量、操作数栈等执行信息。
- [synchronized 和 ReentrantLock 有什么区别？Java 并发加锁应该怎么选？](../backend/q222-synchronized-vs-reentrantlock.md)
  synchronized 和 ReentrantLock 都可以实现可重入的互斥访问，并提供相应的内存可见性保证。一个线程已经持有这把锁，还能再次进入受同一把锁保护的代码。
- [Java volatile 有什么作用？为什么不能保证 i++ 的线程安全？](../backend/q224-volatile-atomicity.md)
  volatile 是 Java 内存模型中的同步机制。对一个 volatile 字段的写，与后续对同一字段的读建立相应的 happens-before 关系，因此可以用于状态标记和满足条件的安全发布。但它没有提供互斥。
- [ThreadLocal 是什么？为什么在线程池中容易出现内存泄漏和数据串用？](../backend/q228-threadlocal.md)
  ThreadLocal 让不同线程分别保存和读取自己的变量值。同一个 ThreadLocal 对象，在不同线程中可以对应不同的值，不是让所有线程共享一个普通字段。线程池会复用线程，因此任务结束不等于线程结束。
- [为什么重写 equals 就要重写 hashCode？HashMap 的键为什么不宜修改？](../backend/q239-equals-hashcode.md)
  equals 定义两个对象在当前类型中算不算相等，hashCode 为哈希容器提供用于定位的整数结果。两者的契约是：equals 相等的对象必须返回相同 hashCode；
- [JVM 垃圾回收算法有哪些？标记清除、复制和标记整理有什么区别？](../backend/q246-gc-algorithms.md)
  标记清除、复制和标记整理，是理解垃圾回收如何处理空间的几种基础办法，不是三个必须二选一的收集器品牌。标记清除先识别存活对象，再回收未存活对象占用的空间，通常不移动存活对象，但可能留下外部碎片。
- [Spring MVC 请求处理流程是什么？DispatcherServlet 怎么把请求交给 Controller？](../backend/q249-spring-mvc-request-flow.md)
  Spring MVC 中，DispatcherServlet 是前端控制器，负责协调请求分派，不把所有具体处理都自己完成。HandlerMapping 根据路径、方法等条件找到处理器以及相关拦截器；
- [Java 反射机制是什么？运行时如何创建对象和调用方法？](../backend/q264-java-reflection.md)
  Java 反射让代码在运行时，通过 Class 等对象检查类型与成员，并使用 Constructor、Method、Field 等 API 创建实例、调用方法或访问字段。普通调用在编译时就写明类型和方法；
- [MyBatis 一级缓存和二级缓存有什么区别？为什么会查到旧数据？](../backend/q278-mybatis-cache.md)
  MyBatis 的一级缓存通常作用在一个 SqlSession 内。同一会话里重复执行相同查询，可能直接使用本地结果，不再查询数据库。更新、提交、回滚、关闭会话等操作会清理本地缓存，也可以把范围设成单次语句执行。
- [Java 的 fail-fast 和 fail-safe 是什么？为什么遍历 ArrayList 时删除元素会报错？](../backend/q313-java-iterator-fail-fast.md)
  Java 的 fail-fast 和 fail-safe 是什么？迭代器检测结构变化只是尽力报错，不是并发安全保证。讲清单线程也会抛异常的原因，以及什么才算结构修改。
- [Java Stream 和 parallelStream 有什么区别？并行流为什么不一定更快？](../backend/q442-java-stream-parallelstream.md)
  解释 Stream 的惰性流水线与 parallelStream 的拆分、并行和合并，用共享写入与阻塞调用说明并行不一定更快的原因。
- [MyBatis 的 Mapper 接口为什么不需要实现类？SQL 是怎样被执行的？](../backend/q473-mybatis-mapper-proxy-execution.md)
  沿着 MapperProxy、映射语句、参数处理、Executor、JDBC 和结果映射解释 MyBatis 原理，说明 namespace、方法重载及 MyBatis-Spring 会话管理边界。

## 数据库与缓存面试题

- [MySQL 索引为什么会失效？如何用 EXPLAIN 判断 SQL 有没有用好索引？](../database/q090-index-explain.md)
  所谓索引失效，实际要分清两种情况：查询条件无法利用索引有效定位，以及索引可用，但优化器没有选择它。例如，对索引列做函数处理、发生某些隐式转换，或者字符串查询以通配符开头，可能无法按原索引缩小范围。
- [Redis 为什么快？“单线程”与多线程 I/O 应该怎样理解？](../database/q095-redis-single-thread-model.md)
  Redis 快，是多个因素共同作用。常见数据操作主要访问内存，键查找和不同数据类型采用相应结构，网络事件处理也避免为每个连接都创建一个执行线程。“单线程”通常指常见命令的主要执行路径由主线程串行处理，不是说整个进程没有其他线程或子进程。
- [MySQL 深分页为什么越来越慢？游标分页和延迟关联怎么优化？](../database/q174-mysql-deep-pagination.md)
  深分页慢，通常是因为数据库要找到有序结果，再跳过前面的很多条，只返回最后一小段。加索引能改善排序和读取，但不会让大 OFFSET 自动消失。
- [MySQL 事务的四种隔离级别是什么？脏读、不可重复读和幻读有什么区别？](../database/q216-mysql-isolation-levels.md)
  事务隔离级别规定的是，多个事务同时读写时，一个事务可以看到其他事务的哪些变化。读未提交可能读到别人还没提交的数据；读已提交只读取已提交的数据，但同一事务里，两次查询可能看到不同结果。可重复读进一步保证重复读取的稳定性；
- [Redis 常用数据类型有哪些？String、Hash、List、Set、ZSet 应该怎么选？](../database/q217-redis-data-types.md)
  Redis 常见的基础类型包括 String、Hash、List、Set 和 ZSet，但 Redis 的类型并不只有这五种。String 适合保存一个完整值，例如缓存 JSON，或者配合自增命令做计数。
- [MySQL 的 InnoDB 和 MyISAM 有什么区别？为什么默认使用 InnoDB？](../database/q263-innodb-vs-myisam.md)
  InnoDB 和 MyISAM 都是 MySQL 的存储引擎，负责表数据与索引的具体组织和访问。当前 MySQL 的默认引擎是 InnoDB。

## 计算机基础面试题

- [进程、线程和协程有什么区别？CPU 密集与 I/O 密集任务怎么选？](../cs-basics/q091-process-thread-coroutine.md)
  进程是操作系统中的资源与隔离单位，通常有独立地址空间；同一进程里的线程共享很多资源，各自有执行状态，可以由操作系统调度。协程则通常由语言运行时或库安排。
- [select、poll、epoll 有什么区别？I/O 多路复用到底在复用什么？](../cs-basics/q197-io-multiplexing.md)
  select、poll 和 epoll 都能等待多个文件描述符的 I/O 状态。select 使用集合，常见 glibc fd_set 有大小限制；poll 使用描述符数组，没有同样的固定集合限制，但仍要处理扫描和传入的集合。
- [二分查找的边界怎么写？查找第一个和最后一个匹配项有什么区别？](../cs-basics/q203-binary-search-boundary.md)
  二分适用于有序数组，或者能形成单调真假分界的条件。查一个相等元素和查第一个大于等于目标的位置，是不同任务。我会先定义 lower_bound：返回首个不小于目标的位置，没有则返回 n。
- [如何判断链表有环并找到入环节点？快慢指针为什么有效？](../cs-basics/q344-linked-list-cycle.md)
  如何判断链表有环并找到入环节点？快慢指针为什么有效？快慢指针先在环内相遇，再用距离关系找到入环节点。讲清相遇点的推导过程，以及排查时真正怎么用。

