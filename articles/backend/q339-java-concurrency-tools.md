# CountDownLatch、CyclicBarrier 和 Semaphore 有什么区别？并发任务怎么协调？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q339-java-concurrency-tools/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：CountDownLatch、CyclicBarrier 和 Semaphore，有什么区别？

🙋‍♂️ 我：都可以协调多个线程。

🧑‍💻 面试官：三个数据任务完成以后再汇总，你用哪个？

🙋‍♂️ 我：CountDownLatch，等计数归零。

🧑‍💻 面试官：如果每一轮都要三个任务到齐才能进入下一轮呢？如果只是外部接口最多允许五个同时执行呢？

> 先问「到底在等什么」：等一批任务完成、等大家这一轮到齐、还是等一个进入名额，答案并不相同。

## 面试速答（60 秒版）

CountDownLatch 适合等待一批事件完成。比如三个任务分别结束后减一，汇总线程等到计数归零再继续。它通常是一次性的，不能直接把计数重新加回去。

CyclicBarrier 适合多个参与者分轮会合。大家都到达屏障后，再进入下一轮，所以适合阶段性并行计算。但某个参与者失败或超时，需要考虑整轮怎么退出。

Semaphore 则管理许可数量。任务先拿到许可才能进入，结束以后归还，因此常用于限制同时执行的任务数。

实际选择时，我会先分清协作目标，再处理异常、超时和资源归还。计数归零不等于业务全部成功，限制并发也不等于限制每秒请求数。

![三个工具，等的是三件不同的事](https://note.lgdsunday.club/img/Q339/01-overview-v2.webp)

*图：三个工具，等的是三件不同的事。*

## 知识点详解：等待完成、分轮会合和限制并发

### 三个任务完成后，再生成汇总结果

假设系统要同时读取三份数据，再生成一份汇总。这里的要求是“全部结束后继续”，而不是“每个任务都等其他任务”。

CountDownLatch 可以把计数设为三。每个任务退出时调用 countDown，汇总线程调用 await 等待。只要计数还大于零，汇总就不能继续。

但任务成功和任务结束要分别记录。假设第二个任务失败，它仍然需要通知“已经结束”，否则汇总线程可能一直等待。汇总线程被唤醒后，还应查看三份结果或异常，再决定继续、降级还是失败。

所以，减计数通常放进 finally，等待设置超时，业务结果另行保存。CountDownLatch 归零后再次等待会立即通过，这不代表它被重置了。

![任务结束，不等于任务成功](https://note.lgdsunday.club/img/Q339/02-latch.webp)

*图：任务结束，不等于任务成功。*

### 每一轮都要大家到齐，再进入下一轮

如果任务变成分轮计算，三个参与者都要先完成本轮计算，再读取对方本轮结果，那么每轮都需要一个会合点。

CyclicBarrier 的参与者会调用 await。达到预定人数后，这一轮的屏障打开，大家可以继续下一轮。可以安排一个屏障动作，在大家继续之前完成阶段汇总。

这里的风险也更明显：某个线程没有到达，其他线程就等不到整轮完成。超时或中断会破坏这一轮屏障，其他等待者也可能收到 BrokenBarrierException。

不能只给其中一个线程加异常捕获，然后假装另外两个还能继续同一轮。需要统一决定取消任务、重建协调状态或者结束计算。

以上规则可分别核对 [CountDownLatch](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/CountDownLatch.html) 与 [CyclicBarrier](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/CyclicBarrier.html)。

![一人没到，整轮要有退出方案](https://note.lgdsunday.club/img/Q339/03-barrier-v2.webp)

*图：一人没到，整轮要有退出方案。*

### 外部接口最多允许五个请求同时执行

此时，任务之间未必需要会合。我们只是不能让太多人同时进入外部系统。

Semaphore 可以初始化五个许可。任务拿到许可后执行请求，退出时归还许可。其他任务暂时拿不到，就等待或者按超时策略拒绝。

注意，只有成功取得许可的任务才应该归还。请求异常时，也必须通过 finally 归还，防止可用许可越来越少。

许可不一定和持有它的线程绑定，这与某些锁的所有权规则不同。具体语义见 [Semaphore API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/Semaphore.html)。

![拿到许可才进入，退出后归还](https://note.lgdsunday.club/img/Q339/04-permits-v2.webp)

*图：拿到许可才进入，退出后归还。*

### 怎么选择，比背方法名更重要

| 当前要求       | 首先考虑           | 仍需补充          |
| ---------- | -------------- | ------------- |
| 等三个任务结束    | CountDownLatch | 结果、异常、等待超时    |
| 三个参与者每轮会合  | CyclicBarrier  | 某个参与者退出后的整轮处理 |
| 最多五个任务同时进入 | Semaphore      | 获取超时、正确归还许可   |

本题针对 Java JUC 的三种工具，不提供伪造的 TypeScript/Python 同名实现。其他运行时也有协作原语，但取消、屏障破坏和线程调度语义不应直接等同。

## 面试官继续追问

### Semaphore 有五个许可，就能做到每秒五次吗？

不能。它限制的是同时进入的数量。一个请求如果很快完成，许可可以在一秒内被复用很多次。每秒频率限制需要单独的时间维度控制。

### CountDownLatch 能动态增加任务数吗？

不能直接增加已有计数。如果参与者动态变化，需要重新选择协调方式，例如评估 Phaser 或以任务结果组合表达等待。

### 等待超时后，其他任务会自动停止吗？

不会。等待方超时只是停止等待，正在运行的任务仍需要明确取消和清理。超时处理不能只写在 await 那一行。

## 面试速记卡

> - CountDownLatch：一批事件完成后继续，通常一次性使用。
> - CyclicBarrier：固定参与者分轮会合。
> - Semaphore：限制同时进入的任务数。
> - 计数归零：代表通知到齐，不自动证明业务成功。
> - 异常处理：超时、取消和资源归还一起设计。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
