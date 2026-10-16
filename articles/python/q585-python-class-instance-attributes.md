# Python 的类属性和实例属性有什么区别？为什么多个对象会共享同一个列表？

[大华开发面试真题](../companies/dahua-development.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/python/q585-python-class-instance-attributes/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：类属性和实例属性有什么区别？

🙋‍♂️ 我：类属性属于类，实例属性属于对象。

🧑‍💻 面试官：把 items = \[] 写在类体里，创建两个对象，一个追加数据，另一个为什么也看到了？

🙋‍♂️ 我：因为两个对象都在使用类上的那个列表。

🧑‍💻 面试官：那给其中一个对象执行 items = \[]，是清空共享列表，还是另外做了一份实例属性？

> 先看属性存在哪里，再看这次操作是在改对象内容，还是给实例重新绑定属性。两个动作看起来都在操作 items，影响范围却不同。

## 面试速答（60 秒版）

类属性保存在类上，可以表达同一类对象共享的设置或状态。实例属性通常在初始化时通过 self.xxx 建立，用来保存每个对象自己的数据。

普通属性访问时，实例没有对应属性，可能继续从类上找到它。所以把一个列表写在类体里，多个实例会读到同一个列表。通过其中一个实例 append，修改的还是这份共享对象。

如果执行 instance.items = 新列表，通常会在这个实例上建立同名属性，把类属性遮住。它不会把类上原来的列表清空，其他实例仍可能读到那份共享列表。

因此，每个对象需要独立维护的任务、标签或历史记录，应在 **init** 里创建。真要共享则明确写到类上，并考虑并发、清理和作用范围。这里讨论普通属性，描述符会另外影响访问规则。

![共享的类属性，独立的实例属性](https://note.lgdsunday.club/img/Q585/01-overview.webp)

## 知识点详解：共享列表和同名实例属性，不是一份存储

### 类体里的列表，只创建一次

假设我们有多个任务批次，每个批次都要记录完成项。如果把 done = \[] 写在类体里，执行类定义时就创建了这个列表。后续构造实例，不会自动为每个实例复制它。

实例读取 done 时，如果自身没有同名普通属性，就能沿类找到这份列表。a.done 和 b.done 因而可能指向完全同一个对象。问题不在列表“偷偷同步”，而在它们从一开始就没有分开。

这一题和可变默认参数都有共享对象的现象，但对象创建位置不同。默认参数在函数定义时求值，这里是在类定义时求值，不要把两个机制混成一个语法规则。

### append 和属性赋值分别改哪里？

下面先通过 a 追加，再给 a 绑定一个新列表。b 的结果就能帮我们看清影响范围。

#### Python

```python
class Batch:
    done = []

a, b = Batch(), Batch()
a.done.append("任务A")
print(b.done)             # ['任务A']
a.done = ["仅属于a"]
print(a.done)             # ['仅属于a']
print(b.done)             # ['任务A']
print(Batch.done)         # ['任务A']
```

append 是读取属性之后修改那个列表。a.done = 新列表则给 a 建立普通实例属性。此时 a 的同名属性遮住类属性，b 尚未建立自己的 done，所以仍沿类读取原列表。

如果删除 a.done，普通查找又可能回到类上的 done。删除实例属性不等于删除类定义，也不会让其他实例的属性自动消失。

![给 a 重新赋值，b 仍读原来的列表](https://note.lgdsunday.club/img/Q585/02-rebind.webp)

### 独立状态应在构造实例时创建

任务完成记录属于某个批次，最直接的做法就是在 **init** 里创建列表。每次构造都会得到一份独立数据。

#### Python

```python
class SafeBatch:
    def __init__(self):
        self.done = []

a, b = SafeBatch(), SafeBatch()
a.done.append("任务A")
print(a.done, b.done)     # ['任务A'] []
```

#### TypeScript（实例字段与 static 对照）

```typescript
class Batch {
  static shared: string[] = [];
  done: string[] = [];
}
const a = new Batch();
const b = new Batch();
a.done.push("任务A");
Batch.shared.push("共享记录");
console.log(a.done, b.done); // ["任务A"] []
console.log(Batch.shared);
```

TS 普通实例字段的初始化行为与 Python 类体赋值不同，共享状态要通过 static 等方式明确表达。不能把 Python 的类体列表直接对应到 TS 普通字段。

![数据应该跟着谁走？](https://note.lgdsunday.club/img/Q585/03-ownership.webp)

### 类属性并不是不能用

默认超时、协议名称、只读配置这类共同信息，可以放在类上。需要修改的共享注册表也能这样设计，但要解释清楚何时加入、何时移除，以及作用范围是哪个进程里的哪个类对象。

类属性不天然跨进程共享，也不提供线程同步。测试还可能因为上一个用例修改了共享列表，影响下一个用例。共享状态最好提供明确重置方式，或直接通过依赖注入把所有者交代出来。

复查代码时先问，这份数据跟着一个实例走，还是应该跟着整个类走。再分别测试追加成员、重绑同名属性、删除实例属性。三种操作的结果应该能用同一张引用图解释。

依据：[Python 3.11 类和实例变量教程](https://docs.python.org/3.11/tutorial/classes.html#class-and-instance-variables)、[Python 数据模型属性访问](https://docs.python.org/3.11/reference/datamodel.html)、[TypeScript static 成员](https://www.typescriptlang.org/docs/handbook/2/classes.html#static-members)。

## 面试官继续追问

### 给一个实例赋值，会改变类属性吗？

普通属性赋值通常只在这个实例上建立属性。若要改类上的属性，应明确对类赋值；描述符和自定义钩子需要另看。

### 类属性用了不可变值，就完全没有共享风险吗？

不可变对象避免了原地内容修改，但重新设置类属性仍会影响从类读取它的实例。还要看配置是否允许全局变动。

### 两个进程能靠类列表通信吗？

不能。各进程一般有自己的对象状态，需要通信或共享存储机制。

## 面试速记卡

> - 类体列表通常在定义类时创建一次。
> - 实例没有同名属性时，可能从类读取。
> - append 修改已找到的列表对象。
> - 实例赋值通常建立同名属性，遮住类属性。
> - 每实例独立数据在 **init** 中创建。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **大华 · Python开发（原帖标签） · 校招**：类的成员变量和对象的成员变量有什么区别？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353155617470750720)；原帖编辑于 2019-09-28。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
