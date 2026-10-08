# NestJS 的依赖注入是什么？Provider 的作用域为什么会影响请求？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q159-nestjs-dependency-injection/) · [题库目录](../../README.md)

<!-- 以下对话为教学模拟，非真实面经。 -->

🧑‍💻 面试官：NestJS 为什么要用依赖注入，自己 new 一个 Service 不行吗？

🙋‍♂️ 我：依赖注入就是框架自动创建对象，能少写一些代码。

🧑‍💻 面试官：如果生产环境用真实仓库，测试时用内存仓库，你准备改多少处 new？

🙋‍♂️ 我：那可以把这些对象统一放到一个地方创建。

🧑‍💻 面试官：很好。再问一个问题：默认 Service 被请求共享，你把当前用户存到它的字段里，会怎样？

> 依赖注入要解决两个问题：「对象从哪里来」，以及「这个对象活多久」。少写 new 只是结果，不是重点。

## 面试速答（60 秒版）

NestJS 的依赖注入，是把对象的创建和依赖关系交给容器管理。使用方声明自己需要哪个 token，模块注册对应 Provider，容器再解析并注入实例。

Provider 可以由类、现有值、工厂或已有 Provider 提供。这样业务代码不必自己决定具体实现，测试时也更容易替换。

另一个重点是作用域。默认 Provider 通常是单例，请求之间共享；`REQUEST` 按请求创建；`TRANSIENT` 则为不同消费者提供独立实例。共享 Service 里不能随意保存当前用户等请求状态。选择请求作用域，还要考虑它沿依赖链向使用方传播，以及额外创建对象的成本。

![NestJS 容器解析 Provider 与三种作用域总览](https://note.lgdsunday.club/img/Q159/00-60s-overview.webp)

## 知识点详解：从依赖声明到实例生命周期，容器做了什么

### 先把业务依赖和创建过程拆开

假设一个报表 Service 需要读取订单。直接在 Service 里创建数据库仓库，会让它同时承担报表规则、数据库连接和实现选择三个职责。测试报表逻辑时，也不得不跟着准备数据库。

使用依赖注入后，报表 Service 只声明「我需要订单仓库」。模块把仓库 token 对应到某个 Provider，容器完成创建和连接。测试时，再把这个 token 对应到内存实现。

这里的 token 是容器查找依赖的标识，可以是类，也可以是字符串或 Symbol。TypeScript 的 interface 在运行时已经被擦除，不能只声明一个接口，就期待容器自动找到实现。

### Provider 注册，不等于所有模块都能使用

`useClass` 选择一个类来实例化，`useValue` 直接提供现成对象，`useFactory` 用工厂及其依赖创建结果，`useExisting` 则让另一个 token 指向已有 Provider。

需要在模块中注册 Provider；如果别的模块也要使用，提供方还要导出，使用方再导入对应模块。报「不能解析依赖」时，先查 token、注册、导出和导入，不要一开始就怀疑业务方法。

本题讲 NestJS 的容器机制。Python 框架可以提供其他依赖管理方式，但不是同一套 NestJS API；这里不把装饰器和作用域机械翻译成 Python 代码。

### 单例为什么不能放请求临时状态

假设两个请求都调用同一个默认作用域的 Service。第一个请求把 `currentUser` 改为甲，然后等待数据库；第二个请求把它改为乙。第一个请求恢复执行时，再读这个字段，可能已经读到乙。

JavaScript 没有在同一线程同时跑这两段代码，也照样可能发生这种穿插。异步等待足以让多个请求交错。

因此，数据库连接池等适合共享的资源可以是单例；当前用户、当前租户和一次请求的缓存，则要通过参数、受控的异步上下文，或合适的请求作用域传递。单例不是问题，混放生命周期不同的状态才是问题。

### 请求作用域会沿哪条方向传播

假设 Controller 依赖 ReportService，ReportService 依赖一个请求作用域的 UserContext。为了让 ReportService 拿到当前请求自己的上下文，它以及依赖它的 Controller，也会进入请求作用域。

但 ReportService 还依赖的数据库连接池，不会仅仅因为被它使用就自动变成请求作用域。传播方向是向依赖请求实例的消费者走，而不是把整棵依赖树都重新创建。

选型时先画依赖链。只为隔离一个小字段，就把大量对象变成按请求创建，可能没有必要；反过来，为了省创建成本把用户状态放进全局单例，也不值得。

本题机制参考：[NestJS Custom providers](https://docs.nestjs.com/fundamentals/custom-providers)、[NestJS Injection scopes](https://docs.nestjs.com/fundamentals/injection-scopes)。

![请求作用域从 UserContext 向 Service 和 Controller 传播，不使连接池变成请求作用域](https://note.lgdsunday.club/img/Q159/01-detail.webp)

## 面试官继续追问

### TRANSIENT 是每个请求一个吗？

不是。它强调不同消费者获得独立实例，不等同于按 HTTP 请求隔离。对象最终活多久，还要看消费者的生命周期。

### useExisting 和 useClass 一样吗？

不一样。前者给已有 Provider 创建别名，后者选择一个类由容器实例化。不能在需要共享同一实例时随意互换。

### 怎么验证不会串用户？

让两个不同用户的请求在异步等待处交错执行，检查每一步的上下文都属于各自请求。普通串行测试很难暴露这个问题。

## 面试速记卡

> - 注入：通过 token 解析依赖，不由使用方决定创建细节。
> - 注册、导出、导入共同决定模块可见性。
> - 默认单例共享实例，不随意保存请求状态。
> - REQUEST 向依赖它的消费者传播。
> - TRANSIENT 按消费者隔离，不等于按请求。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
