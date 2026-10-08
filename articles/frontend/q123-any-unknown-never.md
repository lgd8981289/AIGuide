# TypeScript 的 any、unknown、never 有什么区别？

[字节前端面试真题](../companies/bytedance-frontend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q123-any-unknown-never/) · [题库目录](../../README.md)

<!-- 以下对话为教学模拟，非真实面经。 -->

🧑‍💻 面试官：any 和 unknown 都能接收各种值，它们有什么区别？

🙋‍♂️ 我：unknown 使用前需要先检查，any 更容易跳过类型检查。

🧑‍💻 面试官：那接口响应写成 User，是不是就已经安全了？

🙋‍♂️ 我：类型标注不会替我检查实际 JSON。

🧑‍💻 面试官：never 又用在哪？如果状态增加了一种，你怎么让漏处理的分支被发现？

> 这道题看的是「检查在哪里发生」：unknown 保留检查责任，any 容易绕开检查，never 可以暴露不该存在或漏处理的路径。

## 面试速答（60 秒版）

any 允许咱们按需要访问属性、调用方法，编译器会放宽相关检查。这在迁移旧代码时有时方便，但错误也可能一路传到后面的代码。

unknown 同样可以接收各种值，但使用前要先判断它是什么。例如确认是字符串以后，才能按字符串处理，所以更适合还没验证的外部输入。

never 表示不会出现正常值的类型，常见于不会正常返回的函数，或者已经排除所有情况的分支。它可以用来检查联合类型是否已经处理完整。

因此，接口边界可以先接 unknown，运行时确认结构以后再进入业务类型。不要把 as User 当成校验，也不要为了省几行判断，把所有输入都改成 any。

![unknown 保留使用前检查，any 放宽检查，never 表示不会出现正常值的路径](https://note.lgdsunday.club/img/Q123/00-60s-overview.webp)

## 知识点详解：从一份不可信的 JSON 到可以使用的数据

### 标注为 User，不会改变收到的数据

假设后端返回一份用户信息，咱们希望 name 是字符串。请求成功只能说明拿到了响应，实际数据里 name 仍可能缺失，或者已经改成另一个形态。

把结果断言成 User，编译器可能同意后续使用，但那份数据并没有被检查。

因此，先把未确认输入保留成 unknown。它会提醒调用方：你还需要做一步判断，才知道能不能读取这个字段。

### unknown 让检查成为使用前的条件

例如只接受字符串姓名，可以直接在边界收窄。

```typescript
function readName(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error("name must be a string");
  }
  return value.trim();
}
console.log(readName(" Lin ")); // Lin
```

这里的 typeof 真正在运行时执行，后续代码又能取得字符串的静态类型。两部分配合，才把输入带进可信范围。

实际 JSON 是嵌套对象时，要逐层检查必要字段，或者采用合适的 Schema 工具。不能只检查 typeof value === "object"，就认定所有内部字段正确，因为 null 和数组也需要另外判断。

Python 也有自己的静态标注与运行时验证方式，但没有同义的 unknown/never 组合语义；本题代码限定 TypeScript。

### any 的问题会沿着数据传下去

any 不只是某一行少一次提示。把它传给函数、读出属性或参与表达式以后，后面也可能失去有用的检查信息。

这不是说 any 永远不能用。迁移第三方代码、处理尚未整理的边界时，可以限定一小块范围，同时安排实际验证和后续收紧。

更需要警惕的是在公共函数返回类型里随意写 any。调用方不知道哪里已经检查、哪里仍然不可信，就只能各自猜测。

### never 能把遗漏分支暴露出来

假设任务状态是 queued、running、done。使用 switch 分别处理后，默认分支里可以调用一个只接收 never 的函数。

当联合类型增加 failed，而 switch 没有补处理时，默认分支里的值就不再是 never，类型检查可以发现遗漏。

但这个检查的前提，是编译器看到了完整、可信的联合类型。外部 JSON 仍然可能携带未知状态，因此边界验证不能省。

另外，void 通常表达咱们不使用函数的返回值，函数仍可以正常结束；never 的函数不会正常返回。把它们都理解成“没有返回值”，会漏掉这个区别。

本题机制参考：[TypeScript 函数与特殊类型](https://www.typescriptlang.org/docs/handbook/2/functions.html)、[TypeScript 类型收窄](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)。

![联合类型新增状态后，未覆盖的分支在 never 检查处暴露](https://note.lgdsunday.club/img/Q123/01-detail.webp)

## 面试官继续追问

### unknown 可以直接强制转成 User 吗？

语法上可以断言，但相应的检查责任仍然在咱们身上。断言不是验证证据，数据进入业务前要有实际检查。

### 函数抛错误，返回类型一定写 never 吗？

当这个函数在所有执行路径上都不会正常返回时，never 才合适。某个分支可能抛错、其他分支正常返回的函数，需要描述实际返回值。

### never 的穷尽检查能防住接口新状态吗？

它能检查代码里的类型覆盖。服务端直接返回未知状态时，首先需要运行时验证与兼容策略，不能指望已经编译好的代码自动发现服务端变化。

## 面试速记卡

> - any：放宽检查，注意传播范围。
> - unknown：先检查与收窄，再使用。
> - never：没有正常值，用于不返回路径与穷尽检查。
> - void：不使用返回结果，不等于不能正常返回。
> - 接口边界：断言不校验，外部值先验证。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **字节跳动 · 前端 · 社招**：TypeScript 的 any、unknown、never 有什么区别？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/786037843704479744)；原帖编辑于 2025-09-01。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
