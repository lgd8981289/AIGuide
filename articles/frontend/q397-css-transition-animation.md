# CSS 的 transition 和 animation 有什么区别？什么时候该用过渡，什么时候用关键帧？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q397-css-transition-animation/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：transition 和 animation 有什么区别？

🙋‍♂️ 我：transition 要用户触发，animation 可以自己播放。

🧑‍💻 面试官：页面加载时加一个 class，也能触发 transition 吧？点击后启动的 animation 又怎么解释？

🙋‍♂️ 我：区别应该不是用户有没有操作。

🧑‍💻 面试官：那按钮颜色变化和循环转动的加载图标，你分别怎么写？动画结束以后，业务就一定完成了吗？

> 过渡负责把状态变化变得平滑，关键帧负责描述一段随时间播放的过程。谁触发它们，不是本质区别。

## 面试速答（60 秒版）

transition 描述的是属性从一个状态变到另一个状态时，怎样平滑地过渡。它通常需要发生可过渡的样式变化，适合 hover、展开收起等状态切换。

animation 通过 keyframes 描述随时间变化的关键状态，可以控制延迟、次数、方向和播放状态，适合多阶段效果或循环动画。

两者都可以由用户操作或代码触发，不是“一个必须点击，一个不需要点击”。选型时主要看，是已有状态之间的变化，还是需要独立编排一段过程。

还要考虑属性是否支持相应动画方式、渲染成本和减少动态效果的用户偏好。CSS 动画的结束事件也不能替代业务完成状态。

![transition连接状态与animation编排过程](https://note.lgdsunday.club/img/Q397/01-transition-animation-overview.webp)

## 知识点详解：状态变了，和时间走了，是两件事

### transition 的起点和终点从哪里来？

假设按钮默认背景是浅蓝，悬停后变成深蓝。两套样式给出了起点和终点，transition 负责中间怎么走。

```css
.button {
  background-color: #dbeafe;
  transition: background-color 180ms ease;
}

.button:hover {
  background-color: #2563eb;
}
```

鼠标离开后，样式又变回去，也可以产生反向过渡。这里没有写一整段表演脚本，只规定“背景颜色变化时，用 180ms 平滑处理”。

如果样式没有发生适合过渡的变化，仅声明 transition 不会凭空开始播放。反过来，修改 class、媒体条件变化等也可能带来过渡，不要求一定由用户点击。

### animation 可以直接编排过程

加载图标需要一直旋转，不依赖每次都切换“转到哪个角度”的 class。可以直接描述关键帧：

```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

.spinner {
  animation: spin 900ms linear infinite;
}
```

关键帧还可以增加 30%、70% 等中间阶段。animation 决定这段过程何时开始、播放几次、正向还是反向，以及是否暂停。

所以两者不是一个简单、一个高级。只有起终状态的变化，用 transition 往往更好维护；需要多个时间阶段或持续循环时，animation 表达得更清楚。

### 不是所有属性都能按同一种方式变化

颜色和数值类属性常能插值，但具体能否平滑过渡，要看属性的动画类型及取值。

也不要把“display 永远不能参与过渡”当作不变的结论。现代 CSS 对部分离散属性提供了专门的过渡机制，例如相关的 allow-discrete 配置；它不等于 display 会像宽度一样出现连续中间值。兼容性和起始样式条件仍要查清楚。

布局相关属性变化可能触发布局与绘制。transform、opacity 常更容易走合成路径，但不是写了这两个属性就保证使用 GPU，也不是给每个元素加 will-change 都能提速。合成层同样消耗资源，应在真实页面上检查效果。

### 动画结束，不等于事情做完

假设删除卡片时，先播放淡出效果，再移除 DOM。这种界面处理可以监听结束事件，但还得考虑动画取消、元素提前卸载、持续时间被改成零，以及事件属于哪个属性或元素。

更重要的是，淡出结束不能证明后端删除成功。业务结果和视觉播放要分别管理；请求失败时，也要有清楚的恢复或错误展示方式。

如果用户启用了减少动态效果，应减少不必要的移动或旋转：

```css
@media (prefers-reduced-motion: reduce) {
  .button { transition: none; }
  .spinner { animation: none; }
}
```

暂停加载图标后仍应保留文字或其他静态反馈，不能让用户失去“正在处理”的信息。

![CSS动画结束和网络请求成功是独立事件](https://note.lgdsunday.club/img/Q397/02-animation-business-timing.webp)

## 面试官继续追问

### transition 进行到一半，状态又改变怎么办？

新的样式变化可能让过渡重新指向新目标。具体效果还受当前值、时序和反向规则影响，因此不能假设每次操作都完整播放最初那一段。

### animation-fill-mode: forwards 会保留 DOM 吗？

它影响的是动画结束后相关样式如何应用，不负责 DOM 的添加或删除，也不表示业务状态已经持久化。

### 为什么不统一用 animation？

可以实现很多同样的效果，但额外维护关键帧、播放状态和最终样式未必值得。工具应匹配要表达的状态关系，不能只按功能多少选。

## 面试速记卡

> - transition：平滑连接样式状态变化。
> - animation：用关键帧编排随时间播放的过程。
> - 触发方式：两者都可由用户操作或代码触发。
> - 性能判断：看属性和真实渲染行为，不承诺 transform 必然走 GPU。
> - 工程边界：动画事件不等于业务完成，保留取消处理和减弱动态效果方案。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
