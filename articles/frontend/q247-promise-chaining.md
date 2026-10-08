# Promise 的 then、catch、finally 怎么传递结果？为什么漏写 return 会出错？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q247-promise-chaining/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：then 里面启动一个请求，后面的 then 会自动等它吗？

🙋‍♂️ 我：会，因为它们在同一条链上。

🧑‍💻 面试官：如果那个回调没有返回请求的 Promise 呢？

🙋‍♂️ 我：那后面接到的可能是 undefined，不会按预期等待这个请求。

🧑‍💻 面试官：catch 里打印错误，但不再抛出，后面的链还是失败吗？finally 返回一个新值，又会不会覆盖之前的结果？

> 看链式调用，只抓一个动作：「这一节回调到底返回了什么，还是抛出了什么」。

## 面试速答（60 秒版）

then 每次返回一个新的 Promise。这个新 Promise 的结果，主要由回调的执行结果决定，不是原来的 Promise 被反复修改。

回调返回普通值，后面得到这个值；返回另一个 Promise 或可接受的 thenable，后面会跟随它的最终结果；抛出异常，后面进入拒绝状态。回调没有返回值，相当于返回 undefined。

catch 是处理拒绝的一种写法。它正常返回备用值，后续链可以恢复成功；它重新抛出或返回拒绝的 Promise，错误才继续向后传。

finally 适合收尾，正常结束时通常透传原结果，并不靠返回普通值覆盖它。但如果 finally 抛错或返回最终拒绝的 Promise，新的失败会影响后续结果。

所以，链中启动的异步任务必须明确接入返回路径，错误也要明确选择恢复还是继续传播。

![then 和 catch 的四种返回方式，以及 finally 的独立规则](https://note.lgdsunday.club/img/Q247/01-overview.webp)

## 知识点详解：把每一节当成一次结果交接

### p1.then 得到的是 p2，不是继续修改 p1

假设 p1 已经成功，值为 2。给它挂一个 then，回调把输入乘以 3，得到的新 Promise p2 会成功为 6。

p1 仍然表示原来的结果 2。如果再从 p1 挂一条不同分支，新分支也从 2 开始，不是从前一条分支计算的 6 开始。

[then 文档](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/then)说明了新 Promise 与回调结果的关系。先分清每一条链和分支，才不会把它们想象成一个不断变值的容器。

### 普通值、Promise、抛错，走向不同

可以把一次回调的结果理解为三种主要交接：

返回 6，后面拿到 6；返回一个稍后产生 6 的 Promise，后面跟随它；抛出错误，后面寻找拒绝处理。

如果回调缺省不返回，后面并不会自动猜它“真正想做的任务”是什么，只会按 undefined 这个正常返回结果继续。

TypeScript 示例：

```ts
const result = await Promise.resolve(2)
  .then(n => Promise.resolve(n * 3))
  .then(n => n + 1);

console.log(result); // 7

const missing = await Promise.resolve(2).then(n => {
  Promise.resolve(n * 3); // 启动了另一段工作，却没有返回它
});

console.log(missing); // undefined
```

第二段中的任务没有接到返回路径上。[MDN Promise 使用指南](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises)称这种遗漏返回的任务为 floating promise，后面的顺序和错误处理也因此更难控制。

不是说这个任务完全没有执行，而是主链没有承担等待它、接收它结果的职责。

![启动了，不等于接入了](https://note.lgdsunday.club/img/Q247/02-floating.webp)

图中假设 doAsyncJob 返回的 Promise 最后给出一个成功结果，final6 只是这个结果的示意标签。重点是主链有没有通过 return 等待它、接收它。

### catch 是恢复点，也可能只是错误继续走的中转站

假设读取失败，catch 返回一份备用配置。只要这个处理正常返回，后续链就可以拿备用配置继续运行。

但是，如果 catch 只是 console.error(error)，没有再抛错，也没有返回有意义的替代值，那么后续可能进入成功状态，并拿到 undefined。

这未必是业务希望的结果。记录错误不是传播错误，恢复成功也不代表原任务曾经成功。

如果错误不该被当前层消化，记录必要信息后重新抛出，或者让拒绝继续传递。不要为了让代码看起来“处理了异常”，在每一层都写一个吞掉结果的 catch。

还有一个容易漏的区别：同一次 then 的第二个参数，处理的是它所接收 Promise 的拒绝；不会直接捕获同一次 then 的成功回调新抛出的错误。后接 catch，才可以处理这个新 Promise 的拒绝。

![catch 可以把失败变回成功](https://note.lgdsunday.club/img/Q247/03-catch.webp)

### finally 为什么不按普通 then 的返回规则替换结果？

finally 主要用于关闭 loading、释放与这条异步路径相关的临时状态等收尾工作。

它不接收成功值或拒绝原因，正常结束时保留之前的结果。例如成功值是 7，finally 返回 99，后面通常仍然得到 7。[finally 文档](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/finally)专门说明了这个透传特点。

但如果收尾抛错，或者返回的异步收尾最终失败，链会因为这次失败而拒绝；如果收尾永远不结束，后面的链也不能按正常节奏完成。

因此，finally 不是“无论发生什么都不会影响主结果”。收尾本身也要可靠，不能把意外失败悄悄遮住原来的问题。

![finally 不靠普通返回值换结果](https://note.lgdsunday.club/img/Q247/04-finally.webp)

图里的红框表示后续 Promise 仍处于拒绝状态，不表示 then 的成功回调会收到错误并执行。

### Python 可以表达同一个任务顺序，但不是同一套 Promise API

Python 里可以用 await 组织“先取得值，再继续计算”的意图：

```python
import asyncio

async def multiply(n: int) -> int:
    return n * 3

async def run() -> int:
    try:
        result = await multiply(2)
        return result + 1
    finally:
        print("收尾")

print(asyncio.run(run()))  # 收尾，然后输出 7
```

这份代码用于对应顺序与清理意图，不是把 Python finally 当成 Promise.finally 的等价实现。Python coroutine 的启动、任务创建和取消规则都有自己的语义，不能照搬“漏 return 就一定得到相同的 undefined”这种结论。

### 调试时，为什么应该画结果链而不是只看缩进？

先标记每一节产生哪个 Promise，再检查 return、throw 和错误处理。缩进在同一个代码块中，不代表异步工作已经连在一起。

请求取消也需要另行处理。catch 捕获失败、finally 关闭提示，都没有自动撤销已经提交到服务端的操作。

本题只讲结果交接，微任务什么时候获得执行机会、多个请求怎样聚合，都与已有题目分开。

## 面试官继续追问

### then 里写 async 回调，会怎样？

async 回调返回 Promise。主链会跟随这个返回结果，但回调内部额外启动又不等待的任务，仍可能游离在外。

### catch 返回 Promise.reject(error)，会恢复吗？

不会恢复成功，后续会跟随这个拒绝结果。恢复要返回有明确意义的成功结果，不是把错误换个包装。

### finally 的清理也是异步，主链会等吗？

如果返回相应 Promise，就会等待它完成；如果只是启动任务却不返回，又回到遗漏交接的问题。

## 面试速记卡

> - then：返回新 Promise，结果由回调的返回或抛错决定。
> - return：普通值交值，Promise 交最终状态，不返回就交 undefined。
> - catch：正常返回可以恢复；记录日志不等于继续传播错误。
> - finally：正常收尾透传，收尾失败仍可能改变结果。
> - 调试：检查结果链，不靠缩进猜哪些任务被等待。

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
