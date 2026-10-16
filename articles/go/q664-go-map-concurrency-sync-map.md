# Go map 为什么不能随意并发读写？sync.Map 和加锁 map 怎么选？

[畅天游开发面试真题](../companies/changtianyou-development.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/go/q664-go-map-concurrency-sync-map/) · [题库目录](../../README.md)

下面是一段模拟面试对话。

🧑‍💻 **面试官：** 两个 goroutine 操作同一个 map，什么时候需要同步？

🙋‍♂️ **我：** 有并发写入时，需要加锁，或者换成 sync.Map。

🧑‍💻 **面试官：** 换成 sync.Map 后，先 Load 取出计数，再加一 Store，整个过程就原子了吗？

🙋‍♂️ **我：** 单次操作安全，不代表组合操作不会丢更新。

🧑‍💻 **面试官：** map 的值是一份可变切片，取出来以后修改，又是谁负责同步？

> 同步范围要跟着共享状态走。保护容器操作，只解决了其中一层。

## 面试速答（60 秒版）

普通 Go map 不支持未经同步的并发读写或并发写。只有并发读取，并且不存在同时发生的修改时，才可以按只读方式共享。

常见方案是用 Mutex 或 RWMutex 保护普通 map。关键是把完整的状态修改放进同一临界区，比如计数的读、加一、写回需要一起保护，不能每一步分别加锁。

sync.Map 提供并发安全的容器操作，适合它文档描述的访问模式，例如写一次读多次，或不同 goroutine 主要操作不同 key。但 Load 再 Store 不是自动原子事务，跨 key 的不变量也不会自动维护。

我通常先用带类型的普通 map 配合明确锁范围，再根据实际访问模式和竞争数据评估 sync.Map。无论哪种方案，值对象内部的并发修改都需要另外检查。

![同步范围，跟着共享状态走](https://note.lgdsunday.club/img/Q664/01-go-map-concurrency-sync-map.webp)

## 知识点详解：把“容器安全”和“业务操作完整”分开

### 普通 map 的问题，不是偶尔输出顺序不同

两个 goroutine 同时写，或者一个读、一个写，如果没有同步，就是需要解决的数据竞争。运行时在部分情况下会直接报告并发 map 访问错误，但不能靠“这次没有报错”证明安全。

更不能用 recover 当成容器同步方式。先违反并发约束，再尝试接住错误，不会把执行变成可依赖的程序。[Go 官方 map 讲解](https://go.dev/blog/maps)明确说明了并发约束。

### 加锁要覆盖整个读改写

假设计数从 10 开始，A、B 都先读到 10，再各自写回 11。即使读取和写入分别被安全保护，最后仍然可能只增加一次。

因为我们要保护的动作是“基于当前值增加一”，而不是两个互不相关的字典 API。

下面是 Go 的互斥修改示例。sync API 属于 Go 并发模型，不翻译成行为不同的 TS/Python 容器。

```go
package main

import (
    "fmt"
    "sync"
)

func main() {
    counts := make(map[string]int)
    var mu sync.Mutex
    var wg sync.WaitGroup
    for i := 0; i < 100; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            mu.Lock()
            counts["ok"]++
            mu.Unlock()
        }()
    }
    wg.Wait()
    fmt.Println(counts["ok"])
}
```

这里最后读取发生在所有任务完成之后。如果需要在运行中读取，就也要遵守对应锁约定。

![两次安全操作，也可能丢一次加一](https://note.lgdsunday.club/img/Q664/02-go-map-concurrency-sync-map.webp)

### sync.Map 省去的是内部协调，不是全部业务协议

它提供 Load、Store、LoadOrStore、CompareAndSwap 等操作，应该按每个操作自己的语义使用。

例如初始化某个 key，可以考虑 LoadOrStore；需要按旧值条件更新，则看实际值类型和 CompareAndSwap 的约束。不要把 Load 与 Store 挨着写，就称为一个原子加法。

如果要同时维护“总数”和若干明细 key 的一致关系，单键操作安全也不等于跨键事务。一个普通 map 加一把锁，反而可能更容易把不变量完整圈起来。[sync.Map 文档](https://pkg.go.dev/sync#Map)还提醒，多数代码优先考虑普通 map 配合独立同步，以保留类型约束和维护其他不变量。

本文不使用旧版 read/dirty 双表图解释所有当前实现。底层结构会随版本变化，API 保证与某版内部优化要分开。

### 取出对象以后，锁还管得到吗？

如果 map 中存放的是指针或切片，锁只保护查找那一步，离开临界区以后继续修改对象，仍可能和其他 goroutine 冲突。

可以选择对象自身加锁、在大锁内完成必要操作，或者返回独立快照。用哪种方案，取决于对象大小、生命周期和一致性要求。只返回一个指针，并没有自动复制数据。

![查到指针，后面的修改谁保护？](https://note.lgdsunday.club/img/Q664/03-go-map-concurrency-sync-map.webp)

## 面试官继续追问

### RWMutex 一定比 Mutex 快吗？

不一定。读写比例、临界区长度和调度成本都会影响结果。先保证锁范围正确，再用接近真实访问分布的基准和剖析作决定，不凭“读多”两个字直接下结论。

### 怎样检查？

运行 `go test -race` 检查覆盖到的竞争，再用并发用例检查最终计数和跨字段不变量。竞态检测通过，不证明所有路径都执行过，也不能证明业务组合操作没有逻辑上的丢更新。[Go 竞态检测说明](https://go.dev/doc/articles/race_detector.html)介绍了适用范围。

## 面试速记卡

> - 普通 map：并发只读与并发修改要分开，修改需要同步。
> - 锁范围：覆盖完整读改写，不只保护单次方法。
> - sync.Map：操作安全不等于组合事务或跨 key 一致性。
> - 值对象：指针、切片等内部数据的同步仍要负责。
> - 选型：类型约束、访问模式和实际竞争一起看。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **畅天游 · Go开发（原帖未明确细分岗位） · 校招**：原生 map 为什么不是线程安全的，加锁 map 和 sync.Map 怎样实现？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353156426820427776)；原帖编辑于 2020-05-12；只取畅天游段落。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
