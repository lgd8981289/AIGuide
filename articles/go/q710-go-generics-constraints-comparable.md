# Go 泛型怎么用？类型约束、~ 和 comparable 分别表示什么？

[腾讯后端面试真题](../companies/tencent-backend.md) · [字节后端面试真题](../companies/bytedance-backend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/go/q710-go-generics-constraints-comparable/) · [题库目录](../../README.md)

以下是一段用于讲解的模拟面试对话。

🧑‍💻 **面试官：** Go 泛型函数里的类型约束有什么用？

🙋‍♂️ **我：** 限制能传哪些类型，比如 `int | int64`。

🧑‍💻 **面试官：** 如果定义 `type UserID int64`，它能传进去吗？

🙋‍♂️ **我：** 底层是 int64，应该可以。

🧑‍💻 **面试官：** 那为什么还需要 `~int64`？另外，`comparable` 能保证传入任何接口值都不会比较出 panic 吗？

> 类型约束决定泛型代码可以对所有候选类型做什么；`~` 扩展到底层类型，`comparable` 也不能替接口值检查它内部装的东西。

## 面试速答（60 秒版）

Go 泛型让同一段算法可以接收不同的类型，同时在编译期检查这些类型支持哪些操作。类型参数后面的约束，既规定可传入的类型，也限制函数内部能使用的操作。

`int64` 这个约束项只包含这个类型；`~int64` 则包含底层类型为 int64 的类型，所以自己定义的 `UserID` 也可以满足它。多个类型项用 `|` 表示可选范围。

`comparable` 主要用于需要 `==`、`!=` 或 map 键的泛型代码。但要注意，普通接口类型从 Go 1.20 起也可以满足这个约束；如果接口运行时装着 slice，比较或拿它当 map 键仍可能 panic。

因此约束要围绕实际操作设计。只是调用一组对象的方法，用普通接口通常更直接；只有算法确实需要保留具体类型、复用容器或运算时，再考虑泛型。

![Go 泛型：约束决定能做什么](https://note.lgdsunday.club/img/Q710/01-go-generics-constraints-comparable.webp)

## 知识点详解：约束怎样改变函数里能写的代码？

### 从一个保留 ID 类型的函数开始

假设项目里有用户 ID 和文章 ID，它们底层都是 int64，但我们不希望把两种 ID 随便混用。

```go
package main

import "fmt"

type UserID int64
type ArticleID int64
type IntegerID interface { ~int64 }

func Next[T IntegerID](id T) T { return id + 1 }

func main() {
    u := Next(UserID(10))
    a := Next(ArticleID(20))
    fmt.Printf("%T:%v %T:%v\n", u, u, a, a)
}
```

这里 Next 没有先把参数转成 int64 再返回 int64。调用时传入 UserID，返回的仍然是 UserID。这样既复用了加一逻辑，又保留了调用方的类型。

如果把约束中的 `~int64` 改成 `int64`，两个自定义类型就不再满足要求。类型别名 `type ID = int64` 是另一回事，它没有创建一个新的定义类型。

这些规则来自 [Go 泛型教程](https://go.dev/doc/tutorial/generics)和[类型集规范](https://go.dev/ref/spec#General_interfaces)。

![int64 和 \~int64，范围不同](https://note.lgdsunday.club/img/Q710/02-go-generics-constraints-comparable.webp)

### 为什么 any 约束不能随便相加？

`any` 允许的类型太多，包括结构体、slice 和函数。既然不是每种类型都支持 `+`，编译器就不能让泛型函数无条件写 `a + b`。

因此约束不只是调用入口的一道检查，它也给函数内部提供能力范围。声明支持整数，就可以做对应整数运算；声明某个方法，就可以调用这个方法。不要以为“运行时我只会传整数”，就能绕过编译期要求。

包含类型项的非基本接口，主要用于类型约束，不能直接当普通变量类型来装值。这里的接口是在描述允许的一组类型，不是在创建一个万能运行时容器。

### comparable 的边界要落到动态值上

写 `func Equal[T comparable](a, b T) bool`，函数内部可以比较 a 和 b。对 int、string 等具体类型，这个使用方式很直观。

但如果调用方显式选择 `T = any`，a 和 b 内部都装着 `[]int`，比较就可能触发运行时 panic。`any` 本身允许比较，不代表它装进去的每一种动态类型都支持比较。

同样，泛型 set 用 `map[T]struct{}` 实现时，如果允许 T 为接口，也需要约定键的动态值必须可比较。[官方 comparable 说明](https://go.dev/blog/comparable)专门解释了约束满足与严格可比较之间的差别。

这里不需要背类型理论的全部术语。面试时至少能说清楚，`comparable` 让代码能写比较操作，但不是对所有输入值作了运行时检查。

本题采用 Go 原生代码。TS/Python 的泛型约束体系不同，没有可以照搬的 `~` 类型集语义。

![comparable 仍要看动态值](https://note.lgdsunday.club/img/Q710/03-go-generics-constraints-comparable.webp)

## 面试官继续追问

### 泛型是不是可以取代接口？

两者解决的重点不同。接口适合把不同实现放到同一种行为约定下面，比如一个函数只要求对象有 Read 方法。泛型更适合复用与具体类型相关的算法，并保留输入输出之间的类型关系。不能因为有泛型，就把简单接口全部改成长约束。

### 约束越宽越好吗？

越宽，内部共同能做的操作可能越少。反过来，约束写得太窄又会拒绝合理的自定义类型。可以把“原生 int64、自定义 UserID、string、slice”列成编译用例，检查实际接受范围是否符合接口承诺。

### 泛型代码一定更快吗？

不能由语法直接判断。性能还受具体操作、调用方式、编译器优化和分配影响。没有跑基准，就不要把“类型安全地复用”改说成“必然提升性能”。

## 面试速记卡

> - 泛型：复用算法，同时保留具体类型关系。
> - 约束：规定类型范围，也规定函数内部能使用的操作。
> - `T` 与 `~T`：前者指具体类型，后者扩展到底层类型相同的一组类型。
> - `comparable`：支持比较与 map 键，但接口中的不可比较动态值仍可能 panic。
> - 选择：行为抽象优先考虑接口，类型相关算法再考虑泛型。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **腾讯 · 后端开发 · 日常实习**：Go 的泛型和接口有什么区别？（题意整理）。[面经来源](https://www.nowcoder.com/feed/main/detail/63b4b82b0b8c476d9ab4474d551d8995)；原帖编辑于 2025-10-23。
- **字节跳动 · 后端开发（AI中台） · 原帖未明确批次**：Go 泛型是什么，与 Java 泛型有什么区别？（题意整理）。[面经来源](https://www.nowcoder.com/feed/main/detail/e788d5e5ce6f4c8c90e2d90b99ceeee3)；原帖发布于 2025-10-28。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
