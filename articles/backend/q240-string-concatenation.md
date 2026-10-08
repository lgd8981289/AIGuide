# String、StringBuilder、StringBuffer 有什么区别？字符串拼接怎么选？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q240-string-concatenation/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：这三个类型怎么选？

🙋‍♂️ 我：String 不可变，StringBuilder 不安全，StringBuffer 线程安全。

🧑‍💻 面试官：每次请求都创建自己的一份 StringBuilder，多个请求同时运行，也不安全吗？

🙋‍♂️ 我：如果不共享同一个构建器，就不是同一份可变状态的竞争。

🧑‍💻 面试官：那大家共享一个 StringBuffer，连续 append 三次写一条记录，就能保证整条记录不被其他线程插进来吗？

> 不要只背“安全”和“不安全”。先看「谁在修改同一个对象」，再看需要原子的操作范围。

## 面试速答（60 秒版）

String 的字符内容创建后不再改变，适合表示已经确定的文本。变量可以指向新的 String，但原来那个字符串的内容没有因此被改写。

StringBuilder 是可变字符序列，适合在一个明确的使用范围里逐步构建文本，没有提供多线程共享修改的同步保证。普通方法内部独立创建的构建器，通常不用因为应用是多线程就换成 StringBuffer。

StringBuffer 也是可变字符序列，对必要的方法操作提供同步。不过，多次方法调用拼成的业务操作，不会因此自动成为一个整体原子动作。

因此，少量、清晰的字符串连接不必机械改写；循环中不断累加大量内容，可以考虑局部 StringBuilder。需要共享时，先考虑能否不共享，再根据完整操作范围安排同步，而不是看到线程就换一个类型。

![文本定稿，还是继续构建？](https://note.lgdsunday.club/img/Q240/01-overview.webp)

## 知识点详解：拼一条记录，到底改变了谁？

### String 不可变，不代表变量不能重新赋值

假设原来的文字是“姓名”，后来程序把变量更新为“姓名：Sunday”。

这次变量指向了另一个字符串结果。原来 String 的字符内容并没有在原对象里被修改。如果其他地方仍然引用原字符串，看到的还是原来的内容。

[Java String API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/String.html)描述的是字符串对象的不可变性，不是对所有引用它的变量实施 const 限制。

这也解释了为什么不可变文本方便共享。但共享引用如何发布、变量本身是否同时修改，是另外的问题，不能把 String 不可变推导成所有周边代码都线程安全。

![变量换了，旧字符串没变](https://note.lgdsunday.club/img/Q240/02-immutable.webp)

### StringBuilder 给逐步拼接准备了一段可修改空间

假设要输出很多条记录，每次追加一个编号、一段名字和一个换行。

StringBuilder 可以逐步往当前字符序列末尾添加内容，内部容量不足时再扩大，而不是每次都要求最终结果已经是一份独立不可变文本。[StringBuilder API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/StringBuilder.html)说明了可变序列和容量的职责。

这里要避免两个极端说法。

一是“所有加号都一定会创建同样数量的临时对象”。常量连接可以在编译阶段处理，动态连接的实现也会随编译器和 JDK 版本变化，不能只看源码里的加号数量就数对象。

二是“只要改成 StringBuilder 就一定快”。很少几次的连接，清晰写法可能已经足够；真正值得检查的是循环中反复把越来越长的旧结果重新拼成新结果。需要测量时，用代表性输入，而不是一次运行的计时值下结论。

### 应用多线程，不等于构建器必须被多线程共享

假设两个请求各自在自己的方法里创建构建器，完成后生成字符串并交给下游。

虽然请求同时运行，但它们修改的是两个独立实例。此时，没有理由只因为服务部署了很多线程，就强行让每个局部构建器使用同步类型。

问题出现在多个线程真的操作同一份 StringBuilder 时。它没有承诺这些并发修改会安全协调。

所以，“局部构建，完成后交付不可变结果”通常更容易推理。仍要确保局部对象没有被意外存到共享字段，或者交给另一个线程继续修改。

### StringBuffer 能保护一次 append，但不是整条业务记录

假设线程 A 想依次写入编号、名字和换行，线程 B 也做同样三次调用。

即使每一次调用都经过同步，执行顺序仍可能是 A 的编号、B 的编号、A 的名字，再穿插剩余内容。单次方法没有把内部状态弄坏，并不代表两条记录一定保持完整相邻。

[StringBuffer API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/StringBuffer.html)提供方法级协调，并没有替业务决定哪几次调用必须合起来不可分割。

如果要保护整条记录，可以先用各自的局部构建器得到完整文本，再一次交给具有明确顺序保证的写入层；也可以在共享对象外，对完整业务操作设置正确的同步范围。

但日志顺序、文件写入和发送过程都有自己的边界。不能只换成 StringBuffer，就宣布整条输出链路已经安全。

![一次 append 安全，不代表整条记录完整](https://note.lgdsunday.club/img/Q240/03-interleaving.webp)

图中每一行表示一次 append 的片段，便于看清穿插顺序；字符串不会因为画在不同行就自动换行，实际换行仍由代码中的换行符决定。

### 一个跨语言的文本构建习惯，怎么写才不误导？

下面演示“先收集片段，再一次形成结果”。它是同一个文本处理意图，不是 Java 构建器 API 的逐行翻译。

TypeScript：

```ts
function renderNames(names: string[]): string {
  const parts: string[] = [];
  for (const name of names) parts.push(`姓名：${name}\n`);
  return parts.join("");
}
```

Python：

```python
def render_names(names: list[str]) -> str:
    parts = []
    for name in names:
        parts.append(f"姓名：{name}\n")
    return "".join(parts)
```

这两段用于说明明确的构建范围和最终结果，不用它们证明 Java StringBuilder 的内部结构，也不宣称三种运行时的性能完全一致。

## 面试官继续追问

### StringBuilder 调用 toString 后，还能继续改吗？

可以继续改构建器。交付出去的是字符串结果，不应该把它说成仍然跟着构建器内容实时变化的窗口。

### StringBuffer 一定比 StringBuilder 慢很多吗？

不保证固定比例。同步有成本，但实际结果取决于代码、优化和是否竞争。面试先讲保证不同，性能用实测补充。

### 内容相同的两个构建器，equals 就会相等吗？

不要照搬 String 的规则。StringBuilder、StringBuffer 没有按字符内容重写 equals；要比较文本，可以明确转成字符串或选择相应内容比较方法。

## 面试速记卡

> - String：不可变文本，变量重赋值不等于修改原字符内容。
> - StringBuilder：局部可变构建，未承诺共享并发修改安全。
> - StringBuffer：方法级同步，不自动保护多次调用的业务整体。
> - 拼接选择：少量连接重可读性，大量累加看实际构建模式。
> - 优先策略：减少共享，完成构建后交付明确的文本结果。

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
