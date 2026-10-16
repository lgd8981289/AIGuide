# CSS 如何实现水平垂直居中？元素宽高不固定时应该怎么写？

[百度前端面试真题](../companies/baidu-frontend.md) · [阿里前端面试真题](../companies/alibaba-frontend.md) · [腾讯前端面试真题](../companies/tencent-frontend.md) · [携程前端面试真题](../companies/ctrip-frontend.md) · [快手前端面试真题](../companies/kuaishou-frontend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q539-css-horizontal-vertical-centering/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：一个宽高不固定的元素，怎样水平垂直居中？

🙋‍♂️ 我：可以让父容器使用 Flex，再设置两个方向的对齐。

🧑‍💻 面试官：如果 flex-direction 是 column，justify-content 还是水平对齐吗？

🙋‍♂️ 我：它跟着主轴走，这时主要处理竖直方向。

🧑‍💻 面试官：那么 text-align:center，为什么不能直接把整个弹窗盒子上下都居中？

> 居中先认出被对齐的对象和参照容器，再选择对应的对齐规则。

## 面试速答（60 秒版）

CSS 居中需要先看对齐的是文字，还是一个元素盒子。`text-align: center` 主要处理容器内行内内容的水平对齐，不会自动把块盒子垂直居中。

普通容器可以使用 Flex，设置 justify-content 和 align-items；也可以使用 Grid 的 place-items: center。Flex 的方向跟着主轴变化，不能把两个属性机械背成固定的水平和垂直。

如果是定位元素，可以用父容器的 50% 定位，再用 transform 按元素自身尺寸回移一半。无论哪种方案，都要确认容器有可用空间，并检查内容过大时的溢出和可访问性。

![先看文字，还是整个盒子](https://note.lgdsunday.club/img/Q539/01-overview.webp)

## 知识点详解：同样写 center，为什么对齐对象不同

### 文字居中和盒子居中，先分开

假设一个 div 里面写着‘确认’，text-align:center 可以让这段行内内容在可用宽度中居中。

但这个 div 本身仍按自己的布局规则占位。它不会因为文字居中，就移动到父容器的中间。

块盒子水平居中可以在合适的宽度条件下用左右 auto margin。普通块布局里，不能顺带期待上下 auto margin 解决垂直居中。

### 容器负责对齐，可以少算很多尺寸

需要把一个盒子放在容器中央时，Flex 或 Grid 可以直接表达关系。

```css
.host {
  min-height: 300px;
  display: grid;
  place-items: center;
}
```

这里给出最小高度，是为了让竖直方向确实有空间可分配。父容器如果只和子元素一样高，看不到明显移动，并不代表居中属性失效。

Flex 也适合这个目标，只是要按 flex-direction 认出主轴与交叉轴。列方向里的 justify-content 不能仍背成水平对齐。

![Flex 的主轴，会随方向改变](https://note.lgdsunday.club/img/Q539/02-axes.webp)

### 定位加回移，两次百分比参照不同

对于已经需要脱离普通布局的弹窗，可以让父容器定位，再把子元素的左上角移到父容器中点，最后按子元素自身尺寸回移。

```css
.host { position: relative; height: 300px; }
.dialog {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}
```

left、top 在这种基线里参照包含块；translate 的百分比则按自身参考盒尺寸计算。前一步放的是左上角，后一步才把中心对齐。

因此，这种写法能适应不定宽高，但也会脱离普通文档流，不该为所有普通内容都使用它。

![先定位左上角，再回移自身一半](https://note.lgdsunday.club/img/Q539/03-percentages.webp)

### 内容比容器大，居中也可能不好用

假设弹窗文字变得很长，盒子已经超过可视区域。几何中心正确，不代表顶部内容还能滚动到、键盘焦点也一定可见。

可以按实际组件限制最大宽高、设置滚动区域或在小屏下改用普通流布局。测试时把文字拉长、缩窄容器，并检查缩放与键盘操作。

原生 CSS 示例不需要再写 Python 版本。依据：[MDN 居中指南](https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Solve_CSS_problems/Center_an_item)。

## 面试官继续追问

### 元素宽高固定，应该先算负 margin 吗？

可以实现，但 Flex/Grid 或定位回移通常更容易跟随尺寸变化。是否使用定位仍取决于元素是否需要脱离文档流。

### 写了 height:100%，为什么没有居中空间？

需要检查包含块高度是否能作为百分比参照。百分比本身不会自动创造额外高度。

### Grid 和 Flex 谁一定更快？

不能由这道布局题直接得出性能结论。先选择能清楚表达关系的方案，再针对真实页面检查。

## 面试速记卡

> - text-align：对齐行内内容，不等于移动块盒子。
> - Flex：沿主轴与交叉轴理解对齐。
> - Grid：place-items 可表达子项居中。
> - 定位 50% 与 translate -50% 参照不同。
> - 内容过大时，检查滚动、焦点和可见范围。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **百度 · 前端 · 实习（原帖标签）**：怎样实现水平垂直居中？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/530709141912829952)；原帖编辑于 2023-09-15。
- **阿里巴巴 · 前端 · 原帖未明确批次**：有哪些实现水平垂直居中的方法？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353156404150214656)；历史面经，面试年份未明确；页面编辑于 2025-03-08。
- **腾讯 · 前端 · 原帖未明确批次**：有哪些实现水平垂直居中的方案？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353156404150214656)；历史面经，面试年份未明确；页面编辑于 2025-03-08。
- **携程 · 前端 · 秋招（原帖标题）**：如何实现水平垂直居中？（题意整理）。[面经来源](https://www.nowcoder.com/feed/main/detail/49c19c8ee0f74b149d7db81956b22f86)；原帖编辑于 2024-11-12。
- **快手 · 前端 · 暑期实习**：怎样用 Flex 实现居中，flex 是哪些属性的组合？（题意整理）。[面经来源](https://www.nowcoder.com/feed/main/detail/fd788c6b04504aa6b3bf26c492b3edb6)；正文记录 4 月 24 日一面；原帖编辑于 2025-05-08。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
