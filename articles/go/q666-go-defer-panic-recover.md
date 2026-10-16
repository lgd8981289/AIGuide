# Go 的 defer、panic、recover 按什么顺序执行？为什么 recover 有时无效？

[腾讯开发面试真题](../companies/tencent-development.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/go/q666-go-defer-panic-recover/) · [题库目录](../../README.md)

下面是一段模拟面试对话。

🧑‍💻 **面试官：** defer 什么时候执行？

🙋‍♂️ **我：** 函数退出时，按后进先出的顺序执行。

🧑‍💻 **面试官：** 那 defer 后面的参数，是注册时求值，还是退出时才求值？

🙋‍♂️ **我：** 普通调用参数在注册时求值，闭包读取变量又要另外看。

🧑‍💻 **面试官：** 如果子 goroutine 发生 panic，父 goroutine 的 defer recover 能接住吗？

> 按时间拆成三段：注册 defer、函数返回或 panic 展开、执行延迟调用。再确认 recover 位于哪个 goroutine 的哪一层。

## 面试速答（60 秒版）

执行到 defer 时，会求值并保存这次延迟调用的函数和参数，但稍后才调用它。同一个函数内，已经注册的 defer 在退出时按后进先出的顺序执行。

return 会先确定返回值，再执行 defer；如果是命名返回参数，defer 可以修改这个返回变量，从而影响调用方得到的结果。闭包捕获变量和普通参数快照也要区分。

panic 会沿当前 goroutine 的调用栈展开，并执行沿途的 defer。recover 需要在符合规则的延迟函数中直接调用，才能停止当前正在展开的 panic；不能靠父 goroutine 接住另一个 goroutine 的 panic。

恢复以后不会跳回 panic 那行继续执行。工程里要把 recover 放在明确的任务边界，记录错误并清理资源，而不是把它当成普通错误返回的替代品。

![defer 注册、返回、执行，分三段](https://note.lgdsunday.club/img/Q666/01-go-defer-panic-recover.webp)

## 知识点详解：先判断值在什么时候被看到

### 注册时保存参数，执行时才运行函数

假设先写 `defer fmt.Println(n)`，然后把 n 从 0 改成 1。打印调用的参数在 defer 注册时已经求值，所以它保留的是当时的 0。

如果换成延迟执行的闭包，在闭包里读取 n，则会在闭包执行时访问这个变量。两段代码都出现 defer，读取变量的时机却不一样。[Go defer 规范](https://go.dev/ref/spec#Defer_statements)明确区分求值和调用。

### return 不是最后一个动作

下面是 Go 原生返回与 defer 示例，不是 JS finally 或 Python finally 的机械翻译。

```go
package main

import "fmt"

func value() (n int) {
    defer func() { n++ }()
    defer fmt.Println("保存的参数", n)
    n = 1
    return n
}

func main() {
    fmt.Println("最终结果", value())
}
```

注册打印时，n 还是 0，所以后面会打印“保存的参数 0”。return 先把命名返回变量确定为 1，接着后注册的打印先执行，再由前面的闭包把 n 改成 2。调用方最后得到 2。

这样逐行分析，就不用死记“defer 能改返回值”。它能否改变调用方结果，要看修改的是不是实际返回变量，而不是函数里一个无关局部值。

![打印 0，为什么最后返回 2？](https://note.lgdsunday.club/img/Q666/02-go-defer-panic-recover.webp)

### panic 展开时，只执行已经注册的 defer

如果程序还没走到某条 defer，就先发生了 panic，那条 defer 当然没有注册，不会神奇地补执行。

展开过程也局限于当前 goroutine 的调用栈。父 goroutine 创建了一个子 goroutine，不代表子任务的调用栈会接到父任务栈上。需要隔离任务 panic 时，应在那个任务自己的入口建立合适的恢复和上报边界。

![子 goroutine 的 panic，不沿父栈走](https://note.lgdsunday.club/img/Q666/03-go-defer-panic-recover.webp)

### recover 为什么有时返回 nil？

没有正在恢复的 panic，或者调用位置不符合规则时，recover 不会获得预期的 panic 值。

一个常见错误，是延迟函数调用普通辅助函数，再由辅助函数调用 recover。这个额外调用层次可能不满足“延迟函数直接调用 recover”的要求，不能只看代码文本里最终出现了 recover。[panic 与 recover 规范](https://go.dev/ref/spec#Handling_panics)给出了直接调用约束。

本文不沿用早期版本关于 panic(nil) 的旧结论。具体 panic 值表示应以所用 Go 版本为准；业务也不应该用 nil 当作清晰的错误信息。

### 恢复后，从哪里继续？

假设函数 F 里发生 panic，F 的 defer 成功 recover。F 不会跳回 panic 之后那句，而是完成该函数的返回过程。调用 F 的上层可以继续，但需要知道 F 此时返回了什么结果。

如果恢复以后只打一条日志，其他代码却收到一个看似成功的零值，就把失败藏起来了。任务边界应明确返回错误或失败状态，避免“服务没退出，但任务悄悄丢了”。

![recover 以后，不回到 panic 后面](https://note.lgdsunday.club/img/Q666/04-go-defer-panic-recover.webp)

## 面试官继续追问

### 循环里 defer 关闭文件，有什么风险？

defer 等当前函数退出才执行，不是每轮循环结束就执行。循环打开很多文件，可能积累资源占用。可以把单轮逻辑放进小函数，或者在清楚的路径及时关闭，并检查关闭错误。

### 能不能所有函数都加 recover？

不合适。它会模糊失败传播，也可能掩盖程序不变量已经破坏的事实。普通预期错误用 error 返回；恢复只放在有明确清理、记录和失败契约的边界。

## 面试速记卡

> - 注册：函数和参数先求值，延迟调用稍后执行。
> - 顺序：已注册 defer 后进先出，return 赋值后再执行它们。
> - 命名返回：修改真实返回变量，可以影响最终结果。
> - panic：沿当前 goroutine 展开，不跨 goroutine 自动捕获。
> - recover：符合直接调用规则，恢复后不跳回 panic 后一行。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **腾讯 · 开发（TEG；原帖未明确细分岗位） · 实习（原帖标签）**：defer 和 return 谁先执行，为什么？（题意整理）。[面经来源](https://www.nowcoder.com/feed/main/detail/33a9b4917b1344f783d6383667328c16)；原帖编辑于 2024-03-25。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
