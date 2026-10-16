# 全排列怎么用回溯实现？数组有重复元素时怎样去重？

[快手测试开发面试真题](../companies/kuaishou-test-development.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/cs-basics/q690-permutations-backtracking-deduplication/) · [题库目录](../../README.md)

*下面是用于讲题的模拟面试对话。*

🧑‍💻 **面试官：** 全排列怎么做？

🙋‍♂️ **我：** 每个位置选一个没用过的元素，选完递归，再撤销。

🧑‍💻 **面试官：** 输入有两个 2，按下标都选一次，会不会输出重复结果？

🙋‍♂️ **我：** 会，需要在同一层跳过等价选择。

🧑‍💻 **面试官：** 那为什么判断重复时，还要看前一个相同元素是否已经 used？直接跳过所有相等值不行吗？

> 相同值可以在同一条路径里各用一次，但不应在同一层反复发起等价分支。去重需要分清“本层”和“本路径”。

## 面试速答（60 秒版）

回溯维护当前路径和 used 数组，每次选择一个尚未使用的下标，加入路径，再递归填写下一个位置。路径长度等于输入长度时，保存一份副本。

有重复元素时，先排序，让相同值相邻。如果当前值与前一个相同，并且前一个下标在当前路径里还没使用，就跳过当前选择。这样在同一层只让第一个可用的相同值开分支。

前一个相同元素已经 used 时，可以继续选择当前这个，因为它们是路径中不同位置上的两个真实元素。不能直接禁止所有相同值。

递归回来要撤销路径和 used。最坏时间 O(n·n!)，辅助空间 O(n)，输出另计；去重减少重复结果，但不会让排列数量突然变成多项式。

![排列回溯，按下标选择与撤销](https://note.lgdsunday.club/img/Q690/01-permutations-backtracking-deduplication.webp)

## 知识点详解：同一层换一个相同下标，结果不会变

### 先用下标保证每个输入元素只使用一次

假设输入是 `[2,2,3]`。两个 2 的值相同，但对应两个位置。一个排列里应该能同时出现两个 2，不能用“这个值已经出现过”阻止第二个。

used 保存下标是否已在路径中。它解决每个元素用一次的问题，还没有解决“先选第一个 2”和“先选第二个 2”生成等价结果的问题。[LeetCode 47 原题](https://leetcode.cn/problems/permutations-ii/)要求输出唯一排列。

### 排序之后，给相同值规定选择顺序

在同一递归层，如果前一个相同元素还未进入路径，当前相同值就先不选。这样相同值的身份顺序固定下来，不再从相同开头展开第二棵等价子树。

但当前一个已经 used，说明它属于这条路径更前面的位置。此时使用第二个相同值，是补上输入中另一个元素，不是重复开同层分支。

这就是条件里 `!used[i-1]` 的意义。只背“相等就 continue”，会把需要保留的排列也删掉。

![同一层，相同值只开一条分支](https://note.lgdsunday.club/img/Q690/02-permutations-backtracking-deduplication.webp)

### 选择与撤销，放在相邻代码里

#### TypeScript

```typescript
function permuteUnique(nums: number[]): number[][] {
  const values = [...nums].sort((a, b) => a - b);
  const used = Array(values.length).fill(false);
  const path: number[] = [];
  const result: number[][] = [];
  function search(): void {
    if (path.length === values.length) {
      result.push([...path]);
      return;
    }
    for (let i = 0; i < values.length; i++) {
      if (used[i]) continue;
      if (i > 0 && values[i] === values[i - 1] && !used[i - 1]) continue;
      used[i] = true;
      path.push(values[i]);
      search();
      path.pop();
      used[i] = false;
    }
  }
  search();
  return result;
}
```

#### Python

```python
def permute_unique(nums: list[int]) -> list[list[int]]:
    values = sorted(nums)
    used = [False] * len(values)
    path, result = [], []
    def search():
        if len(path) == len(values):
            result.append(path.copy())
            return
        for i in range(len(values)):
            if used[i]:
                continue
            if i > 0 and values[i] == values[i - 1] and not used[i - 1]:
                continue
            used[i] = True
            path.append(values[i])
            search()
            path.pop()
            used[i] = False
    search()
    return result
```

保存副本非常重要。如果把同一个 path 对象直接放进结果，后续撤销会继续修改已保存的那份引用，最后看到的结果可能全变空。

![返回答案前，复制当前路径](https://note.lgdsunday.club/img/Q690/03-permutations-backtracking-deduplication.webp)

### 输出本身，就可能很大

全不相同时有 n! 个排列，每份还要保存 n 个值，所以最坏输出量为 O(n·n!)。

有重复时，用 U 表示唯一排列数，结果存储为 O(nU)。这不等于宣称代码对任何重复分布都恰好只用 O(nU) 运算；循环检查、排序和搜索过程仍有自己的成本。

本文约定空输入产生一份空排列 `[[]]`，这是组合生成中常见的边界定义，调用方若想返回空结果，应明确改变契约。

## 面试官继续追问

### 最后用 Set 去重行不行？

可以作为小输入验证基准，但会先生成许多重复路径，还要保存和编码结果。回溯中的同层剪枝直接避免等价搜索，通常更符合本题要求。

### 怎样验证没有删掉合法结果？

短输入按全部下标排列生成基准，再按值去重比较。覆盖全相同、部分重复、无重复和空输入，同时检查每个结果的元素频次与原输入相同。

## 面试速记卡

> - used：按下标记录当前路径使用情况，不按值一刀切。
> - 排序：让相同值相邻，便于识别等价选择。
> - 同层剪枝：相同前值尚未 used 时，跳过当前相同值。
> - 路径恢复：选、递归、撤销成对；结果必须保存副本。
> - 成本：最坏时间与输出都可能到 O(n·n!)，去重不消除组合爆炸。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **快手 · 测试开发 · 2022暑期实习（原帖标题）**：怎样实现 LeetCode 46 的全排列？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/364846466995679232)；原帖编辑于 2022-06-10；快手部分的面试日期未明确。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
