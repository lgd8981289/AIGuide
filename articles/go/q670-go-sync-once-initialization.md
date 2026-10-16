# Go sync.Once 怎么保证只执行一次？初始化失败后还能重试吗？

[4399后端面试真题](../companies/4399-backend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/go/q670-go-sync-once-initialization/) · [题库目录](../../README.md)

下面是一段模拟面试对话。

🧑‍💻 **面试官：** sync.Once 可以做延迟初始化，为什么不自己写一个布尔值？

🙋‍♂️ **我：** 普通布尔判断不保证并发安全，Once 还需要让其他调用等待初始化完成。

🧑‍💻 **面试官：** 如果第一次初始化返回错误，下次 Do 会重试吗？

🙋‍♂️ **我：** 不会，它记的是调用完成，不是业务成功。

🧑‍💻 **面试官：** 如果第一次 panic 呢？OnceValue 跟原始 Do 的后续行为一样吗？

> “一次”指同一个 Once 所管理的执行机会，不代表自动初始化成功，也不代表失败可以重新来。

## 面试速答（60 秒版）

sync.Once 让同一个实例的 Do 函数只执行一次。并发调用时，其他调用要等这次执行完成，再按同步保证看到初始化结果，不能只用一个提前置位的布尔值替代。

原始 Once.Do 不根据业务返回值重试。函数返回失败信息，或者发生 panic，这次机会都不会自动重新开放。Do 本身也没有 error 返回，需要应用保存和解释结果。

Go 还提供 OnceFunc、OnceValue、OnceValues，方便包装函数和缓存返回值。其中包装函数如果 panic，后续调用会再次以同一 panic 值触发，这一点和原始 Do 要区分。

因此，不会失败或失败后应永久保留结果的初始化，适合评估 Once。暂时网络故障需要重试、配置需要刷新时，应设计另外的状态机，不能直接反复复用已执行的 Once。

![Once 记一次执行，不判断业务成功](https://note.lgdsunday.club/img/Q670/01-go-sync-once-initialization.webp)

## 知识点详解：执行一次和成功一次，差在哪里？

### 先置 done，再运行初始化，有什么问题？

假设 A 把一个普通 done 标记设为 true，随后才开始创建共享对象。B 看到 true，就去读取对象，此时对象可能还没准备好。

所以正确方案不只是“让一个线程抢到标志位”。还要保证其他调用不能在初始化完成前错误返回，以及结果能按内存模型被看见。[sync.Once 的保证](https://pkg.go.dev/sync#Once)包含函数返回与各次 Do 返回之间的同步关系。

### 原始 Do 不理解业务结果

Do 接收的是无返回值函数。你可以在函数里把结果和 error 写到外部变量，但 Once 不会读取 error 来决定是否重试。

如果第一次连接失败就返回，第二次 Do 也不会再次连接。它的“一次”仍然已经用过了。

panic 同样要讲清楚。原始 Do 会把这次调用视为已经返回，后续 Do 不会重新执行那个函数；如果首个调用的 panic 被外层恢复，不能认为后面调用会帮它补完初始化。

![为什么不能先把 done 设成 true？](https://note.lgdsunday.club/img/Q670/02-go-sync-once-initialization.webp)

### 包装版本会保存什么？

下面用 Go 1.21 起提供的 OnceValues，演示缓存结果与错误。它是 Go API，不把其他语言的缓存装饰器称作同一实现。

```go
package main

import (
    "errors"
    "fmt"
    "sync"
)

func main() {
    attempts := 0
    load := sync.OnceValues(func() (string, error) {
        attempts++
        return "", errors.New("暂时不可用")
    })
    _, first := load()
    _, second := load()
    fmt.Println(attempts, first == second)
}
```

这里底层函数只执行一次，两次拿到同一份保存的错误。它不会因为错误文案写着“暂时”，就自动进入第二次尝试。

OnceFunc、OnceValue 和 OnceValues 的 panic 缓存行为，也需要看各自文档，不能把原始 Do 的后续表现直接复制过去。[sync 包包装函数文档](https://pkg.go.dev/sync#OnceValues)给出了对应契约。

![缓存错误，和下一次再试不同](https://note.lgdsunday.club/img/Q670/03-go-sync-once-initialization.webp)

### 需要重试时，状态得比一个 done 丰富

至少要区分未开始、进行中、成功和失败，并定义失败后谁能发起下一次。并发调用是等待同一个尝试，还是各自新开一次？重试间隔、总预算和最后一次错误怎样处理？

这已经是一套初始化协议。重新给 Once 赋零值、复制正在使用的 Once，都不能作为安全重试方案。标准库明确要求使用后的 Once 不得复制。

同样，回调里再对同一个 Once 调用 Do，可能因等待自身完成而死锁。不要把初始化依赖绕成环。

## 面试官继续追问

### 不同回调传给同一个 Once，会分别执行吗？

不会按函数身份各执行一次。管理执行机会的是 Once 实例。后来的回调可能根本没有机会运行，所以一个实例应该对应清楚的一件初始化工作。

### 怎样验证？

并发调用同一初始化器，检查执行次数与结果可见性；再分别测试正常返回、返回错误、panic 和递归调用的风险。测试需要有超时边界，不能让死锁用例卡住整个测试进程。

## 面试速记卡

> - Once.Do：同一实例只执行一次，不按回调身份分别计数。
> - 同步：其他调用要等待初始化完成，再观察结果。
> - 失败：错误和 panic 不会自动换来重试机会。
> - 包装：OnceValue/OnceValues 缓存返回结果，panic 行为另看契约。
> - 重试：需要独立状态机，不复制或随意重置已使用的 Once。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **4399 · Java后端（含 Go 提问） · 25届秋招（标题）**：Go 的 sync.WaitGroup 和 sync.Once 有什么区别？（题意整理）。[面经来源](https://www.nowcoder.com/feed/main/detail/fdcfe849626a4711abc8d125d9702fc7)；原帖发布于 2025-04-17；只取 4399 Java 岗段落。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
