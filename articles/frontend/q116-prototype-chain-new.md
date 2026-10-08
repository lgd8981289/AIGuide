# JavaScript 原型链是什么？new 和继承是怎么实现的？

[字节前端面试真题](../companies/bytedance-frontend.md) · [百度前端面试真题](../companies/baidu-frontend.md) · [小米前端面试真题](../companies/xiaomi-frontend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q116-prototype-chain-new/) · [题库目录](../../README.md)

<!-- 以下对话为教学模拟，非真实面经。 -->

🧑‍💻 面试官：JavaScript 的原型链是什么？

🙋‍♂️ 我：对象自己没有的属性，可以沿着原型往上找。

🧑‍💻 面试官：那 new User() 创建的对象，原型是 User，还是 User.prototype？

🙋‍♂️ 我：应该是 User.prototype，构造函数和实例不是同一个对象。

🧑‍💻 面试官：如果两个实例都用原型上的数组，一个实例往里面加数据，另一个会不会跟着变？

> 答好原型链，先分清「属性存在哪里」：查找可以沿原型共享，修改却不一定发生在你以为的那个对象上。

## 面试速答（60 秒版）

原型链就是 JavaScript 查找对象属性的一条路径。先查对象自己的属性，没有找到，再查它的原型，继续往上找，直到原型为 null。

用 new 创建实例时，实例通常会连接到构造函数的 prototype 对象。因此，多个实例可以共用原型上的方法，不需要各保存一份。

但共享不代表所有数据都应该放在原型上。姓名、当前选择等属于某个实例的数据，应当保存在实例自己身上。如果把可变数组放在原型上，几个实例可能读到同一个数组，修改时就会相互影响。

实际写代码时，可以用 Object.getPrototypeOf 看原型，用 Object.hasOwn 判断属性是不是对象自己的。读属性、给属性赋值、修改属性指向的对象，也需要分开分析。

![属性先在实例中查找，再沿共享原型继续查找](https://note.lgdsunday.club/img/Q116/00-60s-overview.webp)

## 知识点详解：顺着一次属性读取，把对象关系看清楚

### 先看一个对象为什么能使用自己没有的方法

假设咱们正在做一个用户管理页面。每个用户对象保存自己的 name，但显示姓名的方法没有必要给每个人复制一份。

可以把这个方法放在一个共享对象里，再让每个用户对象把它作为原型。读取 user.showName 时，JavaScript 先检查 user。如果 user 自己没有 showName，就继续检查它的原型。

找到方法以后，调用 user.showName()，普通方法里的 this 仍然指向 user。查到方法的位置和调用时的接收对象，是两件事。

因此，原型链并不是把父对象的属性全部复制到子对象。它保存的是对象之间的查找关系。

### 构造函数的 prototype 和实例的原型，分别是什么？

User 是可以被调用的构造函数，User.prototype 是一个普通对象。通常，new User() 得到的实例，其内部原型指向 User.prototype。

构造函数自己也是对象，因此 User 自己还有另一条原型关系。不能看见名字里都有 prototype，就把两条关系混在一起。

下面代码用 TypeScript 表达 JavaScript 的对象机制。Python 使用自己的类与属性查找模型，没有与这段代码同义的 prototype API，所以这里不补一个看起来相似的版本。

```typescript
const shared = { role: "reader" };
const user = Object.create(shared) as { role: string };

console.log(user.role);                 // reader
console.log(Object.hasOwn(user, "role")); // false
user.role = "editor";
console.log(shared.role);               // reader
console.log(Object.hasOwn(user, "role")); // true
```

前一次读取沿原型取得 reader。后一次赋值，在本例中给 user 新增自己的 role，遮住了原型上的同名属性，并没有改写 shared.role。访问器、只读属性等情况还要按对应规则分析。

### new 不只是把 prototype 接上去

对于普通可构造函数，可以按四个动作理解：创建新对象；让它连接到构造函数的 prototype；把它作为 this 执行构造函数；最后决定返回哪个对象。

通常返回新实例。但如果构造函数明确返回另一个对象，new 的结果可以是那个对象。返回普通原始值时，通常仍使用新实例。

这也解释了为什么手写 new 不能只写 Object.create。初始化代码还没有执行，返回值规则也没有处理。类、内建构造函数以及特殊构造行为更复杂，教学版模拟不能宣称替代语言实现。

### 共享数组为什么会让实例互相影响？

如果原型上保存 items: \[]，两个实例读取 items 时，都可能拿到同一个数组。执行 userA.items.push("book")，修改的是那个数组，userB 当然也能看到。

但执行 userA.items = \[]，是在本例中给 A 保存另一个数组，B 的读取路径没有改变。一个动作修改共享对象，另一个动作改变当前对象上的属性，结果不同。

可以用一个很小的实验确认：先比较两个实例的 items 是否严格相等，再分别做 push 和重新赋值。把引用关系画清楚，比背“原型用于继承”更容易接住追问。

本题机制参考：[MDN 原型链](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Inheritance_and_the_prototype_chain)。

![普通构造函数创建实例时的分配、原型关联、初始化与返回值判断](https://note.lgdsunday.club/img/Q116/01-detail.webp)

## 面试官继续追问

### 删除实例自己的同名属性以后，会怎样？

如果删除成功，后续读取会重新沿原型查找。所以删除 user.role，不等于任何地方都没有 role。

### Object.create(null) 适合什么情况？

它没有通常的 Object.prototype，可以用来创建没有继承属性的字典。但也没有常见的实例方法，需要用 Object.hasOwn 等静态方法检查；多数普通键值场景也可以考虑 Map。

### 为什么不建议随便修改内建原型？

新增方法可能与其他库、未来标准或枚举行为发生冲突。业务复用优先使用自己的类、组合对象或函数，不把全局原型当项目工具箱。

## 面试速记卡

> - 查找：自身属性优先，再沿原型找，直到 null。
> - 对象关系：实例的原型通常是构造函数的 prototype。
> - 共享：原型方法可以复用，实例可变数据要谨慎放置。
> - 修改：重新赋值与修改共享对象内部，是不同动作。
> - 验证：Object.getPrototypeOf 看关系，Object.hasOwn 看归属。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **字节跳动 · 前端 · 社招**：JavaScript 原型链怎样实现继承？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/786037843704479744)；原帖编辑于 2025-09-01。
- **百度 · 前端 · 实习（原帖标签）**：JavaScript 原型链怎样实现继承？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/530709141912829952)；原帖编辑于 2023-09-15。
- **小米 · 前端 · 原帖未明确批次**：JavaScript 原型链怎样实现继承？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/625366409853280256)；原帖编辑于 2024-05-29。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
