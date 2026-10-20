# Go JSON 的 omitempty 和指针字段有什么区别？零值与未传怎么区分？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/go/q728-go-json-omitempty-pointer-missing-fields/) · [题库目录](../../README.md)

以下是一段用于讲解的模拟面试对话。

🧑‍💻 **面试官：** 一个更新接口，用户可以把数量改成 0，也可以不修改数量，Go 怎么区分？

🙋‍♂️ **我：** 给字段加 `omitempty`，没传就忽略。

🧑‍💻 **面试官：** omitempty 控制的是编码还是解码？如果字段是 int，没传和传 0 解码以后分别是什么？

🙋‍♂️ **我：** 都可能是 0，那就改成指针。

🧑‍💻 **面试官：** 如果还要区分没传和显式 null，只用指针够吗？另外，json v1 和 v2 的 omitempty 一样吗？

> 先分清输出时要不要省略字段，再分清输入时有没有提供字段。指针能保留部分信息，但不是所有状态的完整记录。

## 面试速答（60 秒版）

omitempty 是 JSON 编码时的省略规则，不负责判断请求有没有传某个字段，也不是输入校验。使用经典 `encoding/json` 时，int 的零值加 omitempty 会在输出中省略。

如果更新接口需要区分未提供数量和明确提供 0，可以使用 `*int`，并为每个请求创建新的结构体。nil 表示没有得到数值，非 nil 且指向 0 就可以表达“设置为 0”。

但对新建结构体，未传和显式 null 都可能得到 nil。确实需要三态时，应增加 presence 标记、自定义解码，或使用 RawMessage 检查字段是否存在。

另外 Go 1.27 已提供 encoding/json/v2，它的 omitempty 按 JSON 空值判断，与 v1 的 Go 空值规则不同。跨版本迁移必须明确所用包；按 Go 零值省略时，可以核对 omitzero 是否更符合需求。

![字段未传、零值与 null](https://note.lgdsunday.club/img/Q728/01-go-json-omitempty-pointer-missing-fields.webp)

## 知识点详解：一个数量字段，怎样丢掉了“用户有没有填”的信息？

### 先只解决未传与明确传 0

假设接口需要修改配额。普通 int 在新建结构体里默认是 0，解码 `{}` 以后还是 0，解码 `{"count":0}` 以后也一样。值相同，就没有办法再从这个字段反推出用户做了什么。

```go
package main

import (
    "encoding/json"
    "fmt"
)

type Patch struct { Count *int `json:"count,omitempty"` }

func main() {
    for _, raw := range []string{`{}`, `{"count":0}`, `{"count":null}`} {
        var p Patch
        if err := json.Unmarshal([]byte(raw), &p); err != nil { panic(err) }
        out, err := json.Marshal(p)
        if err != nil { panic(err) }
        fmt.Println(p.Count == nil, string(out))
    }
}
```

这份示例明确使用 `encoding/json` 的兼容 v1 语义。输出依次是 `true {}`、`false {"count":0}`、`true {}`。指向 0 的指针不是 nil，所以这个字段被保留。

注意变量 p 每轮都是新的。如果反复把多个请求解码到同一个旧结构体里，未出现的字段可能保留旧状态，更容易误把上一次请求带进这一次。请求 DTO 应有明确生命周期。

![指针保留了什么，又丢了什么？](https://note.lgdsunday.club/img/Q728/02-go-json-omitempty-pointer-missing-fields.webp)

### 三态需要额外保存“出现过”

如果协议规定 null 表示清空，缺失表示不修改，数字表示设置，那么需要同时记录两个信息，字段是否出现，以及出现时的值是什么。

一种办法是先解码到 `map[string]json.RawMessage`，用 `raw, ok := fields["count"]` 判断出现，再分别处理 null 和数字。另一种是封装带 `Present`、`Null`、`Value` 的类型，并在自定义 UnmarshalJSON 中保存状态。

这类设计要同时规定允许哪些输入。空字符串、浮点数、负数和超出范围的整数都不能靠 omitempty 自动拒绝。省略规则和业务校验是不同的步骤。

[encoding/json 的解码说明](https://pkg.go.dev/encoding/json#Unmarshal)是检查 nil、null 与缺失字段行为的依据。

### v1 和 v2 的同名标签不能混着背

Go 1.27 的经典 encoding/json 保持兼容行为，但内部实现与新包有了联系；新代码还可以选择 `encoding/json/v2`。两个包的 omitempty 默认定义不同。

v1 按 Go 的空值判断，包含 false、数字 0、nil 指针以及长度为零的某些容器。v2 更关注编码后是否是 JSON null、空字符串、空对象或空数组，因此数字 0 和 false 不因为这两个值本身就被 omitempty 省略。

若需求是“Go 零值就省略”，可以研究 omitzero；若需求是“未传和显式零值分开”，仍然需要指针或 presence 设计。换个标签并不会恢复早已丢失的输入信息。[Go JSON 迁移说明](https://pkg.go.dev/encoding/json#hdr-Migrating_to_v2)详细列出了差异。

本文是 Go JSON 标签和解码状态，使用 Go 示例，不用 TS/Python DTO 伪装同一套行为。

![同名 omitempty，v1 与 v2 不同](https://note.lgdsunday.club/img/Q728/03-go-json-omitempty-pointer-missing-fields.webp)

## 面试官继续追问

### 指针字段能保证输入合法了吗？

不能。它帮助表达有没有数值，范围、权限和状态是否允许修改还要校验。比如数量 0 可以被正确接收，却仍可能违反业务要求，两层不能混起来。

### 更新时直接用 DTO 覆盖数据库对象可以吗？

要先按 presence 和业务规则构建更新集合，不能把所有零值一并覆盖。显式 null 如果允许清空，也要和没有修改区分，并检查调用方是否有这项权限。

### 测试需要哪几类输入？

缺失、0、普通值、null、错误类型、越界值都应分别断言；同时检查最终更新集合和输出 JSON。若迁移到 v2，再用相同样本比较行为，不能只看编译通过。

## 面试速记卡

> - omitempty：编码省略规则，不是请求字段存在性检查。
> - 普通 int：新结构体里，缺失与显式 0 都可能变成 0。
> - 指针：保留“有数值”与“没得到数值”，不自动区分缺失和 null。
> - 三态：需要 presence、RawMessage 或自定义解码保存信息。
> - 版本：v1 与 v2 的 omitempty 不同，迁移时按包与用例核对。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
