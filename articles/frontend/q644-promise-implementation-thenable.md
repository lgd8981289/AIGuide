# 手写 Promise 应该怎么实现？状态流转、链式调用和 thenable 怎么处理？

[微步在线前端面试真题](../companies/weibu-frontend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q644-promise-implementation-thenable/) · [题库目录](../../README.md)

*下面是用于讲题的模拟面试对话。*

🧑‍💻 面试官：保存一个状态和两个回调，手写 Promise 就完成了吗？

🙋‍♂️ 我：还要支持多个 then、异步回调和返回的新 Promise。

🧑‍💻 面试官：then 返回一个还没完成的 Promise，下一步能直接拿到这个对象当结果吗？

🙋‍♂️ 我：需要接管它后续的状态，不能简单把对象当最终值。

🧑‍💻 面试官：一个 thenable 先调用成功，又调用失败，甚至读取 then 时就抛异常，你准备在哪处理？

> 手写 Promise 的难点，在于后续结果怎样接管前一个结果。状态只能定一次、回调按顺序异步执行、返回值继续被解析，这几条要同时成立。

## 面试速答（60 秒版）

实现 Promise，可以先拆成状态保存、回调订阅和结果解析三部分。

状态从 pending 进入 fulfilled 或 rejected 后不再改变。then 可以被调用多次，回调按注册顺序异步执行；它还要返回一个新的 Promise，让后续结果与原来的状态分开。

回调返回普通值，新 Promise 就用这个值完成；抛异常就拒绝。返回 Promise 或 thenable 时，要读取并调用它的 then，等待它给出结果，同时防止重复完成和直接循环引用。

还需要区分“已经决定跟随某个结果”和“已经最终完成”。resolve 一个尚未完成的 Promise 后，不能再让后面的 reject 抢走结果。

最后使用规范用例测试。Promises/A+ 主要规定 then 的互操作行为，不等于原生 Promise 的全部功能；通过它也不能声称 all、finally、宿主微任务顺序等都已经实现。

![手写 Promise，要接住哪几件事？](https://note.lgdsunday.club/img/Q644/01-promise-implementation-thenable.webp)

## 知识点详解：从一个状态机，接成可以继续传递的链

### pending 里保存等待者，完成后也能订阅

任务没完成时，then 注册的回调先存起来。完成后按照注册顺序安排执行；如果之后才调用 then，也要能拿到相同的结果，但不能在当前调用栈里立刻同步执行回调。

这里的“一次完成”指结果的身份固定，不意味着结果对象被深度冻结。Promise 完成后拿到一个对象，这个对象本身仍可能被别的代码修改。[Promises/A+ 规范](https://promisesaplus.com/)明确了状态和 then 的要求。

本题教学实现用 queueMicrotask 调度回调。A+ 规定异步边界，并不把浏览器原生 Promise 与所有宿主队列的细节全都写进标准；原生行为还要看 [ECMAScript Promise 规范](https://tc39.es/ecma262/multipage/control-abstraction-objects.html#sec-promise-objects)。

### then 要返回另一个结果容器

假设 p1 成功值为 2，回调把它加 1。p1 仍保存 2，新返回的 p2 才保存 3。如果回调抛异常，也是 p2 失败，不能倒过来修改已经完成的 p1。

没有提供成功回调时，成功值要继续往后传；没有提供失败回调时，失败原因也要继续往后传。否则链中间省略一个处理器，后面就会莫名丢掉结果。

下面是本题完整实现中的 then 核心。schedule 是被原 Promise 完成过程调用的订阅函数，resolve 和 reject 属于新 Promise。

#### TypeScript

```typescript
then(onFulfilled?: any, onRejected?: any): MiniPromise {
  return new MiniPromise((resolve, reject) => {
    const schedule = () => queueMicrotask(() => {
      const callback = this.state === "fulfilled" ? onFulfilled : onRejected;
      if (typeof callback !== "function") {
        if (this.state === "fulfilled") resolve(this.value);
        else reject(this.value);
        return;
      }
      try { resolve(callback(this.value)); }
      catch (error) { reject(error); }
    });
    if (this.state === "pending") this.listeners.push(schedule);
    else schedule();
  });
}
```

这是类方法片段，依赖本题资料目录 `代码/mini-promise.ts` 的完整类。实现为便于讲解采用宽类型，没有把生产级泛型声明混进状态推导。Promises/A+ 是 JavaScript 互操作规范；Python 的 Future/Task 有不同协议，本题不伪造一个同名 Python API 或宣称 asyncio 是对应实现。

![then 的返回值，怎样进入下一条链？](https://note.lgdsunday.club/img/Q644/02-promise-implementation-thenable.webp)

### 返回 thenable，为什么不能只检查 instanceof？

其他库或执行环境提供的对象，可能没有继承我们这份 MiniPromise，但它们有可以调用的 then。接管结果时要处理这种互操作情况。

先读取 then，读取过程可能触发 getter 并抛错。读取成功且值是函数，就保持正确的接收对象调用它；不是函数，则把原对象当普通值。

对方还可能重复调用成功或失败回调。每次接管都需要自己的“一次有效”标记，成功以后再抛的异常也不能反过来改变结果。新 Promise 等待自己时要拒绝，否则这条链永远无法完成。

### 已经跟随一个结果，不等于已经 fulfilled

假设执行器先 resolve 一个待完成的 Promise，再立即 reject。外层仍在等待被跟随对象，却已经接受了第一次 resolve，后面的 reject 不应该生效。

因此，只用 `state === pending` 检查执行器能否继续改变结果还不够。完整实现单独保存执行器是否已经做出决定，再由内部解析过程等待最终结果。它和 thenable 自己的重复回调保护，也不是同一层标记。

![锁定决议，不等于结果已经完成](https://note.lgdsunday.club/img/Q644/03-promise-implementation-thenable.webp)

### 怎样证明没有漏掉角落？

至少检查同步与异步完成、多个订阅、值穿透、异常、嵌套 thenable、重复回调、读取 then 抛错和直接自引用。再使用[官方 A+ 测试套件](https://github.com/promises-aplus/promises-tests)验证互操作要求，实际结果写入参考资料。

本批已经用官方套件运行完整源码，872 项 Promises/A+ 用例通过。这个结果只说明本次实现通过了这些互操作测试；源码没有实现所有原生静态方法、finally、取消和未处理拒绝跟踪，不能据此声称完整复刻了原生 Promise。

## 面试官继续追问

### 为什么执行器同步，then 回调却异步？

执行器负责立即建立任务；回调异步执行让订阅方得到稳定的后续执行边界，避免同一 API 因任务已完成或未完成而有两套同步行为。两者的时机不要混为一谈。

### resolve 一个普通对象，会冻结对象吗？

不会。固定的是 Promise 最终结果的引用身份，结果对象自己的可变性仍由对象和使用代码决定。

### Promise 能终止里面的网络请求吗？

结果容器不自动获得取消底层任务的能力。网络请求需要对应的取消信号与资源清理机制，不能把拒绝一个 Promise 当成请求已经停止。

## 面试速记卡

> - 状态最终确定一次，then 可多次订阅并异步按顺序执行。
> - then 返回新 Promise，回调的值和异常决定新结果。
> - thenable 按协议接管，不能只认 instanceof。
> - 执行器决策锁与 thenable 回调保护分别处理。
> - A+ 互操作测试通过，不等于完整复刻原生 Promise。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **微步在线 · 前端 · 秋招**：怎样手写 Promise，并实现链式调用？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353158611784376320)；正文记录 9 月 26 日一面；原帖发布于 2021-09-26。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
