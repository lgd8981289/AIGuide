# var、let、const 有什么区别？暂时性死区和变量提升怎么理解？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q236-var-let-const-tdz/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：var、let、const 有什么区别？

🙋‍♂️ 我：var 有变量提升，let 和 const 没有。const 定义的值不能修改。

🧑‍💻 面试官：那 const 定义一个对象，为什么可以改它的属性？

🙋‍♂️ 我：它限制的是变量重新赋值，不是对象里的所有内容。

🧑‍💻 面试官：再看一个情况：外面已经有同名变量，块里声明 let，为什么在声明前读取它，还是会报错？

> 先分清两件事：「这个名字指向哪个变量」，以及「这个变量现在有没有初始化」。

## 面试速答（60 秒版）

var、let、const 的区别，主要看作用域、初始化时机和能不能重新赋值。

var 通常以函数为作用域，普通 if、for 代码块不会单独限制它。进入相应作用域时，var 绑定已经初始化为 undefined；后面的赋值仍要等代码执行到那里。

let 和 const 是块级作用域。从进入作用域到声明完成初始化之前，这个绑定处在暂时性死区，读取会报错。因此，不能把它们简单理解成“完全不存在”，也不能理解成“声明被搬到了文件顶部”。

let 可以重新赋值，const 不允许重新给同一个绑定赋值。但是 const 指向的对象仍可能被修改。在实际代码中，不准备重新赋值的变量优先用 const，需要更新绑定时用 let；维护旧代码时再根据实际情况处理 var。

![三个声明，三种约束](https://note.lgdsunday.club/img/Q236/01-overview.webp)

## 知识点详解：把作用域、初始化和赋值分别看清楚

### 一个 if 块，为什么会影响外面的变量？

假设函数开始时，var 声明的 count 是 1。进入 if 块以后，再写一个同名的 var count 并赋值为 2。

这个普通代码块没有给 var 建立新的块级绑定。里面和外面操作的仍是同一个 count，所以离开 if 后，它还是 2。

换成 let 时，如果内外分别声明 count，就会有两个不同的绑定。块内修改自己的 count，外面的 count 仍然是 1。

这里最重要的不是花括号长什么样，而是声明所在的作用域。var 可以被函数限制，也可以存在于模块作用域；不能把 var 一律说成“全局变量”。[MDN 的 var 说明](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/var)也区分这些情况。

### 变量提升，不是把赋值也提前执行

我们经常用“提升”解释声明前的访问，但这个词容易让人误会成代码真的被搬家了。

对 var 来说，可以这样理解：运行到赋值语句之前，这个绑定已经存在，值是 undefined；运行到赋值语句时，才变成指定的值。

而 let、const 的绑定也有建立过程，只是还没有完成初始化。暂时性死区就是这段不能访问的时间，不是一个“值为 undefined 的空变量”。

所以，“var 声明前读取是 undefined”和“let 声明前读取报错”，来自不同的初始化规则，不来自浏览器把两段源码重新排了一遍。[let 文档](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let)给出了这条边界。

### 外层有同名变量，为什么也救不了暂时性死区？

假设外层的 price 是 100，内层块中又声明了 let price。

在这个内层作用域中，price 会解析到内层绑定。即使执行位置还没走到声明行，也不会因此绕过它，自动读取外面的 100。

如果内层声明前就读取 price，找到的是一个还没初始化的内层变量，因此抛出 ReferenceError。

这也是为什么“变量没声明就读取外面的”这句话不可靠。先确定名字解析到哪里，再看那个绑定是否已经能读取。

另一个追问是 typeof。对从未声明的名字使用 typeof，通常得到 "undefined"；对处在暂时性死区里的 let 变量使用 typeof，却仍然会报错。不要把这两个场景混在一起。

![找到名字，还不一定能读取](https://note.lgdsunday.club/img/Q236/02-tdz.webp)

图右侧单独展示初始化之后的读取；左侧示例若未捕获 ReferenceError，就会在第一次读取处中断，不会继续执行到后面的赋值。

### const 固定的是绑定，不是对象的所有属性

先看一个 TypeScript 示例：

```ts
const config = { retries: 2 };
config.retries = 3; // 修改同一个对象的属性，可以

const original = config;
console.log(config === original); // true
console.log(config.retries); // 3

// config = { retries: 5 };
// 上面才是给 const 绑定重新赋值，不允许。
```

config 仍然指向原来的对象，变化发生在对象内部。const 没有承诺这个对象中的每一个字段都不可修改。[const 文档](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const)明确区分了两者。

本题是 JavaScript 声明机制，TypeScript 沿用相应运行时行为；Python 没有完全对应的 var、let、const 和 TDZ，不需要造一份“同款 Python API”。

如果确实要限制对象修改，可以再讨论 Object.freeze；但它默认也只是浅冻结。TypeScript 的 readonly 主要是类型检查约束，也不是给运行时对象加一把锁。

![const 锁住的是指向](https://note.lgdsunday.club/img/Q236/03-binding.webp)

### 循环里的 let，为什么能保留不同的编号？

假设 for 循环注册了几个稍后运行的回调。使用 var 时，回调可能共享同一个循环变量，等它们执行时，循环已经结束。

使用 for 头部的 let 时，会有每轮迭代的绑定，回调可以保留自己那一轮的编号。

这不是“let 会让回调马上执行”，也不是定时器改变了作用域。异步时间安排和变量绑定是两件事。事件循环的排队规则可以另看旧题，答本题只要把绑定解释清楚。

## 面试官继续追问

### const 一定比 let 更快吗？

不应这样保证。默认用 const 主要是表达不重新赋值的意图，减少误改；真实性能还要看引擎、代码形态和测量结果，不能把编码习惯包装成固定加速结论。

### 顶层 var 一定会变成 window 的属性吗？

要看执行环境。浏览器经典脚本的顶层 var 与模块中的 var 不一样，Node.js 模块也不能直接套用经典脚本结论。先说明脚本还是模块，再回答。

### 同一作用域重复声明，会怎样？

重复 var 声明通常允许，但重新赋值仍可能改变结果；let、const 不允许在同一作用域重复声明同名绑定。不同内层块的遮蔽则是另一种情况，不能混成一条规则。

## 面试速记卡

> - 作用域：var 主要看函数等边界，let、const 还受普通代码块限制。
> - 初始化：var 提前为 undefined；let、const 初始化前有暂时性死区。
> - 遮蔽：先找到当前作用域的绑定，不会因为尚未初始化就自动读取外层。
> - const：不允许重新赋值，不代表对象深层内容不能改。
> - 选型：默认 const，需要重赋值时 let；不要用性能传言代替理由。

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
