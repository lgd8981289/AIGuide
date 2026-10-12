# 0-1 背包和完全背包有什么区别？为什么容量遍历顺序不同？

[腾讯开发面试真题](../companies/tencent-development.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/cs-basics/q527-zero-one-vs-unbounded-knapsack/) · [题库目录](../../README.md)

下面是一段模拟面试对话。

🧑‍💻 面试官：一件物品重 2、价值 3，背包容量 4，最多能装多少价值？

🙋‍♂️ 我：如果只有这一件，最多价值 3。

🧑‍💻 面试官：那你从小到大更新一维 dp，容量 2 得到 3，容量 4 又加一次，为什么算出了 6？

🙋‍♂️ 我：容量 4 读取了当前这一轮更新后的容量 2，相当于重复选了物品。

🧑‍💻 面试官：如果这类物品允许无限选，这个更新方向是不是反而正确？

> 容量的遍历方向，决定「读取上一轮还是本轮」。这正好对应当前物品能否重复使用。

## 面试速答（60 秒版）

0-1 背包中，每件物品最多选择一次；完全背包中，每类物品可以重复选择。这里都先讨论总重量不超过容量、价值最大的问题。

使用一维 dp 时，0-1 背包通常倒序遍历容量。这样更新当前容量时，较小容量还没有被本轮改过，当前物品就不会在同一轮重复进入。

完全背包则正序遍历容量，允许使用已经包含当前物品的较小容量状态，再加入一件同类物品。[0-1 背包](https://www.hello-algo.com/chapter_dynamic_programming/knapsack_problem/)、[完全背包](https://www.hello-algo.com/chapter_dynamic_programming/unbounded_knapsack_problem/)。

例如重量 2、价值 3、容量 4，只有一件时答案为 3，允许重复时答案为 6。顺序不是要背的技巧，而是在维护“物品可以用几次”的限制。

![背包遍历方向，决定能用几次](https://note.lgdsunday.club/img/Q527/01-knapsack-overview.webp)

## 知识点详解：从一个物品看清一维状态更新

### 先定义 dp，别先背循环

咱们定义 dp\[c]：已经处理过的物品，在总重量不超过 c 时能得到的最大价值。允许什么都不放，所以初始值可以全为 0。

现在处理重量 w、价值 v 的物品。容量 c 可以不选它，保留 dp\[c]；也可以选它，用一个容量 c-w 的方案，再加价值 v。

关键就在于，那个容量 c-w 的方案来自哪一轮。

0-1 背包需要使用没有选过当前物品的上一轮状态。完全背包允许使用本轮状态，因为同类物品可以继续选。

### 倒序为什么能保留上一轮？

仍然只看重 2、价值 3，容量 4 的例子。

倒序先处理 c=4，此时 dp\[2] 仍为上一轮的 0，所以 dp\[4] 得到 3。后面处理 c=2，才把 dp\[2] 改成 3。

容量 4 没有再回头读取新的 dp\[2]，因此当前物品只用了一个。

![倒序先读旧状态](https://note.lgdsunday.club/img/Q527/02-descending.webp)

### 正序为什么可以重复选择同类物品？

如果倒序改成正序，c=2 先变为 3，随后 c=4 读到这个新值，加上当前物品又得到 6。对于 0-1 背包，这是违反约束；对于完全背包，正好表示装了两件。

也就是说，两种写法用的都是容量 c-w 的结果，区别在于这个结果有没有在本轮更新过。完全背包允许复用新结果，0-1 背包不能复用。

![正序可以复用本轮状态](https://note.lgdsunday.club/img/Q527/03-ascending.webp)

### 两种语言写同一个更新规则

下面用 unbounded 参数区分两种约束。示例约定重量和容量为整数，重量必须大于 0，weights 与 values 长度相同。零重量和复杂金额类型不在这个教学实现中处理。

#### TypeScript

```typescript
function knapsack(
  weights: number[], values: number[],
  capacity: number, unbounded = false
): number {
  const dp = Array<number>(capacity + 1).fill(0);
  for (let i = 0; i < weights.length; i++) {
    const w = weights[i], v = values[i];
    if (unbounded) {
      for (let c = w; c <= capacity; c++) {
        dp[c] = Math.max(dp[c], dp[c - w] + v);
      }
    } else {
      for (let c = capacity; c >= w; c--) {
        dp[c] = Math.max(dp[c], dp[c - w] + v);
      }
    }
  }
  return dp[capacity];
}
```

#### Python

```python
def knapsack(weights, values, capacity, unbounded=False):
    dp = [0] * (capacity + 1)
    for w, v in zip(weights, values):
        capacities = (
            range(w, capacity + 1)
            if unbounded else range(capacity, w - 1, -1)
        )
        for c in capacities:
            dp[c] = max(dp[c], dp[c - w] + v)
    return dp[capacity]
```

两者都采用物品在外、容量在内的写法。它们不是适用于所有背包题的通用模板，例如组合数、排列数或有限件数，需要重新定义状态和循环含义。

### 恰好装满时，初始化需要改变

如果题目要求“恰好装满容量”，全初始化为 0 就会把本来无法达到的容量误当作可行状态。

应让 dp\[0]=0，其他容量标为不可达；只有前一状态可达，才允许转移。此时最后容量不可达，就应返回明确的无解结果。

所以，遍历方向只是其中一项。状态含义、初始化和转移条件共同决定算法是否正确。

![不超过容量，与恰好装满不同](https://note.lgdsunday.club/img/Q527/04-exact-fill.webp)

### 用小例子验证，比大输入更容易发现问题

先测一件物品：0-1 得到 3，完全背包得到 6。再测试空物品、容量为 0、全部物品过重，以及多个不同物品。

小范围还可以穷举每件物品的合法选择次数，与动态规划比较。若代码把一件物品用多次，结果往往在极小样例中就会出现。

## 面试官继续追问

### 使用二维 dp，容量也必须倒序吗？

不一定。二维写法可以明确区分上一层和当前层。倒序限制主要来自把两层压到同一个数组后的读取依赖。

### 完全背包总可以贪心选择单位价值最高的吗？

不可以。重量组合会影响剩余容量，局部单位价值最优不保证最终组合价值最大。除非题目有另外证明的特殊条件。

### 能不能把容量放在外层？

某些状态定义下可以，但不能只交换循环就认为语义不变。计数问题尤其容易因此改变是在数组合还是排列。

## 面试速记卡

> - 0-1 背包：每件最多一次，一维容量倒序。
> - 完全背包：同类可重复，一维容量正序。
> - 核心原因：倒序读取旧状态，正序可以复用本轮状态。
> - 初始条件：不超过容量与恰好装满采用不同可达性语义。
> - 验证样例：重 2、值 3、容量 4，分别得到 3 和 6。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **腾讯 · 开发（原帖未明确具体岗位） · 实习**：0-1 背包、部分背包和完全背包分别怎样求解？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353153878994657280)；正文记录 4 月 16 日二面；原帖编辑于 2016-04-23。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
