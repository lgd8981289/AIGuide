# MyBatis 的 Mapper 接口为什么不需要实现类？SQL 是怎样被执行的？

[京东后端面试真题](../companies/jd-backend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q473-mybatis-mapper-proxy-execution/) · [题库目录](../../README.md)

*以下对话为教学模拟，不是真实面经。*

🧑‍💻 面试官：MyBatis 的 Mapper 接口没有实现类，为什么还能调用？

🙋‍♂️ 我：它会自动帮我们生成实现。

🧑‍💻 面试官：生成的是业务代码吗？接口方法又怎样找到对应 SQL？

🙋‍♂️ 我：需要通过代理和映射信息。

🧑‍💻 面试官：那数据库执行结果怎样变成方法返回的对象？

> Mapper 不需要手写实现，是因为代理把方法调用接到了已经注册的 SQL 执行链上。

## 面试速答（60 秒版）

MyBatis 会为 Mapper 接口创建代理。调用接口方法时，代理根据接口与方法信息，找到对应的映射语句，再交给 SqlSession 和 Executor 等组件执行。

映射语句来自 XML、注解等配置。正常情况下，XML 的 namespace 对应接口全限定名，语句 id 对应方法名。

之后，MyBatis 处理参数、通过 JDBC 执行 SQL，并把结果按照映射规则转换为返回值。所以不是接口自己访问数据库，也不是自动生成了一份完整业务实现类。

如果使用 MyBatis-Spring，SqlSession 的获取和事务参与还会由相应集成组件管理。排查问题时，我会沿着代理、映射、参数、执行和结果映射逐段检查。

![速答总览：Mapper 代理把接口方法调用连接到已注册 SQL 与完整执行、结果映射链路。](https://note.lgdsunday.club/img/Q473/01-overview.webp)

## 知识点详解：一次 Mapper 方法调用，怎样到达数据库

### 首先拿到的对象，是接口代理

咱们假设存在一个 OrderMapper 接口，里面声明按 ID 查询订单的方法。应用获得的 Mapper 对象不是这个接口本身，而是能够实现该接口调用入口的代理。

当方法被调用时，代理接收方法信息和参数，再交给 MyBatis 的处理逻辑。[官方 MapperProxy 源码](https://github.com/mybatis/mybatis-3/blob/master/src/main/java/org/apache/ibatis/binding/MapperProxy.java)能够直接看到调用委托与方法缓存等逻辑。

这里说“实现接口”，是代理对象在调用层满足接口，不是 MyBatis 根据方法名自动猜出所有业务 SQL。没有映射、映射不匹配或配置错误，调用仍然会失败。

### 接口方法，要找到明确的映射语句

对于常见 XML 映射，接口全限定名与方法名一起构成查找映射的重要依据。namespace 和语句 id 对不上，就可能出现找不到绑定语句的问题。

因此，不能随意在同一个 Mapper 中用 Java 方法重载来期待按不同参数自动找到不同 XML id。XML id 的识别规则并不是 Java 的完整重载签名。

[MyBatis Java API 文档](https://mybatis.org/mybatis-3/java-api.html)介绍了 Mapper 接口与 SqlSession 使用方式。具体还包括注解映射、默认方法等边界，不能把所有接口方法都说成“必然执行一条同名 SQL”。

![Mapper 方法与 SQL 定义必须明确匹配](https://note.lgdsunday.club/img/Q473/02-mapping-identity.webp)

图以 XML 映射为例；注解等方式也可以注册映射语句。

### 参数处理和 SQL 执行，是后面的工作

找到 MappedStatement 以后，MyBatis 还需要根据参数生成实际 SQL 信息，处理参数绑定，再通过执行组件与 JDBC 访问数据库。

咱们的查询条件是订单 ID，这个值应通过参数绑定进入 SQL，而不是直接拼成任意字符串。动态 SQL 中不同占位方式有不同安全影响，不能因为使用了 Mapper 就认为 SQL 注入问题已经消失。

执行器还涉及缓存和不同执行方式。它不是每次都机械地发送完全相同的数据库请求；具体行为受到会话、事务和配置影响。不过，本题重点是执行链，不展开重新讲一遍缓存专题。

### 返回一行记录，还不等于返回业务对象

数据库给出结果后，MyBatis 根据结果映射，把列值转换成对象字段或其他返回形式。

如果方法要求一个订单对象，而列名与属性不匹配，就可能出现字段为空或映射错误。是否使用别名、自动映射或 resultMap，要看实际配置。

因此，一次调用可以按这条主线理解：

```text
Mapper 代理 → 方法与 SQL 映射 → 参数处理
→ Executor / JDBC → 结果映射 → 方法返回值
```

### Spring 集成，增加的是会话与事务管理

在 Spring 项目中，通常不是每次手动打开和关闭 SqlSession。MyBatis-Spring 的相关组件参与会话生命周期和 Spring 事务管理。

[MyBatis-Spring 的 SqlSession 说明](https://mybatis.org/spring/sqlsession.html)解释了这种集成。事务边界仍需要正确配置；拿到代理并不证明多个数据库操作已经处在同一业务事务里。

这也是为什么“Mapper 就是一个接口”不能解释全部运行行为。接口只是入口，后面还有明确的映射和资源管理链路。

## 面试官继续追问

### 方法名写对了，为什么还是提示找不到语句？

还要检查 namespace、映射文件是否加载、扫描配置及实际接口全限定名。只看方法名不足以确定绑定成功。

### 能不能在 Mapper 默认方法里写逻辑？

可以存在默认方法，但要按框架支持和版本核对。默认方法与普通映射方法的处理不同，不应一概描述成 SQL 查询。

### 为什么本题不提供 TS 和 Python 版本？

MyBatis 是 Java 框架，没有同一套官方 TS、Python API。机械翻译会把框架机制写错，所以这里用执行链说明，不伪造对应实现。

## 面试速记卡

> - Mapper 对象：接口代理，不是接口自己执行 SQL。
> - 映射入口：接口与方法信息定位已注册语句。
> - 执行链路：映射、参数、执行器、JDBC、结果转换。
> - Spring 集成：额外管理 SqlSession 和事务参与。
> - 排查方法：逐段检查，不把所有错误归因于代理。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **京东 · Java后台 · 校招**：MyBatis 怎样将 XML 映射到 Mapper 方法？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353155278348689408)；原帖编辑于 2019-08-23（历史校招面经）。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
