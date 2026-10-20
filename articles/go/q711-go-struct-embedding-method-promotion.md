# Go 结构体嵌入是什么？方法提升和继承有什么区别？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/go/q711-go-struct-embedding-method-promotion/) · [题库目录](../../README.md)

以下是一段用于讲解的模拟面试对话。

🧑‍💻 **面试官：** Go 没有类继承，那结构体嵌入算不算继承？

🙋‍♂️ **我：** 可以复用内部类型的方法，用起来有点像。

🧑‍💻 **面试官：** 外层类型定义了同名方法，内部方法再调用这个名字时，会自动调用外层版本吗？

🙋‍♂️ **我：** 如果理解成重写，好像应该会。

🧑‍💻 **面试官：** 但内部方法收到的接收者到底是谁？是外层对象，还是被嵌入的那个字段？

> 嵌入让字段和方法更方便地被选中，但不会把内部对象变成外层对象，也不会自动建立子类重写关系。

## 面试速答（60 秒版）

Go 结构体嵌入是一种类型组合。外层结构体里仍然有一个真实字段，只是字段名可以由类型名提供，满足条件时，它的字段和方法可以被提升到外层选择器上使用。

例如 `Server` 嵌入 `Logger`，可以直接写 `server.Log()`，不必每次都写完整的 `server.Logger.Log()`。但 Server 并不是 Logger 的子类，也不能直接当 Logger 赋值。

外层定义同名方法，会遮住被提升的方法。内部方法原本使用什么接收者，仍然使用什么接收者，不会像某些类继承中的虚方法一样，自动回调到外层版本。

因此，嵌入适合明确要把内部能力暴露为外层 API 的情况。如果只是内部使用，命名字段加显式委托通常更清楚，也能避免内部 API 一变，外层接口跟着变化。

![嵌入是组合，不是子类](https://note.lgdsunday.club/img/Q711/01-go-struct-embedding-method-promotion.webp)

## 知识点详解：一次省略字段名的调用，究竟调用了谁？

### 先看最容易误认为重写的例子

```go
package main

import "fmt"

type Base struct{}
func (Base) Name() string { return "base" }
func (b Base) Describe() string { return b.Name() }

type Service struct { Base }
func (Service) Name() string { return "service" }

func main() {
    s := Service{}
    fmt.Println(s.Name())     // service
    fmt.Println(s.Describe()) // base
}
```

第一行调用外层 Service 自己的 Name，这没有问题。第二行比较关键，`Describe` 是从 Base 提升过来的，真正执行时，接收者仍然是内部的 Base。

因此 Describe 里面的 `b.Name()` 会找 Base.Name，不会绕回来寻找 Service.Name。只看 `s.Describe()` 的简写形式，很容易漏掉这一层。

如果确实需要根据不同实现改变行为，可以显式接收接口，或者由外层重新实现 Describe。不要指望嵌入自动补出一套继承分派规则。[Effective Go 的嵌入章节](https://go.dev/doc/effective_go#embedding)也强调了这种组合方式。

![内部方法收到的仍然是 Base](https://note.lgdsunday.club/img/Q711/02-go-struct-embedding-method-promotion.webp)

### 提升减少的是选择路径，不是字段本身

`type Service struct { Base }` 仍然包含一个 Base 字段。我们可以写 `s.Base.Name()`，明确访问内部实现。

当两个嵌入字段在同一深度都暴露了相同名字，而外层没有自己的对应成员时，直接写 `s.Name()` 可能产生歧义。此时就需要写清选择路径，或者在外层提供一个明确方法。

同时，结构体字面量初始化不能把提升字段直接当成外层字段来填。内部数据仍然要写在嵌入字段对应的位置。这个限制反过来也提醒我们，嵌入没有把两个结构体揉成一种类型。

### 嵌入指针，还会改变接口与零值边界

如果外层嵌入的是值类型 T，外层值与外层指针获得哪些提升方法，需要继续按方法集规则判断。如果嵌入的是 `*T`，值方法和指针方法都可能被提升到外层的方法集。

这并不表示外层零值一定可用。假如嵌入的 `*T` 还是 nil，提升过来的方法又访问了 T 的字段，就可能 panic。方法在编译期存在，与对象在运行时已完成初始化，必须分开检查。

[Go 规范的结构体部分](https://go.dev/ref/spec#Struct_types)给出了嵌入和提升方法的准确规则；这里的示例只用来解释调用关系，不把简写等同于继承。

这道题是 Go 的结构体机制，因此只提供 Go 代码；其他语言的类继承不能用换语法的方式模拟这套行为。

![嵌入指针，别忘了 nil](https://note.lgdsunday.club/img/Q711/03-go-struct-embedding-method-promotion.webp)

## 面试官继续追问

### 嵌入以后，外层会自动实现接口吗？

如果提升后形成的方法集满足接口，就可能实现。因此嵌入一个有 Read 方法的类型，可能让外层也成为 Reader。但要检查接收者类型、同名冲突和外层方法集，不能只看内部类型实现了什么。

### 为什么有时应该写命名字段？

假设 Server 只是内部需要 Logger，不希望调用方把 Server 当日志组件使用。写 `logger Logger` 可以保持这层边界。以后更换日志实现，也不必维护一整套意外暴露的方法。

### 怎样验证没有混淆分派关系？

给内外两层同名方法返回不同字符串，再分别调用外层方法、内部方法和提升方法。接着把嵌入值改为嵌入指针，检查接口断言和零值调用。这些小实验比一句“Go 用组合代替继承”更能说明问题。

## 面试速记卡

> - 嵌入：外层包含内部字段，不建立子类关系。
> - 方法提升：允许缩短选择路径，不改变内部方法的接收者。
> - 同名方法：外层可以遮蔽提升方法，但不是自动虚方法重写。
> - 嵌入指针：需要额外检查 nil 与方法集边界。
> - API 设计：只在确实希望暴露内部能力时使用嵌入。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
