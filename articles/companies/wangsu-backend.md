# 网宿科技后端面试真题及答案 · Sunday面试指南

[全部公司真题](./README.md) · [在线阅读](https://note.lgdsunday.club/companies/wangsu/backend/)

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

## Go面试题

- [Go 的 GMP 调度模型是什么？G、M、P 如何配合运行 goroutine？](../go/q661-go-gmp-scheduler.md)
  Go 的 GMP 调度模型是什么？解释运行时任务、操作系统线程、执行资源与阻塞时的调度。
- [Go context 如何传递超时和取消？cancel 后 goroutine 会自动退出吗？](../go/q669-go-context-cancellation-timeout.md)
  Go context 如何传递超时和取消？解释取消信号的传播、观察与清理责任，而不是强制杀掉任务。
- [Go 垃圾回收怎么工作？三色标记、写屏障和 GOGC 分别做什么？](../go/q674-go-gc-tricolor-write-barrier.md)
  Go 垃圾回收怎么工作？理解可达性、并发维护与内存/CPU 权衡，区分算法概念和实现版本。

