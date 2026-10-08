# 快速排序和归并排序有什么区别？稳定性、空间和最坏复杂度怎么比较？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/cs-basics/q204-quicksort-vs-mergesort/) · [题库目录](../../README.md)

<!-- 以下对话为教学模拟，非真实面经。 -->

🧑‍💻 面试官：快速排序和归并排序有什么区别？

🙋‍♂️ 我：都是 O(n log n)，快排更快，归并更稳定。

🧑‍💻 面试官：如果每次分区都只分出一个元素，快排还是什么复杂度？

🙋‍♂️ 我：会退化到 O(n²)。

🧑‍💻 面试官：归并的稳定性怎么保持？数组需要额外空间，而链表是否完全一样？

> 比较排序要同时看平均与最坏时间、空间和稳定性，不能只按算法名字排名。

## 面试速答（60 秒版）

快速排序先分区，让元素位于基准两侧，再递归处理。常见数组快排平均或期望 O(n log n)，不良分区可能 O(n²)；常见原地版本不稳定，递归栈也占空间。

归并排序先拆分，再把有序子序列合并。标准版本最坏 O(n log n)，合并时相等元素优先取左边，可以保持稳定。数组实现常需要 O(n) 辅助空间，链表版本的空间模型不同。

随机化、三路分区和混合排序能改善不同负载，但具体性质要按实现说。实际项目通常优先使用语言库，再确认其契约和比较器要求，不把库排序都当成同一种快排。

面试演示要测试重复值、已排序和逆序输入，并说明代码是哪种版本。

![快排先按基准分区，归并先拆开排序再合并](https://note.lgdsunday.club/img/Q204/00-60s-overview.webp)

## 知识点详解：一个先分区，一个先拆开再合并

### 快排分的是相对位置，不是等长两半

假设数组里有多个 4，选择 4 为基准后，需要把小于、大于以及可能相等的部分组织好，再处理相关子数组。

每次划分比较均衡，层数较少；若总是极度不均衡，工作量就可能退化。固定选第一个元素的简单实现，在特定有序输入上尤其要小心。

三路分区对大量重复键有价值，随机化降低某些不良输入触发的概率，但不应把概率改善写成所有实现最坏都线性对数。

### 归并的稳定性，发生在相等比较那一刻

假设记录按分数排序，同分的原顺序还需要保留。左右子序列分别稳定排序后，合并遇到相等分数，应先取原来位于左侧的记录。

若无规则地先取右侧，同分记录就可能交换顺序。稳定性是实现的性质，不是函数写上 merge 就自动获得。

数组合并通常使用辅助数组；链表可以重新连接节点。描述空间时还要算递归栈，不能把所有归并都说成固定一套空间需求。

### 用归并代码看清相等和剩余元素

下面两个教学版本都返回新数组，不修改输入。只演示有限数值的升序归并，辅助空间峰值 O(n)，递归深度 O(log n)；切片会增加分配工作，不作为极致优化版本。

#### TypeScript

```ts
function mergeSort(a: readonly number[]): number[] {
  if (a.length < 2) return [...a];
  const mid = Math.floor(a.length / 2);
  const left = mergeSort(a.slice(0, mid));
  const right = mergeSort(a.slice(mid));
  const out: number[] = [];
  let i = 0, j = 0;
  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) out.push(left[i++]);
    else out.push(right[j++]);
  }
  return out.concat(left.slice(i), right.slice(j));
}
```

#### Python

```python
def merge_sort(a: list[float]) -> list[float]:
    if len(a) < 2:
        return a.copy()
    mid = len(a) // 2
    left = merge_sort(a[:mid])
    right = merge_sort(a[mid:])
    out = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            out.append(left[i])
            i += 1
        else:
            out.append(right[j])
            j += 1
    return out + left[i:] + right[j:]
```

数值例子本身看不出同分记录身份，但 <= 所采用的左侧优先规则，就是稳定合并需要保持的约定。

### 工程选型还要看库、数据与内存

需要稳定排序时确认库的契约；数据很大且内存有限时，辅助空间不能忽略。外部排序可以分批排序后归并，但那是另一个含存储 I/O 的模型。

比较器也要一致。把数值当字符串比较，或者比较结果不满足排序关系，再好的算法也不能给出你想要的顺序。

面试里先说明标准版本的性质，再谈优化与库实现，这比一句“快排最快”更可靠。

本题机制参考：[Princeton Quicksort](https://algs4.cs.princeton.edu/23quicksort/)、[Princeton Mergesort](https://algs4.cs.princeton.edu/22mergesort/)、[MDN Array.sort](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)。

## 面试官继续追问

### 快排空间一定 O(1) 吗？

不是。原地分区不等于无递归栈；还取决于递归与优化策略。

### 归并一定稳定吗？

标准稳定合并可以做到，改写合并规则或具体变体可能失去稳定性。

### TS 数组 sort 不写比较器可以排数值吗？

默认按字符串顺序比较，不是数值升序。应提供一致的数值比较器。

## 面试速记卡

> - 快排：先分区，平均与最坏分开。
> - 归并：先拆分再合并，标准最坏 O(n log n)。
> - 稳定：相等时保留原相对顺序。
> - 空间：辅助数组与递归栈都算。
> - 工程：确认库契约、比较器和数据负载。

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
