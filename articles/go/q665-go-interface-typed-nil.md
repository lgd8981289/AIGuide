# Go 的 interface 为什么不等于 nil？动态类型和动态值怎样影响判断？

[畅天游开发面试真题](../companies/changtianyou-development.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/go/q665-go-interface-typed-nil/) · [题库目录](../../README.md)

下面是一段模拟面试对话。

🧑‍💻 **面试官：** 函数里一个错误指针是 nil，把它作为 error 返回，调用方能判定 err == nil 吗？

🙋‍♂️ **我：** 不一定，装进接口以后可能不是 nil 接口。

🧑‍💻 **面试官：** 指针明明为空，接口里到底多了什么？

🙋‍♂️ **我：** 还带着那个指针的动态类型。

🧑‍💻 **面试官：** 那一个非 nil 的接口，能不能保证调用方法时不会遇到空指针？

> nil 接口与“接口里装了一个 nil 指针”不同。判断时把动态类型和动态值都写出来。

## 面试速答（60 秒版）

Go 的接口值可以用动态类型和动态值两部分理解。只有没有动态类型、也没有动态值的零接口，才等于 nil。

如果把一个类型为 \*MyError、值为 nil 的指针装进 error，接口已经记住了 \*MyError 这个动态类型，因此接口本身不等于 nil。这就是常说的 typed nil 问题。

它在错误返回中特别常见。函数没有错误时，应明确返回 nil 接口，不要顺手返回一个值为 nil 的具体错误指针。

同时，接口不为 nil 不代表内部对象一定可正常使用。nil 指针接收者能不能安全调用，要看方法实现是否处理它，不能把接口判断当成完整的对象有效性检查。

![nil 接口，和装着 nil 指针的接口不同](https://note.lgdsunday.club/img/Q665/01-go-interface-typed-nil.webp)

## 知识点详解：把接口里的两部分展开

### 两个变量看上去都空，比较结果却不同

下面用 Go 的 error 接口验证。其他语言的 None、null 没有完全相同的接口装箱语义，不拿它们伪造对应 API。

```go
package main

import "fmt"

type MyError struct{}

func (*MyError) Error() string { return "example" }

func main() {
    var pointer *MyError = nil
    var err error = pointer
    var empty error
    fmt.Println(pointer == nil)
    fmt.Println(err == nil)
    fmt.Println(empty == nil)
}
```

按语言规则，三次结果依次为 true、false、true。第一行在比较指针，第二行比较装入具体类型后的接口，第三行才是接口零值。

这里的 Error 方法没有解引用接收者，仅用于满足接口，不要据此认为所有 nil 指针方法调用都安全。[Go FAQ 关于 nil error](https://go.dev/doc/faq#nil_error)直接解释了这种返回陷阱。

### 记成两部分，比记“接口有坑”更有用

| 变量                  | 动态类型      | 动态值    | 是否为 nil 接口 |
| ------------------- | --------- | ------ | ---------- |
| 未赋值的 error          | 没有        | 没有     | 是          |
| 装入 nil 的 \*MyError  | \*MyError | nil 指针 | 否          |
| 装入非 nil 的 \*MyError | \*MyError | 具体指针值  | 否          |

这是帮助理解的逻辑模型，不承诺所有接口种类和所有 Go 版本的底层内存布局都恰好是一张相同的结构体图。

接口相等还有其他条件，例如动态值能否比较。不能把这张 nil 表扩展成“任意接口之间都能安全使用 ==”。[Go 规范的接口和比较规则](https://go.dev/ref/spec#Comparison_operators)给出了更完整的条件。

### 返回错误时，别让具体指针替你决定语义

假设函数声明返回 error，内部变量却是 \*MyError。没有错误时，这个变量保持 nil。直接 return 这个变量，就发生了具体指针到接口的转换。

调用方遵循常规写法检查 err，却看到一个非 nil 接口，于是走错误处理。这不是调用方“判断错了”，是返回方没有表达出“没有错误”。

更直接的写法是，在失败分支返回具体错误，在成功分支明确返回 nil。让成功和失败的出口清楚，通常比在调用方四处用反射识别 typed nil 更容易维护。

![返回 error 时，多了哪一部分？](https://note.lgdsunday.club/img/Q665/02-go-interface-typed-nil.webp)

### 接口非空，不等于内部对象满足全部条件

一个方法使用指针接收者，调用时可以收到 nil 指针。方法内部如果马上访问字段，就可能 panic；如果明确检查 nil，也可能提供约定好的行为。

所以需要区分两种检查：接口里有没有动态内容，以及动态对象是否满足该操作要求。资源是否关闭、句柄是否有效，也不能只靠 `x != nil` 判断。

## 面试官继续追问

### 用反射统一判断“是否为空”，是不是就修好了？

不一定。不同种类可不可以 IsNil、有无业务意义，都要判断。一个通用“空值工具”容易把接口契约问题藏起来。优先把返回值设计清楚，只在确有泛型或反射需求的边界谨慎使用。

### errors.Is 能判断所有 typed nil 吗？

它解决的是错误树中的匹配，不是替代所有接口空值语义。nil 判断和错误包装匹配是两道不同问题，不能把一个 API 当作通用修复。

## 面试速记卡

> - nil 接口：没有动态类型，也没有动态值。
> - typed nil：动态类型已存在，内部指针为空，接口仍不等于 nil。
> - error 返回：成功时明确返回 nil，避免空具体指针装入接口。
> - 方法调用：内部 nil 指针是否安全，取决于方法实现。
> - 边界：空值判断、对象有效性和错误树匹配分别处理。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **畅天游 · Go开发（原帖未明确细分岗位） · 校招**：Go 的 interface 怎样与 nil 比较？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353156426820427776)；原帖编辑于 2020-05-12；只取畅天游段落。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
