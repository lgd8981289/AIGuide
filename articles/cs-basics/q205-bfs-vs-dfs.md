# BFS 和 DFS 有什么区别？什么时候能用 BFS 求最短路径？

[字节前端面试真题](../companies/bytedance-frontend.md) · [腾讯AI应用开发面试真题](../companies/tencent-ai-application.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/cs-basics/q205-bfs-vs-dfs/) · [题库目录](../../README.md)

<!-- 以下对话为教学模拟，非真实面经。 -->

🧑‍💻 面试官：BFS 和 DFS 有什么区别？

🙋‍♂️ 我：一个用队列，一个用栈，都能找到最短路。

🧑‍💻 面试官：有条路先深入十层才到目标，另一条只要两条边，DFS 先找到了哪条？

🙋‍♂️ 我：DFS 不保证最短。

🧑‍💻 面试官：那么 BFS 遇到不同权重的边还保证最短吗？有环时什么时候标记访问过？

> BFS 的层次对应边数，不等于任意代价；DFS 先深入，也不保证先找到最优解。

## 面试速答（60 秒版）

BFS 按距离起点的层次扩展，常用队列；DFS 沿分支深入再回退，用递归栈或显式栈。邻接表下完整遍历常见复杂度都是 O(V+E)。

在无权图或各边等权的情况下，BFS 可以找最少边数的路径；任意非负不同权重通常需要 Dijkstra 等算法，不能直接承诺 BFS 最短。

图有环时必须维护访问状态。BFS 通常在入队时标记，防止同一节点重复入队；DFS 的访问和回退状态要结合可达性、环检测或回溯目标设计。

选择看问题：层级距离常用 BFS，深入探索和相关遍历常用 DFS。宽图的队列和深图的递归栈都有内存风险。

![无权图 BFS 找最少边数，DFS 假设先深入另一支不保证首次路径最短](https://note.lgdsunday.club/img/Q205/00-60s-overview.webp)

## 知识点详解：搜索顺序怎样影响你得到的答案

### 按层找，为什么能得到最少边数

假设 A 连到 B、C，B 连到 D，C 直接连到目标 T。BFS 先看一条边能到的 B、C，再看两条边能到的节点，因此可得到 A→C→T。

DFS 若先沿 B 深入，可能先找到很长的一条路径。它找到了可行路，不代表其他分支没有更短的路。

这讨论的是边数。如果 A→C 代价很高，而另一条多边路径便宜，层数小就不再等于总代价小。

### 有环时，访问标记要配合入队时机

假设 B、C 都指向 D。BFS 在 D 第一次入队时标记，另一路再看到 D 就不必重复排队，最早发现的层数已经满足本题距离要求。

如果拖到出队才标记，同一个节点可能先被多次塞进队列。部分写法仍能保证结果，但会增加工作和状态处理难度。

回溯题不一定采用“全局访问后永远不再进入”的规则。寻找所有路径与判断某点可达，是不同目标，别机械套一份 visited。

### 先实现无权图距离，不把算法职责写大

下面返回起点可达节点的最少边数距离。图用邻接表表示，缺少邻接项视为无出边。TS 使用数组与头下标避免 shift 的搬移；Python 使用 deque。

#### TypeScript

```ts
function bfsDistance(
  graph: Record<string, readonly string[]>, start: string
): Map<string, number> {
  const distance = new Map<string, number>([[start, 0]]);
  const queue = [start];
  for (let head = 0; head < queue.length; head++) {
    const node = queue[head];
    for (const next of graph[node] ?? []) {
      if (distance.has(next)) continue;
      distance.set(next, distance.get(node)! + 1);
      queue.push(next);
    }
  }
  return distance;
}
```

#### Python

```python
from collections import deque

def bfs_distance(graph: dict[str, list[str]], start: str) -> dict[str, int]:
    distance = {start: 0}
    queue = deque([start])
    while queue:
        node = queue.popleft()
        for nxt in graph.get(node, []):
            if nxt in distance:
                continue
            distance[nxt] = distance[node] + 1
            queue.append(nxt)
    return distance
```

若要输出实际路径，还需记录首次发现时的前驱，再从目标反向还原。这里只返回距离，不伪装成已经实现路径重建。

### 图形状和目标，比队列还是栈更重要

很宽的图，某一层可能有大量待处理节点；很深的图，递归 DFS 可能超过调用栈限制。显式栈能避免语言递归限制，但仍需要存储相关状态。

环检测还要区分有向图与无向图，不是看到已访问邻居就统一判环；有向图常要区分当前搜索路径与已完成状态。

面试先说目标与图的前提，再说明搜索顺序和空间风险，队列与栈就成了实现选择，而不是全部答案。

本题机制参考：[Princeton Graphs](https://algs4.cs.princeton.edu/41graph/)、[Python deque](https://docs.python.org/3/library/collections.html#collections.deque)。

## 面试官继续追问

### BFS 最坏额外空间只有一层吗？

不能这样简单算。访问状态、距离和队列通常需要 O(V) 空间，图本身另算。

### DFS 能不用递归吗？

可以显式维护栈；若需要进入和退出事件，要保存对应遍历状态。

### 有权图一定不能用 BFS 吗？

等权可按边数处理，0/1 权重还有专门的 0-1 BFS；一般不同权重不能套普通 BFS。

## 面试速记卡

> - BFS：按层扩展，普通版本求无权最少边数。
> - DFS：深入回退，不保证首次路径最优。
> - 访问：BFS 常在入队时标记。
> - 复杂度：邻接表遍历 O(V+E)，状态空间 O(V)。
> - 边界：权重、环、回溯目标和宽深内存风险。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **字节跳动 · 前端 · 校招**：怎样用广度优先遍历处理树？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353158686203912192)；面试记录为 2021 年秋招；原帖编辑于 2021-10-09。
- **腾讯 · AI应用开发后端 · 实习**：怎样用 DFS 求岛屿最大面积？（题意整理）。[面经来源](https://www.nowcoder.com/feed/main/detail/144c6ae334b24c0aa643ed43ccfebaac)；页面显示 04-23 发布，未明确年份。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
