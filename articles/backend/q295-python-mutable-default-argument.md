# Python 函数默认参数为什么不建议用空列表？多次调用为什么会共享数据？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q295-python-mutable-default-argument/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：Python 函数把默认参数写成空列表，会有什么问题？

🙋‍♂️ 我：列表会被多个调用共享，可能把上次的数据带进来。

🧑‍💻 面试官：共享是因为第一次调用以后才保存的吗？列表究竟什么时候创建？

🙋‍♂️ 我：执行函数定义时，默认值就创建了。

🧑‍💻 面试官：改成 None 以后，能不能用 if not items 来创建列表？调用方明确传了一个空列表呢？

> 默认值在「执行函数定义」时准备好，不是每次调用都重新创建。修复时也要尊重调用方明确传入的对象。

## 面试速答（60 秒版）

Python 函数默认参数在执行函数定义时求值。默认值是空列表时，这个列表对象会被保存下来；多次省略这个参数，就会使用同一个默认对象。

如果函数对它执行 append 等修改，后一次调用就可能看到前一次留下的数据。字典、集合等可变默认对象也有类似风险。

通常可以把默认值设为 None，在函数内部通过 `is None` 判断，再为本次调用创建新列表。不能随意写 if not items，因为调用方主动传入的空列表也会被当成没有提供。

因此，关键是默认值的求值时机和对象是否可变，不是“Python 每次会把列表复制错”。确实需要共享状态时可以显式设计，但不应该让普通调用悄悄共享一个默认容器。

![Q295 面试速答总览：已目视核对技术关系；概念图不是实测结果。](https://note.lgdsunday.club/img/Q295/01-overview.webp)

## 知识点详解：两次 append，为什么第一次结果也变了？

### 列表只在定义阶段创建一次

Python：

```python
def add_tag(tag, tags=[]):
    tags.append(tag)
    return tags

first = add_tag("A")
second = add_tag("B")
print(first)            # ['A', 'B']
print(second)           # ['A', 'B']
print(first is second)  # True
```

咱们按时间顺序看。执行 def 时，创建一个空列表作为默认值。第一次没有传 tags，就使用它，加入 A。第二次仍没有传 tags，还是使用这个列表，再加入 B。

first 和 second 也都指向它，所以最后打印 first，同样看到 A、B。并不是第二次调用回头修改了“第一份列表”，而是从一开始就只有一份共享列表。

默认值在一次定义执行中求值一次。如果另一个过程重新执行这条 def，创建新的函数，也可能得到新默认对象。因此更准确的表达是“定义时求值”，不是“整个程序永远只创建一次”。

![Q295 知识点示意：已目视核对技术关系；概念图不是实测结果。](https://note.lgdsunday.club/img/Q295/02-timeline.webp)

### 修改对象和重新赋值，结果不一样

append 修改的是原列表。字典更新、集合 add 等也会改变原对象。

但如果函数只是给局部参数重新赋一个新列表，就不是在修改原来的默认列表。是否有跨调用污染，要看具体操作，不能只看到 `=[]` 就编造相同输出。

使用数字、字符串等不可变默认值，通常没有这种原地修改风险。不过默认表达式仍是在定义时求值。例如把“当前时间”调用写在默认参数里，也不会每次调用都自动取新时间。

### 用 None 表示“调用方没有提供”

Python：

```python
def add_tag(tag, tags=None):
    if tags is None:
        tags = []
    tags.append(tag)
    return tags

first = add_tag("A")
second = add_tag("B")
print(first, second)  # ['A'] ['B']

provided = []
result = add_tag("C", provided)
assert result is provided
```

省略参数时，每次进入函数再建立新列表。明确传入 provided 时，就继续使用它，这也是这份函数约定的一部分。

如果改成 `if not tags`，显式空列表也满足条件，会被换成另一个新列表，调用方期待的修改就没有发生。真假判断和缺省判断不是同一个问题。

如果 None 本身是一个有效业务输入，不能再同时用它代表缺省。可以建立独立哨兵对象，并通过身份判断区分。哨兵需要在接口约定里说明，不必为每个简单函数增加复杂度。

![Q295 知识点示意：省略参数遇None才新建；显式传空列表保留身份，返回列表可继续使用，调用保留必填item。](https://note.lgdsunday.club/img/Q295/03-fix-v3.webp)

### TS 的默认空数组，为什么不能照着这个答案背？

TypeScript / JavaScript 的默认参数表达式在调用时求值，行为与这里的 Python 默认值不同：

```ts
function addTag(tag: string, tags: string[] = []): string[] {
  tags.push(tag);
  return tags;
}

const first = addTag("A");
const second = addTag("B");
console.log(first, second);    // ["A"] ["B"]
console.log(first === second); // false
```

这不是 Python 修复代码的机械翻译，而是语言行为对照。显式把同一个数组传给两次 TS 调用，仍然可以共享修改；独立默认对象也不意味着语言禁止共享。

Python 行为依据 [官方默认参数教程](https://docs.python.org/3/tutorial/controlflow.html#default-argument-values)，TS 运行时行为依据 JavaScript 默认参数说明核验。

## 面试官继续追问

**默认空列表一定不能使用吗？**

刻意共享状态可能有用途，但需要显式说明并考虑生命周期与并发。对普通工具函数，不应把隐蔽默认对象当成自然的跨调用存储。

**数据类里的列表默认值也这样处理吗？**

数据类有自己的字段规则，通常用 default\_factory 创建每个实例独立的容器，不能直接把函数参数写法搬过去。先区分函数调用和实例字段初始化。

## 面试速记卡

> - 求值时机：Python 默认值在执行函数定义时准备好。
> - 共享来源：省略参数时重复使用同一个可变默认对象。
> - 污染条件：append 等原地修改会留下状态，不是每次都复制。
> - 常用修复：None 缺省，函数内 is None 后新建容器。
> - 空容器：明确传入的 \[] 不应被 if not 误判为缺省。
> - 语言对照：TS / JS 默认表达式在调用时求值，不能套 Python 结论。

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
