# Python 的垃圾回收机制是什么？引用计数为什么处理不了循环引用？

[深信服开发面试真题](../companies/sangfor-development.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q547-python-reference-counting-garbage-collection/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：Python 对象的引用计数为零，就能释放吗？

🙋‍♂️ 我：在常见 CPython 实现里，引用计数下降到零通常会触发相应释放。

🧑‍💻 面试官：A 引用 B、B 引用 A，外部变量删掉以后，计数会自然归零吗？

🙋‍♂️ 我：不会，循环垃圾收集需要处理这种外部已经不可达的引用环。

🧑‍💻 面试官：那你看到进程内存没有立刻下降，就能断定对象没回收吗？

> 看对象能否回收，要找是否仍有外部可达引用；对象释放以后，内存也未必立刻还给操作系统。

## 面试速答（60 秒版）

以常见 CPython 为例，引用计数记录对象被多少引用持有，计数降到零时通常会进入释放流程。`del` 删除的是名称或容器里的相应引用，不是直接命令某个对象立刻消失。

两个对象互相引用时，即使外部已经无法访问它们，内部引用还可能让计数不为零。CPython 的循环垃圾收集补充处理这类不可达引用环。

因此，排查内存要同时看仍然活着的引用和回收机制。对象被释放、运行时复用内存、进程把内存归还给操作系统，是不同层次。具体代际、阈值和构建差异，要按实际 Python 版本确认。

![计数与循环收集怎样配合](https://note.lgdsunday.club/img/Q547/01-overview.webp)

## 知识点详解：变量删掉以后，对象还被谁引用

### del 先改变名称绑定

假设 a 和 b 指向同一个对象。删除 a 以后，b 仍然能访问它。

这就说明 del 不能简单理解为‘删对象’。函数局部变量、列表、缓存和其他对象的属性，都可能持有引用。判断一个对象的生命周期，需要沿这些关系查。

引用计数是 CPython 实现的重要机制，但不能把它直接定义为所有 Python 实现都必须采用的回收方式。

![删掉 a，b 还在引用](https://note.lgdsunday.club/img/Q547/02-bindings.webp)

### 循环引用为什么不会自然归零

假设 a.peer 指向 b，b.peer 又指向 a。外部的 a、b 名称删除以后，两者内部仍然互相持有引用。

如果只靠计数为零，环就可能一直留下。循环 GC 会对受跟踪对象检查内部引用关系，寻找外部已经不可达的结构，再按规则回收。

不是所有引用环都有问题。若缓存里仍保存 a，这个环本来就可达，回收器不能为了省内存把它删除。

![环内部有引用，外部已经不可达](https://note.lgdsunday.club/img/Q547/03-cycle.webp)

### 用弱引用观察，不再额外保留对象

下面的 Python 实验构造一个不可达环，弱引用用于观察结果，不增加普通强引用。TypeScript 只展示对应的可达性关系；JavaScript 不是 CPython 引用计数实验，也不保证主动回收时机。

#### Python

```python
import gc
import weakref

class Node:
    pass

a, b = Node(), Node()
a.peer, b.peer = b, a
probe = weakref.ref(a)
del a, b
gc.collect()
print(probe() is None)  # True
```

#### TypeScript

```typescript
type NodeValue = { peer?: NodeValue };
let a: NodeValue | null = {};
let b: NodeValue | null = {};
a.peer = b;
b.peer = a;
a = null;
b = null;
// 没有外部强引用可以再找到这两个对象。
// 此处不声称 JavaScript 立即执行回收。
```

实验展示的是这个输入下的行为，不能据此保证带外部资源、终结器或长期缓存的所有对象都一样处理。

### 进程内存没降，要继续看分配层

对象释放以后，Python 的分配器可能保留一部分空间供后续对象复用。操作系统看到的进程内存，未必立即缩小。

因此，排查时同时观察对象数量、分配记录、缓存引用与进程占用。只看一次 RSS 变化，无法确认哪个对象被留住。

本文以 CPython 3.11 为解释基线。后续版本及不同构建会调整 GC 细节，别把固定‘三代’或阈值口诀套到所有版本。依据：[Python 3.11 gc](https://docs.python.org/3.11/library/gc.html)。

![对象释放，内存池可能继续保留](https://note.lgdsunday.club/img/Q547/04-allocator.webp)

## 面试官继续追问

### 调用 gc.collect 能解决所有内存泄漏吗？

仍可达的对象不会因为主动收集就释放。要查缓存、容器或其他持有关系；资源释放也要按对象协议处理。

### 关掉循环 GC，还会回收对象吗？

常见 CPython 的引用计数机制仍存在，但不可达环的处理会受影响。实际效果与实现版本、对象关系有关。

### 弱引用会让对象立刻消失吗？

弱引用主要不维持普通强引用生命周期，不是强制回收命令。回收时机与剩余引用仍需分别看。

## 面试速记卡

> - del：移除名称或相应引用。
> - CPython 引用计数：计数降零通常触发释放。
> - 循环 GC：处理外部不可达的受跟踪引用环。
> - 仍可达的缓存对象，不算可回收垃圾。
> - 对象释放与 RSS 下降不同，细节看版本。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **深信服 · Python开发 · 校招（原帖标签）**：Python 怎样管理内存，其垃圾回收方式和底层实现是什么？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353157075456958464)；正文记录 9 月 19 日、9 月 20 日技术面；原帖编辑于 2020-09-27。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
