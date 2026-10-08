# 如何用两个栈实现队列？为什么出队可以做到均摊 O(1)？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/cs-basics/q329-queue-with-two-stacks/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 **面试官：** 两个栈怎样实现队列？

🙋‍♂️ **我：** 入队放一个栈，出队把它倒进另一个栈。

🧑‍💻 **面试官：** 已经倒出 A、B，出队 A 后又来了 C。你现在把 C 倒过去，谁会先出？

🙋‍♂️ **我：** 如果随时倒，C 可能跑到 B 前面。

🧑‍💻 **面试官：** 所以什么时候能倒？你说每次 O(1)，是真的最坏 O(1) 吗？

> 关键不是“两只栈”，而是一个不变量：输出栈里还有旧元素，就不能把新元素压到它上面。

## 面试速答（60 秒版）

用输入栈接收入队元素，用输出栈提供队首。入队只压输入栈；出队或查看队首时，只有输出栈为空，才把输入栈的元素全部倒过去。

倒栈反转了顺序，让最早进入的元素出现在输出栈顶。输出栈不空时继续使用它，避免新元素插到旧元素前面。

一次转移可能处理 n 个元素，因此单次出队最坏是 O(n)。但每个元素最多经历一次输入入栈、一次转移和一次输出出栈，所以一串操作的均摊成本是 O(1)。

还要明确空队列契约，并测试交错入队、出队。不能只测先全部入队、再全部出队。

![两个栈，把顺序反转一次](https://note.lgdsunday.club/img/Q329/01-overview.webp)

*图：两个栈，把顺序反转一次。*

## 知识点详解：反转之后，旧元素先走

### A、B 入队后，谁在栈顶？

输入栈依次压入 A、B，顶上是 B。这是栈的后进先出，与队列希望 A 先出相反。

把输入栈全部弹出、依次压进输出栈，先压 B、再压 A，输出栈顶就成了 A。我们借第二次反转拿到了先进先出的顺序。

出队 A 之后，输出栈里还剩 B。此时 C 入队只进输入栈。等 B 也出队、输出栈为空，再转移 C。

### 条件为什么必须是输出栈为空？

如果 B 还在输出栈里，我们就把新来的 C 压上去，栈顶变成 C。下一次出队会越过 B，破坏队列顺序。

因此，两只栈的职责不是固定的一前一后，而是“待转移的新元素”和“已排好出队顺序的旧元素”。

#### TypeScript

```typescript
class TwoStackQueue {
  private input: number[] = [];
  private output: number[] = [];

  enqueue(value: number): void {
    this.input.push(value);
  }
  private prepare(): void {
    if (this.output.length === 0) {
      while (this.input.length > 0) {
        this.output.push(this.input.pop()!);
      }
    }
  }
  dequeue(): number | undefined {
    this.prepare();
    return this.output.pop();
  }
  peek(): number | undefined {
    this.prepare();
    return this.output.at(-1);
  }
}
```

#### Python

```python
class TwoStackQueue:
    def __init__(self):
        self.input = []
        self.output = []

    def enqueue(self, value):
        self.input.append(value)

    def _prepare(self):
        if not self.output:
            while self.input:
                self.output.append(self.input.pop())

    def dequeue(self):
        self._prepare()
        return self.output.pop() if self.output else None

    def peek(self):
        self._prepare()
        return self.output[-1] if self.output else None
```

示例只保存数值，空队列分别返回 undefined、None，避免与合法元素混淆。若要存任意值，可以使用更明确的返回结构或异常契约。实现目标与题意可对照 [LeetCode 用栈实现队列](https://leetcode.com/problems/implement-queue-using-stacks/)。

![旧元素没出完，新元素先等](https://note.lgdsunday.club/img/Q329/02-interleave-v2.webp)

*图：旧元素没出完，新元素先等。*

### 均摊 O(1)，为什么单次还能很慢？

如果积累了一万个元素，第一次出队可能一次转移全部。它不满足每次调用都严格常数时间。

但整串操作里，一个元素不会反复在两个栈之间来回搬。把每个元素经历的有限次栈操作加起来，总量与元素数量同阶，因此均摊可以是 O(1)，空间是 O(n)。

面试中说“均摊”，就是在交代统计范围，不是给每次请求许诺相同延迟。

## 面试官继续追问

**peek 会改变逻辑队列吗？**

可以改变内部两栈的布局，但不移除队首。外部看到的队列顺序与元素数量不变。

**并发调用能直接使用吗？**

这份示例没有并发同步。多个调用交错可能破坏状态，算法复杂度正确不等于并发契约完整。

## 面试速记卡

> - 入队：只进输入栈。
> - 出队：用输出栈，空时才整体转移。
> - 不变量：旧元素没出完，不把新元素压到它前面。
> - 成本：单次最坏 O(n)，一串操作均摊 O(1)。
> - 验证：重点测试入队、出队交错与空队列。

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
