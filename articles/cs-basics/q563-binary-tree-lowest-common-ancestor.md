# 二叉树的最近公共祖先怎么找？普通二叉树和二叉搜索树的解法有什么区别？

[字节后端面试真题](../companies/bytedance-backend.md) · [有赞开发面试真题](../companies/youzan-development.md) · [美团后端面试真题](../companies/meituan-backend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/cs-basics/q563-binary-tree-lowest-common-ancestor/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：二叉树的最近公共祖先怎么找？

🙋‍♂️ 我：递归搜索左右子树，两边都有结果就返回当前节点。

🧑‍💻 面试官：左右返回的结果具体可能是什么？

🙋‍♂️ 我：可能是目标节点，或者已经找到的公共祖先。

🧑‍💻 面试官：如果一个目标根本不在树里，这个代码还正确吗？能不能直接按节点值大小决定往哪边走？

> 先说清递归返回的含义，再确认目标存在；按值走左右，只能建立在二叉搜索树的条件上。

## 面试速答（60 秒版）

普通二叉树没有按大小选择左右的条件，可以从左右子树递归查找。遇到空节点返回空，遇到目标节点返回它；否则看左右返回结果。

两边都有结果，说明两个目标分别在两边，当前节点就是最近公共祖先。只有一边有结果，则把那一边的结果向上返回，它可能是目标，也可能是已经找到的祖先。

这个简洁解法需要题目保证两个目标存在。没有这个保证时，要额外验证，不能只找到一个目标就当成两者的LCA。比较时也要明确是节点身份，而不只比较可能重复的值。

对于键唯一、目标存在的二叉搜索树，才可以利用有序性，看两目标同在一侧还是分到两侧。普通二叉树不能套这个判断。

![两侧汇合，答案才在当前节点](https://note.lgdsunday.club/img/Q563/01-overview.webp)

## 知识点详解：递归往上交的结果，到底代表什么

### 公共祖先，可以就是目标自己

假设节点p本来就在q的父链上。p既是自己的祖先，也是q的祖先，所以它就是最近公共祖先。

“最近”指离两个节点更低、没有更靠下的共同祖先，和按值接近没有关系。

普通二叉树每节点至多两个孩子，但不保证左小右大。因此这道题先按树的关系找，不按数值猜。

![祖先也包含节点自己](https://note.lgdsunday.club/img/Q563/02-self-ancestor.webp)

### 左右两边返回结果，才在当前节点汇合

假设当前节点是r。左边查到了p，右边查到了q，那么更低的单侧节点不可能同时覆盖两个目标，r就是汇合位置。

如果只有左边有结果，则答案或目标仍在左边，把结果继续向上交。这个返回值不是“左边节点数量”，也不是统一的布尔值。

当某个子树已经找到LCA，它可以作为一个非空结果继续向上传递。在两个目标确实存在的条件下，上层不会再凭空出现另一个目标分支。

### 基础代码保留原题的存在保证

下面两版假设p和q都在树中，以对象身份识别节点，不直接比较val。Python不重定义结构相等，TS也使用对象引用相等。

**TypeScript**

```typescript
type TreeNode = {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
};
function lowestCommonAncestor(
  root: TreeNode | null, p: TreeNode, q: TreeNode
): TreeNode | null {
  if (root === null || root === p || root === q) return root;
  const left = lowestCommonAncestor(root.left, p, q);
  const right = lowestCommonAncestor(root.right, p, q);
  if (left !== null && right !== null) return root;
  return left ?? right;
}
```

**Python**

```python
class TreeNode:
    def __init__(self, val, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right


def lowest_common_ancestor(root, p, q):
    if root is None or root is p or root is q:
        return root
    left = lowest_common_ancestor(root.left, p, q)
    right = lowest_common_ancestor(root.right, p, q)
    if left is not None and right is not None:
        return root
    return left if left is not None else right
```

最坏访问O(n)节点，递归栈O(h)，h是树高。退化链的h可以接近n，不能无条件说空间O(log n)。很深的树还要考虑语言递归限制，可改显式栈或父节点路径法。

![一侧结果，继续向上交](https://note.lgdsunday.club/img/Q563/03-recursive-return.webp)

### 目标可能缺失时，接口约定已经变了

假设p在树里，q是外面新建的节点。基础代码最终可能把p传回来，这只能说明找到p，并不能证明存在共同祖先。

一种容易验证的做法，是先遍历确认两个对象都存在，再调用基础算法。仍是O(n)时间，但多一次查找。另一种做法是在递归结果中携带目标是否找到的信息，最后统一判断。

不要只把val相同当成存在。例如树里某节点值为7，外面新对象也值为7，它们不是同一节点。本文基础代码刻意没有把缺失检查藏成已实现功能。

![只找到一个，不够证明LCA](https://note.lgdsunday.club/img/Q563/04-missing-target.webp)

### BST可以少走一些路，但条件不能省

键唯一的BST里，如果p和q都小于当前键，它们共同祖先在左子树；都大于当前键则在右边；分两边，或当前节点就是目标，当前节点就是LCA。

这利用的是有序结构，路径可以缩到O(h)，并可迭代实现。但目标存在保证、键重复策略和树是否真满足BST性质，都需要说明。

验证普通树解法时，可以用父节点路径的共同前缀作独立参照。测试两侧、同侧、一个是另一个祖先，以及目标不在树中，比只画一棵对称树更完整。

![只有BST，才可以按大小选边](https://note.lgdsunday.club/img/Q563/05-bst.webp)

技术依据：[LeetCode 236 题意](https://leetcode.cn/problems/lowest-common-ancestor-of-a-binary-tree/)。工程场景与解法按本文说明的条件展开。

## 面试官继续追问

### 两个节点val相同，可不可以当成同一个？

不可以，除非接口明确按唯一键标识且保证唯一。本文按对象身份，值相同仍可能是不同节点。

### p和q相同怎么办？

如果扩展接口允许且该节点存在，LCA就是它自身。原题通常给不同目标，条件变化需要写进测试。

## 面试速记卡

> - 定义：祖先包含自身，目标也可能是答案。
> - 返回：空、找到的目标，或已找到的LCA。
> - 汇合：左右都有结果时返回当前节点。
> - 条件：两个目标存在；取消保证需额外检查。
> - 复杂度：普通树O(n)、栈O(h)；BST依有序性可缩为O(h)。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **字节跳动 · 后端（抖音） · 社招**：给定二叉树，怎样找到两个指定节点的最近公共祖先？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353157517968613376)；历史面经，面试年份未明确；页面编辑于 2024-07-19。
- **有赞 · Python开发 · 校招（原帖标签）**：怎样找出二叉树节点的最近公共祖先？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353156916811603968)；正文记录 9 月 7 日一面；原帖编辑于 2020-09-07。
- **美团 · Java后台开发 · 春招实习（原帖标签）**：怎样找到二叉树中两个节点的最近公共祖先？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353154361599664128)；原帖编辑于 2018-05-02。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
