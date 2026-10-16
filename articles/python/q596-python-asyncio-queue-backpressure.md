# Python 的 asyncio.Queue 怎么控制任务堆积？join 和 task_done 如何配合？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/python/q596-python-asyncio-queue-backpressure/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：asyncio.Queue 怎么避免任务越积越多？

🙋‍♂️ 我：设置 maxsize，队列满了 put 会等待。

🧑‍💻 面试官：那消费者 get 拿走一项，join 就知道它完成了吗？

🙋‍♂️ 我：不知道，要调用 task\_done。

🧑‍💻 面试官：如果处理失败还不确认，join 会怎样？容量有限又是否代表整个系统负载已经被限制住？

> 队列容量管“还有多少项在排队”，完成计数管“放进去的任务有没有结清”。取走一项并不代表它已经处理成功。

## 面试速答（60 秒版）

asyncio.Queue 可以在协程之间传递任务。maxsize 大于零时，队列满了，await put 会等待空位，这样生产者不会无条件继续往队列堆数据。

消费者 await get 取走一项以后，队列容量释放，但未完成计数还在。处理结束要对应调用 task\_done，join 才能等到所有入队项得到确认。

task\_done 只结清计数，不证明业务一定成功。失败、重试和死信需要单独设计；取消时也要避免取走的任务既没处理，又从记录里丢掉。

容量主要限制排队项，不限制所有外部等待生产者或正在执行的任务。需要控制工作并发时，还要限制消费者数量，并安排停止接收、处理剩余项和关闭消费者的顺序。

![容量和完成计数，分别记账](https://note.lgdsunday.club/img/Q596/01-overview.webp)

## 知识点详解：排队容量和任务完成，分别记账

### 有容量的队列，会把压力传回生产者

假设上传请求不断产生图片处理任务，消费者一次只能处理少数几项。无限队列会把排队数据留在内存中，工作变慢以后，积压可能持续增长。

Queue(maxsize=2) 表示队列里最多存两项；第三次 await put 需要等消费者取走一项。生产者因此暂停，形成背压。但如果你为每个上传都另外创建一个等待 put 的 Task，那些等待者仍然可能大量堆积。

所以 maxsize 不是整个服务的内存上限。入口并发、单项大小、正在处理项和等待生产者都要纳入负载判断。

![队列满了，生产者暂停](https://note.lgdsunday.club/img/Q596/02-backpressure-v3.webp)

### get 释放容量，task\_done 结清另一份计数

put 会增加未完成计数，get 不会减少这份计数。消费者处理完调用 task\_done，计数才减少。join 等的是计数归零，不是 qsize 等于零。

这解释了一个常见现象，队列已经空了，join 却还在等。因为有项被消费者拿走但没有确认，或者处理任务仍在进行。

反过来，多调用 task\_done 也会报错。它需要与实际 get 获得的每项对应，不能靠循环定时调用来“让 join 赶紧结束”。

![空队列，也可能还有未完成项](https://note.lgdsunday.club/img/Q596/03-accounting-v3.webp)

### 把正常处理与退出项放进同一份账

下面使用 Python 3.11 兼容的哨兵退出模式。每次成功 get 后用 finally 结清计数，包括退出用的 None。

#### Python

```python
import asyncio

async def worker(queue):
    while True:
        item = await queue.get()
        try:
            if item is None:
                return
            await asyncio.sleep(0)
            print("处理", item)
        finally:
            queue.task_done()

async def main():
    queue = asyncio.Queue(maxsize=2)
    workers = [asyncio.create_task(worker(queue)) for _ in range(2)]
    for item in range(4):
        await queue.put(item)
    for _ in workers:
        await queue.put(None)
    await queue.join()
    await asyncio.gather(*workers)

asyncio.run(main())
```

这个最小例子没有重试，也没有持久化保障。真实处理中发生异常时，finally 结清的是队列计数；还应该记录任务失败并决定是否补偿或重试，不能对用户说“join 返回就全成功”。

### 收尾和语言对照，要写明差异

Python 3.13 增加 Queue.shutdown，不能把它直接放进 3.11 示例。立即关停与正常等待完成的语义也不同，要按目标版本核对；本文用哨兵明确展示消费者退出。

#### TypeScript（显式排队与处理对照）

```typescript
async function drain(items: number[]): Promise<void> {
  while (items.length > 0) {
    const item = items.shift()!;
    await Promise.resolve();
    console.log("处理", item);
  }
}
void drain([0, 1, 2, 3]);
```

这个数组循环既没有 await put 的背压，也没有 join/task\_done 计数，是有限输入的单消费者对照。Node/TS 需要选择有对应合同的队列实现，不能把数组 shift 包装成 asyncio.Queue 的同款 API。

上线前检查生产者暂停是否生效、get 后取消如何记录，以及某个消费者异常退出后谁继续处理剩余任务。要持久化跨进程任务，则需要另一类消息队列系统，内存 Queue 不提供重启恢复。

依据：[Python 3.11 asyncio.Queue](https://docs.python.org/3.11/library/asyncio-queue.html)、[Python 3.13 Queue.shutdown](https://docs.python.org/3.13/library/asyncio-queue.html#asyncio.Queue.shutdown)。

![先停止生产，再安排消费者退出](https://note.lgdsunday.club/img/Q596/04-shutdown-v3.webp)

## 面试官继续追问

### qsize 为零，为什么 join 还等？

任务可能已经被取走但尚未 task\_done。容量和未完成计数是两份状态。

### finally 里 task\_done 是否代表失败也算成功？

它只确认这一项的队列计数结束。业务结果要另记，不能用计数替代成功状态。

### 开很多生产者等待 put，就控制住负载了吗？

未必。等待者、请求体和在途任务仍占资源，入口数量也需要上限或拒绝策略。

## 面试速记卡

> - maxsize 限制队列内待取项。
> - get 释放队列容量，不减少未完成计数。
> - task\_done 与成功 get 的项对应。
> - join 等完成计数，不保证业务全部成功。
> - 消费者数量、入口负载和退出顺序另行安排。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
