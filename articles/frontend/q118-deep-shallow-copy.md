# JavaScript 深拷贝和浅拷贝有什么区别？structuredClone 能替代 JSON 拷贝吗？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q118-deep-shallow-copy/) · [题库目录](../../README.md)

<!-- 以下对话为教学模拟，非真实面经。 -->

🧑‍💻 面试官：展开运算符能深拷贝对象吗？

🙋‍♂️ 我：只能复制外层，嵌套对象还可能共享。

🧑‍💻 面试官：用 JSON.parse(JSON.stringify(obj)) 呢？

🙋‍♂️ 我：简单 JSON 数据可以，但有些值会变化或丢失。

🧑‍💻 面试官：如果里面有循环引用、Date、函数，或者两个字段原本指向同一个对象，你准备怎么处理？

> 复制对象先确定「哪些引用应该分开、哪些关系需要保留」，再选工具；深拷贝也有类型和语义边界。

## 面试速答（60 秒版）

浅拷贝会创建新的外层对象，但里面的嵌套对象通常还是原来的引用。因此，修改副本的嵌套数据，可能影响原对象。

深拷贝会继续复制内部可复制的数据，让副本和原对象分开。不过，不同方法能处理的类型不同，不能把深拷贝理解成所有对象都能原样复制。

JSON 往返适合本来就属于 JSON 数据的数据结构。Date、undefined、函数、BigInt 和循环引用都需要额外注意。structuredClone 支持更多结构化数据，也能处理循环引用，但不能复制函数、DOM 节点等对象。

实际项目里，表单草稿可以复制数据；数据库连接、事件监听或带行为的实例，通常应该重新创建或保留明确引用。Python 可以使用 copy.copy 和 copy.deepcopy，但它们的对象规则与 JavaScript 的 structuredClone 不相同。

![浅拷贝保留共享嵌套引用，深拷贝隔离可复制的内部数据](https://note.lgdsunday.club/img/Q118/00-60s-overview.webp)

## 知识点详解：外层对象变了，里面的数据为什么还连在一起？

### 先给表单草稿找一个清楚的例子

假设页面允许修改用户资料，原数据里有 profile.address.city。咱们希望编辑草稿时，原数据先保持不变，点击保存后再提交。

如果只写 draft = {...profile}，外层确实是新对象，但 draft.address 与 profile.address 仍然指向同一个地址对象。修改 draft.address.city，原数据也跟着变。

所以，判断是否复制成功，不能只检查 draft !== profile。还要检查需要隔离的嵌套引用，以及修改后的实际结果。

### 用两种语言看外层复制和内部复制

下面只使用普通嵌套数据，表达相同的隔离目标。JavaScript 用 structuredClone，Python 用 deepcopy；两者并不承诺支持完全相同的对象类型。

#### TypeScript

```typescript
const original = { address: { city: "Hangzhou" } };
const shallow = { ...original };
const deep = structuredClone(original);
shallow.address.city = "Shanghai";
console.log(original.address.city); // Shanghai
deep.address.city = "Beijing";
console.log(original.address.city); // Shanghai
```

#### Python

```python
from copy import copy, deepcopy

original = {"address": {"city": "Hangzhou"}}
shallow = copy(original)
deep = deepcopy(original)
shallow["address"]["city"] = "Shanghai"
print(original["address"]["city"])  # Shanghai
deep["address"]["city"] = "Beijing"
print(original["address"]["city"])  # Shanghai
```

第一次修改经过共享引用，第二次修改发生在隔离后的地址对象上。这里用结果确认了区别。

### JSON 复制为什么不适合作为通用工具？

JSON 只能表达它支持的那套数据。日期可能变成字符串；对象属性中的 undefined 和函数可能被省略；数组中部分不支持的值会变成 null。BigInt 和循环引用还可能直接导致序列化失败。

这不代表 JSON 不好。假设服务端返回的就是已经定义好的 JSON 结构，复制或传输这种结构可以很直接。

但如果咱们要复制的是页面状态、类实例或者工具对象，先通过 JSON 改写一遍数据含义，再声称复制成功，就容易把问题藏起来。

### 循环引用和共享关系也需要保留

假设对象 a 的 self 指向 a 自己。正确的副本 b，其 self 应当指向 b，而不是原对象 a。

还有一种更容易漏掉的情况：original.left 与 original.right 原本指向同一个对象。结构化复制可以在副本内部保留这个共享关系，同时与原对象分开。

递归函数如果每次都盲目复制，很可能无限循环，或者把原来同一个对象复制成两个不相关对象。通常需要记录“这个源对象已经对应哪个副本”。Python deepcopy 也通过 memo 处理相应关系，用户定义类还可能自定义复制行为。

对于资源句柄和带行为的对象，先判断是否应该复制，比把递归写得更深更重要。

本题机制参考：[MDN structuredClone](https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone)、[Python copy](https://docs.python.org/3/library/copy.html)。

![副本与原对象隔离，同时保留循环关系和内部共享关系](https://note.lgdsunday.club/img/Q118/01-detail.webp)

## 面试官继续追问

### structuredClone 会完整保留自定义类实例吗？

不能这样承诺。自定义原型、属性描述符等信息不按任意对象原样保留；需要对象的行为时，应按该类的规则重新构建或提供明确的复制方法。

### 深拷贝越彻底越安全吗？

也不一定。大对象复制会增加时间和内存，原本应该共享的配置或资源也可能被误拆开。不可变更新可以只复制发生变化的路径。

### transfer 和 clone 有什么不同？

可转移对象可以移交底层资源，原资源会失去相应可用性。它是所有权转移，不是多保存一份；不能当成普通复制随便打开。

## 面试速记卡

> - 浅拷贝：外层新对象，嵌套引用可能继续共享。
> - 深拷贝：需要隔离内部数据，也要保留副本内部的关系。
> - JSON：适合 JSON 数据，不能通用复制对象。
> - structuredClone：支持更多数据与循环引用，仍有类型限制。
> - 验收：检查身份与实际修改结果，不只比较外层对象。

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
