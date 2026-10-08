# TypeScript 的 satisfies、as 和类型注解有什么区别？能校验接口返回的数据吗？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q300-typescript-satisfies-assertion/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：satisfies 和 as 有什么区别？

🙋‍♂️ 我：satisfies 检查表达式是否满足类型要求，as 是类型断言。

🧑‍💻 面试官：给配置写类型注解，也可以检查，为什么还需要 satisfies？

🙋‍♂️ 我：希望检查整体约束，同时继续使用配置的具体类型信息。

🧑‍💻 面试官：那接口返回的 JSON 写 satisfies User，字段不对会自动抛异常吗？as User 会不会更强？

> 这里有两条边界：「编译器能检查什么」，以及「程序运行时有没有真的检查」。

## 面试速答（60 秒版）

类型注解给变量明确的类型，后续使用按这个类型进行检查。satisfies 检查一个表达式是否符合约束，同时尽量保留这个表达式本来能推断出的具体信息，适合固定配置。

as 则是在告诉编译器按某个类型看待值，不等于转换数据，也不等于检查数据。普通断言仍有静态兼容限制，但即使断言通过，也不会在运行时补字段。

这三种写法都会被 TypeScript 的编译过程处理掉，不能代替运行时校验。网络 JSON 应先当作未知输入，真正检查结构与业务条件；确定它符合要求之后，再交给业务代码。

![satisfies 检查约束，as 表达断言](https://note.lgdsunday.club/img/Q300/01-overview-v2.webp)

*图：satisfies 检查约束，as 表达断言。*

## 知识点详解：一份配置，为什么既要受限制，又想保留具体信息？

### 注解把变量放进一个明确接口里

假设配置保存两种显示颜色：字符串色值和 RGB 三元组。把变量注解成「值可以是字符串或三元组」后，代码访问一个属性，也可能只看到这个联合类型。

实际值明明是字符串，调用字符串方法却需要先判断类型。注解没有错，它让这个变量按较宽的接口被使用。

### satisfies 在创建处检查约束

#### TypeScript

```ts
type Color = string | [number, number, number];
const colors = {
  text: '#123456',
  accent: [255, 128, 0],
} satisfies Record<'text' | 'accent', Color>;
console.log(colors.text.toUpperCase());
console.log(colors.accent[0]);
```

拼错 text、漏掉 accent，或者把三元组写成两个数字，编译器可以指出问题。同时，text 仍能按字符串使用。[TypeScript 4.9 的说明](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html)介绍了这个操作符。

这里的「保留推断」不等于冻结对象，也不等于所有值都永久成为字面量类型。上下文类型仍可能影响推断；需要只读字面量时，还要另外理解 as const。

Python 类型检查没有这一套完全相同的操作符，因此这里只提供 TypeScript 示例，不伪造同名功能。

### as 为什么不能当成校验？

假设服务返回了 name 为数字的对象，代码把它断言为 User，再调用 name.toUpperCase()。断言没有把数字变成字符串，也没有在赋值处检查它。错误可能到真正使用字段时才暴露。

[TypeScript 类型断言说明](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions)强调，断言不会产生运行时检查。为了强行通过编译连续写 as unknown as，也没有新增任何可信证据。

### 输入校验应该在哪里做？

在数据进入可信业务逻辑之前。先检查是不是对象，再检查字段类型、必填项与取值范围。校验成功后，业务函数才接收对应的类型。

例如，年龄是数字仍然不够，还要判断是否允许负数、是否要求整数。类型检查与业务校验可以相互配合，但不能互相顶替。

本地验证可以分两步：用 tsc 确认错误配置会被拦住；再查看编译后的 JavaScript，确认不存在 satisfies 或 as 的运行时动作。不要拿一次编译成功声称接口已经被安全验证。

![类型在编译后消失](https://note.lgdsunday.club/img/Q300/02-runtime.webp)

*图：类型在编译后消失。*

## 面试官继续追问

### satisfies 会转换字段吗？

不会。它检查静态类型关系，不会把字符串转成数字，也不会创建缺失属性。

### satisfies 后面加 as const，就不可变了吗？

可以提供只读、字面量等静态约束，但不等于运行时深冻结。不能把它当成 Object.freeze 的替代。

### 给 JSON.parse 的结果写 satisfies，有什么风险？

如果来源被声明为 any，静态约束很容易失去价值。让未知输入保持 unknown，并进行实际校验，比在类型不可信的值上堆操作符更重要。

## 面试速记卡

> - 注解：变量按明确的目标接口使用。
> - satisfies：检查约束，并保留更多具体推断信息。
> - as：类型断言，不转换、不验证实际数据。
> - as const：静态只读与字面量约束，不是深冻结。
> - 外部输入：先实际校验，再进入可信类型边界。

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
