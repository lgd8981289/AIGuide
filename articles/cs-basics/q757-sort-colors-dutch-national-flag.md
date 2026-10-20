# 颜色分类怎么原地排序？三路划分中为什么有时不能移动扫描指针？

[懂车帝后端面试真题](../companies/dongchedi-backend.md) · [腾讯前端面试真题](../companies/tencent-frontend.md) · [斑马智行算法面试真题](../companies/banma-algorithm.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/cs-basics/q757-sort-colors-dutch-national-flag/) · [题库目录](../../README.md)

*以下对话为教学模拟，用来讲解这道题。*

🧑‍💻 面试官：数组里只有 0、1、2，要求原地排成 0 在前、1 居中、2 在后，怎样一趟完成？

🙋‍♂️ 我：用左右指针，把 0 换到左边，把 2 换到右边。

🧑‍💻 面试官：把当前的 2 和右侧交换以后，扫描指针也加一，可以吗？

🙋‍♂️ 我：交换过来了，应该处理完了。

🧑‍💻 面试官：右边换过来的也可能是 0。跳过它，最后这个 0 会留在哪？

> 指针要跟着“哪些位置已经确认”移动。和未知区交换以后，新拿到的值仍然未知，不能直接跳过去。

## 面试速答（60 秒版）

颜色分类可以用荷兰国旗三路划分。维护 low、mid、high 三个指针，让 low 前面全是 0，low 到 mid 前面全是 1，high 后面全是 2，中间 mid 到 high 是尚未检查的区域。

mid 遇到 0，就与 low 交换，然后 low、mid 都前进；遇到 1，mid 直接前进；遇到 2，就与 high 交换，只让 high 后退。

最后一种情况不能立即增加 mid，因为 high 原先属于未知区域，换过来的值还没检查。相比之下，从 low 换过来的位置属于已经确认的中间区域，或者就是 mid 自己，所以能继续前进。

每一步都会让未知区域缩小一格，时间 O(n)，额外空间 O(1)。这适用于元素确定只有 0、1、2 的输入，不是通用稳定排序算法。

![0区1区未知区2区的不变量](https://note.lgdsunday.club/img/Q757/01-dutch-flag-overview.webp)

## 知识点详解：先划清四段区域，再写交换代码

### 为什么只有三个指针，却要看四段？

假设输入是 `[2,0,1]`。开始时 low 和 mid 都是 0，high 是 2，没有任何位置被确认，整个数组都属于未知区域。

循环始终维护：

- `[0, low)` 全部是 0。
- `[low, mid)` 全部是 1。
- `[mid, high]` 尚未确认。
- `(high, n)` 全部是 2。

写成区间是为了明确端点是否包含，不是再背一套字母。mid 指向下一项要检查的值，high 仍然属于未知区，所以循环条件应该是 `mid <= high`。

如果写成小于，最后一个未知位置就可能漏掉。

### 遇到 2，为什么交换完还要看同一个位置？

开始的 mid 指向 2，把它与末尾的 1 交换，得到 `[1,0,2]`。现在 high 退到 1，末尾 2 已经确认。

但是，mid 当前位置拿到的是刚换来的 1。它之前没有检查过，不能因为“这次处理了一个 2”就把当前位置也算成完成。

本例再次检查 1，mid 才前进。随后处理 0，把它放到前面，最终得到 `[0,1,2]`。

如果输入改成 `[1,2,0]`，把 2 和右边交换会拿到 0。此时误把 mid 加一，就会留下 `[1,0,2]`，恰好暴露这个漏洞。

![遇2交换high后不能跳过mid](https://note.lgdsunday.club/img/Q757/02-two-swap-unknown.webp)

### 遇到 0，为什么两个指针都能前进？

low 指向的是 1 区域的开头。当 low 小于 mid 时，low 原来的值已经确定为 1；把 0 换过去，回到 mid 的就是一个已知的 1，可以一起跳过。

如果 low 等于 mid，就是当前元素与自己交换，也没有新引入一个未知值。因此两种情况下都能让 low、mid 前进。

区别不在 0 比 2 特殊，而在交换的另一端属于哪个区域。

![low到mid之间是已确认1区所以换回已知1](https://note.lgdsunday.club/img/Q757/03-zero-swap-known-one.webp)

### 一趟划分的实现

下面约定输入只含 0、1、2，允许空数组，直接修改传入数组，不创建排序副本。面对不可信数据时，可以在外层先校验，但那是额外的验证步骤。

#### TypeScript

```ts
function sortColors(nums: number[]): void {
  let low = 0, mid = 0, high = nums.length - 1;
  while (mid <= high) {
    if (nums[mid] === 0) {
      [nums[low], nums[mid]] = [nums[mid], nums[low]];
      low++;
      mid++;
    } else if (nums[mid] === 1) {
      mid++;
    } else {
      [nums[mid], nums[high]] = [nums[high], nums[mid]];
      high--;
    }
  }
}
```

#### Python

```python
def sort_colors(nums):
    low, mid, high = 0, 0, len(nums) - 1
    while mid <= high:
        if nums[mid] == 0:
            nums[low], nums[mid] = nums[mid], nums[low]
            low += 1
            mid += 1
        elif nums[mid] == 1:
            mid += 1
        else:
            nums[mid], nums[high] = nums[high], nums[mid]
            high -= 1
```

else 分支把值当成 2，依赖前面的输入约定。不能把任何其他数字传进来，再声称函数具有自动分类任意值的能力。

### 不回退 mid，为什么不会死循环？

遇到 0 或 1，mid 前进；遇到 2，high 后退。无论哪一种，未知区长度 `high - mid + 1` 都减少一。

因此，每轮都消化一个未知位置，总共最多 n 轮。某个 mid 停了几次，只表示右侧未知值陆续换了过来，不表示整个数组被反复从头扫描。

题目的三种值和一趟常量空间要求见 [LeetCode 75](https://leetcode.com/problems/sort-colors/)。它不要求维护相同颜色元素的原相对顺序，不能直接当稳定记录排序用。

## 面试官继续追问

### 先统计 0、1、2 的数量再回填，行不行？

如果只要求线性时间和常量空间，可以。它需要统计和回填两遍；追问要求一趟划分时，再用这套区间不变量解释。不要把两遍 O(n) 说成复杂度更差一档。

### 颜色换成带 ID 的对象，还稳定吗？

当前交换方式不保证同色记录的相对顺序。需要稳定性，就重新选择算法与空间取舍，不能因为输出颜色正确，就认为所有记录身份顺序也正确。

### 哪个用例最容易抓出 mid 多加一次？

`[1,2,0]` 就能让右边换来的 0 被漏掉。另外要测全 2、全 0、单元素和空数组。对所有短的 0/1/2 数组穷举，与计数后的预期结果比较，比只测一个长例子更容易定位边界。

## 面试速记卡

> - 四段区域：0 已确认、1 已确认、未知、2 已确认。
> - 遇到 0：交换 low 与 mid，两者前进。
> - 遇到 1：只让 mid 前进。
> - 遇到 2：交换 mid 与 high，只让 high 后退，新值还要检查。
> - 终止依据：未知区每轮缩小一格，时间 O(n)、空间 O(1)。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **懂车帝 · Java开发 · 实习**：怎样实现 LeetCode 75 的颜色分类？（题意整理）。[面经来源](https://www.nowcoder.com/feed/main/detail/8479a060f1e04f9db4f164c720802cf4)；原帖发布于 2025-10-27。
- **腾讯 · 前端（微信小店） · 社招**：怎样实现 LeetCode 75 的颜色分类？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/786035218225324032)；原帖编辑于 2025-08-16。
- **斑马智行 · NLP算法 · 秋招**：怎样实现 LeetCode 75 的颜色分类？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/677124510016962560)；原帖发布于 2024-10-19。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
