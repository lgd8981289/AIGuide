# JavaScript 的 for...in 和 for...of 有什么区别？为什么普通对象不能直接 for...of？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q271-for-in-vs-for-of/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：遍历数组时，for...in 和 for...of 有什么区别？

🙋‍♂️ 我：in 取下标，of 取值。

🧑‍💻 面试官：给数组加一个 extra 属性，for...in 会不会遍历它？原型上的可枚举属性呢？

🙋‍♂️ 我：会，所以它不只是数组下标。

🧑‍💻 面试官：那普通对象有很多值，为什么又不能直接 for...of？它到底缺少什么？

> 一个入口问「有哪些可枚举属性」，另一个入口问「迭代器依次给我什么」。不要只记成下标和值。

## 面试速答（60 秒版）

for...in 枚举对象的可枚举字符串属性名，既可能有自有属性，也可能包含继承属性；它不会直接给出属性值，也不会枚举 Symbol 键。

for...of 则使用迭代协议，从可迭代对象里依次取值。数组、字符串、Map、Set 等有相应迭代入口，普通对象默认没有 Symbol.iterator，所以不能直接 for...of。

因此，遍历数组值通常使用 for...of；查看普通对象的自有键值，可以使用 Object.keys 或 Object.entries 等明确接口。确实使用 for...in 时，应判断是否需要过滤继承属性，不把它当成只遍历数组元素的循环。

![for...in 枚举属性，for...of 使用迭代器](https://note.lgdsunday.club/img/Q271/01-enumeration-overview.webp)

## 知识点详解：同一个数组，两种循环为什么看到不同东西？

### 数组也是对象，所以还有属性

假设数组里有两个学生名字，咱们又给它加了一个 extra 属性。

下面使用 TypeScript 演示 JavaScript 的具体枚举规则：

```ts
const names = Object.assign(["小明", "小红"], { extra: "备注" });

for (const key in names) {
  console.log(key); // "0"、"1"、"extra"
}

for (const value of names) {
  console.log(value); // "小明"、"小红"
}
```

for...in 看到的是属性名，包括 extra。下标位置在这里也是字符串形式的属性名，不是直接返回数值下标。

for...of 则使用数组默认迭代器，按数组元素的规则取值，extra 不会因此变成第三个数组元素。[for...in 文档](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...in)与 [for...of 文档](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of)分别规定了这两个入口。

所以“in 下标、of 值”只能解释这个例子的一部分，遇到普通对象、继承属性和其他集合，就不够用了。

本题讨论 JavaScript 的枚举与迭代协议，Python 的 for 循环并没有这两种语法与完全相同的属性规则，因此不机械提供对照实现。

### 继承属性，为什么也会进循环？

假设一个对象继承了可枚举的默认配置，自己又定义了一个 name：

```ts
const profile = Object.create({ role: "guest" });
profile.name = "Sunday";

for (const key in profile) {
  console.log(key); // "name"、"role"
}

console.log(Object.keys(profile)); // ["name"]
```

role 在原型上，但它是可枚举的字符串属性，所以 for...in 也能看到。Object.keys 则只返回自有、可枚举的字符串键。

如果循环只应处理当前对象自己的字段，可以通过 Object.hasOwn 判断，或者直接选自有属性接口。不需要为了演示这个区别，去改全局 Object.prototype 或 Array.prototype。

非枚举属性与 Symbol 键又有各自边界。需要全部自有键时，再考虑 Reflect.ownKeys，而不是假设 Object.keys 返回对象的所有信息。

![自有字段与继承字段在两种属性入口中的范围](https://note.lgdsunday.club/img/Q271/02-own-and-inherited-v2.webp)

### 普通对象为什么不能直接 for...of？

假设 profile 有 name 和 age 两个字段。它当然有值，但“有值”不是可迭代协议的定义。

for...of 会取得相应迭代器，并反复请求下一个结果，直到迭代完成。普通对象默认没有这样的 Symbol.iterator 入口，所以直接使用会报 TypeError。

咱们可以先把字段转换成明确的键值序列：

```ts
const profile = { name: "Sunday", age: 28 };
for (const [key, value] of Object.entries(profile)) {
  console.log(key, value);
}
```

这里被 for...of 遍历的是 Object.entries 返回的数组，不是原对象突然拥有了默认迭代器。每一项又是一个包含键和值的数组，因此可以解构。

对象也可以自己实现迭代协议，但那时返回什么、顺序是什么，要由这个实现明确决定。可迭代性与“普通属性很多”是两种不同性质。

![Object.entries 把普通字段转为键值项数组](https://note.lgdsunday.club/img/Q271/03-object-iterator.webp)

### Map 的 for...of，给出的又是什么？

Map 默认迭代出键值对，所以每一轮得到的通常是 \[key, value]。如果只需要值，可以选择 map.values；只需要键，就选择 map.keys。

这提醒咱们：for...of 的“值”，是迭代器这轮产出的项，不固定等于容器的某个 value 字段。

同样，不应该用 for...in 来期待读取 Map 内部所有条目。Map 的条目不是普通对象属性枚举入口要列出的那份数据。

### 空洞数组，会把简化口诀再次打破

假设数组中间没有实际属性，形成一个空洞。

for...in 不会因为 length 包含这个位置，就自动生成一个对应自有键；数组默认 for...of 则会按元素位置迭代，在没有值的位置得到 undefined。

如果原型又在这个位置提供了属性，观察还会变化。因此，用例里要区分“存在一个值为 undefined 的元素”和“这个位置根本没有自有属性”。

通常业务数组不应该依赖这些细节做复杂控制；但面试解释时，不能说两种循环只是输出格式不一样。

### 遍历方式，应该怎样选？

先明确要处理的是属性还是迭代项。如果是数组中的学生名字，for...of 很自然；需要下标和值，可以使用数组的 entries；如果是接口返回记录的字段，用 Object.entries 通常更直接。

如果循环中修改集合，还要检查对应迭代与枚举规则，别假设它们都拍了一份不会变化的完整快照。

测试时，普通元素之外，至少加一个附加属性、一项继承属性和一个空洞。这样才能确认代码真正依赖的范围，而不是被最简单的数组例子误导。

## 面试官继续追问

### for...in 会遍历 Symbol 属性吗？

不会。它枚举的是可枚举字符串属性名。需要 Symbol 自有键时，选相应接口，不能把“可枚举”单独当成唯一条件。

### 数组可以用 for...in 吗？

语法上可以，但通常不适合只想读取数组元素的需求，因为可能带入附加与继承属性。不是绝对不能用，而是别用错问题。

### for...of 是不是必须一次生成全部数据？

不是。迭代器可以逐项产生结果，因此也能配合生成器。它和先拿到全部对象键再循环，机制不同。

## 面试速记卡

> - for...in：可枚举字符串属性名，可能包含继承属性。
> - for...of：按迭代协议取项，前提是目标可迭代。
> - 数组：默认迭代器取元素，附加属性不等于数组元素。
> - 普通对象：默认不直接可迭代，字段可先转成 Object.entries。
> - 范围：自有、继承、可枚举、Symbol 与空洞分别判断。

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
