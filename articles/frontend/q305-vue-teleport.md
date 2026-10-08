# Vue Teleport 是什么？弹窗移动到 body 后，组件关系和事件会改变吗？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q305-vue-teleport/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：Vue 的 Teleport 解决什么问题？

🙋‍♂️ 我：可以把弹窗等内容渲染到另一个 DOM 位置，避免受到原位置的一些布局限制。

🧑‍💻 面试官：放到 body 后，它就不再是原组件的孩子了吗？

🙋‍♂️ 我：DOM 关系改变了，但 Vue 的逻辑组件关系仍然保留。

🧑‍💻 面试官：那 props、emit、provide/inject 怎么走？原父元素上的 CSS 变量和原生冒泡，还会不会跟着过去？

> 这道题要同时看两棵树：Vue 管的组件树，以及浏览器看到的 DOM 树。

## 面试速答（60 秒版）

Teleport 只改变内容实际渲染的 DOM 位置，不改变 Vue 的逻辑父子关系。因此，传 props、发组件事件和依赖注入仍按原组件关系工作。

但 CSS 继承、祖先选择器和原生 DOM 事件传播，需要按实际 DOM 位置判断。内容移到 body 后，不会自动保留原 DOM 祖先带来的全部环境。

它适合弹窗、浮层等需要离开局部容器的内容，但不等于自动做好弹窗。目标节点要存在，还需要管理焦点、键盘退出、背景交互和可访问性。尤其不能用一个很大的 z-index 代替这些职责。

![Teleport 移动 DOM，不改组件父子](https://note.lgdsunday.club/img/Q305/01-overview-v2.webp)

*图：Teleport 移动 DOM，不改组件父子。*

## 知识点详解：弹窗搬家，什么跟着走，什么不跟着走？

### 为什么需要把弹窗移出原来的面板？

假设弹窗写在一个带 transform 的面板组件里，外面又有 overflow 限制。弹窗即使使用 fixed 或很大的 z-index，也可能受到祖先布局或层叠上下文影响。

Teleport 可以让弹窗内容实际出现在专门的根级容器里。代码仍写在面板组件中，浏览器却把弹窗 DOM 放在新的位置。[Vue Teleport 文档](https://vuejs.org/guide/built-ins/teleport.html)明确说明了这两个关系的区别。

### 组件树没有因此重新认父亲

弹窗组件仍由原组件创建。父组件传来的 props 继续有效，弹窗 emit 出去的组件事件仍由原来的逻辑关系处理，provide/inject 也不会因为搬家突然改去读 body。

所以，Teleport 不是重新创建一套独立应用，更不是通过 DOM 位置推断 Vue 的数据流。

### 但浏览器真的看见它换了位置

原生点击事件沿真实 DOM 祖先传播，CSS 继承也根据真实树发生。假设原面板定义了一个 CSS 自定义属性，弹窗移出面板后，可能就不能继承这份值。

scoped 样式可以通过编译后的属性选择器继续命中元素，但依赖原祖先的组合选择器不一定继续成立。不要把「组件关系保留」扩展成「所有样式和事件关系保留」。

![位置换了，CSS 和原生事件路径也换了](https://note.lgdsunday.club/img/Q305/02-dom-v3.webp)

*图：两种事件按不同关系传播；左侧对照的是 DOM 路径，捕获、目标和冒泡阶段仍按 DOM 事件机制处理。*

#### TypeScript（Vue 单文件组件）

```vue
<script setup lang="ts">
import { ref } from 'vue';
const open = ref(false);
</script>
<template>
  <button @click="open = true">打开提示</button>
  <Teleport to="body">
    <div v-if="open" role="dialog" aria-modal="true" aria-label="提示">
      <p>这段 DOM 出现在 body 中。</p>
      <button @click="open = false">关闭</button>
    </div>
  </Teleport>
</template>
```

这只演示 DOM 放置方式，不是可直接上线的完整模态弹窗。Python 没有同一 Vue 渲染 API，因此不提供假对应。

### 正式弹窗还有哪些工作？

打开后焦点应进入弹窗，关闭后回到合理位置；键盘导航不能轻易跑进背景内容，退出方式要明确。背景是否禁用、滚动是否锁定，也要按产品与可访问性要求处理。

普通 Teleport 的目标需要在挂载时可找到。Vue 3.5 的 defer 能把目标解析延后到同一挂载/更新时段，但不是等待一个任意时刻才出现的节点。验证时删除目标、改变嵌套容器、测试组件事件与原生冒泡，再做键盘检查。

## 面试官继续追问

### 多个 Teleport 可以放到同一目标吗？

可以，内容会在目标内按挂载等规则组织。浮层之间的顺序与层级仍需要管理。

### disabled 有什么作用？

禁用 Teleport 时，内容在原位置渲染。可用于不同显示场景，但要复查布局与 CSS 环境的变化。

### body 一定是最好的目标吗？

不一定。专用浮层根节点更容易管理样式与结构，SSR 还需要配合服务端与客户端的输出处理。

## 面试速记卡

> - Teleport：改变 DOM 放置位置，不改 Vue 逻辑父子关系。
> - 组件通信：props、emit、注入仍按组件关系。
> - 浏览器行为：继承、祖先选择器与原生冒泡看真实 DOM。
> - 目标：存在时机要明确，defer 不是任意等待。
> - 弹窗：焦点、键盘、背景交互仍需独立实现。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
