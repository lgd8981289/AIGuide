# ES Module 和 CommonJS 有什么区别？循环依赖时会发生什么？

[字节前端面试真题](../companies/bytedance-frontend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q121-esm-vs-commonjs/) · [题库目录](../../README.md)

<!-- 以下对话为教学模拟，非真实面经。 -->

🧑‍💻 面试官：ES Module 和 CommonJS 的主要区别是什么？

🙋‍♂️ 我：ESM 用 import/export，CommonJS 用 require/module.exports。

🧑‍💻 面试官：只是换一种语法吗？导出的值更新了，另一边一定能看到吗？

🙋‍♂️ 我：还要看绑定方式和导出对象，不能只比较关键字。

🧑‍💻 面试官：如果两个模块互相依赖，或者 ESM 有顶层 await，你对加载结果的判断还成立吗？

> 模块题要把「依赖怎样建立、导出怎样被读取、何时开始执行」讲清楚，语法只是入口。

## 面试速答（60 秒版）

ES Module 通过 import/export 表达模块依赖，导入通常与导出的绑定相连。CommonJS 则通过 require 执行模块并取得 module.exports，可以在运行过程中按条件加载。

因此，ESM 的静态结构更方便分析依赖与未使用代码，但不能简单说 ESM 永远异步、CommonJS 永远不能加载 ESM。Node.js 的互操作规则会随版本变化，现代版本可以同步 require 满足条件、没有顶层 await 的 ESM。

循环依赖时，两边也不是同一种处理方式。CommonJS 可能取得尚未初始化完的导出对象；ESM 则要遵守绑定的初始化时机，过早访问可能报错。

项目迁移时，除了改语法，还要检查 package.json 的 type、文件扩展名、依赖的导出方式、路径和加载时机。

![ESM 建立导入导出绑定，CommonJS 在运行时取得模块导出](https://note.lgdsunday.club/img/Q121/00-60s-overview.webp)

## 知识点详解：为什么改完 import，项目仍然跑不起来？

### 先把模块格式和编译结果分开

假设咱们把一个旧 Node.js 服务迁移到 ESM。源代码看起来用了 import，但构建工具也可能把它转成 require。反过来，文件扩展名和 package.json 又会影响 Node 如何解释输出文件。

因此，先检查真正交给运行时的文件。不要只看 TypeScript 源码，就认定程序正在按 ESM 执行。

在 Node.js 中，.mjs、.cjs 以及 package.json 的 type 等配置共同影响格式识别。浏览器中的原生模块又有自己的加载规则。

### 静态依赖与运行时加载，带来哪些区别？

ESM 的普通 import 声明提供可分析的依赖关系。运行代码前，模块系统可以先建立关联，之后按规则初始化和执行模块。

CommonJS 的 require 是运行时调用，因此可以放在条件分支里。模块第一次执行后通常进入缓存，后续加载可以复用相应导出。

ESM 也支持动态 import()。它不是把静态 import 放进 if，而是另一种按需加载的表达式，返回 Promise。

这也是为什么 Tree Shaking 要看模块结构和副作用。支持静态分析是有利条件，仍然不等于打包工具可以随便删除任何看起来没用的代码。

### “导出的值是副本”为什么说得不够准确？

ESM 导入的变量通常是导出绑定的只读视图：导出模块更新绑定，使用方可以观察到更新；使用方不能任意给这个导入绑定重新赋值。

CommonJS 返回的是 module.exports 当时对应的值。如果它是对象，使用方拿到的是对象引用，对象属性修改也可以被观察到。因此，笼统说 CommonJS 只会复制值，同样不对。

区别更明显的情况，是使用方先解构取得一个普通值，而原模块后来更新导出对象的属性；解构出来的局部变量不会自动变成持续连接的绑定。

分析时写出具体的导出、赋值和读取动作，比背“一个动态、一个静态”更可靠。

### 循环依赖要检查第一次读取发生在何时

假设 a 依赖 b，b 又依赖 a。如果 b 在 a 初始化完成之前读取 a 的数据，就可能遇到问题。

CommonJS 可以返回部分导出，使用方不能假设所有字段已经写好。ESM 可以建立相互引用的绑定，但尚未初始化的绑定被过早读取，仍可能触发错误。

把读取推迟到函数调用时，可能改变结果，但不能因此认为所有循环都安全。更好的处理通常是把共享定义拆成独立模块，或者明确初始化入口。

验证迁移时，准备最小项目分别检查模块缓存、循环引用和互操作。Node 的 require(ESM) 还要检查是否存在顶层 await；有些加载路径必须改成动态 import。

本题机制参考：[Node.js ESM 官方文档](https://nodejs.org/api/esm.html)、[MDN JavaScript 模块](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)。

![循环模块的依赖能够关联，但初始化完成前的数据读取仍有风险](https://note.lgdsunday.club/img/Q121/01-detail.webp)

## 面试官继续追问

### ESM 没有 require，是不是不能使用 CommonJS 包？

可以按运行时的互操作规则使用，但默认导出、命名导出识别和导出对象要逐包确认。不能把 CommonJS 对象里的任何字段都认定为可靠命名导出。

### 用了 ESM，包一定更小吗？

不会自动保证。副作用、重新导出、依赖格式和打包配置都会影响删除能力。需要检查构建产物，而不是看源文件扩展名。

### 为什么本文不放 Python 逐行对应代码？

Python 的导入缓存、模块对象和循环导入规则不同。它不能验证 Node 的格式识别或 ESM 绑定行为，这类迁移应在对应的 JS 运行时里做最小实验。

## 面试速记卡

> - 先看产物：源文件语法不等于运行时模块格式。
> - ESM：依赖关联与导出绑定有明确规则。
> - CommonJS：require 执行并取得 module.exports。
> - 循环依赖：重点检查初始化前的读取。
> - 互操作：按 Node 版本与顶层 await 条件判断。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **字节跳动 · 前端 · 原帖未明确批次**：CommonJS 与 ES Module 有什么区别？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353156819747020800)；原帖编辑于 2020-08-24。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
