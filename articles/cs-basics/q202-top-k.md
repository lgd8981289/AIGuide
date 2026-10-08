# Top K 问题怎么解决？堆、排序和快速选择分别适合什么场景？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/cs-basics/q202-top-k/) · [题库目录](../../README.md)

<!-- 以下对话为教学模拟，非真实面经。 -->

🧑‍💻 面试官：一百万个数求最大的十个，怎么做？

🙋‍♂️ 我：全部排序取前十。

🧑‍💻 面试官：数据持续进来，不能全部留在内存呢？

🙋‍♂️ 我：可以保留一个十个元素的堆。

🧑‍💻 面试官：最大的十个为什么用小顶堆？相同数值算几个，结果需要有序吗？

> 保留最大的 K 个，需要随时找到当前候选中最小的那个，才能决定谁被替换。

## 面试速答（60 秒版）

先确认 Top K 的定义：最大 K 个值、不同值，还是出现频率最高的 K 个，三者不是一道题。这里讨论允许重复的最大 K 个值。

排序简单，成本 O(n log n)。K 比 n 小且数据可流式输入时，维护容量 K 的小顶堆，堆顶是当前候选里最小的；新值更大才替换，成本 O(n log K)，额外空间 O(K)。

堆本身不是完整有序结果，若要求降序输出还需排序候选，增加 O(K log K)。K 接近 n 时，全排序可能更实用；只做内存数组选择也可评估 Quickselect 的平均复杂度和最坏边界。

最后测试 K 为零、超过数据量、重复值与负数，别只讲堆名字。

![小顶堆用候选中最小值作为是否替换的门槛](https://note.lgdsunday.club/img/Q202/00-60s-overview.webp)

## 知识点详解：小顶堆为什么能保留最大值

### 候选里最小的，才是下一次可能被踢走的

假设求最大的三个，当前候选是 7、9、12，门槛是 7。新来 6，不用改；新来 10，应删 7 并保留 9、10、12。

小顶堆把这个门槛放在顶端，比较方便。大顶堆的顶端是最大候选，反而不是最容易淘汰的那个。

重复值按元素出现次数计入，例如 9、9、7 的最大两个是 9、9。若要求不同值，应先补充去重规则；若求词频榜，还需要先计数。

### 候选不会无限长，但输出也不是天然排序

前 K 个先装入堆，后面每个元素与堆顶比较。替换后恢复堆结构，始终保留已处理前缀中的最大 K 个候选。

比较小于等于门槛的值可以略过，不影响这道允许重复的数值题。若元素还有名称、时间等属性，相同分数的决胜规则必须明确。

O(n log K) 是 K 大于一时的常见写法；K 为一就是线性找最大，K 为零直接空结果。候选最终若需要有序，还要单独排序。

### TS 手写小堆，Python 使用 heapq

两个版本都要求 K 是非负整数，数值输入为可正常比较的有限数；K 超过数量时返回全部值的降序结果。TS 展开堆操作，Python 使用标准库，并非翻译同名框架 API。

#### TypeScript

```ts
function topK(values: Iterable<number>, k: number): number[] {
  if (!Number.isInteger(k) || k < 0) throw new RangeError("k");
  if (k === 0) return [];
  const h: number[] = [];
  for (const x of values) {
    if (h.length < k) {
      h.push(x);
      let i = h.length - 1;
      while (i > 0) {
        const p = Math.floor((i - 1) / 2);
        if (h[p] <= h[i]) break;
        [h[p], h[i]] = [h[i], h[p]];
        i = p;
      }
    } else if (x > h[0]) {
      h[0] = x;
      let i = 0;
      while (true) {
        const left = 2 * i + 1;
        if (left >= h.length) break;
        const right = left + 1;
        const child = right < h.length && h[right] < h[left]
          ? right : left;
        if (h[i] <= h[child]) break;
        [h[i], h[child]] = [h[child], h[i]];
        i = child;
      }
    }
  }
  return h.sort((a, b) => b - a);
}
```

#### Python

```python
import heapq
from collections.abc import Iterable

def top_k(values: Iterable[float], k: int) -> list[float]:
    if not isinstance(k, int) or k < 0:
        raise ValueError("k")
    if k == 0:
        return []
    heap = []
    for value in values:
        if len(heap) < k:
            heapq.heappush(heap, value)
        elif value > heap[0]:
            heapq.heapreplace(heap, value)
    return sorted(heap, reverse=True)
```

### 选择算法，要看结果是否继续维护

一次性内存数组可以考虑选择算法；不断追加的数据适合维护候选堆。若 K 接近 n，库排序的实现和常数也值得测量，不必执着堆。

海量分片数据可以各求局部 Top K，再合并候选求全局 Top K，但前提是排序指标与比较规则一致。频率榜若同一对象跨分片出现，必须先正确汇总计数，不能直接套数值合并。

面试最容易丢分的地方，往往是没有明确“Top”的到底是什么。

本题机制参考：[Python heapq](https://docs.python.org/3/library/heapq.html)、[Princeton Quicksort](https://algs4.cs.princeton.edu/23quicksort/)。

## 面试官继续追问

### 堆里保存的数是降序的吗？

不是。它只保证父子之间的堆关系，完整排序需要额外操作。

### Quickselect 一定 O(n) 吗？

常见实现是平均或期望线性，最坏情况和具体策略需要说明。

### 高频单词也能直接套这个例子吗？

需要先得到全局频次，再按频次和并列规则选择；流式精确计数还涉及空间问题。

## 面试速记卡

> - 先定义：数值、去重值还是频率。
> - 最大 K 个：容量 K 的小顶堆。
> - 门槛：候选中最小值，新值更大才替换。
> - 复杂度：维护 O(n log K)，有序输出另算。
> - 边界：K=0、K>n、重复、负数与并列规则。

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
