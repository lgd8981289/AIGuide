# 畅天游开发面试真题及答案 · Sunday面试指南

[全部公司真题](./README.md) · [在线阅读](https://note.lgdsunday.club/companies/changtianyou/development/)

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

## Go面试题

- [Go channel 有缓冲和无缓冲有什么区别？关闭后读写会发生什么？](../go/q662-go-channel-buffer-close.md)
  Go channel 有缓冲和无缓冲有什么区别？理解发送接收、阻塞、关闭和零值语义，补上 nil channel 边界。
- [Go map 为什么不能随意并发读写？sync.Map 和加锁 map 怎么选？](../go/q664-go-map-concurrency-sync-map.md)
  Go map 为什么不能随意并发读写？区分普通 map 的并发约束、锁保护范围和 sync.Map 的适用访问模式。
- [Go 的 interface 为什么不等于 nil？动态类型和动态值怎样影响判断？](../go/q665-go-interface-typed-nil.md)
  Go 的 interface 为什么不等于 nil？通过类型化 nil 指针装入接口解释判断结果和 error 返回陷阱。
- [Go context 如何传递超时和取消？cancel 后 goroutine 会自动退出吗？](../go/q669-go-context-cancellation-timeout.md)
  Go context 如何传递超时和取消？解释取消信号的传播、观察与清理责任，而不是强制杀掉任务。
- [Go 的 init 按什么顺序执行？包初始化为什么不能依赖文件名？](../go/q716-go-package-initialization-init-order.md)
  Go init 按什么顺序执行？从包依赖和变量初始化解释多个 init、文件输入顺序、空白导入，以及关键启动为什么应显式调用。

