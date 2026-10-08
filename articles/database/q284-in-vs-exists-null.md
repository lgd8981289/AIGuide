# MySQL 的 IN 和 EXISTS 有什么区别？为什么 NOT IN 遇到 NULL 容易出错？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/database/q284-in-vs-exists-null/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：查询下过单的用户，用 IN 还是 EXISTS？

🙋‍♂️ 我：小表驱动大表，外表大就用 IN，外表小就用 EXISTS。

🧑‍💻 面试官：优化器把它们转成相似计划以后，还能这样判断吗？

🙋‍♂️ 我：那应该看执行计划。

🧑‍💻 面试官：先别谈速度。查没下过单的用户，订单表 user\_id 有一个 NULL，NOT IN 还能得到你以为的结果吗？

> 先让查询回答对问题，再讨论快不快。尤其要检查 NULL：它可能把“不在集合里”变成“无法判断”。

## 面试速答（60 秒版）

`IN` 判断一个值是否出现在给定集合或子查询结果中；`EXISTS` 判断子查询有没有符合条件的行，通常可以通过相关条件描述“是否存在关联记录”。

两者不能直接套“谁一定更快”的口诀。MySQL 可以在满足条件时将它们优化为半连接等执行方式，具体表现要结合索引、数据分布和实际执行计划。

否定查询时尤其要注意 NULL。NOT IN 的结果集合里如果包含 NULL，对不匹配其他值的行也可能得到 UNKNOWN，WHERE 不会保留它。NOT EXISTS 则按有没有匹配行判断，不会因为一个不满足关联条件的 NULL 就产生同样的问题。

不过，是否保留外表本身为 NULL 的值也要明确。选择写法以前，先确定你真正需要的查询语义。

![Q284 面试速答总览：IN 检查订单中的 user\_id 集合；EXISTS 检查关联行；NULL 危险区不夸成所有比较都 UNKNOWN。](https://note.lgdsunday.club/img/Q284/01-overview-v2.webp)

## 知识点详解：从“下过单”和“没下过单”理解两种子查询

### 查询有订单的用户，两种写法分别在问什么？

咱们假设有 users 用户表和 orders 订单表。orders.user\_id 表示订单属于哪个用户。

SQL：

```sql
SELECT u.id FROM users u
WHERE u.id IN (SELECT o.user_id FROM orders o);

SELECT u.id FROM users u
WHERE EXISTS (
  SELECT 1 FROM orders o WHERE o.user_id = u.id
);
```

第一条问：这个用户 ID 是否出现在订单用户 ID 集合中？第二条问：是否存在一条属于这个用户的订单？

EXISTS 关心有没有行，不需要取出这行的所有字段。这里写 SELECT 1，是为了明确用途，不是因为数字 1 有特殊匹配能力。重复订单也不会让外层用户凭空出现多次，这正适合存在性查询。

### NOT IN 的坑，是 SQL 的三值逻辑

现在查询没下过单的用户。假设订单用户 ID 的结果是 1 和 NULL，而当前用户 ID 是 3。

`3 NOT IN (1, NULL)` 可以这样理解：3 不等于 1，并且 3 不等于 NULL。

前半句是 TRUE；后半句不是 TRUE，而是 UNKNOWN，因为 NULL 表示缺失或未知，普通比较不能确定相等或不等。两个条件合起来仍然是 UNKNOWN。

WHERE 只保留 TRUE，UNKNOWN 和 FALSE 都会被过滤。因此，用户 3 明明没有匹配订单，却也没有出现在结果中。

这不是 NULL 等于所有值，也不是 NOT IN 忽然失效，而是普通比较参与了三值逻辑。

![Q284 知识点示意：已逐项目视核对对象、标签、箭头与正文关系。](https://note.lgdsunday.club/img/Q284/02-null.webp)

### 改成 NOT EXISTS，还要检查关联条件

SQL：

```sql
SELECT u.id FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM orders o WHERE o.user_id = u.id
);
```

对于用户 3，订单里的 1 不能匹配，NULL 也不能让普通等号条件成立，所以子查询没有符合条件的行，NOT EXISTS 成立。

也可以在 NOT IN 子查询中排除 NULL，但要注意：如果外表比较值本身允许为 NULL，两种写法仍不一定完全等价。是否把“没有用户 ID”的记录纳入结果，需要另行定义。

MySQL 还有 NULL 安全相等运算符 `<=>`，但使用它会改变关联含义。不要为了消除 UNKNOWN，未经需求确认就把所有等号都替换掉。

### 性能要看实际计划，而不是按语法模拟执行

不能认为 IN 一定先完整生成大集合，EXISTS 一定对每个外表行重新执行完整子查询。优化器可能改写执行方式。

MySQL 8.4 在满足条件时，可以进行半连接或反连接转换；NULL、关联条件、聚合等因素都会影响可用优化。具体要看 [官方半连接与反连接说明](https://dev.mysql.com/doc/refman/8.4/en/semijoins-antijoins.html)。

实际选择时先保证结果正确，再用 EXPLAIN，必要时在安全测试环境使用 EXPLAIN ANALYZE，结合真实数据分布检查。它会执行查询，不能把所有分析命令都当成无成本操作。

![Q284 知识点示意：IN/EXISTS 都进入优化器；半连接、物化只是可能计划，需要 EXPLAIN，不承诺固定快慢。](https://note.lgdsunday.club/img/Q284/03-plan-v2.webp)

## 面试官继续追问

**NOT EXISTS 就永远更快吗？**

不是。它通常能更清楚地表达不存在匹配行，但性能仍取决于优化器、索引、条件与数据。语义优势不是固定性能排名。

**SELECT NULL 放在 EXISTS 里会怎样？**

只要子查询确实返回了行，EXISTS 就为真。它检查的是行存在，不是选择列表中的值是否为 NULL。

## 面试速记卡

> - IN：比较值是否在结果集合中。
> - EXISTS：检查子查询有没有满足条件的行。
> - NOT IN：子查询包含 NULL 时，否定判断可能成为 UNKNOWN。
> - WHERE：只保留 TRUE，不保留 UNKNOWN。
> - NOT EXISTS：先写清关联条件，再检查外表 NULL 的业务含义。
> - 性能：保证语义，再看实际计划，拒绝固定快慢口诀。

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
