# Python 的 deque 和 list 有什么区别？实现队列时为什么不建议反复 pop(0)？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/python/q607-python-deque-vs-list/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：为什么队列常用 deque，不用 list.pop(0)？

🙋‍♂️ 我：列表头部删除需要移动后面的成员，deque 更适合两端操作。

🧑‍💻 面试官：那 deque 的任意下标读取也和 list 一样快吗？

🙋‍♂️ 我：中间访问不是它的优势。

🧑‍💻 面试官：设置 maxlen=3 后再 append 第四项，是等空位，还是直接丢一项？

> 两端进出、中间随机读取和队列满时的策略，是三件事。deque 擅长其中一部分，不能当作带背压的万能队列。

## 面试速答（60 秒版）

list 更适合按下标访问和尾部追加。反复 pop(0) 会让后续成员移动，队列越长，这类头部删除的成本越明显。

deque 支持两端高效 append、appendleft、pop 和 popleft，适合先进先出队列、滑动窗口等需求。但中间下标访问会变慢，不是列表的全面替代。

maxlen 创建有容量的 deque。满时继续从一端追加，会丢掉另一端的旧成员，适合只保留最近记录；它不会等待消费者腾位置。

如果需要线程或协程之间阻塞等待、完成计数和背压，应该选 queue.Queue 或 asyncio.Queue 等相应工具。deque 的单次两端操作保证，也不能替代多步业务读改写的同步设计。

![两端进出，和随机访问需求不同](https://note.lgdsunday.club/img/Q607/01-overview.webp)

## 知识点详解：两端操作的优势，与容量和同步合同

### list 的首项取走，后面的引用要补位置

假设任务 A、B、C 排在一个列表里。pop(0) 拿走 A，B 和 C 需要移到前面的索引。队列长时，一次次这样操作就会重复移动很多引用。

尾部 pop 没有同样的整体移位需求，所以不能说“列表删除总是慢”。Q567 已讲过 CPython 列表的连续引用数组，本题把这个结构放到 FIFO 的访问方式里看。

如果任务只在两端进出，deque 更贴近需求。它不是把每个成员都存成普通链表节点那么简单，CPython 还有具体分块实现；这里不拿抽象链表故事替代真实结构。

### 两端进出，API 就对应工作方式

下面先作为队列取首项，再观察有容量的历史窗口。

#### Python

```python
from collections import deque

queue = deque(["A", "B", "C"])
print(queue.popleft())    # A
queue.append("D")
print(list(queue))        # ['B', 'C', 'D']

recent = deque(["A", "B", "C"], maxlen=3)
recent.append("D")
print(list(recent))       # ['B', 'C', 'D']
recent.appendleft("X")
print(list(recent))       # ['X', 'B', 'C']
```

recent 从右加 D，就从左丢 A；再从左加 X，就从右丢 D。这是保留有限窗口的规则，不是等待、拒绝或保证不丢任务。

有容量 deque 的 insert 满时还会抛 IndexError，不能把任意插入都解释为同一自动淘汰行为。

![窗口满了，另一端旧记录被丢掉](https://note.lgdsunday.club/img/Q607/02-window.webp)

### 中间随机访问，列表仍有优势

deque 在两端附近访问快，往中间访问则需要走过相应位置。大量按任意索引取数据时，列表通常更合适。

不要为了“deque 两端是 O(1)”就把所有容器都换掉。排序、切片、接口类型和访问模式也会影响选择；把 deque 转成 list 再每次取一个成员，可能又添了不必要复制。

#### TypeScript（逻辑读指针的队列对照）

```typescript
const storage = ["A", "B", "C"];
let head = 0;
function take(): string | undefined {
  if (head >= storage.length) return undefined;
  const value = storage[head];
  head += 1;
  return value;
}
console.log(take());
storage.push("D");
console.log(storage.slice(head)); // ["B", "C", "D"]
```

JS 数组没有 Python deque 的同款两端合同。这份示例用读指针避免每次 shift，但已经消费的元素仍在数组里，正式实现需要清理引用和压缩策略。它不是生产级无限队列。

### 同步等待和完成确认，需要另外的队列

deque 的单次两端操作不能保证“先判断非空再取”这组业务步骤一直成立。多个执行者交错时，中间仍可能发生变化。

线程间需要阻塞等待，可以看 queue.Queue；协程间需要 await put/get 和完成计数，则是 asyncio.Queue。二者的容量满时等待，与 maxlen 的自动淘汰区别很大。

测试容器时应该覆盖满容量追加、两端删除和中间访问模式。测性能就固定数据规模和动作，不拿一条小数据的时间差去宣称所有场景都快。

依据：[Python 3.11 collections.deque](https://docs.python.org/3.11/library/collections.html#collections.deque)、[queue.Queue](https://docs.python.org/3.11/library/queue.html)、[asyncio.Queue](https://docs.python.org/3.11/library/asyncio-queue.html)、[CPython 3.11 deque 实现](https://github.com/python/cpython/blob/v3.11.0/Modules/_collectionsmodule.c)。

![淘汰旧值，与等待空位不同](https://note.lgdsunday.club/img/Q607/03-queue-v2.webp)

## 面试官继续追问

### deque maxlen 满了会 await 吗？

不会。append 等两端追加按规则淘汰另一端旧值，和 asyncio.Queue 背压不同。

### deque 每个索引读取都 O(1) 吗？

不应这样回答。靠近端点快，中间访问会慢，按具体操作说明。

### 同一个队列只有单次操作安全，就够了吗？

业务可能有检查后取出等组合操作，需要另行同步或使用已有阻塞队列合同。

## 面试速记卡

> - FIFO 反复 list.pop(0) 会移动后续引用。
> - deque 擅长两端追加与取出。
> - 中间随机访问不是 deque 的强项。
> - maxlen 满时两端追加会淘汰，不会背压等待。
> - 阻塞等待和任务确认应选相应 Queue。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
