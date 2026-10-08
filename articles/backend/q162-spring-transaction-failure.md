# Spring 的 @Transactional 为什么会失效？事务传播行为怎么选？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q162-spring-transaction-failure/) · [题库目录](../../README.md)

<!-- 以下对话为教学模拟，非真实面经。 -->

🧑‍💻 面试官：加了 @Transactional，方法报错就一定回滚吗？

🙋‍♂️ 我：是的，它可以保证方法里的数据库操作一起回滚。

🧑‍💻 面试官：你在方法里 catch 住异常，然后正常返回，会怎样？

🙋‍♂️ 我：那我重新抛出异常就可以了。

🧑‍💻 面试官：如果抛的是受检异常，或者调用没有经过代理，你确认过回滚规则吗？

> 事务失效要分两步查：「事务有没有建立」，以及「发生的异常会不会让它回滚」。

## 面试速答（60 秒版）

`@Transactional` 是事务配置元数据，不是写上去就一定生效。默认代理模式下，要通过容器管理的代理进入匹配的方法；内部调用、自己创建对象或不合适的方法与代理配置，都可能让预期事务没有建立。

事务建立后，还要看回滚规则。传统默认规则是 RuntimeException 和 Error 回滚，受检异常不自动回滚；规则可以按方法或全局调整。异常被 catch 后正常返回，也可能使代理看不到需要回滚的异常。

传播行为则决定遇到已有事务怎么办。REQUIRED 通常加入外部事务，REQUIRES\_NEW 使用独立事务，NESTED 依赖保存点及事务管理器支持。实际选择时，我会先确定哪些修改必须一起成功，再检查连接资源、失败路径和真实回滚结果。

![Spring 事务排查先检查建立，再检查异常与回滚规则](https://note.lgdsunday.club/img/Q162/00-60s-overview.webp)

## 知识点详解：从建立、加入到回滚，把事务边界画出来

### 先明确希望哪些修改一起成功

假设一次提交要写入主记录和明细。我们的要求是：明细写入失败，主记录也不能留下。这时应围绕这组修改建立清晰的事务边界，而不是给每个方法随手加注解。

再从真实入口检查：对象由谁创建，调用经过哪个代理，使用哪个事务管理器，数据库操作是否参与了同一套事务资源。注解覆盖不到的远程调用和其他数据库，不会自动加入这个本地事务。

另外，不要笼统地说「非 public 一定失效」。Spring 6 起，类代理默认可以支持部分 protected 和包可见方法；接口代理仍要求适合接口的 public 方法。private、final 及内部调用等限制，需要结合代理方式判断。

### 没有回滚，不一定是没有事务

假设主记录已经插入，明细写入抛错，但业务方法 catch 后只记录日志并返回成功。代理看到正常结束，可能按正常路径提交。

另一个常见问题是异常类型与回滚规则不一致。传统默认规则对 RuntimeException、Error 回滚，但不自动对受检异常回滚。可以设置 `rollbackFor` 等规则；Spring 6.2 起也提供全局 ALL\_EXCEPTIONS 默认策略。排查时要看项目实际配置，而不是只背默认值。

验证需要直接查数据库结果。日志里出现异常，不等于数据回滚；接口返回失败，也不能证明没有残留数据。

### REQUIRED、REQUIRES\_NEW、NESTED 不是三个强度等级

假设 A 调用 B，并且两次都经过相应代理。REQUIRED 让 B 加入 A 的物理事务；B 标记了 rollback-only，A 即使捕获异常继续执行，最后也可能无法提交，并得到 UnexpectedRollbackException。

REQUIRES\_NEW 让 B 使用独立物理事务，A 的事务暂时挂起。B 可以独立提交或回滚，但 A 原来占用的资源仍在，B 还可能需要另一条连接。因此并发高时必须检查连接池，不能到处使用它。

NESTED 则在同一物理事务中使用保存点，内层可以回到保存点。它是否可用取决于具体事务管理器和资源支持，不是所有数据库访问方案都等价支持。

### 不要让事务替你承担不属于它的保证

数据库事务不能把已经发送的邮件、已经成功的外部 HTTP 请求自动撤销。需要可靠通知时，可以让业务数据和待发送记录先在同一数据库事务中提交，再由后台发送并去重。

测试至少覆盖：中间步骤失败、受检异常、异常被捕获、内部调用和传播嵌套。并发下再看锁持有时间与连接等待。慢远程请求放进数据库事务，可能把锁和连接一起占很久。

本题只讲 Spring 的事务机制，不用其他语言的 with 或 Promise 代码冒充 `@Transactional` 的实际实现。

本题机制参考：[Spring Using @Transactional](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html)、[Spring Transaction Propagation](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/tx-propagation.html)。

![REQUIRED 共享事务、REQUIRES\_NEW 独立事务和 NESTED 保存点的区别](https://note.lgdsunday.club/img/Q162/01-detail.webp)

## 面试官继续追问

### readOnly 能禁止所有写入吗？

不能无条件这样保证。它会向事务系统传递只读意图，具体执行或优化由事务管理器与数据库决定。严格限制要检查实际资源行为。

### REQUIRES\_NEW 一定更安全吗？

不是。独立提交可能正好破坏你希望的一起成功，而且额外占连接。只有业务需要独立事务时才选。

### 内层 REQUIRED 报错被外层捕获后，外层还能提交吗？

如果内层已经把共享事务标成 rollback-only，捕获异常也不会自动清除这个状态。应验证最终提交，而不是只观察外层是否继续执行。

## 面试速记卡

> - 先确认代理、管理器和资源，再确认回滚规则。
> - 异常被吞掉，可能沿正常路径提交。
> - REQUIRED：通常共享物理事务。
> - REQUIRES\_NEW：独立事务，注意额外连接。
> - NESTED：保存点，依赖管理器和资源支持。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
