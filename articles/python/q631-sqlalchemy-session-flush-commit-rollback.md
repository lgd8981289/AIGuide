# SQLAlchemy 的 Session 是连接吗？flush、commit 和 rollback 有什么区别？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/python/q631-sqlalchemy-session-flush-commit-rollback/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：Session 是数据库连接吗？

🙋‍♂️ 我：它管理 ORM 对象与事务，使用连接但不等于一条裸连接。

🧑‍💻 面试官：add 一个对象后，数据就已经提交了吗？

🙋‍♂️ 我：add 先登记，flush 将变化写入当前事务，commit 才提交。

🧑‍💻 面试官：flush 唯一约束失败以后，数据库可能已经回滚了，为什么同一个 Session 还要求 rollback？

> 对象进入 Session、SQL 写入事务、事务提交，是三个不同阶段；失败后还要恢复会话状态。

## 面试速答（60 秒版）

SQLAlchemy Session 管理一组 ORM 对象的变化和事务工作，也维护身份映射。它需要时使用连接，不能简单当成连接或全局查询缓存。

add 把对象纳入管理；flush 把待处理变化发成 SQL，但仍在当前事务里；commit 会先处理需要的 flush，再提交。flush 成功以后仍然可以回滚，不能把它当作已持久提交。

查询等操作可能触发 autoflush，所以 SQL 不一定等到显式 flush 才发生。flush 失败后，同一个 Session 通常需要明确 rollback 才能恢复可用，或者让事务上下文管理退出与清理。

Session 是可变事务状态，不应该被多个请求、线程或异步任务共同随意使用。按请求或任务安排生命周期，验证正常提交、回滚与约束失败后的恢复。

![对象登记、SQL 写入、事务提交](https://note.lgdsunday.club/img/Q631/01-overview-v2.webp)

## 知识点详解：从对象变化，到数据库真正提交

### Session 管对象与工作，连接执行 SQL

假设服务新增一个用户。Session 记录对象处于新建、修改等状态，适当时把变化发送给数据库。这种组织方式常称为工作单元。

身份映射让同一个 Session 中同一数据库身份通常对应同一个对象实例。但它不是任意查询的全局缓存，Session 也不会替你保证其他事务的修改马上反映到现有对象里。

连接池负责连接复用，Session 负责本次对象和事务状态，两者职责不同。不能为了省连接，把一个 Session 做成所有请求共享的全局变量。

![会话用连接，但还管理对象状态](https://note.lgdsunday.club/img/Q631/02-identity-v2.webp)

### flush 写入事务，不等于 commit

下面是 SQLAlchemy 2.0 的独立 SQLite 示例。flush 后确认对象得到 ID，随后抛出异常，让事务上下文回滚。

#### Python

```python
from sqlalchemy import create_engine, select
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, Session

class Base(DeclarativeBase):
    pass
class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(unique=True)

engine = create_engine("sqlite://")
Base.metadata.create_all(engine)
try:
    with Session(engine) as session, session.begin():
        user = User(name="小周")
        session.add(user)
        session.flush()
        assert user.id is not None
        raise RuntimeError("教学回滚")
except RuntimeError:
    pass
with Session(engine) as session:
    assert session.scalars(select(User)).all() == []
```

得到 ID 说明 SQL 已经执行到相应阶段，不代表其他事务可见或已经永久提交。本例回滚以后，新会话没有这条记录。

采用正常退出的 begin 上下文会提交，异常退出会回滚；Session 上下文负责关闭会话。关闭与提交也不是同一操作。

### autoflush 会让查询成为写入触发点

Session 有待处理变化时，ORM 查询等操作可能触发 autoflush。因此看见错误发生在查询行，不代表问题一定来自查询 SQL，可能是此前新增对象在自动写入时违反约束。

no\_autoflush 可以在需要的范围抑制自动触发，但不是关掉所有 flush。commit 等关键边界仍会处理待提交变化，应按文档区分。

所以查失败过程时，记录待处理对象和实际 SQL，比只按显式 flush 的位置猜写入时间更可靠。

![写入错误，可能在查询时出现](https://note.lgdsunday.club/img/Q631/03-autoflush.webp)

### 失败以后，数据库与 Session 都要恢复

flush 失败可能已经导致底层事务回滚，但 Session 自己仍有失败状态。若继续使用同一会话，需要调用 rollback 完成相应恢复，不能在 except 中只打印异常就继续查。

也可以让 session.begin 的上下文处理异常退出，再使用新的清楚范围。不要吞掉异常，让调用方以为业务已经保存成功。

SQLAlchemy 是 Python 库，没有官方同名 TS Session API；其他 ORM 的 flush 与事务语义不能机械对译。测试需要覆盖约束失败、回滚后再次查询、提交后新会话读取及并发范围。AsyncSession 也应按任务独立安排，不当成所有协程共享的状态容器。

依据：[SQLAlchemy Session、flush 与失败恢复](https://docs.sqlalchemy.org/en/20/orm/session_basics.html)、[事务上下文](https://docs.sqlalchemy.org/en/20/orm/session_transaction.html)、[AsyncSession 并发边界](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html#using-asyncsession-with-concurrent-tasks)。

![恢复数据库，也要恢复会话](https://note.lgdsunday.club/img/Q631/04-recovery-v2.webp)

## 面试官继续追问

### 关闭 Session 就自动提交吗？

不能这样保证，关闭负责结束资源范围，提交需要明确事务成功路径。

### no\_autoflush 会让 commit 不写 SQL 吗？

不会，抑制特定自动触发与提交前处理变化是不同合同。

### flush 失败后直接再查为什么报错？

会话仍需相应 rollback 恢复，或退出失败事务范围后重新安排。

## 面试速记卡

> - Session 管对象、身份映射与事务工作。
> - add 登记变化，flush 发 SQL，commit 提交。
> - flush 成功仍可能回滚。
> - autoflush 让查询等操作也可能触发写入。
> - 失败后恢复会话，生命周期按请求或任务隔离。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
