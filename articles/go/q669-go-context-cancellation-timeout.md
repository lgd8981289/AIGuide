# Go context 如何传递超时和取消？cancel 后 goroutine 会自动退出吗？

[网宿科技后端面试真题](../companies/wangsu-backend.md) · [腾讯开发面试真题](../companies/tencent-development.md) · [畅天游开发面试真题](../companies/changtianyou-development.md) · [4399后端面试真题](../companies/4399-backend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/go/q669-go-context-cancellation-timeout/) · [题库目录](../../README.md)

下面是一段模拟面试对话。

🧑‍💻 **面试官：** context 调用 cancel，子 goroutine 就结束了吗？

🙋‍♂️ **我：** 它会收到取消通知，但还得由代码主动响应。

🧑‍💻 **面试官：** 如果它正在一个不看 context 的死循环里呢？

🙋‍♂️ **我：** 不会因为 cancel 就被强制杀掉。

🧑‍💻 **面试官：** 那请求已经超时，数据库可能仍然完成写入，你能直接告诉用户“肯定没成功”吗？

> context 传播的是“别再继续”的信号，不是已经停止，更不是业务操作已经撤销的证明。

## 面试速答（60 秒版）

Go context 用于在调用链里传递截止时间、取消信号和请求范围的数据。子 context 可以继承父级取消，并设置更早的截止时间。

调用 cancel 会让对应的 Done 通道关闭，相关代码可以通过 select 或支持 context 的 API 观察它。它不会强制终止 goroutine，也不会自动回滚已经完成的外部操作。

因此，工作循环要检查取消，阻塞 I/O 要使用实际支持 context 的接口；创建可取消或超时 context 后，也要及时调用 cancel 释放相关资源。

工程上还要等待任务真正退出，并区分“调用方不再等待”和“业务没有发生”。写入超时后，需要结果查询或幂等处理，不能仅凭 context 的错误就认定远端未执行。

![取消通知，和任务退出是两件事](https://note.lgdsunday.club/img/Q669/01-go-context-cancellation-timeout.webp)

## 知识点详解：通知取消以后，谁来收尾？

### 父子关系传递信号，不传递强制执行权

假设一个请求要同时查询两个下游。它们都接收从请求派生的 context。客户端离开或请求截止时，父级取消可以继续传给这两个子任务。

但 context 不掌握这两个任务执行的每一条指令。任务必须观察 Done，或者把 context 传给支持取消的调用，才有机会及时停止。[context 官方包文档](https://pkg.go.dev/context)对传播、取消和资源释放有明确说明。

### 用 Done 退出，用其他机制确认退出

下面演示 Go 的协作式取消。它与 JS AbortSignal、Python 任务取消有相近用途，但 API 和取消传播规则不同，不机械翻译成一套代码。

```go
package main

import (
    "context"
    "fmt"
)

func main() {
    ctx, cancel := context.WithCancel(context.Background())
    defer cancel()
    exited := make(chan struct{})
    go func() {
        defer close(exited)
        <-ctx.Done()
        fmt.Println(ctx.Err() == context.Canceled)
    }()
    cancel()
    <-exited
    fmt.Println("任务已退出")
}
```

Done 关闭表示可以观察到取消；exited 关闭才是这个示例里“工作函数已经执行完”的信号。两者不是同一个时刻，也不应该共用一个没有说明的布尔值来表达。

![cancel 以后，等谁真正退出？](https://note.lgdsunday.club/img/Q669/02-go-context-cancellation-timeout.webp)

### select 同时就绪时，没有“取消绝对优先”

假设 select 里既能读取任务数据，又能读取已关闭的 Done。多个分支就绪时，不能默认 Done 总会先被选中。

如果业务要求取消后严格禁止发起某个关键动作，需要在合适的提交边界再次检查，并依靠实际系统的状态或授权规则保证。context 检查本身也存在检查与执行之间的间隙，不是一个跨系统事务。

对于已经发出的远程请求，取消可能只是终止本地等待。服务端是否中止、是否已经写入，需要看接口和驱动的具体保证。[Go 关于取消数据库操作的教程](https://go.dev/doc/database/cancel-operations)给出了传递截止时间的例子，但没有把取消等同业务回滚。

![两个分支就绪，取消不自动优先](https://note.lgdsunday.club/img/Q669/03-go-context-cancellation-timeout.webp)

### cancel、超时和任务失败，要分别保留原因

创建 WithTimeout 后，即使提前成功，也应调用对应 cancel，让计时和父子关联等资源及时释放。等待超时自动发生，不是省略清理的理由。

同时，要区分 context.Canceled、DeadlineExceeded 和真正的业务错误。需要更丰富的取消原因时，可以查看版本支持的 WithCancelCause 与 Cause，而不是把所有失败都压成“超时”。

context 的 Value 适合请求范围、跨 API 边界的信息，不适合把数据库依赖、可选参数和全部业务配置都塞进去。能显式传递的关键依赖，通常更容易检查。

![本地超时，不证明远端没有写入](https://note.lgdsunday.club/img/Q669/04-go-context-cancellation-timeout.webp)

## 面试官继续追问

### 不响应 context 的函数怎么办？

先找是否有支持取消的实际接口，或者给它设置资源和并发边界。把它随手丢进另一个 goroutine，再超时返回，只是让调用者离开，后台任务可能仍然积累。必要时才考虑可终止的进程隔离等更强边界。

### 请求超时以后重试，怎么避免重复写？

用明确的业务请求身份做幂等与结果查询，检查原任务是否已经成功。取消错误只能说明当前调用观察到的状态，不能证明远端没有产生效果。

## 面试速记卡

> - 传播：父级取消和更早截止时间可以影响子 context。
> - 机制：Done 关闭供代码观察，不强制杀 goroutine。
> - 收尾：cancel 及时释放资源，退出确认另用明确同步。
> - 边界：select 不保证取消优先，取消也不等于业务回滚。
> - 重试：先查原业务结果，再用幂等避免重复效果。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **网宿科技 · Go后端 · 实习**：多个 goroutine 怎样协同，context 的 Done 信号怎样传播？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/834864582727368704)；原帖发布于 2025-12-28。
- **腾讯 · 开发（TEG；原帖未明确细分岗位） · 实习（原帖标签）**：两个 goroutine 中一个失败时，怎样利用 context 等机制让另一个也结束？（题意整理）。[面经来源](https://www.nowcoder.com/feed/main/detail/33a9b4917b1344f783d6383667328c16)；原帖编辑于 2024-03-25。
- **畅天游 · Go开发（原帖未明确细分岗位） · 校招**：Go 怎样使用 context 控制查询超时？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353156426820427776)；原帖编辑于 2020-05-12；只取畅天游段落。
- **4399 · Java后端（含 Go 提问） · 25届秋招（标题）**：Go 怎样使用 context 实现请求超时？（题意整理）。[面经来源](https://www.nowcoder.com/feed/main/detail/fdcfe849626a4711abc8d125d9702fc7)；原帖发布于 2025-04-17；只取 4399 Java 岗段落。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
