# BlockingQueue 是什么？ArrayBlockingQueue 和 LinkedBlockingQueue 怎么选？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q476-java-blocking-queues/) · [题库目录](../../README.md)

*以下对话为教学模拟，不是真实面经。*

🧑‍💻 面试官：BlockingQueue 是什么？

🙋‍♂️ 我：队列空了取不到，就阻塞；队列满了放不进，也会阻塞。

🧑‍💻 面试官：offer 也一定阻塞吗？LinkedBlockingQueue 没写容量，会不会自然限制内存？

> BlockingQueue 提供多种等待策略。是否阻塞、等待多久，以及队列能存多少，都要明确选择。

## 面试速答（60 秒版）

BlockingQueue 是线程安全的阻塞队列接口，常用于生产者和消费者之间传递任务。

它并不是所有方法都阻塞。add、remove 等方法可能抛异常，offer、poll 可以立即返回特殊值，put、take 会等待条件，带超时的方法则只等待指定时间。

ArrayBlockingQueue 基于固定容量数组，结构简单；LinkedBlockingQueue 基于链表，可以指定容量，但默认容量上限非常大，不能当成实际内存安全保证。

选型时我会先确定容量和过载策略，再考虑竞争、分配与吞吐。队列满了怎样处理，往往比数组还是链表更影响系统稳定性。

![速答总览：阻塞队列的稳定性先取决于容量与过载策略，再考虑具体结构和竞争成本。](https://note.lgdsunday.club/img/Q476/01-overview-v2.webp)

## 知识点详解：队列把速度差暂存下来，也会积累压力

### 生产快、消费慢时，任务先进入队列

咱们假设上传服务把文件处理任务交给后台线程。生产者负责提交，消费者负责处理。

队列空时，消费者可能需要等待新任务；队列满时，生产者可能等待、放弃或返回失败。BlockingQueue 帮助协调这些条件，也提供跨线程的可见性保证。[官方接口文档](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/BlockingQueue.html)说明了方法分类与内存一致性。

但队列不会把慢消费者变快。长期输入速度超过处理速度，只会让积压增加。容量是允许暂存多少压力，不是无限扩容的理由。

### 同一接口，有四类处理方式

| 情况 | 抛异常    | 特殊返回值 | 一直等待 | 最多等一段时间   |
| -- | ------ | ----- | ---- | --------- |
| 插入 | add    | offer | put  | offer 超时版 |
| 移除 | remove | poll  | take | poll 超时版  |

这些方法表达不同的业务选择。例如在线请求无法无限等待，可以使用受控等待或快速拒绝；后台消费者可以用 take 等待任务。

不能只背“阻塞队列会阻塞”。调用方用的是哪个方法，决定了实际等待方式。被中断时怎样处理，也应明确，不能捕获以后默默丢掉中断信号。

### ArrayBlockingQueue 和 LinkedBlockingQueue 的成本不同

[ArrayBlockingQueue](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/ArrayBlockingQueue.html)使用固定容量数组，创建后容量不再改变。实现上围绕共享锁协调操作，也提供公平性选项；公平通常需要权衡吞吐，不能默认更公平就更快。

[LinkedBlockingQueue](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/LinkedBlockingQueue.html)使用链式节点，插入与移除可以采用不同的锁协作。但节点分配、内存占用与垃圾回收也有成本，不能只据此断定性能永远更好。

默认 LinkedBlockingQueue 的容量是一个非常大的整数上限。实际进程可能远在达到它之前，就耗尽内存。所以生产系统需要根据任务大小和允许延迟明确容量。

### 选型先算等待预算，再做压力测试

假设平均每秒处理 100 个任务，队列已经积压 1000 个。如果处理速度稳定且没有新干扰，光是这些积压就需要大约 10 秒。实际等待还可能更长。

这个算例只帮助理解数量级，不能替代服务时间分布与真实压测。任务大小不同、处理存在波动，都会影响结果。

可以分别测低负载、短时突发和持续过载：检查积压、等待、超时、拒绝和内存。合理的结果不一定是“全部接收”，也可能是尽早告诉调用方系统繁忙，避免所有任务最后一起超时。

队列关闭也需要应用协议。BlockingQueue 本身没有统一的 close 操作；停止消费者可以使用中断或约定的结束标记，具体要处理剩余任务和并发边界。

![队列积压与等待预算的数量级](https://note.lgdsunday.club/img/Q476/02-backlog-delay.webp)

## 面试官继续追问

### 使用无界队列，线程池还会继续增加线程吗？

取决于线程池执行规则。常见 ThreadPoolExecutor 会先入队；无界队列可能让最大线程数很少发挥作用。应结合线程池专题理解，不能只看配置数字。

### 公平队列一定更适合业务吗？

不一定。公平减少某些等待差异，也可能影响吞吐。是否需要，应依据任务需求和测量，而不是作为默认性能优化。

### 队列能不能保证任务不丢？

内存队列无法独立保证进程故障后的持久性。重要任务需要持久存储、确认与恢复机制，不能把线程安全理解成可靠消息投递。

## 面试速记卡

> - 接口方法：抛异常、特殊值、阻塞、超时四类。
> - ArrayBlockingQueue：固定容量数组，容量不能动态改变。
> - LinkedBlockingQueue：链式结构，默认大上限不是安全容量。
> - 过载策略：容量、等待与拒绝必须一起设计。
> - 可靠边界：线程安全不等于进程故障后任务不丢。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
