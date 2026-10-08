# Object.freeze、Object.seal 和 Object.preventExtensions 有什么区别？能冻结嵌套对象吗？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q340-object-freeze-seal/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：Object.freeze 能保证对象完全不变吗？

🙋‍♂️ 我：它会冻结对象，不允许增加、删除和修改属性。

🧑‍💻 面试官：配置里有 options，冻结外层以后还能改 options.timeout 吗？

🙋‍♂️ 我：如果只冻结外层，嵌套对象仍然可以修改。

🧑‍💻 面试官：那 seal、preventExtensions 分别少限制了什么？冻结带有 setter 的属性，又会怎样？

> 把「对象这一层」和「它引用的其他对象」分开。冻结不是把整棵数据结构都变成不可变。

## 面试速答（60 秒版）

preventExtensions 只是不允许再增加新属性，已有属性能否修改或删除，仍然看原来的属性配置。

seal 在此基础上，把当前对象的属性设为不可配置，所以不能删除或重新配置，但原本可写的数据属性仍然能修改。

freeze 又进一步把数据属性设为不可写，因此当前对象已有的数据属性也不能直接改值。

但这些操作默认都只处理当前对象。外层属性指向的嵌套对象，仍然可能被修改；访问器属性中的 setter 也不会因为 freeze 自动失去作用。

实际开发时，我会先明确要保护哪一层。如果需要不可变更新或深度约束，就不能只在外层调用一次 freeze。

![新增、配置、写入，限制逐层增加](https://note.lgdsunday.club/img/Q340/01-overview.webp)

*图：新增、配置、写入，限制逐层增加。*

## 知识点详解：三个完整性级别，限制逐层增加

### 不允许新增，并不等于已有属性不能动

假设配置对象包含 mode 和 options。调用 preventExtensions 后，不能再添加 debug 这样的新属性。

但是，mode 如果原来是可写的，仍然可以改值；如果原来允许配置，也仍然可以删除。它限制的是对象的扩展性，不是给所有现有属性加上同一套保护。

之后无法重新把这个对象变回可扩展状态。所以，不应该把它当成一个能随时开关的临时锁。

### seal 和 freeze 分别补上什么？

把常见数据属性的情况列出来，更方便记忆：

| 操作                | 新增属性 | 删除属性 | 修改原本可写的数据属性 |
| ----------------- | ---- | ---- | ----------- |
| preventExtensions | 不允许  | 可能允许 | 允许          |
| seal              | 不允许  | 不允许  | 允许          |
| freeze            | 不允许  | 不允许  | 不允许         |

这里的“可能允许”，是说仍要看原属性的 configurable；seal 和 freeze 也不会把原本不可写的属性重新变成可写。

属性能否重新配置涉及更多规则，而不是表格里的三个动作。例如密封对象不能把数据属性改造成访问器属性。可以核对 [seal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/seal) 与 [freeze](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze) 的定义。

### 为什么嵌套对象仍然能修改？

外层对象的 options 属性保存的是一个引用。freeze 限制的是不能把这个引用替换掉，不是沿着引用把另一个对象也冻结。

#### TypeScript

```ts
const config = Object.freeze({
  mode: "prod",
  options: { timeout: 1000 },
});
config.options.timeout = 2000; // 嵌套对象仍然可变
console.log(config.options.timeout);
```

这是 JavaScript 对象机制，示例用 TypeScript 编写。Python 没有 Object.freeze/seal 这一套同语义 API；冻结数据类、只读映射等方案的边界需要另外说明。

如果对每个嵌套对象都逐层冻结，可以提高约束范围。但真实数据可能有循环引用，遍历时要记录访问过的对象；也可能包含 Map、Set、访问器或带内部状态的对象，不能把“遍历属性并 freeze”理解成对所有状态都有效。

![冻住引用，不等于冻住引用对象](https://note.lgdsunday.club/img/Q340/02-nested-v2.webp)

*图：冻住引用，不等于冻住引用对象。*

### freeze 为什么不一定挡住 setter？

数据属性直接保存一个值；访问器属性则通过 getter/setter 执行代码。freeze 不会把已有 setter 删除掉。

如果 setter 修改的是另一个对象或闭包中的变量，那么这个修改未必发生在当前被冻结对象的数据属性上。因此，冻结访问器描述符，不等于 setter 从此不能产生变化。

同样，TypeScript 的 readonly 主要是编译时约束。它不能代替运行时冻结，也不会让来自外部的 JavaScript 调用自动遵守类型检查。

## 面试官继续追问

### 修改被冻结属性，一定会报错吗？

不能不说明执行模式。严格模式下，对不可写属性赋值会抛错；非严格模式下，某些赋值会静默失败。不能用一次没报错来证明修改成功。

### freeze 能代替不可变更新吗？

不能。冻结限制修改已有对象；不可变更新通常是生成新对象并保留旧对象。二者可以配合，但做的不是同一件事。

### 配置对象应该全部深冻结吗？

如果确实需要共享只读配置，可以评估深冻结。但先明确数据范围和特殊对象，再衡量遍历成本。局部数据不一定需要这么重的运行时保护。

## 面试速记卡

> - preventExtensions：禁止新增属性。
> - seal：再禁止删除和重新配置。
> - freeze：再限制数据属性写入。
> - 浅层边界：引用不能替换，不代表引用对象不能改。
> - 访问器和内部状态：不能用普通数据属性规则一概而论。

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
