# Go Timer 和 Ticker 有什么区别？Stop、Reset 与通道语义怎样受版本影响？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/go/q721-go-timer-ticker-stop-reset/) · [题库目录](../../README.md)

以下是一段用于讲解的模拟面试对话。

🧑‍💻 **面试官：** 一次超时和周期性刷新，分别用什么？

🙋‍♂️ **我：** 一次用 Timer，周期用 Ticker，结束时都 Stop。

🧑‍💻 **面试官：** Stop 以后，等通道关闭的 goroutine 会退出吗？

🙋‍♂️ **我：** 应该可以等到关闭。

🧑‍💻 **面试官：** 它们的 Stop 并不关闭通道。另外，旧教程要求 Reset 前先排空，当前版本还必须原样照抄吗？

> 定时器是否继续发通知，与等待者如何结束，是两条不同的生命周期；Stop、Reset 的保证还要结合采用的 Go 定时器语义。

## 面试速答（60 秒版）

Timer 用于一次时间到达的通知，Ticker 用于按周期产生通知。Ticker 的消费者太慢时，通知可能被调整或丢弃，它不是每个周期都必须保存的可靠任务队列。

Stop 用于停止未来通知，但不会关闭 C 通道，所以单纯 range 等它关闭，不能结束后台 goroutine。退出应另外使用 context 或 done 信号。

本题以 Go 1.27 为准。基于通道的定时器在 Stop、Reset 返回后，不会再收到旧配置对应的过期值；不再被引用的 Timer、Ticker 也可以被 GC 回收。1.27 已移除旧语义开关，time 创建的通道固定采用同步语义。

因此不能把旧教程的 Stop、排空、Reset 模板无条件复制到新代码里，尤其多接收者并发使用时，更要明确谁拥有定时器。

![Timer 一次，Ticker 周期](https://note.lgdsunday.club/img/Q721/01-go-timer-ticker-stop-reset.webp)

## 知识点详解：停止计时以后，等待的人为什么还在？

### Timer 是一次通知，Ticker 是节拍

假设任务要在 2 秒后检查一次，可以用 Timer；如果要每隔一段时间尝试刷新，可以用 Ticker。它们提供的是时间通知，不负责确保你的业务工作按时完成。

如果一次刷新比周期还长，Ticker 不会为你无限积压每个错过的 tick。需要“上次结束后再等一段时间”，可以在工作完成后重新安排 Timer；需要可靠保存每次调度任务，则应使用持久化调度设计。

[time 包](https://pkg.go.dev/time#Ticker)明确描述了慢接收者情况下的调整与丢弃行为。

### Stop 不负责关闭通道

```go
package main

import (
    "fmt"
    "time"
)

func main() {
    t := time.NewTimer(time.Hour)
    fmt.Println(t.Stop()) // true
    select {
    case _, ok := <-t.C:
        fmt.Println("received:", ok)
    default:
        fmt.Println("not ready, not closed")
    }
    t.Reset(0)
    <-t.C
    fmt.Println("fired once")
}
```

这个示例由当前 goroutine 独占 Timer。Stop 后非阻塞检查，通道并没有像关闭通道那样立即返回。Reset 以后则收到新安排的一次通知。

真正的后台循环应当同时监听 `ctx.Done()`。停止 Ticker 后，如果没有退出信号，原本等待 tick 的 goroutine 仍然可能停在接收位置。

![Stop 没有关闭通知通道](https://note.lgdsunday.club/img/Q721/02-go-timer-ticker-stop-reset.webp)

### 旧模板要先核对版本再使用

旧定时器实现中，停止或重置时需要特别处理通道中可能残留的旧通知。Go 1.23 引入新的同步通道语义，让通道定时器的 Stop、Reset 有了更强的旧值隔离保证。

版本要分成两段看。**在 Go 1.23—1.26 中**，主模块的 go 指令和 `GODEBUG=asynctimerchan` 会影响语义选择，旧项目可能仍采用旧行为。[Go 1.23 Timer 变更说明](https://go.dev/wiki/Go123Timer)描述的是这段兼容过渡。

**从 Go 1.27 开始**，asynctimerchan 已永久移除，time 创建的通道始终同步，不再靠主模块的旧 go 指令或这个开关切回旧语义。[Go 1.27 Runtime 变更](https://go.dev/doc/go1.27#runtime)明确记录了这一点。本文的运行环境是 Go 1.27.2，不能再把过渡期的切换方法当作当前用法。

升级时还要清理遗留的旧值配置。比如本次在 Go 1.27.2 设置 `GODEBUG=asynctimerchan=1`，运行时会直接报“已移除的开关设为旧值”，不会恢复旧模式。这个失败是配置兼容问题，不是 Timer 需要继续排空的证据。

尤其不要看到 Stop 返回 false，就无条件执行一次阻塞接收。若通知已经被接收过，或者正有其他接收者，这次“排空”反而可能永远等不到。

![新旧 Reset 与 Go1.27 的版本边界](https://note.lgdsunday.club/img/Q721/03-go-timer-ticker-stop-reset-v2.webp)

### GC 能回收，不等于不用管理业务生命周期

新实现让不再引用的定时器能够被回收，修正了很多旧文章中“一定泄漏到触发”的笼统说法。但如果后台 goroutine 仍持有它并在等待，相关对象就不是简单的无人引用。

Stop 仍然可以表达“不再需要这个周期通知”。同时安排退出信号，并等后台任务结束，才能完成业务上的清理。GC 不会替你决定一个任务什么时候不再有意义。

本题采用 Go 定时器 API，不提供语义不相同的 TS/Python 定时器翻译。

![周期节拍，不是可靠任务队列](https://note.lgdsunday.club/img/Q721/04-go-timer-ticker-stop-reset.webp)

## 面试官继续追问

### time.AfterFunc 和通道 Timer 一样吗？

不一样。AfterFunc 在到时后启动函数，它的 C 不用于接收通知；Reset 的行为也要按回调型定时器的文档理解。Stop 返回以后，并不表示已经开始的回调一定结束了，需要另加同步。

### 可以通过 len(t.C) 判断要不要接收吗？

不建议。新语义下定时器通道的 len/cap 表现为零；即使普通通道，检查后状态也可能被其他 goroutine 改变。需要尝试接收，用非阻塞 select 表达。

### 测试里设置极短超时是否稳定？

不要断言两个同时 ready 的 select 分支必定选择其中一个。超时、取消和业务通知可能同时就绪，测试应围绕允许的结果和明确同步写，而不是依赖调度偶然性。

## 面试速记卡

> - Timer：一次通知；Ticker：周期节拍，不保证保存所有错过的 tick。
> - Stop：不关闭通道，不自动结束等待 goroutine。
> - Reset：通道型与回调型定时器要分开理解。
> - 版本：1.23—1.26 有兼容切换；1.27+ 固定新语义，旧开关已移除。
> - 生命周期：停止通知、发送退出信号、等待任务结束分别安排。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
