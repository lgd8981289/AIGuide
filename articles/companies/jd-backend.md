# 京东后端面试真题及答案 · Sunday面试指南

[全部公司真题](./README.md) · [在线阅读](https://note.lgdsunday.club/companies/jd/backend/)

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

## AI应用工程面试题

- [Redis 和数据库如何保持一致？为什么更新数据库后删缓存，仍然可能读到旧数据？](../engineering/q074-cache-database-consistency.md)
  Redis 和数据库使用 Cache-Aside 时，通常先读缓存，未命中再查数据库并回填；修改数据时，先提交数据库更新，再删除对应缓存。但是，这个顺序不能保证每个并发请求都读到最新值。

## 后端面试题

- [Spring AOP 是什么？JDK 动态代理和 CGLIB 有什么区别？](../backend/q161-spring-aop.md)
  Spring AOP 把日志、鉴权等横切逻辑放到业务方法之外，通常通过代理在匹配的方法调用前后执行增强。JDK 动态代理基于接口，调用方通过代理暴露的接口访问；

## 数据库与缓存面试题

- [Redis 为什么快？“单线程”与多线程 I/O 应该怎样理解？](../database/q095-redis-single-thread-model.md)
  Redis 快，是多个因素共同作用。常见数据操作主要访问内存，键查找和不同数据类型采用相应结构，网络事件处理也避免为每个连接都创建一个执行线程。“单线程”通常指常见命令的主要执行路径由主线程串行处理，不是说整个进程没有其他线程或子进程。
- [MySQL 事务的四种隔离级别是什么？脏读、不可重复读和幻读有什么区别？](../database/q216-mysql-isolation-levels.md)
  事务隔离级别规定的是，多个事务同时读写时，一个事务可以看到其他事务的哪些变化。读未提交可能读到别人还没提交的数据；读已提交只读取已提交的数据，但同一事务里，两次查询可能看到不同结果。可重复读进一步保证重复读取的稳定性；
- [Redis 常用数据类型有哪些？String、Hash、List、Set、ZSet 应该怎么选？](../database/q217-redis-data-types.md)
  Redis 常见的基础类型包括 String、Hash、List、Set 和 ZSet，但 Redis 的类型并不只有这五种。String 适合保存一个完整值，例如缓存 JSON，或者配合自增命令做计数。

## 计算机基础面试题

- [select、poll、epoll 有什么区别？I/O 多路复用到底在复用什么？](../cs-basics/q197-io-multiplexing.md)
  select、poll 和 epoll 都能等待多个文件描述符的 I/O 状态。select 使用集合，常见 glibc fd_set 有大小限制；poll 使用描述符数组，没有同样的固定集合限制，但仍要处理扫描和传入的集合。

