# Node.js 的 process.nextTick、Promise 和 setImmediate 按什么顺序执行？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q352-node-event-loop-phases/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：Node 的 nextTick、Promise 和 setImmediate，谁先执行？

🙋‍♂️ 我：一般是 nextTick、Promise，再 setImmediate。

🧑‍💻 面试官：把同一段代码放进 mjs，Promise 怎么跑到 nextTick 前面了？

🙋‍♂️ 我：ES Module 顶层执行的上下文不同。

🧑‍💻 面试官：那 setTimeout(0) 和 setImmediate 谁先？如果不断递归 nextTick，会不会饿死 I/O？

> 顺序题必须先交代「在哪里调度」。CommonJS 顶层、ESM 顶层和 I/O 回调，不是一张固定优先级表。

## 面试速答（60 秒版）

Node 会先执行当前同步代码，再处理相应的待执行回调。在常见 CommonJS 顶层例子中，nextTick 队列通常先于 Promise 微任务，setImmediate 则在事件循环的 check 阶段执行。

但 ESM 顶层本身处于不同的异步执行上下文，同样的简单例子可能先执行 Promise，再执行 nextTick。因此，不能脱离模块类型背一个永久顺序。

setTimeout(0) 与 setImmediate 在顶层的相对顺序也不能一概保证；在 I/O 回调中安排它们时，通常是 setImmediate 先执行。

实际使用时，我不会为了“尽快”无限递归 nextTick，因为这可能长期不给事件循环处理 I/O 的机会。大量工作应分批执行，并让出调度机会。

![先说上下文，再排异步顺序](https://note.lgdsunday.club/img/Q352/01-overview.webp)

*图：先说上下文，再排异步顺序。*

## 知识点详解：同一段代码，执行上下文为什么改变顺序？

### 先把同步执行与排队分开

调用 nextTick、Promise.then 或 setImmediate，并不等于对应回调马上执行。当前同步代码仍要先完成，然后运行时根据队列和事件循环阶段继续处理。

其中 nextTick 是 Node 的专门队列，不是事件循环中的一个普通阶段；Promise 回调属于微任务；setImmediate 属于 check 阶段。

下面的代码没有 TypeScript 特有语法，但用 TypeScript 形式展示。实验时必须分别保存成 cjs 与 mjs，不能只看编辑器扩展名。

#### TypeScript

```ts
console.log("sync");
process.nextTick(() => console.log("tick"));
Promise.resolve().then(() => console.log("promise"));
setImmediate(() => console.log("immediate"));
```

普通顶层 CommonJS：sync → tick → promise → immediate。

ESM 顶层：sync → promise → tick → immediate。

这里没有对应的 Python API。asyncio 的调度规则不能拿来解释 Node 队列。

### ESM 为什么先打印 promise？

ESM 的加载和顶层执行进入异步流程。这个例子执行时，已经处在微任务相关上下文中，新增的 Promise 回调会继续随该队列处理，然后才转到其他队列。

它不是说“ESM 永远把所有 Promise 放在所有 nextTick 前面”。换成其他回调上下文，或者在回调里继续安排任务，结果还要按实际队列过程分析。

官方的 [setImmediate 说明](https://nodejs.org/en/learn/asynchronous-work/understanding-setimmediate) 同时给出了 CommonJS 与 ESM 的对照。

### setTimeout(0) 为什么不是“零毫秒立即执行”？

计时器延迟表示经过相应阈值后有资格被处理，不保证准时运行。同步代码、事件循环负载及其他回调，都可能推迟实际执行。

顶层同时安排 setTimeout 和 setImmediate，结果受启动时机等因素影响，不要只运行一次就认定固定顺序。

但在典型 I/O 回调中安排两者，setImmediate 会在当前循环的 check 阶段得到机会，而计时器要按后续计时器处理时机执行。还要留意 Node/libuv 版本的阶段调整，见 [事件循环官方说明](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick)。

![I/O 回调里，看事件循环阶段](https://note.lgdsunday.club/img/Q352/02-io.webp)

*图：I/O 回调里，看事件循环阶段。*

### 为什么 nextTick 可能让 I/O 一直等？

如果 nextTick 回调再次安排 nextTick，队列可能持续有工作要处理。事件循环就迟迟无法进入正常 I/O 阶段。

假设要处理一百万条记录，不应该把全部拆成连续 nextTick 来声称“异步就不卡了”。可以分批处理，通过 setImmediate 等方式让出机会；如果计算本身很重，还要评估工作线程或其他执行资源。

异步排队不等于计算并行，也不等于不会阻塞事件循环。

![一直排 nextTick，I/O 就一直等](https://note.lgdsunday.club/img/Q352/03-starve-v2.webp)

*图：setImmediate 是让出调度机会的一种方式，不是唯一能让 I/O 继续处理的 API。*

## 面试官继续追问

### queueMicrotask 和 nextTick 是同一个队列吗？

不是。queueMicrotask 使用微任务队列，nextTick 有 Node 特有的处理机制。不能只因为都在稍后执行就认定相同。

### 浏览器也有 nextTick 和 setImmediate 吗？

这不是普通浏览器标准 API。Vue 的 nextTick 又是框架更新语义，不应混在一起。

### 线上延迟高，检查事件循环有什么用？

能判断是否存在长同步任务、回调堆积或调度饥饿。需要结合 CPU 和实际调用路径，而不只看接口总耗时。

## 面试速记卡

> - 分析顺序：先说明模块类型和调度位置。
> - CommonJS 顶层常见例子：同步 → nextTick → Promise → immediate。
> - ESM 顶层：简单例子的 Promise 与 nextTick 顺序可能不同。
> - 定时器：达到阈值不等于立即执行。
> - 避免饥饿：大量工作分批，不无限递归 nextTick。

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
