# 云览科技开发面试真题及答案 · Sunday面试指南

[全部公司真题](./README.md) · [在线阅读](https://note.lgdsunday.club/companies/yunlan/development/)

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

## Go面试题

- [Go WaitGroup 和 errgroup 有什么区别？等待、错误与取消怎样配合？](../go/q717-go-waitgroup-errgroup-error-cancellation.md)
  Go WaitGroup 和 errgroup 有什么区别？用失败后协作取消的任务链解释 Wait、WithContext、Go1.25 WaitGroup.Go 与并发限制。
- [Go atomic 和 Mutex 有什么区别？原子更新能保证整段逻辑安全吗？](../go/q720-go-atomic-mutex-state-invariants.md)
  Go atomic 能代替 Mutex 吗？用最后一个名额解释 Load 后 Add 的逻辑竞争、CAS 重试，以及多字段状态为什么仍需要完整保护。
- [Go pprof 怎么用？CPU、堆内存和 goroutine profile 分别看什么？](../go/q722-go-pprof-cpu-heap-goroutine-profiles.md)
  Go pprof 怎么用？区分 CPU、heap、allocs 与 goroutine profile，解释采样范围、内存保留、锁竞争和可比负载下的复测方法。
- [Go goroutine 泄漏怎么排查？为什么它们一直等待却不会被 GC 清理？](../go/q723-go-goroutine-leak-diagnosis.md)
  Go goroutine 泄漏怎么排查？沿接收者离开后的发送阻塞解释 GC 边界、取消分支、有限缓冲和多次调用栈对比。

