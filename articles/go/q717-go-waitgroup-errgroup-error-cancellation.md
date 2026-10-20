# Go WaitGroup 和 errgroup 有什么区别？等待、错误与取消怎样配合？

[网宿科技后端面试真题](../companies/wangsu-backend.md) · [云览科技开发面试真题](../companies/yunlan-development.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/go/q717-go-waitgroup-errgroup-error-cancellation/) · [题库目录](../../README.md)

以下是一段用于讲解的模拟面试对话。

🧑‍💻 **面试官：** 同时执行几个任务，怎么等它们结束？

🙋‍♂️ **我：** 用 WaitGroup，每个任务结束时 Done，主流程 Wait。

🧑‍💻 **面试官：** 有一个任务失败，其他任务还要继续吗？错误怎么返回？

🙋‍♂️ **我：** 换成 errgroup，失败就会取消其他任务。

🧑‍💻 **面试官：** 其他任务从不检查 context，它们会自动停止吗？Wait 会不会等第一个错误出现就直接返回？

> 等待完成、收集错误和通知取消，是三件不同的事。errgroup 可以把它们组织起来，但任务仍要自己配合退出。

## 面试速答（60 秒版）

WaitGroup 主要解决等待一组任务完成，不负责保存错误，也不负责取消其他任务。传统写法先 Add，再启动 goroutine，任务结束时 Done；Go 1.25 起还提供 WaitGroup.Go 来组织这些步骤。

errgroup 来自 `golang.org/x/sync/errgroup`，让任务通过返回 error 报告失败，Wait 等所有任务函数返回后，再返回第一个非 nil 错误。

使用 WithContext 时，一个任务返回错误，会取消派生 context；Wait 返回时也会取消它。但取消只是信号，其他任务需要检查 ctx.Done，或把 context 传给支持取消的 I/O，才有机会尽快结束。

因此，只需要等全部完成，可以用 WaitGroup；一组子任务共同组成一个结果、失败后希望停止无用工作，errgroup 通常更合适。两者都不自动保证共享结果的并发安全。

![等待、错误、取消，分开看](https://note.lgdsunday.club/img/Q717/01-go-waitgroup-errgroup-error-cancellation.webp)

## 知识点详解：一次失败以后，谁来让其他任务退出？

### 假设一个页面需要两个数据源

我们并发读取配置和数据。配置读取失败后，这次页面组装已经没法继续，那么另一个请求继续等待就可能只是浪费资源。

下面用本地同步信号代替真实网络，保证失败与取消的过程可以看清。需要先在模块中安装 `golang.org/x/sync`。

```go
package main

import (
    "context"
    "errors"
    "fmt"
    "golang.org/x/sync/errgroup"
)

func main() {
    g, ctx := errgroup.WithContext(context.Background())
    ready := make(chan struct{})
    g.Go(func() error {
        <-ready
        return errors.New("config failed")
    })
    g.Go(func() error {
        close(ready)
        <-ctx.Done()
        fmt.Println("other task exited")
        return ctx.Err()
    })
    fmt.Println(g.Wait())
}
```

第一个任务返回 config failed，errgroup 随后取消派生 context。第二个任务观察到取消，返回自己的错误。等它也退出，Wait 才完成。

如果第二个任务改成永远等待一个不会收到值的通道，取消并不能把它强行终止，Wait 也会继续等待。把库名换成 errgroup，不会自动补齐任务里的退出分支。

[errgroup 文档](https://pkg.go.dev/golang.org/x/sync/errgroup)分别规定了错误返回、WithContext 和 Wait 的行为。

![一个失败以后，其他任务怎样退出](https://note.lgdsunday.club/img/Q717/02-go-waitgroup-errgroup-error-cancellation.webp)

### WaitGroup 没有接管错误处理

传统 WaitGroup 写法里，Add 应在需要等待的任务启动前安排好，不能让 Wait 因为暂时看到计数为零就提前返回。Done 通常用 defer 保证正常返回路径上会执行。

当前还可以用 Go 1.25 引入的 `wg.Go(func(){...})`，由它负责启动和任务计数；文档要求传入的函数不要 panic。它的函数签名没有 error 返回值，所以并没有顺便变成 errgroup。[sync 文档](https://pkg.go.dev/sync#WaitGroup)给出了新旧两种写法。

两者都不是通用 panic 转换器。要不要在任务边界恢复 panic，取决于系统对异常的约定，不能把程序错误不加区分地包装成可以重试的普通失败。

### 并发数量和结果写入仍要设计

errgroup 的 SetLimit 可以限制活跃任务数，达到限制时，后续 Go 调用可能阻塞。它不是无限队列，也不应该在已有任务运行时随意改上限。父任务占着名额又在里面等待添加子任务，还可能形成自己等自己的局面。

结果如果写进预先分配切片的不同元素，且 Wait 之后才读取，可以按明确的互不重叠规则组织；如果共同 append 或修改同一 map，则需要额外同步。任务结束能被等待，不代表任务执行期间的共享修改就安全。

本题是 Go 并发 API，TS/Python 没有对应的同库实现，因此只给真实 Go 示例。

![SetLimit 限制的是活跃任务](https://note.lgdsunday.club/img/Q717/03-go-waitgroup-errgroup-error-cancellation.webp)

## 面试官继续追问

### 想保留每个任务的错误，还能只用 Wait 返回值吗？

不能，Wait 返回的是第一个非 nil 错误，不是全部错误。部分成功也有价值时，可以让任务独立保存结果和错误，再统一汇总；是否取消其他任务，需要按业务目标重新决定。

### Wait 结束后，派生 context 可以继续用吗？

不要把它用于下一阶段工作。WithContext 产生的 context 在 Wait 返回时也会取消，即便这一组任务全部成功。下一阶段应使用仍有效的父 context 或新的有界 context。

### 测试该怎么写？

用可控通道安排一个任务失败，断言其他任务观察到取消并退出，最后 Wait 返回原始失败。另测全部成功、父级超时和并发上限，不靠 Sleep 猜执行顺序。

## 面试速记卡

> - WaitGroup：等待完成，不自动管理错误和取消。
> - errgroup：任务返回错误，Wait 等全部返回后给出首个错误。
> - WithContext：错误或 Wait 返回会取消派生 context。
> - 取消：任务必须观察信号，不会被强制杀掉。
> - 并发约束：上限、共享数据和 panic 边界仍需单独设计。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **网宿科技 · Go后端 · 实习**：项目中怎样处理多个 goroutine 的协同工作？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/834864582727368704)；原帖发布于 2025-12-28。
- **云览科技 · Go开发（原帖未明确细分岗位） · 社招**：加了 sync.WaitGroup 以后，多个 goroutine 为什么仍不能保证按顺序输出？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/927594026935554048)；正文明确面试于 2026-09-09；页面显示 09-10 发布，未明确发布年份。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
