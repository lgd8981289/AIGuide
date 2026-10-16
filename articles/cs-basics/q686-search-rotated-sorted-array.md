# 搜索旋转排序数组怎么做？为什么每次还能排除一半区间？

[美团后端面试真题](../companies/meituan-backend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/cs-basics/q686-search-rotated-sorted-array/) · [题库目录](../../README.md)

*下面是用于讲题的模拟面试对话。*

🧑‍💻 **面试官：** 升序数组旋转以后，怎么在 O(log n) 找目标？

🙋‍♂️ **我：** 二分，中点两边至少有一半是有序的。

🧑‍💻 **面试官：** 找到有序的一半以后，就一定在那边继续吗？

🙋‍♂️ **我：** 还要判断目标落不落在这半边的值域里。

🧑‍💻 **面试官：** 如果数组允许重复，左右和中点又都一样，你还能保证每轮砍一半吗？

> 二分的依据有两个：哪一半有序，以及目标是否属于这半边的数值范围。题目“元素不重复”的条件不能漏。

## 面试速答（60 秒版）

在元素互不相同的旋转升序数组中，取中点以后，左右至少有一半有序。先判断中点是否命中，再识别有序半边。

如果左端值不大于中点值，左半边有序。目标位于左端到中点之间，就保留左边；否则排除左边，转到右边。右半边有序时用对称规则判断。

每次都能排除一半区间，时间 O(log n)，额外空间 O(1)。更新边界要排除已经比较过的中点，避免区间不缩小。

允许重复元素时，可能无法仅凭端点和中点判断哪边有序，需要额外收缩，最坏会退化到 O(n)。所以不能把无重复版本的复杂度直接搬过去。

![旋转数组，至少一边有序](https://note.lgdsunday.club/img/Q686/01-search-rotated-sorted-array.webp)

## 知识点详解：有序半边只是帮助你作排除

### 旋转没有把数组变成任意乱序

假设原来升序的值旋转后变成 `[6,8,10,1,3,4]`。它有一个转折点，但转折点不会同时出现在中点两侧的内部。

因此，拆成左右两段以后，至少一段保持有序。这是二分仍然可用的结构条件，不是对任何“看起来大致有序”的数组都适用。[LeetCode 33 原题](https://leetcode.cn/problems/search-in-rotated-sorted-array/)明确限定了升序旋转和元素唯一。

### 有序，不代表目标一定在其中

例如第一次中点落到 10，左边 6、8、10 有序。如果要找 3，它不在左半边值域里，就该去右边。

反过来，找 8 就可以明确保留左边。我们利用有序范围证明某一半“不可能含目标”，才有资格扔掉它。

所以代码判断最好成对读：先识别哪边有序，再判断目标是否落在对应闭开区间。中点已经独立比较过，值域条件应与这个事实保持一致。

![有序半边，只帮你排除区间](https://note.lgdsunday.club/img/Q686/02-search-rotated-sorted-array.webp)

### 区间每一轮必须变短

#### TypeScript

```typescript
function searchRotated(nums: number[], target: number): number {
  let left = 0, right = nums.length - 1;
  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);
    if (nums[mid] === target) return mid;
    if (nums[left] <= nums[mid]) {
      if (nums[left] <= target && target < nums[mid]) right = mid - 1;
      else left = mid + 1;
    } else {
      if (nums[mid] < target && target <= nums[right]) left = mid + 1;
      else right = mid - 1;
    }
  }
  return -1;
}
```

#### Python

```python
def search_rotated(nums: list[int], target: int) -> int:
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = left + (right - left) // 2
        if nums[mid] == target:
            return mid
        if nums[left] <= nums[mid]:
            if nums[left] <= target < nums[mid]:
                right = mid - 1
            else:
                left = mid + 1
        else:
            if nums[mid] < target <= nums[right]:
                left = mid + 1
            else:
                right = mid - 1
    return -1
```

只剩一个元素时，left 与 mid 可以相等，所以识别左半有序使用小于等于。命中检查放在前面，后续更新就可以安全跳过 mid。

## 面试官继续追问

### 必须先找旋转点吗？

不是。可以先找转折，再在相应有序区间二分，也可以像本文直接每轮判断。两者都需要保持条件和边界一致，不是多找一个点就自然更优。

### 为什么重复会退化？

当端点与中点的值相同，单看这些值可能不能确定转折在哪边，只能进一步排除相同边界。大量重复会让一次只能缩小很少位置。测试应将无重复版与重复版分开。

## 面试速记卡

> - 前提：无重复的升序旋转数组，不是任意乱序。
> - 观察：中点两侧至少一半有序。
> - 决策：目标在有序半边值域内才保留它，否则去另一边。
> - 边界：先检查中点，再用 mid±1 缩小区间。
> - 复杂度：无重复 O(log n)；允许重复时最坏可能 O(n)。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **美团 · Java后台开发 · 原帖未明确批次**：怎样在旋转有序数组中找到指定值？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353154090760871936)；正文记录 8 月 31 日面试；原帖发布于 2017-08-31。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
