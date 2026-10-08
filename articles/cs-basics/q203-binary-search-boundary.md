# 二分查找的边界怎么写？查找第一个和最后一个匹配项有什么区别？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/cs-basics/q203-binary-search-boundary/) · [题库目录](../../README.md)

<!-- 以下对话为教学模拟，非真实面经。 -->

🧑‍💻 面试官：二分查找怎么找目标？

🙋‍♂️ 我：每次取中间，相等就返回。

🧑‍💻 面试官：数组里有多个相同值，我要第一个，你这个返回的是哪个？

🙋‍♂️ 我：还要向左继续查。

🧑‍💻 面试官：数组没有目标时返回什么？你用闭区间还是半开区间，更新时怎样保证不死循环？

> 先定义要找的边界，再固定区间规则。二分不是记住一个 mid 公式就够了。

## 面试速答（60 秒版）

二分适用于有序数组，或者能形成单调真假分界的条件。查一个相等元素和查第一个大于等于目标的位置，是不同任务。

我会先定义 lower\_bound：返回首个不小于目标的位置，没有则返回 n。用半开区间 \[left, right)，初始 \[0, n)；中值小于目标时 left=mid+1，否则 right=mid，直到两端相遇。

这种写法同样能处理空数组与重复值。要确认目标存在，再检查位置小于 n 且该处等于目标；upper\_bound 则找首个大于目标的位置。

复杂度是 O(log n) 次比较，前提是顺序和单调条件成立；修改数组或昂贵的访问成本也要考虑。

![重复值数组中 lower\_bound 与 upper\_bound 返回不同分界](https://note.lgdsunday.club/img/Q203/00-60s-overview.webp)

## 知识点详解：不变量比左右加一更值得记

### 先把返回值说清楚

假设数组为 \[1,2,2,2,5]，目标是 2。任意相等位置可以是 1、2、3，而 lower\_bound 应返回 1，upper\_bound 应返回 4。

目标是 3 时，lower\_bound 返回 4，表示插入位置，不表示找到了 3。目标是 9 时返回 n=5，这个位置不能直接拿来访问元素。

先固定返回约定，测试才知道对错。否则遇到“没找到”时，不同分支容易返回 -1、n、left，混成一套。

### 半开区间怎样一步步缩短

维护 \[left,right)，已排除的左侧元素都小于目标，右边界及其右侧在数组范围内的元素都不小于目标。中间只需要继续判断未确定部分。

mid 小于目标，可以连 mid 一起排除，所以 left=mid+1。否则 mid 仍可能是答案，保留它作为新右边界，right=mid。

每一轮区间都严格缩短，最终 left=right 就是分界。不要把另一套闭区间的 right=mid-1 混进来。

### 双语实现同一返回约定

输入要求按升序排列，元素和目标具有一致比较规则。这里用普通有限数值，不讨论 NaN。

#### TypeScript

```ts
function lowerBound(a: readonly number[], target: number): number {
  let left = 0, right = a.length;
  while (left < right) {
    const mid = left + Math.floor((right - left) / 2);
    if (a[mid] < target) left = mid + 1;
    else right = mid;
  }
  return left;
}
```

#### Python

```python
def lower_bound(a: list[float], target: float) -> int:
    left, right = 0, len(a)
    while left < right:
        mid = left + (right - left) // 2
        if a[mid] < target:
            left = mid + 1
        else:
            right = mid
    return left
```

把比较条件改成 a\[mid] <= target，就得到首个大于目标的 upper\_bound。查目标是否存在则要增加范围和相等检查，而不是盲目返回 a\[left]。

### 从有序数组到单调条件，仍需要证明分界

例如求满足某种容量约束的最小参数，可以把判断写成 false…false、true…true，寻找第一个 true。前提是条件真的单调。

如果参数变大时有时可行、有时又不可行，照搬二分会排除可能的答案。数值连续问题还要定义精度与终止条件，不能直接搬整数下标逻辑。

检查时至少覆盖空数组、单元素、全相等、目标在两端之外、目标缺失和多个重复值。这些用例比只跑一个中间命中的例子有效。

本题机制参考：[Python bisect](https://docs.python.org/3/library/bisect.html)。

## 面试官继续追问

### 查找 O(log n)，插入也 O(log n) 吗？

不一定。数组找到位置后还需要移动元素，通常插入仍是 O(n)。

### 两个边界怎样得到重复次数？

在有序数组中，upper\_bound(target)-lower\_bound(target) 得到该目标的数量。

### 无序数组能直接二分吗？

不能，除非另外有可证明的单调结构；先排序也要计入排序成本。

## 面试速记卡

> - 先定义答案：相等元素还是首个满足条件的位置。
> - 区间：半开 \[left,right)，不要混闭区间更新。
> - lower\_bound：首个 >= target，没有返回 n。
> - upper\_bound：首个 > target。
> - 前提：有序或单调，访问和插入成本另算。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
