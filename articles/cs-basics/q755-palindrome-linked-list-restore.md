# 如何判断回文链表？快慢指针与反转后半段怎样配合？

[腾讯后端面试真题](../companies/tencent-backend.md) · [Liblib开发面试真题](../companies/liblib-development.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/cs-basics/q755-palindrome-linked-list-restore/) · [题库目录](../../README.md)

*以下对话为教学模拟，用来讲解这道题。*

🧑‍💻 面试官：单链表怎样判断回文？

🙋‍♂️ 我：把值复制到数组，左右比较，时间 O(n)。

🧑‍💻 面试官：额外空间只能 O(1) 呢？单链表不能从尾巴往前走。

🙋‍♂️ 我：找到中点，把后半段反转，再比较两半。

🧑‍💻 面试官：奇数个节点怎么跳过中间值？比较到一半不相等就 return，原链表还恢复得了吗？

> 回文比较只是中间一步。找到两半、临时改向、比较以及恢复链接，需要一起设计。

## 面试速答（60 秒版）

判断回文链表，可以先用快慢指针找到前半段的末尾，再反转它后面的链表，让后半段可以从原来的尾部向中间遍历。

随后一根指针从头开始，另一根从反转后的后半段开始，逐项比较。以后半段的长度为准，奇数长度的中间节点就不需要参与配对。

如果要求函数不改变调用者看到的链表，比较结束后还要把后半段反转回来，再接回原位置。发现不相等时也必须走恢复路径，不能直接提前返回。

整个过程线性时间，只使用固定数量指针，额外空间 O(1)。前提是链表无环，比较期间没有其他代码并发读取或修改这些临时变化的链接。

![回文判定完整流程包括恢复](https://note.lgdsunday.club/img/Q755/01-palindrome-overview.webp)

## 知识点详解：反转以后方便比较，但别忘了把结构还回去

### 复制数组的方案错了吗？

没有。只要允许 O(n) 额外空间，把值放进数组再左右比较，通常很清楚，也不会临时改链表。

O(1) 空间的追问，才逼着我们利用链表本身。它不是让数值比较更神奇，而是要让单向的后半段换一个方向，方便从两端向中间比。

假设链表是 `1→2→3→2→1`。前半段末尾可以停在 3，反转它后面的 `2→1`，得到从尾部方向开始的 `1→2`。再和链表头的 1、2 比较，两对都相同即可。

中间的 3 不需要跟任何节点配对，它在回文里本来就只出现于中心。

### 快慢指针为什么停在前半段末尾？

slow 和 fast 都从 head 开始，只要 fast 后面还有两个节点，就让 slow 走一步、fast 走两步。

这样长度为 4 时，slow 停在第 2 个节点；长度为 5 时，slow 停在第 3 个节点。两种情况下，slow\.next 都是需要反转的后半段入口。

这套循环条件与“slow 停在第二半开头”的写法不同。不能先背一种找中点模板，再把另一种模板的反转起点接上来。

![slow停点与slow.next作为后半入口](https://note.lgdsunday.club/img/Q755/02-middle-even-odd.webp)

### 比较失败，仍然先恢复再返回

下面约定空链表和单节点链表都为回文；输入是无环单链表，节点值为整数。

#### TypeScript

```ts
type ListNode = { val: number; next: ListNode | null };

function reverseList(head: ListNode | null): ListNode | null {
  let previous: ListNode | null = null;
  while (head) {
    const next = head.next;
    head.next = previous;
    previous = head;
    head = next;
  }
  return previous;
}

function isPalindrome(head: ListNode | null): boolean {
  if (!head || !head.next) return true;
  let slow = head, fast = head;
  while (fast.next && fast.next.next) {
    slow = slow.next!;
    fast = fast.next.next;
  }
  const second = reverseList(slow.next);
  let first: ListNode | null = head, other = second;
  let matches = true;
  while (other) {
    if (first!.val !== other.val) { matches = false; break; }
    first = first!.next;
    other = other.next;
  }
  slow.next = reverseList(second);
  return matches;
}
```

#### Python

```python
from dataclasses import dataclass

@dataclass(eq=False)
class ListNode:
    val: int
    next: "ListNode | None" = None

def reverse_list(head):
    previous = None
    while head is not None:
        following = head.next
        head.next = previous
        previous, head = head, following
    return previous

def is_palindrome(head):
    if head is None or head.next is None:
        return True
    slow = fast = head
    while fast.next is not None and fast.next.next is not None:
        slow, fast = slow.next, fast.next.next
    second = reverse_list(slow.next)
    first, other, matches = head, second, True
    while other is not None:
        if first.val != other.val:
            matches = False
            break
        first, other = first.next, other.next
    slow.next = reverse_list(second)
    return matches
```

second 必须保留原入口，不能拿遍历到最后已经变为 null 的 other 去恢复。slow 也保留着连接位置，恢复以后把链表接回去。

这份整数示例的比较不会调用用户自定义比较器。若扩展为可能抛异常的比较函数，还应把恢复写进 finally，保证异常路径也能归还结构。

![反转后半段后用较短半段控制比较次数](https://note.lgdsunday.club/img/Q755/03-compare-reversed-half.webp)

### 三次走过一部分，为什么还是 O(n)？

找中点、反转、比较、再反转，每一项都是线性数量级，相加仍然 O(n)。空间则只有几根指针，没有按长度增长的数组、栈或递归调用。

但 O(1) 空间不代表完全没有副作用。比较期间，后半段链接暂时改变了。其他代码同时遍历，可能看到不完整的结构；只在调用结束恢复，不等于读者从来不会观察到变化。

题目基础定义与空间进阶要求见 [LeetCode 234](https://leetcode.com/problems/palindrome-linked-list/)。真实公共函数是否允许临时修改，应当再明确接口约定。

![失败分支必须恢复原节点链接](https://note.lgdsunday.club/img/Q755/04-mismatch-restore-links.webp)

## 面试官继续追问

### 不允许任何临时修改，也不允许额外数组怎么办？

需要重新讨论时间与空间约束。单链表缺少反向入口，不能一边禁止保存历史、一边禁止改链接，还不说明代价地承诺线性方案。数组方案可能就是更合适的接口选择。

### 链表有环呢？

当前前提不成立，找中点和遍历都可能不结束。输入可能有环时，先检测或拒绝，不能把回文问题和判环悄悄混在一套未说明的代码里。

### 怎样证明恢复的真是原链表？

测试前记录每个节点对象与 next，调用后逐个比较，不只比较值。尤其要测偶数、奇数、首对不相等和中间才不相等，防止失败分支提前返回。

## 面试速记卡

> - 中点约定：slow 停在前半段末尾，反转从 slow\.next 开始。
> - 奇数长度：后半段较短，中间节点不用配对。
> - 比较终点：以后半段结束为准。
> - 恢复结构：保留第二半入口与连接点，失败也先恢复。
> - 复杂度：时间 O(n)、额外空间 O(1)，但存在临时链接修改。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **腾讯 · 后端开发 · 日常实习**：怎样检测回文链表？（题意整理）。[面经来源](https://www.nowcoder.com/feed/main/detail/63b4b82b0b8c476d9ab4474d551d8995)；原帖编辑于 2025-10-23。
- **Liblib · 开发（Lovart；原帖未明确细分岗位） · 社招**：怎样判断回文链表？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/882048490270904320)；原帖编辑于 05-07（页面未明确年份）。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
