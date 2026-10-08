# 阿里后端面试真题及答案 · Sunday面试指南

[全部公司真题](./README.md) · [在线阅读](https://note.lgdsunday.club/companies/alibaba/backend/)

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

## 后端面试题

- [ThreadLocal 是什么？为什么在线程池中容易出现内存泄漏和数据串用？](../backend/q228-threadlocal.md)
  ThreadLocal 让不同线程分别保存和读取自己的变量值。同一个 ThreadLocal 对象，在不同线程中可以对应不同的值，不是让所有线程共享一个普通字段。线程池会复用线程，因此任务结束不等于线程结束。
- [Java 内存溢出 OOM 怎么排查？如何用 Heap Dump 找到问题对象？](../backend/q279-java-oom-heapdump.md)
  排查 OOM，我会先保存完整错误信息和发生时间，区分 Java 堆、元空间、直接内存、线程等不同问题，同时查看进程和容器的资源限制。

## 计算机基础面试题

- [进程、线程和协程有什么区别？CPU 密集与 I/O 密集任务怎么选？](../cs-basics/q091-process-thread-coroutine.md)
  进程是操作系统中的资源与隔离单位，通常有独立地址空间；同一进程里的线程共享很多资源，各自有执行状态，可以由操作系统调度。协程则通常由语言运行时或库安排。
- [HTTP 和 HTTPS 有什么区别？TLS 怎样防止窃听、篡改和冒充？](../cs-basics/q093-https-tls.md)
  HTTP 定义请求和响应的语义，HTTPS 通常指通过 TLS 保护的 HTTP 通信。HTTP/3 使用 QUIC，而 QUIC 也集成了 TLS 1.3 的安全机制。TLS 主要处理保密性、完整性和身份验证。
- [OSI 七层模型和 TCP/IP 四层模型有什么区别？一次请求经过哪些层？](../cs-basics/q290-osi-vs-tcpip.md)
  OSI 七层是理解通信职责的参考模型；TCP/IP 四层则更贴近互联网协议体系的组织方式。两者不是两套需要同时逐层运行的机器。常见对应是：OSI 的应用、表示、会话合到 TCP/IP 应用层；传输层对应传输层；网络层对应网际层；
- [死锁产生的四个必要条件是什么？预防、避免和检测有什么区别？](../cs-basics/q328-deadlock-four-conditions.md)
  死锁产生的四个必要条件是什么？预防、避免和检测有什么区别？等待很久不一定就是死锁，关键是资源等待是否形成无法解除的闭环。讲清四个条件如何同时成立、又从哪里打破。

