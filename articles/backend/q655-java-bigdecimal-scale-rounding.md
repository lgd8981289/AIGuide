# BigDecimal 为什么适合金额计算？equals、compareTo 和舍入规则有什么区别？

[招银网络科技开发面试真题](../companies/cmbnt-development.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q655-java-bigdecimal-scale-rounding/) · [题库目录](../../README.md)

下面是一段模拟面试对话。

🧑‍💻 **面试官：** 金额为什么经常用 BigDecimal？

🙋‍♂️ **我：** 因为它不会像 double 那样有精度问题。

🧑‍💻 **面试官：** 那你用 double 的 0.1 去构造 BigDecimal，会得到你想要的十进制 0.1 吗？

🙋‍♂️ **我：** 输入已经有误差，换个容器也不会自动修好。

🧑‍💻 **面试官：** 再问两个：1.0 和 1.00 的 equals 相等吗？1 除以 3，不指定舍入能算完吗？

> 十进制计算要连着看三步：值从哪里来、怎样比较、在哪一步按什么规则舍入。

## 面试速答（60 秒版）

BigDecimal 用十进制数值和 scale 表示数据，适合需要明确小数位与舍入规则的计算。但它不负责修复输入错误，也不保证所有运算都能无限精确地完成。

构造金额时，优先从可信十进制字符串或明确的最小货币单位转换。直接把 double 传给构造器，可能把二进制浮点的近似值完整带进来；valueOf(double) 的转换路径不同，但也不能恢复上游已经丢失的十进制信息。

比较时，equals 同时看数值和 scale，所以 1.0 和 1.00 不相等；compareTo 按数值比较，它们的比较结果为 0。

除法如果得到无限循环小数，需要明确精度或小数位及舍入模式。工程上还要约定币种、计算过程和最终舍入位置，不能只说“用了 BigDecimal，所以金额一定正确”。

![金额计算，别只看用了哪个类](https://note.lgdsunday.club/img/Q655/01-java-bigdecimal-scale-rounding.webp)

## 知识点详解：精确计算，也得把规则说完整

### 先看输入，别让近似值先走一步

假设用户输入的是金额文本“0.10”。这份文本已经表达了一个明确的十进制数。

如果先把它转换成 double，再传入接受 double 的 BigDecimal 构造器，中间就多了一次二进制浮点转换。后面的 BigDecimal 只能如实接收传来的数，不知道用户最初写的是哪段文本。

因此，数据入口允许时，直接从十进制字符串构造更清楚。如果上游只提供 double，要知道 valueOf 和 double 构造器的转换规则不同，但不要据此承诺恢复原始输入。[BigDecimal 构造器与 valueOf 文档](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/math/BigDecimal.html)解释了这两条路径。

这篇讨论 Java API，不把 Python Decimal 或 JS 的第三方十进制库冒充同一实现。跨语言接口可以共同约定“金额字符串＋币种”，各端再按实际库处理。

![1.0 和 1.00，为什么有两种相等？](https://note.lgdsunday.club/img/Q655/02-java-bigdecimal-scale-rounding.webp)

### scale 也是对象信息的一部分

可以把 1.0 看成整数 10 配上 scale 1，把 1.00 看成整数 100 配上 scale 2。它们代表的数值一样，但表示方式不同。

这就是 equals 和 compareTo 得到不同结论的原因。

| 判断        | 1.0 与 1.00 的结果 | 在回答什么           |
| --------- | -------------- | --------------- |
| equals    | false          | 数值和 scale 是否都一致 |
| compareTo | 0              | 数值上的大小关系        |

如果业务只是判断两笔金额是否数值相等，通常需要的是 compareTo 的语义。但不能因此宣布 equals 设计错了，它确实在保留表示信息。

放进集合时，这个差别也会表现出来。依赖 equals/hashCode 的集合，和依赖自然排序比较的集合，未必把这两个对象视作同一个元素。使用前先定义系统需要的“相同”。

### 除不尽的时候，程序需要你作决定

十进制可以精确表示 0.1，但有限小数写不完 1/3。BigDecimal 没有办法把无限长的结果全部存下来。

如果调用要求精确结果的除法，而结果没有有限十进制表示，就会抛出 ArithmeticException。你需要给出计算上下文，或者明确目标 scale 和舍入模式。

例如保留两位小数时，1/3 可以变成 0.33。但“保留两位”还不够，遇到恰好处在中点的值，HALF\_UP、HALF\_EVEN 等规则可能给出不同结果。[RoundingMode 官方说明](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/math/RoundingMode.html)给出了正负数示例，不能把所有规则都口头简化成“四舍五入”。

![除不尽，需要明确结果规则](https://note.lgdsunday.club/img/Q655/03-java-bigdecimal-scale-rounding.webp)

### 什么时候舍入，可能比选哪个类更重要

假设把 1 元分给三个人。如果每份先保留两位得到 0.33，三份相加只有 0.99。

程序并没有算错舍入结果，缺的是业务规则。剩余的 0.01 给谁？每项先舍入，还是汇总后舍入？这些需要提前约定，并保留能够解释结果的计算依据。

所以测试不能只覆盖“0.1 加 0.2”，还应覆盖除不尽、中点舍入、负值退款、不同 scale 和分摊后总额守恒。BigDecimal 提供表达规则的工具，规则仍然由系统定义。

![三份 0.33，为什么少了一分钱？](https://note.lgdsunday.club/img/Q655/04-java-bigdecimal-scale-rounding.webp)

## 面试官继续追问

### 全部用“分”这样的整数就没有问题了吗？

如果范围与币种规则合适，最小单位整数可以简化部分计算。但汇率、比例、利息和分摊仍可能出现更小单位或舍入问题；还要注意整数溢出。它是另一种表示约定，不是免除业务规则。

### stripTrailingZeros 可以统一一切吗？

它会改变表示，某些值还可能出现负 scale。是否去尾零、如何序列化、界面显示几位，都应该按接口和展示约定处理，不要为了让 equals 看起来方便就随意修改格式。

## 面试速记卡

> - 输入：十进制字符串优先，别先经过不必要的 double 转换。
> - 表示：BigDecimal 同时保留数值与 scale 信息。
> - 比较：equals 看表示，compareTo 看数值大小。
> - 运算：除不尽时要明确精度、小数位和舍入模式。
> - 工程规则：币种、舍入位置和分摊余数必须说清楚。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **招银网络科技 · 开发（原帖未明确细分岗位） · 原帖未明确批次**：为什么要使用 BigDecimal？（题意整理）。[面经来源](https://www.nowcoder.com/feed/main/detail/cdca3a0ab06746fcacaa1af550ca7df1)；正文记录 9 月 11 日一面；页面显示 09-17 编辑，未明确年份。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
