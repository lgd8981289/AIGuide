# 两个有序数组的中位数怎么找？二分分割线为什么能降低复杂度？

[快手开发面试真题](../companies/kuaishou-development.md) · [百度测试开发面试真题](../companies/baidu-test-development.md) · [懂车帝后端面试真题](../companies/dongchedi-backend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/cs-basics/q756-median-two-sorted-arrays-partition/) · [题库目录](../../README.md)

*以下对话为教学模拟，用来讲解这道题。*

🧑‍💻 面试官：两个有序数组的中位数怎么找？

🙋‍♂️ 我：归并成一个有序数组，再取中间值，时间 O(m+n)。

🧑‍💻 面试官：如果要求对数时间呢？能不能分别拿两个数组的中位数求平均？

🙋‍♂️ 我：长度不同、数值分布不同时，不能这么算。

🧑‍💻 面试官：那不归并所有元素，你怎样确认中间那个位置两边都放对了？

> 中位数不要求排出全部顺序。把元素分成数量合适的左右两部分，再保证左边都不大于右边，就够了。

## 面试速答（60 秒版）

两个数组已经各自有序，可以在它们里面各放一条分割线，让合起来的左半边比右半边多一个元素，或者两边数量相等。

只要满足 A 左边最大值不大于 B 右边最小值，并且 B 左边最大值不大于 A 右边最小值，就说明合并后的左右位置正确。奇数总长取左边最大值，偶数取左边最大与右边最小的平均。

把分割线放在较短数组上二分。如果 A 左边过大，就把 A 的分割线左移；如果 B 左边过大，就把 A 的分割线右移。另一条分割线由左半边总数量直接算出。

时间 O(log(min(m,n)+1))，额外空间 O(1)。空数组和分割线在边缘时用正负无穷表达不存在的边界，两个数组都空则需要明确报错。

![两个有序数组按数量和跨边界不等式分割](https://note.lgdsunday.club/img/Q756/01-median-partition-overview.webp)

## 知识点详解：二分的对象是分割位置，不是某一个数字

### 中位数只需要中间相邻的两个边界

假设 A 是 `[1,3,8]`，B 是 `[2,7,10,11]`。总共 7 个数字，左边需要放 4 个。

让 A 左边放 `[1,3]`，B 左边放 `[2,7]`。右边分别剩 `[8]` 和 `[10,11]`。左边最大是 7，右边最小是 8，所以第 4 个数就是 7。

这里并没有把左边内部的 1、3、2、7 再排一遍。只要确认它们都不大于右边，并且数量正确，就已经知道中位数在哪里了。

### 为什么只检查两个交叉不等式？

A 本来有序，所以 A 左边所有数都不大于 A 右边；B 同理。

剩下没保证的，只有 A 左边与 B 右边、B 左边与 A 右边这两种交叉关系。各自比较最大与最小，就能覆盖两边所有元素，而不需要一对一检查。

设 A 左侧取 i 个，B 左侧取 j 个。左边总数固定为 `floor((m+n+1)/2)`，因此 j 等于这个数量减 i，两个位置不是独立枚举。

### 为什么分割线能够二分？

如果 A 左侧最大值比 B 右侧最小值还大，说明 A 从左边拿得太多。i 应该变小，同时 j 会变大，让 B 多承担一些左侧元素。

反过来，B 左边最大值比 A 右边最小值大，就需要让 A 多拿一些到左边，i 变大。

数组自身的有序性，让这两种错误具有明确方向。较短数组长度为 m 时，i 可以从 0 到 m 二分，j 也能保持在另一数组的有效范围内。

![aL>bR时减少i并增加j](https://note.lgdsunday.club/img/Q756/02-partition-binary-direction.webp)

### 空边界不是特殊猜一个答案

如果 i 为 0，A 左侧没有元素，可以把它的最大值看成负无穷；如果 i 等于 m，A 右侧没有元素，最小值看成正无穷。这样同一套不等式仍然成立。

下面约定输入已升序，元素为题目常见范围内的有限整数，不包含 NaN；不做 O(m+n) 的完整有序校验，以免改变算法复杂度。两个输入都空时抛错。

#### TypeScript

```ts
function median(a: readonly number[], b: readonly number[]): number {
  if (a.length > b.length) return median(b, a);
  if (a.length + b.length === 0) throw new RangeError("两个数组都为空");
  const m = a.length, n = b.length;
  const half = Math.floor((m + n + 1) / 2);
  let lo = 0, hi = m;
  while (lo <= hi) {
    const i = lo + Math.floor((hi - lo) / 2), j = half - i;
    const al = i === 0 ? -Infinity : a[i - 1];
    const ar = i === m ? Infinity : a[i];
    const bl = j === 0 ? -Infinity : b[j - 1];
    const br = j === n ? Infinity : b[j];
    if (al <= br && bl <= ar) {
      if ((m + n) % 2) return Math.max(al, bl);
      return (Math.max(al, bl) + Math.min(ar, br)) / 2;
    }
    if (al > br) hi = i - 1;
    else lo = i + 1;
  }
  throw new Error("输入不满足约定");
}
```

#### Python

```python
def median(a, b):
    if len(a) > len(b):
        return median(b, a)
    if not a and not b:
        raise ValueError("两个数组都为空")
    m, n = len(a), len(b)
    half = (m + n + 1) // 2
    lo, hi = 0, m
    while lo <= hi:
        i = (lo + hi) // 2
        j = half - i
        al = a[i - 1] if i else float("-inf")
        ar = a[i] if i < m else float("inf")
        bl = b[j - 1] if j else float("-inf")
        br = b[j] if j < n else float("inf")
        if al <= br and bl <= ar:
            if (m + n) % 2:
                return max(al, bl)
            return (max(al, bl) + min(ar, br)) / 2
        if al > br:
            hi = i - 1
        else:
            lo = i + 1
    raise ValueError("输入不满足约定")
```

这份最后的异常不等于能够检测所有乱序输入。乱序数组也可能碰巧通过某次边界检查，输入有序是前置条件。定义和进阶复杂度可对照 [LeetCode 4](https://leetcode.com/problems/median-of-two-sorted-arrays/)。

![空侧哨兵与偶数中位数](https://note.lgdsunday.club/img/Q756/03-empty-even-boundary.webp)

## 面试官继续追问

### 不同数组里有重复数字，还能用吗？

可以，左右关系使用小于等于。中位数允许重复值，不能照搬严格递增问题里的比较符号。

### 数据来自只能顺序读取的流，还能二分吗？

当前方案依赖随机访问数组位置。流没有这个条件，就要采用别的结构或归并式读取，不能只保留公式便宣称还是对数时间。

### 怎么检查奇偶和空边界？

测试一边为空、两边都空、长度悬殊、全部相等和负数。小数组可以直接合并排序取中位数，作为独立对照；同时交换两个数组，结果应当不变。

## 面试速记卡

> - 分割目标：左边数量固定，奇数时比右边多一。
> - 合法条件：A 左最大≤B 右最小，B 左最大≤A 右最小。
> - 二分方向：A 左过大就左移，否则在相应错误下右移。
> - 边界：空左侧用负无穷，空右侧用正无穷，双空报错。
> - 前置条件：数组升序且支持随机访问，时间 O(log(min(m,n)+1))。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **快手 · Java开发（原帖未明确细分岗位） · 原帖未明确批次**：怎样求两个有序数组的中位数，并分析不同方法的时间和空间复杂度？（题意整理）。[面经来源](https://www.nowcoder.com/feed/main/detail/faf4920a447046f2a879677f33e247b9)；原帖编辑于 2023-10-17。
- **百度 · 测试开发（商业质量服务部） · 校招**：怎样用二分分割线求两个有序数组的中位数？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353155275400093696)；原帖编辑于 2019-08-23。
- **懂车帝 · 后端开发 · 校招**：怎样求两个有序数组的中位数？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353159382588399616)；原帖编辑于 2022-03-22。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
