# 二叉搜索树第 K 小的元素怎么找？中序遍历与子树大小怎样选？

[淘天开发面试真题](../companies/taotian-development.md) · [字节后端面试真题](../companies/bytedance-backend.md) · [字节前端面试真题](../companies/bytedance-frontend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/cs-basics/q758-kth-smallest-bst-inorder-subtree-size/) · [题库目录](../../README.md)

*以下对话为教学模拟，用来讲解这道题。*

🧑‍💻 面试官：在二叉搜索树里找第 K 小，你会怎么做？

🙋‍♂️ 我：中序遍历以后是升序数组，返回数组的第 K 项。

🧑‍💻 面试官：如果 K 只有 2，有必要遍历和保存整棵树吗？

🙋‍♂️ 我：可以访问到第 2 个节点就结束。

🧑‍💻 面试官：如果每秒都要查不同的 K，树还在频繁增删呢？一直从最小值数过去，还是最合适吗？

> 一次查询可以按顺序数，频繁查询则可以维护每棵子树有多少个节点。省掉的查询工作，需要更新时补回来。

## 面试速答（60 秒版）

在合法二叉搜索树中，中序遍历按值从小到大访问节点，因此可以用栈模拟中序，访问一个节点就把 K 减一，减到 0 时返回，不必先生成完整数组。

这适合单次或少量查询，时间 O(h+K)，栈空间 O(h)，最坏仍可能访问整棵树。树不平衡时，h 可以达到 n，不能直接承诺对数复杂度。

如果频繁查询，可以给节点维护子树大小。设左子树有 L 个节点，K=L+1 就是当前节点；K 更小去左边，更大去右边，并减去 L+1。

这种查询只沿一条路径走，但插入、删除和旋转时都要维护 size。树平衡时才能做到对数级查询，额外元数据并不是无成本的优化。

![中序提前终止与size增强结构的取舍](https://note.lgdsunday.club/img/Q758/01-kth-bst-overview.webp)

## 知识点详解：有序的是访问顺序，不是节点在内存里的位置

### 为什么中序的第 K 次访问就是答案？

这里约定输入已经是合法、无重复值的二叉搜索树。左子树的值都小于当前节点，右子树的值都大于当前节点。

中序先访问左子树，再访问当前节点，最后访问右子树。每一棵子树都遵循这条规则，整个访问顺序就有序。

例如根是 5，左边有 2、3、4，右边有 7。中序顺序为 2、3、4、5、7。第 3 次取出节点时就能返回 4，不需要继续访问 5 和 7。

本题不重复 Q693 的合法性验证。把一棵普通二叉树传进来，当前算法不会替你先排好所有值；BST 条件是前提，不是算法额外完成的结果。

### 栈保存的是“左边处理完以后，该回到谁”

从根开始，一直沿左孩子入栈，直到走到空节点。此时栈顶就是还没访问的最小节点。

弹出它，才算真正访问一次，K 才减一。之后转到它的右子树，再沿右子树的左侧继续入栈。

不要在入栈时就减 K。先入栈的可能是根，后面还会继续压入更小的左侧节点，入栈顺序并不是升序访问顺序。

![先压左链，弹出才按升序计数](https://note.lgdsunday.club/img/Q758/02-stack-visit-not-push.webp)

### 单次查询的实现

下面 k 从 1 开始计数。非正整数和超出节点数都抛错；函数不修改树。TypeScript 节点接口可以直接接项目已有对象，Python 用最小节点类表达相同结构。

#### TypeScript

```ts
type TreeNode = { val: number; left: TreeNode | null; right: TreeNode | null };

function kthSmallest(root: TreeNode | null, k: number): number {
  if (!Number.isInteger(k) || k < 1) throw new RangeError("k 必须是正整数");
  const stack: TreeNode[] = [];
  let current = root;
  while (current || stack.length) {
    while (current) {
      stack.push(current);
      current = current.left;
    }
    current = stack.pop()!;
    k--;
    if (k === 0) return current.val;
    current = current.right;
  }
  throw new RangeError("k 超出节点数");
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

def kth_smallest(root, k):
    if not isinstance(k, int) or isinstance(k, bool) or k < 1:
        raise ValueError("k 必须是正整数")
    stack, current = [], root
    while current is not None or stack:
        while current is not None:
            stack.append(current)
            current = current.left
        current = stack.pop()
        k -= 1
        if k == 0:
            return current.val
        current = current.right
    raise ValueError("k 超出节点数")
```

先走向最左侧需要 O(h)，访问前 K 个节点的额外入栈、出栈可以一起计数，因此时间 O(h+K)。k 超范围时只能遍历完再报错，除非另外维护了总节点数。

### 查询变多以后，size 怎样帮助跳过一整棵子树？

假设根 5 的左子树有 3 个节点。查询第 4 小，答案就是 5；查询第 2 小，去左子树继续找第 2 小；查询第 5 小，就去右子树找第 1 小。

我们不是把左边那些节点一个个访问完，而是直接利用“这里一共有 3 个”的信息跳过它们。这种增强结构通常称为顺序统计树。

但左子树插入一个节点后，根的 size 也要更新；平衡树旋转以后，参与旋转的节点同样要重新计算 size。只在创建节点时写一个计数，以后不维护，查询会变快地给出错误答案。

题目与频繁增删的进阶问法见 [LeetCode 230](https://leetcode.com/problems/kth-smallest-element-in-a-bst/)。选择中序遍历还是增强结构，取决于查询和更新频率，不是看哪个名字更高级。

![按左子树数量决定K与局部名次](https://note.lgdsunday.club/img/Q758/03-subtree-size-rank.webp)

## 面试官继续追问

### 如果允许重复值，第 K 小怎么定义？

先明确按节点数还是按不同值计数。节点重复可以各占名次，也可以用 count 合并同值节点；子树大小和跳转公式都要按相同口径维护。

### Morris 遍历能省栈吗？

它通过临时修改指针保存返回路径。若提前找到答案就直接返回，可能留下尚未恢复的连接，需要额外安排清理。不能只看 O(1) 空间，忽略函数修改了谁的树。

### 怎么测试第 K 的边界？

测试最小值、最大值、k 为 0、超过节点数、空树和退化长链。随机生成合法 BST，再用独立排序后的值对照所有名次，同时检查节点链接没有变化。

## 面试速记卡

> - 前提：输入已经是合法 BST，中序访问才有序。
> - 计数时机：弹栈访问节点时减 K，不是入栈时。
> - 单次查询：时间 O(h+K)，栈空间 O(h)。
> - 频繁查询：维护子树大小，按左侧数量跳过整棵子树。
> - 对数边界：依赖树高受控；更新与旋转必须维护 size。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **淘天 · 开发（原帖未明确细分岗位） · 校招**：怎样找出二叉搜索树中第 K 小的节点或数值？（题意整理）。[面经来源](https://www.nowcoder.com/feed/main/detail/f827095869614a4f9cb3d485bdede83b)；原帖发布于 2023-09-20。
- **字节跳动 · 后端开发 · 校招**：怎样找出二叉搜索树中第 K 小的节点或数值？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353155459655868416)；原帖编辑于 2019-09-17。
- **字节跳动 · 前端开发 · 原帖未明确批次**：怎样找出二叉搜索树中第 K 小的节点或数值？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353156597843173376)；原帖编辑于 2020-07-14。
- **字节跳动 · Go后端 · 实习**：怎样找出二叉搜索树中第 K 小的节点或数值？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353156388954251264)；原帖编辑于 2020-04-30。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
