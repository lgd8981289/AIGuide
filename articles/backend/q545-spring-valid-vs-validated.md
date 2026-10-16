# Spring 的 @Valid 和 @Validated 有什么区别？嵌套校验和分组校验怎么做？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q545-spring-valid-vs-validated/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：@Valid 和 @Validated 有什么区别？

🙋‍♂️ 我：@Valid 来自校验规范，@Validated 是 Spring 的注解，支持指定校验分组。

🧑‍💻 面试官：资料里嵌套地址对象，地址字段有约束，就会自动往里检查吗？

🙋‍♂️ 我：还需要让校验进入嵌套对象，@Valid 常用于级联。

🧑‍💻 面试官：如果新增必须填姓名、修改允许不传，你会直接复制两套 Controller 吗？

> 先写清约束，再选择分组与级联；入口注解只决定怎样进入校验，不代替业务规则。

## 面试速答（60 秒版）

`@Valid` 与 `@Validated` 都会出现在 Spring 校验场景里，但职责不能只概括成‘一个简单、一个高级’。

`@Valid` 来自 Bean Validation 规范，常用于让校验进入嵌套对象。`@Validated` 是 Spring 提供的注解，可以指定校验分组，也会用于相应的方法校验入口。

例如新增资料必须填姓名，修改可以只传变化字段，可以按实际合同设置分组或分别定义输入结构。嵌套地址则检查是否需要级联。最后还要核对 Controller 校验、方法校验和异常处理的路径；字段合法不代表用户有权限，也不保证数据库中没有重复记录。

![规则、分组、级联分别检查](https://note.lgdsunday.club/img/Q545/01-overview.webp)

## 知识点详解：一次输入校验，怎样进入正确的约束

### 先分清字段约束和校验入口

假设输入里有 name 和 address。name 上的非空约束，表示检查姓名时要满足相应规则；address 的内部字段也可以有各自约束。

但写了约束以后，还需要由实际请求处理或方法调用进入校验。Controller 参数、服务方法和手动 Validator 调用，都是不同入口。

因此，排查‘注解没生效’，先查校验从哪里开始，再查这个对象上的规则和当前分组，不要只增加更多注解。

### @Valid 让校验沿对象关系继续走

假设 address 是一个嵌套对象，它的 postcode 有格式限制。需要级联时，父对象的相应属性使用 @Valid，校验才会沿关系进入子对象。

子对象为空与子对象内容不合法也不同。是否允许 address 为 null，需要额外的非空约束或输入合同，级联本身不等于强制对象存在。

级联不是反复扫描所有字段，也不自动验证数据库记录。它按对象图及规范处理相应约束。

![嵌套对象，要明确进入校验](https://note.lgdsunday.club/img/Q545/02-cascade.webp)

### @Validated 的分组，表达这次检查哪些规则

新增资料和修改资料可以有不同要求。使用分组时，约束归入对应 group，入口通过 @Validated 等方式选择需要检查的组。

但分组不是完全省略设计输入结构的理由。如果两种请求字段和权限差异很大，分别定义请求结构可能更清楚。

没有指定组时的默认校验，与指定某个组后的规则集合也要核对。不能假设所有默认组约束总会被任意自定义分组一起执行。

![新增和修改，不一定检查同一组](https://note.lgdsunday.club/img/Q545/03-groups.webp)

### 方法校验路径，需要看 Spring 版本

Spring MVC 的方法级校验，与通过代理进入的方法校验要分开理解。当前文档说明 Spring 6.1 起有 MVC 内置支持，类级 @Validated 可能涉及另一条代理路径。

所以不要把‘所有 Controller 都必须类上加 @Validated’当作跨版本口诀。检查实际框架版本、参数约束位置以及异常类型，再设计统一错误返回。

输入格式通过后，权限、资源归属和并发唯一性仍由业务与数据库处理。比如重复用户名，不能只靠一次查询式字段校验保证没有并发插入。

依据：[Spring Bean Validation](https://docs.spring.io/spring-framework/reference/core/validation/beanvalidation.html)、[Spring MVC 校验](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-validation.html)。

![字段合法，权限还没证明](https://note.lgdsunday.club/img/Q545/04-boundaries.webp)

## 面试官继续追问

### @Valid 会自动拒绝 null 子对象吗？

级联和非空约束不同。需要子对象必须存在，就要在合同与约束中明确这一条件。

### 校验通过，就能直接修改别人的资料吗？

还要核对身份、资源归属和操作权限。字段检查不承担授权职责。

### 新增和修改字段差别很大，还适合用分组吗？

可以评估分别建请求结构，让接口合同更清楚。分组是工具，不是所有场景都应共用一个复杂 DTO。

## 面试速记卡

> - 约束：描述值应满足什么规则。
> - @Valid：常用于级联进入嵌套对象。
> - @Validated：选择分组及相应 Spring 校验入口。
> - 方法校验：核对版本与 MVC/代理路径。
> - 输入合法不等于已授权或并发安全。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
