# Promise 并发控制怎么实现？如何保证最多同时执行 N 个任务？

[字节前端面试真题](../companies/bytedance-frontend.md) · [携程前端面试真题](../companies/ctrip-frontend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q514-promise-concurrency-limit/) · [题库目录](../../README.md)

下面是一段模拟面试对话。

🧑‍💻 面试官：要发 100 个请求，但同时最多只能发 3 个，你怎么写？

🙋‍♂️ 我：把请求放到 Promise.all 里，再分成几组执行。

🧑‍💻 面试官：第一组有一个请求很慢，另外两个已经结束。后面的任务为什么还要一直等？

🙋‍♂️ 我：应该谁结束就补一个新任务，而不是等整组完成。

🧑‍💻 面试官：那我传给你的是已经调用 fetch 得到的 100 个 Promise，现在还能控制启动吗？

> 并发控制要卡住「开始执行」的位置：正在运行的任务占一个名额，结束以后才让下一项进入。

## 面试速答（60 秒版）

Promise 并发控制，就是让正在执行的异步任务始终不超过设定数量。Promise.all 负责汇总结果，本身不会把已经启动的请求限制成三路执行。

因此，任务应该以函数形式传进来，等调度器分配到名额以后再调用。可以启动固定数量的 Worker，每个 Worker 取一项任务，等待它结束，再取下一项。

例如限制为 3，就先启动 3 项，其中任何一项完成，都可以马上补入下一项，不需要等另外两项一起完成。[p-limit 的接口也接受待执行函数](https://github.com/sindresorhus/p-limit)。

同时，要提前规定失败策略和结果顺序。下面的实现会执行完全部任务，按输入位置返回成功或失败结果；如果需要失败后停止派发或取消请求，需要另加相应控制。

![并发池：最多三个任务同时运行](https://note.lgdsunday.club/img/Q514/01-concurrency-overview.webp)

## 知识点详解：把 100 个任务交给三个 Worker

### 限制的是任务工厂，不是已经开始的 Promise

假设每个任务都会查询一个文件信息。写出 `fetch(url)` 的时候，请求就已经开始了；后来把 Promise 放进队列，不会让这个请求倒退成未启动。

因此，队列里面放的应该是 `() => fetch(url)`。函数先保存着，轮到它的时候再调用。

这里的名额可以理解为“允许同时等待多少个任务完成”。它不等于 JavaScript 有多少个线程，也不保证每个请求只占一个底层连接。

![先创建函数，还是先发请求？](https://note.lgdsunday.club/img/Q514/02-start-boundary.webp)

### 完成一项，就继续取下一项

三个 Worker 共享一个下标。每个 Worker 在等待之前先领取自己的任务编号，再执行任务，把结果写到对应位置。

第 2 项先完成，可以立即启动第 4 项；第 1 项仍在运行，不影响这个补位动作。因此，它通常比固定分批等待更充分利用并发名额。

为了把失败行为讲清楚，下面返回的是 settled 结果：失败也占据自己的输入位置，Worker 会继续执行剩余任务。

#### TypeScript

```typescript
type Outcome<T> =
  | { status: "fulfilled"; value: T }
  | { status: "rejected"; reason: unknown };

async function pool<T>(
  tasks: Array<() => Promise<T>>,
  limit: number
): Promise<Outcome<T>[]> {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new RangeError("limit 必须是正整数");
  }
  const results: Outcome<T>[] = new Array(tasks.length);
  let next = 0;

  async function worker() {
    while (next < tasks.length) {
      const index = next++;
      try {
        results[index] = {
          status: "fulfilled",
          value: await tasks[index]()
        };
      } catch (reason) {
        results[index] = { status: "rejected", reason };
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, tasks.length) }, worker)
  );
  return results;
}
```

#### Python

```python
import asyncio

async def pool(tasks, limit):
    if isinstance(limit, bool) or not isinstance(limit, int) or limit < 1:
        raise ValueError("limit 必须是正整数")
    results = [None] * len(tasks)
    next_index = 0

    async def worker():
        nonlocal next_index
        while next_index < len(tasks):
            index = next_index
            next_index += 1
            try:
                results[index] = {
                    "status": "fulfilled",
                    "value": await tasks[index]()
                }
            except Exception as error:
                results[index] = {
                    "status": "rejected", "reason": error
                }

    await asyncio.gather(*[
        worker() for _ in range(min(limit, len(tasks)))
    ])
    return results
```

两种实现都运行在各自单个事件循环中，领取下标与增加下标之间没有 await，所以不会在这段同步操作中切走。它们不是跨线程共享队列。

Python 任务同样需要是“调用以后才创建工作”的函数，不能把已经用 create\_task 启动的任务当作工厂。外部取消也不属于普通任务失败；Python 示例不会吞掉 CancelledError。

![一个 Worker 空闲，就补一项](https://note.lgdsunday.club/img/Q514/03-worker-refill.webp)

### 完成顺序和结果顺序是两件事

假设 A、B、C 三项依次进入，B 最先结束。调度器可以先处理 B 的完成，再启动 D，但 B 的结果仍然写在位置 1。

因此，结果数组与输入一一对应，不能简单按回调到达顺序 push。否则调用方不知道某个结果属于哪项任务。

如果产品只需要完成事件流，也可以按完成顺序通知界面，但事件里面要带任务标识，最终汇总仍应有明确契约。

### 失败和取消要分别设计

本文的策略是继续执行全部任务。若需要首次失败后停止领取新任务，可以增加停止标记；已经运行的任务不会因为标记变化自动中断。

请求取消需要底层支持，例如 fetch 的 AbortSignal。即使本地停止等待，远端操作也可能已经发生，带副作用的任务还需要幂等设计。

测试时可以在任务开始和 finally 中维护活跃计数，检查峰值不超过 limit。再用不同耗时、同步抛错、拒绝和空列表验证结果与名额释放。

![完成顺序，不等于结果顺序](https://note.lgdsunday.club/img/Q514/04-order-failure.webp)

## 面试官继续追问

### limit 等于任务数，是不是就等同于 Promise.all？

启动规模相近，但本文返回 settled 结果，不是 Promise.all 的首次拒绝语义。并发调度与聚合失败策略可以分别选择。

### 限制并发可以防止接口限流吗？

不一定。并发数限制的是同一时刻在途任务；接口还可能按每秒请求数或 Token 配额限流。快速任务即使并发只有 3，也可能在一秒内产生很多请求。

### 有一百万项任务，还适合这个实现吗？

要避免一次创建全部任务和结果数组。可以使用懒加载队列或异步迭代器，让 Worker 持续取下一项，并把完成结果逐步写入存储。

## 面试速记卡

> - 任务工厂：轮到任务时才真正启动。
> - 固定 Worker：完成一项就补一项，活跃数量不超过上限。
> - 结果顺序：按输入编号保存，不能混同完成顺序。
> - 失败策略：继续执行、停止派发和取消在途任务分别设计。
> - 验证方法：记录活跃峰值，覆盖空输入、异常与乱序完成。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **字节跳动 · 前端（教育） · 实习**：怎样实现一个最多并发执行 N 个 Promise 任务的队列？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353157589376638976)；原帖编辑于 2021-03-04。
- **携程 · 前端 · 秋招（原帖标题）**：怎样手写 Promise 并发控制？（题意整理）。[面经来源](https://www.nowcoder.com/feed/main/detail/49c19c8ee0f74b149d7db81956b22f86)；原帖编辑于 2024-11-12。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
