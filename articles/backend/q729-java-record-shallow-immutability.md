# Java record 是什么？为什么 final 字段不代表对象深度不可变？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q729-java-record-shallow-immutability/) · [题库目录](../../README.md)

*下面是一段用于讲解的模拟面试对话。*

🧑‍💻 **面试官：** 你为什么把这个查询结果写成 record？

🙋‍♂️ **我：** 它主要就是保存数据，record 能自动生成构造方法、访问方法和 equals、hashCode，代码会简单一些。

🧑‍💻 **面试官：** 如果里面放了一个 ArrayList，外面还能改这个列表吗？

🙋‍♂️ **我：** 字段是 final，应该不能重新赋值了。

🧑‍💻 **面试官：** 我没有重新赋值，只是调用 result.items().add(...)。那它还能叫不可变对象吗？

> record 固定的是组件字段的绑定关系。字段指向的对象能不能继续变化，还要往里面看一层。

## 面试速答（60 秒版）

`record` 是 Java 用来表达数据载体的一种类。开发者声明好组件以后，编译器会提供对应的构造方法、组件访问方法，以及 equals、hashCode 和 toString，record 类本身也不能再被继承。

但是，record 只能直接保证组件字段是 final，不能保证整个对象都深度不可变。比如组件里面放的是一个可变列表，字段虽然不能改成指向另一个列表，原列表的内容仍然可以变化。

因此，如果希望一个查询结果在创建以后保持稳定，需要在构造时做好防御性复制，并且检查里面的元素是不是也可变。`List.copyOf` 能得到一个不允许增删改的列表，但不会把每个元素都深拷贝一份。

record 适合表达值和数据快照，不能仅凭一个关键字就认定对象线程安全，也不能默认它适合所有实体模型。

![record 的 final 组件引用可变列表，固定绑定不代表列表内容冻结](https://note.lgdsunday.club/img/Q729/01-record-overview.webp)

## 知识点详解：record 到底替我们省了什么？

### 先把“数据载体”讲清楚

假设一个接口返回课程名称和标签。普通类需要自己写字段、构造方法、访问方法，还要考虑怎样比较两个结果是否相等。record 把这些约定和组件声明放在了一起。

组件叫 `name`，默认访问方法就是 `name()`，并不是 JavaBean 风格的 `getName()`。自动生成的相等判断会检查 record 类型和组件值，因此它更接近“这份数据是什么”，不只是“这是不是同一个实例”。[Java 21 record 文档](https://docs.oracle.com/en/java/javase/21/language/records.html)列出了这些生成规则。

record 仍然可以声明方法、静态字段，也可以实现接口。但是不能额外添加普通实例字段，不能继承另一个业务类。它不是把任意普通类缩短以后都能无损替换的语法糖。

### final 管的是引用，不是引用后面的所有内容

现在，咱们把标签放进一个 ArrayList，再把这个列表交给 record。创建以后有两条路可以改到列表。

第一条路是原来的变量。调用方还保留着列表引用，继续往里面添加标签，record 看见的内容也跟着变了。

第二条路是组件访问方法。默认访问方法直接返回组件保存的引用。如果它指向可变列表，拿到引用的人同样可能修改列表。

因此，光是不提供 setter 还不够。我们需要在接收数据时切断不希望共享的可变关系，在向外暴露数据时也别把修改入口重新递出去。

### 用复制把边界建立起来

下面是 Java 专属语法示例，按 Java 21 API 核对。TypeScript 的 readonly 和 Python 的冻结数据类并不等同于 record，这里不机械翻译成另一套 API。

```java
import java.util.List;

record CourseView(String name, List<String> tags) {
    CourseView {
        tags = List.copyOf(tags);
    }
}
```

这里使用的是紧凑构造方法。先把参数 `tags` 换成复制结果，编译器再把处理后的参数赋给组件字段。不需要手写 `this.tags = tags`。

复制之后，调用方修改原列表，不会给这份列表增加新元素；通过 `tags()` 得到的列表也不允许增删改。由于本例的元素是不可变的 String，这份结构才比较容易保持稳定。

![构造时复制列表以后，外部列表的结构变化不会影响 record](https://note.lgdsunday.club/img/Q729/02-defensive-copy.webp)

如果列表里装的是可变的 Course 对象呢？那么两个列表仍可能指向同一个 Course。修改 Course 的名称，复制后的列表照样能看到。要做稳定快照，还需要把元素转换为不可变值，或者按照业务需要复制元素。[List.copyOf 文档](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html#copyOf\(java.util.Collection\))说明了不可修改列表与元素可变性的区别。

![列表结构复制后，可变元素仍可能由原列表和复制列表共同引用](https://note.lgdsunday.club/img/Q729/03-shallow-elements.webp)

### 稳定数据，才有稳定的比较结果

如果 record 包含的列表内容发生变化，默认 equals、hashCode 的结果也可能随之变化。把这样的对象当作 HashMap 的键，插入以后再改内容，后续查询就可能出问题。

验证时可以专门检查三件事。创建 record 后修改原列表，观察 record 是否变化；尝试修改访问方法返回的列表；再放一个可变元素，验证容器复制是否真的覆盖了业务需要的快照边界。这里检查的是对象关系，不是只看字段有没有 final。

## 面试官继续追问

### 数组组件也会自动逐项比较吗？

不会自动变成业务期待的深比较。数组默认的 equals 仍然是引用相关语义。两个 record 各自保存内容相同但实例不同的数组，并不会因此自动按数组元素相等。需要明确自己的值语义，并一致地处理访问、equals 和 hashCode。

### record 能不能直接做 ORM 实体？

要看框架要求。部分持久化实体模型依赖无参构造、代理继承和可修改属性，record 的约束可能不匹配。用它作为查询投影、DTO，通常比直接把所有实体替换成 record 更容易讲清边界。

### 做完防御性复制就线程安全了吗？

还要检查元素、其他共享对象、构造过程和发布方式。record 不会替所有可达对象加锁，也不会替业务方法保证原子性。应该根据实际共享的数据和操作来判断。

## 面试速记卡

> - 定位：record 用组件声明表达数据载体，并生成常用成员。
> - final：限制字段重新绑定，不自动冻结被引用对象。
> - 复制：List.copyOf 保护列表结构，不负责深拷贝元素。
> - 值语义：可变组件可能让 equals、hashCode 的结果变化。
> - 使用边界：DTO 和查询快照适合考虑；线程安全与 ORM 适配另行判断。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
