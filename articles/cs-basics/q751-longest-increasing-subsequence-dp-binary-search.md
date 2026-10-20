# 最长递增子序列怎么求？动态规划和二分 tails 为什么都正确？

[字节后端面试真题](../companies/bytedance-backend.md) · [快手测试开发面试真题](../companies/kuaishou-test-development.md) · [微软开发面试真题](../companies/microsoft-development.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/cs-basics/q751-longest-increasing-subsequence-dp-binary-search/) · [题库目录](../../README.md)

*以下对话为教学模拟，用来讲解这道题。*

🧑‍💻 面试官：最长递增子序列，能不能先排序再找？

🙋‍♂️ 我：排序以后都递增，长度应该更容易求。

🧑‍💻 面试官：但原数组的先后顺序不能改。那用 tails 加二分时，tails 最后保存的就是答案序列吗？

🙋‍♂️ 我：它长度是答案，里面的元素不一定能按原顺序连起来。

🧑‍💻 面试官：既然它可能不是一条真实序列，替换尾巴为什么还不影响长度的正确性？

> tails 记录的是「每种长度能做到的最小结尾」，不是拼好的一条最长序列。

## 面试速答（60 秒版）

最长递增子序列要求保留原来的先后顺序，但不要求连续，严格递增还意味着相等数字不能接在一起。

可以先用动态规划，令 dp\[i] 表示以第 i 个数结尾的最长长度。检查前面比它小的数，把对应长度加一，取最大值，整体时间 O(n²)。

优化时维护 tails，tails\[k] 表示长度为 k+1 的递增子序列能达到的最小结尾。新数字越小，越方便以后接上更大的数字，因此可以用它替换第一个大于等于自己的结尾；找不到就追加，说明能形成更长序列。

tails 保持有序，可以二分查找，时间降到 O(n log n)，空间 O(n)。最后 tails 的长度是答案，但要输出具体序列，还需要额外保存前驱和位置，不能直接返回 tails。

![DP按结尾求长度与tails按长度存最小结尾](https://note.lgdsunday.club/img/Q751/01-lis-overview.webp)

## 知识点详解：把“整个序列”缩成“长度与结尾”

### 为什么不能只看当前最大的数字？

咱们看 `[3, 5, 6, 2, 4]`。`[3, 5, 6]` 是长度 3 的递增子序列，`[2, 4]` 是长度 2 的。2 出现得晚，不能拿它接到更早的 5 前面。

因此，先排序会破坏题目保留的顺序。我们需要一边从左往右读，一边保存“到目前为止，有哪些可以继续接的状态”。

动态规划先把状态说得最直接。对于位置 i，只要前面某个 j 满足 `nums[j] < nums[i]`，就可以把 nums\[i] 接到以 j 结尾的最优序列上。

所以 `dp[i] = max(1, dp[j] + 1)`，其中 j 必须位于 i 前面且值更小。答案是所有 dp 的最大值，不一定是最后一个 dp，因为最长序列未必以最后一个数字结尾。

### 同样长度，为什么只保留最小结尾？

假设已经找到两条长度相同的递增子序列，一个结尾是 5，另一个结尾是 8。以后遇到 6，前一条能接，后一条不能；以后遇到 9，两条都能接。

因此，只求长度时，结尾较小的状态至少不比结尾较大的差。两条序列内部怎样排列，不影响这次“以后能不能接”的判断。

![最小结尾代表未来可扩展性](https://note.lgdsunday.club/img/Q751/02-smallest-ending-dominance.webp)

tails 就按长度记录这个最小结尾。注意每个位置可以由不同的真实序列支持，它们不需要共同组成同一条序列。

上面的数组逐步得到：`[3]`、`[3,5]`、`[3,5,6]`、`[2,5,6]`、`[2,4,6]`。最后的 2、4 都出现在 6 后面，因此 `[2,4,6]` 不是原数组的子序列，但长度 3 仍然由真实的 `[3,5,6]` 支持。

![tails最终状态可由不同真实子序列支持](https://note.lgdsunday.club/img/Q751/03-tails-not-sequence.webp)

### 为什么找第一个大于等于 x 的位置？

假设这个位置为 p，前一个结尾就小于 x，因此长度 p 的序列可以接上 x，形成长度 p+1 的序列。用 x 替换 tails\[p]，只会让这个长度的结尾更小，不会让已有长度消失。

如果所有结尾都小于 x，就能接到当前最长状态后面，长度增加一。反过来，如果最长长度的最小结尾都不小于 x，说明当前没有任何一条最长序列能接上 x，自然不能靠这次加入再增长一位。

tails 的最小结尾按长度严格递增，因此可以二分。这里找大于等于，而不是大于，正是为了让重复数字替换旧结尾，不把 `[2,2]` 算成严格递增的长度 2。

![strict LIS二分first>=与相等值的边界](https://note.lgdsunday.club/img/Q751/04-lower-bound-duplicate.webp)

### 两种实现，使用同一个定义

下面约定输入为有限整数数组，也接受空数组并返回 0；算法不修改输入。

#### TypeScript

```ts
function lisDP(nums: readonly number[]): number {
  const dp = Array(nums.length).fill(1) as number[];
  let best = 0;
  for (let i = 0; i < nums.length; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[j] < nums[i]) dp[i] = Math.max(dp[i], dp[j] + 1);
    }
    best = Math.max(best, dp[i]);
  }
  return best;
}

function lis(nums: readonly number[]): number {
  const tails: number[] = [];
  for (const x of nums) {
    let lo = 0, hi = tails.length;
    while (lo < hi) {
      const mid = lo + Math.floor((hi - lo) / 2);
      if (tails[mid] < x) lo = mid + 1;
      else hi = mid;
    }
    tails[lo] = x;
  }
  return tails.length;
}
```

#### Python

```python
from bisect import bisect_left

def lis_dp(nums):
    dp = [1] * len(nums)
    best = 0
    for i, x in enumerate(nums):
        for j in range(i):
            if nums[j] < x:
                dp[i] = max(dp[i], dp[j] + 1)
        best = max(best, dp[i])
    return best

def lis(nums):
    tails = []
    for x in nums:
        pos = bisect_left(tails, x)
        if pos == len(tails):
            tails.append(x)
        else:
            tails[pos] = x
    return len(tails)
```

题目定义与复杂度进阶要求见 [LeetCode 300](https://leetcode.com/problems/longest-increasing-subsequence/)。这份实现只求长度，不能把复杂度结论直接套给“枚举所有最长序列”。

## 面试官继续追问

### 如果改成不下降子序列呢？

相等数字可以接在后面，要找第一个严格大于 x 的位置，Python 可用 bisect\_right。比较符号变化来自题目定义，不是二分模板可以随便互换。

### 输出一条真实最长序列，需要加什么？

给每个结尾保存原下标，并在处理 x 时记录长度少一的前驱下标。最后从最长状态的末尾沿前驱回溯。不能只看最终 tails，因为上面已经展示它未必遵守原位置顺序。

### 怎样确认二分优化没有把答案换掉？

小数组枚举全部子序列，作为独立答案，再同时检查 dp 与 tails。覆盖空数组、全相等、全下降和“后面的小数字替换前面结尾”的情况。Q277 讲的是 Vue 如何利用 LIS 减少 DOM 移动，本题则证明这个通用算法为什么成立。

## 面试速记卡

> - 子序列：保留先后顺序，不要求连续，也不能先排序。
> - dp\[i]：以位置 i 结尾的最优长度，不是整个前缀答案。
> - tails\[k]：长度 k+1 能做到的最小结尾，不是一条现成序列。
> - 严格递增：找第一个大于等于 x 的位置，重复值不增长。
> - 恢复序列：另存位置和前驱；仅求长度为 O(n log n)。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **字节跳动 · 后端开发（国际化电商） · 实习**：怎样求最长递增子序列的长度？怎样返回一条对应的最长子序列？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353159571466297344)；原帖发布于 2022-04-19。
- **快手 · 测试开发 · 秋招**：怎样求最长递增子序列的长度？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/519138993645068288)；原帖编辑于 2023-09-06。
- **微软 · 研发（STCA；原帖未明确细分岗位） · 暑期实习**：怎样求最长递增子序列的长度？怎样返回一条对应的最长子序列？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353159329639505920)；原帖编辑于 2022-04-15。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
