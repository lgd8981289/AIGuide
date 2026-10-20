# for await...of 是什么？异步迭代、普通 for...of 和并发有什么区别？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q742-javascript-for-await-of-async-iteration/) · [题库目录](../../README.md)

*以下对话为教学模拟，用来讲解这道题。*

🧑‍💻 面试官：for await...of 是把 for...of 加上 await 吗？

🙋‍♂️ 我：可以这样理解，它会等每次异步操作结束再处理下一条。

🧑‍💻 面试官：如果传进去的是已经启动的三个请求，它们也会变成一个接一个启动吗？

🙋‍♂️ 我：循环虽然顺序等待，但请求可能已经同时发出去了。

🧑‍💻 面试官：那它到底在等什么？提前 break 时，数据源又怎么知道不需要继续提供数据？

> 先分开「生产何时启动」与「消费怎样等待」。for await...of 管的是异步取下一项，不会把已经发生的并发撤回去。

## 面试速答（60 秒版）

for await...of 用来消费异步可迭代对象。它取得异步迭代器，调用 next，再等待 next 返回的结果，拿到这一项以后执行循环体，然后继续取下一项。

它也能消费普通可迭代对象，像装着 Promise 的数组，循环会按数组顺序等待结果。但如果数组里的请求在创建 Promise 时就已经启动，顺序等待不代表顺序启动，也不能限制并发量。

异步生成器适合逐批读取数据，例如当前页处理完，再请求下一页。提前退出循环时，循环会尝试调用迭代器的 return 并等待清理。不过，这不代表任意网络请求都会自动取消，数据源还得把清理和取消逻辑写出来。

![异步迭代顺序消费与请求启动的区别](https://note.lgdsunday.club/img/Q742/01-async-iteration-overview.webp)

## 知识点详解：每一轮，循环究竟在等待什么？

### 普通迭代器立即交下一项，异步迭代器可以稍后交

普通 `for...of` 通过 `Symbol.iterator` 取得迭代器，每次调用 next，立即得到包含 value 和 done 的结果。

假设数据不是一个已经在内存里的数组，而是服务器分页返回的日志。调用“下一项”时，可能还要发请求，结果不能立即给出。异步迭代器就允许 next 返回 Promise，循环等它完成以后，再读取 value 和 done。

因此，`for await...of` 的 await 有明确对象。它不是给每一行代码都装上等待能力，也不会替循环体里没有 await 的异步操作自动收尾。

### 按需取下一批，和一次启动全部请求不同

下面用异步生成器模拟逐条提供数据。例子不连接真实接口，等待只用来展示执行顺序。

#### TypeScript

```ts
async function* items() {
  try {
    for (const id of [1, 2, 3]) {
      console.log("生产", id);
      await Promise.resolve();
      yield id;
    }
  } finally {
    console.log("清理数据源");
  }
}

async function run() {
  for await (const id of items()) {
    console.log("消费", id);
    if (id === 2) break;
  }
}
run();
```

#### Python

```python
import asyncio
from contextlib import aclosing

async def items():
    try:
        for item_id in [1, 2, 3]:
            print("生产", item_id)
            await asyncio.sleep(0)
            yield item_id
    finally:
        print("清理数据源")

async def run():
    async with aclosing(items()) as source:
        async for item_id in source:
            print("消费", item_id)
            if item_id == 2:
                break

asyncio.run(run())
```

两份示例都会依次生产和消费 1、2，随后清理，不生产 3。真实分页程序可以在生成器里请求当前页，再 yield 记录；消费者处理得慢，后面的请求也可以晚一点发生。

Python 的 async for 使用自己的异步迭代协议，不能像 JavaScript 一样直接消费普通列表。这里额外使用 aclosing，是为了在 break 后确定地关闭异步生成器，不能照搬 JavaScript 的退出行为。

![正文异步生成器在请求下一项时才继续执行](https://note.lgdsunday.club/img/Q742/02-production-consumption.webp)

### Promise 数组为什么不等于并发控制器？

假设先执行 `ids.map(fetchItem)`，得到三个 Promise，然后交给 for await...of。创建这组 Promise 时，三个 fetchItem 已经被调用了。循环只是按输入顺序领取结果。

如果第三个请求先完成，它仍然要等前面的结果消费完，才能进入自己的那一轮；如果后面的 Promise 先拒绝，却暂时还没被循环等待，还可能产生未处理拒绝问题。

因此，批量独立任务通常需要明确的聚合和并发管理。需要串行启动，就在普通 for...of 中调用并 await；需要有限并发，就安排工作池。异步迭代主要解决“怎样逐项交付结果”，并发上限是另一件事。

### break 清理了什么，必须看数据源

[异步迭代的退出规则](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of)规定，提前退出时会尝试调用迭代器的 return。异步生成器可以借此进入 finally，关闭游标、释放读锁或记录结束状态。

但是，调用 return 不等于浏览器已经撤销一个进行中的 fetch。需要中断网络请求时，还要把 AbortSignal 传给请求，并在退出路径触发取消。

另一个容易混淆的边界是错误来源。同步生成器 yield 一个拒绝的 Promise，再用 for await...of 消费，与原生异步生成器内部失败的清理行为并不完全相同。需要资源保证时，优先选择清晰的异步生成器和 try/finally，不把任何来源都看成一个普通 Promise 数组。

![迭代退出清理与真实请求取消是两条责任](https://note.lgdsunday.club/img/Q742/03-break-source-cleanup.webp)

## 面试官继续追问

### 循环体里的任务没写 await，会怎样？

当前循环体会继续完成，之后取下一项。那些任务可能同时运行。要保证处理完成以后再取下一项，就显式 await 处理函数。

### for await...of 可以写在任意函数里吗？

不能。通常放在 async 函数中；支持顶层 await 的模块环境也可以使用。是否支持还取决于目标运行环境和编译配置。

### 怎样证明程序真的按需生产？

记录生产开始、返回、消费完成和 finally 四类事件。让消费变慢，再提前 break，检查第三项是否被生产、资源是否关闭。不能只看最终结果的排列顺序。

## 面试速记卡

> - 异步迭代：next 可以稍后交出下一项，循环逐次等待。
> - 顺序消费：不代表已创建的 Promise 顺序启动。
> - 循环体：需要等待的处理，仍然要自己写 await。
> - 提前退出：尝试调用 return；真实取消要由数据源实现。
> - Python 对照：async for 协议不同，确定关闭可配合 aclosing。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
