# Java 序列化是什么？Serializable、transient 和 serialVersionUID 有什么作用？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q350-java-serialization-compatibility/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：Serializable、transient 和 serialVersionUID 各做什么？

🙋‍♂️ 我：Serializable 表示对象可以序列化，transient 排除字段，UID 用来控制版本。

🧑‍💻 面试官：把 UID 固定为 1，以后随便改类，都能兼容旧数据吗？

🙋‍♂️ 我：不能，还要看字段和类结构变化。

🧑‍💻 面试官：如果序列化的是缓存对象，里面有数据库连接和密码呢？恢复出来的对象还安全吗？

> 序列化保存的是一份状态表达，不是把活着的运行环境一起打包。兼容和安全，都不能只靠一个 UID。

## 面试速答（60 秒版）

Java 原生序列化可以把对象状态转换成字节流，再从字节流恢复对象。Serializable 是标记接口，默认序列化会沿对象引用处理可序列化的对象图。

transient 字段通常不参加默认序列化，静态字段也不属于对象实例状态。但自定义序列化代码仍可能主动写入相关信息，所以 transient 不是加密措施。

serialVersionUID 用于检查序列化类的版本身份。显式设置可以避免默认计算受到类定义变化影响，但固定 UID 不代表所有结构变更都兼容。

实际项目中，我会明确需要保存的数据，而不是直接保存带连接和线程的运行对象。对于不可信输入，不直接开放 Java 原生反序列化；如确实使用，需要限制允许的类型和对象图，并认真评估替代格式。

![保存状态，不是保存运行环境](https://note.lgdsunday.club/img/Q350/01-overview.webp)

*图：保存状态，不是保存运行环境。*

## 知识点详解：保存对象状态，不等于恢复整个系统

### Serializable 保存的范围是什么？

假设一个缓存对象包含业务配置、加载时间和数据库连接。业务配置可以表达为数据；数据库连接则依赖外部服务、会话和运行时资源。

默认序列化不是只处理最外层几个字段，它会沿可序列化引用处理对象图。如果某个需要保存的对象不满足序列化条件，过程可能抛出 NotSerializableException。

共享引用和循环结构也会由流中的引用机制处理，不应该简单理解为无限递归复制每个字段。定义与约束可核对 [Serializable API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/io/Serializable.html)。

### transient 排除字段，却不会保护所有秘密

默认序列化通常不保存 transient 实例字段。恢复后，这些字段需要按具体反序列化方式重新建立，不能假设数据库连接会自动重新连上。

静态字段属于类，不属于某个对象的实例状态，因此也不是默认对象状态的一部分。

但是，自定义 writeObject 等逻辑可以主动写出数据。即使字段标记了 transient，如果代码又把它写进流，仍然会泄露。因此，秘密数据应从保存模型中明确剔除，不能把修饰符当成安全边界。

![默认序列化沿引用处理对象图](https://note.lgdsunday.club/img/Q350/02-graph.webp)

*图：默认序列化沿引用处理对象图。*

### UID 相同，只是兼容检查的一部分

反序列化时，流中的版本身份与本地类不匹配，可能出现 InvalidClassException。明确写 UID，能避免某些不想改变版本身份的源码修改导致默认值变化。

但 UID 相同，不会自动解决字段类型冲突、继承结构变化或语义变化。比如旧字段存的是“秒”，新版本解释为“毫秒”，字节能够读取，也不代表业务正确。

新增字段、删除字段和类型变化是否兼容，应根据具体规则判断，并拿实际旧版本数据做回放测试。版本兼容细节见 [序列化版本规范](https://docs.oracle.com/en/java/javase/25/docs/specs/serialization/version.html)。

![UID 相同，不代表语义兼容](https://note.lgdsunday.club/img/Q350/03-version.webp)

*图：UID 相同，不代表语义兼容。*

### 反序列化为什么需要特别防护？

Java 原生反序列化不仅是读几个字符串，还可能创建对象图并执行相关恢复逻辑。不可信流中的类型和结构，可能造成危险行为或资源耗尽。

如果确实需要使用，应限制允许类型、深度、引用数量和数据量，并按 [Java 序列化过滤文档](https://docs.oracle.com/en/java/javase/25/core/serialization-filtering1.html) 设计过滤。过滤是防护措施，不是“从此所有输入都安全”的承诺。

回到缓存场景，更稳妥的是保存明确的数据模型，恢复后通过正常生命周期重建连接等资源。跨服务或长期保存的数据，还应评估 schema 明确、易演进的格式。

本题是 Java 原生序列化机制，不把 TypeScript JSON 或 Python pickle 写成同等替代示例。它们在类型、安全和恢复行为上各不相同。

## 面试官继续追问

### 反序列化一定调用对象原来的构造器吗？

普通 Serializable 对象的恢复，不等同于正常 new。非可序列化父类等情况有专门规则；Externalizable、记录类等也有不同路径，不能一概而论。

### JSON 就完全安全吗？

不是。JSON 也需要限制输入大小、验证字段和控制类型绑定。只是不能把它与任意 Java 对象图的恢复机制混为一谈。

### 兼容测试应该怎么做？

保留真实旧版本样本，验证新版本读取后的字段、默认值和业务语义；如需双向兼容，也测试旧程序读取新数据，而不是只测试同版本写入读取。

## 面试速记卡

> - Serializable：标记原生对象序列化能力。
> - transient：排除默认实例字段，不是加密。
> - serialVersionUID：版本身份检查，不等于全面兼容。
> - 运行资源：连接和线程需要重新建立，不直接当数据保存。
> - 不可信输入：限制对象图，评估不使用原生反序列化。

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
