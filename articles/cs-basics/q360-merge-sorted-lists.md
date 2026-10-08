# 如何合并两个有序链表？递归和迭代的复杂度有什么区别？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/cs-basics/q360-merge-sorted-lists/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：合并两个有序链表，你会怎么写？

🙋‍♂️ 我：每次选择两个头节点里更小的，接到结果链表后面。

🧑‍💻 面试官：为什么只比较头节点就够了？

🙋‍♂️ 我：每个链表都已经有序，最小剩余节点一定在头部。

🧑‍💻 面试官：递归写起来更短，它的空间也是 O(1) 吗？如果原链表还要保留呢？

> 先确认「已有序」，再确认「能否改原节点」。算法复杂度和数据所有权，都影响实现选择。

## 面试速答（60 秒版）

两个链表已经升序时，它们剩余部分的最小节点，一定是两个当前头节点中的较小者。

迭代方案可以用一个虚拟头节点和尾指针。每次把较小节点接到尾部，推进对应链表，直到其中一个为空，再接上另一个剩余部分。

时间复杂度是 O(m+n)，复用原节点时额外空间是 O(1)。递归方案也是线性时间，但最坏会产生 O(m+n) 层调用栈，不能说空间同样为常数。

此外，复用节点会修改原来的 next 关系。如果调用方需要保留原链表，应创建新的结果节点，并承担 O(m+n) 的结果空间。相等值如何选择，也要按稳定性要求明确。

![每次取两个头节点中较小的](https://note.lgdsunday.club/img/Q360/01-overview.webp)

*图：中间箭头表示比较两个链表当前的头节点，不是原链表的 next 引用。*

## 知识点详解：从最小剩余节点，到完整结果链表

### 为什么不需要重新排序？

假设两条链表分别是 1→4→7 和 2→3→8。每条链表内部已经升序。

当前最小值，只可能来自两个头节点。选择 1 后，第一条推进到 4，继续比较 4 与 2，选择 2。这样每次都把最小剩余节点接到结果尾部。

这个过程的不变条件是：已生成部分保持有序，尾指针始终指向结果末尾，两个当前指针指向尚未合并的部分。

如果输入并非有序，这个条件不成立，算法就不能保证结果有序。题目条件可核对 [合并两个有序链表](https://leetcode.cn/problems/merge-two-sorted-lists/)。

### 虚拟头节点减少特殊分支

如果没有虚拟头，每次可能要判断“是不是第一次接节点”。虚拟头只用于统一连接方式，最终返回 dummy.next，不把它算进结果。

#### TypeScript

```ts
type ListNode = { value: number; next: ListNode | null };
function merge(a: ListNode | null, b: ListNode | null): ListNode | null {
  const dummy: ListNode = { value: 0, next: null };
  let tail = dummy;
  while (a && b) {
    if (a.value <= b.value) {
      tail.next = a;
      a = a.next;
    } else {
      tail.next = b;
      b = b.next;
    }
    tail = tail.next;
  }
  tail.next = a ?? b;
  return dummy.next;
}
```

#### Python

```python
class ListNode:
    def __init__(self, value, next=None):
        self.value, self.next = value, next

def merge(a, b):
    dummy = tail = ListNode(0)
    while a is not None and b is not None:
        if a.value <= b.value:
            tail.next, a = a, a.next
        else:
            tail.next, b = b, b.next
        tail = tail.next
    tail.next = a if a is not None else b
    return dummy.next
```

这里约定输入无环且两条链表不共享节点。共享尾部的输入可能让原地连接出现问题，真实 API 应明确限制或另行处理。

![移动输入指针，尾指针跟着结果走](https://note.lgdsunday.club/img/Q360/02-pointers-v2.webp)

*图：图中只展示已经确定的合并前缀；不能据此认为尾节点原有的 next 已经被清空。*

### 为什么剩余部分可以整体接上？

假设 a 已经为空。b 的剩余部分本来就有序，而且它的头部不会小于已经选出的结果末尾，因此不必继续逐个比较。

直接把 tail.next 接到 b，就完成合并。这也说明复用节点的迭代方案只需要固定数量指针，而不是另外存储全部元素。

### 递归短，不代表空间更少

递归把较小头节点的 next 指向“剩余两条链表的合并结果”。表达很自然，但每次调用都需要保存返回位置等状态。

最坏情况下，调用深度随总节点数增长，额外调用栈是 O(m+n)。Python 还有递归深度限制，因此长链表通常更适合迭代。

如果不能修改原链表，则无论迭代还是递归，都需要为结果创建新节点。应区分“额外辅助空间”和“必须输出的新结果空间”，别靠忽略输出把成本说没了。

![复用节点，会改原来的 next](https://note.lgdsunday.club/img/Q360/03-ownership.webp)

*图：复用节点，会改原来的 next。*

## 面试官继续追问

### 两个值相等，选哪一边？

本例先选 a，可以保持每条输入链内部顺序，并采用明确的跨输入优先规则。若业务要求不同稳定顺序，需要另外定义。

### 一个链表为空呢？

复用方案可以直接返回另一条。但这仍然返回原节点；如果要求结果独立，就不能直接共享。

### 合并 k 条链表呢？

两两合并或最小堆都是常见方向。但复杂度要结合 k 和总节点数重新分析，不能只把本题代码循环 k 次就认为最优。

## 面试速记卡

> - 前提：两条输入已排序、无环，并明确是否共享节点。
> - 每轮：选择两个当前头节点中的较小者。
> - 迭代复用：O(m+n) 时间，O(1) 辅助空间。
> - 递归：最坏线性调用栈。
> - 数据所有权：保留原链表时需要创建结果节点。

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
