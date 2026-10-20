# EnumMap 和 EnumSet 有什么区别？枚举集合为什么不一定要用 HashMap？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q734-java-enummap-enumset-collections/) · [题库目录](../../README.md)

*下面是一段用于讲解的模拟面试对话。*

🧑‍💻 **面试官：** 一个任务只有 WAITING、RUNNING、DONE 三种状态，用什么集合统计每种状态的数量？

🙋‍♂️ **我：** HashMap\<Status, Integer> 就能完成。

🧑‍💻 **面试官：** 如果只想保存“允许进入的状态集合”呢？

🙋‍♂️ **我：** 那就 HashSet<Status>。

🧑‍💻 **面试官：** 键的范围从一开始就固定了，Java 有没有更专门的容器？它们的空值与遍历顺序又是什么？

> 枚举类型已经给出了有限、固定的键域。EnumMap 与 EnumSet 利用的，正是这份事先知道的范围。

## 面试速答（60 秒版）

`EnumMap` 保存枚举键到值的映射，比如每种状态对应多少个任务；`EnumSet` 只保存某个枚举值是否属于集合，比如哪些状态允许取消。

它们要求一份容器里的枚举键或元素来自同一种枚举类型。EnumMap 的内部表示是数组式的，EnumSet 则采用位向量，能够利用枚举范围固定的特点，不必按照普通哈希容器的方式管理每一个键。

遍历时，它们按照枚举常量的声明顺序。EnumMap 不允许 null 键，但允许 null 值；EnumSet 不允许添加 null 元素。

所以，键域明确为某种枚举时，可以优先考虑这两个专用容器。不过它们本身不提供并发修改保证，也不代表容器里面的值就不可变。具体性能仍要看使用方式，不能直接承诺一定快多少。

![EnumMap 保存状态计数，EnumSet 保存允许状态成员关系](https://note.lgdsunday.club/img/Q734/01-enum-overview.webp)

## 知识点详解：固定的枚举范围，可以换一种存法

### 先分清“有多少”和“有没有”

假设咱们正在维护任务状态。统计每个状态有多少个任务，需要为状态绑定一个计数，这是一份映射，EnumMap 比较合适。

如果规则只是“WAITING 和 RUNNING 允许取消，DONE 不允许”，需要表达的是成员关系，这是一份集合，EnumSet 就足够了。不要为了表达存在与否，额外维护一张枚举到 Boolean 的表，让 false、null、缺失又多出几种含义。

集合和映射的选择，先由数据关系决定，后面才轮到内部优化。专用容器不会替我们把业务模型选对。

### EnumMap 怎样利用枚举范围？

普通 Map 面对的键类型可能有无限多个值，需要根据键找到对应位置。枚举类型的常量集合却已经声明好，EnumMap 可以利用枚举序号关联内部位置。

因此，它内部采用紧凑的数组式表示，键的遍历也自然按照常量声明顺序。[EnumMap API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/EnumMap.html)说明了表示方式、顺序和常量时间的基本操作特征。

这里不能顺手得出“业务上可以把 ordinal 永久存进数据库”。常量位置可以随着源代码调整而变化，内部实现可以用它，不代表外部持久化协议也应该依赖它。跨系统传输和长期存储仍然需要稳定的业务编码。

EnumMap 允许值为 null，所以 get 返回 null 时，可能是没有这个键，也可能是键已经关联 null。需要区分时，应再检查 containsKey。

### EnumSet 为什么适合表达一组开关？

集合只关心每个常量是否出现，可以用位表达成员关系。比如允许 WAITING、RUNNING，就让对应位置表示“存在”，DONE 对应位置表示“不存在”。

集合的并集、交集等操作，就有机会转成紧凑的位运算。枚举常量较多时，具体实现可以使用更大的内部表示，不要把 EnumSet 一概说成“永远只有一个 long”。[EnumSet API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/EnumSet.html)承诺的是位向量表示，并没有要求业务依赖某个私有实现类。

创建空集合时，需要告诉它枚举类型，比如 EnumSet.noneOf(Status.class)。因为空集合没有元素，不能凭空推断应该使用哪一套枚举范围。

![固定枚举范围可对应数组式映射和位向量，但 ordinal 不宜作为稳定外部协议](https://note.lgdsunday.club/img/Q734/02-enum-representation.webp)

### 专用容器没有取消其他边界

EnumMap 不允许 null 键。EnumSet 不允许加入 null 元素，尝试添加会抛异常，但检查是否包含或移除 null 不应被误记成同样的添加行为。

它们的迭代器是弱一致的，不按普通 HashMap 迭代器那样以快速失败为契约。可是“不会按那个方式报 ConcurrentModificationException”，并不等于无须同步就能安全并发修改。[OpenJDK EnumSet 源码](https://github.com/openjdk/jdk21u/blob/master/src/java.base/share/classes/java/util/EnumSet.java)也明确保留了外部同步要求。

如果配置创建以后只读，可以先构建完整，再控制对外暴露与发布方式。需要动态更新时，要确定谁拥有修改权，不能因为元素是枚举就忽略容器本身仍然可变。

验证可以围绕同一套枚举完成。检查空集合、全部常量、声明顺序、null 键和 null 值，再检查复制以后是否仍共享可变值对象。若要比较内存和速度，应固定 JDK、枚举规模与操作比例，不能把内部表示的优势直接换算成未经测量的性能数字。

## 面试官继续追问

### 一份 EnumSet 可以混放两个枚举类型吗？

不可以。它围绕同一个枚举类型建立范围。即使两个枚举都有同名常量，也不是同一种元素类型。

### EnumMap 比 HashMap 更有序，能做任意范围查找吗？

它按声明顺序遍历，但没有因此变成 NavigableMap。需要 floorKey、ceilingKey 这类导航能力时，要按对应查询需求选择结构，不能把“有遍历顺序”都当成同一种有序映射。

### 权限开关适合 EnumSet，就能直接当授权系统吗？

它只负责表达一组值。身份来源、动态策略、数据范围和执行前校验仍然需要独立设计。集合表示不能代替权限判断的可信边界。

## 面试速记卡

> - EnumMap：枚举键关联值，例如状态计数。
> - EnumSet：表达枚举成员关系，例如允许状态。
> - 表示：数组式映射与位向量，利用固定枚举范围。
> - 顺序与空值：声明顺序遍历；Map 禁 null 键、可有 null 值，Set 禁 null 元素。
> - 边界：不自动线程安全，不把 ordinal 当稳定外部协议。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
