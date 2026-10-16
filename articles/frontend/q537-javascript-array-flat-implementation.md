# JavaScript 数组扁平化怎么实现？flat 的 depth 参数和空数组项怎么处理？

[百度前端面试真题](../companies/baidu-frontend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q537-javascript-array-flat-implementation/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：手写一个数组扁平化函数，你会怎么做？

🙋‍♂️ 我：遍历元素，遇到数组就递归，把结果按顺序合并。

🧑‍💻 面试官：如果只展开一层呢？\[1,\[2,\[3]]] 应该得到什么？

🙋‍♂️ 我：应该是 \[1,2,\[3]]，不能把 \[3] 也展开。

🧑‍💻 面试官：那数组里的空槽和真正的 undefined，你能区分吗？

> 扁平化先确定展开层数，再处理元素；空槽和实际值也不能混成一回事。

## 面试速答（60 秒版）

数组扁平化就是把指定层数的嵌套数组展开，按原有顺序收集元素。`flat()` 默认展开一层，depth 为零时不展开内部数组。

手写时可以遍历当前数组。遇到数组并且 depth 还大于零，就递归处理，下一层 depth 减一；其他值直接放进结果。

JavaScript 原生 flat 会跳过被访问层级里的空槽，但真正存在的 undefined 仍然是值。同时，它不会深拷贝对象。实现以后应检查层数、空输入、顺序和引用关系，深层递归或循环数组则需要另外明确边界。

![展开一层，保留下一层](https://note.lgdsunday.club/img/Q537/01-overview.webp)

## 知识点详解：为什么展开一层，和一路递归到底不同

### 先用一组数组确认层数

假设输入是 \[1,\[2,\[3]]]。展开一层，就是把直接遇到的 \[2,\[3]] 拆开，结果为 \[1,2,\[3]]。内部 \[3] 留在结果中。

展开两层才得到 \[1,2,3]。因此，每进入一次需要展开的数组，剩余深度都要减一。不能看到数组就无限递归，再靠结果长度猜有没有展开够。

![depth 每进入一层就减一](https://note.lgdsunday.club/img/Q537/02-depth.webp)

### 空槽没有元素，undefined 是一个元素

JavaScript 可以创建某个下标不存在的数组。例如 \[1, , 3] 的中间位置是空槽，而 \[1, undefined, 3] 的中间位置真的保存了 undefined。

原生 flat 在遍历相应层级时会跳过空槽。判断时需要检查下标是否存在，不能只检查读取出的值，因为两种情况都可能读到 undefined。

没有被展开的嵌套数组，其内部空槽仍然保留。Python list 没有相同的空槽语义，因此下面的 Python 版本只对应普通嵌套列表，不伪装成完全相同的原生 API。

![空槽和 undefined 不相同](https://note.lgdsunday.club/img/Q537/03-holes.webp)

### 递归实现，把剩余层数传下去

下面限定输入为数组／列表，depth 为非负整数或无穷大。这样能先把算法讲清楚，不把 JavaScript 原生的参数转换规则全部塞进示例。

#### TypeScript

```typescript
function flatten(values: unknown[], depth = 1): unknown[] {
  if (depth !== Infinity && (!Number.isInteger(depth) || depth < 0)) {
    throw new RangeError('depth 必须是非负整数或 Infinity');
  }
  const out: unknown[] = [];
  for (let i = 0; i < values.length; i++) {
    if (!(i in values)) continue;
    const value = values[i];
    if (Array.isArray(value) && depth > 0) {
      out.push(...flatten(value, depth === Infinity ? Infinity : depth - 1));
    } else {
      out.push(value);
    }
  }
  return out;
}
console.log(flatten([1, [2, [3]]], 1)); // [1, 2, [3]]
```

#### Python

```python
def flatten(values, depth=1):
    if depth != float('inf') and (type(depth) is not int or depth < 0):
        raise ValueError('depth 必须是非负整数或无穷大')
    out = []
    for value in values:
        if isinstance(value, list) and depth > 0:
            next_depth = depth if depth == float('inf') else depth - 1
            out.extend(flatten(value, next_depth))
        else:
            out.append(value)
    return out

print(flatten([1, [2, [3]]], 1))  # [1, 2, [3]]
```

如果元素是对象，结果仍会保存这个对象的引用。展开数组结构与复制对象，是两件不同的工作。

### 数据特别深，要检查调用栈与输出方式

递归层数很多时，可能耗尽调用栈。TypeScript 示例使用展开参数合并结果，大量元素也可能超过函数参数数量限制。因此这段代码适合解释和普通小输入，不能直接当成无限规模实现。

较大输入可以使用显式栈保存元素及剩余深度，并逐个加入输出。循环引用还需单独拒绝或定义处理方法，原生 Infinity 也不意味着能安全展开一个包含自身的数组。

检查时用原生 flat 对照正常输入，再确认对象仍保持引用。依据：[MDN flat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flat)。

![展开结构，仍引用同一个对象](https://note.lgdsunday.club/img/Q537/04-references.webp)

## 面试官继续追问

### flat 会深拷贝结果中的对象吗？

不会。它改变数组层级，不把对象内部重新复制一遍。

### depth 为 Infinity 就能处理所有输入吗？

不能推出这个保证。循环引用、极深输入和输出规模都可能造成问题，需要定义和验证边界。

### 不用递归，能实现吗？

可以用显式栈携带剩余层数，但要保持元素顺序。用后进先出栈时，入栈方向也要安排正确。

## 面试速记卡

> - depth：控制数组展开几层，默认一层。
> - 递归：只在可展开时进入，并减少剩余层数。
> - 空槽：被遍历层级里跳过；undefined 是实际值。
> - 对象：仍保留原引用，扁平化不等于深拷贝。
> - 大输入：另查调用栈、合并方式与循环结构。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **百度 · 前端 · 实习（原帖标签）**：怎样手写数组扁平化？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/530709141912829952)；原帖编辑于 2023-09-15。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
