# CSS 盒模型有什么区别？box-sizing 怎样影响元素宽高？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q125-css-box-model/) · [题库目录](../../README.md)

<!-- 以下对话为教学模拟，非真实面经。 -->

🧑‍💻 面试官：CSS 的标准盒模型和 border-box 有什么区别？

🙋‍♂️ 我：标准盒模型的 width 是内容宽度，border-box 把 padding 和 border 也算在 width 里面。

🧑‍💻 面试官：那么一个 width: 200px、padding: 20px、border: 2px 的盒子，实际有多宽？

🙋‍♂️ 我：标准盒模型是 244px，border-box 是 200px。

🧑‍💻 面试官：对。如果再加 margin: 10px 呢？为什么改成 border-box 后，一个很长的单词仍然可能撑破布局？

> 这道题要分清两件事：width 量的是哪一层，以及最后的布局尺寸还受哪些约束。

## 面试速答（60 秒版）

CSS 盒模型从里到外是 content、padding、border 和 margin。

默认的 `content-box` 把 width 和 height 用在内容区上，内边距和边框要另外加。`border-box` 则让指定的宽高包含内容、内边距和边框，但不包含 margin。

所以，在宽度明确的表单或卡片布局里，我一般使用 border-box，计算会直观一些。不过它并不保证元素一定不会溢出。内容的最小尺寸、Flex 或 Grid 的约束，还有长文本的换行方式，都需要一起检查。

![相同 width 设置下，content-box 与 border-box 的内容区和边框盒宽度不同](https://note.lgdsunday.club/img/Q125/00-60s-overview.webp)

## 知识点详解：width 到底量的是盒子的哪一层

### 先用一个盒子把尺寸算清楚

假设我们要把一个输入框放进宽 200px 的侧栏，给输入框设置 width: 200px，左右 padding 各 20px，左右 border 各 2px。

如果仍然使用默认的 content-box，那么 200px 只是能放文字的内容区。外面还要加上 40px 内边距和 4px 边框，所以边框盒宽度是 **244px**。这时候输入框超出侧栏，并不是浏览器算错了，而是咱们量错了地方。

换成 border-box 后，同样的 200px 是边框盒宽度。扣除 padding 和 border，留给内容的宽度就是 **156px**。这里假设没有其他最小尺寸约束，宽度也足够容纳这些边框与内边距。

### margin 不在 border-box 的账里

再加上左右各 10px 的 margin，标准盒模型的横向占位会变成 264px；border-box 的横向占位则是 220px。在这个普通水平布局例子里，margin 都是在边框外额外留下的间距。

因此，不能把 border-box 理解成“width 已经包含所有东西”。它改变的是 width 对内容区、内边距、边框的计算方式，不负责把外边距一起装进去。

项目里常见的统一设置是下面这样。CSS 本身就是浏览器的布局语言，这里不提供功能不对应的 Python 版本。

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}
```

注意带上伪元素。否则组件主体和它的装饰元素可能用着不同的尺寸规则。

### 为什么用了 border-box 还是会溢出？

咱们再把输入框换成一张卡片，卡片里放一条没有空格的长地址。border-box 能帮你算清卡片的边框盒，却不会自动替这条地址决定怎么换行。

如果卡片是 Flex 子项，还要检查它的自动最小尺寸。必要时让需要收缩的子项使用 min-width: 0，并对具体文本设置合适的换行规则；不要看到溢出就给所有元素加 overflow: hidden，把内容和焦点轮廓一起剪掉。

排查时可以先在开发者工具里看内容区、padding、border 和 margin 的数值，再检查最终计算宽度、父容器宽度以及 min-width。这样能区分“盒模型多算了空间”和“内容不允许收缩”，处理方法也就清楚了。

本题机制参考：[MDN：CSS 盒模型](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Box_model)。

## 面试官继续追问

### width: 100% 加 padding，一定会超出父元素吗？

不一定。content-box 下，指定宽度之外还会加 padding 和 border；border-box 下它们包含在指定宽度里。最终是否溢出还受 margin、最小尺寸和布局方式影响，不能只看 100%。

### 垂直 margin 能直接相加吗？

普通块布局中，符合条件的垂直外边距可能合并；水平方向通常不能照这个规则推。盒模型计算和外边距合并是两个相关但不同的问题。

### border-box 是不是更小，所以性能更好？

不是。它主要让尺寸管理更方便，并没有普遍的性能优势。选它是为了布局规则清楚，不是为了减少绘制成本。

## 面试速记卡

> - content-box：width 量内容区，padding 和 border 另外加。
> - border-box：width 包含内容、padding 和 border。
> - margin：始终在边框盒之外，不被 border-box 包含。
> - 溢出排查：盒模型、最小尺寸、父容器与内容换行一起看。
> - 验证方式：用开发者工具检查计算尺寸，不凭肉眼猜。

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
