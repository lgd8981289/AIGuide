# Spring 的 Filter、Interceptor 和 AOP 有什么区别？鉴权和日志应该放在哪里？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q314-filter-interceptor-aop/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 **面试官：** Filter、Interceptor 和 AOP 有什么区别？

🙋‍♂️ **我：** 都能在执行前后加逻辑，可以用来鉴权和记录日志。

🧑‍💻 **面试官：** 请求还没找到 Controller，哪一层已经能拦？业务方法不是通过 HTTP 调用，哪一层还能生效？

🙋‍♂️ **我：** 它们所在的位置不同。

🧑‍💻 **面试官：** 那鉴权只放 MVC Interceptor，就能覆盖整个应用了吗？

> 不要先背能做什么。先看「拦截位置」：这一层看得到什么，又有哪些入口不会经过它。

## 面试速答（60 秒版）

这里讨论 Servlet 栈里的 Spring MVC。Filter 工作在 Servlet 容器的过滤链上，可以处理请求和响应，覆盖哪些请求取决于映射、顺序和 dispatcher 类型等配置。

Interceptor 围绕 MVC 选中的 Handler 工作，更适合与这次路由处理有关的逻辑；它不是整个应用所有入口的统一拦截器。

Spring AOP 主要通过代理拦截匹配的方法调用，适合事务、业务审计等横切逻辑。它不依赖请求必须从 HTTP 进入，但调用必须符合代理机制的边界。

鉴权优先使用具有完整安全处理能力的方案，例如 Spring Security 的过滤链。不能只因为 Interceptor 写起来方便，就把它当成唯一安全边界。

![Filter、Interceptor、AOP 拦在哪里？](https://note.lgdsunday.club/img/Q314/01-overview.webp)

*图：Filter、Interceptor、AOP 拦在哪里？。*

## 知识点详解：同一请求经过三层，每层看到的东西不一样

### 先把一次请求放回调用链

假设浏览器请求一个业务接口。典型链路可以简化为：过滤链、DispatcherServlet、匹配 Handler、相关 Interceptor、Controller，再调用 Service。

如果 Service 调用经过了匹配的 Spring 代理，AOP 通知也可以参与。但不是这条链上每个方法都天然被 AOP 拦截。这里画的是帮助理解的正常路径，不是完整的异常和异步调度流程。

这样摆开以后，就能看出 Filter 更靠近请求入口，Interceptor 更靠近 MVC 的处理器，而 AOP 关注代理方法调用。

### Filter 为什么适合入口层的工作？

它接触请求和响应，可以决定是否继续调用后面的过滤器或 Servlet，也可以包装请求和响应。

例如请求级上下文初始化、某些安全检查和入口日志，都可能放在合适的过滤链位置。具体范围还要看 URL 映射与 dispatcher 配置，不能说“任何请求一定经过我写的 Filter”。

Spring Security 的 Servlet 支持就在过滤链上建立安全处理，见 [官方架构说明](https://docs.spring.io/spring-security/reference/servlet/architecture.html)。顺序很重要：提前返回的过滤器，可能让后面的逻辑根本没有运行机会。

### Interceptor 多知道什么，少覆盖什么？

MVC 已经选择了 Handler，Interceptor 因而可以围绕这次处理器调用工作。例如结合处理器信息设置页面公共数据，或者实现与路由处理有关的非安全前置条件。

但是没有经过这套 MVC Handler 处理的入口，不会因为存在一个 Interceptor 就自动受保护。静态资源、错误处理、不同映射和异步路径，也需要按实际配置检查。

[Spring 对 Interceptor 的说明](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet/handlermapping-interceptor.html)明确提醒，它并不是理想的安全层。鉴权涉及路径匹配和完整覆盖，不能只看某个正常 Controller 能不能拦住。

![安全边界，要覆盖实际入口](https://note.lgdsunday.club/img/Q314/02-coverage.webp)

*图：安全边界，要覆盖实际入口。*

### AOP 不围着 URL，而围着方法调用

业务方法可能被 Controller、定时任务或消息处理器调用。只要经过合适的代理、匹配切点，AOP 都有机会执行。

不过，代理有边界。同一个对象内部直接调用自己的另一个方法，可能绕开代理；final、可见性、代理类型等条件也会影响能够拦截的方法范围。不要把“加注解”当成“所有调用路径都生效”。机制见 [Spring AOP 文档](https://docs.spring.io/spring-framework/reference/core/aop.html)。

这三层都有日志用途，但应分工。请求日志记录入口与响应，业务审计记录有意义的业务动作。全都打印完整参数，不但重复，还可能泄露敏感信息。

本文采用 Spring/Servlet 的专属机制，不机械翻译成其他框架的 TS、Python API。

## 面试官继续追问

**怎么证明鉴权覆盖完整？**

列出所有入口和 dispatcher 路径，检查安全链配置，再测试未登录、无权限、异常和异步等场景。不只测试一个成功匹配的 URL。

**前后置日志一定能配成一对吗？**

不一定。提前返回、异常和异步处理都会影响生命周期，需要按接口契约安排清理与日志结束动作。

## 面试速记卡

> - Filter：Servlet 过滤链，请求与响应入口。
> - Interceptor：围绕 MVC Handler，不覆盖所有调用入口。
> - AOP：代理方法调用，关注切点与代理边界。
> - 安全：完整安全链，不只靠方便的路由拦截。
> - 日志：入口日志与业务审计分工，避免重复和敏感数据泄露。

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
