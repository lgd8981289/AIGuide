# Spring Boot 启动流程是什么？SpringApplication.run() 做了哪些事？

[星环科技后端面试真题](../companies/transwarp-backend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q519-spring-boot-startup-process/) · [题库目录](../../README.md)

下面是一段模拟面试对话。

🧑‍💻 面试官：SpringApplication.run() 做了什么？

🙋‍♂️ 我：创建容器，扫描 Bean，再启动内嵌服务器。

🧑‍💻 面试官：配置文件什么时候参与？需要根据配置决定注册哪些 Bean，配置能等扫描完再准备吗？

🙋‍♂️ 我：环境配置需要先准备，再参与后面的容器创建和刷新。

🧑‍💻 面试官：端口已经能连接，但 Runner 还在加载缓存，这时候就可以把业务流量切进来吗？

> 启动不是一个瞬间。要把「环境准备」「容器刷新」与「业务就绪」按顺序讲清楚。

## 面试速答（60 秒版）

SpringApplication.run() 负责组织 Spring Boot 应用的启动。它会准备启动环境与配置，创建合适的 ApplicationContext，加载应用定义并刷新容器，然后执行启动任务，最终进入就绪阶段。

容器刷新过程中，会处理 Bean 定义、后处理器、实例创建等工作；Web 应用还会创建和启动相应的 Web 服务。非 Web 应用则不需要这一部分。

因此，启动流程不能只背“扫描 Bean，再启动 Tomcat”。应用类型、自动配置和 Web 服务实现都会影响具体路径。

同时，端口启动不等于业务初始化全部结束。ApplicationStartedEvent 在容器刷新后出现，Runner 随后执行，ApplicationReadyEvent 则在 Runner 完成后发布。[Spring Boot 官方事件顺序](https://docs.spring.io/spring-boot/reference/features/spring-application.html)。

![Spring Boot 启动：先准备，再就绪](https://note.lgdsunday.club/img/Q519/01-startup-overview.webp)

## 知识点详解：从启动参数走到应用就绪

### 环境先准备，后面才知道该加载什么

假设应用启动参数指定使用某个 Profile，并覆盖数据库地址。

这些输入需要先进入 Environment，形成当前有效的配置。后续条件装配才能根据环境判断：哪些配置参与，某个功能是否启用，需要创建什么对象。

环境准备还会涉及配置来源和相应扩展点，不是单纯读一个 application.yml。配置优先级可以看相邻的专门题，本文先关注它在启动中的位置。

这里按当前 Spring Boot 官方启动流程解释；具体源码方法和扩展机制应与项目所用版本对应，不拼接不同版本的调用栈。

### 创建上下文，加载定义，再刷新容器

接下来，SpringApplication 选择相应的 ApplicationContext。Servlet、响应式 Web 与非 Web 应用的上下文类型可能不同。

应用主配置等信息会被加载到上下文，随后进入 refresh。Bean 定义如何被扫描、导入和补充，是刷新过程中的一部分；它不等于已经把所有 Bean 全部创建完了。

容器还要处理定义后处理器、注册对象后处理器，并创建需要提前初始化的单例。依赖注入、初始化回调和代理处理，也在相应阶段发生。

所以，面试时最好把“发现有哪些 Bean”和“创建并初始化 Bean”分开。否则遇到条件装配、循环依赖或代理追问，就容易把阶段混在一起。

![环境、Bean 定义、Bean 实例](https://note.lgdsunday.club/img/Q519/02-context-refresh.webp)

### Web 服务是上下文启动的一部分

Web 应用在相关上下文刷新阶段创建并启动服务。使用 Servlet 容器、响应式服务，或者根本不是 Web 应用，具体行为都会不同。

因此，“run 总会启动 Tomcat”不成立。Spring Boot 会根据应用类型和依赖配置走对应路径。

端口监听也只是一个可观察状态。它说明网络入口存在，未必说明缓存预热、必要数据加载和其他启动工作都已经结束。

假设 Runner 正在加载业务必须的数据，外部此时能连接端口，也不应该只根据这一点判断可以接入正式流量。

### Started、Runner 与 Ready 的区别

容器刷新完成后，应用发布 Started 等相关事件，再执行 ApplicationRunner／CommandLineRunner。Runner 正常结束以后，才进入 Ready 阶段。

官方还区分 liveness 与 readiness：前者用于判断应用是否仍然存活，后者用于判断是否准备好服务请求。[应用可用性](https://docs.spring.io/spring-boot/reference/features/spring-application.html)。

部署平台是否实际根据 readiness 分配流量，还要看健康检查和流量规则的配置。事件发布与负载均衡行为不是同一个动作。

若启动阶段出现异常，会进入启动失败处理，而不是继续假装就绪。需要检查失败日志、上下文关闭及外部资源清理。

![端口可监听，不等于应用已就绪](https://note.lgdsunday.club/img/Q519/03-readiness-timeline.webp)

图中的 Runner 是启动阶段执行的回调，不会因为名称里有“任务”就自动转到后台线程。若在里面等待耗时初始化，Ready 也会随之推迟。

## 面试官继续追问

### Runner 里适合放所有耗时任务吗？

不适合。Runner 会影响进入 Ready 的时机，适合必须在就绪前完成的初始化。

可以后台执行的工作，应设计明确状态，避免启动被不必要的长任务拖住。但如果业务依赖它，也不能提前接受流量却没有降级策略。

### 所有 Bean 都会在启动时创建吗？

不会。懒加载、作用域和实际使用条件会影响实例化时间。

容器里存在某个 Bean 定义，不等于对应实例已经初始化，更不等于它连接的外部服务已经可用。

### 怎么排查启动慢？

先按阶段看时间：环境加载、容器刷新、单例初始化、Web 服务和 Runner。再定位具体初始化动作，例如网络连接或大量数据读取。

只看总启动时间，无法判断改自动配置还是改业务初始化。本篇做了官方流程核验，没有声称运行过实际 Spring 压测。

## 面试速记卡

> - run：组织环境、上下文、刷新、启动任务与就绪。
> - 定义与实例：发现 Bean 和创建 Bean 属于不同工作。
> - Web 类型：Servlet、响应式与非 Web 应用路径不同。
> - 时序：容器刷新 → Started → Runner → Ready。
> - 就绪判断：端口可连接，不等于业务初始化已经完成。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **星环科技 · Java后端 · 秋招**：Spring Boot 的启动流程是什么？（题意整理）。[面经来源](https://www.nowcoder.com/feed/main/detail/f698bb4d6d6f4e5a95013c7b2847e93c)；正文记录 2023-11-10 面试；原帖编辑于 2024-03-07。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
