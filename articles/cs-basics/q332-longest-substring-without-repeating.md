# 最长无重复子串怎么用滑动窗口实现？为什么左边界只能向前移动？

[字节后端面试真题](../companies/bytedance-backend.md) · [快手AI应用开发面试真题](../companies/kuaishou-ai-application.md) · [美团后端面试真题](../companies/meituan-backend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/cs-basics/q332-longest-substring-without-repeating/) · [题库目录](../../README.md)

<span data-pagefind-meta="search_keywords:滑 动 窗口 sliding window"></span>

*下面是一段教学用的模拟面试。*

🧑‍💻 **面试官：** 最长无重复子串为什么用滑动窗口？

🙋‍♂️ **我：** 有重复就移动左边界，没有重复就扩大窗口。

🧑‍💻 **面试官：** 字符串 abba，最后读到 a。它上次出现在 0，你要把左边界移回 1 吗？

🙋‍♂️ **我：** 不能往回退，上次那个 a 已经在窗口外了。

🧑‍💻 **面试官：** 那左边界的更新公式怎么写？你要的是子串还是子序列？

> 维护的是一个连续、无重复的窗口。左边界只能往前，历史出现位置还要判断是不是落在当前窗口里。

## 面试速答（60 秒版）

用左右边界维护当前无重复子串，同时记录每个字符最近出现的位置。

右边界读到字符时，如果它以前出现过，左边界更新为原左边界与“上次位置加一”的较大值。这样可以跳过窗口内的重复，又不会被窗口外的旧位置拉回去。

随后更新字符位置，用窗口长度更新最大值。两个边界都只向前，在常见哈希查找假设下，时间 O(n)。

还要明确字符单位。下面按 Unicode 码点处理，并不保证把组合字符或多码点 emoji 当成一个用户看到的字符。

![无重复窗口，左边界只前进](https://note.lgdsunday.club/img/Q332/01-overview-v2.webp)

*图：无重复窗口，左边界只前进。*

## 知识点详解：为什么 abba 能检验左边界是否写对？

### 子串必须连续，不能挑着取

对于一个字符串，我们寻找的是连续的一段。不能为了避开重复，跳过中间的字符再把两端拼起来，那变成了子序列或其他问题。

窗口中的字符必须没有重复。右边界每前进一步，就检查新字符会不会破坏这个条件。

### 重复位置在窗口里，才需要越过去

读 abba：前两个字符形成 ab。再读第二个 b，上次 b 在位置 1，因此左边界跳到 2，当前窗口只保留新的 b。

最后读 a，上次 a 在 0，已经在左边界 2 的外面。此时不能把 left 改回 1，否则窗口会重新包含两个 b。

因此，公式是 max(left, previous+1)，不是每遇到重复都无条件 previous+1。题意可对照 [LeetCode 最长无重复子串](https://leetcode.com/problems/longest-substring-without-repeating-characters/)。

![旧 a 已在窗口外，不要退回去](https://note.lgdsunday.club/img/Q332/02-abba.webp)

*图：旧 a 已在窗口外，不要退回去。*

### 把不变量写进代码

#### TypeScript

```typescript
function longestUnique(text: string): number {
  const chars = Array.from(text);
  const last = new Map<string, number>();
  let left = 0, best = 0;
  for (let right = 0; right < chars.length; right++) {
    const previous = last.get(chars[right]);
    if (previous !== undefined) {
      left = Math.max(left, previous + 1);
    }
    last.set(chars[right], right);
    best = Math.max(best, right - left + 1);
  }
  return best;
}
```

#### Python

```python
def longest_unique(text):
    last = {}
    left = best = 0
    for right, char in enumerate(text):
        if char in last:
            left = max(left, last[char] + 1)
        last[char] = right
        best = max(best, right - left + 1)
    return best
```

TS 先用 Array.from 得到码点序列，避免把补充平面字符拆成两个 UTF-16 码元。Python 字符串迭代也按其码点序列工作。它们都没有完成用户感知字符的分段，不能说“所有 emoji 已按一个图案计算”。

### 为什么这不是 O(n²)？

右边界走 n 次，左边界始终向前。示例借助最近位置直接跳过冲突，不会从每个起点重新扫描整段后缀。

哈希操作按平均常数时间分析，总时间 O(n)。记录表空间与不同字符数量有关；TS 示例另外创建了码点数组，占 O(n) 空间，也不能漏算。

如果需要返回子串，而不只是长度，还要记录最佳区间。TS 的码点下标与原字符串 UTF-16 下标不完全相同，切片时应采用一致单位。

## 面试官继续追问

**空串和全部相同字符怎么办？**

空串返回 0，非空的全相同串返回 1。这两种情况能检查初始化与边界公式。

**实时输入能用吗？**

单次算法能逐步接收字符，但无限输入、存储回收和输出需求需要另行设计。面试复杂度不等于完整的流式服务方案。

## 面试速记卡

> - 目标：连续子串，不是子序列。
> - 不变量：当前窗口没有重复字符。
> - 左边界：max(left, 上次位置+1)，绝不倒退。
> - 位置：更新最近出现下标，再计算窗口长度。
> - 单位：码点不等于用户感知字符，空间也要计入。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **字节跳动 · 后端（TikTok） · 日常实习**：怎样求字符串中不含重复字符的最长子串长度？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/686735730227286016)；面试记录为 2024-11-14；原帖编辑于 2024-11-16。
- **快手 · AI应用开发算法 · 原帖未明确批次**：怎样求最长无重复字符子串？（题意整理）。[面经来源](https://www.nowcoder.com/feed/main/detail/4f0f37f01fa64605a51b635bdeba16b4)；页面显示 05-02 发布，未明确年份。
- **美团 · 后端（榛果民宿） · 原帖未明确批次**：怎样求最大无重复字符子串长度？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353155468262580224)；历史面经；原帖编辑于 2019-09-18。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
