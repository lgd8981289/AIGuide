# Web Components 是什么？Shadow DOM 如何实现样式隔离？

[百度前端面试真题](../companies/baidu-frontend.md) · [阿里前端面试真题](../companies/alibaba-frontend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q517-web-components-shadow-dom/) · [题库目录](../../README.md)

下面是一段模拟面试对话。

🧑‍💻 面试官：把评分组件放进不同网站，怎么避免宿主样式影响它？

🙋‍♂️ 我：可以使用 Web Components，把内部 DOM 放到 Shadow DOM 中。

🧑‍💻 面试官：那网站设置的字体还会继承进去吗？CSS 变量能不能传进去？

🙋‍♂️ 我：一些继承属性和 CSS 变量仍然可以影响内部内容，不是完全隔绝。

🧑‍💻 面试官：如果设成 closed，能不能把访问令牌放进去，认为外部代码读不到？

> Shadow DOM 提供的是「组件封装边界」。它帮助管理 DOM、样式与事件，不是保护秘密的安全沙箱。

## 面试速答（60 秒版）

Web Components 是浏览器提供的一组组件能力。Custom Elements 让我们定义自己的元素和生命周期；Shadow DOM 可以为元素附加一棵内部 DOM 树；slot 则让组件在指定位置呈现外部传入的内容。

Shadow DOM 的样式隔离，主要体现在普通 CSS 选择器不会像遍历普通 DOM 一样，随意穿过 shadow 边界匹配内部节点。组件内部样式也有自己的作用范围。[MDN 说明](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM)。

不过，继承属性和 CSS 自定义属性仍可能传入，slot 内容也保留自己的来源。需要主题定制时，应设计明确的变量或 part 接口。

同时，closed 只是限制常规获取 shadowRoot 的方式，不能作为安全隔离。权限和敏感数据仍需要在可信服务端处理。

![Web Components：标签与封装](https://note.lgdsunday.club/img/Q517/01-components-overview.webp)

## 知识点详解：评分组件怎样在不同页面中保持样式

### 自定义元素与内部 DOM 是两项能力

假设咱们定义一个评分组件，使用者在页面里放入一个自定义标签。

Custom Elements 负责让浏览器认识这个标签，创建对应实例，并在挂载、移除或指定属性变化时调用相应生命周期方法。[自定义元素文档](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements)。

Shadow DOM 则负责内部结构的封装。组件可以附加 shadow root，再在里面放五个评分按钮。

这两项能力可以配合，但不是绑定关系。自定义元素可以不用 Shadow DOM；Shadow DOM 也不是 Vue 或 React 的虚拟 DOM。它是真实浏览器 DOM 中的结构。

### 普通选择器为什么碰不到内部按钮？

如果评分按钮就是普通页面里的 button，宿主设置“所有按钮使用红色背景”，很可能影响它们。

按钮位于 shadow tree 时，宿主普通的 button 选择器不会直接穿过边界匹配进去。组件可以在内部定义自己的 button 样式。

但宿主元素本身仍在外部页面里，继承关系并没有完全消失。例如字体、颜色和 CSS 自定义属性可能通过宿主传到内部。所以，“外部选择器不能直接匹配内部节点”和“外部样式绝不影响组件”不是同一句话。

如果希望评分颜色能被定制，可以公开一个 CSS 变量，让内部样式明确使用它。这样既保留默认效果，也让主题入口可控。

![选择器隔离，继承仍可进入](https://note.lgdsunday.club/img/Q517/02-style-boundary.webp)

图中的 CSS 变量可以继承到内部，但只有内部样式实际引用它，才会改变对应效果。“能传入”与“已经使用”仍要分开。

### slot 展示外部内容，节点不会自动搬家

假设评分组件允许使用者提供一段说明：“请选择你的评分。”

这段说明来自宿主的 light DOM，可以通过 slot 在组件内部的指定位置呈现。视觉上它在组件里，节点关系却没有因此全部变成 shadow 内部节点。

因此，外部对说明文字的样式规则仍可能生效。内部如果要修饰直接分配给 slot 的元素，需要遵守相应的插槽选择规则，不能把它当作随意穿透所有后代的选择器。

理解 slot 时，分清“显示在哪里”和“节点由谁提供”，后面的样式与事件规则就更容易解释。

![slot 负责显示，不改变节点归属](https://note.lgdsunday.club/img/Q517/03-slot-ownership.webp)

### 事件需要考虑边界和对外接口

组件内部按钮点击以后，使用者通常需要知道新评分是多少，而不需要知道内部第几个 button 的结构。

可以设计一个明确的组件事件，把评分值放在 detail 中。自定义事件是否冒泡、是否允许跨 shadow 边界，需要按 bubbles 和 composed 配置，不能默认所有事件都会出去。[Shadow DOM 中的事件与封装](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM)。

跨边界以后，外部观察到的 target 还可能被重定向为宿主元素。这是封装的一部分，不能拿内部节点路径当稳定业务接口。

### 生命周期还有资源清理

组件可能监听全局窗口事件，或者启动计时器。移除组件以后，应按自己的生命周期设计解除监听和停止无用工作。

同时，元素可能被移除后再次连接。初始化和清理要能够重复执行，避免重新挂载就重复注册同一个监听器。

本文关注浏览器机制，没有对应的官方 Python DOM 实现，因此不提供机械翻译代码。

![对外事件与卸载清理](https://note.lgdsunday.club/img/Q517/04-event-cleanup.webp)

## 面试官继续追问

### Vue scoped 和 Shadow DOM 一样吗？

不一样。Vue scoped 主要通过编译后的属性标记和选择器控制样式范围；Shadow DOM 是浏览器提供的结构边界。

两者都能减少样式冲突，但继承、插槽、事件和选择器行为不能直接互换。

### closed 模式为什么不能保护令牌？

它让 element.shadowRoot 的常规读取返回空值，但不构成隔离不可信脚本的安全环境。令牌不应通过“外部不容易找到节点”来保护。

### 应该怎样验证评分组件的封装？

在宿主加上全局按钮样式，改变字体与主题变量，再测试 slot 内容和评分事件。然后反复挂载、移除，检查是否留下重复监听器。

## 面试速记卡

> - Custom Elements：定义组件元素与生命周期。
> - Shadow DOM：建立内部 DOM 和样式封装范围。
> - 样式边界：普通选择器受限，继承与 CSS 变量仍需理解。
> - slot：改变呈现位置，不自动改变节点归属。
> - 安全判断：closed 不是沙箱，敏感能力仍要服务端授权。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **百度 · 前端 · 原帖未明确批次**：样式隔离有哪些方法，是否了解 Shadow DOM？（题意整理）。[面经来源](https://www.nowcoder.com/feed/main/detail/d088a8c478cd4256b098776b0d143918)；原帖发布于 2025-09-28。
- **阿里巴巴 · 前端（大文娱） · 原帖未明确批次**：Shadow DOM 是什么，与普通 DOM 有什么区别？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/669179217484984320)；正文记录 9 月 26 日面试；原帖编辑于 2024-09-28。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
