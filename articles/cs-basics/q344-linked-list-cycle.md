# 如何判断链表有环并找到入环节点？快慢指针为什么有效？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/cs-basics/q344-linked-list-cycle/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：怎么判断一个链表有没有环？

🙋‍♂️ 我：用快慢指针，慢指针一次一步，快指针一次两步，相遇就有环。

🧑‍💻 面试官：相遇的位置就是环的入口吗？

🙋‍♂️ 我：不是。还要让一个指针回到头节点，两个指针一起每次走一步。

🧑‍💻 面试官：为什么这样就能到入口？别只背代码，解释一下距离关系。

> 先证明「环内一定相遇」，再证明「同步走到入口」。这是两个步骤，不是一次相遇就完成了定位。

## 面试速答（60 秒版）

判断链表有环，可以使用快慢指针。慢指针每次走一步，快指针每次走两步。如果没有环，快指针会先遇到空指针；如果有环，两个指针进入环以后，相对距离每轮变化一步，最终会在环内相遇。

相遇点不一定是入口。找到相遇点后，把其中一个指针放回头节点，另一个留在相遇点。两个指针再同时每次走一步，它们第一次相遇的位置就是入口。

这个结论来自距离关系：头节点到入口的距离，和相遇点继续沿环走到入口的距离，模环长相同。

整个过程的时间复杂度是 O(n)，额外空间是 O(1)。判断时比较节点身份，而不是节点里的值。

![先判环，再找入口](https://note.lgdsunday.club/img/Q344/01-overview-v3.webp)

*图：先判环，再找入口。*

## 知识点详解：快慢指针为什么能够找到环入口？

### 第一次相遇，证明链表有环

假设链表尾部的 next 错误地连回中间某个节点。这时，从头沿着 next 一直走，就不会到达 null。

慢指针每轮走一步，快指针每轮走两步。如果链表无环，快指针会到达末尾。因此，移动前必须检查 fast 和 fast.next，避免访问空节点。

如果链表有环，两个指针都会进入环。此后快指针相对慢指针每轮多走一步。可以把环看成有限个位置：相对距离每轮变化一个位置，最终必然变为零。

这个结论依赖于“一步和两步”的步长关系。不要随意把速度改成其他值，然后照搬后面的入口定位方法。

### 第二次相遇，为什么恰好在入口？

设头节点到入口的距离为 a，入口到第一次相遇点的环内距离为 b，环长为 L。

慢指针第一次相遇时，总共走了 a + b + kL 步；快指针走的距离是它的两倍。两者在同一位置，因此距离差是整圈长度，得到 a + b 是 L 的整数倍。

于是，a 与 -b 模 L 相同。也就是说，从相遇点再往前走 a 步，会回到入口。

让一个指针从头走 a 步，它也到入口；让另一个从相遇点走同样的 a 步，恰好也到入口。头到入口之前没有环内节点，所以两者不会提前在这段上相遇。

注意，“相遇点到入口距离等于 a”是容易误导的说法。a 可能包含多圈，准确关系是模环长相同。

![入口定位，靠的是模环长关系](https://note.lgdsunday.club/img/Q344/02-distance-v2.webp)

*图：入口定位，靠的是模环长关系。*

### 代码分成两阶段，别把判断和定位混起来

#### TypeScript

```ts
type ListNode = { value: number; next: ListNode | null };
function cycleEntry(head: ListNode | null): ListNode | null {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow!.next;
    fast = fast.next.next;
    if (slow === fast) {
      let p = head;
      while (p !== slow) {
        p = p!.next;
        slow = slow!.next;
      }
      return p;
    }
  }
  return null;
}
```

#### Python

```python
class ListNode:
    def __init__(self, value, next=None):
        self.value, self.next = value, next

def cycle_entry(head):
    slow = fast = head
    while fast is not None and fast.next is not None:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            p = head
            while p is not slow:
                p, slow = p.next, slow.next
            return p
    return None
```

题目条件可以核对 [环形链表 II](https://leetcode.cn/problems/linked-list-cycle-ii/)。这里比较引用或身份，两个节点的 value 相同并不代表它们是同一个节点。

## 面试官继续追问

### 为什么时间复杂度不是 O(n²)？

到达环之前需要线性步数；进入环后，相对距离最多再变化一圈就相遇。第二阶段也是线性步数。两个阶段相加仍为 O(n)。

### 只有一个节点，指向自己呢？

同样成立。第一次移动后两个指针就相遇，入口就是这个节点。空链表和单节点无环则直接返回空。

### 用 Set 记录访问节点不更容易吗？

更容易解释，也能直接找到第一次重复访问的节点。但额外空间是 O(n)。面试要根据空间要求选择，而不是把 Set 方案说成错误。

## 面试速记卡

> - 判环：慢走一步、快走两步，在环内比较节点身份。
> - 找入口：一个回头，另一个留在相遇点，随后同步走一步。
> - 距离依据：a + b 是环长的整数倍。
> - 复杂度：O(n) 时间，O(1) 额外空间。
> - 边界：空链表、单节点、自环都要检查。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
