# Object.defineProperty 是什么？writable、enumerable、configurable 分别控制什么？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q365-object-property-descriptor/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：Object.defineProperty 能控制哪些行为？

🙋‍♂️ 我：可以控制属性是否可写、可枚举、可配置，也能定义 getter 和 setter。

🧑‍💻 面试官：只写 value，不写这三个标记，默认都是什么？

🙋‍♂️ 我：定义新属性时，默认是 false。

🧑‍💻 面试官：那已有属性重新定义时也全部变成 false 吗？一个描述符同时写 value 和 get，又会怎样？

> 描述符要先分「数据属性」和「访问器属性」，再分「新建」与「修改」。默认值不能脱离场景背。

## 面试速答（60 秒版）

Object.defineProperty 可以在对象上定义或修改属性描述符。

数据属性包含 value 和 writable；访问器属性包含 get 和 set。两组不能混写。两类都可以有 enumerable 和 configurable。

writable 控制数据属性是否允许赋值，enumerable 控制它是否参与某些枚举操作，configurable 则控制删除和重新配置等能力。

使用 defineProperty 新建属性时，未提供的三个布尔标记默认是 false；重新定义已有属性时，没写出的部分通常保留原来的设置。

所以实际使用时，我会把重要约束写清楚。不可枚举不等于不可访问，configurable 为 false 也不等于所有属性值都永远不能变化。

![属性描述符，控制不同动作](https://note.lgdsunday.club/img/Q365/01-overview.webp)

*图：属性描述符，控制不同动作。*

## 知识点详解：属性描述符控制的是哪些动作？

### 普通赋值与 defineProperty，默认并不一样

假设通过普通赋值给对象新增 name，常见数据属性默认可写、可枚举、可配置。

如果改为 defineProperty，只提供 value，那么新属性的这三个标记默认都是 false。这就是很多人写完后发现“属性有值，却不能改，也看不到键”的原因。

#### TypeScript

```ts
const user: Record<string, unknown> = {};
Object.defineProperty(user, "id", { value: 7 });
console.log(user.id); // 7
console.log(Object.keys(user)); // []
console.log(Object.getOwnPropertyDescriptor(user, "id"));
```

这是 JavaScript 属性机制，示例采用 TypeScript。Python 的 property 和描述符协议不是同一套对象属性标记，不提供误导性翻译。

### 三个标记，分别控制三类行为

writable 决定数据属性赋值是否可以改变 value。它不负责限制 value 指向的对象内部变化。

enumerable 决定属性是否参与 Object.keys 等枚举。Object.keys 还只包含自有可枚举字符串键，不能把它理解为对象所有属性查询。

configurable 控制属性能否删除，以及描述符能否进行相应修改。将它设为 false 后，不能再随意恢复或更换属性类型。

但不可配置的数据属性如果仍然 writable=true，通常还可以修改值，并可把 writable 从 true 改为 false。之后不能反向改回。这些限制见 [defineProperty 文档](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)。

### 数据属性与访问器属性，不能混成一个描述符

数据属性直接保存 value，可以设置 writable。访问器属性用 getter 读取，用 setter 处理赋值。

一个描述符同时带 value 和 get，或者 writable 和 set，会造成无效组合。不是“哪个字段后写就听哪个”，而是会抛出错误。

getter/setter 内部执行什么，仍由函数决定。没有 setter 的访问器不能靠 writable=true 获得写入能力，因为它不是数据属性。

![值和访问器，不能混写一份描述符](https://note.lgdsunday.club/img/Q365/02-types-v3.webp)

*图：值和访问器，不能混写一份描述符。*

### 不可枚举，不等于私有

如果属性 id 不可枚举，Object.keys 看不到它，但仍可以通过 user.id 访问，也可以通过描述符或自有属性名查询发现。

因此，它适合控制对象遍历或输出形式，不是保护秘密的安全方案。需要封装或访问控制，应选择对应机制。

### 为什么重新定义时，未提供字段不会一律重置？

如果某个属性已经存在，defineProperty 会按已有描述符和允许的变更规则处理。没有明确提供的部分，不应一律认为回到了新属性默认值。

因此，调试时先用 getOwnPropertyDescriptor 查看现状，再判断修改是否合法。对象通过继承得到的属性，与直接修改自有属性也要区分。

## 面试官继续追问

### configurable=false 就不能改值吗？

不一定。还要看它是数据属性还是访问器，以及 writable 等设置。不能把可配置与可写混成同一个开关。

### writable=false 能冻结嵌套对象吗？

不能。它限制当前数据属性的赋值，不自动限制引用对象内部。

### JSON.stringify 一定包含这个属性吗？

通常只处理相应的自有可枚举字符串属性，还受值类型、toJSON 等影响。不可枚举不代表属性不存在。

## 面试速记卡

> - 数据属性：value、writable。
> - 访问器属性：get、set，不能混写数据属性字段。
> - enumerable：控制枚举，不是访问权限。
> - configurable：控制删除与重新配置，不等于所有写入禁止。
> - 默认：区分新建属性和修改已有属性。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
