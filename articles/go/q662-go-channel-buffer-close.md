# Go channel 有缓冲和无缓冲有什么区别？关闭后读写会发生什么？

[畅天游开发面试真题](../companies/changtianyou-development.md) · [字节后端面试真题](../companies/bytedance-backend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/go/q662-go-channel-buffer-close/) · [题库目录](../../README.md)

下面是一段模拟面试对话。

🧑‍💻 **面试官：** 有缓冲和无缓冲 channel 有什么区别？

🙋‍♂️ **我：** 一个能先存数据，一个需要发送和接收配合。

🧑‍💻 **面试官：** 有缓冲就永远不会阻塞吗？关闭后，里面还没读的数据会被清空吗？

🙋‍♂️ **我：** 缓冲满了仍然阻塞，关闭也不会丢掉已经放进去的值。

🧑‍💻 **面试官：** nil channel 和已经 close 的 channel，接收时有什么不同？

> 判断一次操作，先看 channel 是 nil、开放还是关闭，再看缓冲里有没有值和能否配对。

## 面试速答（60 秒版）

无缓冲 channel 的发送和接收需要配对，一方没准备好，另一方就需要等待。有缓冲 channel 可以在容量允许时先发送，缓冲满了发送仍会阻塞，缓冲为空时接收也会等待。

close 表示不再发送新值。已经进入缓冲的数据仍然能按顺序读出，读完以后，接收会立即返回元素零值，并让双返回值里的 ok 为 false。

向关闭的 channel 发送，或者重复关闭，会 panic。nil channel 的发送和接收则会一直阻塞，关闭 nil channel 也会 panic。它与“已关闭、可以立即读到结束”的 channel 完全不同。

工程上通常由明确掌握发送结束时机的一方负责关闭。多个发送者要先协调完成，不能让接收者为了停止读取，随手关闭别人还在发送的通道。

![缓冲、关闭和 nil 分开判断](https://note.lgdsunday.club/img/Q662/01-go-channel-buffer-close.webp)

## 知识点详解：缓冲、关闭和 nil 是三个不同维度

### 缓冲只提供有限的暂存空间

假设 channel 容量是 2，没有接收者时，前两个值可以先进去。发送第三个值时，如果空间仍没有释放，发送者就要等。

因此缓冲可以吸收短暂速度差，却不能解决长期“生产大于消费”。持续积压时，仍要选择阻塞上游、丢弃、降速或其他明确策略。增大容量只是延后满的时间。

无缓冲通道没有这份暂存空间，发送完成依赖接收配对。但“发送完成”也不等于接收者已经把业务处理完，只说明这次值交接满足了同步条件。[Go channel 规范](https://go.dev/ref/spec#Channel_types)和[内存模型](https://go.dev/ref/mem)需要区分来看。

### close 发出结束信号，不清空已有数据

下面用 Go 本身检查关闭后的接收语义。Python 队列或 JS Promise 没有同一套 close 规则，这里不写名称相似、行为不同的翻译版。

```go
package main

import "fmt"

func main() {
    ch := make(chan int, 2)
    ch <- 7
    ch <- 8
    close(ch)
    for i := 0; i < 3; i++ {
        value, ok := <-ch
        fmt.Println(value, ok)
    }
}
```

按规范，前两次分别得到 `7 true`、`8 true`，第三次才是 `0 false`。如果只接收 value 而不看 ok，就分不清真实发送的 0 和“关闭且已读空”的零值。

`for value := range ch` 则会持续接收，直到通道关闭并读完已有值。它不会因为暂时没数据，就当作循环结束。

![close 不会清空已经发送的数据](https://note.lgdsunday.club/img/Q662/02-go-channel-buffer-close.webp)

### nil 与关闭的差别，放进表里最清楚

| 操作    | nil channel | 已关闭 channel        |
| ----- | ----------- | ------------------ |
| 发送    | 一直阻塞        | panic              |
| 接收    | 一直阻塞        | 先读剩余值，读空后零值与 false |
| close | panic       | 再次 close 会 panic   |

在 select 中，nil channel 对应的通信分支永远不会就绪，可以用来暂时禁用某个分支。关闭后的接收分支却会持续就绪，如果没有适当退出或禁用，可能形成忙循环。[select 语句规范](https://go.dev/ref/spec#Select_statements)给出了就绪选择规则。

### 谁关闭，需要从所有发送者看

假设两个 goroutine 向同一通道发送。第一个发送者完成，并不代表第二个也结束了。它直接 close，就可能把另一方的后续发送变成 panic。

通常要由协调者等待全部发送结束，再关闭通道。接收方如果想停止整个任务，应通过独立取消信号协调发送者退出，而不是用关闭数据通道替代所有取消协议。

通道发送和取消也需要一起检查。若发送者已经阻塞在没有人接收的发送语句上，单纯在别处设置一个布尔值，不会自动让它解脱。

![两个发送者，谁能决定关闭？](https://note.lgdsunday.club/img/Q662/03-go-channel-buffer-close.webp)

## 面试官继续追问

### len(ch) 小于 cap(ch)，能保证下一次发送不阻塞吗？

不能拿瞬时观察当预留名额。其他发送者可能先占走空间。需要非阻塞尝试时，用适用的 select 逻辑表达，而不是检查以后假设状态不会变化。

### 关闭通道能当成广播吗？

关闭专用通知通道可以让多个等待接收者观察结束，但要把它与承载业务数据的通道区分开。谁能关闭、是否只关闭一次，以及下游如何退出，仍需事先约定。

## 面试速记卡

> - 无缓冲：发送和接收配对，不代表业务处理已经完成。
> - 有缓冲：容量有限，满了仍会阻塞发送。
> - close：停止新增，保留已发送值，读空后零值与 false。
> - nil：发送和接收一直阻塞，和关闭不同。
> - 责任：协调所有发送者结束，再由明确的一方关闭。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **畅天游 · Go开发（原帖未明确细分岗位） · 校招**：Go 的无缓冲 channel 与有缓冲 channel 有什么区别？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353156426820427776)；原帖编辑于 2020-05-12；只取畅天游段落。
- **字节跳动 · 后端（国际化） · 日常实习**：Go channel 怎样实现，关闭以后继续发送或接收会怎样？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353157524952129536)；三面为 2021-02-04；原帖编辑于 2021-02-12。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
