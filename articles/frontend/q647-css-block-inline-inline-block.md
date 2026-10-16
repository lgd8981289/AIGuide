# CSS 的 block、inline、inline-block 有什么区别？为什么行内元素设置宽高不生效？

[百度前端面试真题](../companies/baidu-frontend.md) · [腾讯前端面试真题](../companies/tencent-frontend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q647-css-block-inline-inline-block/) · [题库目录](../../README.md)

*下面是用于讲题的模拟面试对话。*

🧑‍💻 面试官：span 设了 width: 100px，为什么看起来没变宽？

🙋‍♂️ 我：普通非替换行内元素的宽度主要由行内内容决定，不能像块盒那样直接设置。

🧑‍💻 面试官：那 img 也是行内元素，为什么可以设宽高？

🙋‍♂️ 我：图片属于替换元素，不能把普通文本行内盒的规则直接套给它。

🧑‍💻 面试官：换成 inline-block 以后，旁边为什么还可能留出一条空隙？

> display 先决定盒子怎样参与周围排版，再看它内部怎样布局。宽高规则、文本空白和基线，也要放回这个排版环境里解释。

## 面试速答（60 秒版）

block、inline 和 inline-block 的区别，主要体现在怎样参与外部排版，以及自身能否作为一个整体设置尺寸。

普通流里的 block 会按块级规则排布，通常从新行开始。普通非替换 inline 则参与行内排版，文字可以和相邻内容排在同一行，甚至跨行拆开，width 和 height 不像块盒那样直接控制它。

inline-block 在外面像一个行内整体，内部又可以按自己的布局组织内容，因此可以设置宽高，常用于需要与文本同行的整体元素。

但“行内元素都不能设宽高”这个说法太绝对。img 等替换元素有自己的尺寸规则；元素进入 Flex 或 Grid 后，外部排版条件也会改变。判断现象时，应同时看 display、元素类型和父级布局。

![block、inline、inline-block 怎样排？](https://note.lgdsunday.club/img/Q647/01-css-block-inline-inline-block.webp)

## 知识点详解：同一段内容，换 display 会改什么？

### block 不是无条件占满屏幕

假设一个普通文档里有两张标签。使用 block 时，它们按照块级规则依次排布，通常不会像文字一样紧挨着排在同一行。

在常见普通流、宽度 auto 的条件下，块盒会利用可用宽度，但“永远占满整行”并不准确。显式宽度、包含块、定位和布局环境都会影响最终尺寸。需要区分盒子在外部参与什么布局，与它最后计算出了多宽。

CSS 的 display 还可以按外部和内部类型理解。[MDN display](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/display)解释了外层参与布局和内层组织内容这两部分。

### inline 文本可以拆到不同的行

普通 span 默认生成非替换行内盒。它跟着文字排布，空间不足时可以在允许的位置换行，所以不应把它想成一个始终完整的定宽小矩形。

给它设置背景和水平 padding，通常能看到内容两侧扩展；给它写 width 和 height，则不会像普通块盒那样得到对应矩形。垂直 padding、边框可能绘制出来，也不能据此认定行高已经按相同尺寸撑开。

相反，img 的内容由外部图像替换，有固有尺寸等规则，可以设置宽高。inline 说明参与排版的方式，不足以抹掉元素自身的类型差异。

![文字拆行，和盒子整体换行不同](https://note.lgdsunday.club/img/Q647/02-css-block-inline-inline-block.webp)

### inline-block 为什么能设宽高？

它作为一个整体参与行内排版，同时拥有内部布局。可以把下面样式依次放到同一个普通 span 上观察，父容器保持普通流。

```css
.label {
  display: inline-block;
  width: 100px;
  height: 32px;
  background: #dcefff;
  vertical-align: middle;
}
```

换成 inline 时，检查宽高是否仍按预期控制；换成 block 时，再看相邻元素的排布。这个例子说明的是 CSS 规则，不需要额外伪造一份 Python 布局实现。

inline-block 之间还可能出现空隙，因为 HTML 标签间的空白也会作为行内文本参与排版。底部空隙则常与基线和行盒有关。两种现象都不能简单归为 margin。需要成组布局时，使用 Flex 的 gap 通常比靠删除空格维护更清楚。

![判断布局，别漏看父容器](https://note.lgdsunday.club/img/Q647/03-css-block-inline-inline-block.webp)

### 父容器一变，为什么结论也会变？

如果父元素变成 Flex，子元素会以 Flex item 的规则参与布局；Grid 也有自己的排布和尺寸计算。此时继续只背“span 是行内元素，所以不能……”就容易解释错。

排查时打开开发者工具，先看计算后的 display 和父级布局，再检查尺寸、行高与 vertical-align。用相同内容对比普通 span、img 和 inline-block，比只看标签名字更容易找到影响变量。

## 面试官继续追问

### display: inline-block 和 display: inline flow-root 有什么关系？

在双关键字表达中，inline-block 对应外部 inline、内部 flow-root。它有独立的内部格式化环境，但这并不意味着它能像块级元素那样改变外部的同行关系。

### 元素原来是 div，改成 inline 就永远不能设宽度了吗？

要看它最终生成什么盒，以及父布局、定位等条件。普通流里的非替换行内盒按行内规则处理；脱离这个前提，不能继续使用同一个结论。

### inline-block 底部有空白，一定是 padding 吗？

先看基线对齐和父元素行高。它默认参与行内基线对齐，行盒可能为文字下伸部分保留空间。检查 vertical-align 或父布局，再判断是否真有盒模型空白。

## 面试速记卡

> - block 与 inline 首先描述外部排版方式。
> - 普通非替换 inline 不按块盒方式接受 width、height。
> - inline-block 是行内整体，也能设置自身尺寸。
> - img 等替换元素有自己的尺寸规则，不能混为一谈。
> - 标签间空白、基线和父级布局都可能改变观察结果。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **百度 · 前端 · 原帖未明确批次**：常见的行内元素和块级元素分别有哪些？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/535581489552011264)；原帖发布于 2023-09-24。
- **腾讯 · 前端（CSIG） · 校招**：行内元素和块级元素有什么区别？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353156557233922048)；原帖编辑于 2022-03-02；仅取腾讯 CSIG 一面段落。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
