# Node.js Stream 是什么？背压如何防止内存越积越多？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q153-node-stream-backpressure/) · [题库目录](../../README.md)

<!-- 以下对话为教学模拟，非真实面经。 -->

🧑‍💻 面试官：Node Stream 的背压是什么？

🙋‍♂️ 我：数据太多时加缓存，慢慢写出去。

🧑‍💻 面试官：上游每秒生成的数据比下游快，缓存会一直增长吗？

🙋‍♂️ 我：那就增大 highWaterMark。

🧑‍💻 面试官：这个值是硬内存上限吗？write 返回 false，是这块数据没写进去吗？

> 背压不是把仓库越建越大，而是让下游告诉上游：这一块已经接收，下一块先别急着送。

## 面试速答（60 秒版）

背压是下游消费跟不上时，把压力反馈给上游，控制继续生产或读取的节奏，避免缓冲无限增长。

Node Writable 的 write 返回 false，通常表示当前缓冲已达到阈值，应等 drain 再继续写后面的数据；当前这一块并不是因此被拒绝，不要重复写它。

highWaterMark 是触发背压的阈值，不是所有内存的硬上限。能用 pipeline 或管道连接时，可以让流机制协调传输与错误，但仍要处理取消和资源生命周期。

验证时要让下游真的变慢，观察缓冲、内存和完成结果。背压能协调速度，不会把慢消费者自动变快。

![慢下游通过背压暂停上游后续写入，当前数据块已被接收](https://note.lgdsunday.club/img/Q153/00-60s-overview.webp)

## 知识点详解：慢消费者怎样让生产者停一停

### 如果只管生产，数据就会越积越多

假设服务导出一份大报表，数据库读取很快，用户下载很慢。如果读取端不停拿数据，网络写不出去的部分就会堆在内存里。

流式处理的意义不只是把数据切块。切成小块但无限制持续写入，仍然可以积出一个大队列。

背压让下游的消费能力影响上游：暂缓读取或生产，已有缓冲消耗到可以继续时再恢复。若上游根本无法暂停，还需要额外的丢弃、持久化或限速策略。

### write 返回 false，不是让你重发同一块

下面的 Node + TypeScript 示例故意设置很小的阈值，让一块数据触发暂停。

### TypeScript / Node.js

```typescript
import { Writable } from 'node:stream';
import { once } from 'node:events';
import { finished } from 'node:stream/promises';

const out = new Writable({
  highWaterMark: 1,
  write(chunk, encoding, callback) {
    setTimeout(() => {
      console.log(chunk.toString());
      callback();
    }, 10);
  }
});
const canContinue = out.write('ab');
console.log(canContinue); // false，但 ab 已被接收
if (!canContinue) await once(out, 'drain');
out.end();
await finished(out);
```

等待之后应该写下一块，而不是把 ab 再写一次。这段示例只演示阈值和完成顺序；生产中的手工循环还要把 error、提前关闭和取消接进同一生命周期，避免一直等不到 drain。

### Python 也有流控，但不是复制 Node API

Python asyncio 的 StreamWriter 用 write 加 await drain 配合流控，不通过 write 的布尔返回值表达 Node 的同一约定。

### Python / asyncio

```python
import asyncio
from collections.abc import Iterable

async def send_chunks(
    writer: asyncio.StreamWriter, chunks: Iterable[bytes]
) -> None:
    for chunk in chunks:
        writer.write(chunk)
        await writer.drain()
```

调用方负责建立连接、异常处理和关闭资源。drain 是按缓冲状态等待，不承诺每次 await 都把执行权交给其他任务，也不代表对端已经完成业务处理。

这两种实现共享“按下游能力调节生产”的原则，但传输对象、阈值和关闭语义需要各按官方 API 理解。

### 阈值调大，只是改变缓冲策略

highWaterMark 在普通字节流和对象模式里的计量不同，不能拿一个数解释全部流。它不是进程总内存预算，单块数据、其他缓冲和业务对象也会占空间。

完整管道可以优先考虑 pipeline，减少自己协调多段结束与错误的工作。但检查接口的销毁行为、请求连接和取消规则仍然必要。

验收时让消费者变慢、断开或报错，确认生产能停、资源能收、结果没有重发丢失。只在本地快速磁盘上跑通，不能证明慢下载时内存有边界。

本题机制参考：[Node.js：Stream](https://nodejs.org/api/stream.html)、[Python：asyncio Streams](https://docs.python.org/3/library/asyncio-stream.html)。

## 面试官继续追问

### write false 后重试这一块对吗？

不对。背压返回通常表示这一块已经进入处理或缓冲，应该暂停后续写入。

### highWaterMark 能保证内存不超过这个数吗？

不能。它是流缓冲阈值，单块和其他内存仍可能使总使用量超过。

### 背压能提高慢下游速度吗？

主要协调上游节奏，避免失控积压。下游处理能力不足仍需独立优化。

## 面试速记卡

> - 背压：下游速度反馈到上游节奏。
> - write false：暂停后续块，不重发当前块。
> - drain：适合恢复写入的信号，不是业务确认。
> - highWaterMark：阈值，不是总内存硬上限。
> - 验收：慢消费、报错、断开和取消都要测。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
