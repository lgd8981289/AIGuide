# Vue 3 的 Composable 是什么？和普通函数、Mixin 有什么区别？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q304-vue-composable/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：Vue Composable 和普通工具函数有什么区别？

🙋‍♂️ 我：Composable 用来复用包含响应式状态等内容的逻辑，不只是算一个结果。

🧑‍💻 面试官：两个组件调用同一个 useMouse，它们会共享坐标吗？

🙋‍♂️ 我：要看 ref 创建在函数里面，还是模块外面。

🧑‍💻 面试官：那监听器谁清理？把 prop 的当前值传进去，后面 prop 变化，它会自动跟着变吗？

> 逻辑能复用以后，还要说清「状态属于谁，输入怎样变化，资源何时退出」。

## 面试速答（60 秒版）

Composable 是利用 Composition API 封装并复用有状态逻辑的函数，例如响应式数据、监听与生命周期清理。普通工具函数通常处理一次输入并返回结果，不一定持有这些资源。

它相对 Mixin 的优势是输入和返回值更明确，使用者能看到状态来自哪个函数，也可以重命名，减少隐式字段冲突。

调用同一个 Composable 不代表共享状态。状态在函数内创建，通常每次调用各有一份；放在模块层，就可能被调用者共享。副作用也要随拥有它的组件清理，响应式输入则要按 ref、getter 等契约处理，不能把传入的一次普通值误认为持续订阅。

![Composable 复用有状态逻辑](https://note.lgdsunday.club/img/Q304/01-overview.webp)

*图：Composable 复用有状态逻辑。*

## 知识点详解：两个页面复用监听，为什么有时互相影响？

### 先分清复用代码与共享数据

假设两个组件都需要鼠标位置。把监听逻辑抽进 useMouse，可以少写两份代码。若 x、y 在函数体内创建，每次调用得到的是不同的 ref。

如果把 ref 放到文件顶层，函数只是返回它们，那么两个组件就会拿到同一份数据。两种写法都可能有用途，但必须明确表达，不能让共享状态藏在函数名字后面。[Vue Composable 指南](https://vuejs.org/guide/reusability/composables.html)区分了状态封装与逻辑复用。

![ref 放在哪里，决定谁共享](https://note.lgdsunday.club/img/Q304/02-ownership-v2.webp)

*图：ref 放在哪里，决定谁共享。*

### 资源要有对应的退出动作

浏览器 TypeScript 示例中，每次调用建立一份监听，并在所属组件卸载时撤销。Python 没有同一 Vue 组件生命周期，因此不提供表面同名版本。

#### TypeScript

```ts
import { ref, onMounted, onUnmounted } from 'vue';
export function useMouse() {
  const x = ref(0);
  const y = ref(0);
  const update = (event: MouseEvent) => {
    x.value = event.clientX;
    y.value = event.clientY;
  };
  onMounted(() => window.addEventListener('mousemove', update));
  onUnmounted(() => window.removeEventListener('mousemove', update));
  return { x, y };
}
```

在 setup 中同步调用，Vue 才能将生命周期注册到当前组件。监听放到 mounted 后，也避免服务端渲染阶段访问 window。这个例子按组件建立监听；如果确实需要全局只监听一次，还要另行设计共享资源的引用计数或管理者。

![监听器也有退出动作](https://note.lgdsunday.club/img/Q304/02-cleanup.webp)

*图：监听器也有退出动作。*

### 普通值不是一条持续更新的输入通道

假设 useFetch 接收一个 URL。传进去的是 url.value，那它收到的只是当前字符串，后面 ref 变化不会反过来修改这个字符串。

想随输入变化重新请求，需要把 ref 或 getter 交进去，并在响应式副作用里读取。读取之后还要处理旧请求、错误与退出清理，不能只写一个 watch 就认为结果一定正确。

### 解构时，为什么经常返回 ref？

返回普通对象，里面的成员是 ref，使用者解构后仍保留这些响应式引用。若直接解构 reactive 对象中的普通属性，则可能只拿到当前值，失去原属性访问关系。

因此，返回形式不是排版习惯，而是公开契约的一部分。使用者应该知道拿到的是当前值、可变 ref，还是只读访问入口。

验证时创建两份实例，修改其中一份，确认另一份是否应该变化；卸载组件，检查监听有没有清理；改变输入，检查新结果是否对应新参数。逻辑复用做得好不好，不能只看文件里有没有 use 开头的函数。

## 面试官继续追问

### 所有函数都应该改名叫 useXxx 吗？

不用。纯格式化、数学计算等普通函数没必要装成有状态逻辑。名字应该提示真实职责。

### Mixin 为什么容易难查？

它把成员合入组件，来源与跨 Mixin 依赖可能不明显。Composable 通过参数和返回值把这些关系写出来，但差的封装仍可能隐藏依赖。

### 模块级 ref 在 SSR 有什么风险？

服务端模块可能被多次请求复用，用户数据可能跨请求共享。需要按请求隔离状态，不能把客户端共享习惯直接搬过去。

## 面试速记卡

> - Composable：复用响应式状态与相关副作用逻辑。
> - 状态：函数内创建通常独立，模块层创建可能共享。
> - 输入：一次普通值不是自动更新的订阅。
> - 清理：监听、计时器与请求都需要退出路径。
> - SSR：不访问浏览器对象，不共享用户请求状态。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
