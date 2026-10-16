# 如何验证二叉搜索树？为什么只比较节点和左右孩子不够？

[京东后端面试真题](../companies/jd-backend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/cs-basics/q693-validate-binary-search-tree/) · [题库目录](../../README.md)

下面是一段模拟面试对话。

🧑‍💻 面试官：怎么判断一棵树是不是二叉搜索树？

🙋‍♂️ 我：每个节点都满足左孩子比它小，右孩子比它大，递归检查就行。

🧑‍💻 面试官：根是 10，右孩子是 15，15 的左孩子是 7。每对父子都满足你的比较，这棵树对吗？

🙋‍♂️ 我：7 又落到根 10 的右边了，确实不对。

🧑‍💻 面试官：那你检查 7 时，怎样知道祖先还给它留下了什么限制？

> 搜索树约束的是整棵左右子树。走到一个节点时，还要记住祖先限定的取值范围。

## 面试速答（60 秒版）

二叉搜索树要求左子树所有节点都小于当前节点，右子树所有节点都大于当前节点，只比较直接孩子不够。

我会在遍历时携带严格的上下界。当前节点的值必须落在范围内；进入左子树，把上界收紧为当前值；进入右子树，把下界收紧为当前值。发现任何节点越界，就返回 false。

另一种方法是中序遍历，检查访问值是否严格递增。这里按原题不允许重复值，不能写成非递减。

每个节点只检查一次，时间 O(n)。深度优先遍历保存的路径或待处理分支与树高有关，通常写 O(h)，退化成链表时最坏是 O(n)。可以用显式栈避免递归深度限制。

![搜索树，要检查祖先边界](https://note.lgdsunday.club/img/Q693/01-validate-binary-search-tree.webp)

## 知识点详解：局部看着正确，为什么整棵树仍然错误？

### 把“左孩子”改成“左子树所有节点”

看开头的例子，7 小于自己的父节点 15，单看这对父子没有问题。但它位于根 10 的右子树，所以还应该大于 10。

两个条件合起来，7 必须处于 `(10,15)`。显然不满足。

这说明每往下一层，都可能增加一个限制；已经获得的祖先限制不能忘。原题对严格大小及重复值的要求见 [LeetCode 98](https://leetcode.cn/problems/validate-binary-search-tree/)。

### 上下界怎样往下传？

从根 10 开始，初始范围可以理解成没有限制。

| 访问位置      | 允许范围      | 原因              |
| --------- | --------- | --------------- |
| 根 10      | `(-∞,+∞)` | 尚无祖先限制          |
| 右孩子 15    | `(10,+∞)` | 整个右子树都要大于 10    |
| 15 的左孩子 7 | `(10,15)` | 既要大于 10，又要小于 15 |

进入左子树，只替换上界，保留下界；进入右子树，只替换下界，保留上界。

不要写成“左子树范围永远是负无穷到当前值”。那会把更早祖先留下的下界丢掉，恰好漏掉这个例子。

![向下遍历，也带上允许范围](https://note.lgdsunday.club/img/Q693/02-validate-binary-search-tree.webp)

### TypeScript 与 Python 的显式栈实现

输入按原题为有限整数节点、无环二叉树。TypeScript 用正负无穷表示未设置边界；如果要接受任意精度整数或特殊浮点值，应重新约定类型和比较语义。

**TypeScript**

```typescript
class TreeNode {
  constructor(
    public value: number,
    public left: TreeNode | null = null,
    public right: TreeNode | null = null,
  ) {}
}

function isValidBST(root: TreeNode | null): boolean {
  if (root === null) return true;
  const stack: Array<[TreeNode, number, number]> = [[root, -Infinity, Infinity]];
  while (stack.length > 0) {
    const [node, lower, upper] = stack.pop()!;
    if (!(lower < node.value && node.value < upper)) return false;
    if (node.right !== null) stack.push([node.right, node.value, upper]);
    if (node.left !== null) stack.push([node.left, lower, node.value]);
  }
  return true;
}
```

**Python**

```python
class TreeNode:
    def __init__(self, value: int, left=None, right=None):
        self.value = value
        self.left = left
        self.right = right

def is_valid_bst(root: TreeNode | None) -> bool:
    if root is None:
        return True
    stack = [(root, float("-inf"), float("inf"))]
    while stack:
        node, lower, upper = stack.pop()
        if not lower < node.value < upper:
            return False
        if node.right is not None:
            stack.append((node.right, node.value, upper))
        if node.left is not None:
            stack.append((node.left, lower, node.value))
    return True
```

显式栈保存的是节点和它自己的边界，不是全局共享一对可变边界。左右分支的限制不同，不能让检查完左边得到的边界覆盖右边。

### 中序严格递增为什么也成立？

中序访问顺序是左子树、当前节点、右子树。如果整棵树满足严格的搜索树定义，那么这个顺序下的值应该从小到大。

反过来，如果整棵树的中序序列严格递增，每个节点左子树的全部值都在它之前、更小，右子树的全部值都在它之后、更大，也就满足要求。

实现时只要保存前一个访问值，不必先把所有值放进数组。前一个值尚不存在时，要单独处理，别用零当作“还没访问”的标记，因为零也可能是合法节点值。

## 面试官继续追问

![中序遍历，检查严格递增](https://note.lgdsunday.club/img/Q693/03-validate-binary-search-tree.webp)

### 相等的节点一定不合法吗？

本题按严格定义，不合法。有些搜索树实现允许重复键，但需要明确统一放在哪一侧，或把重复次数存在节点里。修改定义后，范围是否包含端点也要一起修改。

### 能不能用当前值减一、加一做边界？

没有必要。严格比较已经能排除相等值。加减一会引入整数边界、溢出以及非整数类型的问题，还把本来清晰的约束变复杂。

### 怎么检查实现没有漏掉祖先限制？

至少测开头的跨祖先越界例子、重复值、空树、单节点以及合法的单侧长链。短树还可以收集中序序列，检查严格递增，用独立实现和范围法对照。

## 面试速记卡

> - 左右子树的所有节点都受约束，不只是直接孩子。
> - 每个节点携带祖先留下的严格上下界。
> - 左分支收紧上界，右分支收紧下界，另一边界保留。
> - 中序遍历严格递增是另一种等价判断。
> - 时间 O(n)，辅助空间 O(h)，最坏 O(n)；显式栈避免递归深度限制。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **京东 · Java后端 · 社招**：怎样验证一棵二叉树是二叉搜索树？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353157517968613376)；历史面经，面试年份未明确；原帖编辑于 2024-07-19。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
