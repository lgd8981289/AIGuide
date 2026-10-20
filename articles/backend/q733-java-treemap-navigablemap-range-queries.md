# TreeMap 和 HashMap 有什么区别？floorKey、ceilingKey 如何做范围查找？

[网易开发面试真题](../companies/netease-development.md) · [小米开发面试真题](../companies/xiaomi-development.md) · [猿辅导开发面试真题](../companies/yuanfudao-development.md) · [蚂蚁集团测试开发面试真题](../companies/ant-test-development.md) · [快手开发面试真题](../companies/kuaishou-development.md) · [腾讯开发面试真题](../companies/tencent-development.md) · [字节测试开发面试真题](../companies/bytedance-test-development.md) · [腾讯后端面试真题](../companies/tencent-backend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q733-java-treemap-navigablemap-range-queries/) · [题库目录](../../README.md)

*下面是一段用于讲解的模拟面试对话。*

🧑‍💻 **面试官：** 按时间保存配置版本，用 HashMap 可以吗？

🙋‍♂️ **我：** 可以，时间作为键，按键取值比较快。

🧑‍💻 **面试官：** 现在要查“查询时刻之前，最近一次生效的版本”，这个时间不一定正好存在呢？

🙋‍♂️ **我：** 那把所有时间拿出来排序，再找一个最近的。

🧑‍💻 **面试官：** 如果这种查询不断发生，你是不是需要一个本来就维护顺序的结构？

> 按键精确命中，与按顺序寻找邻近边界，是两种需求。TreeMap 的价值，往往从第二种需求开始显现。

## 面试速答（60 秒版）

HashMap 主要按哈希定位键，适合精确查询，不保证遍历顺序。TreeMap 基于红黑树，按照键的自然顺序或 Comparator 维护有序关系，基本查找、插入和删除是 O(log n)。

如果要找不大于查询键的最大键，可以用 floorKey；找不小于查询键的最小键，用 ceilingKey。lowerKey、higherKey 则是不包含相等情况的严格边界。没有符合条件的键时会返回 null。

TreeMap 还可以用 subMap 表达范围，但它通常是关联原映射的视图，不是独立快照。比较器也决定哪些键算同一个键，因此要特别检查比较结果为 0 的含义。

如果只需要按 ID 精确查找，不必为了“有序”全部换成 TreeMap；如果邻近查询、范围遍历很常见，维护顺序才值得。

![TreeMap 在查询键 25 不存在时，仍能找到左边 20 和右边 40](https://note.lgdsunday.club/img/Q733/01-range-overview.webp)

## 知识点详解：把“最近的一个键”查准确

### 时间不存在，也可以查到它之前的版本

假设配置在 10、20、40 这三个时刻分别生效，查询时刻为 25。普通 get(25) 查不到精确键，但业务要的是时刻 20 对应的配置。

这时 floorKey(25) 得到 20。它会寻找所有不大于 25 的键里面最大的一个。ceilingKey(25) 则得到 40，方向相反。

当查询值刚好等于 20，floorKey 和 ceilingKey 都可以得到 20；lowerKey(20) 得到 10，higherKey(20) 得到 40。四个方法的区别就在方向与是否包含等号。[TreeMap API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/TreeMap.html)给出了这些边界契约。

不要用“差不多最近”来记，因为“绝对距离最近”还需要分别拿到两侧候选，再比较距离。floor 本身只看一侧。

### 有序，是比较器决定的顺序

没有提供比较器时，TreeMap 使用键的自然顺序。提供比较器以后，整个树的查找、相等和范围判断，都要服从这套顺序。

如果比较器认为两个键比较结果为 0，TreeMap 就会把它们视为同一个键的位置。即使这两个对象的 equals 返回 false，也不能让它们成为两个独立映射。

比如只按姓名比较用户，两个姓名相同、ID 不同的用户就可能相互覆盖。业务以 ID 区分身份时，这种比较器已经改变了键的含义。比较器应尽量与 equals 保持一致；确实不一致时，要知道自己偏离了普通 Map 的契约。[SortedMap 说明](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/SortedMap.html)也专门解释了这个问题。

![只按姓名比较会把姓名相同、ID 不同的对象视为同一个 TreeMap 键位置](https://note.lgdsunday.club/img/Q733/03-comparator-identity.webp)

### subMap 为什么不是复制了一份？

假设拿到范围 `[20, 40)` 的 subMap，也就是包含 20，不包含 40。这个对象是原映射对应范围的视图。

在视图里删除 20，原映射中的 20 也会消失；原映射加入范围内的新键，视图也能看到。通过视图插入范围外的键，则会被拒绝。

如果需要生成一份报告快照，就应该明确复制数据，并且根据需要处理可变值对象，不能把一个范围视图直接交出去，再假定它以后不受原表变化影响。

还有一种容易混淆的返回值。floorEntry、ceilingEntry 等导航方法返回的条目，是调用当时映射的快照式条目，不支持用 setValue 修改底层映射。它和 subMap 这种关联视图，不是同一种承诺。

![subMap 的范围视图关联原 TreeMap，删除视图条目会影响原映射](https://note.lgdsunday.club/img/Q733/02-submap-view.webp)

### HashMap 的快，不能代替缺失的查询能力

HashMap 在哈希分布合适时，基本精确操作通常能有很好的平均效率。但要找小于某个时间的最近键，它并没有维护这份大小关系，往往需要扫描或另外建立索引。

TreeMap 持续维护顺序，需要比较和树调整。只做 ID 查询时，这部分工作未必值得；范围操作频繁时，提前维护顺序可以省去每次重新整理数据。

如果比较器的一次比较本身很昂贵，O(log n) 也不代表实际延迟一定低。需要把数据量、更新频率、查询形态和比较成本一起放进测试。

验证时，至少列出小于最小键、等于现有键、落在两键之间、大于最大键这几类输入。范围测试再检查左右端点是否包含，以及视图修改是否反映到原映射。null 返回值要显式处理，别让自动拆箱把“没有结果”变成意外异常。

## 面试官继续追问

### TreeMap 可以放 null 键吗？

自然顺序通常不接受 null 键。自定义比较器如果明确支持 null，可以有不同表现。因此不能只背“所有 TreeMap 永远不能放 null”，也不能默认任意比较器都会接受它。

### floorKey 用逆序比较器以后还按数字大小理解吗？

要按当前比较器的顺序理解，不能直接套自然数大小。API 的“小于等于”是排序意义上的关系，测试时应把比较器写进前提。

### 多线程同时更新怎么办？

普通 TreeMap 不提供并发修改保证。可以按需要加外部同步，或者评估 ConcurrentSkipListMap。但换并发容器以后，也要重新检查复合查询和快照的一致性要求。

## 面试速记卡

> - HashMap：精确查询为主，不维护排序关系。
> - TreeMap：按键维护有序映射，常用基本操作为 O(log n)。
> - 边界：floor、ceiling 包含相等；lower、higher 不包含相等。
> - 身份：比较结果为 0，会落在同一个键位置。
> - 视图：subMap 关联原映射，不能当成独立快照。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **网易 · Java研发 · 原帖未明确批次**：TreeMap 怎样实现？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353153897143410688)；原帖编辑于 2016-08-24。
- **小米 · Java开发 · 校招提前批**：TreeMap 和 HashMap 有什么区别？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353158357265620992)；原帖编辑于 2021-08-27。
- **猿辅导 · Java开发 · 秋招（原帖标签）**：TreeMap 和 HashMap 有什么区别，底层数据结构与增删查复杂度分别是什么？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353154537596854272)；原帖编辑于 2018-09-12。
- **蚂蚁集团 · 测试开发 · 校招**：TreeMap 和 HashMap 有什么区别，底层怎样实现？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353156130295717888)；原帖编辑于 2020-03-11。
- **快手 · 数据研发 · 24届秋招（原帖标签）**：Java TreeMap 和 HashMap 有什么区别？（题意整理）。[面经来源](https://www.nowcoder.com/feed/main/detail/81f6499f37c54490ae9a1c685987520b)；原帖发布于 2023-08-28。
- **腾讯 · Java开发（天美；原帖未明确细分岗位） · 原帖未明确批次**：HashMap 和 TreeMap 各适合什么使用场景？（题意整理）。[面经来源](https://www.nowcoder.com/feed/main/detail/6baa4547d54742e68cf6e5c7443f9e97)；原帖发布于 2025-07-14。
- **快手 · Java开发（原帖未明确细分岗位） · 原帖未明确批次**：HashMap 和 TreeMap 有什么区别，TreeMap 按什么顺序排列？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/393516796408594432)；原帖编辑于 2022-08-29。
- **字节跳动 · 测试开发 · 实习**：TreeMap 和 HashMap 有什么区别，底层实现与使用场景分别是什么？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353157801662947328)；原帖编辑于 2021-04-18。
- **腾讯 · 后台开发（广告） · 实习**：HashMap 和 TreeMap 有什么区别？（题意整理）。[面经来源](https://www.nowcoder.com/feed/main/detail/af7578c21bd24530bd8db37694fdc2b0)；原帖发布于 2024-03-21。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
