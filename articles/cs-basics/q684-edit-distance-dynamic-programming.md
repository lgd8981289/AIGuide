# 编辑距离怎么求？插入、删除和替换的动态规划状态如何定义？

[虾皮Agent开发面试真题](../companies/shopee-agent.md) · [蚂蚁集团算法面试真题](../companies/ant-algorithm.md) · [腾讯后端面试真题](../companies/tencent-backend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/cs-basics/q684-edit-distance-dynamic-programming/) · [题库目录](../../README.md)

*下面是用于讲题的模拟面试对话。*

🧑‍💻 **面试官：** 一个字符串变成另一个，允许插入、删除、替换，最少几步？

🙋‍♂️ **我：** 用二维动态规划，比较两个字符串的当前位置。

🧑‍💻 **面试官：** dp\[i]\[j] 到底表示字符下标，还是前缀长度？

🙋‍♂️ **我：** 表示源串前 i 个字符变成目标串前 j 个字符的最少操作数。

🧑‍💻 **面试官：** 那 dp\[i]\[0] 为什么不是 0？字符相等时，又为什么可以从左上角直接继承？

> 先把状态定义成两段前缀，再问最后一步做了什么。三种操作，分别对应三种缩小问题的方法。

## 面试速答（60 秒版）

定义 dp\[i]\[j] 为源串前 i 个字符变成目标串前 j 个字符的最小操作数。空前缀也要进表，所以数组大小是长度各加一。

源串变空需要删除 i 次，空串变目标需要插入 j 次，因此第一列和第一行分别初始化为 i、j。

如果末尾字符相等，可以直接使用 dp\[i-1]\[j-1]；不相等时，删除对应 dp\[i-1]\[j]+1，插入对应 dp\[i]\[j-1]+1，替换对应 dp\[i-1]\[j-1]+1，取最小。

时间 O(mn)，二维实现空间 O(mn)。可以用滚动数组压缩，但面试时应先把状态与三种操作讲明白，再考虑省空间。

![编辑距离，比较两个前缀](https://note.lgdsunday.club/img/Q684/01-edit-distance-dynamic-programming.webp)

## 知识点详解：最后一步，怎样落到三个邻居格子？

### 前缀长度，让空字符串也有位置

假设把 `cat` 变成 `cut`，替换中间一个字符就能完成。动态规划要解决的不是只比较这一组，而是逐步得到所有前缀组合的最优结果。

dp\[0]\[2] 表示空串变成目标的前两个字符，需要插入两次。dp\[2]\[0] 则是把源串前两个字符删除，不能初始化成 0。[LeetCode 72 原题](https://leetcode.cn/problems/edit-distance/)限定每种操作的单位成本。

本文按题目的字符范围实现。真实 Unicode 文本还要定义按字节、码点还是用户可见字符计数；不能把 JS 字符串下标与所有语言的字符单位直接等同。

### 三个来源格子，分别已经完成哪一段？

| 最后一步   | 前面已经解决的问题            | 为什么加一         |
| ------ | -------------------- | ------------- |
| 删除源串末尾 | 前 i-1 个源字符变前 j 个目标字符 | 再删掉第 i 个源字符   |
| 插入目标末尾 | 前 i 个源字符变前 j-1 个目标字符 | 再补目标最后一个字符    |
| 替换末尾   | 前 i-1 个变前 j-1 个      | 把剩下这个字符改成目标末尾 |

插入最容易讲反。它不消耗一个新的源字符，所以来源是左边，不是上边。坚持“源变目标”的方向，公式就更容易对上。

字符相同则无需为最后字符付费，直接接到两个更短前缀的结果上。

![当前格子，来自哪三个更小问题？](https://note.lgdsunday.club/img/Q684/02-edit-distance-dynamic-programming.webp)

### 先写二维表，把依赖关系摆出来

#### TypeScript

```typescript
function editDistance(source: string, target: string): number {
  const m = source.length, n = target.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = source[i - 1] === target[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}
```

#### Python

```python
def edit_distance(source: str, target: str) -> int:
    m, n = len(source), len(target)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1):
        dp[i][0] = i
    for j in range(n + 1):
        dp[0][j] = j
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if source[i - 1] == target[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = 1 + min(
                    dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]
                )
    return dp[m][n]
```

Python 不能用同一行列表引用重复出全部行，否则更新一个单元可能同时改到其他行。上面的逐行构造避免了这个问题。

## 面试官继续追问

### 只要距离，为什么可以滚动压缩？

当前格只依赖上一行和当前行左侧。压成一行时，要额外保存被覆盖前的左上值，不能边覆盖边把新值误当旧行数据。

### 要输出具体修改步骤呢？

需要保留或重建选择路径，并定义多个最优解时的取舍。只返回一个最小数值，不包含操作顺序。测试应覆盖空串、完全相同、单次插删替换和重复字符。

## 面试速记卡

> - 状态：源前 i 个字符变目标前 j 个字符的最少操作。
> - 边界：空目标删除 i 次，空源插入 j 次。
> - 不同：上方删除、左方插入、左上替换，各加一取最小。
> - 相同：末尾无需操作，继承左上。
> - 复杂度：时间 O(mn)，二维空间 O(mn)，先解释再压缩。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **虾皮 · Agent开发 · 秋招（原帖标签）**：怎样实现编辑距离算法？（题意整理）。[面经来源](https://www.nowcoder.com/feed/main/detail/409dc8793a7b450eb51ee32c2b923d49)；原帖记录 9 月 3 日面试，未明确年份。
- **蚂蚁集团 · NLP算法（AI Force） · 原帖未明确批次**：口述编辑距离算法。（题意整理）。[面经来源](https://www.nowcoder.com/feed/main/detail/7a19a8175ce741908e2a1c4a48f179bb)；正文记录 10 月 21 日、10 月 24 日面试，未明确面试年份；原帖编辑于 2025-03-25。
- **腾讯 · C++后端 · 校招（原帖标签）**：怎样求最小编辑距离？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353155945926696960)；原帖编辑于 2019-11-30。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
