# 拓扑排序是什么？如何判断任务依赖中有没有环？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/cs-basics/q412-topological-sort-cycle-detection/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：几个构建任务互相依赖，怎么确定执行顺序？

🙋‍♂️ 我：把依赖少的任务先执行。

🧑‍💻 面试官：依赖少但仍有一个没完成，能开始吗？A 依赖 B，B 又依赖 A 呢？

🙋‍♂️ 我：应该从没有未完成前置依赖的任务开始。

🧑‍💻 面试官：最后还有任务出不来，就全都是环上的节点吗？同一批没依赖关系的任务又能否并行？

> 拓扑排序不是按“依赖多少”排名，而是不断找出前置依赖已经满足的节点。没有可选节点时，还要判断是不是依赖成了环。

## 面试速答（60 秒版）

拓扑排序是在有向图中安排节点顺序，使每条依赖边的起点都出现在终点之前。完整拓扑序存在的前提是有向图没有环。

常见的 Kahn 算法先计算入度，把入度为零的节点放进队列。取出一个节点后，减少它后继节点的入度，新的零入度节点继续入队。

如果处理节点数小于总节点数，图中存在环。但未处理节点不一定都在环上，也可能只是被环阻塞的后继。

算法的时间复杂度是 O(V+E)。它给出依赖可满足的顺序，不自动解决任务运行失败、并发数量或实际调度策略。

![拓扑排序不断释放零入度节点未处理数量用于判环](https://note.lgdsunday.club/img/Q412/01-topology-overview.webp)

## 知识点详解：把依赖变成可以逐步消除的边

### 先统一边的方向

假设构建应用之前，需要先构建组件库。我们画“组件库 → 应用”，表示起点是前置任务，终点依赖起点。

如果题目输入反过来写成“应用依赖组件库”，建图时就要转成统一方向。方向不清楚，再熟练的算法也可能得到倒过来的答案。

这里是有向依赖图，不是普通无向连通图。

### 入度为零，意味着什么？

入度是指向该节点的边数。在剩余图里，入度为零表示没有尚未消除的前置依赖。

假设 A → C，B → C，C → D。开始时 A、B 可选；拿走 A 后，C 还依赖 B，不能入队。拿走 B 后，C 才变成零入度，之后才轮到 D。

A、B 谁先出队都可以，所以拓扑序不一定唯一。[Princeton TopologicalX 原始实现](https://github.com/kevin-wayne/algs4/blob/master/src/main/java/edu/princeton/cs/algs4/TopologicalX.java)

### 怎样实现 Kahn 算法？

下面假设节点是 0 到 n-1，输入已经检查为合法整数节点；边 u→v 表示 v 依赖 u。生产入口仍需校验 n 和端点范围。

**TypeScript：**

```typescript
function topologicalSort(
  n: number, edges: Array<[number, number]>,
): number[] | null {
  const next: number[][] = Array.from({ length: n }, () => []);
  const degree = Array(n).fill(0);
  for (const [u, v] of edges) {
    next[u].push(v);
    degree[v]++;
  }
  const queue = Array.from({ length: n }, (_, i) => i)
    .filter(i => degree[i] === 0);
  const order: number[] = [];
  for (let head = 0; head < queue.length; head++) {
    const u = queue[head];
    order.push(u);
    for (const v of next[u]) {
      if (--degree[v] === 0) queue.push(v);
    }
  }
  return order.length === n ? order : null;
}
```

**Python：**

```python
from collections import deque

def topological_sort(n: int, edges: list[tuple[int, int]]):
    next_nodes = [[] for _ in range(n)]
    degree = [0] * n
    for u, v in edges:
        next_nodes[u].append(v)
        degree[v] += 1
    queue = deque(i for i in range(n) if degree[i] == 0)
    order = []
    while queue:
        u = queue.popleft()
        order.append(u)
        for v in next_nodes[u]:
            degree[v] -= 1
            if degree[v] == 0:
                queue.append(v)
    return order if len(order) == n else None
```

每个节点出队一次，每条边检查一次，因此时间复杂度是 O(V+E)，连同邻接表的存储需要 O(V+E) 空间。TypeScript 用头指针推进队列，避免反复 shift 导致不必要的数组搬动。

### 剩下的节点为什么不全是环？

假设 A→B、B→A，同时 B→C。A、B 构成环，C 只是依赖 B，但同样无法进入零入度队列。

因此处理数量不足可以判定存在环，却不能把所有剩余节点都标成“环成员”。要给用户展示具体环，可以继续使用 DFS 路径状态或强连通分量等方法分析。

DFS 判环也不能只用一个“访问过”标记；要区分正在当前递归路径中的节点和已经完成的节点。

### 排序不等于真实任务已经完成

算法中的“移除 A”，表示计算顺序时假设 A 可以先处理。真实调度器只有在 A 实际完成并满足成功条件后，才能释放依赖它的任务。

同一批零入度任务可以具备并行机会，但仍要限制资源并发、处理失败和取消。拓扑序只是调度的一部分。

![拓扑依赖要等待前驱成功完成才能释放后继任务](https://note.lgdsunday.club/img/Q412/02-parallel-task-completion-v2.webp)

第四格表示 C 已完成、D 刚开始执行，不表示 D 已经完成。运行时的成功依赖，要以任务真正完成为准。

## 面试官继续追问

### 图不连通，还能拓扑排序吗？

可以。不同连通部分都要处理，孤立节点也应出现在完整结果中。

### 自环能检测出来吗？

可以。节点指向自己，入度无法通过其他节点消除，最终处理数量不足。

### 重复边会不会破坏算法？

如果入度和邻接表都一致记录重复边，算法仍可正确处理；也可以在建图时去重，但不能只在其中一处去重。

## 面试速记卡

> - 边方向：前置任务 → 依赖它的任务。
> - Kahn：零入度入队，处理后减少后继入度。
> - 判环：处理数量不足说明有环。
> - 剩余节点：可能是环成员，也可能是受阻后继。
> - 工程边界：拓扑序不替代真实完成状态与并发控制。

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
