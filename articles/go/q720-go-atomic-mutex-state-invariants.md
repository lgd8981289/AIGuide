# Go atomic 和 Mutex 有什么区别？原子更新能保证整段逻辑安全吗？

[4399后端面试真题](../companies/4399-backend.md) · [云览科技开发面试真题](../companies/yunlan-development.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/go/q720-go-atomic-mutex-state-invariants/) · [题库目录](../../README.md)

以下是一段用于讲解的模拟面试对话。

🧑‍💻 **面试官：** Go 里对一个共享计数器加一，可以用什么？

🙋‍♂️ **我：** 用 atomic，比起每次加锁更轻量。

🧑‍💻 **面试官：** 那“判断计数小于上限，再加一”也已经安全了吗？

🙋‍♂️ **我：** 读和加都用原子操作，应该没问题。

🧑‍💻 **面试官：** 两个调用同时读到最后一个名额，再分别加一，会发生什么？

> 单次原子操作不可拆开，不代表多次操作自动连成一个整体。先找要共同成立的条件，再决定用 CAS 还是锁。

## 面试速答（60 秒版）

atomic 用来对某个受支持的值进行原子读写、加减或比较交换。Mutex 则让一段临界区里的多个操作，在同一套锁协议下互斥执行。

因此简单计数器可以用 `atomic.Int64.Add`。但如果先 Load 判断小于上限，再 Add，这两次操作之间仍然可以插入其他 goroutine，导致超出上限。

单个值的条件更新，可以用 CompareAndSwap 循环，把“旧值仍然符合预期才更新”作为一次操作。条件涉及多个字段、容器修改或者复杂资源管理时，Mutex 往往更清楚。

同时，原子操作不能和没有同步的普通读写随意混用，原子指针发布出去的对象也不会自动变成不可变。选择的重点是需要保护什么状态关系，不是只比较锁和 atomic 谁看起来更快。

![原子操作，保护到哪一步？](https://note.lgdsunday.club/img/Q720/01-go-atomic-mutex-state-invariants.webp)

## 知识点详解：两个安全操作，怎么组合出不安全结果？

### 先把最后一个名额分配两次

假设上限是 10，当前数量是 9。任务 A、B 分别 Load，都看到 9，于是都认为可以进入。随后它们各自 Add，最终得到 11。

每个 Load、Add 本身都可以是原子的，但业务要求“数量不能超过 10”，这个条件没有被作为一次完整更新保护起来。这里甚至可能没有数据竞争，结果却仍然不符合业务规则。

因此 race detector 没有报错，也不能说明组合逻辑正确。它检查的是另一层问题。

![Load 再 Add，最后一个名额会超卖](https://note.lgdsunday.club/img/Q720/02-go-atomic-mutex-state-invariants.webp)

### 单个计数状态可以用 CAS 重试

```go
package main

import (
    "fmt"
    "sync/atomic"
)

func acquire(n *atomic.Int64, limit int64) bool {
    for {
        old := n.Load()
        if old >= limit { return false }
        if n.CompareAndSwap(old, old+1) { return true }
    }
}
func main() {
    var n atomic.Int64
    n.Store(9)
    fmt.Println(acquire(&n, 10), acquire(&n, 10), n.Load())
}
```

如果其他任务在读取以后修改过 n，CAS 就不会把基于旧值计算的结果强行写进去，而是重新读取、重新判断。

这个示例只解释获取名额，完整限流器还需要释放、作用范围、超时和异常路径。不能把十几行 CAS 示例当成已经设计好了一套生产资源池。

Go 的 [atomic 文档](https://pkg.go.dev/sync/atomic)与[内存模型](https://go.dev/ref/mem#Atomic_Values)规定了它的原子性和同步语义，但不会替业务定义“数量不超过上限”这样的状态约束。

![CAS 失败以后，要重新判断](https://note.lgdsunday.club/img/Q720/03-go-atomic-mutex-state-invariants.webp)

### 多个字段，一般先考虑锁

假设一次更新同时修改 balance 和 reserved，而且调用方不能看到两个字段只更新了一半。分别给两个字段 Store，依然可能让读取方观察到不同阶段的组合。

可以将它们放进同一个受 Mutex 保护的结构体，或者构造一份完整的不可变快照，再通过原子指针整体发布。后者要求发布后不继续修改快照里的共享数据，否则还是会出现竞争。

atomic.Value 还要求保持存储类型等使用约定，首次使用后也不能复制；原子类型并不是“任何内容放进去就都会安全”的容器。

CAS 失败后重新计算也有成本。计算过程有副作用时，更不能随便重复，比如已经发出外部请求，再因为 CAS 失败就把整段函数从头重跑。让临界区简洁易查，通常比追求一个复杂无锁方案更重要。

本题是 Go 原子操作，使用真实 Go API，不将其他语言的接口机械翻译进来。

## 面试官继续追问

### atomic 一定比 Mutex 快吗？

不一定。竞争激烈时，CAS 可能频繁重试；相关缓存行也会被多个核心争用。要在相同正确性条件下比较，而不是拿一条 Add 和一个保护了多项状态的临界区作不公平对照。

### 只把写入换成 atomic 就够了吗？

不够。共享值的读取也要使用匹配的同步方式。对普通字段无锁读取，再用原子方式写入，不能获得完整的数据竞争保证。

### 怎样测这类逻辑错误？

用同步屏障让多个任务在同一条件附近竞争，断言成功次数和最终数量都不超过上限，再运行 race 检测。逻辑断言与数据竞争检查要同时存在，它们不能互相替代。

## 面试速记卡

> - atomic：保证单次受支持操作的原子与同步语义。
> - 组合：Load 后 Add，不自动成为条件更新。
> - CAS：旧值仍相同才更新，失败后重新判断。
> - Mutex：更适合保护多字段与复杂临界区。
> - 测试：无 race 不代表业务约束一定成立。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **4399 · Java后端（含 Go 提问） · 25届秋招（标题）**：Go 语言中常见的原子操作有哪些？（题意整理）。[面经来源](https://www.nowcoder.com/feed/main/detail/fdcfe849626a4711abc8d125d9702fc7)；原帖发布于 2025-04-17；只取 4399 Java 岗段落。
- **云览科技 · Go开发（原帖未明确细分岗位） · 社招**：并发更新 Map 指针是否安全，直接赋新指针与使用 atomic 有什么区别？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/927594026935554048)；正文明确面试于 2026-09-09；页面显示 09-10 发布，未明确发布年份。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
