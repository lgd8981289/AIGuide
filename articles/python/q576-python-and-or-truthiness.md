# Python 的 and、or 为什么不一定返回布尔值？默认值判断有哪些坑？

[海康威视测试面试真题](../companies/hikvision-testing.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/python/q576-python-and-or-truthiness/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：Python 的 and、or 返回值一定是 True 或 False 吗？

🙋‍♂️ 我：平时我主要把它们用在条件判断里。

🧑‍💻 面试官：那 0 or 10 得到什么？'ok' and 7 呢？

🙋‍♂️ 我：分别是 10 和 7，返回的可以是操作数。

🧑‍💻 面试官：如果 quantity 合法值就是 0，用 quantity or 10 当默认值，会不会把合法输入改掉？

> 短路运算先判断真值，再决定是否继续读取右边。返回的操作数和布尔判断结果，不是同一份东西。

## 面试速答（60 秒版）

Python 的 and、or 会根据操作数的真值决定是否继续计算，结果通常直接返回某个操作数，不一定是布尔值。

and 遇到左边是假值时返回左边，否则继续计算并返回右边。or 遇到左边是真值时返回左边，否则继续计算并返回右边。

因此，value or default 不只处理 None，也会把 0、空字符串、空列表等假值换成默认值。如果这些是合法数据，就应该按实际缺失条件写判断。

同时，短路意味着右侧表达式可能根本不执行。这里既影响结果，也影响函数调用和副作用；不能把 and、or 当作先算好两边再合并的普通函数。

![短路判断后，交出一个操作数](https://note.lgdsunday.club/img/Q576/01-overview.webp)

## 知识点详解：判断真值以后，返回哪一个操作数

### 条件能判断真值，结果却可以保留原对象

假设写 "ok" and 7。左边非空字符串是真值，所以继续读取右边，结果是整数 7。

写 0 and load\_data()，左边是假值，结果直接是 0，load\_data 不会被调用。or 的选择反过来，左边真就保留左边，否则继续看右边。

这解释了为什么一个布尔表达式可以返回字符串、列表或数字。如果确实需要 True/False，可以对最终结果做 bool 转换，但要知道对象自己的真值规则是否符合需求。

### 默认值判断，最容易丢掉合法的零

假设一个接口允许数量为 0，表示暂时不执行。quantity or 10 会把 0 替换为 10，已经改变了调用方的意图。

#### Python

```python
quantity = 0
print(quantity or 10)                        # 10
print(10 if quantity is None else quantity)  # 0
print("ok" and 7)                           # 7
print([] or ["默认项"])                     # ['默认项']
```

#### TypeScript（空值合并对照）

```typescript
const quantity: number | null = 0;
console.log(quantity || 10); // 10
console.log(quantity ?? 10); // 0
const ready: string = "ok";
console.log(ready && 7);     // 7
```

JS 的 ?? 只按 null/undefined 处理缺失，是这个例子里保留零值的方式。Python 这里明确按 None 判断，不能把两种语言的所有假值列表当成完全相同。

![合法的零，别当作缺失](https://note.lgdsunday.club/img/Q576/02-zero.webp)

### 右侧没执行，就不会产生对应副作用

假设 cached or fetch() 用来读缓存。如果 cached 是一个真值，fetch 不会调用；cached 是空列表时却会走到 fetch。

这可能符合“空结果需要重新读取”的约定，也可能错误。假设缓存里空列表表示已经查询过、确实没有结果，那么重新查询只是重复工作。

所以，在缓存、配置与接口参数里，先定义什么叫缺失，再选择判断方式。不能因为 or 写得短，就让空列表、零和未设置混成一种状态。

![空结果是否缺失，要由接口约定](https://note.lgdsunday.club/img/Q576/03-cache-v3.webp)

### 容器与自定义对象有自己的真值规则

常见空容器是假值，非空容器通常是真值。但自定义类可以通过 **bool** 或 **len** 参与判断，读取真值不一定只是检查对象是否存在。

例如一个复杂对象的真值方法可能报错，某些第三方数组还会拒绝含糊的整体真值判断。因此，不要把所有对象都套进“有对象就为真”的直觉。

测试默认值逻辑时，至少放入 None、0、空字符串和正常值，检查哪些值确实应该替换。涉及函数短路，再记录函数调用次数，确认没有漏掉必须执行的操作。

依据：[Python 3.11 真值与布尔操作](https://docs.python.org/3.11/library/stdtypes.html#truth-value-testing)、[Python 数据模型真值方法](https://docs.python.org/3.11/reference/datamodel.html#object.__bool__)、[MDN 空值合并](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing)。

## 面试官继续追问

### not 也返回原来的操作数吗？

not 返回布尔值，它和 and/or 的返回规则不同。

### 空列表在 Python 和 JavaScript 里真值相同吗？

不同。Python 空列表是假值，JavaScript 数组对象即使为空也是真值，跨语言迁移要重新检查条件。

### 用 if quantity 判断，能验证数量是正整数吗？

不能。真值判断只回答当前对象如何参与布尔条件，并没有完成类型、范围与业务约束校验。

## 面试速记卡

> - and/or 按真值短路，结果可以是原操作数。
> - and 左假即返回，or 左真即返回。
> - 右侧表达式可能完全不执行。
> - value or default 会替换合法零值和空容器。
> - 缺失条件需要明确定义，跨语言真值规则要核对。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **海康威视 · 软件测试 · 校招**：除了 0 和 None，还有哪些 Python 值在布尔判断中是 False？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353159469196582912)；原帖编辑于 2022-08-19。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
