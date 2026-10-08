# 并查集是什么？路径压缩和按秩合并为什么能提高效率？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/cs-basics/q374-union-find/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：并查集解决什么问题？

🙋‍♂️ 我：合并集合，判断两个元素是否在同一集合。

🧑‍💻 面试官：随便把一个根挂到另一个根，就够了吗？

🙋‍♂️ 我：功能可以，但树可能越来越高。

🧑‍💻 面试官：路径压缩和按秩合并各改善什么？每次都是严格 O(1) 吗？

> 并查集维护「连通关系」，优化「到代表节点的路径」。低摊还成本不等于每次严格常数。

## 面试速答（60 秒版）

并查集将元素组织成若干集合，以根节点作为代表。find 找代表，union 合并代表不同的集合。

随意合并可能退化成很长的链。按秩或按大小合并，让较浅或较小的树挂到另一棵下面；路径压缩在查找时缩短到根的路径。

二者配合，一系列操作具有很低的摊还成本，常用 O(α(n)) 表示，但不能说每次都严格 O(1)。

它适合动态连通性、无向图判环和最小生成树。它不保存具体路径，也不天然支持删除边或拆分集合；这些需求要用其他结构或离线处理。

![找代表，合并代表，再缩短路径](https://note.lgdsunday.club/img/Q374/01-overview.webp)

*图：右侧长链是另一个独立例子，不是中间合并操作的后续结果；完整压缩与正文的路径减半也不是同一个单次过程。*

## 知识点详解：为什么代表节点要组织成树？

### parent 决定元素属于哪个集合

假设五个节点逐步加入连接。开始每个节点独立，parent 指向自己。

连接 0 与 1，把一个根挂到另一个根；连接 1 与 2，先 find 两边，再合并根。不能随意把普通节点挂到另一普通节点，认为总能合并整组。

两者已经同根，代表本来就连通，不再合并。无向图加边时，也可以用它发现会形成环的边。

### 两种优化发生在不同阶段

按大小在 union 时，让小集合根挂到大集合根，减少树高增长。

路径压缩在 find 时，缩短经过节点的父路径。它改变树形，不改变成员关系。按秩方案的 rank 也不一定等于压缩后的真实高度。

实现和复杂度见 [Princeton 并查集源码](https://algs4.cs.princeton.edu/code/edu/princeton/cs/algs4/UF.java.html)。

![小树挂大树，减少高度增长](https://note.lgdsunday.club/img/Q374/03-merge-v2.webp)

*图：小树挂大树，减少高度增长。*

### 按大小合并，配合路径折半

#### TypeScript

```ts
class DSU {
  private parent: number[];
  private size: number[];
  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.size = Array(n).fill(1);
  }
  find(x: number): number {
    while (x !== this.parent[x]) {
      this.parent[x] = this.parent[this.parent[x]];
      x = this.parent[x];
    }
    return x;
  }
  union(a: number, b: number): boolean {
    let ra = this.find(a), rb = this.find(b);
    if (ra === rb) return false;
    if (this.size[ra] < this.size[rb]) [ra, rb] = [rb, ra];
    this.parent[rb] = ra;
    this.size[ra] += this.size[rb];
    return true;
  }
}
```

#### Python

```python
class DSU:
    def __init__(self, n):
        self.parent = list(range(n))
        self.size = [1] * n

    def find(self, x):
        while x != self.parent[x]:
            self.parent[x] = self.parent[self.parent[x]]
            x = self.parent[x]
        return x

    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return False
        if self.size[ra] < self.size[rb]:
            ra, rb = rb, ra
        self.parent[rb] = ra
        self.size[ra] += self.size[rb]
        return True
```

约定 n 非负，索引属于 0 到 n-1。生产接口要验证，Python 负索引不能误当合法节点。

![路径缩短，不改变集合成员](https://note.lgdsunday.club/img/Q374/02-compress-v2.webp)

*图：左侧路径减半只跳过部分父节点；右侧完整压缩展示的是另一种实现，不能用它推断一次减半后的形状。*

### 接近常数，不是任意操作都便宜

α(n) 是逆 Ackermann 函数，在实际规模增长极慢，描述一系列操作的摊还成本。某次 find 仍可能经过多个节点。

并查集只回答同组，不给出连接路径。删除边后是否仍连通，也不能靠撤销一次 union 得到。所以动态图删除和路径查询，不应只因“都与连接有关”就套它。

## 面试官继续追问

### 非根的 size 还可信吗？

本例只有根的 size 用于合并。非根旧值不是当前集合大小。

### 为什么用迭代 find？

避免递归深度问题，路径折半边走边缩短。其他压缩实现也要保持集合关系正确。

### 能查有向可达性吗？

不能直接等同。集合关系对称，有向可达未必对称。

## 面试速记卡

> - find：找代表；union：合并不同根。
> - 按秩/大小：控制合并时树高。
> - 路径压缩：缩短后续查找。
> - 复杂度：低摊还成本，不是每次严格 O(1)。
> - 边界：不保存路径，不天然支持拆分和删除边。

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
