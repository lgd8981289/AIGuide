# 滑动窗口最大值怎么求？单调队列为什么能做到 O(n)？

[百度开发面试真题](../companies/baidu-development.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/cs-basics/q692-sliding-window-maximum-deque/) · [题库目录](../../README.md)

下面是一段模拟面试对话。

🧑‍💻 面试官：窗口每向右移动一格，怎么得到里面的最大值？

🙋‍♂️ 我：记住上一次最大值，再和新进来的数比较。

🧑‍💻 面试官：如果上一次最大值刚好离开窗口呢？

🙋‍♂️ 我：那就重新遍历窗口。

🧑‍💻 面试官：数组严格递减时，每移动一次都要重新遍历。能不能提前保存还可能成为最大值的元素？

> 单调队列保存的是“仍有机会成为最大值”的候选下标。更小、又更早离开的元素，可以提前淘汰。

## 面试速答（60 秒版）

我会用一个双端队列保存候选元素的下标，下标从头到尾递增，对应数值从大到小排列。

每加入一个新元素，先从队头移除已经离开窗口的下标，再从队尾移除小于或等于新值的候选，然后把新下标放进去。窗口形成后，队头对应的值就是最大值。

队尾这些旧值更小，而且比新元素更早过期。只要它们还在窗口里，新元素也在，所以它们之后不可能胜过新元素。

每个下标只入队一次、出队至多一次，总时间是 O(n)。队列最多保留一个窗口的候选，辅助空间 O(k)。实现时要用真正支持高效头尾操作的结构，不能在普通数组上反复 `shift()`，再直接声称 O(n)。

![窗口最大值，留下有效候选](https://note.lgdsunday.club/img/Q692/01-sliding-window-maximum-deque.webp)

## 知识点详解：为什么可以放心删掉队尾？

### 先区分两种“删除”

一种是过期删除。窗口右端在 i 时，左端是 `i-k+1`，比这个位置更早的下标已经不属于窗口，应当从队头移除。

另一种是淘汰删除。新元素进来后，把队尾不大于它的旧元素移除。它们可能还没过期，但已经不值得继续保存。

这两种删除的依据不同。前者检查位置，后者比较数值。只存数值很容易把重复元素和过期位置弄混，因此这里存下标。原题见 [LeetCode 239](https://leetcode.cn/problems/sliding-window-maximum/)。

### 用一个具体窗口看候选怎样变化

假设数组是 `[4,2,3,1,5]`，窗口长度为 3。

| 读到的下标和值 | 操作后的候选下标 | 对应数值    | 已形成窗口的最大值 |
| ------- | -------- | ------- | --------- |
| 0，值 4   | `[0]`    | `[4]`   | 尚未形成窗口    |
| 1，值 2   | `[0,1]`  | `[4,2]` | 尚未形成窗口    |
| 2，值 3   | `[0,2]`  | `[4,3]` | 4         |
| 3，值 1   | `[2,3]`  | `[3,1]` | 3         |
| 4，值 5   | `[4]`    | `[5]`   | 5         |

读到 3 时，旧值 2 被淘汰。因为 3 比它大，且出现得更晚，只要 2 还没有离开窗口，3 就一定还在。

再往后，4 离开窗口，先前留下来的 3 就接上了最大值的位置。这正是只保存一个最大值做不到的事。

相等时也可以淘汰旧下标。留下更新的那个，值不变，却能在后续窗口里保留更久。保留相等值也能写对，只是队列规则和代码要一致。

![过期删队头，被压过删队尾](https://note.lgdsunday.club/img/Q692/02-sliding-window-maximum-deque.webp)

### TypeScript 用环形数组，Python 用 deque

这里约定 k 是正整数。空数组返回空结果；非空数组要求 k 不大于数组长度。TypeScript 使用容量为 `k+1` 的环形数组，空出一格区分首尾相等的空队列，避免 `shift()` 的移动成本。

**TypeScript**

```typescript
function maxSlidingWindow(nums: number[], k: number): number[] {
  if (!Number.isInteger(k) || k <= 0) throw new RangeError("invalid k");
  if (nums.length === 0) return [];
  if (k > nums.length) throw new RangeError("k exceeds length");
  const capacity = k + 1;
  const deque = new Array<number>(capacity);
  let head = 0, tail = 0;
  const result: number[] = [];
  for (let i = 0; i < nums.length; i++) {
    while (head !== tail && deque[head] <= i - k) {
      head = (head + 1) % capacity;
    }
    while (head !== tail) {
      const back = (tail - 1 + capacity) % capacity;
      if (nums[deque[back]] > nums[i]) break;
      tail = back;
    }
    deque[tail] = i;
    tail = (tail + 1) % capacity;
    if (i >= k - 1) result.push(nums[deque[head]]);
  }
  return result;
}
```

**Python**

```python
from collections import deque

def max_sliding_window(nums: list[int], k: int) -> list[int]:
    if type(k) is not int or k <= 0:
        raise ValueError("invalid k")
    if not nums:
        return []
    if k > len(nums):
        raise ValueError("k exceeds length")
    candidates: deque[int] = deque()
    result = []
    for i, value in enumerate(nums):
        while candidates and candidates[0] <= i - k:
            candidates.popleft()
        while candidates and nums[candidates[-1]] <= value:
            candidates.pop()
        candidates.append(i)
        if i >= k - 1:
            result.append(nums[candidates[0]])
    return result
```

Python 的 [deque 官方文档](https://docs.python.org/3/library/collections.html#collections.deque)说明了两端追加和弹出的效率。上面的 O(k) 是辅助队列空间，不包含必须返回的答案数组。

### 两层 while，为什么没有变成 O(nk)？

不能只看到嵌套就把次数相乘。

一个旧下标被队尾淘汰以后，不会再次回来；从队头过期以后，同样不会再被处理。整个过程中，n 个下标各入队一次，各出队至多一次。把所有轮的弹出次数加在一起，最多 n 次。

单独一轮可能弹出很多候选，但后面没有机会反复弹出这些候选。这是摊还分析得到 O(n) 的原因。

## 面试官继续追问

![环形队列，避免反复移动数组](https://note.lgdsunday.club/img/Q692/03-sliding-window-maximum-deque.webp)

### 用堆也能做吗？

可以用最大堆保存数值和下标，读取堆顶时清理过期元素。要注意，惰性删除只清理堆顶，其他过期元素可能长期留在堆内，不能未经证明就把空间写成 O(k)。需要额外删除机制或定期重建来控制体积。

### 单调栈和单调队列怎么区分？

每日温度关心尚未找到更高温度的旧位置，通常只需要操作栈顶。滑动窗口还要从另一端移除过期元素，因此需要双端队列。可以关联 Q683 一起比较。

### 哪些输入最容易暴露错误？

严格递增、严格递减、所有元素相同、负数、k 为 1、k 等于数组长度。短数组可以直接枚举每个窗口求最大值，和优化版本逐项比较。

## 面试速记卡

> - 队列存下标，方便同时判断过期和比较数值。
> - 队头删除过期元素，队尾删除被新值压过的旧候选。
> - 新元素更大且更晚过期，旧候选才可以永久淘汰。
> - 每个下标入队一次、出队至多一次，总时间 O(n)。
> - 辅助空间 O(k)，实现不能偷偷引入线性队头删除。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **百度 · 大数据研发 · 校招秋招**：怎样求滑动窗口最大值，并将优先队列解法优化为单调队列？（题意整理）。[面经来源](https://www.nowcoder.com/feed/main/detail/54e8743123f7489aa042752a805b0529)；正文记录 8 月 22 日三面结束；原帖发布于 2023-08-22。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
