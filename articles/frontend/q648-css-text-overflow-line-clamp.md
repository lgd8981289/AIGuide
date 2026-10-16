# CSS 单行和多行文本省略怎么实现？text-overflow 为什么有时不生效？

[淘天前端面试真题](../companies/taotian-frontend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q648-css-text-overflow-line-clamp/) · [题库目录](../../README.md)

*下面是用于讲题的模拟面试对话。*

🧑‍💻 面试官：给标题加了 text-overflow: ellipsis，为什么没出现省略号？

🙋‍♂️ 我：它不会自己创造溢出，还要有可限制的宽度，并处理不换行和溢出裁剪。

🧑‍💻 面试官：父元素是 Flex，标题一直把容器撑宽呢？

🙋‍♂️ 我：还要检查 Flex item 的最小尺寸，可能需要 min-width: 0。

🧑‍💻 面试官：产品改成最多两行，你把 white-space 去掉就够了吗？

> 省略号是排版结果。先让文本真的超过可用空间，再选择单行或多行的截断方式。

## 面试速答（60 秒版）

单行省略通常需要一起设置不换行、隐藏溢出和 text-overflow: ellipsis，同时容器必须有可约束的宽度。text-overflow 本身不会让元素变窄，也不会自动禁止换行。

如果在 Flex 或 Grid 里没有生效，要检查标题所在子项能否收缩。比如 Flex item 的自动最小宽度可能阻止它缩小，这时按布局需要设置 min-width: 0。

多行省略则需要控制行数。实际项目常见兼容写法是 -webkit-line-clamp 配合 -webkit-box 和纵向排列；标准 line-clamp 的支持情况应按目标浏览器核对，不能只写一个属性就假定处处有效。

省略只改变显示，不代表完整内容被删除。还要考虑用户怎样查看全文，尤其是触屏和键盘使用者，不能把鼠标悬停当成唯一入口。

![省略号出现，需要哪些条件？](https://note.lgdsunday.club/img/Q648/01-css-text-overflow-line-clamp.webp)

## 知识点详解：为什么有省略规则，却没有溢出？

### 一行文本需要先被限制住

假设卡片里有一个很长的文章标题。如果标题容器跟着内容一起变宽，就没有需要裁掉的部分，自然也没有省略号。

让它最多占 18rem，再禁止换行，长文本就会超出行内可用空间。隐藏溢出以后，text-overflow 再决定截断位置怎样显示，见 [MDN text-overflow](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-overflow)。

```css
.title {
  width: 18rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

这组样式通常作用于能形成相应内容区域的容器，不要只给普通非替换行内 span 写一个 width，再假定它已经被限制。

### Flex 里要继续追到能收缩的那一层

假设卡片左边有图标，右边是标题区域。即使卡片总宽度固定，右侧 Flex item 仍可能因为自动最小尺寸，被长文本撑住。

这时应在需要收缩的 Flex item 上按布局要求设置 `min-width: 0`，再让内部标题执行省略。如果外面还有一层 Flex 包裹，需要继续检查那一层，不能在任意祖先上加一次就认为必定生效。

单行省略负责内容如何画出来，最小尺寸负责盒子能缩到哪里。两条规则作用的位置不同，所以仅反复修改 text-overflow 往往解决不了问题。

![Flex 里面，为什么文字还在撑开？](https://note.lgdsunday.club/img/Q648/02-css-text-overflow-line-clamp.webp)

### 两行截断需要另一套条件

多行省略允许正常换行，只限制可显示的行数。常见兼容形式如下。

```css
.summary {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}
```

不要把单行的 `white-space: nowrap` 留在这份规则上，否则文本根本不会正常排成两行。前缀组合与标准属性的关系、浏览器支持范围见 [MDN line-clamp](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/line-clamp)。

实际界面还应检查字体、行高、容器内边距与特殊内容。恰好两行的中文和一整段无法自然断开的链接，排版情况可能不同。不能只在一个固定截图上确认效果。

![两行截断，不等于删掉后面的文字](https://note.lgdsunday.club/img/Q648/03-css-text-overflow-line-clamp.webp)

### 截断之后，全文怎样读到？

短标题可以考虑可聚焦的详情入口，长摘要可以提供展开按钮。title 属性有时能在鼠标悬停时提示，但触屏、键盘和辅助技术体验并不等价，不能把它当成唯一的全文方案。

检查时准备短文本、刚好达到行数、明显超长、长链接和缩放字体等情况，再切换目标浏览器与容器宽度。CSS 不依赖 TS 或 Python 实现，本文保留原始样式；实际页面布局仍需在目标环境验证。

## 面试官继续追问

### text-overflow 会改变 DOM 里的文字吗？

它控制溢出内容的显示，通常不把 DOM 文本截短。复制、辅助技术以及自定义组件的行为需要具体检查，不能把视觉省略直接当成数据删除。

### 为什么宽度固定了还是不行？

检查宽度写在谁身上、盒子是否按该宽度排版、父级最小尺寸是否阻止收缩，以及内容是否允许换行。定位是哪一层没有形成溢出，比继续叠加 ellipsis 更有效。

### 能直接按字符数截断吗？

字符数量不能准确表示实际显示宽度，字体、语言和容器都会改变结果。若产品要求固定字符摘要，那是数据处理规则；若要求最多两行，应按实际排版处理。

## 面试速记卡

> - 单行省略先限制空间，再处理不换行、裁剪和省略标记。
> - text-overflow 不自动设置宽度，也不自动创造溢出。
> - Flex 或 Grid 中继续检查最小尺寸和真正需要收缩的子项。
> - 多行截断按行数处理，兼容组合与标准支持分别核对。
> - 提供合适的全文入口，并验证不同内容和屏幕宽度。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **淘天 · 前端 · 暑期实习**：单行和多行文字怎样设置省略号？（题意整理）。[面经来源](https://www.nowcoder.com/feed/main/detail/558d2cb9ac114d1ca35b564856a59e70)；原帖发布于 2024-04-07。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
