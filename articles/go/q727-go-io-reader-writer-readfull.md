# Go 的 io.Reader 和 io.Writer 是什么？为什么 Read 一次不保证读满？

[蔚来开发面试真题](../companies/nio-development.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/go/q727-go-io-reader-writer-readfull/) · [题库目录](../../README.md)

以下是一段用于讲解的模拟面试对话。

🧑‍💻 **面试官：** 给 Reader 一个 8 字节的缓冲区，Read 会返回几个字节？

🙋‍♂️ **我：** 正常读到 8 个，读不到就 EOF。

🧑‍💻 **面试官：** 如果这次只读到 3 个，错误又是 nil 呢？

🙋‍♂️ **我：** 那就再读一次。

🧑‍💻 **面试官：** 如果 n 大于零，同时 err 是 EOF，这一批字节还要不要处理？固定长度的协议头，又怎么区分完整和截断？

> Read 返回的是“本次读到了多少”，不是“你的消息已经读完”。先处理 n，再按协议决定如何解释 err 与剩余内容。

## 面试速答（60 秒版）

io.Reader 用 `Read(p []byte) (n int, err error)` 提供字节读取能力，io.Writer 用 Write 提供字节写入能力。它们让文件、网络和内存缓冲区可以按统一接口组合。

Read 一次只保证按接口约定返回本次读到的字节数，不保证把缓冲区填满，也不保证对应完整业务消息。n 大于零时，应先处理这 n 个字节，再处理同时返回的错误。

读取固定长度内容，可以用 io.ReadFull，它会持续读到填满缓冲区，或者返回 EOF、ErrUnexpectedEOF 等结果。读取没有固定总长度的流，则需要根据协议使用循环、分隔符或长度字段，并设置大小与时间边界。

因此流读取的完整性，要由上层协议和组合函数来保证，不能只检查一次 Read 有没有报错。

![Read 一次，不等于一条消息](https://note.lgdsunday.club/img/Q727/01-go-io-reader-writer-readfull.webp)

## 知识点详解：8 个字节的缓冲区，为什么只回来 3 个？

### 缓冲区大小不是消息长度保证

假设一个 Reader 当前只愿意交出一部分可用数据，Read 就可以返回较少字节。调用方提供的 p 表达“最多可以放多少”，不是命令底层“必须等到这些位置都填满”。

文件有边界，网络有分段，上层协议又可能有自己的消息边界。把这三层混在一起，就容易在测试小数据时正常，换成另一种 Reader 后马上解析失败。

下面用一个故意每次最多返回 2 字节的 Reader，演示 ReadFull 为什么能把多次短读组合起来。

```go
package main

import (
    "fmt"
    "io"
    "strings"
)

type smallReader struct { io.Reader }
func (r smallReader) Read(p []byte) (int, error) {
    if len(p) > 2 { p = p[:2] }
    return r.Reader.Read(p)
}

func main() {
    r := smallReader{strings.NewReader("abcdefgh")}
    p := make([]byte, 8)
    n, err := io.ReadFull(r, p)
    fmt.Println(n, string(p[:n]), err) // 8 abcdefgh <nil>
    _, err = io.ReadFull(strings.NewReader("abc"), make([]byte, 8))
    fmt.Println(err == io.ErrUnexpectedEOF) // true
}
```

第一种情况多次读取后填满 8 字节，成功。第二种只有 3 字节，读到一部分才结束，因此返回 ErrUnexpectedEOF。完全没有读到内容就遇到 EOF，又是另一种边界。

[io.ReadFull 文档](https://pkg.go.dev/io#ReadFull)给出了这些返回条件。

### n 和 err 可以同时有意义

一个 Reader 可以在返回最后一批数据时同时给出 EOF，也可以先返回数据和 nil，下次再给 EOF。调用方不能只写“err 不为 nil 就直接丢弃本次结果”。

正确思路是先使用 `p[:n]`，然后决定遇到这个错误意味着正常结束、截断还是其他失败。处理函数也要知道自己需要完整消息还是允许部分数据。

反过来，`n == 0 && err == nil` 通常不表示流结束。对零长度缓冲区尤其要注意；自定义 Reader 也应避免无意义地反复返回这种结果，否则上层循环可能空转。

![先处理 n，再判断 err](https://note.lgdsunday.club/img/Q727/02-go-io-reader-writer-readfull.webp)

### Writer 也有写入数量的约定

Write 返回实际接收的字节数。符合 io.Writer 约定的实现，如果 n 小于输入长度，应同时返回非 nil 错误。调用方需要传播失败，不能只看“调用过 Write”就宣布整条消息发送成功。[io 接口文档](https://pkg.go.dev/io#Writer)说明了短写规则。

很多复制任务可以使用 io.Copy，但它不会自动给未知长度输入设置业务上限。读网络协议时，还要限制声明长度、设置超时，防止对方声明一个巨大长度，让程序不断等待或分配。

本文讲 Go 的接口返回契约，因此只提供 Go 示例，不把其他语言 I/O 函数假装成相同 API。

![长度头与消息体，要分两次校验](https://note.lgdsunday.club/img/Q727/03-go-io-reader-writer-readfull.webp)

## 面试官继续追问

### 为什么不能对所有输入都用 ReadAll？

ReadAll 会读到 EOF，未知或不可信的长流可能占用大量内存，也可能一直没有结束。应先确认输入有可靠边界，必要时用 LimitReader 配合多读一字节检查是否超限，或者按块处理。

### ReadFull 是否已经解决粘包？

它只保证尝试读到指定字节数。指定多少，仍由协议决定。可以先用 ReadFull 读取固定长度头，再校验头中的长度，最后读取对应消息体，不能让对端长度直接决定无限分配。

### 怎么测试自己的解析器？

同一份输入分别通过普通 Reader、每次只给一字节的 Reader、末批同时返回 EOF 的 Reader，再测试截断和超长输入。解析结果应由协议决定，而不应依赖底层一次返回多少字节。

## 面试速记卡

> - Reader：返回本次 n，不保证填满缓冲区或交付完整消息。
> - 错误处理：先处理 `p[:n]`，再解释 err。
> - ReadFull：组合短读，固定长度不够时区分 EOF 与 UnexpectedEOF。
> - Writer：短写应伴随错误，调用方要保留失败。
> - 协议：消息边界、长度上限和超时仍由应用设计。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **蔚来 · 软件开发 · 实习（原帖标签）**：怎样用 Go 只读取大文件的一部分，io.Reader 和 os.ReadFile 有什么区别？（题意整理）。[面经来源](https://www.nowcoder.com/feed/main/detail/9f92610c99b34894b35be91086df05a2)；原帖编辑于 09-17（页面未明确年份）。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
