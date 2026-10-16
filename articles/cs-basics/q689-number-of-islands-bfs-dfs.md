# 岛屿数量怎么计算？DFS、BFS 和访问标记如何配合？

[数字马力开发面试真题](../companies/shuzimali-development.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/cs-basics/q689-number-of-islands-bfs-dfs/) · [题库目录](../../README.md)

*下面是用于讲题的模拟面试对话。*

🧑‍💻 **面试官：** 二维地图里 1 是陆地，怎么数岛屿？

🙋‍♂️ **我：** 找到陆地就做一次搜索，把连在一起的地方找完。

🧑‍💻 **面试官：** 左上和右下斜着碰到，算连接吗？

🙋‍♂️ **我：** 按这道题，只算上下左右。

🧑‍💻 **面试官：** 同一个格子被两个邻居同时发现，怎样避免反复入队？一万格长链用递归安全吗？

> 每次从一块尚未访问的陆地出发，完整标记一个连通块。计数的是搜索起点，不是搜索访问了多少格。

## 面试速答（60 秒版）

遍历全部格子，遇到未访问的陆地，就把岛屿数加一，并用 DFS 或 BFS 把它上下左右连通的陆地全部标记。

搜索里的节点应该在加入栈或队列时就标记，避免同一格被不同邻居重复安排。后面再次扫描到已标记陆地，不再增加岛数。

设网格有 m 行、n 列，每格只被处理有限次，时间 O(mn)。访问标记与最坏搜索容器都可占 O(mn)。原地改成水可以省单独标记表，但会修改输入。

本文使用显式栈 DFS，不依赖递归深度，也保留原网格。对角线不相连、空网格、全水、全陆地都要测试。

![一轮搜索，数一座岛](https://note.lgdsunday.club/img/Q689/01-number-of-islands-bfs-dfs.webp)

## 知识点详解：一轮搜索，对应一个完整连通块

### 陆地数和岛屿数不是一回事

假设地图是下面这个矩形，字符 1 表示陆地。

```text
1100
0101
0011
```

左上的三格连成一块，右下三格连成另一块。它们只有斜角接近，不按本题的四邻接规则连接，所以是两座岛。[LeetCode 200 原题](https://leetcode.cn/problems/number-of-islands/)明确采用水平和竖直相邻。

搜索过程中访问六格，不代表六座岛。外层遇到一个新的连通块，才增加一次。

### 入栈就标记，别等出栈再说

一个格子可能被两个已访问邻居同时发现。如果只是把它放进栈、却仍标成未访问，另一个邻居还会把它再放一遍。

因此，在安排它以后就记录“已经发现”，让后面的邻居跳过。这和真正弹出处理是两个时刻，提早标记能避免重复工作。

DFS 用栈，BFS 用队列，访问顺序不同，但在这道只计连通块的题里，都可以把同一座岛完整覆盖。

![发现新陆地时，就标记](https://note.lgdsunday.club/img/Q689/02-number-of-islands-bfs-dfs.webp)

### 用显式栈保存接下来要访问的位置

以下约定输入是规则矩形，元素为字符串 "0" 或 "1"。空数组与空行也能返回 0。

#### TypeScript

```typescript
function numIslands(grid: string[][]): number {
  const rows = grid.length;
  if (rows === 0) return 0;
  const cols = grid[0].length;
  const seen = Array.from({ length: rows }, () => Array(cols).fill(false));
  const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  let islands = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] !== "1" || seen[r][c]) continue;
      islands++;
      seen[r][c] = true;
      const stack: [number, number][] = [[r, c]];
      while (stack.length > 0) {
        const [x, y] = stack.pop()!;
        for (const [dx, dy] of directions) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || nx >= rows || ny < 0 || ny >= cols) continue;
          if (grid[nx][ny] !== "1" || seen[nx][ny]) continue;
          seen[nx][ny] = true;
          stack.push([nx, ny]);
        }
      }
    }
  }
  return islands;
}
```

#### Python

```python
def num_islands(grid: list[list[str]]) -> int:
    if not grid:
        return 0
    rows, cols = len(grid), len(grid[0])
    seen = [[False] * cols for _ in range(rows)]
    directions = ((1, 0), (-1, 0), (0, 1), (0, -1))
    islands = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] != "1" or seen[r][c]:
                continue
            islands += 1
            seen[r][c] = True
            stack = [(r, c)]
            while stack:
                x, y = stack.pop()
                for dx, dy in directions:
                    nx, ny = x + dx, y + dy
                    if not (0 <= nx < rows and 0 <= ny < cols):
                        continue
                    if grid[nx][ny] != "1" or seen[nx][ny]:
                        continue
                    seen[nx][ny] = True
                    stack.append((nx, ny))
    return islands
```

显式栈只是把工作列表放到可管理的数据结构里，不代表空间变成 O(1)。一大片复杂地形，仍可能保存很多待访问位置。

## 面试官继续追问

### 为什么不用 JS 的 shift 实现 BFS？

若数组实现中每次移除头部需要移动剩余项，就会增加开销。可以用数组加头下标，Python 则可用 deque。算法说 O(mn)，实现也要采用符合成本假设的队列操作。

### 动态新增陆地呢？

那是另一个问题。每次全图重搜可以作为基准，但频繁更新时可评估并查集维护连接。删除陆地会让问题更复杂，不能只说“用了并查集就全部解决”。

## 面试速记卡

> - 计数：未访问陆地作为搜索起点时加一。
> - 连通：本题只有上下左右，不包括对角线。
> - 标记：加入栈或队列时就标记，避免重复安排。
> - 实现：显式栈不受语言递归深度限制，但仍需空间。
> - 复杂度：时间 O(mn)，最坏额外空间 O(mn)。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **数字马力 · 开发（原帖未明确细分岗位） · 校招补录**：怎样计算岛屿数量？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/504260101855850496)；正文记录 6 月 20 日、6 月 28 日技术面；原帖发布于 2023-06-30。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
