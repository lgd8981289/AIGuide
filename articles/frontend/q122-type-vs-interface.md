# TypeScript 的 type 和 interface 有什么区别？实际项目怎么选？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q122-type-vs-interface/) · [题库目录](../../README.md)

<!-- 以下对话为教学模拟，非真实面经。 -->

🧑‍💻 面试官：TypeScript 的 type 和 interface 应该怎么选？

🙋‍♂️ 我：描述对象时都可以，联合类型更适合用 type。

🧑‍💻 面试官：那接口被其他库扩展以后，你写的代码一定还知道它有哪些字段吗？

🙋‍♂️ 我：interface 可以声明合并，需要注意开放扩展。

🧑‍💻 面试官：两个来源的同名字段类型冲突，用 extends 和交叉类型处理，会得到同样的结果吗？

> 选择 type 或 interface，要看「类型怎样表达、是否允许继续扩展」，还要注意冲突什么时候被发现。

## 面试速答（60 秒版）

type 和 interface 都可以描述对象的结构，很多普通业务对象用哪个都能写清楚，不需要把它们分成高低级。

interface 适合可扩展的对象契约，可以 extends，也支持声明合并。因此，为库提供扩展点时，它比较方便。

type 能给各种类型起别名，包括联合类型、元组和条件类型等。例如一个任务可能是成功或失败，用联合类型把两种结构分开，通常更直接。

实际项目中，先遵守团队已有约定。需要表达状态组合时选合适的类型运算，需要对外开放对象扩展时再考虑 interface。还要留意交叉类型的冲突，有时结果会出现无法正常赋值的 never，而不是当场按你预期报错。

![type 适合组合类型表达，interface 提供可扩展的对象契约](https://note.lgdsunday.club/img/Q122/00-60s-overview.webp)

## 知识点详解：看一个任务结果，该怎么把约束写进类型？

### 描述同一个普通对象，两者通常都能做到

假设咱们需要一个用户结构，包含 id 和 name。type User = {...} 与 interface User {...} 都能描述这些字段，调用方也都需要满足相应结构。

它们主要服务于编译期检查。写了某种声明，服务端返回的数据不会因此自动变正确，运行时仍然需要检查外部输入。

因此，选择时先看咱们要表达什么约束，不需要为每个普通对象展开一场语法争论。

### 联合类型为什么更适合描述互斥状态？

任务成功时有 data，失败时有 error。咱们通常不希望“成功但没 data”和“失败却没有 error”也被当成正常结果。

```typescript
type Result =
  | { status: "ok"; data: string }
  | { status: "error"; error: string };

function describe(result: Result): string {
  if (result.status === "ok") return result.data;
  return result.error;
}
console.log(describe({ status: "ok", data: "saved" }));
```

共同的 status 让编译器可以缩小类型范围。这里用 type 表达整个联合；interface 可以描述每个对象成员，但不能单独给联合起同样的接口声明。

Python 的类型系统也可以表达部分联合关系，但没有与 TypeScript interface 声明合并同义的语法，所以本题不把 Python 版本当相同机制。

### 声明合并什么时候有用，什么时候让人困惑？

在允许合并的作用域里，多个同名 interface 声明可以合成一个接口。这使类型扩展成为可能，例如给一个库的接口补充项目需要的字段。

type 别名不能这样重新打开。它也可以通过新的别名和类型运算组合，却不是同名声明合并。

开放扩展适合明确的扩展点。但如果普通业务类型在多个文件被悄悄补字段，读者只打开其中一个位置，就未必能看到完整约束。是否需要开放，是设计选择，不是功能越多越好。

### extends 和交叉类型的冲突处理也有区别

接口扩展会检查继承来的成员是否兼容。两个父接口的同名属性不兼容，通常会在接口声明处暴露问题。

交叉类型则要求同时满足两边。例如 name 同时要求 string 和 number，相关属性可以落到 never，让这个组合难以实际构造。

所以，把所有 extends 都换成 &，不保证得到同样的错误位置和可读性。遇到复杂类型，先画出对象需要满足的条件，再用一个赋值用例检查，而不是不断加 as 让编译器闭嘴。

本题机制参考：[TypeScript Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)。

## 面试官继续追问

### interface 只能定义类吗？

不是。它主要表达结构契约，不要求对象一定由某个类创建，也可以描述可调用等对象形态。

### type 不能扩展，所以不能复用吗？

可以复用。类型别名可以组合、交叉、引用其他类型；不能同名重新打开，并不等于不能组合。

### 接口通过编译了，接口返回值就可信了吗？

不一定。类型声明会在运行时被擦除，外部输入还需要实际校验。尤其不要把 JSON 直接断言成目标类型就跳过验证。

## 面试速记卡

> - 普通对象：type 与 interface 通常都能表达。
> - 开放扩展：interface 支持声明合并。
> - 组合表达：联合、元组和条件类型常用 type。
> - 冲突：extends 与交叉类型的报错方式不完全相同。
> - 边界：编译期类型不代替运行时校验。

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
