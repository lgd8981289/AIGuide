# Go Mutex 和 RWMutex 怎么选？为什么不能重入，也不该复制？

[百度开发面试真题](../companies/baidu-development.md) · [PingCAP开发面试真题](../companies/pingcap-development.md) · [阿里开发面试真题](../companies/alibaba-development.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/go/q719-go-mutex-rwmutex-locking/) · [题库目录](../../README.md)

以下是一段用于讲解的模拟面试对话。

🧑‍💻 **面试官：** 读多写少的数据，Go 里应该用什么锁？

🙋‍♂️ **我：** RWMutex，读锁之间不互斥，所以更快。

🧑‍💻 **面试官：** 如果每次读只拿一个整数，读锁的管理成本也能忽略吗？

🙋‍♂️ **我：** 还要测试实际性能。

🧑‍💻 **面试官：** 那已经拿了 RLock，再调用一个会 RLock 的辅助函数，为什么也可能死锁？

> 锁的选择要看完整的访问协议。读多只是一个条件，可重入、复制和锁的升级，也都有明确限制。

## 面试速答（60 秒版）

Mutex 是互斥锁，同一时间只允许一个调用持有它。RWMutex 区分读锁和写锁，多个读者可以一起读，写者则需要独占。

读操作占比高、临界区有一定工作量时，RWMutex 可能减少互斥等待；如果临界区很短或写入较多，它不一定比 Mutex 更好，应该在真实读写比例和并发量下比较。

Go 的这些锁不提供可重入保证。已经持有 Mutex 再 Lock 会等待自己；RWMutex 也不应递归加读锁，因为等待中的写者可能挡住后续读者。读锁不能直接升级为写锁。

锁在首次使用后不能复制，包含锁的结构体也要避免按值复制。工程上应把受保护的数据、加锁范围和调用约定一起设计，不能只给某一行赋值加锁。

![Mutex 还是 RWMutex？](https://note.lgdsunday.club/img/Q719/01-go-mutex-rwmutex-locking.webp)

## 知识点详解：两个读操作，为什么还会互相等住？

### 锁保护的是一份共同状态

假设我们维护一个可更新的配置值。读取和更新必须使用同一把锁，才能形成一套有意义的访问规则。

```go
package main

import (
    "fmt"
    "sync"
)

type Config struct {
    mu sync.RWMutex
    limit int
}
func (c *Config) Get() int {
    c.mu.RLock()
    defer c.mu.RUnlock()
    return c.limit
}
func (c *Config) Set(v int) {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.limit = v
}
func main() {
    c := &Config{}
    c.Set(20)
    fmt.Println(c.Get())
}
```

方法用指针接收者，是为了始终操作同一个 Config 和同一把锁。如果 Get 改成值接收者，可能在复制结构体时就复制了锁；两个副本各自加锁，也保护不了同一份共享数据。

锁只在 Get 返回数值的这段时间有效。如果 Get 返回的是内部 map 或指针，调用方离开锁后继续改它，就又打开了一条没受保护的路径。此时要考虑返回副本、只读快照或提供受控方法。

### 递归读锁的问题发生在写者排队以后

看下面这个顺序。任务 A 已经取得 RLock，任务 B 想获得写锁，于是开始等待。为了让 B 最终能进入，新的读者会被挡住。

如果 A 此时进入辅助函数，辅助函数再次 RLock，这次加读锁也可能被等待中的 B 挡住。B 又在等 A 释放最外层读锁，于是双方都走不下去。

因此，“读锁可以多人持有”不能推导出“同一调用链可以无限嵌套获取读锁”。[RWMutex 文档](https://pkg.go.dev/sync#RWMutex)明确禁止递归读锁，也不支持读写锁直接升级或降级。

![递归读锁，怎样等住自己](https://note.lgdsunday.club/img/Q719/02-go-mutex-rwmutex-locking.webp)

### 更好读的代码会把持锁约定说清楚

如果外层负责加锁，内部可以使用一个命名清楚、约定调用时已持锁的私有函数。另一个方案是让公共方法各自完整负责锁，不在持锁状态下调用它们。

不要为了修一次重入，随手把锁释放再重新获取。释放期间状态可能被改过，后续判断需要重新检查。比如“读取当前配置→决定是否更新”如果要求作为一次操作完成，拆开就可能破坏预期。

同时，Go Mutex 并不绑定某个 goroutine 的身份，规范允许安排另一个 goroutine 解锁。所谓“不可重入”，不能解释成它会识别当前 goroutine 并抛出重复加锁错误。[Mutex 文档](https://pkg.go.dev/sync#Mutex)说明了这层差别。

本题只使用真实 Go 锁 API，不将 Java 或 TS/Python 的锁实现假装成同样语义。

![复制锁，保护关系就可能断开](https://note.lgdsunday.club/img/Q719/03-go-mutex-rwmutex-locking.webp)

## 面试官继续追问

### RWMutex 什么时候可能更慢？

短小读取、低竞争或者写入频繁时，读写锁的额外管理可能抵消收益。基准里要保持相同的数据操作、并发数量和读写比例，同时看延迟与吞吐，不能只测“上锁再解锁”的空循环。

### 能用 go vet 把问题全部找出来吗？

go vet 的 copylocks 检查有助于发现复制锁的代码，`go test -race` 可以发现实际执行路径中的数据竞争。但它们不等于已经证明没有死锁；锁顺序和嵌套调用仍然需要设计与超时测试。

### TryLock 失败后可以直接读数据吗？

不能把失败当成已经建立了同步关系。TryLock 失败只说明这次没有拿到锁，不授权绕过保护读取共享字段。需要降级，就返回明确的旧快照或错误，而不是无锁碰运气。

## 面试速记卡

> - Mutex：单持有者互斥；RWMutex：多读者或一个写者。
> - 性能：读多不保证更快，要连同临界区工作量测量。
> - 重入：Mutex 不重入，RWMutex 不应递归读锁，也不直接升级。
> - 复制：首次使用后不能复制，含锁类型避免值复制。
> - 协议：数据、锁和所有访问路径需要一起受约束。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **百度 · Go开发（原帖未明确细分岗位） · 原帖未明确批次**：Go 的 mutex、rwmutex 怎样使用？（题意整理）。[面经来源](https://www.nowcoder.com/feed/main/detail/b40868d110794bae847e11a10c992adb)；原帖编辑于 2025-04-29。
- **PingCAP · 研发（TiDB方向） · 校招**：Go 的 Mutex 怎样实现，与 RWMutex 有什么区别？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353157341598130176)；正文记录 2020 年秋招；原帖编辑于 2021-04-12。
- **阿里巴巴 · Go开发（高德地图；原帖未明确细分岗位） · 社招**：是否了解 Go 的互斥锁和读写锁？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/882048490270904320)；原帖编辑于 05-07（页面未明确年份）。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
