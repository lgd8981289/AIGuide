# Python 切片的 start、stop、step 怎么理解？负数索引和倒序切片怎么计算？

[海康威视测试面试真题](../companies/hikvision-testing.md) · [字节开发面试真题](../companies/bytedance-development.md) · [小米测试开发面试真题](../companies/xiaomi-test-development.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/python/q572-python-slicing-negative-index/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：Python 的 values\[1:4] 会拿到哪些项？

🙋‍♂️ 我：从下标 1 到 3，右边界不包含。

🧑‍💻 面试官：那 values\[4:1:-1] 呢？

🙋‍♂️ 我：从 4 往前走，到 1 之前停下来。

🧑‍💻 面试官：把停止位置省略，和写成 -1 是一样的吗？切片赋值又能改变列表长度吗？

> 把切片看成一段按步长访问下标的过程。起点、方向和停止边界看清楚，负数也不用靠背结果。

## 面试速答（60 秒版）

Python 切片通常写成 start:stop:step。start 指定起点，stop 指定停止边界，访问不包含 stop，step 决定移动方向和距离。

正步长向后走，负步长向前走。负数索引一般按序列长度换算，但省略的边界有单独的默认规则，不能随便拿一个显式的 -1 代替。

普通列表切片得到新的外层列表。切片赋值则是在修改原列表，步长为 1 时可以用不同数量的成员替换一段，列表长度也可能改变；非 1 步长的扩展切片赋值需要替换数量匹配。

所以，读结果时按下标推进；看赋值时再确认覆盖了哪些位置、数量是否允许变化。

![切片先看方向，再看边界](https://note.lgdsunday.club/img/Q572/01-overview-v3.webp)

## 知识点详解：沿着下标走一遍，比记口诀更清楚

### 先把位置写出来

假设 values 是 \[0, 1, 2, 3, 4]。这里数字刚好等于下标，比较容易观察。

values\[1:4] 从位置 1 开始，每次向右一格，在位置 4 之前停止，得到 \[1, 2, 3]。如果步长改成 2，访问位置 1、3，得到 \[1, 3]。

stop 是停止边界，不是要求最后一定拿到 stop 前一个成员。步长大于 1 时，最后一次落在哪个位置，要看实际推进过程。

### 向前走时，默认边界也会改变

values\[4:1:-1] 从位置 4 出发，依次访问 4、3、2，在到达 1 时停止，因此结果是 \[4, 3, 2]。

如果写 values\[::-1]，省略起点和终点，负步长对应的默认边界可以覆盖整个倒序过程。

但 values\[:-1:-1] 不等同于完整倒序。这里显式的 -1 表示最后一个位置，停止边界已经落在尾部，默认起点也在尾部，没有可访问区间。

#### Python

```python
values = [0, 1, 2, 3, 4]
print(values[1:4:2])     # [1, 3]
print(values[4:1:-1])    # [4, 3, 2]
print(values[::-1])      # [4, 3, 2, 1, 0]
print(values[:-1:-1])    # []
```

#### TypeScript（显式循环对照负步长）

```typescript
const values = [0, 1, 2, 3, 4];
const selected: number[] = [];
for (let index = 4; index > 1; index--) selected.push(values[index]!);
console.log(selected); // [4, 3, 2]
console.log([...values].reverse()); // [4, 3, 2, 1, 0]
```

JS 的 Array.slice 没有 Python 这样的 step 参数。这里用循环表达同一组访问下标，不把两种 API 硬说成可以直接互换。

![省略终点和写 -1，结果不同](https://note.lgdsunday.club/img/Q572/02-negative-v4.webp)

### 读取切片和切片赋值，改动对象不同

执行 part = values\[1:3]，得到一个新的外层列表。执行 values\[1:3] = \[7, 8, 9]，则把原来两个位置替换为三项，原列表可能由五项变成六项。

这不只是在给两个固定格子逐个赋值，而是在替换一段列表内容。原列表的其他别名也会看到改变。

如果写 values\[::2] = replacement，访问位置是隔开的。Python 要求替换成员数量与这些位置数量一致，不能用一项随意填掉多个分散位置。否则会得到 ValueError。

![切片赋值可以替换一整段](https://note.lgdsunday.club/img/Q572/03-assignment.webp)

### 边界越界和步长为零，要分别看

普通切片的边界超出长度时，通常会按规则调整，并不一定像单项下标访问那样报 IndexError。这对于取“最多前十项”很方便。

步长为零则不成立，没有办法按这个距离向前推进，会报 ValueError。自定义序列可以定义自己的切片处理行为，因此本文讨论的是内置列表等常见序列。

遇到难判断的切片，可以先用 slice(...).indices(len(values)) 看归一化后的边界，再用 range 观察实际下标。测试空列表、不同方向、越界和显式负索引，就能发现哪些直觉是不成立的。

依据：[Python 3.11 序列切片](https://docs.python.org/3.11/library/stdtypes.html#common-sequence-operations)、[Python 数据模型中的 slice](https://docs.python.org/3.11/reference/datamodel.html)。

## 面试官继续追问

### 负数索引是从最后一个成员开始数吗？

-1 通常指最后一项，-2 指倒数第二项。但切片省略边界的默认值仍要单独处理。

### 切片会把嵌套成员也复制吗？

普通列表切片复制外层引用集合，内部成员仍可能共享。深浅拷贝的完整区别在已有文章中展开。

### 用 values\[:0] = items 会发生什么？

它在开头的空区间插入这些成员，可以改变原列表长度；这与读取空切片不是同一个操作。

## 面试速记卡

> - 切片按起点、停止边界和步长访问下标。
> - stop 不被包含，步长决定方向与访问间隔。
> - 省略边界不总等于显式写 -1。
> - 读取切片创建新外层列表，切片赋值修改原列表。
> - 步长为 1 可调整片段长度，扩展切片赋值需要数量匹配。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **海康威视 · 软件测试 · 校招**：Python 字符串切片怎样使用？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353159469196582912)；原帖编辑于 2022-08-19。
- **字节跳动 · 开发（基础架构；原帖未明确细分岗位） · 暑期实习**：Python 切片有哪些细节？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353154849422385152)；原帖编辑于 2019-03-04。
- **小米 · 测试开发 · 原帖未明确批次**：Python 怎样用切片实现数组翻转？（题意整理）。[面经来源](https://www.nowcoder.com/feed/main/detail/54e48fdda120446a80ad9c07bad268c4)；原帖发布于 2024-03-20。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
