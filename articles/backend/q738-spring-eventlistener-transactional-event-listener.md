# Spring 的事件监听什么时候执行？EventListener 和 TransactionalEventListener 有什么区别？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q738-spring-eventlistener-transactional-event-listener/) · [题库目录](../../README.md)

*下面是一段用于讲解的模拟面试对话。*

🧑‍💻 **面试官：** 创建数据以后发布一个 Spring 事件，监听器里发通知，可以吗？

🙋‍♂️ **我：** 可以，事件能把创建逻辑和通知逻辑分开。

🧑‍💻 **面试官：** 监听器已经把通知发出去了，后面的事务却回滚了，怎么办？

🙋‍♂️ **我：** 那改成事务提交后监听。

🧑‍💻 **面试官：** 如果数据库刚提交，进程就退出，通知一定还会发出去吗？

> 事件解耦、事务阶段和可靠投递是三件事。把监听器挪到提交之后，只解决其中一个时机问题。

## 面试速答（60 秒版）

`@EventListener` 用来监听应用事件。默认事件广播器下，普通监听器通常就在发布线程中同步执行，发布事件不自动等于启动一个异步任务。

`@TransactionalEventListener` 可以把执行绑定到事务阶段，默认是 AFTER\_COMMIT，也就是事务成功提交之后。还可以选择提交前、回滚后和完成后。没有事务时，默认不执行，除非显式开启 fallbackExecution。

如果监听逻辑必须依赖提交结果，事务事件比发布时立刻处理更合适。但是提交后的失败不能再撤销已经完成的提交，也不保证进程退出后事件还能补回来。

因此，进程内事件适合职责解耦；跨进程通知如果要求可靠交付，还需要持久化任务或 Outbox 等方案。同步还是异步、什么时候执行、丢失后怎么恢复，要分别回答。

![普通事件默认同步执行，事务事件可绑定提交后，但持久投递需另设计](https://note.lgdsunday.club/img/Q738/01-event-overview.webp)

## 知识点详解：沿着一次事务看清监听时机

### 普通监听器可能比提交更早执行

假设服务在事务中先保存一条资料，再发布“资料创建”事件，然后继续更新另一张表。如果使用默认的同步广播方式，监听器会在 publishEvent 这一段调用中执行。

如果它此时已经发出了外部通知，后面更新表却失败，数据库事务可以回滚，已经发出去的通知却不会跟着撤回。对外部用户来说，就可能收到一条指向不存在资料的消息。

这里的问题不是事件写法不优雅，而是外部动作发生得比最终提交结果更早。[Spring 应用事件文档](https://docs.spring.io/spring-framework/reference/core/beans/context-introduction.html)说明了默认同步广播及异步监听的区别。自定义广播器或加异步机制以后，线程行为会变化，不能把默认行为当成任何配置下的保证。

### 事务监听把回调挂到某个阶段

`@TransactionalEventListener` 默认在 AFTER\_COMMIT 执行。事件在事务内发布时，监听机制先与当前事务建立联系，等事务成功提交，再处理对应回调。

事务回滚时，这个提交后监听器不会照常运行。需要回滚后清理，可以选择 AFTER\_ROLLBACK；无论提交还是回滚都要关注完成，可以选择 AFTER\_COMPLETION。BEFORE\_COMMIT 表示提交前阶段，但也不能被理解成“事务已经保证一定提交”。

这里也不要把 AFTER\_COMMIT、AFTER\_COMPLETION 背成两个必须依次执行的阶段。事务事件中的 AFTER\_COMMIT 和 AFTER\_ROLLBACK，是完成回调按结果细分的情况；不同监听器的调用顺序，还需要看排序配置。[TransactionPhase 说明](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/transaction/event/TransactionPhase.html)明确了这个关系。

没有活动事务时，默认会跳过事务事件监听。如果设置 fallbackExecution=true，则是在没有事务时也允许执行，不是悄悄替你创建一个事务。[事务事件官方说明](https://docs.spring.io/spring-framework/reference/data-access/transaction/event.html)列出了这些阶段与缺省行为。

![事务成功和回滚经过不同监听阶段，提交后监听不在回滚路径执行](https://note.lgdsunday.club/img/Q738/02-transaction-phases.webp)

### 提交以后，再写数据库要格外小心

到了提交后阶段，原事务已经完成。相关资源可能还暂时绑定着，让代码看起来仍能访问连接或持久化上下文，但这不表示你又获得了一次正常提交机会。

如果此时确实需要持久化新的状态，应明确开启独立事务，并检查传播配置及代理调用方式，不能依赖原事务的残余资源。监听注解本身不会让后续写入自动产生新的可靠提交。[TransactionalEventListener Javadoc](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/transaction/event/TransactionalEventListener.html)专门提醒了这个边界。

如果又给监听器加了 @Async，还要进一步考虑执行线程改变。原线程事务与线程上下文不会因为换了线程就自然传过去；异常也不能再按原调用栈同步返回。响应式事务还有 Reactor Context 的独立规则，不能把线程绑定事务的解释原样搬过去。

![原事务已完成提交后，资源仍可访问不等于可以继续提交写入，需要独立事务边界](https://note.lgdsunday.club/img/Q738/04-after-commit-new-transaction.webp)

### 提交后回调仍然存在丢失窗口

现在回到开头的问题。数据库已经提交，但进程在监听器完成通知之前退出。只保存在进程内存里的事件，不具备天然的持久化恢复能力。

如果“必须最终通知成功”，可以把待通知任务与业务数据在同一事务中持久化，再由独立执行器读取、发送、重试，并通过业务标识防止重复。这是可靠性设计，不是把 AFTER\_COMMIT 换成异步就自动获得的能力。

验证时要分别测试成功提交、主动回滚、没有事务、监听器抛异常，以及提交完成后进程中断。还要确认测试框架有没有默认把测试事务回滚，导致你以为监听器失效。本文按 Spring Framework 7.0.9 官方文档核验，没有虚构容器集成测试结果。

![进程内提交后回调可能丢失，持久任务配合重试和幂等提供恢复能力](https://note.lgdsunday.club/img/Q738/03-event-loss.webp)

## 面试官继续追问

### AFTER\_COMMIT 监听失败，原事务会回滚吗？

不会把已经完成的提交撤销。失败怎么上报、是否重试，取决于监听执行方式和业务设计，不能把日志里有异常当作数据库已经恢复原状。

### @Order 能保证异步监听器完成顺序吗？

不能把调用排序直接等同于并发任务的完成排序。如果后一个动作依赖前一个结果，应当显式编排，而不是只在两个监听器上标顺序。

### 事件对象能直接放一个仍在变化的实体吗？

要考虑监听发生的时间和线程。实体后续被修改、会话已关闭或延迟加载，都可能影响读取。使用与需求匹配的不可变快照或稳定 ID，通常更容易控制。

## 面试速记卡

> - 普通事件：默认广播下通常同步执行，不自动异步。
> - 事务事件：绑定事务阶段，默认 AFTER\_COMMIT。
> - 无事务：默认跳过；fallbackExecution 不负责新建事务。
> - 提交之后：不能撤销已提交结果，后续写入应明确新事务。
> - 可靠投递：进程内回调不是持久化消息，必须补恢复与幂等机制。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
