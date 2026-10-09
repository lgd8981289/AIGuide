# Java 线程有哪几种状态？BLOCKED、WAITING 和 TIMED_WAITING 有什么区别？

[美团后端面试真题](../companies/meituan-backend.md) · [阿里后端面试真题](../companies/alibaba-backend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q475-java-thread-states/) · [题库目录](../../README.md)

*以下对话为教学模拟，不是真实面经。*

🧑‍💻 面试官：Java 线程有哪几种状态？

🙋‍♂️ 我：新建、运行、阻塞、等待和结束。

🧑‍💻 面试官：等 synchronized 锁和调用 sleep，是同一种阻塞吗？RUNNABLE 表示正在 CPU 上运行吗？

> Java 线程状态描述 JVM 观察到的执行情况，不等同于操作系统的调度状态。

## 面试速答（60 秒版）

Java Thread.State 有六种状态：NEW、RUNNABLE、BLOCKED、WAITING、TIMED\_WAITING 和 TERMINATED。

BLOCKED 特别指等待进入或重新进入 synchronized 监视器。WAITING 表示没有指定时间的等待，例如相应的 wait、join 或 park；带时间的等待通常属于 TIMED\_WAITING，例如 sleep 和超时等待。

RUNNABLE 不保证线程此刻正在 CPU 上执行，也可能在等待操作系统资源。还要注意，等待 ReentrantLock 不必然表现为 BLOCKED，要看它使用的等待机制。

排查时我会结合线程堆栈、锁信息和多次采样，不能只看到一个状态名就判断线程死锁或 CPU 过高。

![速答总览：Java 线程状态不等于 OS 调度状态；三种等待应按监视器和时间条件区分。](https://note.lgdsunday.club/img/Q475/01-overview.webp)

## 知识点详解：六种状态，怎样和实际行为对应

### NEW 与 TERMINATED，是生命周期的两端

创建 Thread 对象，但尚未启动，对应 NEW。启动以后执行完成，或者因为未捕获异常退出，就进入 TERMINATED。

线程结束以后不能再次启动同一个对象。需要新的执行任务时，要使用合适的线程或执行器，而不是把结束线程重新当成 NEW。

[Java 官方 Thread.State 文档](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/Thread.State.html)给出了六种状态定义。这里使用 JVM 状态名，不自行添加一个独立的“RUNNING”枚举。

### RUNNABLE 比“正在运行”范围更广

一个线程进入 RUNNABLE，表示它在 JVM 的这个分类下可以执行相关工作，但不能由此证明它正在占用 CPU。

它可能正在等待操作系统分配处理器，也可能涉及某些操作系统资源等待。Java 状态与操作系统状态并不是一一对应关系。

因此，看到大量 RUNNABLE 线程，下一步应结合 CPU、堆栈和请求情况判断。不能只根据状态数量，就认为这些线程都在忙计算。

### BLOCKED 重点看 synchronized 监视器

咱们假设线程 A 持有一个对象的 synchronized 锁，线程 B 想进入同一监视器保护的区域。B 等待进入时，可能表现为 BLOCKED。

如果线程调用 wait，暂时释放监视器并等待通知，它会进入相应等待状态。被唤醒以后，还必须重新取得监视器；重新竞争锁时，又可能进入 BLOCKED。

这说明“收到通知”不等于“已经能够继续执行”。通知与锁的重新获取是不同步骤，也是线程堆栈分析中容易忽略的转折。

![wait、通知与重新竞争监视器的先后关系](https://note.lgdsunday.club/img/Q475/02-wait-reacquire-monitor.webp)

### WAITING 与 TIMED\_WAITING，要看有没有时间条件

没有指定超时的相应等待，例如 Object.wait、Thread.join、LockSupport.park，通常属于 WAITING。指定等待时间的版本，以及 Thread.sleep，则通常属于 TIMED\_WAITING。

这里并不是说所有带“等待”字样的 API 都按名称判断。实际状态要看实现与调用条件。ReentrantLock 采用的等待机制，可能让线程呈现 WAITING，而不是 synchronized 的 BLOCKED。

[Thread 官方 API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/Thread.html)还说明 sleep 不会因为休眠自动释放持有的监视器。把 sleep 和 wait 混为一谈，就会错误判断其他线程什么时候能够拿到锁。

### 用连续证据判断，不拿单次截图下结论

一份线程转储只能告诉我们那个时刻的情况。正常线程池中的空闲线程也可能处于等待；这不是故障。

如果线程长时间停在同一位置，再结合锁持有者、请求超时和资源指标，才更容易判断问题。死锁还需要检查相互等待关系，不能看到 BLOCKED 就直接下结论。

面试回答可以先列六种状态，再用“等监视器、无期限等条件、带时间等条件”解释三种等待状态。这样比只背中文名称更清楚。

## 面试官继续追问

### sleep 会释放锁吗？

不会自动释放当前线程持有的监视器。休眠影响线程执行，不等于退出同步区域。

### WAITING 一定说明程序有问题吗？

不是。线程池等待新任务就是正常情况。要看等待对象、任务目标和是否超过合理时间。

### 怎么确定死锁？

检查线程与锁之间是否形成相互等待关系，结合工具的死锁检测和多次采样。状态名本身不够。

## 面试速记卡

> - 六种状态：NEW、RUNNABLE、BLOCKED、WAITING、TIMED\_WAITING、TERMINATED。
> - RUNNABLE：不等于此刻一定在 CPU 上执行。
> - BLOCKED：重点指 synchronized 监视器竞争。
> - 两种等待：是否指定时间，是重要区别。
> - 排查原则：状态、堆栈、锁关系与连续采样一起看。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **美团 · Java后端 · 实习**：Java 线程有哪些状态，各状态如何进入？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353156355747946496)；面试记录为 2020-04-21、2020-04-24；原帖编辑于 2020-11-14。
- **阿里巴巴 · Java后端 · 社招**：线程有哪些状态，等待和终止状态怎样产生？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353157517968613376)；历史面经，面试年份未明确；页面编辑于 2024-07-19。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
