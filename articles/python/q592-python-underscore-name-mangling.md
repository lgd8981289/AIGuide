# Python 的单下划线、双下划线和双端下划线有什么区别？

[华为开发面试真题](../companies/huawei-development.md) · [大华开发面试真题](../companies/dahua-development.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/python/q592-python-underscore-name-mangling/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：Python 名字前一个下划线和两个下划线分别是什么意思？

🙋‍♂️ 我：一个表示内部使用，两个会做名称改写。

🧑‍💻 面试官：那外部就绝对访问不了双下划线成员了吗？

🙋‍♂️ 我：也不绝对，能通过改写后的名字访问。

🧑‍💻 面试官：双端下划线又为什么不能随便自己发明？子类的同名字段会不会覆盖父类那个？

> 下划线里既有命名约定，也有解释器做的名称处理。先确认属于哪一种，才知道它能不能提供访问限制。

## 面试速答（60 秒版）

单前导下划线通常表示内部使用的约定，不是强制私有权限。普通 from module import \* 也会受它影响，但显式导入仍可以访问；**all** 还能明确导出名单。

类体中的双前导、非双尾下划线名字会发生名称改写，例如 \_\_value 通常变成 \_ClassName\_\_value。主要用途是减少继承时的名称冲突，不是阻止有意访问。

**init** 这类双端下划线名称属于 Python 协议，应该按文档规定的含义实现，不随便创建新的魔术协议名。name\_ 这种末尾单下划线则常用于避开关键字冲突。

所以我不会说“双下划线等于 Java private”。真正的敏感数据保护和安全边界，需要权限、数据隔离等机制，不能靠名称写法完成。

![三种名字，三种职责](https://note.lgdsunday.club/img/Q592/01-overview-v2.webp)

## 知识点详解：约定、名称改写和语言协议要分开

### 一个前导下划线，主要是告诉使用者别依赖

假设模块有公开函数 query 和内部辅助函数 \_normalize。后者的名字提示调用者，这是实现细节，后续版本可能改变。

显式写 from module import \_normalize 通常仍然可行。没有 **all** 时，通配导入默认不会导入这些前导下划线名字；有 **all** 时，公开名单由它明确指定。

因此单下划线既有约定用途，也和部分导出规则相关，但不形成拒绝访问的安全墙。代码审查和接口文档仍要明确哪些成员允许外部依赖。

### 双前导下划线让父子类名字分开

下面 Parent 和 Child 都写 \_\_value。实例里实际保存的名字分开，所以父类方法仍能拿到父类那份数据。

#### Python

```python
class Parent:
    def __init__(self):
        self.__value = "父类"
    def parent_value(self):
        return self.__value

class Child(Parent):
    def __init__(self):
        super().__init__()
        self.__value = "子类"

obj = Child()
print(obj.parent_value())   # 父类
print(obj._Parent__value)   # 父类，仍可有意访问
print(obj._Child__value)    # 子类
```

名称改写与类定义处的类名相关。父类方法里的 \_\_value 不会因为 self 是子类实例，就自动变成子类版本。

这帮助避免无意冲突，却也增加调试和测试中的名字复杂度。普通内部成员只需要约定时，单下划线常常就足够，不必把每个字段都改成双下划线。

![父类和子类，改写到不同名字](https://note.lgdsunday.club/img/Q592/02-inherit.webp)

### 双端下划线由语言协议规定

**len**、**repr**、**init** 等名称有既定用途，Python 会在相应操作中使用它们。满足双尾下划线的协议名字不按前面的普通私有名规则改写。

随便发明 **do\_magic** 并不会让解释器自动赋予特殊能力，也可能占用未来协议命名空间。自己的业务方法使用普通名字更清楚。

另外，class\_ 这种尾部单下划线通常只是为了避开 class 关键字。单独的 \_ 在很多代码里表示不用的值，但在 match 模式中还有通配语法含义，不能把所有下划线都套进“私有”标签。

![导出名单，不是访问权限墙](https://note.lgdsunday.club/img/Q592/03-exports.webp)

### 跨语言的 private，约束方式也不相同

#### TypeScript（类型层私有成员对照）

```typescript
class Box {
  private value = "内部";
  read(): string { return this.value; }
}
const box = new Box();
console.log(box.read());
// console.log(box.value); // TypeScript 类型检查拒绝
```

TS 的 private 主要提供类型检查阶段的成员访问约束，和 Python 名称改写不同。JS 的 #私有字段又是另一套运行时机制，本题不拿这个短示例把几种规则全部等同起来。

给库设计 API 时，可以先列公开成员，再决定内部命名约定。测试不应默认抓每个改写字段做断言，公开行为通常更稳定。要保护凭据，则检查数据保存、日志和访问权限，而不是寄希望于少一个可见名字。

依据：[Python 3.11 私有变量与名称改写](https://docs.python.org/3.11/tutorial/classes.html#private-variables)、[Python 标识符保留名称](https://docs.python.org/3.11/reference/lexical_analysis.html#reserved-classes-of-identifiers)、[模块通配导入规则](https://docs.python.org/3.11/tutorial/modules.html#importing-from-a-package)、[TypeScript private](https://www.typescriptlang.org/docs/handbook/2/classes.html#private)。

## 面试官继续追问

### 双下划线保护密码更安全吗？

不能把它当安全机制。改写后的名字仍可有意访问，日志和序列化也可能泄露内容。

### 父类 \_\_value 会被子类同名覆盖吗？

普通类定义中的改写会把两者分到不同名称。显式操作改写名或定制访问时另看具体行为。

### **all** 是访问控制吗？

它规定通配导入的导出集合，不阻止显式访问其他名字。公开接口仍需要文档和约定。

## 面试速记卡

> - 单前导下划线通常是内部使用约定。
> - 双前导非双尾名字在类中发生名称改写。
> - 名称改写减少继承冲突，不提供强私有权限。
> - 双端下划线遵循 Python 已定义协议。
> - 末尾单下划线常用于避开关键字。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **华为 · 开发（OD；原帖未明确细分岗位） · OD社招（原帖标签）**：Python 变量名前加一个下划线和两个下划线有什么区别？（题意整理）。[面经来源](https://www.nowcoder.com/feed/main/detail/bb9d186bfab04a25b9b0ff0f83c8d0d9)；原帖发布于 2025-10-20。
- **大华 · Python开发（原帖标签） · 校招**：变量名以一个下划线开头有什么作用，双端下划线形式有哪些用途？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353155617470750720)；原帖编辑于 2019-09-28。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
