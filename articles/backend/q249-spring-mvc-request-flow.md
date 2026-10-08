# Spring MVC 请求处理流程是什么？DispatcherServlet 怎么把请求交给 Controller？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q249-spring-mvc-request-flow/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：Spring MVC 收到请求以后，会经过哪些步骤？

🙋‍♂️ 我：DispatcherServlet 找 Controller，Controller 返回 ModelAndView，然后渲染页面。

🧑‍💻 面试官：现在接口返回 JSON，也一定经过模板视图渲染吗？

🙋‍♂️ 我：不一定，响应体可以由消息转换器处理。

🧑‍💻 面试官：那“找到哪个方法”和“把参数准备好再调用方法”，是谁负责？为什么流程里既有 HandlerMapping，又有 HandlerAdapter？

> 这道题先拆三份工作：「找到谁来处理」，「怎样调用它」，「怎样把结果写回去」。

## 面试速答（60 秒版）

Spring MVC 中，DispatcherServlet 是前端控制器，负责协调请求分派，不把所有具体处理都自己完成。

HandlerMapping 根据路径、方法等条件找到处理器以及相关拦截器；HandlerAdapter 帮助调用该类处理器。对于常见注解 Controller，还涉及参数解析、必要的转换和返回值处理。

Controller 执行业务逻辑后，结果有不同去向。返回逻辑视图名时，可以由 ViewResolver 找到视图并渲染；使用 @ResponseBody 或 @RestController 返回响应体时，则由相应返回值处理和 HttpMessageConverter 等机制写出 JSON 等内容，不必绕一圈模板渲染。

异常也有专门的解析机制。面试回答应该说明普通成功路径，再补响应体、视图和异常分支，而不是让所有请求都硬套 ModelAndView。

![一次请求，三份职责](https://note.lgdsunday.club/img/Q249/01-overview.webp)

## 知识点详解：用一个 JSON 查询，把请求从头走到尾

### 请求先到服务器，不是直接跳进 Controller

假设客户端发送 GET /profiles/42，希望拿到一个资料 JSON。

请求进入 Servlet 容器和应用的相关过滤链。符合 DispatcherServlet 映射时，才由它协调 Spring MVC 的处理。

因此，Filter 和 Spring MVC 的 HandlerInterceptor 不是同一个位置，也不是所有前置逻辑都由 Controller 注解解决。是否经过安全过滤、路径映射到哪里，都要看实际配置。

本篇以普通同步 Spring MVC 请求为主，不把 WebFlux 的执行模型或异步再次分派原样混进来。

### HandlerMapping 解决“这次交给谁”

它根据请求条件寻找合适处理器。对于注解 Controller，映射可以包含路径、HTTP 方法、请求内容类型等条件。

GET /profiles/42 并不是简单拿字符串去猜一个同名函数，而是匹配已经登记的处理规则，形成相应处理链，包括处理器与拦截器等信息。

如果没有匹配、方法不允许或者媒体类型不合适，可能在进入业务方法之前就出现相应结果。看到 Controller 没有打印日志，不代表请求根本没有到应用。

[Spring 的特殊 Bean 文档](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet/special-bean-types.html)明确区分了 HandlerMapping 与 HandlerAdapter 的职责。

### HandlerAdapter 解决“这一类处理器怎么调用”

找到目标，不等于所有处理器都能按同一方式执行。

DispatcherServlet 把调用细节交给适配器。常见注解方法需要准备参数：从路径取得 42，按参数类型转换；如果有请求体、校验或其他参数来源，也交给相应机制处理。

例如把不合法字符转换成数字失败，可能根本还没进入业务方法。不是说 Controller 自己先运行，再决定参数是否能拿到。

因此，HandlerMapping 像分派规则，HandlerAdapter 承担适配调用。两者都有意义，不是一个多余的“中间转发盒子”。

### 业务返回一个对象，JSON 是谁写出来的？

在 @ResponseBody 的路径上，Controller 可以返回资料对象，相应返回值处理器把它交给可用的消息转换机制，根据类型与协商结果写入响应体。

不是 Controller 返回对象，就一定先生成 HTML，再把 HTML 变成 JSON。

[Spring @ResponseBody 文档](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/responsebody.html)说明了 HttpMessageConverter 的作用，也说明 @RestController 包含 Controller 和 ResponseBody 的组合语义。

JSON 转换失败、没有合适转换器、输出过程中异常，都可能让“业务已经算出结果”变成“客户端没有收到预期响应”。所以，排查范围不能停在 Controller 返回语句。

### 返回视图名，是另一条结果分支

如果普通 Controller 返回的是逻辑视图名，相关结果处理可以保留模型数据，再通过 ViewResolver 找到实际 View，渲染内容写回客户端。

这里才需要解释模板视图那条路线。视图名是“使用哪个视图”，模型是“交给视图哪些数据”，两者不是 JSON 响应里必经的包装。

同样一个 String，因注解和返回值处理约定不同，可能被当成视图名，也可能作为响应体文字。不能只看返回值 Java 类型就判定它一定是什么内容。

![返回对象，不一定先渲染页面](https://note.lgdsunday.club/img/Q249/02-results.webp)

### 拦截器和异常，应该放到正确的位置

[Spring 请求处理说明](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet/sequence.html)介绍了处理链及异常解析。

拦截器的 preHandle 可以决定是否继续处理。普通成功路径中的 postHandle，不应被一概理解成“此时任何 JSON 还没写出，随便重塑响应都来得及”；响应体路径可能已经在适配器内部处理了返回值。

异常则可能由 HandlerExceptionResolver 等机制转换为统一响应、错误视图或其他处理结果。例如 ControllerAdvice 是常用异常处理扩展方式之一，但也不能保证网络断开以后仍能成功写出完整错误 JSON。

面试里不用背每个内部方法名称。说明分派、调用、结果处理和异常责任，再按指定场景补细节，会比画一条没有分支的长链清楚。

本题涉及 Spring 专属组件，不用 TS/Python 路由库名称替换成 HandlerMapping，假装它们有同一套实现。

![Controller 没运行，也可能已经进了应用](https://note.lgdsunday.club/img/Q249/03-failures.webp)

## 面试官继续追问

### Handler 一定是注解 Controller 方法吗？

不是。Spring MVC 有不同处理器与适配器约定。注解方法是常见场景，不应定义成唯一一种。

### 每次请求都会新建一个 Controller 吗？

通常不是。常见 Controller 是受容器管理的单例，因此也不应把请求可变数据随意放在共享字段中。具体作用域按配置判断。

### 404 应该先查数据库有没有数据吗？

先确认是不是路径没有映射，还是已经进入业务后找不到资源。相同状态码可以在不同位置产生，排查要带上链路证据。

## 面试速记卡

> - DispatcherServlet：协调分派，不包办所有细节。
> - HandlerMapping：找到处理器及相关处理链。
> - HandlerAdapter：适配调用，注解方法还涉及参数与返回值处理。
> - 结果分支：视图走解析渲染；响应体走相应消息转换。
> - 排查：定位失败阶段，别只看 Controller 是否返回对象。

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
