# 阿里后端面试真题及答案 · Sunday面试指南

[全部公司真题](./README.md) · [在线阅读](https://note.lgdsunday.club/companies/alibaba/backend/)

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

## 后端面试题

- [JVM 垃圾回收怎么判断对象可以回收？GC Roots 和可达性分析是什么？](../backend/q223-gc-roots-reachability.md)
  Java 的对象存活判断，主要需要理解从 GC Roots 出发的可达性分析，不是只数一个对象被引用了几次。GC Roots 是分析的起点，例如活动线程中的相关引用和 JVM 内部引用。沿引用关系能够到达的对象，仍可能被程序使用；
- [ThreadLocal 是什么？为什么在线程池中容易出现内存泄漏和数据串用？](../backend/q228-threadlocal.md)
  ThreadLocal 让不同线程分别保存和读取自己的变量值。同一个 ThreadLocal 对象，在不同线程中可以对应不同的值，不是让所有线程共享一个普通字段。线程池会复用线程，因此任务结束不等于线程结束。
- [Java AQS 是什么？它如何实现线程排队、阻塞和唤醒？](../backend/q276-aqs-queue.md)
  AQS 是 Java 用来构建锁、信号量等同步器的基础框架。它主要管理一个整型状态和等待队列，让获取失败的线程能够等待，并在资源释放后重新尝试。但是，状态代表什么、怎样才算获取成功，需要具体同步器来定义。
- [Java 内存溢出 OOM 怎么排查？如何用 Heap Dump 找到问题对象？](../backend/q279-java-oom-heapdump.md)
  排查 OOM，我会先保存完整错误信息和发生时间，区分 Java 堆、元空间、直接内存、线程等不同问题，同时查看进程和容器的资源限制。
- [Java interrupt 能直接终止线程吗？如何正确停止正在运行的任务？](../backend/q351-java-thread-interrupt.md)
  Java interrupt 能直接终止线程吗？中断只是提出停止或取消的请求，执行线程需要按约定检测、退出并释放资源。讲清 Thread.stop 为什么被废弃、如何正确响应中断。
- [JIT 和 AOT 编译有什么区别？Java 服务为什么需要预热？](../backend/q367-jit-aot-warmup.md)
  JIT 和 AOT 编译有什么区别？Java 服务为什么需要预热？JIT 利用运行时反馈生成代码，AOT 提前生成代码，启动与稳态性能应分别评估。讲清预热成本的来源与观测方式。
- [Java 线程有哪几种状态？BLOCKED、WAITING 和 TIMED_WAITING 有什么区别？](../backend/q475-java-thread-states.md)
  按 Java Thread.State 六种状态解释线程生命周期，重点区分 BLOCKED、WAITING 和 TIMED_WAITING，说明 RUNNABLE、sleep、wait 与死锁判断的常见误区。

## 数据库与缓存面试题

- [MySQL 的 ORDER BY 是怎么排序的？Using filesort 一定会写磁盘吗？](../database/q404-mysql-order-by-filesort.md)
  解释 MySQL ORDER BY 利用索引和 filesort 的条件，区分内存排序与磁盘文件，结合筛选、回表、LIMIT 与执行计划判断优化。

## 计算机基础面试题

- [进程、线程和协程有什么区别？CPU 密集与 I/O 密集任务怎么选？](../cs-basics/q091-process-thread-coroutine.md)
  进程是操作系统中的资源与隔离单位，通常有独立地址空间；同一进程里的线程共享很多资源，各自有执行状态，可以由操作系统调度。协程则通常由语言运行时或库安排。
- [HTTP 和 HTTPS 有什么区别？TLS 怎样防止窃听、篡改和冒充？](../cs-basics/q093-https-tls.md)
  HTTP 定义请求和响应的语义，HTTPS 通常指通过 TLS 保护的 HTTP 通信。HTTP/3 使用 QUIC，而 QUIC 也集成了 TLS 1.3 的安全机制。TLS 主要处理保密性、完整性和身份验证。
- [用户态和内核态有什么区别？系统调用一定会切换进程吗？](../cs-basics/q269-user-mode-kernel-mode.md)
  用户态和内核态主要区分 CPU 执行权限。应用通常在用户态运行，不能随意执行特权操作或访问受保护资源；内核在更高权限下管理内存、设备和任务等。应用通过系统调用请求内核服务时，会经受控入口进入内核，完成操作后可以返回原来的用户态执行。
- [OSI 七层模型和 TCP/IP 四层模型有什么区别？一次请求经过哪些层？](../cs-basics/q290-osi-vs-tcpip.md)
  OSI 七层是理解通信职责的参考模型；TCP/IP 四层则更贴近互联网协议体系的组织方式。两者不是两套需要同时逐层运行的机器。常见对应是：OSI 的应用、表示、会话合到 TCP/IP 应用层；传输层对应传输层；网络层对应网际层；
- [死锁产生的四个必要条件是什么？预防、避免和检测有什么区别？](../cs-basics/q328-deadlock-four-conditions.md)
  死锁产生的四个必要条件是什么？预防、避免和检测有什么区别？等待很久不一定就是死锁，关键是资源等待是否形成无法解除的闭环。讲清四个条件如何同时成立、又从哪里打破。

## 系统设计面试题

- [秒杀系统怎么设计？如何限流、扣库存并避免超卖？](../fullstack-system-design/q114-flash-sale-system-design.md)
  秒杀首先需要保护系统容量。静态资源尽量提前分发，入口做身份校验、重复请求限制与限流，不让所有请求直接进入库存和数据库。库存检查与预占必须在定义好的范围内原子完成，同时记录请求或预占 ID，避免重复请求反复扣减。
- [一致性哈希是什么？虚拟节点如何减少扩容时的数据迁移？](../fullstack-system-design/q209-consistent-hashing.md)
  直接 hash(key) mod N 分配节点，N 改变时很多键会重新映射。一致性哈希把键和节点映射到同一空间，常见环模型中由顺时针后继节点负责键，增减节点主要改变局部归属。
- [工厂模式和策略模式有什么区别？如何配合管理多种实现？](../fullstack-system-design/q361-factory-vs-strategy-pattern.md)
  工厂模式和策略模式有什么区别？如何配合管理多种实现？工厂负责准备实现，策略负责替换行为，两者可以沿明确接口配合。讲清两种模式的职责划分与协作方式。

