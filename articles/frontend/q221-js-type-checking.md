# JavaScript 怎么判断数据类型？typeof、instanceof 和 Array.isArray 有什么区别？

[小米前端面试真题](../companies/xiaomi-frontend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q221-js-type-checking/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：怎么判断一个值是不是数组？

🙋‍♂️ 我：用 instanceof Array。

🧑‍💻 面试官：这个数组来自另一个 iframe 呢？

🙋‍♂️ 我：它使用另一套 Array 构造器，当前判断可能不成立。

🧑‍💻 面试官：那换成 typeof？它能把数组和普通对象分开吗？接口传回来的 users，是数组就一定能用了？

> 先问你要确认什么：「值的大类别」「原型关系」「确实是数组」「符合业务结构」，这是四种不同的判断。

## 面试速答（60 秒版）

typeof 适合先判断字符串、数字、布尔值等基本类别，但它不能细分普通对象、数组和日期，null 的结果也是 object，函数则返回 function。

instanceof 通常沿原型链检查一个对象是否与指定构造器关联。不过，不同执行环境可能有不同的构造器和原型；Symbol.hasInstance 也可以定制行为，因此它不是万能的类型识别。

判断数组应该优先使用 Array.isArray。它检查实际数组身份，能处理另一个 iframe 创建的数组，不是只看对象有没有 Array.prototype。

同时要注意，类型判断不等于业务校验。users 是数组，还需要检查每个元素是不是具有合法字段的用户记录。TypeScript 类型声明也不能替代运行时检查外部输入。

![类型判断，先确认你在问什么](https://note.lgdsunday.club/img/Q221/01-answer-overview.webp)

## 知识点详解：把“是什么”拆成具体的问题

### typeof 先回答一个较粗的问题

假设接口给了我们一个未知值。第一步可以检查它是不是 string 或 number，因为这类判断很直接。

但遇到 object，信息就没那么充分了：

| 表达式               | 结果         |
| ----------------- | ---------- |
| typeof null       | "object"   |
| typeof \[]        | "object"   |
| typeof {}         | "object"   |
| typeof new Date() | "object"   |
| typeof (() => 1)  | "function" |

因此，检查“非 null 的对象”，至少要同时排除 null。需要判断数组时，再加 Array.isArray，不能看到 object 就继续按普通记录读字段。

typeof 对一个未声明的标识符通常可以返回 undefined，但也有时间死区等边界。它不是所有变量错误的免检通道。

### instanceof 关注的是原型关联

默认情况下，value instanceof Person 会沿 value 的原型链查找 Person.prototype。

这可以帮助判断某个实例与构造器的关系，但我们可以修改原型关联，也可以定制 Symbol.hasInstance。判断结果不一定代表“这个对象过去确实由这个构造器 new 出来”。

更常见的边界来自 iframe。两个窗口各有自己的 Array 和 Array.prototype。另一个窗口创建的数组，沿原型链找不到当前窗口的 Array.prototype，因此 instanceof 当前 Array 可以返回 false。

它仍然是数组，只是不属于你拿来比较的那一套原型关联。

### Array.isArray 为什么能处理这个问题？

Array.isArray 不是沿着你指定的 Array.prototype 做相同的检查。它判断这个值是否具有数组身份，因此跨执行环境的数组也能识别。

反过来，给普通对象接上 Array.prototype，不能因此让它变成真正的数组。这也说明，“看起来像数组”和“确实是数组”不一样。[MDN 的数组检测说明](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray)专门比较了这两个 API。

如果输入只要求“可以迭代”，那又是另一个契约。Set 可以迭代，但不是数组；不能把检测数组当成检测所有可迭代对象。

![另一个窗口的数组，仍然是数组](https://note.lgdsunday.club/img/Q221/02-detail-1.webp)

### 确认数组以后，还差一层字段校验

假设接口应该返回 users: \[{ id: 42, name: "Sunday" }]。就算 users 是数组，里面也可能是 null、字符串，或者缺少 id 的对象。

所以后端响应、浏览器存储、消息内容这些外部数据，仍需要运行时验证。先检查容器，再检查元素，再检查字段范围。需要复杂规则时可以使用明确的 schema 校验库。

TypeScript 里的类型断言，只影响编译器怎么看代码，不会在网络数据上补做这些检查。

Python 的 type 和 isinstance 有自己的语言语义，不是这三个 JavaScript API 的同名翻译。本题解释 JS 规则，不硬加没有对应关系的实现代码。

## 面试官继续追问

### Object.prototype.toString 能解决一切类型判断吗？

不能。它可以提供更细的标签，但 Symbol.toStringTag 等机制会影响标签。要判断数组，就使用明确的数组检测 API；要验证业务对象，就检查结构，不把一个标签当成安全保证。

### instanceof 返回 true，对象就能直接使用吗？

不一定。原型关系并不保证实例内部字段已经正确初始化，也不保证某个属性没有被覆盖。真正需要的能力还要按接口契约确认。

### API 数据在 TS 中声明为 User\[]，还需要校验吗？

需要。类型信息不会让错误 JSON 自动消失。应该在数据进入系统的边界验证，再让内部代码依赖已经确认的结构。

## 面试速记卡

> - typeof：基本类别判断，null 与对象细分要另处理。
> - instanceof：默认检查原型链，存在跨环境与定制行为。
> - Array.isArray：判断真实数组，优先于 instanceof Array。
> - 业务结构：数组身份不保证元素字段合法。
> - TypeScript：静态类型不代替外部输入的运行时校验。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **小米 · 前端 · 原帖未明确批次**：JavaScript 有哪些数据类型？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/625366409853280256)；原帖编辑于 2024-05-29。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
