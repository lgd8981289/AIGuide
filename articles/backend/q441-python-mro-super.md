# Python 的 MRO 是什么？多继承时 super() 到底调用哪个类？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q441-python-mro-super/) · [题库目录](../../README.md)

*下面是一段教学模拟，不是真实面试记录。*

🧑‍💻 面试官：super() 调用谁？

🙋‍♂️ 我：调用父类的方法。

🧑‍💻 面试官：D 同时继承 B、C，B 和 C 都继承 A。运行 D 时，B 里的 super() 一定去 A 吗？

🙋‍♂️ 我：不一定，可能先去 C。

🧑‍💻 面试官：那为什么 B 的代码不变，super 的目标却会变？你用什么顺序解释？

> super 不是把“父类名称”写死，而是沿着「实际类型的 MRO」，从当前类后面继续找。

## 面试速答（60 秒版）

MRO 是方法解析顺序，决定多继承时属性和方法按什么类序列查找。Python 使用 C3 线性化生成这个顺序。

super() 并不总是调用代码里写的直接父类。它会结合实际对象的类型，从当前类在 MRO 中的位置之后继续查找。

例如 D 继承 B、C，而它们都继承 A，常见顺序是 D、B、C、A、object。通过 D 调用 B 的方法时，B 中的 super 可以先找到 C，而不是直接去 A。

这也是协作式多继承的基础：各类遵守一致的调用与参数规则，才能沿 MRO 完成整条链。显式调用父类方法与 super 随意混用，可能造成重复或遗漏。

![MRO：super 沿哪条路：不是总去直接父类](https://note.lgdsunday.club/img/Q441/01-overview.webp)

## 知识点详解：从一个菱形结构，把调用顺序走一遍

### MRO 是查找序列，不是继承图的随便遍历

假设继承关系是 D(B, C)，B(A)，C(A)。

A 在图里出现于两条路径，但 MRO 不是把两条路径直接拼起来，得到两个 A。C3 需要保持局部父类次序等约束，生成一致的线性查找顺序。

在这个结构中，D 的 MRO 是 D、B、C、A、object。遇到无法满足约束的继承关系，Python 可能在创建类时就报错，而不是随便选一条路线。[MRO 官方说明](https://docs.python.org/3/howto/mro.html)

### super 的“下一位”，取决于实际对象

用一个独立示例观察：

**Python**

```python
class A:
    def visit(self):
        print("A")

class B(A):
    def visit(self):
        print("B")
        super().visit()

class C(A):
    def visit(self):
        print("C")
        super().visit()

class D(B, C):
    def visit(self):
        print("D")
        super().visit()

D().visit()  # D、B、C、A
print([cls.__name__ for cls in D.__mro__])
```

D 先执行自己的 visit，再沿顺序进入 B。到了 B，super 仍依据当前对象 D 的 MRO，接着找到 C，之后才是 A。

如果单独创建 B，实际类型变成 B，顺序为 B、A、object，B 里的 super 就会去 A。

这两次 B 的方法代码一样，变化的是实际类型与相应查找顺序。[super 官方说明](https://docs.python.org/3/library/functions.html#super)

TypeScript 的 class 不支持这种多个类的直接继承，没有可信的同名 MRO 实现可机械翻译。Mixin 可以实现其他组合方式，但不等于 Python C3；这里保留 Python 专属示例。

![同一个 B，super 的下一位不同：沿实际类型的 MRO 查找](https://note.lgdsunday.club/img/Q441/02-mechanism.webp)

### 为什么“直接写 A.visit(self)”容易打断协作？

假设 B 和 C 都直接调用 A，而 D 又分别调用 B、C。A 就可能执行两次。

在普通查询里可能只是重复打印，在初始化里却可能重复创建资源、注册监听或覆盖状态。

另一方面，如果 B 完全不继续调用，后面的 C 和 A 又可能被跳过。能不能中断，应该是设计决定，不是偶然漏了一句。

协作式模式通常要求每个参与类按约定调用一次下一位，并保证最后一个实现妥善结束。不是给所有方法补 super 就自动正确。

### 初始化参数也需要协作

假设 B 负责日志配置，C 负责超时配置。两者接收共同的一组关键字参数，各自消费自己需要的项，再把剩余项传给后续类。

这样才能沿 MRO 分工。若一个类强制接收完全不兼容的位置参数，或把所有剩余参数直接传给不接受它们的末端，初始化仍会失败。

因此，多继承库需要说明构造函数签名、参数消费和调用规则。继承顺序只是其中一部分，不能只会背 D、B、C、A。

## 面试官继续追问

### 换成 D(C, B)，结果还一样吗？

这个简单结构中，顺序会相应变成 D、C、B、A、object。父类声明次序参与 MRO 约束，不能认为只是换个写法。

### super 会调用所有同名方法吗？

不会自动广播。它负责找到下一个可用实现，后面的链路能否继续，取决于这个实现是否按照约定继续调用。

### 怎样排查一个方法到底来自哪里？

查看实际类的 **mro**，再检查该顺序中的实现与调用。不要只在当前文件中寻找直接父类，忽略实际对象的类型。

## 面试速记卡

> - MRO：属性与方法的类查找顺序。
> - C3：Python 多继承使用的线性化规则。
> - super：从当前类在实际类型 MRO 中的位置之后继续查找。
> - 菱形示例：D(B, C)，共同继承 A，顺序为 D、B、C、A、object。
> - 协作条件：调用链与参数规则一致，避免重复、遗漏和不兼容签名。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
