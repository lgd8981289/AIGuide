# MySQL 的 INNER JOIN 和 LEFT JOIN 有什么区别？条件放 ON 还是 WHERE？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/database/q179-mysql-join/) · [题库目录](../../README.md)

<!-- 以下对话为教学模拟，非真实面经。 -->

🧑‍💻 面试官：LEFT JOIN 就是保留左表所有记录，对吧？

🙋‍♂️ 我：对，右表找不到就补 NULL。

🧑‍💻 面试官：那 WHERE 里写右表 status = 'active'，找不到的左表记录还在吗？

🙋‍♂️ 我：应该也在，因为我用了 LEFT JOIN。

🧑‍💻 面试官：NULL 等于 active 吗？这条筛选到底在哪一步把记录排除了？

> JOIN 先决定怎么配对，WHERE 再决定哪些结果留下。LEFT JOIN 能补 NULL，但挡不住后续条件把这行过滤掉。

## 面试速答（60 秒版）

INNER JOIN 只保留满足连接条件的配对结果。LEFT JOIN 除了保留配对结果，还会给没有匹配右侧记录的左侧记录补上一份右侧 NULL。

两者都不是简单地每个左表记录只出一行。右侧有多条匹配时，一条左记录也可能产生多行。

条件放 ON 还是 WHERE，要看它属于配对规则还是最终筛选。LEFT JOIN 的 ON 里限制右表有效状态，可以保留没有有效记录的左侧对象；放到 WHERE 里比较右表状态，NULL 补出的行通常就被排除了。

我会先用少量数据验证结果，再看索引与执行计划。语义正确以后才谈优化，不能只背“小表驱动大表”。

![有效状态放 ON 保留全部用户，放 WHERE 会过滤右侧 NULL 行](https://note.lgdsunday.club/img/Q179/00-60s-overview.webp)

## 知识点详解：ON 和 WHERE 为什么会改出不同结果

### 先用三位用户看懂连接结果

假设用户表有小张、小李、小王。登录表里，小张有两次有效登录，小李只有一次无效登录，小王没有登录记录。连接条件是用户 ID 相同。

INNER JOIN 会找到三组配对：小张两组，小李一组；小王没有对应项，不产生结果。LEFT JOIN 在这三组之外，还给小王补一行，右侧登录字段为 NULL。

所以 JOIN 的基本单位是满足条件的配对。不能因为用户表有三条，就认定结果最多三条。

### 想保留全部用户，就把有效状态放进配对规则

如果需求是“列出所有用户，并附上有效登录”，可以这样写：

```sql
SELECT u.id, l.id AS login_id
FROM users AS u
LEFT JOIN logins AS l
  ON l.user_id = u.id AND l.status = 'active';
```

小张产生两行；小李的无效登录不参与配对，于是得到右侧 NULL；小王也得到 NULL。这是保留用户、只匹配有效登录。

如果把状态条件移到 `WHERE l.status = 'active'`，小李和小王补出的 NULL 行都无法通过条件，最后只剩小张的两行。并不是 LEFT JOIN 失效，而是后续过滤改了结果。

### NULL 比较，是这里最容易漏掉的一步

SQL 中 `NULL = 'active'` 不为真，而是未知。WHERE 只保留条件为真的行，所以补出的记录被排除。

有时有人补上 `OR l.id IS NULL`，以为等同于把条件放 ON。仍要检查原始配对：小李已有一条无效登录，它不是 NULL 补行，因此依然可能被过滤。这个例子说明，改 SQL 要按数据走一遍，而不是凭关键词判断。

如果只是找“没有有效登录的人”，可以用对应的 NOT EXISTS，或先正确限定 ON，再判断右侧非空主键是否为 NULL。

### 先保证语义，再讨论连接算法

数据库优化器会在满足语义的前提下选择访问顺序和连接算法。MySQL 8.4 可以使用 Hash Join 等方式，不能套用所有 JOIN 都是旧版嵌套循环的说法。

没有匹配项也要保留的 LEFT JOIN，会约束部分优化选择；某些排除 NULL 的 WHERE 条件，又可能让它被转换为内连接。

性能分析要看筛选后的规模、连接列索引、估算与实际行数、重复配对量。只说“LEFT JOIN 比 INNER JOIN 慢”并没有说明这个查询的问题。

本题机制参考：[外连接优化](https://dev.mysql.com/doc/refman/8.4/en/outer-join-optimization.html)、[外连接简化](https://dev.mysql.com/doc/refman/8.4/en/outer-join-simplification.html)、[Hash Join](https://dev.mysql.com/doc/refman/8.4/en/hash-joins.html)。

![小张匹配两条登录，因此连接结果产生两行](https://note.lgdsunday.club/img/Q179/01-detail.webp)

## 面试官继续追问

### LEFT JOIN 结果重复，是不是数据库出错了？

先看右侧是否一对多。两次登录自然会产生两组配对；如果只要最新一条，要先定义并实现这个规则，不能盲目 DISTINCT。

### ON 和 WHERE 在 INNER JOIN 里也一定不同吗？

简单内连接中，很多确定性过滤条件移动后结果可以等价；本文的陷阱主要是外连接补 NULL 与后置过滤，不能推广成所有移动都改结果。

### 如何统计包括零次登录的用户？

保留用户的 LEFT JOIN 后，按用户分组并计数右侧非空登录主键。COUNT(\*) 会把 NULL 补出的那行也计进去。

## 面试速记卡

> - INNER JOIN：留下匹配的配对。
> - LEFT JOIN：无匹配的左记录补右侧 NULL。
> - ON：配对规则；WHERE：结果筛选。
> - 一对多：一条左记录可能产生多行。
> - 优化：先验证结果，再看真实执行计划。

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
