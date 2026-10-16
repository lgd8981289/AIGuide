# 最长回文子串怎么求？中心扩展法和动态规划有什么区别？

[字节后端面试真题](../companies/bytedance-backend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/cs-basics/q562-longest-palindromic-substring/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：最长回文子串怎么求？

🙋‍♂️ 我：从每个字符向两边扩展，取最长。

🧑‍💻 面试官：abba的中心在哪个字符上？

🙋‍♂️ 我：它的中心在两个b中间，也要处理。

🧑‍💻 面试官：为什么不能直接用滑动窗口？如果用DP，dp\[i]\[j]的含义和计算顺序是什么？

> 回文靠两端对称扩展；奇数和偶数的中心都要检查，不能只围着字符找。

## 面试速答（60 秒版）

最长回文子串要求连续，左右读起来相同。中心扩展法枚举每个字符中心和相邻字符之间的中心，向两侧比较，相同就继续，不同或越界就停止。

字符中心处理奇数长度，中间空隙处理偶数长度。每次记录最长区间，最后再截取答案，最坏时间O(n²)，额外状态O(1)。

动态规划则用 `dp[i][j]` 表示区间是否回文。两端相同，并且内部区间是回文，当前区间才成立；长度1和2需要处理边界。常规表格版时间和空间都是O(n²)。

只求一段最长答案时，我会先用中心扩展，思路和空间都简单。题目若需要反复查询区间回文，再评估DP等方案，不能凭“动态规划”三个字就认为它更快。

![回文有两类中心](https://note.lgdsunday.club/img/Q562/01-overview.webp)

## 知识点详解：抓住对称中心，再比较两种状态组织方式

### 子串连续，不能靠跳过字符拼答案

假设字符串 `abca`。两端的a相同，却不能因此说整段回文，中间b与c还要对应。

子序列可以跳过字符，子串不可以。最长回文子串与最长回文子序列，是两道不同题，转移也不同。

回文有一个更直接的特点，从中心往两侧，同一距离上的字符必须相同。这个特点可以直接变成搜索步骤。

### 奇数中心在字符，偶数中心在空隙

`aba`从b开始，比较左右的a；`abba`从两个b之间开始，先比较b，再比较外层a。

因此每个位置做两次扩展，分别从 `(i,i)` 和 `(i,i+1)` 开始。最后一个位置的偶中心会立即越界，正常停止即可。

扩展过程中只保存左右下标和最佳长度，不必每次都截出候选字符串。重复生成子串会增加本来没有必要的复制成本。

![先比内层，再向外扩](https://note.lgdsunday.club/img/Q562/02-expansion.webp)

### 两种语言实现，统一同长答案规则

下面约定同样长度时保留更早发现的区间；中心按从左到右枚举，所以最终取最早的一段。

**TypeScript**

```typescript
function longestPalindrome(s: string): string {
  let start = 0, best = 0;
  function expand(left: number, right: number): void {
    while (left >= 0 && right < s.length && s[left] === s[right]) {
      left--; right++;
    }
    const len = right - left - 1;
    if (len > best) { start = left + 1; best = len; }
  }
  for (let i = 0; i < s.length; i++) {
    expand(i, i);
    expand(i, i + 1);
  }
  return s.slice(start, start + best);
}
```

**Python**

```python
def longest_palindrome(s):
    start = best = 0
    for i in range(len(s)):
        for left, right in ((i, i), (i, i + 1)):
            while left >= 0 and right < len(s) and s[left] == s[right]:
                left -= 1
                right += 1
            size = right - left - 1
            if size > best:
                start, best = left + 1, size
    return s[start:start + best]
```

示例限定ASCII字符，空串返回空串。TS字符串下标是UTF-16代码单元，Python字符串下标按Unicode码点；如果题目涉及emoji或组合字符，需要先明确比较单位，不能说两版对所有字符天然一致。

这里的O(1)额外空间不计返回结果本身。若先拆字符数组，则需要另算那份数组空间。

### DP换成记录每个区间是否成立

令 `dp[i][j]` 表示从i到j的连续子串是否回文。两端字符不同，直接为false；相同且长度不超过2，成立；更长则看 `dp[i+1][j-1]`。

计算时按长度从短到长，就能保证内部区间先算好。不能随便按两层下标递增，然后读取尚未计算的内部状态。

例如abba，先确认bb，再确认两端a相同，才能得到整段成立。这和中心扩展利用的是同一个对称条件，只是保存的信息不同。

![区间回文，依赖里面那一段](https://note.lgdsunday.club/img/Q562/03-dp-dependency.webp)

### 怎么选，也要看需要留下多少信息

只求一个最长区间，中心扩展不需要存整个二维表。最坏情况像所有字符相同，每个中心都能扩得很远，所以仍是O(n²)，不是所有输入都只扫一遍。

如果需要大量区间回文查询，DP表的结果可以复用，但要付出O(n²)空间。更快的Manacher算法可以作为进阶选择，不过面试先把当前方法的正确性和边界讲清楚。

测试时用abba覆盖偶中心，用单字符和空串覆盖边界，再对照暴力枚举所有连续区间。不要只测aba，就宣布解法完整。

![子串不能跳过中间字符](https://note.lgdsunday.club/img/Q562/04-substring.webp)

技术依据：[LeetCode 5 题意](https://leetcode.cn/problems/longest-palindromic-substring/)。工程场景与解法按本文说明的条件展开。

## 面试官继续追问

### 能用一般滑动窗口一次完成吗？

回文条件不具备无重复子串那类直接可用的窗口扩缩性质。不能照搬旧模板，需要利用对称结构。

### 多个最长回文怎么办？

原题可允许不同合法答案，工程接口仍可约定。本文固定同长取最早，测试也按这条规则。

## 面试速记卡

> - 对象：子串必须连续，不能跳字符。
> - 中心：字符中心找奇回文，空隙中心找偶回文。
> - 实现：只保存最佳区间，最后切片一次。
> - DP：两端相同且内部回文，按依赖顺序计算。
> - 复杂度：中心扩展O(n²)时间；二维DP另需O(n²)空间。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **字节跳动 · 后端（抖音） · 社招**：给定字符串，怎样求最长回文子串的长度？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353157517968613376)；历史面经，面试年份未明确；页面编辑于 2024-07-19。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
