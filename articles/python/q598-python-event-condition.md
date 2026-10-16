# Python 的 Event 和 Condition 有什么区别？线程怎样等待状态变化？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/python/q598-python-event-condition/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：Event 和 Condition 有什么区别？

🙋‍♂️ 我：Event 用一个标志通知，Condition 可以等某个条件。

🧑‍💻 面试官：Condition.wait 时不释放锁，生产者怎么进来改条件？

🙋‍♂️ 我：它会暂时释放，唤醒后再拿回锁。

🧑‍💻 面试官：notify 以后条件一定成立吗？如果两个消费者都醒了，能不能直接各取一项？

> 收到通知只说明可以再检查状态。状态是否允许继续，仍由受锁保护的条件决定。

## 面试速答（60 秒版）

Event 管理一个可以 set 和 clear 的标志。wait 在标志为真时返回，适合表达启动完成、允许继续或停止请求等信号；它不是每次 set 都累计一次的消息队列。

Condition 把条件等待和锁组合起来。调用 wait 前需要持有锁；等待时释放锁，让其他线程修改状态，醒来后重新获得锁再检查条件。

notify 不保证谓词已经成立，也不立即把锁交给等待者。等待方应使用 while 检查，或用 wait\_for(predicate)，避免醒来后状态又被别人改变。

选择时，只有一个持续标志可以用 Event；需要根据共享状态决定是否继续，并在读取或修改时保持互斥，就考虑 Condition。这里讨论 threading，asyncio 有对应任务原语，不能直接互换。

![一个标志，还是一个受锁保护的条件？](https://note.lgdsunday.club/img/Q598/01-overview.webp)

## 知识点详解：通知、状态和锁，分别承担什么责任

### Event 记住的是标志，不是次数

假设初始化线程加载完配置，其他线程等待开始工作。Event.set 把标志设为真，已等待的线程能继续，后来的 wait 也会立即通过，直到 clear 把标志复原。

连续 set 三次不意味着下一线程可以消费三条通知。set 和 clear 的快速切换也不能替代可靠事件记录。需要每条工作都被处理，应使用队列或明确计数。

停止信号是常见用途，线程在合适的循环位置检查标志，然后合作退出。它不等于从外部硬杀线程。

### Condition 等的是共享状态的谓词

假设消费者要等 pending 列表非空。列表内容需要锁保护，条件就是 bool(pending)。消费者持锁检查，空时 wait；生产者之后拿同一锁追加，再 notify。

wait 暂时释放锁，让生产者能进入。等待方被通知后还要重新获得锁，因此不能在唤醒瞬间直接假设自己已经有访问权。

notify 本身不释放锁。生产者继续持锁做后续操作时，等待者仍可能等到生产者退出临界区才能恢复。

![等待时释放，醒来再获得锁](https://note.lgdsunday.club/img/Q598/02-lock.webp)

### 用 wait\_for 把检查写完整

下面只演示单次交付，生产线程向 pending 放入一项，消费者按谓词等待。

#### Python

```python
from threading import Condition, Thread

condition = Condition()
pending = []

def consume():
    with condition:
        condition.wait_for(lambda: bool(pending))
        item = pending.pop(0)
    print("拿到", item)

thread = Thread(target=consume)
thread.start()
with condition:
    pending.append("任务A")
    condition.notify()
thread.join()
```

在多消费者场景，某线程被唤醒到真正拿到锁之间，另一个消费者可能已经取走任务。while 或 wait\_for 会再次检查，条件不满足就继续等，避免直接 pop 空列表。

超时也要检查返回值。等待结束不总因为目标状态已经就绪，可能只是等到了期限。

![两个人被叫醒，只有一份任务](https://note.lgdsunday.club/img/Q598/03-predicate.webp)

### 不要把语言对照变成假 API

#### TypeScript（一次性就绪信号对照）

```typescript
let signalReady!: () => void;
const ready = new Promise<void>(resolve => { signalReady = resolve; });
const worker = ready.then(() => console.log("初始化已完成"));
signalReady();
void worker;
```

Promise 这里只表示一次性就绪，没有 Event 的 clear 重置，也没有 Condition 的锁释放和谓词重查。JS 多线程同步需要对应运行时设施，本例不声称同一个 API 可以机械替换。

测试 Condition 时可以让两个消费者同时等待，只添加一项并发出通知，观察只有满足条件的线程能继续。测试 Event 则检查 set 后新等待者是否直接通过，以及 clear 后是否重新等待。选原语时对照这些行为，比记“一个简单一个复杂”更有用。

依据：[Python 3.11 threading.Event](https://docs.python.org/3.11/library/threading.html#event-objects)、[threading.Condition](https://docs.python.org/3.11/library/threading.html#condition-objects)、[asyncio 对应同步原语](https://docs.python.org/3.11/library/asyncio-sync.html)。

![重复 set，不会积累通知次数](https://note.lgdsunday.club/img/Q598/04-flag-v2.webp)

## 面试官继续追问

### notify\_all 是否让所有消费者都能消费？

它让等待者有机会恢复。每个线程重新拿锁并检查状态，只有实际条件满足才能继续。

### Event.set 可以累计任务数量吗？

不能。它是标志，重复设真不会积累多个待消费事件。

### wait\_for 超时以后可以直接使用资源吗？

不能。要看返回的谓词结果，超时可能意味着条件仍不满足。

## 面试速记卡

> - Event 保存可置位与清除的标志。
> - Condition 围绕锁保护的状态等待。
> - wait 释放锁，恢复前重新获取锁。
> - notify 不释放锁，也不保证条件成立。
> - 等待者用 while 或 wait\_for 重查谓词。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
