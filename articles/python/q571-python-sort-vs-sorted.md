# Python 的 sort 和 sorted 有什么区别？为什么 sort 的返回值是 None？

[京东测试开发面试真题](../companies/jd-test-development.md) · [快手测试开发面试真题](../companies/kuaishou-test-development.md) · [美团测试开发面试真题](../companies/meituan-test-development.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/python/q571-python-sort-vs-sorted/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：Python 的 sort 和 sorted 有什么区别？

🙋‍♂️ 我：sort 修改原列表，sorted 返回新列表。

🧑‍💻 面试官：那我写 result = values.sort()，result 能拿到排序结果吗？

🙋‍♂️ 我：不能，sort 的返回值是 None。

🧑‍💻 面试官：如果输入是元组，或者另一个变量也引用原列表，这两种写法又有什么影响？

> 先看排序改了谁，再看调用返回了什么。能把这两个动作分开，就不会把原地修改的结果赋成 None。

## 面试速答（60 秒版）

list.sort 会直接调整当前列表里的顺序，返回 None。sorted 接收可迭代对象，生成一个新的排序列表，原容器通常不会因此被重新排列。

因此，已有列表就是要被修改，可以调用 sort；需要保留原顺序，或者输入是元组、生成器等其他可迭代对象，可以使用 sorted。

两者都能通过 key 指定每项用什么值参与排序，也支持 reverse。排序具有稳定性，排序键相同的项会保留原来的相对顺序。

不过，sorted 创建的新列表仍引用原来的成员对象，它没有把所有成员深拷贝。选择时还要确认元素能否比较，以及业务是否允许改动调用方传来的列表。

![sort 改原列表，sorted 交新列表](https://note.lgdsunday.club/img/Q571/01-overview.webp)

## 知识点详解：排序以后，原列表和返回值分别是什么

### 为什么 result 会得到 None？

假设 values 保存三个评分。执行 values.sort() 以后，这个列表里的成员已经按规则重新排列。

方法已经把修改完成了，不需要再通过返回值交出一份列表。它约定返回 None，所以 result = values.sort() 得到的是 None，不能接着遍历 result。

sorted 则承担另一种使用方式。调用方交来一组数据，它把排序结果装进新列表再返回。名字看起来只差几个字母，返回契约却不同。

#### Python

```python
values = [3, 1, 2]
alias = values
result = values.sort()
print(values, alias, result)  # [1, 2, 3] [1, 2, 3] None
source = [3, 1, 2]
ordered = sorted(source)
print(source, ordered)       # [3, 1, 2] [1, 2, 3]
```

#### TypeScript（Array.sort 返回值不同）

```typescript
const values = [3, 1, 2];
const alias = values;
const result = values.sort((a, b) => a - b);
console.log(result === values, alias); // true [1, 2, 3]
const source = [3, 1, 2];
const ordered = [...source].sort((a, b) => a - b);
console.log(source, ordered); // [3, 1, 2] [1, 2, 3]
```

JS Array.sort 会返回同一个数组，不遵守 Python list.sort 的 None 约定。这也是跨语言写代码时不能只靠方法名称判断返回值的原因。

### 另一个名字，为什么也看到了新顺序？

上面的 alias 和 values 指向同一列表。sort 改的是这个对象，两个名字自然都能看到变化。

假设一个函数收到界面的原始结果列表，内部只是想生成排名，却直接调用 sort，调用方原本保留的顺序也会被改。这个影响要在函数约定里说清楚。

使用 sorted 可以保留外层容器的排列，但成员仍然共享。例如成员是字典，排序以后修改某个字典字段，原列表里的同一对象仍能看到。不要把“新列表”理解成“所有数据完全独立”。

![两个名字，都能看到同一列表变顺序](https://note.lgdsunday.club/img/Q571/02-aliases.webp)

### key 是取比较值，不是比较两个成员

假设每个任务有一个时长字段，key 函数只需要从当前任务拿出这个时长，排序过程再比较这些键。

这和一些语言里的双参数比较器不同。把比较器机械地塞给 key，可能得到参数数量错误，或者让逻辑完全变样。key 通常对每个输入成员计算一次，不需要为了加速在函数内部反复缓存同一字段。

如果排序键相同，稳定排序会保留这些项原先的相对顺序。但它不会把不稳定的输入来源变成固定排名；需要进一步确定顺序时，应明确额外规则。多字段排序已有专门文章，这里不再展开。

### 元组和生成器，也可以交给 sorted

sorted 只要求能够拿到待排序的成员，不要求输入本身能被原地修改。因此，元组可以作为输入，结果仍然是列表。

生成器输入也会被消费。排序需要看到整批成员，不能因为来源是生成器，就认为 sorted 可以一直保持逐项流式输出。

验证时除了比较数值顺序，还可以检查原列表、别名、返回值和成员身份。需要 key 的例子再加入相同键、混合类型以及异常数据，避免演示成功就以为全部输入都可以排序。

依据：[Python 3.11 list.sort](https://docs.python.org/3.11/library/stdtypes.html#list.sort)、[Python 排序指南](https://docs.python.org/3.11/howto/sorting.html)、[MDN Array.sort](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)。

![能迭代，也能成为 sorted 的输入](https://note.lgdsunday.club/img/Q571/03-input-v2.webp)

## 面试官继续追问

### reverse=True 会破坏稳定性吗？

Python 的降序排序仍保持相等键成员的相对顺序。降序和稳定性是不同要求。

### 列表里混着数字和字符串，默认能排序吗？

这类对象未必存在支持的大小比较。应明确排序键或拒绝不符合数据约定的输入。

### sorted 是否适合无限生成器？

不适合。它要收集待排序数据，输入不结束，就不能形成完整排序结果。

## 面试速记卡

> - sort 修改当前列表，返回 None。
> - sorted 接收可迭代对象，返回新列表。
> - 别名指向同一个列表时，会共同看到原地排序。
> - 新外层列表不等于成员深拷贝。
> - key 提取比较值；稳定性不能代替完整排名规则。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **京东 · 测试开发 · 校招提前批**：Python 对列表排序有哪些方法，sort 和 sorted 怎样使用？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353158125387718656)；正文记录 7 月 20 日一面后约二面；原帖发布于 2021-07-22。
- **快手 · 测试开发 · 2022暑期实习（原帖标题）**：给定字典，怎样根据 value 对键值对排序？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/364846466995679232)；原帖编辑于 2022-06-10；快手部分的面试日期未明确。
- **美团 · 测试开发 · 2022暑期实习（原帖标题）**：怎样用匿名函数实现 Python 列表排序？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/364846466995679232)；原帖编辑于 2022-06-10；美团部分的面试日期未明确。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
