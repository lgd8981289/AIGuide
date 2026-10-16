# Python 的 set 和 frozenset 怎么选？交集、差集和集合去重有哪些限制？

[百度算法面试真题](../companies/baidu-algorithm.md) · [大华开发面试真题](../companies/dahua-development.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/python/q570-python-set-frozenset/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：Python 的 set 和 frozenset 有什么区别？

🙋‍♂️ 我：set 能添加删除元素，frozenset 创建以后不能改。

🧑‍💻 面试官：那把用户权限做成交集，结果还保留原来的顺序吗？

🙋‍♂️ 我：集合运算应该不保证这样的顺序。

🧑‍💻 面试官：两个权限名称一样就能合并吗？如果希望保留出现次数呢？

> 集合适合表达成员关系。顺序、重复次数和对象是否相等，需要另外明确，不能指望一次 set 转换全处理。

## 面试速答（60 秒版）

set 和 frozenset 都用于保存不重复的成员，也支持交集、并集、差集等集合运算。set 可以调整成员，frozenset 创建以后成员集合固定。

比如判断某人同时具备哪些权限，可以求两个集合的交集；计算还缺哪些权限，可以用所需权限减去已有权限。

不过，集合不负责保留业务顺序，也不会保存每个元素出现了几次。成员是否重复还要遵守哈希和相等规则，不能把复杂对象的“内容相同”想当然地等同于重复。

因此，需要经常更新成员时选 set，需要表达一份固定的成员组合时可以考虑 frozenset。排序展示、重复计数和复杂对象去重，还需要相应的数据结构或规则。

![集合关心哪些成员在里面](https://note.lgdsunday.club/img/Q570/01-overview-v2.webp)

## 知识点详解：先明确成员关系，再做集合运算

### 交集和差集，要先把方向看清楚

假设一个功能需要 read 和 write，用户已有 read 和 export。已有权限与所需权限的交集是 read，说明双方共有这个成员。

检查缺少的权限，要计算 required - owned，结果是 write。把顺序写反，得到的是 export，那是在问用户多了什么，已经换成另一个问题。

这个方向区别适合直接用小数据验证，不必先背所有运算符。并集则收集两边出现过的成员，对称差集保留只在其中一边出现的成员。

![差集方向，决定你在问什么](https://note.lgdsunday.club/img/Q570/02-direction.webp)

### set 能调整成员，frozenset 固定成员集合

集合内部成员仍需要满足可哈希条件，这部分已在旧文解释。set 本身可变，因此不能直接作为另一个 set 的成员；frozenset 可以表达固定成员组合，在成员合规时用于这种场景。

#### Python

```python
required = frozenset({"read", "write"})
owned = {"read", "export"}
print(sorted(required & owned))  # ['read']
print(sorted(required - owned))  # ['write']
owned.add("write")
print(required <= owned)        # True
```

#### TypeScript（Set 运算的显式对照）

```typescript
const required: ReadonlySet<string> = new Set(["read", "write"]);
const owned = new Set(["read", "export"]);
const missing = [...required].filter((item) => !owned.has(item));
console.log(missing); // ["write"]
owned.add("write");
console.log([...required].every((item) => owned.has(item))); // true
```

TS 的 ReadonlySet 约束类型检查阶段能够使用的接口，它并不会把底层 JS Set 冻成 Python frozenset。这里仅对照成员运算，不给两种语言套同一套不可变保证。

### 去重会丢掉哪些信息？

把 \["read", "read", "write"] 转成集合以后，只剩两个成员。原来 read 出现两次这件事，没有被集合保留下来。

如果要统计次数，可以使用 Counter 或其他计数映射；如果输出需要按输入顺序去重，则要明确采用保序方法。Python set 没有按插入顺序遍历的语言保证，不能看本地打印几次没变，就把它当成稳定顺序。

对于复杂对象，还应先规定等价标准。例如两个用户对象是否按 user\_id 算同一个用户，要在去重逻辑里明确。set 只会按照它实际得到的成员规则工作，不会读懂业务含义。

![去重之后，次数没有保留下来](https://note.lgdsunday.club/img/Q570/03-information-v2.webp)

### 固定集合也需要考虑使用方式

假设一份配置描述允许的工具名，创建后不希望普通代码随意增删，frozenset 能让这种约束在集合接口上表达出来。

但它不负责授权检查本身。请求是否可以调用工具，还要在实际动作前读取可信的权限数据，不能让客户端传来一份集合就认定获准。

测试集合逻辑时，用完全相同、部分重叠、完全不同和空集合几组输入，检查差集方向、子集判断及展示顺序。正文里的 sorted 只是让演示输出稳定，不表示集合自己已经排序。

依据：[Python 3.11 set 与 frozenset](https://docs.python.org/3.11/library/stdtypes.html#set-types-set-frozenset)、[collections.Counter](https://docs.python.org/3.11/library/collections.html#collections.Counter)。

## 面试官继续追问

### frozenset 可以调用 add 吗？

没有这样的修改成员接口。需要不同成员组合时，构造新的集合，旧对象保持自己的成员。

### 只有一个集合是 frozenset，运算结果是什么类型？

混合二元运算通常跟随左操作数的集合类型。涉及返回类型时查清实际运算，不只看其中出现了 frozenset。

### 权限全包含，用交集非空判断够吗？

不够。交集非空只证明至少有一个共同成员，全部满足需要检查所需集合是否为已有集合的子集。

## 面试速记卡

> - 集合表达成员关系，重复次数和展示顺序另处理。
> - set 成员可变，frozenset 固定成员集合。
> - 缺少什么用 required - owned，方向写反就换了问题。
> - 交集非空不代表全部具备，全部满足检查子集。
> - TS ReadonlySet 的静态约束不能当作 Python 运行时冻结。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **百度 · 算法 · 日常实习**：Python 怎样对列表去重？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353155306979008512)；原帖发布于 2019-08-28；21 届是作者届次，面试日期未明确。
- **大华 · Python开发（原帖标签） · 校招**：Python 怎样对列表去重？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353155617470750720)；原帖编辑于 2019-09-28。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
