# CSS 定位有哪些方式？absolute、fixed 和 sticky 有什么区别？

[百度前端面试真题](../companies/baidu-frontend.md) · [小米前端面试真题](../companies/xiaomi-frontend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q233-css-position-containing-block/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：absolute 相对谁定位？

🙋‍♂️ 我：相对父元素。

🧑‍💻 面试官：父元素没建立定位包含块呢？再往上找吗？

🙋‍♂️ 我：要找真正建立包含块的祖先，不能只看直接父元素。

🧑‍💻 面试官：fixed 永远相对视口？sticky 写了 top，为什么在这个容器里又不动了？

> 定位先找「参照范围」，再看「是否留在正常流、受哪个滚动区域约束」。不能只背名字。

## 面试速答（60 秒版）

CSS 常见定位值包括 static、relative、absolute、fixed 和 sticky。

static 参与普通布局，定位偏移不按定位方式生效。relative 保留原本的布局位置，再相对正常位置偏移。absolute 脱离正常流，依据自己的包含块定位，不一定就是直接父元素。

fixed 通常相对视口定位并脱离正常流，但某些祖先样式，例如非 none 的 transform，可能建立它的包含块，所以不能说永远相对视口。

sticky 保留正常流位置，在滚动过程中受到偏移阈值和所在容器的约束。它关联最近具有相应滚动机制的祖先，不是写了 top 就一定吸在整个页面顶部。

排错时，先查包含块、滚动祖先和尺寸，再看偏移与层叠，不要只反复调 z-index。

![定位：先找参照范围](https://note.lgdsunday.club/img/Q233/01-answer-overview.webp)

## 知识点详解：同一个提示条，五种定位会发生什么？

### static 与 relative：原来的位置还在不在？

假设有三段内容，中间一段是提示条。

static 时，它按普通布局占据位置。relative 时，也仍然为它保留原来的布局位置，只是显示位置可以根据 top、left 等偏移。

所以 relative 把提示条向下移动，不意味着后面的段落自动跟着再向下挤同样距离。原来的占位与看到的位置要分开。

这也是为什么 relative 经常被用来建立定位参照，而不一定需要真的移动元素。

### absolute：找到包含块，才能理解 top

如果提示条改成 absolute，它不再为后面的普通内容保留同样的正常流位置。

偏移参照要看它的包含块。常见情况是最近的非 static 定位祖先；某些 transform 等属性也会建立相关包含块。不能只因为某个元素是直接父节点，就断言 top 相对它计算。

例如卡片设 position: relative，卡片里的角标设 absolute，并使用 top、right，这样就能把角标放在卡片的相应位置。

如果没有这样的参照，角标可能相对更外层的范围定位，看起来像“突然跑到页面角落”。先检查祖先链，比不停改 top 数值更有效。

### fixed：通常跟着视口，但要看祖先

页面右下角的返回顶部按钮，通常使用 fixed。滚动页面时，按钮相对视口的位置保持。

但如果它放在带 transform 的祖先里，这个祖先可能成为 fixed 的包含块。此时按钮的表现就不再等同于“放在页面最外层、相对视口”。

[MDN 的包含块说明](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Display/Containing_block)列出了相关条件。判断时要查看实际计算样式，不只检查 position 一项。

模态框或浮层为什么有时被某个容器带着走，就可能和这类参照变化有关。

![absolute 与 fixed 的参照可能改变](https://note.lgdsunday.club/img/Q233/02-detail-1.webp)

### sticky：它是在一个范围里粘住，不是变成无限 fixed

假设文章右侧目录使用 sticky，并设置 top: 16px。

它先按普通布局占位。随着相关滚动位置变化，达到阈值时可以粘住，但仍受所在包含范围限制，不会无限越过容器的结束边界。

最近具有滚动机制的祖先很重要。某个外层 overflow: hidden 或 auto 可能让它关联到不符合你预期的范围，即使这个祖先并不是你眼里真正滚动的页面。

还要有可移动空间。如果元素与容器几乎一样高，或者 flex/grid 拉伸让尺寸关系不合适，就可能看不出粘住过程。相应方向没有合适的非 auto 偏移，也不能得到预期效果。

![sticky 在容器里粘住](https://note.lgdsunday.club/img/Q233/03-detail-2.webp)

### 按什么顺序检查“不生效”？

先确认计算后的 position 和偏移值，再画出祖先链，找到包含块和滚动机制。

接着检查容器与元素的尺寸、溢出规则和实际滚动对象。最后再判断遮挡：定位正确但被盖住，才进入层叠上下文的问题。

本篇讨论布局规则，示例属于 HTML/CSS，没有需要人为补成 TS 和 Python 的通用算法。

## 面试官继续追问

### absolute 元素一定没有尺寸吗？

不是。脱离正常流不等于没有盒子和尺寸。它仍然参与自己的布局计算，只是不按普通方式为其他正常流元素占位。

### sticky 不动，是不是浏览器不支持？

先排查偏移、祖先 overflow 和尺寸约束。没有核对这些条件，就把问题归为兼容性，容易修错地方。

### fixed 浮层加一个很大的 z-index，就能解决所有问题吗？

不能。包含块决定定位参照，层叠上下文决定遮挡顺序，它们不是同一个问题。要分别定位原因。

## 面试速记卡

> - relative：保留原位，再相对正常位置偏移。
> - absolute：脱离正常流，依据实际包含块定位。
> - fixed：通常参照视口，但有祖先样式例外。
> - sticky：正常流占位，受滚动机制、阈值与容器边界约束。
> - 排错：先参照与尺寸，再处理遮挡。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **百度 · 前端 · 实习（原帖标签）**：CSS position 提供哪些定位方式？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/530709141912829952)；原帖编辑于 2023-09-15。
- **小米 · 前端 · 原帖未明确批次**：CSS position 提供哪些定位方式？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/625366409853280256)；原帖编辑于 2024-05-29。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
