# requestIdleCallback 和 scheduler.yield 有什么区别？长任务怎样分片才不阻塞交互？

[字节前端面试真题](../companies/bytedance-frontend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q750-requestidlecallback-scheduler-yield-long-tasks/) · [题库目录](../../README.md)

*以下对话为教学模拟，用来讲解这道题。*

🧑‍💻 面试官：处理一大批数据时页面点不动了，你怎么改？

🙋‍♂️ 我：把函数改成 async，每处理一批 await 一下。

🧑‍💻 面试官：await Promise.resolve 呢？它会让浏览器有机会处理输入和绘制吗？

🙋‍♂️ 我：微任务可能会继续连着执行，还需要真正让出任务。

🧑‍💻 面试官：那空闲回调和 scheduler.yield 都能用，为什么还要区分？用户正等着的工作，也能一直等空闲吗？

> 空闲回调是在等一个合适的开始机会，yield 是当前工作主动停一停。两者都没有把计算搬到另一个线程。

## 面试速答（60 秒版）

requestIdleCallback 适合可推迟的低优先级工作。浏览器空闲时调用回调，程序根据 timeRemaining 等信息控制这一轮做多少；如果工作必须执行，还要考虑 timeout 和兼容性，不能假定空闲总会及时出现。

scheduler.yield 用在已经开始的异步函数中，让出主线程，把后续工作安排到新的任务继续。它适合把长任务拆成短段，让输入和其他任务有机会运行，但不承诺每次 yield 后一定发生一次绘制。

await 一个立即兑现的 Promise 通常只是进入微任务续执行，不能代替任务级让出。无论采用哪种方式，单个不可分割的计算如果仍然很长，页面照样会卡；这时可能需要换算法或使用 Web Worker。

![空闲开始与已开始任务主动让出的区别](https://note.lgdsunday.club/img/Q750/01-cooperative-scheduling-overview.webp)

## 知识点详解：别只给函数加 async，要让主线程真正有空

### 为什么换成 async 也可能一样卡？

假设页面需要处理十万条记录。函数开头写 async，不会让普通循环自动去后台线程运行。只要当前 JavaScript 一直占着主线程，输入处理和渲染就只能等。

循环里反复 `await Promise.resolve()`，虽然会暂停当前函数，但续执行进入微任务队列。浏览器在合适的渲染机会之前，仍然需要清空相应微任务。一批工作只是拆成很多连续微任务，可能仍然没有交互机会。

因此，先问“后半段被安排到哪里”，不能只数代码里写了几个 await。

![微任务续执行与新任务续执行的时间线差异](https://note.lgdsunday.club/img/Q750/02-microtask-versus-task-yield.webp)

### 工作可以晚点做，才考虑等空闲

比如收集不影响当前界面的统计摘要，可以交给 requestIdleCallback。回调拿到 deadline，检查剩余预算，再决定继续处理还是下一次再来。

但它不适合承诺严格的完成时刻。页面持续繁忙时，回调可能等很久；timeout 只能促使到期后安排任务，并不会把一个过大的回调变成不卡顿的小回调。

回调里面照样需要控制工作量，也不要把复杂 DOM 修改整批塞进去，再以为“空闲时开始”就永远不会影响后续交互。

### 工作正在做，可以主动分段让出

下面是浏览器中的简化分片器。8ms 只是示例预算，真实值要结合设备和单项成本测量；任务状态、取消和异常由调用方继续处理。

#### TypeScript（浏览器）

```ts
type CooperativeScheduler = { yield?: () => Promise<void> };

async function yieldToMain() {
  const scheduler = (globalThis as typeof globalThis & {
    scheduler?: CooperativeScheduler;
  }).scheduler;
  if (scheduler?.yield) await scheduler.yield();
  else await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

async function processItems<T>(items: readonly T[], work: (item: T) => void) {
  let started = performance.now();
  for (const item of items) {
    work(item);
    if (performance.now() - started >= 8) {
      await yieldToMain();
      started = performance.now();
    }
  }
}
```

#### Python（asyncio 概念对照）

```python
import asyncio
from time import perf_counter

async def process_items(items, work):
    started = perf_counter()
    for item in items:
        work(item)
        if perf_counter() - started >= 0.008:
            await asyncio.sleep(0)
            started = perf_counter()
```

Python 版本只展示在事件循环里主动让出执行机会，不是浏览器 scheduler.yield 的实现，也不承诺浏览器输入和绘制行为。同步 CPU 工作仍在同一线程里，sleep(0) 不会把它变成并行计算。

浏览器的 setTimeout 降级可以安排另一个任务，但没有 scheduler.yield 相同的续执行优先级等调度语义。[调度 API 规范](https://wicg.github.io/scheduling-apis/#dom-scheduler-yield)描述了它的专门队列和优先级安排，不能把这两个入口说成完全等价。

### 为什么预算是 8ms，仍然可能卡 200ms？

因为检查发生在 work 返回以后。如果某一条记录本身就需要计算 200ms，这段代码没有能力从中间强行打断它。

这时要继续拆开单项操作，减少算法工作量，或者把合适的 CPU 计算放进 Worker。分片改善的是响应机会，不保证总耗时减少；切得过细，还会增加调度开销。

此外，长流程让出以后，用户可能已经切换页面或更换筛选条件。后续工作要检查取消标识和当前任务版本，避免旧批次继续把结果写回新界面。

![work返回后才检查时间，单项仍可能很长](https://note.lgdsunday.club/img/Q750/03-single-work-not-preempted.webp)

## 面试官继续追问

### yield 后一定会先绘制，再继续吗？

不会保证。它提供任务间的调度机会，浏览器是否需要绘制，还受帧时机、页面状态等影响。别把让出等同于“等待下一帧完成”。

### requestIdleCallback 可以不做兼容处理吗？

不应该。截至本次核验，官方兼容资料仍提示有限支持。检查目标浏览器，提供符合任务重要程度的降级，不能让关键流程在不支持的设备上永远不执行。

### 用什么证据说明分片有效？

在低性能设备或 CPU 降速条件下记录任务长度、输入响应和总完成时间。检查是否减少长任务，同时确认结果数量、顺序和取消行为。这里只验证分片逻辑，不把示例预算写成实测性能结论。

## 面试速记卡

> - requestIdleCallback：等空闲，适合可延迟工作，回调仍要限制工作量。
> - scheduler.yield：当前工作让出主线程，后续在新任务继续。
> - Promise 微任务：不等于给输入和绘制一次任务间机会。
> - 单项长计算：预算检查不能从中间抢占，必要时拆解或用 Worker。
> - 验证：响应、总耗时、结果与取消都要检查。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **字节跳动 · 前端 · 校招**：React scheduler 如何模拟 requestIdleCallback，安排任务执行时机？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353158686203912192)；面试记录为 2021 年秋招；原帖编辑于 2021-10-09。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
