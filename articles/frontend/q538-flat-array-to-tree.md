# 扁平数组如何转换成树形结构？如何避免重复遍历和父子关系出错？

[腾讯前端面试真题](../companies/tencent-frontend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q538-flat-array-to-tree/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：把扁平数组转成树，你会怎么写？

🙋‍♂️ 我：可以给每个节点找出它的子节点，递归组装。

🧑‍💻 面试官：每层都扫整个数组，节点多了会有什么问题？

🙋‍♂️ 我：重复扫描会增加开销，可以先用 ID 建索引。

🧑‍💻 面试官：如果有两个相同 ID，或者 A 的父节点是 B、B 的父节点又是 A 呢？

> 数组转树先建立身份索引，再连接父子关系；坏输入要在挂接之前处理。

## 面试速答（60 秒版）

扁平数组转树，可以先遍历一次，为每个 ID 建立节点对象和空 children。这样即使子节点先出现，父节点也已经能从索引里找到。

接下来按 parentId 挂接。parentId 为空的节点放进根列表，其他节点加入父节点的 children。

这里需要提前明确输入规则。示例拒绝重复 ID、缺失父节点和环，避免静默丢数据或产生无限递归。索引和挂接通常可以做到线性处理；返回新节点不会修改原始记录，但额外的嵌套字段是否复制，仍要按需要决定。

![先建索引，再接父子](https://note.lgdsunday.club/img/Q538/01-overview.webp)

## 知识点详解：先认出所有节点，再把父子关系接起来

### 为什么不要边读边猜父节点在哪

假设列表先返回‘开发组’，后返回它所属的‘技术部’。如果读到开发组时只在已经读过的记录里找父节点，就会误认为父节点不存在。

可以先建立完整 ID 索引。这个阶段只创建节点，不挂接父子。列表顺序再乱，也不妨碍第二阶段找父节点。

children 的顺序可以按原输入顺序保留。若需要业务排序，应该在规则里明确，不能把 Map 的存在当成自动排序。

![子节点先来，也能找到父节点](https://note.lgdsunday.club/img/Q538/02-unordered.webp)

### 先明确什么情况需要报错

下面选择一套便于教学和验证的规则。根节点的 parentId 是 null；重复 ID、指向不存在的父节点和成环，都报错。

有些业务允许孤儿节点暂时作为根，这也是一种约定，但必须让调用方知道。静默丢掉孤儿或让后一个重复 ID 覆盖前一个，会让结果看起来正常，实际少了数据。

环检查可以沿每个节点的父链走。当前链中再次遇到同一节点，说明有环；遇到已经检查完的链，就不必重复走到底。

![父链绕回来，就不能挂成树](https://note.lgdsunday.club/img/Q538/03-cycle.webp)

### 两阶段组装，加一段父链检查

TypeScript 的 Map 与 Python 的 dict 都用于查找节点，颜色标记记录当前检查链与已完成链。以下输入记录只包含示例要求的字段。

#### TypeScript

```typescript
type Row = { id: number; parentId: number | null; name: string };
type TreeNode = Row & { children: TreeNode[] };
function toTree(rows: Row[]): TreeNode[] {
  const byId = new Map<number, TreeNode>();
  for (const row of rows) {
    if (byId.has(row.id)) throw new Error('重复 id');
    byId.set(row.id, { ...row, children: [] });
  }
  for (const row of rows) {
    if (row.parentId !== null && !byId.has(row.parentId)) {
      throw new Error('父节点不存在');
    }
  }
  const color = new Map<number, number>();
  for (const row of rows) {
    const chain: number[] = [];
    let id: number | null = row.id;
    while (id !== null && color.get(id) !== 2) {
      if (color.get(id) === 1) throw new Error('存在环');
      color.set(id, 1); chain.push(id);
      id = byId.get(id)!.parentId;
    }
    for (const item of chain) color.set(item, 2);
  }
  const roots: TreeNode[] = [];
  for (const row of rows) {
    const node = byId.get(row.id)!;
    if (row.parentId === null) roots.push(node);
    else byId.get(row.parentId)!.children.push(node);
  }
  return roots;
}
```

#### Python

```python
def to_tree(rows):
    by_id = {}
    for row in rows:
        if row['id'] in by_id:
            raise ValueError('重复 id')
        by_id[row['id']] = {**row, 'children': []}
    for row in rows:
        if row['parentId'] is not None and row['parentId'] not in by_id:
            raise ValueError('父节点不存在')
    color = {}
    for row in rows:
        chain, node_id = [], row['id']
        while node_id is not None and color.get(node_id) != 2:
            if color.get(node_id) == 1:
                raise ValueError('存在环')
            color[node_id] = 1
            chain.append(node_id)
            node_id = by_id[node_id]['parentId']
        for item in chain:
            color[item] = 2
    roots = []
    for row in rows:
        node = by_id[row['id']]
        if row['parentId'] is None:
            roots.append(node)
        else:
            by_id[row['parentId']]['children'].append(node)
    return roots
```

每个节点完成检查后就标记为已完成，随后挂接。正常情况下，索引、父链检查和挂接各自只需线性级别的工作；这一判断基于容器的常见查找成本。

![重复和孤儿，是两类坏输入](https://note.lgdsunday.club/img/Q538/04-errors.webp)

### 还要检查深度、引用与可见结果

新节点是对输入记录的浅层复制，children 由函数新建。若记录带有额外的嵌套对象，这些对象不自动深拷贝。

转换阶段用父链循环，避免因很深的树在验证时直接递归。但后续渲染或 JSON 序列化仍可能受到深度和输出规模影响，需要按使用方限制检查。

验证结果时，除了看根节点，还要统计每个输入 ID 是否恰好出现一次，并确认父子关系与输入一致。底层容器语义参考：[MDN Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)。

![多个根，得到的是森林](https://note.lgdsunday.club/img/Q538/05-forest.webp)

## 面试官继续追问

### 父节点不存在，能直接当根吗？

可以设计这种规则，但要明确返回标记或错误报告。示例采用报错，避免默默改变层级。

### 有多个 parentId 为空的节点，返回哪个？

返回根列表，也就是森林。只允许单棵树的业务需要额外约束，或使用明确的虚拟根。

### 每个节点的 children 能直接复用输入的吗？

要看输入合同。当前实现新建 children，避免把旧的嵌套结构和新的 parentId 关系混在一起。

## 面试速记卡

> - 先建全部节点的索引，再连接父子。
> - 根节点规则要明确，多个根形成森林。
> - 重复 ID、孤儿和环分别处理。
> - 复杂度看每个节点是否被反复扫描。
> - 浅复制与后续深度限制要单独检查。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **腾讯 · 前端（腾讯音乐） · 秋招（原帖标题）**：怎样将数组转换成树形结构？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/727507402857127936)；正文记录 9 月 24 日、9 月 26 日面试，未明确面试年份；原帖发布于 2025-03-07。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
