# SQL 注入是什么？为什么参数化查询能防注入，拼接排序字段却仍有风险？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q232-sql-injection-parameterized/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：怎么防 SQL 注入？

🙋‍♂️ 我：使用参数化查询，不把用户输入直接拼进 SQL。

🧑‍💻 面试官：用户名可以绑定参数，那 ORDER BY 后面的列名也能直接绑定吗？

🙋‍♂️ 我：不一定，参数通常表示值，不是 SQL 标识符。

🧑‍💻 面试官：如果已经用了 ORM，用户又能自己传排序表达式，是不是就没有风险了？

> 防注入要守住「结构与数据」的边界。值参数不能替你校验整段 SQL，也不能自动完成鉴权。

## 面试速答（60 秒版）

SQL 注入发生在应用把不可信输入拼成 SQL 的一部分，导致输入改变了查询结构，而不只是作为普通数据被处理。

参数化查询让 SQL 模板和参数值分开交给数据库或驱动，参数按值处理，不会因为里面出现引号、OR 等内容，就直接成为额外的 SQL 语法。

但列名、表名、排序方向等结构位置，通常不能用普通值参数替代。动态排序应该把外部选项映射到代码里固定的列名和方向，拒绝未知选项。

同时还要有数据访问权限和最小数据库权限。参数化查询解决注入，不保证当前用户有权读取参数指定的记录；使用 ORM 也不代表任意 raw SQL 都安全。

![SQL 结构与参数值分开](https://note.lgdsunday.club/img/Q232/01-answer-overview.webp)

## 知识点详解：同一段输入，究竟是文本还是指令？

### 直接拼接，让输入进入了 SQL 的语法位置

假设登录查询把用户名直接拼成单引号之间的文本。

用户输入一旦包含结束引号和后续表达式，就可能让数据库解析出和开发者预期不同的条件。错误不在于数据库“不认识坏人”，而在于应用给了输入改变语法结构的机会。

所以靠删掉几个关键词，既可能误伤正常文本，也不能覆盖所有表达形式。防御应从查询构造方式开始，而不是把黑名单越写越长。

下面不连接真实生产数据库，使用一个查询用户资料的例子说明安全边界。

### 参数化把用户名留在“值”这一侧

模板规定查询哪张表、用哪一列比较。用户名则通过独立参数传入。就算用户名里包含像 SQL 的文字，也应该作为用户名内容处理。

具体占位符由驱动决定。PostgreSQL 的 node-postgres 使用 $1；Python sqlite3 可以使用问号。不能跨驱动复制同一种占位符，假装所有数据库都一样。

#### TypeScript（PostgreSQL，node-postgres）

```ts
type QueryClient = {
  query: (sql: string, values: unknown[]) => Promise<unknown>
}

export async function findUser(db: QueryClient, name: string) {
  return db.query(
    'SELECT id, name FROM users WHERE name = $1',
    [name]
  )
}
```

#### Python（SQLite，标准库 sqlite3）

```python
import sqlite3

def find_user(db: sqlite3.Connection, name: str):
    return db.execute(
        "SELECT id, name FROM users WHERE name = ?",
        (name,)
    ).fetchall()
```

两份示例表达相同的结构/值分离，但数据库不同。Python 版本不是 PostgreSQL 驱动代码的机械翻译，测试结果也不能冒充 PostgreSQL 集成结果。

![输入是数据，不是新增条件](https://note.lgdsunday.club/img/Q232/02-detail-1.webp)

### 为什么排序字段不能照着用户名绑定？

ORDER BY name 的 name，是查询结构里的列标识符。把一个普通参数值传进去，不会普遍把它解释成“这列的名称”。

如果用户选择按姓名或创建时间排序，可以建立固定映射：name 对应代码里的 name 列，created 对应 created\_at 列。排序方向也只接受明确的 asc、desc 选项。

外部值先变成允许的选项，最终 SQL 片段由代码中的可信常量提供。未知选项直接拒绝，不回退成“那就把用户原文拼进去”。

[OWASP](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)也把无法直接绑定的结构位置与允许列表验证分开说明。

![排序列名：只能走允许的映射](https://note.lgdsunday.club/img/Q232/03-detail-2.webp)

### 参数化以后，还有哪几条边界没有解决？

查询 id 为 42 的记录，仍要判断当前用户能不能看这条记录。参数值完全安全，不代表权限正确。

数据库账号也不应该因为一个只读接口，就拥有删表和任意写入权限。最小权限可以缩小后果，但不能替代查询本身的正确构造。

日志同样要注意。为了排查问题保存参数时，要处理密码、令牌和个人信息，不能在防注入之后又把敏感输入完整打印出来。

### 怎样验证，才不是只证明“正常用户名能查到”？

在隔离测试库中，加入含引号的正常姓名，以及看起来像 SQL 的字符串。查询应该按原始姓名匹配，不扩大到其他记录。

再检查代码里的动态 SQL：排序、字段列表、表名、raw 查询和拼接条件。只检查 WHERE 中一个参数，不能代表所有路径都安全。

安全测试应在授权的测试环境进行，不拿陌生线上接口试攻击。

## 面试官继续追问

### 预编译和参数化是一回事吗？

经常相关，但不能只看名字。不同驱动可能在客户端或服务端处理，关键是参数是否按数据安全绑定。不要把“先 prepare 一次”当成唯一的防御原理。

### ORM 就不用关心 SQL 注入了吗？

仍要检查 raw SQL 和动态结构。ORM 提供安全参数 API，不意味着任何字符串拼接都安全。

### 用参数化，可以防越权吗？

不能。它保证输入不改变 SQL 结构，权限条件仍由应用和数据库策略明确落实。

## 面试速记卡

> - 根因：不可信输入获得了改变 SQL 结构的机会。
> - 参数化：固定模板与参数值分开，不让值冒充语法。
> - 标识符：动态列名、表名和方向用可信固定映射。
> - ORM：安全取决于实际 API 用法，raw 拼接仍要检查。
> - 其他边界：鉴权、最小权限与敏感日志另行处理。

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
