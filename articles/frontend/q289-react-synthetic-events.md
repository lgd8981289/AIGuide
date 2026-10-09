# React 合成事件是什么？和原生 DOM 事件有什么区别？

[字节前端面试真题](../companies/bytedance-frontend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q289-react-synthetic-events/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：React 的合成事件是什么？

🙋‍♂️ 我：React 把事件委托到 document，再包装成统一事件对象。

🧑‍💻 面试官：你说的是哪个版本？React 17 以后还是全部绑在 document 吗？

🙋‍♂️ 我：现代 React 多数可委托事件由根容器处理。

🧑‍💻 面试官：如果弹窗通过 Portal 放在根 DOM 外面，为什么点击还可能触发 React 父组件的 onClick？

> 浏览器按 DOM 产生事件，React 按自己的组件关系组织处理。DOM 树和 React 树，不一定是同一棵树。

## 面试速答（60 秒版）

React 合成事件是 React 提供给事件处理函数的事件对象，封装了常用属性与行为，让组件通过 onClick 等声明式接口处理交互，也可以通过 nativeEvent 访问底层原生事件。

现代 React DOM 对多数可以委托的事件使用根容器上的监听来组织分发。不能继续说全部绑定到 document，也不能说每一种事件都完全按这条路径处理。

合成事件传播还与 React 组件树有关。例如 Portal 改变 DOM 位置，但其中事件仍可能沿 React 树传播到父组件。

实际使用要分清 target 和 currentTarget，避免随意混用原生监听与 React 监听。React 17 以后 Web 合成事件也不再使用旧版事件池，旧资料里的 persist 口诀不能直接照搬。

![Q289 面试速答总览：已目视核对技术关系；概念图不是实测结果。](https://note.lgdsunday.club/img/Q289/01-overview.webp)

## 知识点详解：一次点击，怎样到达组件的 onClick？

### 原生事件没有被 React 替代

咱们假设页面有一个按钮，里面包着一个文字 span。

用户点击文字时，浏览器先产生原生点击事件。React 的事件系统接收到相关事件以后，组织对应组件的处理函数，把 React 事件对象交给你的 onClick。

所以“合成”不是 React 模拟了一次假的鼠标点击，也不是浏览器停止产生 DOM 事件。它提供的是一套面向组件使用的事件接口与分发方式。

事件对象可以通过 nativeEvent 访问原生事件，但两者不能直接等同。有些 React 事件与底层原生事件的对应并不是只换一个同名壳，具体需要遵守公开 API，而不是依赖内部映射细节。

### target 是点到谁，currentTarget 是谁正在处理

TypeScript / React：

```tsx
function SaveButton() {
  return (
    <button onClick={(event) => {
      const button = event.currentTarget;
      const clicked = event.target;
      console.log(button.tagName, clicked);
    }}>
      <span>保存</span>
    </button>
  );
}
```

点击 span 时，target 通常是这个 span；当前执行 button 的 onClick，所以 currentTarget 是 button。事件继续交给其他处理函数时，currentTarget 的含义随当前处理位置变化。

需要异步使用按钮，可以像上面一样先保存你需要的元素或数据。现代 React 不再使用旧事件池，不代表 currentTarget 在处理函数结束后仍适合被当成固定快照，也不代表 DOM 永远不会卸载。

本题是 React DOM API，没有 Python 的同一套实现；不提供 Python 伪组件来冒充对应版本。

![Q289 知识点示意：已目视核对技术关系；概念图不是实测结果。](https://note.lgdsunday.club/img/Q289/03-target.webp)

### 根委托有版本边界，也有事件例外

React 17 调整了常见事件的委托位置，现代版本不能统一背成 document。一些事件不冒泡，或者有特殊处理，也不能把“多数事件”省略成“全部事件”。

例如 React 的 onScroll 不按普通点击那样向上冒泡。混用 addEventListener 时，原生传播路径、监听注册位置与时机也会影响调用顺序。

因此，项目中遇到第三方组件监听、多个根或特殊事件，最好做最小复现实验。不要凭一张旧版传播图保证所有原生与 React 回调的固定顺序。

### Portal 改变位置，为什么不一定改变父子关系？

假设 Page 渲染一个 Modal，Modal 通过 Portal 把内容放到 body 下，位置在原来的根节点之外。

在 DOM 树里，弹窗不再位于 Page 对应 DOM 节点内部；在 React 树里，它仍由 Page 渲染。因此，弹窗内的 React 点击事件仍可能传播到 Page 的 React 处理函数。

需要隔离时，可以在合适的处理函数里停止传播，或者调整组件结构。不能仅因为 DOM 位置移出去了，就认定 React 父组件一定收不到事件。

这些行为依据 [React DOM 事件文档](https://react.dev/reference/react-dom/components/common) 和 [createPortal 文档](https://react.dev/reference/react-dom/createPortal) 核验，本文针对现代 React DOM，不覆盖 React Native。

![Q289 知识点示意：DOM 中 root/modal 是兄弟；React 中 App→Page→Modal，事件上行到 Page。](https://note.lgdsunday.club/img/Q289/02-portal-v2.webp)

## 面试官继续追问

**return false 能阻止默认行为吗？**

React 事件处理中不要靠 return false。需要阻止默认行为时使用 preventDefault；需要停止传播时使用 stopPropagation，它们不是同一件事。

**还需要 event.persist() 吗？**

现代 React DOM 不再沿用旧版事件池，persist 已经不具有过去那种保留事件对象的作用。先说明版本，再讨论异步需要保留什么数据。

## 面试速记卡

> - 来源：浏览器产生原生事件，React 提供组件事件接口与分发。
> - nativeEvent：访问底层事件，不代表对象完全等同。
> - target / currentTarget：事件目标与当前执行处理函数的元素。
> - 委托：React 17+ 多数可委托事件由根容器组织，存在例外。
> - Portal：DOM 位置变化，React 树中的传播关系仍可能保留。
> - 事件池：现代 React DOM 不再照搬旧版 persist 规则。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **字节跳动 · 前端 · 校招**：React 合成事件如何模拟捕获与冒泡？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353158686203912192)；面试记录为 2021 年秋招；原帖编辑于 2021-10-09。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
