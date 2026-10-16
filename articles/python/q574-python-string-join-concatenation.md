# Python 拼接字符串用加号还是 join？大量拼接时怎样判断性能？

[旷视算法面试真题](../companies/megvii-algorithm.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/python/q574-python-string-join-concatenation/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：大量字符串拼接，用加号还是 join？

🙋‍♂️ 我：我会用 join，它通常适合一批片段一起拼。

🧑‍💻 面试官：那字符串只有两段，也一定要先建列表再 join 吗？

🙋‍♂️ 我：两段直接加起来也很清楚。

🧑‍💻 面试官：如果片段来自无限输入，join 还能一直边读边输出吗？

> 先看需要的是一个完整字符串，还是持续写出的文本。拼接方式要跟着结果形态和分配成本选择。

## 面试速答（60 秒版）

只有少量固定字符串时，用加号或 f-string 通常就很清楚。已有一批字符串片段，需要一次得到完整结果时，join 更适合表达这件事。

字符串不可变，反复构造越来越长的结果可能产生较多分配和复制成本。CPython 对部分拼接写法有优化，因此不能简单说所有加号拼接都一定是平方复杂度，也不能保证 join 在每个样例里更快。

另外，join 要形成完整字符串，即使输入来自生成器，也不等于逐段流式输出。输入必须能够结束，结果本身还要占内存。

所以，小规模拼接优先写得清楚；大量片段做受控测量；不需要完整结果的文件或网络输出，再考虑按片段写出。

![完整字符串和持续写出，需求不同](https://note.lgdsunday.club/img/Q574/01-overview.webp)

## 知识点详解：结果越来越长，哪些内容会被重复搬运

### 加号写起来简单，先确认片段有多少

假设要生成一个短提示，前缀、用户名、后缀只有三段，用加号或者 f-string 都容易读懂。为了这点内容专门建立复杂的拼接器，未必有意义。

如果要拼一万条文本，问题就变了。每轮的新结果越来越长，一旦需要复制旧内容，前面已经加入的片段又会被搬一次。累计工作不能只按片段数量估算。

这里讨论的是可能出现的分配成本。CPython 会优化某些局部字符串拼接场景，是否能够复用空间也受引用关系和实际写法影响，不能把所有 += 都贴成同一个复杂度。

![需要复制时，旧内容会反复进入新结果](https://note.lgdsunday.club/img/Q574/02-copies.webp)

### join 把整批拼接的意图写清楚

分隔符字符串调用 join，把输入的字符串片段连接成完整结果。需要换行分隔，就用换行符；不需要分隔，就用空字符串。

#### Python

```python
parts = ["AI", "Agent", "面试"]
print(" / ".join(parts))  # AI / Agent / 面试
try:
    print("".join(["数量", 3]))
except TypeError:
    print("join 的成员必须是字符串")
```

#### TypeScript（Array.join 的成员转换规则不同）

```typescript
const parts = ["AI", "Agent", "面试"];
console.log(parts.join(" / ")); // AI / Agent / 面试
console.log(["数量", 3].join("")); // 数量3
```

Python 的 str.join 不会把任意对象自动变成字符串。需要转换时先明确 str 等处理规则，不要等拼接时才发现类型不符合。JS Array.join 有自己的转换行为，不能据此推断 Python 也会自动处理。

### 来自生成器，为什么仍然不是流式输出？

假设生成器一段段读取文件，最后调用 "".join(generator)。生成器可以避免提前在业务代码里存一份完整片段列表，但 join 仍需要收集和组织输入，最后返回整个字符串。

它必须等到输入结束。生成器无限地产生片段，join 就没有完整结果可以交出来；结果特别大时，也仍然要考虑内存。

因此，按需产生片段和按片段交付结果是两层需求。只要最后一步要求返回一个完整字符串，结果的体积就没有因为生成器而消失。

![生成器给片段，join 仍交完整结果](https://note.lgdsunday.club/img/Q574/03-stream.webp)

### 不需要完整结果时，可以直接写出

假设我们只是导出一个大文件，下游可以接收连续片段。那么让每个片段写入文件或缓冲输出，会比先拼成一个巨大字符串更符合任务。

但写出也有缓冲、错误和部分完成问题。如果写到一半失败，要知道输出是否可继续使用，不能把省内存理解成没有其他代价。

要比较性能，固定相同片段和相同最终内容，区分片段准备时间与拼接时间，多次运行并观察内存。不要把一边包含读取文件、另一边只拼内存片段的结果当成公平比较。

依据：[Python 3.11 字符串与 join](https://docs.python.org/3.11/library/stdtypes.html#str.join)、[Python 编程 FAQ 中的字符串拼接](https://docs.python.org/3/faq/programming.html#what-is-the-most-efficient-way-to-concatenate-many-strings-together)、[MDN Array.join](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/join)。

## 面试官继续追问

### join 空列表会得到什么？

得到空字符串，分隔符不会单独出现在结果里。

### 所有数字先 str 一遍就够了吗？

还要确认格式要求。例如小数位、空值和日期表示，应在转换阶段规定清楚。

### 循环里的 += 不能用吗？

可以用。问题在实际规模与分配行为，先看代码是否清楚，再测关键路径，不凭一种写法直接判定性能。

## 面试速记卡

> - 少量固定片段，可以直接拼接或用 f-string。
> - 整批字符串片段形成完整结果，join 表达清楚。
> - 反复拼接可能重复分配与复制，具体行为看实现。
> - Python join 要求字符串成员，JS join 转换规则不同。
> - 生成器输入不等于流式输出，完整结果仍占内存。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **旷视 · 算法 · 实习（原帖标签）**：Python 怎样使用 join 拼接字符串？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353154343308304384)；原帖编辑于 2018-04-19。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
