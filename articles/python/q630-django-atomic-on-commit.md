# Django 的 atomic 和 on_commit 怎么配合？为什么事务回滚了，通知却发出去了？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/python/q630-django-atomic-on-commit/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：为什么事务回滚了，通知却发出去了？

🙋‍♂️ 我：外部通知不属于数据库事务，发送后不会跟着回滚。

🧑‍💻 面试官：那 atomic 里注册 on\_commit，就能避免回滚后通知吗？

🙋‍♂️ 我：相关事务成功提交才运行回调，回滚会丢弃对应回调。

🧑‍💻 面试官：内层 atomic 结束算已经提交了吗？回调发送失败，还能撤销刚才的数据库提交吗？

> 提交后回调解决执行时机，不提供跨系统回滚，也不等于可靠投递。

## 面试速答（60 秒版）

atomic 管理数据库事务。外层正常结束提交，异常离开则回滚；嵌套 atomic 通常使用保存点，内层成功结束不代表整个外层事务已经提交。

on\_commit 把动作安排在相关事务成功提交后执行。回滚时对应回调不会执行，因此适合避免数据库没保存却已经发送通知。默认自动提交且没有事务时，注册回调会立即执行。

不过回调发生在提交之后，发送失败不会撤销已经提交的数据。它也不是持久消息队列，提交后进程退出等情况仍可能丢失动作。

如果要求可靠通知，应把待发送事件与业务数据一起持久化，再由后台投递和重试。on\_commit 可以帮助启动后续工作，但不能替代可靠事件记录。

![数据库提交以后，再做外部动作](https://note.lgdsunday.club/img/Q630/01-overview.webp)

## 知识点详解：什么时候提交，什么时候通知

### 数据库回滚不了已经发出去的消息

假设创建记录后立即给外部系统发通知，接着数据库操作失败。数据库把本次写入撤销，但外部系统已经收到消息，不能靠一个 atomic 把它收回来。

因此通知时机至少要放在成功提交之后。这样外部收到消息时，数据库结果才有可能稳定可见。

但时间顺序正确，还没解决投递一定成功。这两项保证需要分开讨论。

### 内层成功，还要等待外层结果

默认嵌套 atomic 通常创建保存点。内层成功只是通过这一段，外层随后失败，整体仍会回滚。

下面代码需要已经配置 Django 数据库，但没有真实业务表也能观察回调时机。

#### Python

```python
from django.db import transaction

events = []
with transaction.atomic():
    transaction.on_commit(lambda: events.append("outer"))
    with transaction.atomic():
        transaction.on_commit(lambda: events.append("inner"))
    assert events == []
assert events == ["outer", "inner"]
```

两个回调都等外层提交后执行，按注册顺序运行。如果保存点回滚，从该保存点以来注册的相应回调会被丢弃；更外层已有回调可以保留，取决于外层最终是否提交。

需要捕获数据库错误时，也应注意事务何时恢复可用，通常在相应 atomic 块外处理，别在已经出错的块里继续查询。

![内层结束，回调仍等外层](https://note.lgdsunday.club/img/Q630/02-nested-v2.webp)

### 回调失败，不会把提交拉回来

默认 robust=False 时，一个回调异常可能阻止后续回调继续执行。但数据已经提交，不能把回调报错解释成数据库也自动回滚。

robust=True 可以允许后续回调在规定的异常处理范围内继续运行，仍不提供自动重试、持久化或跨系统事务。这个选项解决的是回调执行影响，不是可靠送达。

在没有活跃事务的默认自动提交环境里，on\_commit 会立即执行。它不是无条件延迟任务工具，也不是换个名字的后台队列。

![回调失败，数据库已提交](https://note.lgdsunday.club/img/Q630/03-failure-v2.webp)

### 可靠通知，要留一份可重试的记录

若通知丢失会造成业务错误，可以将业务记录与待发送事件写入同一数据库事务。后台读取事件，发送成功后更新状态，失败重试；消费者也需要处理重复。

提交以后立即通知后台，仍可能只是加快处理的提示。可靠性来自那份持久记录，即使提示丢了，后台也能再次扫描，而不是只靠进程内的函数列表。相关 Outbox 设计可结合 Q113 阅读，本题不重新展开整套消息系统。

Django 是 Python 框架，TS 项目应使用实际 ORM 的事务和提交后机制，不能把 on\_commit 直接翻译成不存在的官方 API。测试可用真实临时数据库验证提交和回滚；Django TestCase 外层事务等测试方式也会影响回调实际执行，需要选对测试方式。

依据：[Django atomic、保存点与 on\_commit](https://docs.djangoproject.com/en/5.2/topics/db/transactions/)、[TestCase 回调捕获](https://docs.djangoproject.com/en/5.2/topics/testing/tools/#django.test.TestCase.captureOnCommitCallbacks)。

![通知可靠，靠可重新找到的事件](https://note.lgdsunday.club/img/Q630/04-durable.webp)

## 面试官继续追问

### on\_commit 失败，数据也会回滚吗？

回调执行时数据已经提交，失败不会撤销该提交。

### 没开 atomic 也会延迟执行吗？

默认自动提交且没有活跃事务时通常立即执行，不能当后台任务工具。

### 发送可靠是不是只要 robust=True？

不是，仍需要持久记录、重试与幂等。robust 主要改变回调异常对后续回调的影响。

## 面试速记卡

> - 外部动作不随数据库事务自动回滚。
> - 内层保存点成功不等于外层提交。
> - on\_commit 在相关成功提交后执行，回滚丢弃回调。
> - 回调失败不能撤销已提交数据。
> - 执行时机与可靠投递是不同保证。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
