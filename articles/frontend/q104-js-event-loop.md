# JavaScript 事件循环是什么？宏任务、微任务和 async/await 怎么执行？

[字节前端面试真题](../companies/bytedance-frontend.md) · [百度前端面试真题](../companies/baidu-frontend.md) · [阿里前端面试真题](../companies/alibaba-frontend.md) · [腾讯前端面试真题](../companies/tencent-frontend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q104-js-event-loop/) · [题库目录](../../README.md)

*下面是一段教学模拟。本文讨论浏览器中的普通脚本，不混用 Node.js 的调度规则。*

🧑‍💻 面试官：“setTimeout(fn, 0) 会马上执行吗？”

🙋‍♂️ 我：“不会，要等当前同步代码执行完。”

🧑‍💻 面试官：“脚本里还有 Promise.then 和 await，定时器排在它们前面还是后面？”

🙋‍♂️ 我：“先处理已经排队的微任务，定时器回调在后面。”

🧑‍💻 面试官：“你怎么知道 await 后面的代码已经排队？如果一个微任务又加了一个微任务，浏览器什么时候才能更新画面？”

> 分析执行顺序时，要跟踪代码现在执行到哪里、回调何时入队，以及队列里的工作何时获得执行机会。

## 面试速答（60 秒版）

浏览器先运行当前任务中的同步代码。脚本执行结束后，在微任务检查点处理排队的微任务，期间新增的微任务也会继续处理；之后才有机会更新渲染、选择下一项任务。

Promise 的后续回调属于微任务。async 函数在第一个 await 之前仍同步执行，await 暂停函数的后续部分，等待完成后再通过微任务继续。定时器回调属于 task，零延迟也需要等执行机会。

具体分析时，我会先记录同步输出，再按实际入队顺序处理微任务，最后看后续任务。一直追加微任务或执行大计算，都可能拖住页面；async 和 Promise 不会自动把计算搬到别的线程。

渲染只是机会，不保证每轮发生。浏览器有不同任务来源，Node.js 还有自己的规则，不能把所有情况简化成一个全局先进先出队列。

![当前任务结束后处理微任务，后续任务与渲染等待执行机会](https://note.lgdsunday.club/img/Q104/00-60s-overview-v3.webp)

## 跟着一段代码，逐步看见队列变化

### “登记回调”和“执行回调”分别发生在哪里？

假设页面正在执行一段普通脚本。咱们先分清三个对象。

调用栈记录正在执行的函数。调用一个函数，它就开始执行；函数返回，再回到调用它的位置。当前这段 JavaScript 会继续运行，排队的回调不能随意插进来。

浏览器提供定时器等宿主能力。执行 `setTimeout(fn, 0)` 时，当前代码登记定时器，然后继续往下走。满足定时条件后，浏览器安排后续任务来执行 `fn`，登记那一刻并没有执行它。

微任务队列则保存要在微任务检查点处理的工作，例如已兑现 Promise 的 `.then` 回调。[MDN 执行模型](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model)说明了引擎与宿主的分工；“宏任务”是常用面试术语，本文对应 HTML 标准里的 task。

这里先用普通脚本结束后的检查点推导例子。更完整的浏览器规则还包含其他检查点，不能扩展成“每一次函数返回都清空微任务”。

### 同一段代码，哪些字母现在就打印？

下面使用 TypeScript 代码块展示，它没有额外类型语法，也可以直接作为 JavaScript 放进浏览器控制台执行。Python 的 asyncio 使用另一套机制，本文不提供伪装成等价实现的 Python 版本。

```typescript
console.log("A");
setTimeout(() => console.log("B"), 0);
Promise.resolve().then(() => console.log("C"));

async function run() {
  console.log("D");
  await Promise.resolve();
  console.log("E");
}

run();
console.log("F");
```

先别急着背输出。沿代码走一遍，每遇到一个回调，就问它现在运行了吗。

| 执行到的位置                        | 当前发生的事              | 微任务队列，从左到右    | 已打印   |
| ----------------------------- | ------------------- | ------------- | ----- |
| `console.log("A")`            | 同步打印                | 空             | A     |
| `setTimeout(...)`             | 登记 B，等待定时条件与后续任务    | 空             | A     |
| `Promise.resolve().then(...)` | Promise 已兑现，C 的回调入队 | C             | A     |
| 调用 `run()`                    | 进入函数，同步打印 D         | C             | A、D   |
| 遇到 `await Promise.resolve()`  | 暂停 run 的后半段，安排继续执行  | C、继续 run 打印 E | A、D   |
| 外层 `console.log("F")`         | run 已让出控制，外层继续打印    | C、继续 run 打印 E | A、D、F |

**当前脚本结束时，输出只有 A、D、F。** C 和 E 已经排队，B 则要由后续的定时器任务执行。B 此时是否已满足定时条件，不影响它不能插入当前脚本、不能抢在本例微任务前执行的判断。

![脚本结束时输出 A、D、F，微任务队列依次为 C、继续 run 打印 E，随后执行定时器 B](https://note.lgdsunday.club/img/Q104/02-queue-walkthrough-pilot.webp)

看图时先看左边的“已经执行”，再看中间的“仍在排队”。这样就能区分输出记录与待执行的工作，避免把登记 B 误认成已经打印 B。

### 脚本结束以后，C、E、B 怎样接上？

现在进入微任务检查点。先取出 C 的回调，打印 C；队列里还剩 run 的后续部分，再恢复 run，打印 E。这个例子里，没有继续产生其他微任务，队列清空。

之后，浏览器继续调度。等 B 的定时器任务被选中，它才打印 B。所以最终顺序是 `A、D、F、C、E、B`。

这里能判断的是这些输出之间的顺序，无法据此断言 C 与 E 之后必然立刻绘制一帧，也不能断言下一项被选择的任务一定是 B。页面可能还有别的工作，但本例 B 的打印仍然在前面这些输出之后。

[HTML 标准的事件循环处理模型](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-processing-model)规定了任务、微任务检查点和渲染机会的处理条件。浏览器事件循环可能有多个任务队列，来自不同任务源的工作不能统一按登记时间排成一条队伍。

### 为什么 run 的前半段同步，后半段却要排队？

`async` 表示这个函数会返回 Promise，调用它时，函数体仍从开头执行。到了 `await`，先求值它后面的表达式，再暂停函数的后续执行，把控制交还给调用者。等待完成后，后半段才有机会继续。

本例等待的是一个已兑现的原生 Promise，所以 E 的继续执行安排在 C 之后。这里的 E 只是咱们对“继续 run”这项工作的简称，浏览器没有一个名叫 E 的专用队列。

![run 的 D 在当前调用中执行，await 将控制交还外层打印 F，E 在微任务中继续](https://note.lgdsunday.club/img/Q104/03-await-split-pilot-v2.webp)

图里只跟踪 D、F、E，前一个例子中 C 的微任务仍在 E 前执行。当前执行路线从 D 返回外层，继续 F；另一条路线表示 run 的后半段等待后再继续 E。await 暂停了 run，外层脚本仍可以往下执行。

把例子中的 `await Promise.resolve()` 改成 `await 1`，E 仍异步继续，本例输出顺序不变。若改为等待尚未完成的网络请求，E 就需要等请求完成后才安排继续，不能再预先判定 E 一定早于 B。[MDN 的 async 函数说明](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)解释了这种分段执行。

再补一个经常混淆的边界。`new Promise` 的执行器会在创建 Promise 时立即调用，`.then` 回调则随后执行。下面会依次打印 `执行器、脚本末尾、then`。

```typescript
new Promise<void>((resolve) => {
  console.log("执行器");
  resolve();
}).then(() => console.log("then"));

console.log("脚本末尾");
```

这是 TypeScript 示例。浏览器控制台运行时，删除 `<void>` 即可；队列规则没有改变。

### 一个微任务又加了一个，为什么不能先执行定时器？

再看一个有限的例子。

```typescript
setTimeout(() => console.log("timer"), 0);

queueMicrotask(() => {
  console.log("M1");
  queueMicrotask(() => console.log("M3"));
});
queueMicrotask(() => console.log("M2"));

console.log("S");
// 输出：S、M1、M2、M3、timer
```

脚本结束时，微任务队列是 M1、M2。执行 M1 时，它又把 M3 加到队尾，所以队列变为 M2、M3。继续处理 M2 和 M3，清空队列之后，timer 才能在后续任务中运行。

![微任务队列从 M1、M2 变为 M2、M3，并继续清空，定时器与页面工作仍需等待](https://note.lgdsunday.club/img/Q104/04-microtask-drain-pilot-v2.webp)

微任务检查点会继续处理新加入的微任务。若 M3 又追加下一项、下一项再追加，始终没清空，后续任务和渲染就可能一直拿不到机会。[MDN 微任务指南](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide)说明了这一规则及持续追加的风险。

因此，把大计算放进 Promise 回调，仍然会占用执行它的线程。工程上可以把工作拆成小批次，让出到后续任务；适合独立计算的部分，可以考虑 Web Worker。选哪种方式，要看是否依赖 DOM、通信成本和计算规模。只是再加一个 `await Promise.resolve()`，通常仍在微任务之间继续，不能据此保证页面获得绘制机会。

### DOM 改了，为什么用户可能还没看见？

修改 DOM 更新了页面状态，用户看见新画面还需要浏览器完成渲染。浏览器会结合刷新时机、页面是否可见以及是否有必要更新等条件决定，不会在每一轮结束后都绘制。

`requestAnimationFrame` 用于在后续渲染更新期间安排动画相关回调，它也有自己的处理位置。遇到它，要把渲染时机纳入分析，不要直接把它当作普通定时器排在固定的第三行。

如果目标是避免卡顿，就要观察主线程占用和实际帧表现；某个回调“已经异步”不足以证明页面流畅。

## 面试官继续追问

### 把 C 的登记移动到 run() 后面，会怎样？

本例等待已兑现的原生 Promise。先调用 run，E 的继续执行先安排，随后才登记 C，因此输出变为 `A、D、F、E、C、B`。判断依据是入队时间，不能见到 `.then` 就认定它总比 await 先执行。

### setTimeout 写了 100 毫秒，就一定准时吗？

到达定时条件后，还要等待执行机会。主线程忙、后台页面限制等因素都可能增加延迟。这个值不能作为回调在准确时刻执行的承诺。

### Node.js 也能直接套这张图吗？

Node.js 使用自己的事件循环与宿主机制，还涉及 `process.nextTick`、`setImmediate` 等规则。先确认环境，再核对对应阶段；浏览器的渲染机会也不能搬到 Node.js 中。

## 面试速记卡

> - 登记回调后，当前脚本继续执行；登记记录与输出记录分开看。
> - Promise 执行器立即调用，then 回调在后续微任务中运行。
> - async 函数先执行到 await，等待完成后再继续后半段。
> - 先找实际入队时间，再推导微任务顺序。
> - 微任务检查点会继续处理新加入的微任务，直到队列清空。
> - 异步语法不会自动转移计算线程，也不保证渲染发生。
> - 普通脚本、任务来源与宿主环境都是判断顺序的前提。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **字节跳动 · 前端 · 社招**：事件循环怎样决定 JavaScript 的执行顺序？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/786037843704479744)；原帖编辑于 2025-09-01。
- **字节跳动 · 前端 · 实习**：事件循环怎样决定 JavaScript 的执行顺序？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/756639561995870208)；原帖发布于 2025-05-26。
- **百度 · 前端 · 实习（原帖标签）**：事件循环怎样决定 JavaScript 的执行顺序？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/530709141912829952)；原帖编辑于 2023-09-15。
- **阿里巴巴 · 前端 · 原帖未明确批次**：事件循环怎样决定 JavaScript 的执行顺序？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353156404150214656)；历史面经，面试年份未明确；页面编辑于 2025-03-08。
- **腾讯 · 前端 · 原帖未明确批次**：事件循环怎样决定 JavaScript 的执行顺序？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353156404150214656)；历史面经，面试年份未明确；页面编辑于 2025-03-08。
- **字节跳动 · 前端 · 原帖未明确批次**：浏览器与 Node 的事件循环有什么差异？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353156819747020800)；原帖编辑于 2020-08-24。
- **腾讯 · 前端（TEG / QQ音乐 / PCG） · 暑期实习**：setTimeout 能否准时执行，浏览器和 Node 的事件循环怎样工作？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353156343349583872)；面试记录为 2020 年 3 月；原帖编辑于 2020-04-19。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
