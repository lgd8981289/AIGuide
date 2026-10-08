# Web Worker 和 Service Worker 有什么区别？计算任务和离线缓存怎么选？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q274-web-worker-service-worker/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：页面要解析很大的数据，怕卡住按钮，可以用什么？

🙋‍♂️ 我：把计算放到 Web Worker，再把结果传回来。

🧑‍💻 面试官：那页面断网，还想读取之前缓存的资源，是同一个 Worker 负责吗？

🙋‍♂️ 我：可以用 Service Worker 处理受控页面的请求和缓存策略。

🧑‍💻 面试官：既然 Service Worker 也在后台，能不能让它永远运行一个计时器，代替普通 Worker 做长计算？

> 两者都离开页面主线程，但一个主要接计算任务，另一个主要接浏览器事件。后台不等于永久运行。

## 面试速答（60 秒版）

常见的 Dedicated Web Worker 由页面创建，在独立执行环境里处理计算，通过 postMessage 等方式与页面通信，不能直接操作页面 DOM。它适合把较重计算移出主线程，保持页面响应。

Service Worker 则按注册范围控制页面，处理 fetch、push 等事件，可以配合 Cache API 实现离线策略。它有安装、激活与受控客户端等生命周期，浏览器可以终止空闲实例，之后再为事件启动，不适合当永久常驻的计时线程。

所以，大数据计算优先考虑 Web Worker，离线请求与资源缓存考虑 Service Worker。两者可以配合使用，但要分别处理消息、状态持久化、资源更新和失败情况，不能只因为都叫 Worker 就互换。

![Web Worker 与 Service Worker 两种职责](https://note.lgdsunday.club/img/Q274/01-workers-overview.webp)

## 知识点详解：一个页面，为什么需要两种后台角色？

### 大计算卡住页面，先看主线程在忙什么

假设咱们做一个报表页面，用户选择文件后，需要分析很多行数据。如果整个计算长时间占用主线程，点击、输入和页面更新就可能被延后。

Dedicated Worker 可以承担这份计算。页面把必要数据交给它，它完成后再返回结果，页面负责展示。

这不是 Worker 在后台偷偷修改 DOM。它没有页面的 document，也不能直接替按钮设置文字；结果需要传回来，由页面侧更新。[Web Worker 用法](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)给出了通信与环境约束。

本题的计算角色主要指 Dedicated Worker，不把 Shared Worker、Service Worker 和 Node.js worker\_threads 的生命周期混成一种。

### postMessage 传的是一份什么？

页面与 Worker 可以通过消息传递数据，常见数据按结构化克隆规则处理。

传很大的对象时，复制与组织数据本身也有成本；某些可转移对象可以通过转移所有权减少复制，但转移以后发送侧的相应资源可能不能继续按原样使用。

因此，把计算移出去不保证总耗时必然更短。它的主要价值可以是让主线程不被长任务占住，还要测通信、计算和最终显示的完整过程。

SharedArrayBuffer 等共享方式又有独立条件与同步责任，不能简单说 Worker 之间永远不可能共享内存。普通消息传递与共享内存应分别讨论。

![postMessage 结构化克隆与 ArrayBuffer 转移](https://note.lgdsunday.club/img/Q274/02-message-transfer-v2.webp)

### 离线页面，问题转到了请求路径

现在换一个需求：用户已经访问过报表页面，断网以后仍希望打开已缓存的资源。

这时主要问题不是计算有多重，而是页面发出的资源请求，能不能得到一个可用响应。

Service Worker 可以控制相应页面，接收它们的 fetch 事件，再根据自己的策略从网络或 Cache API 返回响应。它不只是把一个大函数挪到后台，而是参与了请求处理。[Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)说明了这些能力。

不过，注册一个 Service Worker 不会自动缓存整个站点。哪些请求缓存、何时更新、离线缺失怎么处理，都需要实现明确策略。Cache API 也不是 HTTP 缓存头的同义词。

### 安装、激活、控制页面，不是同一时刻

假设用户第一次进入网站，页面开始注册 Service Worker。注册、安装并不意味着当前页面的每个请求已经立刻由它接管。

Service Worker 还要进入适当的激活与控制状态。新版本可能等待旧客户端释放；默认情况下，首次页面的控制也需要按生命周期理解，必要时才讨论 clients.claim 等行为。

因此，测试离线能力要确认当前页面是否真正受控，再检查缓存是否存在。只看到注册成功就关网，很容易把生命周期问题误判成缓存命令失败。

注册范围决定它可以控制哪些页面，但不能简化成“只拦截 URL 路径等于 scope 的资源”。受控页面发出的请求，还要按 fetch 事件等规则理解。

Service Worker 通常要求安全上下文，HTTPS 是常见部署条件，localhost 等可信本地环境另有例外。不能只因为本地 HTTP 能测试，就推到任意生产 HTTP 站点。

![Service Worker 安装激活及页面控制的不同阶段](https://note.lgdsunday.club/img/Q274/03-control-lifecycle.webp)

### 为什么不能用它永远跑计时器？

Service Worker 是事件驱动的。浏览器可以在适当时机停止当前实例，之后有事件再启动。

所以，它的全局变量不能当成永不丢失的业务存储，setInterval 也不能当成永久后台调度。事件里的 waitUntil 可以扩展相关工作寿命，但不是保证任意长任务永远不被终止的许可证。

需要跨实例保留的数据，应使用合适的持久化方式；需要可靠长任务，就继续判断是否应该在服务器或其他可靠执行环境完成。

![Service Worker 随事件唤醒且状态应持久化](https://note.lgdsunday.club/img/Q274/04-event-lifetime.webp)

### 两种 Worker 可以怎样一起工作？

假设页面离线打开缓存好的应用外壳，Service Worker 负责按策略提供资源；用户选择本地文件以后，再由 Dedicated Worker 解析数据，页面展示结果。

前者解决请求与缓存，后者解决计算与响应。它们不需要被合成一个“万能后台线程”。

测试时，分别检查大输入计算是否仍能操作页面，离线时所需资源是否齐全，刷新后页面是否受控，以及发布新版本时旧缓存怎么退出。还要验证失败与取消，不只验证成功的第一次打开。

## 面试官继续追问

### Worker 能直接操作 DOM 吗？

不能按页面脚本的方式访问 document。需要把结果或指令交给页面，由页面进行对应更新。

### Service Worker 注册成功，就一定能离线吗？

不能。还要有受控页面、可用缓存和明确的离线响应策略。注册状态只是其中一步。

### 把任务放进 Worker，总执行时间就会减少吗？

不一定。通信与资源竞争可能增加总耗时，但页面响应仍可能改善。需要分别测用户交互和任务完成时间。

## 面试速记卡

> - Dedicated Worker：页面交计算任务，消息返回结果，页面负责 DOM。
> - Service Worker：按生命周期处理事件，可参与受控页面的请求与缓存。
> - 离线：注册不等于缓存齐全，也不等于当前页面已受控。
> - 生命周期：Service Worker 不永久常驻，全局状态不能当持久化。
> - 判断：计算、请求策略、通信成本和可靠执行要求分开设计。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
