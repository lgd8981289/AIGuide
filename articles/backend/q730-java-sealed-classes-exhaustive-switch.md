# Java sealed class 有什么用？与 final、穷尽 switch 怎样配合？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q730-java-sealed-classes-exhaustive-switch/) · [题库目录](../../README.md)

*下面是一段用于讲解的模拟面试对话。*

🧑‍💻 **面试官：** 一个解析结果只有成功和失败两种，你会怎么表达？

🙋‍♂️ **我：** 可以定义一个结果接口，再写 Success 和 Failure 两个实现类。

🧑‍💻 **面试官：** 其他模块又写了一个实现类，处理结果的地方能及时发现吗？

🙋‍♂️ **我：** 可以在 switch 里面加一个 default，处理未知情况。

🧑‍💻 **面试官：** 那新增状态时，编译器还会提醒你补业务逻辑吗？

> sealed 要解决的是“这个类型允许有哪些直接子类型”。边界先明确，编译器才能帮我们检查有没有漏掉分支。

## 面试速答（60 秒版）

`sealed` 可以限制一个类或接口允许哪些类型直接继承、实现它，适合表达种类有限、希望统一维护的模型。

`final` 是完全不允许再继承；`sealed` 是只允许指定的直接子类型继续扩展。被允许的普通子类还要明确自己的选择，是 final、继续 sealed，还是用 non-sealed 重新开放继承。

当类型范围明确时，Java 21 的模式 switch 可以覆盖这些子类型，让编译器检查分支是否穷尽。比如解析结果只有成功和失败，就分别处理；以后增加一种结果，重新编译处理代码时，就有机会暴露遗漏。

不过，这不是自动处理空值，也不表示所有后代类型都永久封闭。null 和 non-sealed 分支都需要单独理解，升级时还要避免新旧类文件不一致。

![sealed 限定 Result 的直接子类型，编译器据此检查处理分支](https://note.lgdsunday.club/img/Q730/01-sealed-overview.webp)

## 知识点详解：让类型边界帮我们发现遗漏

### 普通接口为什么不够？

普通接口表达“实现者需要遵守什么约定”，通常不限制世界上还能出现多少实现者。对插件系统来说，这很好，外部模块可以不断增加实现。

但一个解析器的结果可能只想保留成功与失败。此时，随便增加一种实现会让每个消费结果的地方都面临新情况。开发者希望新增状态时显式修改模型，再逐个检查处理代码，sealed 就适合这个方向。

这里要分清两个目标。插件强调开放扩展，结果模型强调有限种类。sealed 不是比普通接口更高级，只是在把后一个目标交给语言表达。

### permits 限制到哪一层？

假设 Result 只允许 Success、Failure 直接实现，其他类就不能直接实现 Result。编译器能够检查这一点。[Java 21 sealed 文档](https://docs.oracle.com/en/java/javase/21/language/sealed-classes-and-interfaces.html)还规定了模块和包的约束，不能在任意外部位置随便添加被允许的子类型。

但是，如果某个被允许的子类声明为 non-sealed，别人仍然可以继续继承这个子类。根类型限制的是直接子类型，不会越过这条开放分支，把所有后代都锁死。

因此，查看层级图时要一层一层看。final 这一支到此结束；sealed 这一支继续列清单；non-sealed 这一支允许出现更多后代。record 隐式为 final，可以作为封闭层级中的具体数据类型。

![final、sealed 和 non-sealed 对后续继承范围的不同限制](https://note.lgdsunday.club/img/Q730/02-type-branches.webp)

### 穷尽 switch 为什么有用？

下面是 Java 21 语言示例，使用模式 switch，不是 TypeScript 或 Python API。本文核对了语言文档，没有把这段代码声称为当前 Java 20 宿主上的运行结果。

```java
final class ParseResults {
    sealed interface ParseResult permits Success, Failure {}
    record Success(String value) implements ParseResult {}
    record Failure(String reason) implements ParseResult {}

    static String describe(ParseResult result) {
        return switch (result) {
            case Success s -> "得到内容：" + s.value();
            case Failure f -> "解析失败：" + f.reason();
        };
    }
}
```

在这个模型里，两个分支覆盖了允许出现的非空结果。假设再加入 Cancelled，并且修改 permits，重新编译这段处理代码时，编译器就能要求补上缺失情况。

如果一开始就用一个宽泛 default 把剩下情况全部接住，代码虽然容易继续编译，却可能失去这次有价值的提醒。有限结果模型中，明确列出每种需要处理的情况，通常更容易维护。

但 null 不会因为类型层级封闭就自动归入某一种结果。要么在接口入口明确拒绝 null，要么在 switch 中显式设计空值处理，不能把穷尽非空子类型等同于覆盖所有输入。[JEP 441](https://openjdk.org/jeps/441)给出了模式 switch 的规则与边界。

![新增允许类型以后，重新编译的穷尽 switch 能暴露缺失分支](https://note.lgdsunday.club/img/Q730/03-switch-evolution.webp)

### 编译通过，还要检查部署组合

编译期检查针对的是当时看到的类型集合。如果库已经增加新子类型，消费端却还在使用旧的编译产物，运行时仍可能遇到没有匹配分支的情况。Java 21 对这类不再穷尽的执行有相应异常语义，它不是跨版本自动兼容协议。

验证时可以建一个很小的示例工程。先让两个子类型编译通过，再增加第三种，观察无 default 的 switch 是否报遗漏；接着把一支改为 non-sealed，确认需要覆盖的是整个开放分支；最后测试 null。比起只背三个关键字，这几个实验更能看清语言到底保证了什么。

## 面试官继续追问

### sealed 能不能代替枚举？

枚举适合固定的一组命名实例。sealed 层级可以让每种结果携带不同结构的数据，比如成功带解析内容，失败带原因。两者解决的建模需求有重叠，但并不等价。

### 既然可以用多态方法，为什么还用 switch？

如果行为天然属于每个类型，放在类型内部很合适。如果同一组数据需要多种外部处理，模式 switch 能把某一次处理集中起来。关键看行为的归属和扩展频率，不是看到 sealed 就必须写 switch。

### non-sealed 一出现，穷尽检查就没意义了吗？

不会。一个覆盖该开放父类型的分支，可以同时处理它的后代。但编译器不会要求你枚举所有未知后代，开放范围需要由业务自己接受。

## 面试速记卡

> - final：不允许继续继承。
> - sealed：限定直接子类型集合。
> - non-sealed：在被允许的一支重新开放继承。
> - 穷尽 switch：按已知类型检查非空分支，避免静默遗漏。
> - 工程边界：空值、开放分支以及新旧类文件组合仍要测试。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
