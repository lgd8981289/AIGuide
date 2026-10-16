# 接雨水怎么做？双指针如何在 O(n) 时间内计算积水量？

[美团算法面试真题](../companies/meituan-algorithm.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/cs-basics/q682-trapping-rain-water-two-pointers/) · [题库目录](../../README.md)

*下面是用于讲题的模拟面试对话。*

🧑‍💻 **面试官：** 一排柱子下雨，怎么求能接多少水？

🙋‍♂️ **我：** 每个位置看左右最高柱子，取较小高度，再减掉当前柱高。

🧑‍💻 **面试官：** 每个位置都重新往两边扫，复杂度是多少？

🙋‍♂️ **我：** 会到 O(n²)，可以先存前后最高值。

🧑‍💻 **面试官：** 如果不存两个数组，你怎么证明双指针每次能算准其中一侧？

> 较小的一侧边界已经足够结算：另一边至少有这么高，再往里找到更高柱子，也不会改变这一格的水位上限。

## 面试速答（60 秒版）

这道题先按每根柱子计算。一个位置的水量，等于左右最高柱子中较小的高度，减去当前柱高；柱宽按题意为 1。

可以用左右两个指针，分别维护已经看到的左侧最高值和右侧最高值。每轮先更新两边最高值，再结算较小最高值对应的一侧，并向中间移动。

如果左侧最高值较小，右边已经存在不低于它的边界，左侧这一格的上限就确定了；右侧同理。每次至少处理一个位置，时间 O(n)，额外空间 O(1)。

边界要检查空数组、单调排列和相同高度。关键是结算规则与最高值定义保持一致，不把两种双指针写法的条件随便拼到一起。

![接雨水，先找两侧最高处](https://note.lgdsunday.club/img/Q682/01-trapping-rain-water-two-pointers.webp)

## 知识点详解：先按一格算，再把辅助数组省掉

### 水位由短边决定，水量要减去柱子

假设柱高是 `[4,1,3,1,5]`。中间三个位置左右都被边界挡住，水位能到 4，对应水量分别为 3、1、3，总共 7。

不要把这题当成找两根最远柱子的面积。每一格自己的柱子也占空间，而且内部高低不一样。[LeetCode 42 原题](https://leetcode.cn/problems/trapping-rain-water/)限定了这类柱状地形。

先存左右最高值的解法很好理解，也可以作为验证用的基准。双指针是在这个关系上省空间，不是换成一个没有依据的贪心猜测。

### 为什么较小最高值这一侧能提前算？

设当前左侧最高值为 leftMax，右侧最高值为 rightMax，且 leftMax 不大于 rightMax。

对于当前左位置，左边界已经确定。右边我们至少看见了一根达到 rightMax 的柱子，所以它不缺高度为 leftMax 的挡板。未检查的中间即使更高，也不会让较短的左边界升高。

因此这一格可以按 leftMax 减当前柱高结算。接着左指针右移。反过来，rightMax 更小时就结算右位置。

![较小的已知最高值，可以先结算](https://note.lgdsunday.club/img/Q682/02-trapping-rain-water-two-pointers.webp)

### 代码让最高值的定义始终一致

以下假设输入满足非负整数柱高，不把参数校验混进算法主线。

#### TypeScript

```typescript
function trap(height: number[]): number {
  let left = 0, right = height.length - 1;
  let leftMax = 0, rightMax = 0, water = 0;
  while (left <= right) {
    leftMax = Math.max(leftMax, height[left]);
    rightMax = Math.max(rightMax, height[right]);
    if (leftMax <= rightMax) {
      water += leftMax - height[left];
      left++;
    } else {
      water += rightMax - height[right];
      right--;
    }
  }
  return water;
}
```

#### Python

```python
def trap(height: list[int]) -> int:
    left, right = 0, len(height) - 1
    left_max = right_max = water = 0
    while left <= right:
        left_max = max(left_max, height[left])
        right_max = max(right_max, height[right])
        if left_max <= right_max:
            water += left_max - height[left]
            left += 1
        else:
            water += right_max - height[right]
            right -= 1
    return water
```

每轮已经把当前柱高纳入最高值，结算不会出现负水量。最后剩一格时也按相同规则处理，不需要额外补一段特殊公式。

## 面试官继续追问

### 为什么两个指针里面还有循环，却不是 O(n²)？

这里只有一层处理循环，每轮至少让一个指针向内移动。全部位置被结算一次，移动总量与 n 成正比。

### 怎样检查条件没有写反？

用前后最高数组或逐格暴力计算作对照，覆盖空、全平、严格递增、严格递减和多个凹槽，再随机生成短数组比较。只测一个经典样例，容易漏掉边界定义混用。

## 面试速记卡

> - 逐格公式：min(左最高, 右最高) 减当前柱高。
> - 结算条件：本文先更新两侧最高值，再处理较小最高值一侧。
> - 依据：对侧已有足够高的边界，未知中间不再影响这一格。
> - 复杂度：时间 O(n)，额外空间 O(1)。
> - 验证：用暴力或前后数组解法对拍短随机输入。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **美团 · 搜推算法 · 26届秋招（原帖标签）**：怎样解决接雨水问题？（题意整理）。[面经来源](https://www.nowcoder.com/feed/main/detail/064ff826ba01411294afe698056a759f)；正文记录 8 月技术面；原帖发布于 2025-08-29。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
