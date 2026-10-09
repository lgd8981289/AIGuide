# HashSet、LinkedHashSet 和 TreeSet 有什么区别？去重和排序应该怎么选？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q443-hashset-linkedhashset-treeset/) · [题库目录](../../README.md)

*下面是一段教学模拟，不是真实面试记录。*

🧑‍💻 面试官：三种 Set 的区别是什么？

🙋‍♂️ 我：HashSet 无序，LinkedHashSet 按插入顺序，TreeSet 自动排序。

🧑‍💻 面试官：TreeSet 的比较器只比较价格，两件不同商品价格相同，会保留几件？

🙋‍♂️ 我：可能只保留一件。

🧑‍💻 面试官：为什么？它们的 equals 明明返回 false。你选择的是排序规则，还是也改变了去重规则？

> Set 不只有“怎么遍历”，更要问「什么算重复」。TreeSet 的比较器同时参与顺序与唯一性判断。

## 面试速答（60 秒版）

HashSet 基于哈希与相等判断去重，不保证遍历顺序。LinkedHashSet 也采用这类去重依据，并维护插入顺序，适合需要稳定遍历的场景。

TreeSet 使用自然顺序或比较器维护有序集合。比较结果为零的两个元素，会被它视为同一个集合元素，这一点不一定与 equals 相同。

因此，要先明确唯一性，再明确遍历要求。如果按 ID 去重、按价格排序，不能只用价格比较器的 TreeSet，否则同价对象可能被丢掉。

另外，哈希或比较所依赖的字段不应在入集合后随意修改。选型不仅看复杂度，也看对象身份和顺序语义是否正确。

![三种 Set：先定义重复：顺序和唯一性一起选](https://note.lgdsunday.club/img/Q443/01-overview.webp)

## 知识点详解：排序集合，为什么可能少一个元素？

### HashSet 的“无序”，是不保证顺序

HashSet 不承诺插入顺序或排序顺序。某次运行看起来有规律，不代表下一次扩容或换数据后仍保持。

它依赖 hashCode 与 equals 的契约：相等对象应有相同哈希。哈希碰撞不代表对象相等，还需要进一步判断。

普通操作在适当哈希分布条件下通常具有较低的平均成本，但不应脱离前提宣称所有操作始终固定耗时。[HashSet 文档](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashSet.html)

### LinkedHashSet 保存的是有意义的插入顺序

假设需要对用户输入标签去重，同时保留第一次出现的顺序，LinkedHashSet 就比较贴合需求。

普通 add 重新添加已有元素，不会像新增元素那样把它移到末尾。不过，Java 21 的有序集合还提供明确的位置操作，不能绝对地说它“永远无法调整位置”。[LinkedHashSet 文档](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/LinkedHashSet.html)

这份顺序仍然不等于排序。先添加 z，再添加 a，正常遍历会保持插入关系，而不是自动变成 a、z。

### TreeSet 的 compare 为零，就影响是否保留

假设商品 A 的 ID 是 101，商品 B 的 ID 是 102，价格都为 99。

如果比较器只比较价格，结果为零。TreeSet 就可能把 B 视为已经存在的元素，不再加入，尽管两者不是同一件商品。

所以比较器不是只控制视觉顺序。它直接定义树集合中的等价关系，通常应与 equals 保持一致，避免违反一般 Set 的预期。[TreeSet 文档](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/TreeSet.html)

如果要求按价格排序、同价按 ID 区分，可以设计后续比较字段；如果去重和排序本来就是不同规则，也可以先按明确身份去重，再把结果放进列表排序。

![只按价格比较，会丢一件商品：排序相同不等于同一对象](https://note.lgdsunday.club/img/Q443/02-mechanism.webp)

### 可变字段会破坏集合查找

假设对象进入 HashSet 后，参与 hashCode 的 ID 被改了。对象可能仍在旧桶里，却用新哈希查找，出现“遍历能看到，contains 找不到”的情况。

TreeSet 同理：元素入集合后改变参与比较的字段，树原来维护的位置不一定继续有效。

因此，身份和排序关键字段尽量保持不可变；需要修改时，按受控方式移除、修改再加入，并考虑重复与顺序变化。不要靠“再查询几次”修复结构已经不匹配的问题。

![入集合后改关键字段为什么找不到：关键字段保持稳定](https://note.lgdsunday.club/img/Q443/03-mechanism.webp)

## 面试官继续追问

### 只想让结果按价格排序，必须使用 TreeSet 吗？

不是。列表排序不会自动去掉同价元素，更适合唯一性另有规则的情况。先确定是否真的需要有序集合。

### TreeSet 一定不能存 null 吗？

自然排序通常不接受 null；自定义比较器的支持情况需要单独看。不要把一种排序方式的限制推广到所有自定义比较器。

### 这三个集合都线程安全吗？

不能默认线程安全。并发修改需要额外协调或选择相应并发集合，维护顺序也不意味着具备并发保护。

## 面试速记卡

> - HashSet：哈希与 equals 去重，不保证遍历顺序。
> - LinkedHashSet：保持普通插入顺序，仍不是自动排序。
> - TreeSet：比较器维护顺序，compare 为零也决定集合中的重复。
> - 选型：先定义唯一性，再选择顺序和结构。
> - 可变对象：不要随意修改已经入集合的哈希或比较关键字段。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
