# K 个一组反转链表怎么实现？不足 K 个节点时怎样处理？

[字节前端面试真题](../companies/bytedance-frontend.md) · [阿里开发面试真题](../companies/alibaba-development.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/cs-basics/q687-reverse-nodes-k-group/) · [题库目录](../../README.md)

*下面是用于讲题的模拟面试对话。*

🧑‍💻 **面试官：** 链表每 K 个节点一组反转，最后不足 K 个不变，怎么做？

🙋‍♂️ **我：** 逐组反转，再把前后接起来。

🧑‍💻 **面试官：** 如果反到一半才发现这一组不够 K 个，你准备再反回去？

🙋‍♂️ **我：** 应该先找齐本组边界，再开始改指针。

🧑‍💻 **面试官：** 反转后谁是新头、谁是新尾？下一组入口又从哪里找？

> 先确定一整组，再同时记住组前节点、组后节点和旧组头。反转只是中间一步，前后重新接好才算完成。

## 面试速答（60 秒版）

用虚拟头节点统一处理第一组，groupPrev 指向当前组之前的节点。每轮先向后找 K 个节点，找不齐就直接结束，保留剩余链表。

找齐以后，保存第 K 个节点以及它后面的 groupNext，再反转当前组。旧组头会成为新组尾，第 K 个节点成为新组头。

然后把 groupPrev 接到新组头，把新组尾接到 groupNext，并让 groupPrev 移到旧组头，准备下一组。实现时把初始 prev 设为 groupNext，可以在反转中完成尾部衔接。

每个节点被有限次访问，时间 O(n)，迭代辅助空间 O(1)。要改的是 next 指针，不是只交换节点值；空链、K=1 和不足整组都要检查。

![K 个一组，先检查再反转](https://note.lgdsunday.club/img/Q687/01-reverse-nodes-k-group.webp)

## 知识点详解：先圈定一组，再动里面的箭头

### 不足 K 个，为什么要在改动之前发现？

假设链表为 `2→4→6→8→10`，K 为 3。第一组变成 `6→4→2`，后面 `8→10` 不足一组，保持原样。

先检查边界，就能直接把尾巴留下。边反边数也能设计恢复逻辑，但会增加无必要的指针改动和证明成本。[LeetCode 25 原题](https://leetcode.cn/problems/reverse-nodes-in-k-group/)还要求真正交换节点关系，不能只换内部值。

### 四个位置，先写在纸上

groupPrev 是本组前驱，kth 是本组最后一个节点，groupNext 是下一段入口，oldHead 是本组最初的头。

反转结束以后，kth 是新头，oldHead 是新尾。groupPrev 接向 kth，下一轮的 groupPrev 则移动到 oldHead。

特别注意在修改 next 之前保存当前节点的后继。否则箭头一改，后半段入口就丢了。

![一组反转，保留四个连接位置](https://note.lgdsunday.club/img/Q687/02-reverse-nodes-k-group.webp)

### 迭代实现避免额外递归栈

示例假设链表无环，K 是正整数；无效 K 会明确拒绝。

#### TypeScript

```typescript
class ListNode {
  constructor(public value: number, public next: ListNode | null = null) {}
}

function reverseKGroup(head: ListNode | null, k: number): ListNode | null {
  if (!Number.isInteger(k) || k <= 0) throw new Error("k 必须是正整数");
  const dummy = new ListNode(0, head);
  let groupPrev = dummy;
  while (true) {
    let kth: ListNode | null = groupPrev;
    for (let i = 0; i < k && kth !== null; i++) kth = kth.next;
    if (kth === null) break;
    const groupNext: ListNode | null = kth.next;
    const oldHead = groupPrev.next!;
    let previous: ListNode | null = groupNext;
    let current: ListNode | null = oldHead;
    while (current !== groupNext) {
      const following: ListNode | null = current!.next;
      current!.next = previous;
      previous = current;
      current = following;
    }
    groupPrev.next = kth;
    groupPrev = oldHead;
  }
  return dummy.next;
}
```

#### Python

```python
class ListNode:
    def __init__(self, value: int, next_node=None):
        self.value, self.next = value, next_node

def reverse_k_group(head, k: int):
    if type(k) is not int or k <= 0:
        raise ValueError("k 必须是正整数")
    dummy = ListNode(0, head)
    group_prev = dummy
    while True:
        kth = group_prev
        for _ in range(k):
            kth = kth.next
            if kth is None:
                break
        if kth is None:
            break
        group_next = kth.next
        old_head = group_prev.next
        previous, current = group_next, old_head
        while current is not group_next:
            following = current.next
            current.next = previous
            previous, current = current, following
        group_prev.next = kth
        group_prev = old_head
    return dummy.next
```

代码里没有单独给 oldHead.next 赋 groupNext，因为反转时 previous 从 groupNext 开始，第一步就已经建立这条尾部连接。

## 面试官继续追问

### 检查 K 个、又反转 K 个，为什么仍是 O(n)？

每一整组最多扫描和反转各一次，总工作量与节点数成正比。不能看到两次遍历就直接判平方复杂度。

![先确认够 K 个，再改指针](https://note.lgdsunday.club/img/Q687/03-reverse-nodes-k-group.webp)

### 怎么确认没丢节点或生成环？

除了比较最终值顺序，还要记录输入节点身份，检查输出恰好包含这些节点一次，并确认无环。覆盖恰好 K、K+1、多整组和尾部不足，不只看头节点是不是换对。

## 面试速记卡

> - 先检查：找齐 K 个才改指针，不足保留原样。
> - 先保存：组前、组后、旧组头与第 K 个节点。
> - 反转后：kth 成新头，oldHead 成新尾。
> - 接回：前驱接新头，新尾通向下一段，前驱再移动。
> - 验证：顺序、节点身份、无丢失和无环一起查。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **字节跳动 · 前端 · 实习**：怎样实现 K 个一组反转链表？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/756639561995870208)；原帖发布于 2025-05-26。
- **阿里巴巴 · 基础平台研发 · 实习（原帖提及实习时长）**：怎样实现 LeetCode 25 的 K 个一组反转链表？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/893146683545034752)；正文记录 5 月 28 日面试，页面显示 06-10 编辑；未明确年份。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
