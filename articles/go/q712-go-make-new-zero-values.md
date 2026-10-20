# Go 的 make 和 new 有什么区别？为什么 new(map) 后不能直接写？

[字节测试开发面试真题](../companies/bytedance-test-development.md) · [字节后端面试真题](../companies/bytedance-backend.md) · [腾讯后端面试真题](../companies/tencent-backend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/go/q712-go-make-new-zero-values/) · [题库目录](../../README.md)

以下是一段用于讲解的模拟面试对话。

🧑‍💻 **面试官：** Go 的 make 和 new 有什么区别？

🙋‍♂️ **我：** new 返回指针，make 初始化 slice、map 和 channel。

🧑‍💻 **面试官：** `p := new(map[string]int)` 已经分配过了，为什么 `(*p)["a"] = 1` 还是 panic？

🙋‍♂️ **我：** 因为还没有初始化 map？

🧑‍💻 **面试官：** 那 new 究竟初始化了什么？它是不是一定把对象放到堆上？

> 要分清“保存一个 map 值的变量”与“已经可以写入的 map”。`new(map)` 创建的是前者，变量里的初始值仍然是 nil。

## 面试速答（60 秒版）

常见的 `new(T)` 会创建一个类型为 T 的零值变量，并返回它的地址，结果类型是 `*T`。make 则用于 slice、map、channel 及相应的类型参数，返回初始化好的 T，而不是 `*T`。

所以 `new(map[string]int)` 返回一个指向 map 变量的指针。指针本身不为 nil，但它指向的 map 是 nil，不能直接添加元素；还需要给这个变量赋一个 make 创建的 map。

slice 的零值也是 nil，不过可以直接 append；nil channel 的发送接收则会阻塞。这说明“零值能不能直接用”要看具体类型和操作，不能统一说 new 得到的值都不能用。

另外，make 和 new 都不直接决定最终在栈还是堆上分配。当前 Go 还支持 `new(表达式)`，这与经典的零值形式要区分开。

![make 和 new，先看返回什么](https://note.lgdsunday.club/img/Q712/01-go-make-new-zero-values.webp)

## 知识点详解：指针已经存在，里面为什么还没有 map？

### 把两层对象拆开就清楚了

```go
package main

import "fmt"

func main() {
    p := new(map[string]int)
    fmt.Println(p != nil, *p == nil) // true true
    *p = make(map[string]int)
    (*p)["a"] = 1
    fmt.Println((*p)["a"]) // 1

    var values []int
    values = append(values, 7)
    fmt.Println(values) // [7]
}
```

第一步创建了一个可以保存 map 值的变量，并拿到它的地址。这个变量遵循 map 的零值规则，因此内容是 nil。第二步才把一个初始化好的 map 放进去。

实际项目一般直接写 `m := make(map[string]int)`，没有必要为了使用 map，先套一层 map 指针。上面的写法是为了把差异拆开，并不是推荐模板。

map 的 nil 状态支持读取、查询长度、delete 等部分操作，但不能写入新元素。比如读取不存在的整数键会返回 0，所以“读起来正常”也不能证明 map 已经初始化好了。

![new(map) 其实有两层](https://note.lgdsunday.club/img/Q712/02-go-make-new-zero-values.webp)

### 三种 make，准备的东西不一样

`make([]int, 3, 5)` 得到长度为 3、容量为 5 的切片，可以访问下标 0 到 2。`make(map[string]int)` 得到可写 map。`make(chan int, 2)` 得到容量为 2 的 channel。

这里的“初始化”有具体结果，不能只解释成“分配内存”。切片有长度和容量边界，map 有可以执行写入的状态，channel 则有确定的通信行为。

相对地，`new([]int)` 指向一个 nil slice 变量，`new(chan int)` 指向一个 nil channel 变量。二者虽都拿到了非 nil 指针，但执行 append、下标访问、发送接收时，结果完全不同。

![nil 值，不是同一种行为](https://note.lgdsunday.club/img/Q712/03-go-make-new-zero-values.webp)

### 当前版本的 new 还要补一句

在 Go 1.26 及之后，new 也可以接收表达式。比如 `new(123)` 指向的整数初值是 123，不能再笼统地说“所有 new 调用都只会得到零值”。[当前规范](https://go.dev/ref/spec#Allocation)区分了类型参数形式 `new(T)` 和表达式形式 `new(x)`。

不过 new 仍然是在创建变量、返回指针。它不会因为接收了 map 类型，就自动替你创建一个可写 map。对经典面试题，先把 `new(T)` 和 make 的差异讲准，再补当前版本变化即可。

本题代码采用 Go，自身的 make/new 没有同一套 TS/Python API，不做机械翻译。

## 面试官继续追问

### make 一定分配在堆上吗？

不一定。编译器会结合生命周期、大小、内联和逃逸分析安排存储。看见 make 或 new 就断定堆分配，属于把语法当成优化结果。需要确认时，用编译诊断和分配测试查看当前代码。

### 结构体为什么通常不需要 make？

make 不是通用构造函数，普通结构体用零值、字面量或 new 即可。结构体字段中如果带有 map，字段仍遵循 map 的零值规则；外层对象有了，并不表示每个内部资源都准备好了。

### 测试应该覆盖什么？

分别测试指针是否 nil、被指向的值是否 nil、读取和写入是否允许。对 slice 再检查 len/cap 与 append，对 channel 则用受控 select 验证阻塞，不能让测试无限等下去。

## 面试速记卡

> - `new(T)`：创建 T 的零值变量，返回 `*T`。
> - make：初始化 slice、map、channel，返回对应值。
> - map 指针：指针不为 nil，不代表它指向的 map 已可写。
> - 零值操作：nil slice 可 append，nil map 不可新增元素，nil channel 通信阻塞。
> - 版本与分配：新版本支持 `new(x)`；栈堆位置仍看实际编译结果。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **字节跳动 · 研发工程师（质量保障方向） · 提前批**：Go 语言中 new 和 make 有什么区别？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/377123435464417280)；原帖发布于 2022-07-14。
- **字节跳动 · 后端开发（抖音直播） · 秋招**：Go 的 make 和 new 有什么区别？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/593466235547893760)；原帖编辑于 2024-03-02。
- **腾讯 · 后端开发 · 社招**：Go 的 new 和 make 有什么区别？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353156346994434048)；原帖编辑于 2020-04-20。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
