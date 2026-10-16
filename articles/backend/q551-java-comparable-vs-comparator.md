# Java 的 Comparable 和 Comparator 有什么区别？多字段排序怎么实现？

[华为开发面试真题](../companies/huawei-development.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q551-java-comparable-vs-comparator/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：Comparable 和 Comparator 有什么区别？

🙋‍♂️ 我：Comparable 写在对象里，Comparator 写在对象外面。

🧑‍💻 面试官：同一批学生，成绩页按分数，通讯录按姓名，怎么做？

🙋‍♂️ 我：给学生类多写几个 compareTo。

🧑‍💻 面试官：接口只有一种compareTo顺序。再问，两个学生分数一样，TreeSet一定能同时保留吗？

> 排序规则可以换；但一套比较规则里，比较为零究竟代表什么，必须提前想清楚。

## 面试速答（60 秒版）

`Comparable` 由类型实现，通过 `compareTo` 定义这个类型的自然顺序。比如某种编号默认就按编号大小排列。

`Comparator` 则把排序规则放到外部，通过 `compare` 比较两个对象。同一批数据要按不同方式展示，通常用不同 Comparator 更合适。

多字段排序按顺序比较。前一个字段不同，就确定结果；相同才继续比较下一个字段。比较器要保持一致和传递，不能一边排序一边换规则。

还要注意，比较结果为 0 只表示这套顺序里两者等价，不一定等于对象的 equals 为 true。TreeSet 等有序集合会受这个关系影响，如果我们只按分数比较，两个不同学生可能被视为同项。

![对象不变，排序规则可以换](https://note.lgdsunday.club/img/Q551/01-overview.webp)

## 知识点详解：一种自然顺序，多种外部排序策略

### 先把对象和展示要求分开

假设学生对象有ID、姓名和分数。成绩页希望分数高的在前，分数相同按姓名；通讯录则先按姓名。对象没变，展示要求变了。

Comparable 适合这个类型确实有清楚、稳定的默认顺序。Comparator 适合按当前用途选择规则。这样不必为了新页面修改原类型，也不需要让一个 compareTo 猜调用者是谁。

Comparable 是 Java 接口，Python 和 TS 没有同名接口可机械替代。下面只用两种语言演示相同的外部排序需求。

### 多字段比较，一次只解决一个平局

假设分数降序，姓名升序，最后用ID升序做稳定的兜底规则。甲和乙分数不同，姓名不参与；分数相同才比较姓名。

**TypeScript**

```typescript
type Student = { id: number; name: string; score: number };
function cmp(a: number | string, b: number | string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
function rankStudents(rows: Student[]): Student[] {
  return [...rows].sort((a, b) =>
    cmp(b.score, a.score) || cmp(a.name, b.name) || cmp(a.id, b.id));
}
```

**Python**

```python
def rank_students(rows):
    return sorted(rows, key=lambda s: (-s['score'], s['name'], s['id']))
```

示例限定分数和ID为有效、有限整数，姓名使用普通字符串顺序。同样的英文字母和数字样例，两边可以比较；复杂Unicode排序规则并不保证跨语言完全相同。中文拼音排序还需要明确使用哪个地区规则，不能默认字符串比较就是拼音。

Java 可以用 `Comparator.comparing` 配合 `thenComparing` 组合规则。尤其要分清，对整个组合调用 reversed，和只让第一字段降序，不是同一个意思。

![前一项相同，才比较下一项](https://note.lgdsunday.club/img/Q551/02-tie-fields.webp)

### 比较为零，为什么会影响集合？

假设两个学生ID不同、分数相同。比较器如果只比较分数，结果就是0。

在列表排序里，他们通常仍都在列表中，只是排序规则没有进一步区分。而 TreeSet 需要按顺序维护集合，它会把比较为0的对象视为等价项。第二个学生可能因此无法作为新元素加入。

这不是“TreeSet 忘记 equals”，而是我们选的比较关系没有区分它们。如果需要同时保留，就让规则包含合适的区别字段，或选择符合需求的数据结构。

对象是否相等、展示顺序如何、有序集合怎样去重，是三个需要分别确认的问题。

![分数相同，不代表是同一个学生](https://note.lgdsunday.club/img/Q551/03-tree-set-equality.webp)

### 一致性比写法简短更重要

假设A排在B前，B排在C前，却又把C排在A前，这套规则无法形成一致顺序。随机数、随时间变化的外部配置，或比较过程中修改字段，都可能造成这种问题。

Java整数比较也不要直接写减法，差值可能溢出，导致符号不符合真实大小。可以使用Integer.compare等比较方法。

排序前还要明确空值怎么处理，是拒绝、放前还是放后。把这些边界写进测试，比记住两种接口各有几个字母更有用。

![比较规则不能绕成一个圈](https://note.lgdsunday.club/img/Q551/04-comparison-cycle.webp)

技术依据：[Java SE 25 Comparator](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/Comparator.html)、[Java SE 25 Comparable](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/Comparable.html)。工程场景与解法按本文说明的条件展开。

## 面试官继续追问

### 稳定排序能代替最后一个比较字段吗？

稳定排序保留相等比较项的原先次序。如果输入来源本来就不稳定，这不能保证每次结果一致。是否增加ID兜底取决于需求。

### 所有类都应该实现Comparable吗？

不用。没有唯一自然顺序时，外部Comparator通常更明确，也能避免把某个页面的排序要求写进领域类型。

## 面试速记卡

> - Comparable：类型内部定义自然顺序。
> - Comparator：对象外部选择排序策略。
> - 多字段：先比较主字段，相同才比较次字段。
> - 契约：比较要一致、符号对称且可传递。
> - 集合：比较为0可能决定TreeSet等结构的等价关系。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **华为 · 软件开发（南研所 ICT 通软） · 原帖未明确批次**：Comparable 和 Comparator 有什么区别？（题意整理）。[面经来源](https://www.nowcoder.com/feed/main/detail/b49d06bb5cba4e05b1824845517a82df)；正文记录 9 月 30 日面试；原帖编辑于 2024-10-08。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
