# Python 为什么会报 RecursionError？提高递归深度限制就能解决吗？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/python/q620-python-recursion-error-limit/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：RecursionError 怎么处理？

🙋‍♂️ 我：先看是否递归太深，必要时改成迭代。

🧑‍💻 面试官：递归函数根本没有靠近终止条件，提高限制有用吗？

🙋‍♂️ 我：只会让错误晚一点发生。

🧑‍💻 面试官：如果终止条件正确，但目录层级特别深呢？怎样保留遍历顺序，又不依赖越来越大的调用栈？

> 先判断递归有没有结束，再判断正确任务是否需要过深的调用栈；这两类问题不能只靠调高限制处理。

## 面试速答（60 秒版）

RecursionError 表示递归调用达到了运行时限制，首先检查终止条件和每轮输入是否在接近终止条件。无限递归提高限制仍然不会结束。

如果逻辑正确，只是树或目录特别深，可以考虑显式栈迭代。待处理节点保存在自己的容器里，循环取出处理，不再为每一层增加一个函数调用。

递归深度限制用于保护解释器栈。盲目设置很高，可能让进程面临更严重的栈问题，具体安全范围与平台和运行环境有关。

同时还要考虑循环引用、遍历顺序和内存消耗。换成迭代只是改变保存进度的方式，不会自动解决重复节点或无限扩展。

![没结束，还是层级太深？](https://note.lgdsunday.club/img/Q620/01-overview.webp)

## 知识点详解：把等待返回的层级，换成明确的待办栈

### 每一轮，输入是否真的变小

假设一个函数为了查找目录内的文件，对每个子目录继续调用自己。正常情况会走到没有子目录的位置，再逐层返回。

如果传给下一轮的仍是当前目录，或者对象结构出现循环，又没有识别重复节点，递归可能一直走下去。这时错误来自推进逻辑，调高限制只是多运行一会儿。

检查可以从一个最小输入开始。确认空节点、叶子节点和每一轮对子节点的访问，再用深层结构验证。不要只盯着报错最后一行。

### 终止条件正确，也可能深到无法继续

一条很深但有限的链，最终确实有末尾，可是运行时在到达末尾前已经超过允许的递归深度。

调用栈保存每层正在执行的函数、局部信息和返回位置。节点只包含很少数据，不代表每层调用没有额外成本。sys.getrecursionlimit 可以查看当前限制，但不能把它理解成输入恰好允许多少个节点的通用公式，因为外层也可能已有调用层级。

sys.setrecursionlimit 用于调整限制，不是“保证任意深度安全”的开关。不同平台与解释器版本的实现存在差异，因此不提供一个放到所有服务都安全的大数字。

### 用显式栈保存还没处理的节点

以下是前序遍历，节点顺序按 children 列表保持。为了让最左边的子节点先出栈，压入时采用相反顺序。

#### Python

```python
def walk(root):
    stack = [root]
    while stack:
        node = stack.pop()
        yield node["name"]
        stack.extend(reversed(node.get("children", [])))

tree = {"name": "root", "children": [
    {"name": "A"}, {"name": "B"}
]}
assert list(walk(tree)) == ["root", "A", "B"]
```

#### TypeScript

```typescript
type TreeNode = { name: string; children?: TreeNode[] };
function* walk(root: TreeNode): Generator<string> {
  const stack = [root];
  while (stack.length) {
    const node = stack.pop()!;
    yield node.name;
    stack.push(...[...(node.children ?? [])].reverse());
  }
}
const tree: TreeNode = {
  name: "root", children: [{ name: "A" }, { name: "B" }]
};
console.log([...walk(tree)]); // root、A、B
```

两段都假设输入是没有环的有限树。JS 展开特别多参数也有自己的实现限制，大量子节点时可用循环逐个压栈。显式栈也占内存，只是它由代码管理，不再等同于函数调用深度。

![要先访问 A，就把 A 最后压入](https://note.lgdsunday.club/img/Q620/02-stack-v2.webp)

### 从树变成图，需要补上另一份约束

如果输入可以包含重复引用或环，需要按实际节点身份安排 visited，或按需求允许重复但限制总工作量。没有这一步，迭代也可能永远把同一个节点压回栈。

验证时检查浅树的顺序、空子列表、深链和循环输入策略。不要因为没有 RecursionError，就认定遍历已经正确完成。

依据：[递归限制](https://docs.python.org/3.11/library/sys.html#sys.setrecursionlimit)、[RecursionError](https://docs.python.org/3.11/library/exceptions.html#RecursionError)。

![换成迭代，环也不会自己消失](https://note.lgdsunday.club/img/Q620/03-cycle.webp)

## 面试官继续追问

### Python 会自动把尾递归变成循环吗？

不能按自动尾调用优化设计可移植 Python 代码；深度问题仍需要明确处理。

### 显式栈能解决循环引用吗？

不能自动解决。图结构需要额外的已访问集合或明确终止策略。

### 改迭代以后顺序不同了，为什么？

栈后进先出，压入子节点的顺序会改变访问顺序。先明确原遍历合同，再检查压栈方向。

## 面试速记卡

> - 先检查终止条件，再判断合法输入深度。
> - 递归限制不能理解为无限安全开关。
> - 显式栈保存待处理状态，避免逐层函数调用。
> - 压栈顺序影响遍历顺序。
> - 图中的环与重复，需要额外访问策略。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
