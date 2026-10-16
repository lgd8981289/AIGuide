# Python 的 asyncio.Lock 和 threading.Lock 有什么区别？协程里用错锁会怎样？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/python/q597-python-asyncio-threading-lock/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：asyncio.Lock 和 threading.Lock 有什么区别？

🙋‍♂️ 我：前者给协程用，后者给线程用。

🧑‍💻 面试官：协程 A 拿到 threading.Lock 后 await，B 同线程再 acquire，会发生什么？

🙋‍♂️ 我：B 可能阻塞事件循环，让 A 也没机会释放锁。

🧑‍💻 面试官：换成 RLock，既然同线程可以重入，是不是就保护住两个协程了？

> 锁要保护的是谁，就应该让谁等待。同一条线程里的不同协程，不会因为线程锁可重入就自动互斥。

## 面试速答（60 秒版）

threading.Lock 等待时可能阻塞当前操作系统线程，适合线程间共享状态的同步。asyncio.Lock 等待时让当前任务暂停，事件循环仍能调度其他任务，适合同一事件循环里的协程。

如果协程持有普通线程锁后 await，另一个协程在同一线程同步等待这把锁，就可能堵住整个事件循环。持锁任务也无法继续执行并释放，形成死锁。

RLock 按线程识别重入，同一线程里的两个协程可能都通过，因此不能把它当作协程互斥锁。

asyncio.Lock 也不是线程安全工具。混合线程和协程时，要明确共享状态的所有者，并通过适合的线程同步或消息交接方式组织访问。锁能保护临界区，不会让整个外部请求自动变成事务。

![任务等锁，线程仍要能继续](https://note.lgdsunday.club/img/Q597/01-overview-v2-v3.webp)

## 知识点详解：协程暂停和线程阻塞，等待方式不同

### 为什么单线程里仍然可能有竞争？

假设两个任务都要把共享计数加一。如果先读旧值，await 一个操作，再写入新值，另一个任务可以在中间读到同一旧值。即使它们运行在同一事件循环线程，也会因为让出执行而交错。

不是所有几行同步语句都一定会发生这种交错，关键是实际的调度和 await 边界。不要因为有一个 GIL，就推断跨等待点的业务操作已经原子化。

如果这份状态只由当前事件循环中的任务访问，可以用 asyncio.Lock 让临界区一次只进入一个任务。

### 等待 asyncio.Lock，不占住整个线程

下面故意在读取后让出一次，锁仍让后续任务等到本次更新完成。

#### Python

```python
import asyncio

async def main():
    lock = asyncio.Lock()
    count = 0

    async def increment():
        nonlocal count
        async with lock:
            before = count
            await asyncio.sleep(0)
            count = before + 1

    await asyncio.gather(*(increment() for _ in range(3)))
    print(count)  # 3

asyncio.run(main())
```

async with 帮助正常退出或异常时释放锁。等待进入的任务暂停，其他可运行任务仍能执行。因此拥有锁的任务有机会继续并释放，不会因为另一个任务等锁就把整条线程堵住。

### 线程锁为什么可能锁死事件循环？

A 拿到 threading.Lock 后 await，事件循环切换到 B。B 调用同步 acquire，当前线程阻塞。A 的后续代码也需要这条线程才能运行，所以它无法释放锁，B 又一直等锁。

换成 threading.RLock 也不是修复。它根据线程身份允许重入，A 和 B 恰好同线程，B 可能直接进去，结果临界区不再互斥。

这里可以画出调度等待关系来判断，不需要把危险死锁程序真的放进文章让读者运行。线程函数之间使用线程锁合理，错误在于把它直接拿来保护会跨 await 交错的协程。

![B 堵住线程，A 就无法释放锁](https://note.lgdsunday.club/img/Q597/02-deadlock.webp)

### 混合环境，先规定状态的访问入口

#### TypeScript（显式串行 Promise 链对照）

```typescript
let count = 0;
let tail: Promise<void> = Promise.resolve();
function increment(): Promise<void> {
  const job = tail.then(async () => {
    const before = count;
    await Promise.resolve();
    count = before + 1;
  });
  tail = job.catch(() => {});
  return job;
}
Promise.all([increment(), increment(), increment()])
  .then(() => console.log(count)); // 3
```

这份最小链用来对照异步任务串行进入，不是 Python 锁 API，也不涵盖取消、公平性和跨线程共享。正式项目可以采用合适的库或单一所有者队列，但合同仍要写清楚。

Python 在线程里操作 asyncio 对象时也要核对线程安全入口。不能让一个线程直接拿 asyncio.Lock 当线程锁。测试可以主动在读写之间插入可控等待，验证互斥，也检查异常退出后下一任务还能进入。

依据：[Python 3.11 asyncio 同步原语](https://docs.python.org/3.11/library/asyncio-sync.html)、[threading Lock 与 RLock](https://docs.python.org/3.11/library/threading.html)、[asyncio 跨线程开发说明](https://docs.python.org/3.11/library/asyncio-dev.html#concurrency-and-multithreading)。

![同一线程，不等于同一个任务](https://note.lgdsunday.club/img/Q597/03-reentrant.webp)

## 面试官继续追问

### asyncio.Lock 能给多个线程同步吗？

不能。它不是线程安全原语，线程间访问应使用相应机制或把操作交回事件循环。

### 持 asyncio.Lock 时能 await 吗？

可以，但临界区可能因此变长。要确认等待是否必要，避免循环依赖，也不要把无关慢操作一起锁住。

### 没有 await 就一定永远不会交错吗？

要按执行环境判断。单事件循环普通同步段通常连续执行，但其他线程、回调和不同解释器约束仍需要单独分析。

## 面试速记卡

> - asyncio.Lock 让任务等待，线程仍可调度。
> - threading.Lock 的同步等待可能阻塞线程。
> - 持线程锁跨 await，再同步等锁可能死锁。
> - RLock 按线程重入，不能代替任务互斥。
> - 共享状态先明确归属，再选择同步入口。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
