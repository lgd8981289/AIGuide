# Python 的 ThreadPoolExecutor 和 ProcessPoolExecutor 怎么选？Future 如何取结果？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/python/q593-python-thread-process-executor-future/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：线程池和进程池怎么选？

🙋‍♂️ 我：阻塞 I/O 通常考虑线程池，CPU 密集计算可以考虑进程池。

🧑‍💻 面试官：交出去十个任务，为什么遍历 map 的结果时会卡在第一个慢任务？

🙋‍♂️ 我：因为 map 的返回顺序对应输入顺序。

🧑‍💻 面试官：那 as\_completed、Future.result 超时和 cancel，又分别改变了什么？

> 提交、开始执行、完成、取结果是四个时刻。取结果慢，不一定代表后面的任务没完成；取结果超时，也不等于任务已经停止。

## 面试速答（60 秒版）

ThreadPoolExecutor 和 ProcessPoolExecutor 提供相近的提交接口，主要区别在任务由线程还是独立进程执行。选择时除了工作性质，还要看序列化成本、共享状态和资源生命周期，GIL 的前提也要按解释器版本判断。

submit 返回 Future，可以用 result 获取结果或重新抛出任务异常。result(timeout) 只限制这次等待，不会因此强制停止正在执行的任务。

map 按输入顺序交结果；as\_completed 按完成情况交 Future，适合先处理已经完成的任务。

cancel 通常只能取消尚未开始的任务，正在执行的不能靠它硬停。退出 with 执行器时还会等待任务结束。所以工程上要给任务本身配置超时或合作式停止，而不是以为等待方报超时就收尾了。

![提交到取结果，四个时刻](https://note.lgdsunday.club/img/Q593/01-overview.webp)

## 知识点详解：Future 是任务结果的句柄，不是强制停止按钮

### 线程和进程之外，还要看任务怎么交付

假设批量查询十个文件的元数据。阻塞 I/O 可以在线程池中并发等待，不必为每个查询启动独立进程。如果是大量纯 Python 计算，在普通有 GIL 的 CPython 中，进程池可能更适合利用多核。

但也不能只看“CPU”两个字。一些扩展计算会释放 GIL，较新解释器还有不同构建选项；进程池又要传输参数与结果，小任务的通信开销可能超过收益。已有 GIL 题负责讲解释器边界，本题主要看提交和收尾合同。

进程池通常要求目标、参数与返回值可序列化，入口能被子进程正确导入。线程池不需要同样的跨进程传输，但共享对象也让线程安全问题更直接。

### submit 返回的 Future 怎样使用？

下面用本地计算模拟两个独立任务。实际查询服务时，还应设置查询动作自己的超时。

#### Python

```python
from concurrent.futures import ThreadPoolExecutor, as_completed

def calculate(value):
    if value < 0:
        raise ValueError("不接受负数")
    return value * value

with ThreadPoolExecutor(max_workers=2) as pool:
    futures = {pool.submit(calculate, n): n for n in [2, -1]}
    for future in as_completed(futures):
        try:
            print(futures[future], future.result())
        except ValueError as exc:
            print("任务失败", str(exc))
```

Future 保留结果或异常，调用 result 才把结果交给当前代码；任务失败不会自动变成一个普通 None。as\_completed 交回的是 Future，不是已经拆好的业务结果，所以仍要逐个读取并处理异常。

两个任务谁先完成由调度决定，示例不承诺固定打印顺序。需要关联原输入时，保留 Future 到输入的映射即可。

### map 的顺序和完成顺序不同

Executor.map 让调用方按输入顺序取值。假设第一个任务需要很久，后两个已经完成，遍历仍可能先等第一个结果。这不会反过来说明后两个没有并发执行。

as\_completed 则可以先处理完成的任务，但输出顺序不等于原顺序。如果最终报告必须保持原输入顺序，就记录索引，最后按索引组织结果。

#### TypeScript（Promise 完成回调对照）

```typescript
const jobs = [2, 3].map(async n => n * n);
jobs.forEach((job, index) => {
  job.then(value => console.log(index, value));
});
Promise.all(jobs).then(values => console.log(values)); // 输入顺序
```

Promise 不自动创建线程池，这段只是对照结果组织方式。真正的阻塞工作仍需适合的运行器和并发设施，不能用 async 关键字把 CPU 运算搬到另一线程。

![完成顺序和交付顺序可以不同](https://note.lgdsunday.club/img/Q593/02-order.webp)

### 等待超时和取消，并不会硬杀任务

Future.result(timeout=...) 抛超时，说明等待期限到了。任务可能还在执行；cancel 返回 False，也可能因为任务已经运行或完成。

执行器 with 退出会等待任务收尾。即使你在 with 内捕获了 result 超时，离开 with 时仍可能继续等待。shutdown(cancel\_futures=True) 能处理尚未启动的任务，但不把已运行任务强行变成停止状态。

验证时不要只测正常返回。准备一个异常任务和一个用事件控制的长任务，分别观察等待超时、取消返回值以及关停等待。需要真正中断的外部调用，要使用其自己的超时与取消机制，或设计合作式终止。

依据：[Python 3.11 concurrent.futures](https://docs.python.org/3.11/library/concurrent.futures.html)、[Python 多进程要求](https://docs.python.org/3.11/library/multiprocessing.html)、[ECMAScript Promise.all](https://tc39.es/ecma262/#sec-promise.all)。

![取消只来得及拦住没开始的任务](https://note.lgdsunday.club/img/Q593/03-cancel.webp)

![唯一 worker 等新任务，新任务却没 worker](https://note.lgdsunday.club/img/Q593/04-deadlock.webp)

## 面试官继续追问

### Future.result 报超时，线程就结束了吗？

没有。只是这次等待超时，执行线程里的函数可能继续运行。

### 一个 worker 里又提交任务，再等结果安全吗？

如果工作线程都被等待者占住，新任务没有 worker 可用，就可能死锁。尤其单线程池内提交后同步等待。

### map 输入很大怎么办？

按目标版本核对提交和缓冲行为。3.11 会较早收集输入；较新版本增加的 buffersize 不能直接拿来假设老版本也支持。

## 面试速记卡

> - submit 返回 Future，result 交结果或抛任务异常。
> - map 交付顺序对应输入，as\_completed 对应完成情况。
> - 等待超时不等于工作停止。
> - cancel 通常不能取消已开始的任务。
> - 执行器关停和任务自身超时分别设计。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
