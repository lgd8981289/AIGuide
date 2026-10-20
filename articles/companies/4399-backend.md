# 4399后端面试真题及答案 · Sunday面试指南

[全部公司真题](./README.md) · [在线阅读](https://note.lgdsunday.club/companies/4399/backend/)

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

## Go面试题

- [Go context 如何传递超时和取消？cancel 后 goroutine 会自动退出吗？](../go/q669-go-context-cancellation-timeout.md)
  Go context 如何传递超时和取消？解释取消信号的传播、观察与清理责任，而不是强制杀掉任务。
- [Go sync.Once 怎么保证只执行一次？初始化失败后还能重试吗？](../go/q670-go-sync-once-initialization.md)
  Go sync.Once 怎么保证只执行一次？解释并发初始化的执行与可见性，以及失败、panic 和重试约束。
- [Go atomic 和 Mutex 有什么区别？原子更新能保证整段逻辑安全吗？](../go/q720-go-atomic-mutex-state-invariants.md)
  Go atomic 能代替 Mutex 吗？用最后一个名额解释 Load 后 Add 的逻辑竞争、CAS 重试，以及多字段状态为什么仍需要完整保护。
- [Go 交叉编译为什么会被 CGO 卡住？GOOS、GOARCH、CGO_ENABLED 怎么配合？](../go/q726-go-cross-compilation-cgo-goos-goarch.md)
  Go 交叉编译为什么受 CGO 影响？说明 GOOS、GOARCH、CGO_ENABLED、目标 C 工具链与动态依赖，并区分构建和目标环境验收。

