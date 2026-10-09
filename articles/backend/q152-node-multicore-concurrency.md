# Node.js 如何利用多核？worker_threads、cluster、child_process 怎么选？

[字节前端面试真题](../companies/bytedance-frontend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q152-node-multicore-concurrency/) · [题库目录](../../README.md)

<!-- 以下对话为教学模拟，非真实面经。 -->

🧑‍💻 面试官：Node.js 怎么利用多核？

🙋‍♂️ 我：Node 是单线程，开 cluster 就能利用所有 CPU。

🧑‍💻 面试官：大图片计算把一个请求卡住，开更多服务进程就一定解决吗？

🙋‍♂️ 我：可以用 worker\_threads 分摊计算。

🧑‍💻 面试官：进程、Worker 和异步 I/O 分别负责什么？开多少，依据又是什么？

> 不要先数线程，先分清等待 I/O 和占用 CPU，再决定多进程、Worker 与服务副本怎么配合。

## 面试速答（60 秒版）

Node.js 常见应用主线程上的 JavaScript 执行是单线程，但整个运行时不只有一条线程。异步 I/O、底层线程池和应用 JavaScript 的执行要分开理解。

多进程或多个服务副本可以承接更多请求，并提供进程隔离。cluster 是 Node 中组织多进程、共享监听端口的一种方式，不是唯一部署选择。

CPU 密集的 JavaScript 工作可以交给 worker\_threads，通常建立有上限的工作池；普通异步 I/O 不必为每次等待再开一个 Worker。

数量应按可用 CPU、内存、任务类型和下游容量测试。进程之间默认不共享普通内存，Worker 的共享或转移数据也有成本，不能盲目按宿主机核心数全部开满。

![Node异步I/O、多服务进程与CPU计算Worker池职责不同](https://note.lgdsunday.club/img/Q152/00-60s-overview.webp)

## 知识点详解：并发请求与并行计算怎么分工

### 先看请求是在等，还是在算

假设一个接口查数据库，大部分时间等待数据库返回；另一个接口同步分析一张大图片，长时间执行 JavaScript 计算。

前者可以通过异步 I/O 在等待期间处理其他事情。后者若一直占住主线程，其他请求的回调也可能排队。

把计算函数加上 async，不会自动把它搬到另一个核心。Promise 表达结果时机，也不会凭空把同步循环变成并行工作。要减少主线程占用，必须改变工作的执行位置或拆分方式。

### 多进程，先解决承载与隔离

多个应用进程各自有运行时和内存，能够在不同核心上处理请求。可以用 cluster，也可以由容器、进程管理器或负载均衡组织多个副本。

cluster 的 Worker 是子进程，不是 worker\_threads 中的线程。二者名字相似，内存模型却不同。

普通模块变量、内存会话和本地计数器不会自动在所有进程中同步。需要共享的数据可以由数据库、缓存或明确的进程通信维护；不能把“本机已经启动四个进程”当成状态一致性的方案。

进程异常隔离有所改善，但主机、共享数据库和部署配置仍然可能是共同故障点。

### Worker 适合计算，但要管理队列

worker\_threads 可以并行执行 JavaScript。数据可以通过消息传递，也可以按规则转移 ArrayBuffer 或使用 SharedArrayBuffer；共享内存仍需要正确同步。

如果每个请求都创建一个新 Worker，启动和数据传输成本可能抵消收益。通常用工作池控制数量，把任务排入有边界的队列，并设置超时、取消和失败处理。

任务非常大时，也要问数据是否必须整份复制过去，结果是否能缩小返回。线程多了，序列化、内存和排队并不会自动消失。

这里讲的是 Node 原生机制，Python 的多进程和线程模型不同，不能把 cluster 与 ProcessPool 的 API 一一替换。本文不提供伪等价实现。

### 数量上限，要跟资源约束一起算

容器里可能只有有限 CPU 配额。看见宿主机有很多核心，不代表当前实例可以使用全部。Node 的 availableParallelism 可提供可用并行度参考，但最终仍要结合部署限制和真实测试。

同时考虑内存、连接池和下游服务。增加应用进程会增加连接和资源使用，数据库可能先被压垮。

我会观察吞吐、尾部延迟、主线程延迟、CPU、内存和任务队列。在相同负载下逐步调整，找出继续增加并发开始恶化的位置，而不是只追求 Worker 数字更大。

本题机制参考：[Node.js：Cluster](https://nodejs.org/api/cluster.html)、[Node.js：Worker threads](https://nodejs.org/api/worker_threads.html)。

## 面试官继续追问

### Node 单线程为什么能处理多个请求？

异步等待期间不必占着应用线程；回调就绪后再调度执行。并发等待不等于同一线程同时执行多个JavaScript函数。

### cluster 和 worker\_threads 都能直接共享对象吗？

cluster进程普通内存独立；Worker消息和共享内存有指定机制，也不是随意共享所有对象。

### 开更多副本一定增加吞吐吗？

还受CPU、内存、连接池和下游限制，过量并发可能只增加排队和尾延迟。

## 面试速记卡

> - 先分任务：等待I/O，还是CPU计算。
> - 多进程：请求承载与隔离，普通内存不自动共享。
> - worker\_threads：适合CPU密集JavaScript，管理工作池与队列。
> - async：不是自动多核开关。
> - 验收：资源配额、尾延迟和下游容量一起看。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **字节跳动 · 前端 · 原帖未明确批次**：Node 的子进程、cluster 和 worker_threads 如何使用？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353156819747020800)；原帖编辑于 2020-08-24。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
