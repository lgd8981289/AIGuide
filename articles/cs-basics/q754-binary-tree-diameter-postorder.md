# 二叉树的直径怎么求？为什么最长路径不一定经过根节点？

[字节后端面试真题](../companies/bytedance-backend.md) · [阿里开发面试真题](../companies/alibaba-development.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/cs-basics/q754-binary-tree-diameter-postorder/) · [题库目录](../../README.md)

*以下对话为教学模拟，用来讲解这道题。*

🧑‍💻 面试官：二叉树直径是不是左子树高度加右子树高度？

🙋‍♂️ 我：是，把根左右两边最长的路径接起来就行。

🧑‍💻 面试官：如果最长路径完全位于左子树里面呢？

🙋‍♂️ 我：那每个节点都需要检查，不能只检查根。

🧑‍💻 面试官：检查完一棵子树，交给父节点的是这棵子树的直径，还是一条向下的高度？两条分叉都能往上接吗？

> 向父节点返回的是一条能继续延长的路径；直径则可以在当前节点把两条向下路径接起来。

## 面试速答（60 秒版）

二叉树直径是任意两个节点之间最长路径的边数，不要求经过整棵树的根，也不是节点数。

可以后序遍历。先得到左右子树高度，再用左右高度之和更新全局直径；交给父节点的高度，则只能取左右较大者加一，因为继续向上延伸的路径不能同时带着两条分支。

这里约定空树高度为 0，叶子高度为 1，那么左右高度之和正好是穿过当前节点的路径边数。所有节点都检查一次，才能覆盖最长路径藏在某个子树里的情况。

时间 O(n)。递归写法需要 O(h) 调用栈，但深链有栈溢出风险；下面用显式后序栈和高度表避免递归，额外空间相应为 O(n)。

![每节点向父给一条路径全局候选可拼两条](https://note.lgdsunday.club/img/Q754/01-diameter-overview.webp)

## 知识点详解：高度是向上交的数据，直径是沿途更新的答案

### 先把长度单位固定下来

只有一个节点，直径为 0，因为没有边。两个相连节点，直径为 1。

本题把 height 定义为向下路径包含的节点数，空节点为 0，叶子为 1。某节点左侧高度是 2，右侧高度是 3，穿过它的最长路径就有 2+3 条边。

为什么不用再减一？左侧高度虽然按节点数记，但从当前节点连到左子树最深处，正好需要同样多的边。左右两侧加起来，当前节点没有被重复按节点计数。

高度也可以定义为边数，但空树初值与公式都要一起修改。面试最容易出错的是前半段按一种单位，代码后半段又换了一种。

### 根可能只是最长路径旁边的一条短分支

假设根 R 只有左孩子 A，A 左右各有一条长度为 2 条边的向下分支，分别到 D 和 E。

最长路径可以从 D 经过 A 到 E，共 4 条边。经过 R 的路径反而只能沿某一侧走到 D 或 E，共 3 条边。

因此，不能只计算根节点的左右高度之和。应该在 A 处发现 4，在其他节点也检查候选，最后保留全局最大值。

![R只连A而最长D-B-A-C-E不经过R](https://note.lgdsunday.club/img/Q754/02-diameter-not-root.webp)

### 为什么返回值不能也用左右高度之和？

因为父节点需要的是一条可以接上来的路径。如果 A 已经把两边拼成 D 到 E，再连接父节点 R，路径就会在 A 处分成三条方向，不再是一条简单路径。

所以每个节点做两件不同的事：用左右高度的和尝试更新答案，再把 `1 + max(左高度, 右高度)` 交给父节点。

这也是后序的原因。左右孩子还没处理完，当前节点就不知道它们能提供多长的向下路径。

### 用显式栈完成后序计算

下面假定输入是真正的二叉树，没有环，也没有多个父节点共享同一个孩子。空树返回 0。expanded 表示孩子已经安排处理，第二次回到当前节点时才计算高度。

#### TypeScript

```ts
type TreeNode = { val: number; left: TreeNode | null; right: TreeNode | null };

function diameter(root: TreeNode | null): number {
  if (!root) return 0;
  const stack: [TreeNode, boolean][] = [[root, false]];
  const heights = new Map<TreeNode, number>();
  let best = 0;
  while (stack.length) {
    const [node, expanded] = stack.pop()!;
    if (!expanded) {
      stack.push([node, true]);
      if (node.right) stack.push([node.right, false]);
      if (node.left) stack.push([node.left, false]);
    } else {
      const left = node.left ? heights.get(node.left)! : 0;
      const right = node.right ? heights.get(node.right)! : 0;
      best = Math.max(best, left + right);
      heights.set(node, 1 + Math.max(left, right));
    }
  }
  return best;
}
```

#### Python

```python
from dataclasses import dataclass

@dataclass(eq=False)
class TreeNode:
    val: int
    left: "TreeNode | None" = None
    right: "TreeNode | None" = None

def diameter(root):
    if root is None:
        return 0
    stack, heights, best = [(root, False)], {}, 0
    while stack:
        node, expanded = stack.pop()
        if not expanded:
            stack.append((node, True))
            if node.right is not None:
                stack.append((node.right, False))
            if node.left is not None:
                stack.append((node.left, False))
        else:
            left = heights[node.left] if node.left is not None else 0
            right = heights[node.right] if node.right is not None else 0
            best = max(best, left + right)
            heights[node] = 1 + max(left, right)
    return best
```

Python 的 eq=False 保留节点的对象身份语义，节点才能作为字典键。不能把内容相同的两个节点合并成同一条高度记录。

每个节点入栈两次，处理次数仍然是常数。这里高度表最多保存 n 个节点，因此空间 O(n)，不能因为没有递归，就宣称空间变成了 O(1)。题目路径与边数定义见 [LeetCode 543](https://leetcode.com/problems/diameter-of-binary-tree/)。

![显式后序栈expanded与高度表各司其职](https://note.lgdsunday.club/img/Q754/03-postorder-height-records.webp)

## 面试官继续追问

### 节点值能不能用来当高度表的键？

不可以，树可能有重复值。高度属于具体节点，不属于某一个数值；使用节点身份，或者在输入层提供唯一节点 ID。

### 换成带权树，还能直接加高度吗？

需要重新定义向下路径状态，按边权计算，尤其要明确负权和是否允许空路径。当前代码只计算每条边长度为 1 的二叉树，不能直接套给任意带权图。

### 怎么测试不是只检查了根？

除了空树、单节点和长链，要专门构造最长路径在子树里的例子。小树可以从每个节点做无向遍历，枚举两点距离，与后序结果对照。深链则用于检查实现有没有偷偷依赖递归栈。

## 面试速记卡

> - 直径：任意两点最长路径的边数，不要求经过根。
> - 高度约定：空树 0、叶子 1，当前候选为左右高度之和。
> - 返回给父节点：只能带一条分支，取 max 后加一。
> - 全局答案：每个节点都检查，覆盖子树内的最长路径。
> - 本文迭代版：时间 O(n)，高度表带来 O(n) 额外空间。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **字节跳动 · Go后端 · 社招**：怎样求二叉树的直径？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353157357217718272)；原帖编辑于 2020-11-21。
- **阿里巴巴 · 研发（基础平台） · 实习**：怎样求二叉树中两个节点之间的最大距离，即二叉树直径？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353156165565620224)；原帖编辑于 2020-03-18。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
