# TypeScript 泛型怎么用？keyof 和 infer 如何保留类型信息？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q124-typescript-generics/) · [题库目录](../../README.md)

<!-- 以下对话为教学模拟，非真实面经。 -->

🧑‍💻 面试官：泛型为什么比 any 更有用？

🙋‍♂️ 我：它能保留输入和输出之间的类型关系。

🧑‍💻 面试官：那从对象里取一个字段，返回类型怎么跟着字段变？

🙋‍♂️ 我：可以用 K extends keyof T，让返回值是 T\[K]。

🧑‍💻 面试官：infer 会在运行时推断数据吗？如果泛型参数没有建立关系，写得越多是不是就越安全？

> 泛型的重点是「保留类型之间的关系」，不是把 any 换成几个字母；keyof 限定可选字段，infer 在类型层提取信息。

## 面试速答（60 秒版）

TypeScript 泛型允许函数或类型接受不同输入，同时保留它们之间的关系。例如输入是某种数组，返回元素时还知道元素的类型，而不是统一变成 any。

keyof T 可以取得 T 的属性键类型。让字段参数 K 属于这些键，再返回 T\[K]，就能保证取了 name 得到字符串，取了 age 得到数字。

infer 用在条件类型中，可以从满足某种结构的类型里提取一部分，例如取得数组元素类型或函数返回类型。它做的是编译期类型计算，不会分析实际网络数据。

因此，设计泛型时要先说明哪些参数和返回值需要相关联。没有关系的类型参数，只会增加阅读负担；外部输入仍然需要运行时验证。

![泛型将对象类型、可选属性键与返回属性类型关联起来](https://note.lgdsunday.club/img/Q124/00-60s-overview.webp)

## 知识点详解：让函数复用时，别把原有类型信息丢掉

### 一个返回 any 的函数，调用方还知道什么？

假设咱们写了一个 getFirst，让各种数组都能使用。如果参数和返回值都写成 any，调用方虽然能随便调用方法，却不知道取出来的元素到底是什么。

泛型把元素类型 T 带进来，参数是 T\[]，返回值根据实际设计是 T 或 T | undefined。这样字符串数组取得字符串，用户数组取得用户对象。

空数组也是一个真正的条件。不能为了签名好看，把不存在的元素保证成一定有值。类型关系必须反映代码实际做的事。

### keyof 把字段名和对象连起来

下面这个函数只接受对象已有的键，并让结果跟着键变化。

```typescript
function pick<T extends object, K extends keyof T>(
  value: T, key: K
): T[K] {
  return value[key];
}
const user = { name: "Lin", age: 20 };
const name = pick(user, "name"); // string
const age = pick(user, "age");   // number
console.log(name.toUpperCase(), age + 1); // LIN 21
```

T 描述对象，K 描述这次选择的键。T\[K] 是按这个键取得的属性类型。若把 key 写成任意 string，两者的关系就不完整。

这是 TypeScript 的键类型与索引访问类型，不与 Python 泛型逐行同义。Python 可以保留部分输入输出关系，但不能伪造相同的 keyof/infer 语法。

### infer 提取的是类型结构，不是运行时值

假设某个函数返回 Promise<User>，咱们想取得里面的 User 类型。可以在条件类型里匹配相应结构，并用 infer 引入待推断部分。

例如 type Item<T> = T extends Array<infer U> ? U : T，意思是：如果 T 符合数组结构，就提取元素类型 U，否则保留 T。

这里没有遍历任何实际数组，也没有发请求。类型会在编译后被擦除，不能拿 infer 替代 JSON 验证。

标准工具类型往往已经处理了更多边界。例如解除 Promise 包装可以先考虑 Awaited，而不是只写一个教学版条件类型就当成通用工具。

### 泛型越复杂，越需要一个具体使用点

如果一个类型参数只出现一次，或者根本没有关联输入和输出，先问它有没有必要。调用方需要填写很多无法推断的参数，也可能说明接口没有把约束放对位置。

联合类型遇到条件类型，还可能发生分发：分别计算每个联合成员，再把结果合起来。如果需要把整个联合当一项判断，可以改变写法，例如用元组包裹判断双方。

面试里可以先讲一个自己能完整解释的关系，再展开条件类型。让函数的约束与结果更清楚，比展示一长串无法维护的类型运算有价值。

本题机制参考：[TypeScript 泛型](https://www.typescriptlang.org/docs/handbook/2/generics.html)、[TypeScript keyof](https://www.typescriptlang.org/docs/handbook/2/keyof-types.html)、[TypeScript 条件类型](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)。

## 面试官继续追问

### extends 在泛型里等于类继承吗？

这里通常表达类型约束：允许的 T 要满足某种结构。不要把它都理解成运行时的原型继承。

### keyof 结果一定都是字符串吗？

不一定，可能包含数字键或 symbol 键，索引签名也会影响结果。需要按对象形态判断，不能直接写死成 string。

### 用 as T 返回，就能保证泛型函数正确吗？

不能。断言可能绕开本来应该发现的不匹配。需要检查实现是否真的返回与输入关系一致的值。

## 面试速记卡

> - 泛型：保留输入、参数与结果之间的关系。
> - 约束：extends 限定允许的类型结构。
> - keyof：取得属性键类型，配合 T\[K] 保留字段结果。
> - infer：条件类型中的结构提取，发生在编译期。
> - 取舍：减少无用类型参数，优先表达可维护的关系。

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
