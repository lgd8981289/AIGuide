# Java 注解是怎么生效的？SOURCE、CLASS、RUNTIME 三种保留策略有什么区别？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q658-java-annotations-retention/) · [题库目录](../../README.md)

下面是一段模拟面试对话。

🧑‍💻 **面试官：** 写一个 @Check 注解，就能自动检查参数吗？

🙋‍♂️ **我：** 还需要框架或处理器读取它，再执行逻辑。

🧑‍💻 **面试官：** 如果注解只保留到源码，运行时反射还能读到吗？

🙋‍♂️ **我：** 不能，需要 RUNTIME 保留策略。

🧑‍💻 **面试官：** 那 CLASS 注解写进 class 文件，却不能直接通过普通反射读取，它有什么用？

> 注解要连着两个问题解释：元数据保留到哪一站，又由谁在那一站读取。

## 面试速答（60 秒版）

Java 注解主要是给程序元素附加元数据。它自己不会执行检查、事务或日志逻辑，需要编译器、注解处理器、字节码工具或运行时框架读取并处理。

SOURCE 保留在源码阶段，编译后不写入对应的 class 元数据；CLASS 写入 class 文件，但不作为普通运行时反射可见注解保留；RUNTIME 则会保留到运行时，允许相应反射 API 读取。没有显式指定 Retention 时，默认是 CLASS。

所以选择策略时，要先看处理者工作在哪个阶段。运行时框架要读，通常选 RUNTIME；编译期生成代码不必因此要求运行时可见。

还要区分保留策略、可标注位置和继承规则。它们分别回答“保留多久”“能写在哪”“某些查询能否沿类继承获得”，不能互相替代。

![注解留下来，由谁读取？](https://note.lgdsunday.club/img/Q658/01-java-annotations-retention.webp)

## 知识点详解：元数据留下来以后，还需要有人使用

### 给类贴标签，不会自动改变方法行为

假设我们定义一个注解，把它贴在方法上，希望调用前检查用户权限。

到这一步，方法并不会自动多出权限检查。我们还需要一个执行入口：可能是生成代码，也可能是代理、拦截器或框架在调用时读取注解。实际逻辑由这个处理者完成。

如果处理者根本没被注册，或者目标方法没有经过它负责的调用路径，就算注解写得完全正确，也不会产生预期效果。排查时先找“谁读它”，比反复检查拼写更有用。

### 三种策略，对应不同的可见阶段

| 策略      | class 文件中保留 | 普通运行时反射读取  | 常见处理位置     |
| ------- | ----------- | ---------- | ---------- |
| SOURCE  | 不保留对应注解     | 不能         | 编译器、源码处理器  |
| CLASS   | 保留          | 不能按运行时注解读取 | 字节码分析工具    |
| RUNTIME | 保留          | 可以按 API 读取 | 运行时框架与反射逻辑 |

表中的“可以读取”只说明数据存在且可通过对应方式访问，不等于框架一定会扫描它。[RetentionPolicy API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/annotation/RetentionPolicy.html)是三个阶段的定义依据。

CLASS 的价值也正在这里：处理者如果直接分析 class 文件，不一定要靠运行时反射。相反，SOURCE 注解也可能在编译期间引发代码生成，生成出来的普通代码仍然会留在产物里。不能因为注解本身消失，就认为它没有影响过编译结果。

![数据存在，和框架处理是两件事](https://note.lgdsunday.club/img/Q658/02-java-annotations-retention.webp)

### 默认 CLASS，为什么容易踩坑？

假设自定义注解没有写 Retention，运行时框架使用反射查找，却总是返回空。

这时别先怀疑框架漏扫。默认保留策略就是 CLASS，不满足普通反射读取运行时注解的条件。[Retention 元注解文档](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/annotation/Retention.html)明确了默认行为。

当然，补上 RUNTIME 也只是解决“读不读得到”。框架是否扫描到了正确的类、读取的是接口方法还是实现方法、代理是否改变入口，还需要继续检查。

### Target 和 Inherited，不是在延长保留时间

Target 控制注解可以用于哪些位置。允许写在类型上，并不代表能直接写在局部变量或任意类型使用位置。

Inherited 的范围也比较窄，它与类继承中某些注解查询有关，不会让接口注解自动传给所有实现，也不是方法注解的通用继承开关。[Inherited 官方说明](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/annotation/Inherited.html)有明确限制。

因此，自定义注解时最好把三个决定单独写清：处理阶段、允许位置、继承预期。不要把元注解堆上去，再等框架替我们决定语义。

![保留时间、位置和继承，别混起来](https://note.lgdsunday.club/img/Q658/03-java-annotations-retention.webp)

## 面试官继续追问

### 编译期处理一定要修改 AST 吗？

不一定。标准注解处理器可以读取程序元素和注解信息，生成新的源码或资源。具体工具若采用编译器内部 API，又是另一层实现，不能把它当成所有处理器的共同要求。[javax.annotation.processing 包](https://docs.oracle.com/en/java/javase/21/docs/api/java.compiler/javax/annotation/processing/package-summary.html)可作为入口。

### 怎样测试注解确实生效？

按处理阶段测试。编译期的检查诊断和生成产物，字节码阶段的检查 class 元数据，运行时的检查反射结果和实际行为。只断言注解“存在”，还不能证明权限、事务等逻辑已经执行。

## 面试速记卡

> - 注解：描述元数据，行为来自读取并处理它的代码。
> - SOURCE：源码阶段使用，注解不随 class 保留。
> - CLASS：写入 class，默认策略，不等于运行时反射可见。
> - RUNTIME：允许运行时按相应 API 读取，但不会自动触发业务逻辑。
> - 分开判断：保留阶段、标注位置和继承规则互不替代。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
