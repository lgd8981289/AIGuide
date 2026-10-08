# Spring 的 @Autowired 和 @Resource 有什么区别？多个 Bean 时怎么选择？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q338-autowired-vs-resource/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：Spring 的 @Autowired 和 @Resource 有什么区别？

🙋‍♂️ 我：Autowired 按类型注入，Resource 按名称注入。

🧑‍💻 面试官：项目里有两个 StorageClient，Autowired 一定报错吗？

🙋‍♂️ 我：可以给其中一个标记 Primary。

🧑‍💻 面试官：如果上传服务必须使用 archiveClient，而其他服务默认使用 mainClient，你会怎么写？Resource 找不到同名 Bean 又会怎样？

> 面试官在问「依赖如何选出来」。按类型、按名称只是入口，多个候选时的选择规则才决定代码会注入谁。

## 面试速答（60 秒版）

@Autowired 主要按照类型寻找依赖。如果有多个同类型 Bean，就需要继续通过 Qualifier、Primary 等规则选择，不能只背“按类型”三个字。

@Resource 默认先按名称寻找。没有显式指定 name 时，通常使用字段名或属性名；默认名称找不到时，可以回退到类型匹配。但明确指定 name 后，就应该按这个名称取得依赖，而不是随意换成别的 Bean。

实际项目里，我更倾向使用构造器注入，让必要依赖在创建对象时就完整。需要指定实现时，把限定条件写清楚；Primary 适合表达全局默认，Qualifier 适合表达当前依赖的具体要求。

同时需要注意版本：现代 Spring 使用 jakarta.annotation.Resource，不要把旧 javax 包名和新版本混在一起。

![依赖注入，先找候选再做选择](https://note.lgdsunday.club/img/Q338/01-overview.webp)

*图：依赖注入，先找候选再做选择。*

## 知识点详解：同一个接口有多个实现，Spring 怎么选？

### 先看依赖类型，再看候选集合

假设上传服务依赖 StorageClient。容器里注册了 mainClient 和 archiveClient，它们都实现这个接口。

此时，类型只能说明“这两个都能使用”，不能说明“这个服务需要哪一个”。如果没有其他可以决定唯一候选的条件，注入就会出现歧义。

所以要把“找到候选”和“选定一个”分开理解。Autowired 不是从容器中随便找一个能用的 Bean，而是需要最后得到明确的依赖。

### Primary 是默认项，Qualifier 是当前要求

如果大部分服务都使用 mainClient，可以把它设为 Primary。对于单值依赖，容器会优先考虑这个主要候选。

但上传服务明确要求 archiveClient，那么应该在当前依赖上声明相应的 Qualifier。限定符先缩小匹配范围，不能理解成“Primary 永远压过 Qualifier”。

还要区分单值和集合依赖。注入 StorageClient 列表，往往是要获取符合条件的多个实现；Primary 并不意味着集合中只剩下那个 Bean。

| 业务要求         | 表达方式           |
| ------------ | -------------- |
| 所有服务默认用主存储   | 为主实现设置 Primary |
| 当前服务只用归档存储   | 在依赖上使用明确限定符    |
| 需要所有符合条件的实现  | 注入集合，再决定如何使用   |
| 就要指定名字的 Bean | 显式名称匹配         |

细节可以核对 [Autowired 文档](https://docs.spring.io/spring-framework/reference/core/beans/annotation-config/autowired.html) 和 [Qualifier 文档](https://docs.spring.io/spring-framework/reference/core/beans/annotation-config/autowired-qualifiers.html)。

### Resource 为什么不等于“永远只按名字”？

对默认 Resource 而言，字段名或属性名会成为默认的查找名称。如果这个名称没有匹配到 Bean，Spring 的常见单值依赖处理可以继续尝试类型匹配。

如果显式写了 name，意图就不同了：开发者已经要求这个名字对应的依赖。找不到时应当暴露配置问题，而不是悄悄换成其他实现。

因此，面试时不能只说 Resource 按名称，就结束回答。还要补上默认名称、显式名称和回退的区别。[Resource 文档](https://docs.spring.io/spring-framework/reference/core/beans/annotation-config/resource.html) 给出了对应处理规则。

![默认名称与显式名称，规则不同](https://note.lgdsunday.club/img/Q338/02-matching-v2.webp)

*图：默认名称与显式名称，规则不同。*

### 为什么优先考虑构造器注入？

对于必要依赖，构造器能直接表达“没有它就不能创建这个服务”。这样测试时也可以明确传入依赖，避免对象已经创建，字段却还没有注入。

现代 Spring 中，如果类只有一个构造器，通常不需要再额外加 Autowired。Resource 不适用于构造器参数，因此不应该为了坚持使用 Resource，把必要依赖都藏进字段。

本题的注解属于 Java/Spring，不存在同一套 TypeScript 或 Python 官方 API。为了对应代码语言而写出看似一样的装饰器，反而会让读者误解。

## 面试官继续追问

### 把变量名改成 Bean 名，就一定能选中吗？

名称可能参与某些候选消歧，但它还受到版本、参数名保留和其他匹配条件影响。明确的业务选择不宜依赖一次无意的变量重命名。重要依赖应直接写限定条件。

### 有 Qualifier，就等于按 Bean 名注入吗？

不完全是。Qualifier 表达候选的限定属性，Bean 名可以作为匹配手段，但它不是只能代表一个全局唯一名称。应按限定条件理解。

### 不指定实现，让容器报错是不是坏事？

不一定。新增第二个实现后立即暴露歧义，可能比悄悄注入错误实现更安全。关键是把业务选择补完整，而不是消除报错就算完成。

## 面试速记卡

> - Autowired：先按类型找候选，再解决唯一选择。
> - Primary：表达单值依赖的默认候选。
> - Qualifier：表达当前依赖的限定条件。
> - Resource：区分默认名称、类型回退和显式名称。
> - 必要依赖：优先通过构造器清楚地声明。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
