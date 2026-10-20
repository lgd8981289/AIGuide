# Java 泛型的 extends 和 super 怎么选？PECS 为什么这样规定？

[字节开发面试真题](../companies/bytedance-development.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q731-java-generics-wildcards-pecs/) · [题库目录](../../README.md)

*下面是一段用于讲解的模拟面试对话。*

🧑‍💻 **面试官：** List<Integer> 能传给 List<Number> 参数吗？

🙋‍♂️ **我：** Integer 是 Number 的子类，所以应该可以。

🧑‍💻 **面试官：** 如果方法往里面放一个 Double，原来的整数列表怎么办？

🙋‍♂️ **我：** 那可以改成 List\<? extends Number>。

🧑‍💻 **面试官：** 改完以后，为什么反而连一个 Integer 都不能随便添加？

> 通配符里的问号代表“某个确定但当前不知道的类型”。能读什么、能写什么，都要在不知道它到底是谁的情况下保证安全。

## 面试速答（60 秒版）

Java 泛型默认是不变的，Integer 是 Number 的子类型，不代表 List<Integer> 就是 List<Number> 的子类型。否则，接收方可能往整数列表里放进一个 Double。

`? extends Number` 表示元素类型是 Number 的某种子类型。读取以后，可以安全地当成 Number；但是实际列表可能是 List<Integer>，也可能是 List<Double>，因此不能随便添加一个具体数字。

`? super Integer` 表示元素类型是 Integer 或它的某个父类型。往里面放 Integer 是安全的，但读出来只能统一保证为 Object，因为列表可能本来就存着其他类型的数据。

这就是 PECS 的意思。主要提供数据的参数考虑 extends，主要接收数据的参数考虑 super。如果同一个容器既要按精确类型读，也要写，通常就应该保留明确的类型参数，而不是硬套通配符。

![复制操作中，extends 源提供 T，super 目标接收 T](https://note.lgdsunday.club/img/Q731/01-pecs-overview.webp)

## 知识点详解：沿着一次复制理解 PECS

### 为什么子类关系不能直接搬到 List 上？

假设咱们有一份整数列表，里面只有 1、2、3。如果允许把它当成 List<Number>，一个本来只知道 Number 的方法就可以执行 add(3.14)。

添加动作对 List<Number> 看起来合法，但原调用方仍认为自己保存的是整数列表。等它读到 Double，再按 Integer 使用，类型承诺就被破坏了。

所以，Java 不会直接允许这种赋值。这里限制的不是“整数不能当数字”，而是“可以修改的泛型容器，不能这样扩大它允许接收的元素范围”。[Oracle 的泛型子类型说明](https://docs.oracle.com/javase/tutorial/java/generics/subtyping.html)解释了这种不变关系。

### extends 为什么适合读？

现在把参数写成 List\<? extends Number>。问号不是一会儿代表 Integer、一会儿代表 Double，而是代表当前这份列表中某个确定、但方法不知道具体名字的元素类型。

既然它一定是 Number 的某个子类型，读取出来就可以当作 Number，用来求和或者格式化。

但是，要添加 Integer 时，方法没有证据证明实际列表就是整数列表。它也可能来自调用方的 List<Double>。因此，编译器不能放行这个添加操作。

说成“extends 列表只读”也不完全准确。它仍可能允许 clear、remove 等操作，null 也有单独的类型规则。更准确的说法是，不能通过这个引用安全地添加任意非空的具体元素；这不是不可修改集合的承诺。

![extends Number 可以安全读取为 Number，但不能保证具体非空元素可写入](https://note.lgdsunday.club/img/Q731/02-extends.webp)

### super 为什么适合写？

List\<? super Integer> 可能是 List<Integer>、List<Number>，也可能是 List<Object>。不管实际是哪一种，Integer 都能安全地放进去。

但是，如果实际是 List<Object>，里面也可能原本就有一个字符串。读取第一个元素时，方法不能保证它一定是 Integer，更不能保证它是 Number，只能先当作 Object。

因此，super 并不是“比 extends 更灵活的读取方式”。它放宽了接收容器的选择，同时收窄了方法对读取结果能够作出的承诺。

![super Integer 可以接收整数，但原有元素读取通常只能保证 Object](https://note.lgdsunday.club/img/Q731/03-super.webp)

### 把生产与消费放在同一个方法里

以下是可放入类中的 Java 方法片段，展示泛型编译规则。不存在同一套 TS/Python 通配符 API，不做表面翻译。

```java
import java.util.List;

static <T> void appendAll(
        List<? extends T> source,
        List<? super T> target) {
    for (T item : source) {
        target.add(item);
    }
}
```

source 提供 T，target 接收 T。比如把 List<Integer> 追加到 List<Number>，类型关系就能表达清楚。这个例子要求源和目标不是会在迭代期间相互修改的同一份结构；泛型只检查类型安全，不负责消除容器别名问题。

这里也能理解，PECS 是从参数在当前操作中的角色出发，不是给某个集合贴永久标签。同一个列表，在求和方法中提供数据，在收集结果的方法中又可以接收数据。[通配符使用指南](https://docs.oracle.com/javase/tutorial/java/generics/wildcardGuidelines.html)正是按照输入、输出角色来组织建议的。

验证时应该同时准备“应该编译”和“应该拒绝”的例子。整数源复制到数字目标应该通过；向 extends Number 添加 Double 应该被拒绝；从 super Integer 直接读取为 Integer 也应该被拒绝。别为了消除报错，转成原始 List 或强制类型转换，把编译器的保护一起去掉。

## 面试官继续追问

### extends 为什么连 Integer 都不能加？

因为实际类型可能是 Double。编译器不知道问号对应哪一个类型，不能只根据本次传参碰巧是整数列表，就让方法定义对所有调用都失去安全性。

### 什么时候不用通配符？

当输入和返回值之间需要表达明确的同一种类型，或者方法既要读取、又要写入该精确类型时，使用命名的类型参数通常更清楚。不要把每个 T 都改成问号。

### 方法返回值也应该大量使用通配符吗？

通常要谨慎。返回通配符会把捕获类型的处理负担交给调用者。先看是否能够返回明确类型，只有需要表达这种不确定性时才保留它。

## 面试速记卡

> - 不变性：List<Integer> 不能直接当作 List<Number>。
> - extends：读取时能当上界，不能随便加入具体非空元素。
> - super：可以放入下界类型，读取通常只能保证 Object。
> - PECS：根据参数在当前操作中提供还是接收数据来判断。
> - 边界：类型安全不等于集合不可修改，也不解决别名与并发问题。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **字节跳动 · 客户端开发（Android 面试后调剂 iOS） · 校招**：Java 泛型的上界通配符与下界通配符有什么区别？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353155672483241984)；原帖编辑于 2019-10-11。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
