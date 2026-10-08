# Vue nextTick 是什么？为什么修改数据后，DOM 没有立即更新？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q218-vue-nexttick/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：修改 Vue 的响应式数据以后，为什么马上读 DOM，还是旧内容？

🙋‍♂️ 我：Vue 更新是异步的，用 nextTick 就行。

🧑‍💻 面试官：数据也要等 nextTick 才变化吗？

🙋‍♂️ 我：数据已经变了，DOM 还没更新。

🧑‍💻 面试官：那 nextTick 放在修改数据之前行不行？等完以后，页面动画是不是也已经结束？

> nextTick 最关键的不是“等一下”，而是「等谁」：它等待 Vue 的 DOM 更新批次，不承诺所有异步工作和浏览器绘制都已结束。

## 面试速答（60 秒版）

nextTick 是 Vue 提供的一个等待 DOM 更新完成的 API。

修改响应式数据时，数据本身已经变化了，但 Vue 不会因此立刻把每一次修改都更新到页面上。它会把组件更新排进队列，在一个批次里处理，避免连续修改导致重复更新。

因此，如果修改数据后马上要读取新的元素尺寸、聚焦新出现的输入框，就可以先修改数据，再 await nextTick，然后操作 DOM。

同时要注意，nextTick 不负责等待网络请求、定时器或者动画结束，也不能把 DOM 更新完成理解成浏览器已经把这一帧画出来了。只读取响应式数据时，通常不需要使用它。

![数据变了，DOM 还在排队](https://note.lgdsunday.club/img/Q218/01-answer-overview.webp)

## 知识点详解：数据变化和页面更新，是两个时刻

### Vue 为什么不每改一次就刷新一次？

假设点击按钮时，我们连续修改标题、列表和按钮状态。如果每次赋值都立刻更新组件，同一次操作可能把中间状态反复写到 DOM。

Vue 会安排组件更新任务，并对重复的更新任务进行合适的合并。这样，同一轮同步修改结束后，组件有机会根据最新数据更新，而不是让页面经历每一个中间状态。

所以这里的“异步”主要说的是更新的调度时机，不是说赋值要等一会儿才生效。

### 一个展开输入框的例子，就能看清差别

假设页面用 v-if 控制输入框是否出现。按钮里把 opened 改成 true，然后马上调用输入框的 focus。

这时 opened 已经是 true，但 DOM 中的输入框可能还没有创建，模板引用仍是 null。先等待 nextTick，再读取模板引用，才是在等待这次更新完成。

下面是 Vue 3 的真实示例。它是浏览器框架 API，Python 没有对应的 Vue 组件执行环境，因此不编造 Python 版 nextTick。

```vue
<script setup lang="ts">
import { nextTick, ref } from 'vue'

const opened = ref(false)
const input = ref<HTMLInputElement | null>(null)

async function openInput() {
  opened.value = true
  await nextTick()
  input.value?.focus()
}
</script>

<template>
  <button @click="openInput">展开</button>
  <input v-if="opened" ref="input" />
</template>
```

先赋值，后等待，是这段代码最需要保留的顺序。

![先展开，再等更新，最后聚焦](https://note.lgdsunday.club/img/Q218/02-detail-1.webp)

### nextTick 在等待什么？

按照当前 Vue 3 调度器实现，组件更新被安排进更新队列，刷新队列的过程关联一个 Promise。nextTick 可以等待正在安排的这轮刷新。

理解到这一步就够了：它和 Vue 自己的更新任务有联系，不是随意挑一个延迟时间。源码属于当前实现，API 的公开承诺仍以[官方文档](https://vuejs.org/api/general.html#nexttick)为准。

如果先 await nextTick，再修改数据，那么前面的等待并不负责后面才产生的更新。也不要在一次等待之后继续改数据，却认为新修改同样已经反映到 DOM。

### DOM 更新了，为什么还不能认定“用户已经看见”？

DOM 是页面结构。浏览器还需要布局、绘制和合成，才会把结果显示到屏幕上。

nextTick 解决的是 Vue 的 DOM 更新完成。它不承诺动画完成，也不替图片加载、字体加载或者布局后续变化作保证。

如果需要读取布局尺寸，要考虑元素本身的条件。如果需要等待动画结束，应使用对应动画或过渡事件。需要跟随浏览器帧调度时，可以考虑 requestAnimationFrame，但也不要把单次回调当成所有视觉效果已完成。

![DOM 更新，不等于所有工作结束](https://note.lgdsunday.club/img/Q218/03-detail-2.webp)

## 面试官继续追问

### setTimeout 也能等到更新，为什么还用 nextTick？

定时器安排的是另一个任务，和 Vue 当前的更新批次不是同一个契约。某次“看起来能用”，不等于它准确表达了代码要等什么。等 Vue 更新，就使用 Vue 明确提供的 API。

### 每次修改 ref，都应该加 nextTick 吗？

不需要。读取新数据、发请求、计算结果，不必为它等待 DOM。只有后续操作依赖更新后的 DOM 时，才需要考虑等待。

### watch 里操作 DOM，也需要 nextTick 吗？

要看 watcher 的执行时机。Vue 提供 flush: 'post' 等选项，让回调在组件 DOM 更新后执行。这里应选择合适的调度方式，不是把所有 watcher 都再包一次 nextTick。

## 面试速记卡

> - 数据赋值先发生，组件 DOM 更新可以稍后批量执行。
> - nextTick：等待 Vue 的 DOM 更新批次。
> - 顺序：先修改数据，再等待，再读取或操作新 DOM。
> - 不等待：网络、定时器、动画和所有浏览器绘制。
> - 不需要 DOM：通常不需要 nextTick。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
