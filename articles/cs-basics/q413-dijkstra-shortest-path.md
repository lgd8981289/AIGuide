# Dijkstra 算法怎么求最短路径？为什么不能直接处理负权边？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/cs-basics/q413-dijkstra-shortest-path/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：Dijkstra 每一轮选择什么节点？

🙋‍♂️ 我：选择离起点最近的那个节点。

🧑‍💻 面试官：已经处理过的也选吗？还没探索的路径，为什么不会把它的距离变得更短？

🙋‍♂️ 我：应该选未确定节点里当前距离最小的，非负边保证后面不会绕出更短距离。

🧑‍💻 面试官：有负权边但没有负环呢？优先队列里同一个节点出现两次，又要怎么办？

> Dijkstra 的关键不只是“取最小”，而是这次最小距离能被确定下来。这个保证依赖非负边权。

## 面试速答（60 秒版）

Dijkstra 用于求非负权图中，从一个起点到其他节点的最短距离。

开始时起点距离为零，其他节点为无穷。每轮选择尚未确定、当前距离最小的节点，用它的出边尝试更新邻居，这个更新过程叫松弛。

非负边权保证，后面经过更远节点的路径不会再把已确定距离缩短。负权边会破坏这个保证，即便图里没有负环也不能直接按标准 Dijkstra 处理。

朴素实现每轮扫描最小距离，复杂度 O(V²+E)；优先队列可以加速选择，但重复入队版本要跳过过期条目。需要具体路径时，还要保存前驱，不只是距离。

![非负权图Dijkstra选择最小未确定距离并松弛邻居](https://note.lgdsunday.club/img/Q413/01-dijkstra-overview.webp)

## 知识点详解：距离从“暂时最短”变成“可以确定”

### 松弛是在比较什么？

假设当前知道从起点到 A 的距离是 3，A→B 的权重是 2。那么经过 A 到 B 的候选距离就是 5。

如果 B 原来记录的是 8，就更新成 5；原来已经是 4，则不更新。这里的距离是目前找到的最好值，不是第一次遇见就永远确定。

最终结果还要区分不可达节点，它们不会因为运行算法就自动有路径。

### 为什么取出的最小距离可以确定？

假设 A 是未确定节点里当前距离最小的那个。走到其他未确定节点的已知距离不比 A 小，后续再加非负边，不会绕回一条比 A 更短的路径。

这个论证支持“确定 A”，然后继续处理其他节点。它依赖非负权，不是因为优先队列很快。

反例可以很小：起点 S→A 权重 2，S→B 权重 5，B→A 权重 -4。标准确定流程会先把 A 定为 2，但经过 B 的路径实际上只有 1。没有负环，也已经破坏保证。

![负权边会破坏Dijkstra提前确定最短距离的依据](https://note.lgdsunday.club/img/Q413/02-negative-edge-counterexample-v2.webp)

### 一个不用优先队列的教学实现

为了突出“选择最小未确定节点＋松弛”，下面两种语言都使用朴素版，不伪装成堆优化版。输入为合法邻接表，权重必须是有限非负数，起点和端点需在范围内。

**TypeScript：**

```typescript
function dijkstra(
  graph: Array<Array<[number, number]>>, start: number,
): number[] {
  for (const edges of graph) for (const [, w] of edges) {
    if (!Number.isFinite(w) || w < 0) throw new Error("非法权重");
  }
  const dist = Array(graph.length).fill(Infinity);
  const done = Array(graph.length).fill(false);
  dist[start] = 0;
  for (let step = 0; step < graph.length; step++) {
    let u = -1;
    for (let v = 0; v < graph.length; v++) {
      if (!done[v] && (u === -1 || dist[v] < dist[u])) u = v;
    }
    if (u === -1 || dist[u] === Infinity) break;
    done[u] = true;
    for (const [v, w] of graph[u]) {
      if (!done[v]) dist[v] = Math.min(dist[v], dist[u] + w);
    }
  }
  return dist;
}
```

**Python：**

```python
from math import inf, isfinite

def dijkstra(graph: list[list[tuple[int, float]]], start: int):
    if any(not isfinite(w) or w < 0 for edges in graph for _, w in edges):
        raise ValueError("非法权重")
    dist = [inf] * len(graph)
    done = [False] * len(graph)
    dist[start] = 0
    for _ in range(len(graph)):
        candidates = (v for v in range(len(graph)) if not done[v])
        u = min(candidates, key=lambda v: dist[v], default=None)
        if u is None or dist[u] == inf:
            break
        done[u] = True
        for v, w in graph[u]:
            if not done[v]:
                dist[v] = min(dist[v], dist[u] + w)
    return dist
```

这是距离计算核心，不负责网络路径请求、输入解析或通用数值误差处理。权重含小数时，比较语义还要按应用精度要求设计。

### 优先队列为什么有过期条目？

堆优化版可以把“发现更短距离”作为新的条目入队。某节点原来距离 8，后来改善为 5，堆里可能同时存在 8 和 5 两条记录。

先取出 5 并处理以后，迟些取出的 8 已经过期，不能按旧距离重复扩展。通常通过比较条目距离与当前 dist，或结合确定状态跳过。

这种重复入队二叉堆实现，在一般含平行边的图上可写作 O((V+E) log(V+E)) 的上界；常见简单图说明会简写为 O((V+E) log V)。使用支持减小键值的堆时，实现和分析又不同，不能只背“所有版本 O(E log V)”。

![堆中旧距离候选应与当前dist比较并跳过过期项](https://note.lgdsunday.club/img/Q413/03-stale-heap-entry-v2.webp)

### 需要路径，还要多保存一份信息

距离改善时，记录这次从哪个前驱走来。最终从终点沿前驱倒推，才能还原路径。

未到达的节点没有有效路径；多个等长路径可能只保留其中一条，若要输出全部，则需要不同的记录方式和复杂度考虑。

## 面试官继续追问

### 无权图也要用 Dijkstra 吗？

边权相同的无权最短路通常用 BFS 更直接。选择算法要利用问题条件。

### 有负权边应该考虑什么？

可以考虑 Bellman-Ford 等适合条件的算法；有向无环图还可利用拓扑顺序。负环影响下可能不存在有限最短距离。

### 路径上有环就一定不能用吗？

不是。非负环不会让路径越绕越短，标准 Dijkstra 可以处理包含环的非负权图。

## 面试速记卡

> - 基本条件：合法图、非负边权。
> - 每轮操作：选择最小未确定距离，松弛出边。
> - 负权风险：已确定距离仍可能被缩短，无负环也不够。
> - 堆实现：旧距离条目可能过期，需要跳过。
> - 输出区别：距离用 dist，具体路径还需前驱。

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
