# Go singleflight 是什么？为什么它不能代替缓存和分布式锁？

[腾讯后端面试真题](../companies/tencent-backend.md) · [滴滴开发面试真题](../companies/didi-development.md) · [知乎开发面试真题](../companies/zhihu-development.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/go/q718-go-singleflight-duplicate-request-suppression/) · [题库目录](../../README.md)

以下是一段用于讲解的模拟面试对话。

🧑‍💻 **面试官：** 一个热点 key 缓存失效，很多请求一起查数据库，Go 里可以怎么处理？

🙋‍♂️ **我：** 可以用 singleflight，让同一个 key 只查一次。

🧑‍💻 **面试官：** 查完以后，下一个请求还会执行吗？如果有三台应用服务器呢？

🙋‍♂️ **我：** 它应该会把结果保存下来，也能避免其他机器重复查吧。

🧑‍💻 **面试官：** singleflight 保存的是缓存值，还是当前正在执行的调用？它知道别的进程里发生了什么吗？

> singleflight 合并的是“同一进程、同一 Group、同一 key 的在途调用”。它既不保存长期结果，也不负责跨进程互斥。

## 面试速答（60 秒版）

singleflight 用来合并重复的在途调用。相同 Group 中，多个调用使用同一个 key，前一个还没有完成时，后面的调用会等待并共享这次结果，包括错误。

调用完成后，下次再进来仍可以重新执行函数。因此它不是缓存，也没有 TTL。常见用法是先查缓存，没命中再进入 singleflight，在里面再次查缓存，确实没有才访问数据源并写回。

这个合并范围只在当前进程，多个应用实例仍可能各执行一次。它不能代替分布式锁，也不适合直接承担跨请求的业务幂等。

工程上还要设计 key 的范围、查询超时和结果对象是否可变。尤其不能把不同租户或权限的请求，用过于简单的 key 合并到同一份敏感结果里。

![singleflight 合并的是在途调用](https://note.lgdsunday.club/img/Q718/01-go-singleflight-duplicate-request-suppression.webp)

## 知识点详解：为什么这一批只执行一次，下一批还会再执行？

### 把调用完成前后分开看

下面这个本地示例用通道控制第一次查询，不依赖网络快慢。需要安装 `golang.org/x/sync`。

```go
package main

import (
    "fmt"
    "sync/atomic"
    "golang.org/x/sync/singleflight"
)

func main() {
    var g singleflight.Group
    var calls atomic.Int32
    release := make(chan struct{})
    query := func() (any, error) {
        calls.Add(1)
        <-release
        return "value", nil
    }
    a := g.DoChan("item:7", query)
    b := g.DoChan("item:7", query)
    close(release)
    r1, r2 := <-a, <-b
    fmt.Println(calls.Load(), r1.Val, r2.Val, r2.Shared)
    g.Do("item:7", func() (any, error) {
        calls.Add(1)
        return "new value", nil
    })
    fmt.Println(calls.Load()) // 2
}
```

前两个调用登记时，查询还没结束，因此共享一份执行结果。等它们完成，再调用 Do，就会重新执行。这里没有缓存命中这个状态，只有当前 key 是否已经有正在执行的调用。

DoChan 返回的通道只接收这一次结果，并不会在完成后关闭，所以不要用 range 一直等它关闭。[singleflight 文档](https://pkg.go.dev/golang.org/x/sync/singleflight)对 Do、DoChan 和 Forget 的边界都有说明。

### 为什么进 Group 以后还要再查一次缓存？

假设请求 A、B 都在外面查到缓存为空。A 先完成查询并把结果写回，B 这时才进入 Group。如果 A 的在途记录已经结束，B 就会开启新调用。

在合并函数内部再查一次缓存，就有机会发现 A 已经写回的结果，避免第二次回源。缓存负责完成后的复用，singleflight 负责进行中的合并，两者覆盖的时间段不同。

错误也可能被共享。数据源故障时，一批等待者可能同时拿到失败。后面是否短暂缓存失败、限制重试频率，需要根据错误类型设计，不能默认 singleflight 已经解决了故障风暴。

![为什么进入合并函数还要查缓存](https://note.lgdsunday.club/img/Q718/02-go-singleflight-duplicate-request-suppression.webp)

### 谁超时，不一定意味着共享查询该结束

如果共享函数直接捕获第一个请求的 context，第一个用户断开可能取消所有等待者共同依赖的查询。反过来，完全不设超时又可能让一批调用一直挂住。

因此可以给共享查询设计独立但有上限的生命周期，各请求再决定自己要不要继续等待。DoChan 允许调用方在结果和自己的 ctx.Done 之间 select，但这个 select 只停止该调用方等待，并不自动取消底层函数。

key 也应表达完整的数据隔离范围，比如租户、资源 ID 和影响结果的参数。共享一个可变指针结果时，还应约定只读、复制或者另外同步；少执行了一次查询，不等于结果可以随便共同修改。

本题使用 Go 的 x/sync 库，不提供不存在同库 API 的 TS/Python 翻译。

![停止等待，不等于停止共享查询](https://note.lgdsunday.club/img/Q718/03-go-singleflight-duplicate-request-suppression.webp)

## 面试官继续追问

### Forget 可以取消正在执行的函数吗？

不能。Forget 让后续相同 key 的调用不再等待旧调用，可能开启新的执行；旧函数仍会继续。它不是 Stop，也不应被当作强制刷新锁。

### 三台机器一定只会回源三次吗？

不能这样承诺。每台机器有自己的合并窗口，窗口结束后又可能开启新查询，还受到缓存时机和失败重试影响。要降低整个集群的回源量，需要结合共享缓存、限流和必要的跨实例协调来设计。

![一个进程的合并，不等于集群互斥](https://note.lgdsunday.club/img/Q718/04-go-singleflight-duplicate-request-suppression.webp)

### 怎样证明合并真的生效？

用屏障保证多次调用时间重叠，统计底层函数实际次数。接着测试不同 key、相同 key 完成后的新调用、错误共享和等待方取消。只跑串行请求，看不出合并效果。

## 面试速记卡

> - 范围：同进程、同 Group、同 key 的在途调用。
> - 结果：等待者共享值与错误，不提供长期缓存。
> - 组合：先查缓存，进入合并函数后再查一次。
> - 取消：停止某个等待者，不等于底层共享查询已停止。
> - 隔离：key 要包含结果边界，不能混合不同权限的数据。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **腾讯 · 后端开发 · 日常实习**：singleflight 怎样实现，是否并发安全，怎样处理结果污染与调用失败后其他请求等待的问题？（题意整理）。[面经来源](https://www.nowcoder.com/feed/main/detail/63b4b82b0b8c476d9ab4474d551d8995)；原帖编辑于 2025-10-23。
- **滴滴 · Go开发（无人驾驶；原帖未明确细分岗位） · 社招**：singleflight 怎样实现？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/882048490270904320)；原帖编辑于 05-07（页面未明确年份）。
- **知乎 · 开发（监控组；原帖未明确细分岗位） · 25秋招（原帖标题）**：singleflight 的机制是什么？（题意整理）。[面经来源](https://www.nowcoder.com/feed/main/detail/fdcfe849626a4711abc8d125d9702fc7)；原帖发布于 2025-04-17。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
