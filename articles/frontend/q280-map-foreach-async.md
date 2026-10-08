# JavaScript 的 map 和 forEach 有什么区别？为什么不能直接用 forEach 等待异步任务？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q280-map-foreach-async/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：map 和 forEach 有什么区别？

🙋‍♂️ 我：map 返回一个新数组，forEach 没有返回结果。

🧑‍💻 面试官：那给 forEach 传 async 回调，再在前面写 await，能不能等三个请求全部结束？

🙋‍♂️ 我：回调有 await，应该可以吧。

🧑‍💻 面试官：外面的 await 等的是回调返回的 Promise，还是 forEach 本身返回的值？

> 回调能返回 Promise，不代表调用回调的那个方法会等待它。先看清外层方法返回什么，再写 await。

## 面试速答（60 秒版）

`map` 用于把每个元素转换成结果，再收集成一个新数组。`forEach` 主要用于逐项执行操作，返回值是 undefined，不收集回调的结果。

两者都会调用回调，但都不会自动等待 async 回调完成。用 async 回调调用 map，会得到一组 Promise；用 async 回调调用 forEach，这些 Promise 的结果不会被它汇总回来。因此，`await forEach(...)` 不能等待所有异步操作。

如果任务必须按顺序执行，我会用 for...of 在每一轮显式 await；如果任务彼此独立、允许并发，可以用 map 产生 Promise 数组，再交给 Promise.all 等待。数据量大时，还要控制并发数量，而不是一次发出所有请求。

![Q280 面试速答总览：map 乘二结果正确；异步任务分叉启动，Promise.all 聚合等待，不暗示 map 自动等待。](https://note.lgdsunday.club/img/Q280/01-overview-v2.webp)

## 知识点详解：数组回调执行了，不代表异步工作完成了

### map 收集的是返回值，forEach 关心的是执行过程

咱们假设有三个商品价格：10、20、30，需要得到打折后的新价格。

map 可以把每个价格乘以 0.8，收集成 8、16、24。原数组不因这个转换自动改变，但是回调如果修改了对象内部字段，仍可能影响原数组中的对象。“返回新数组”不等于深拷贝所有元素。

如果只是把每件商品的信息写入日志，不需要生成结果数组，那么 forEach 更符合这次操作的用途。

还有一个常见错误：map 回调使用大括号，却没有 return。此时每个回调返回 undefined，得到的新数组也装着 undefined。不是 map 失效，而是你没有交给它结果。

### await forEach 等到的其实是 undefined

下面假设 `fetchPrice` 是一个会稍后返回价格的异步函数：

TypeScript：

```ts
await ids.forEach(async (id) => {
  const price = await fetchPrice(id);
  console.log(price);
});
console.log("遍历结束");
```

forEach 调用第一个回调，回调执行到 await 就暂时让出；然后 forEach 继续调用后面的回调。它不会接过回调返回的 Promise，等待里面的请求完成。

所有回调被调用以后，forEach 自己返回 undefined。外面的 await 等待的是这个值，随后就可以继续打印“遍历结束”，而请求此时可能还没有完成。

异步回调失败也不能指望这个外层 await 替你统一捕获。没有被正确接住的 Promise 拒绝，还可能变成未处理的异常。

![Q280 知识点示意：相同任务并发启动；forEach 返回时任务未结束，Promise.all 成功续执行在最后完成后。](https://note.lgdsunday.club/img/Q280/02-async-v2.webp)

### 顺序执行与并发执行，要自己选清楚

如果下一件商品的处理必须等前一件完成，就逐项等待；如果互不依赖，再考虑并发。

TypeScript：

```ts
// 顺序执行：本轮完成以后才进入下一轮。
const sequential: number[] = [];
for (const id of ids) {
  sequential.push(await fetchPrice(id));
}

// 并发执行：map 收集 Promise，Promise.all 负责等待。
const concurrent = await Promise.all(ids.map(fetchPrice));
```

Python 的列表没有 JavaScript 这套 forEach API，下面是用 `asyncio` 表达同样的调度选择，不是直接翻译方法名：

```python
import asyncio

async def load_prices(ids, fetch_price):
    sequential = []
    for item_id in ids:
        sequential.append(await fetch_price(item_id))

    concurrent = await asyncio.gather(
        *(fetch_price(item_id) for item_id in ids)
    )
    return sequential, concurrent
```

示例为了对照，会把两种方案各运行一次；项目中按需求选择其中一种。`Promise.all` 与 `asyncio.gather` 也不是所有异常、取消行为都一样，不能据此推导它们完全等价。

并发结果按输入位置收集，不代表请求按这个顺序完成。并发能减少相互独立任务的总等待时间，但一万个元素也可能意味着一万个同时发出的请求，要另外安排限流和并发池。

## 面试官继续追问

**map 一定不会修改原数组吗？**

map 本身建立新数组，但回调可以修改原对象、原数组或外部状态。要分清方法的默认行为和回调主动做的事情。

**Promise.all 中一个请求失败，其他请求会自动取消吗？**

不会自动停止已经启动的操作。需要结合请求 API 的取消机制另行处理，不能把聚合 Promise 失败当作底层任务已经停了。

**forEach 可以 break 吗？**

没有像普通循环那样的 break。需要提前结束、逐项等待或明确控制流程时，直接使用适合的循环通常更清楚。

本文方法行为依据 [MDN forEach](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach) 和 map 文档核对。

## 面试速记卡

> - map：收集回调返回值，形成新数组。
> - forEach：逐项执行操作，自身返回 undefined。
> - async 回调：返回 Promise，但数组方法不会自动等待它。
> - 顺序任务：for...of 中逐项 await。
> - 并发任务：map 收集 Promise，再明确聚合等待并控制并发量。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
