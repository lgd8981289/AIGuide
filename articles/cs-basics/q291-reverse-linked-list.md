# 如何反转单链表？迭代和递归的写法、复杂度有什么区别？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/cs-basics/q291-reverse-linked-list/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：反转单链表，你会怎么写？

🙋‍♂️ 我：遍历链表，把每个节点的 next 指向前一个节点。

🧑‍💻 面试官：把节点 2 的 next 从 3 改成 1 以后，你从哪里继续找到 3？

🙋‍♂️ 我：要先保存原来的 next。

🧑‍💻 面试官：递归返回以后，为什么还要把原来的 next 置空？递归真的也是 O(1) 空间吗？

> 反转的关键不是“把箭头画反”，而是「先保住后半段，再改向」，同时避免留下环。

## 面试速答（60 秒版）

反转单链表，是改变节点之间的 next 关系，返回新的头节点，不是只把节点里的值倒过来。

迭代写法通常维护 prev 和 curr。每轮先保存 curr.next，再把 curr.next 指向 prev，最后让 prev、curr 分别前进。循环结束后，prev 就是新头。时间复杂度 O(n)，额外空间 O(1)。

递归写法先反转后半段，返回时让后一个节点指回当前节点，并把当前节点原来的 next 置空。时间也是 O(n)，但递归调用栈占 O(n) 空间。

实际使用要处理空链表和单节点，并说明输入是无环链表。节点很多时，迭代通常更稳妥；Python 等运行环境还有递归深度限制，不能只看代码短就选递归。

![Q291 面试速答总览：原链与反转链正确；每轮三步而非总共一轮；迭代/递归的时间和额外空间正确。](https://note.lgdsunday.club/img/Q291/01-overview-v3.webp)

## 知识点详解：从 1 → 2 → 3 推演指针怎样变化

### 每一轮，左边已经反转，右边还没处理

咱们假设原链表是 1 → 2 → 3 → 空。

开始 prev 是空，curr 指向 1。处理完节点 1 后，1.next 指向空，prev 指向 1，curr 指向 2。

这时分成两段：左边是已经反转的 1 → 空，右边是还没处理的 2 → 3 → 空。每轮都要保证这两段还能被变量找到。

处理节点 2 时，先把 3 保存到 next。然后把 2.next 改为 1，再让 prev 指向 2、curr 指向 3。左边就变成 2 → 1 → 空，右边只剩节点 3。

如果没有先保存 next，改向以后就失去了继续前进的入口。算法不是同时把所有箭头翻转，而是每轮从右边取一个节点，放到左边开头。

![Q291 知识点示意：每幕各节点只出现一次，先保存3、2改向1、变量再前进；每个 next 只有一个去向。](https://note.lgdsunday.club/img/Q291/02-pointers-v3.webp)

### 把这三个动作写成迭代代码

TypeScript：

```ts
class ListNode {
  constructor(public value: number, public next: ListNode | null = null) {}
}

function reverseIterative(head: ListNode | null): ListNode | null {
  let prev: ListNode | null = null;
  let curr = head;
  while (curr !== null) {
    const next: ListNode | null = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }
  return prev;
}
```

Python：

```python
from __future__ import annotations
from dataclasses import dataclass

@dataclass
class ListNode:
    value: int
    next: ListNode | None = None

def reverse_iterative(head: ListNode | None) -> ListNode | None:
    prev = None
    curr = head
    while curr is not None:
        next_node = curr.next
        curr.next = prev
        prev = curr
        curr = next_node
    return prev
```

curr 最后走到空时，所有节点都已经移到左边。prev 指向 3，它就是新头。原来的头 1 已经成为尾节点。

### 递归回来以后，为什么要断开旧箭头？

递归先把后半段反转。假设处理节点 2 时，后半段已经返回节点 3 作为新头。

现在让 3.next 指向 2，就得到反向连接。但原来 2.next 仍指向 3，如果不把它置空，就形成 2、3 互相指向的环。

TypeScript，沿用上面的节点定义：

```ts
function reverseRecursive(head: ListNode | null): ListNode | null {
  if (head === null || head.next === null) return head;
  const newHead = reverseRecursive(head.next);
  head.next.next = head;
  head.next = null;
  return newHead;
}
```

Python，沿用上面的节点定义：

```python
def reverse_recursive(head: ListNode | None) -> ListNode | None:
    if head is None or head.next is None:
        return head
    new_head = reverse_recursive(head.next)
    head.next.next = head
    head.next = None
    return new_head
```

继续返回到节点 1 时，再让 2.next 指向 1，并让 1.next 为空。最深处返回的 newHead 一直是节点 3，不会在每一层换成当前节点。

![Q291 知识点示意：第一幕1和3指向同一个2，2.next为空；第二幕3→2→1→空，newHead始终指3。](https://note.lgdsunday.club/img/Q291/03-recursive-v3.webp)

### 验证不能只看打印结果

除了检查 3、2、1 的值，还要检查：新头是否为原来的尾、原头 next 是否为空、节点是否仍是原对象、链表有没有环。

空链表应返回空，单节点应原样返回。两种写法都访问每个节点，但递归保留了一层层调用记录，因此空间不是 O(1)。

## 面试官继续追问

**直接把值交换，算反转吗？**

本题要求反转节点关系。交换值会保留原结构，节点还有其他字段或外部引用时，含义可能不同，不能未经确认替换题意。

**链表有环会怎样？**

以上写法以前置的无环链表为范围，不是检测并反转带环结构的通用方案。输入可能有环时，应先明确需求与检测处理方式。

原题范围见 [力扣 206](https://leetcode.cn/problems/reverse-linked-list/)，代码为本篇独立实现。

## 面试速记卡

> - 迭代顺序：保存 next → 当前改向 → 两个指针前进。
> - 循环关系：prev 指已反转部分，curr 指未处理部分。
> - 返回值：循环结束返回 prev，递归始终返回后半段新头。
> - 递归断链：head.next 置空，避免保留旧箭头形成环。
> - 复杂度：两者 O(n) 时间；迭代 O(1)，递归 O(n) 额外空间。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
