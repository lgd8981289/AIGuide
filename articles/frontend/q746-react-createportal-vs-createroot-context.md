# React createPortal 和 createRoot 有什么区别？跨容器渲染时状态与 Context 怎样共享？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q746-react-createportal-vs-createroot-context/) · [题库目录](../../README.md)

*以下对话为教学模拟，用来讲解这道题。*

🧑‍💻 面试官：React 内容要显示到另一个 DOM 容器，你会用 createPortal，还是再调用一次 createRoot？

🙋‍♂️ 我：都能把内容渲染过去，应该差不多。

🧑‍💻 面试官：原页面的主题 Provider 包在外面，新的内容还能读到吗？

🙋‍♂️ 我：Portal 应该可以，新 root 可能读不到。

🧑‍💻 面试官：那么“在同一个页面”“使用同一个组件函数”和“属于同一棵 React 树”，到底是不是同一件事？

> 跨容器渲染，先决定要不要另建一棵 React 树。DOM 离得近，不代表 Context 和生命周期就属于同一份管理关系。

## 面试速答（60 秒版）

createPortal 把一棵 React 树中的部分内容，放到另一个 DOM 容器里。内容在逻辑上仍属于原来的树，所以可以继续读取原树上方的 Context，也继续由原父组件传递 props 和管理挂载关系。

createRoot 则在指定容器建立一个独立 React 根。它不会因为容器位于某个 Provider 的 DOM 后代，就自动读取那个 Provider；也不会因为两个根使用同一个组件函数，就自动共享组件状态。

因此，页面内的弹窗、浮层或者同一应用的跨区域内容，通常可以保留在一棵树里，用 Portal 改位置。独立挂载到旧页面的小应用，则可以各自创建根，但通信、状态与卸载都要明确安排。

同树也不表示所有局部 state 都共享。Context 可以向下共享，两个组件实例各自的 useState 仍然独立，需要共享的状态要放在共同拥有者或明确的状态系统中。

![Portal保持原树而createRoot另建独立根](https://note.lgdsunday.club/img/Q746/01-portal-vs-root-overview-v2.webp)

## 知识点详解：容器是 DOM 位置，根是 React 的管理边界

### 两个容器，未必需要两个根

假设一个页面由 React 管理，中间是主内容，页面另一处还有一个专门显示提示的容器。

如果提示需要读取主应用的主题、语言和用户状态，可以让主应用通过 Portal 渲染过去。浏览器把提示放在另一个容器，React 仍然知道它由谁创建，上方有哪些 Provider。

如果改成对提示容器再调用 createRoot，就建立了另一棵树。主应用即使还在正常运行，也不再是这棵新树的逻辑父节点。

[createPortal 官方文档](https://react.dev/reference/react-dom/createPortal)专门对比了这两种方式。把非 React 页面中的几个位置连成同一应用，并不一定需要分别建立很多根。

### Provider 能不能跨过去，看的是 React 树

下面的最小实验同时创建主根与独立根，另有一个只用于 Portal 的容器。调用方需要先提供三个不同、已经存在的 DOM 元素。代码只针对客户端，不在服务端访问 document。

#### TypeScript（React）

```tsx
import { createContext, useContext, useState } from "react";
import { createPortal } from "react-dom";
import { createRoot } from "react-dom/client";

const Theme = createContext("默认主题");

export function Panel() {
  const theme = useContext(Theme);
  const [local, setLocal] = useState(0);
  return (
    <div>
      <p data-theme>{theme}</p>
      <button onClick={() => setLocal(n => n + 1)}>局部计数 {local}</button>
    </div>
  );
}

export function App({ target }: { target: HTMLElement }) {
  const [theme, setTheme] = useState("蓝色主题");
  return (
    <Theme.Provider value={theme}>
      <button onClick={() => setTheme("绿色主题")}>切换主题</button>
      <Panel />
      {createPortal(<Panel />, target)}
    </Theme.Provider>
  );
}

export function mount(main: HTMLElement, portal: HTMLElement, other: HTMLElement) {
  const mainRoot = createRoot(main);
  const otherRoot = createRoot(other);
  mainRoot.render(<App target={portal} />);
  otherRoot.render(<Panel />);
  return () => {
    mainRoot.unmount();
    otherRoot.unmount();
  };
}
```

初始时，主页面与 Portal 中的 Panel 都看到蓝色主题，独立根里的 Panel 看到默认主题。切换主题以后，前两个一起变成绿色，独立根仍是默认主题。

即使把 other 容器放在主应用某个 DOM 元素内部，也不能仅凭这个物理位置获得 Provider。读取 Context 时，React 会沿逻辑树向上寻找 Provider，不沿 DOM 的 parentNode 查找。

这里没有官方 Python 对应的 React 根与 Hook 实现。Python 后端返回相同数据，不等于建立了同一棵 React 树。

### 为什么两个 Panel 的计数没有一起增加？

因为它们是两个组件实例。即便都位于同一个 Provider 下面，各自调用 useState 得到的也是各自的局部状态。

点 Portal 的“局部计数”，主页面那个 Panel 不会跟着加一。它们共享的是上方提供的 theme，不是把所有内部变量装进同一个容器。

如果产品要求计数同步，可以把计数提升到 App，再通过 props 或 Context 分发。两个独立根也可以订阅同一个外部状态源，但那是我们明确搭建的数据连接，不是 createRoot 天生共享。

[React useContext 文档](https://react.dev/reference/react/useContext)说明了向上寻找 Provider 的范围。面试回答“Portal 能共享状态”时，最好补清具体指哪份状态，避免让人误以为它把两个组件实例合并了。

![共享Context不等于共享各组件实例的局部state](https://note.lgdsunday.club/img/Q746/02-context-versus-local-state-v2.webp)

### 关闭一边，另一边应该发生什么？

主树卸载时，属于这棵树的 Portal 内容也会被卸载，即使它的 DOM 位于主容器之外。独立根不会因此自动卸载，需要调用它自己的 unmount。

上面的 mount 返回一个清理函数，分别卸载两个根。这个小设计是为了让创建者同时负责释放，避免主页面离开以后，独立根还留着定时器、订阅或界面。

不要直接用清空容器 HTML 代替 React 的卸载通知；也不要把另一个正在由 React 管理的区域，随手交给新根反复覆盖。先确定每块 DOM 由谁拥有，再安排加载与清理。

![主根卸载会卸载Portal但不会自动卸载独立根](https://note.lgdsunday.club/img/Q746/03-independent-root-unmount-v2.webp)

## 面试官继续追问

### 多个根就绝对不能共享数据吗？

可以共享，但需要显式通信、外部 store 或分别传入数据。同一个外部 store 不等于同一棵 React 树，Context 和组件生命周期仍按各自根处理。

### 原先是服务端生成的 React HTML，应该调用 createRoot 吗？

需要接管已有 React HTML 时，应按框架约定使用 hydrateRoot 等水合入口。[createRoot 官方文档](https://react.dev/reference/react-dom/client/createRoot)明确区分了客户端新建与服务端页面接管，不能为了换容器顺手破坏原来的水合流程。

### Portal 的点击会经过原父组件吗？

React 事件仍按逻辑树传播，原生 DOM 路径则看真实位置，具体见 Q289。这是同树关系的一个结果，本题不再重写整套事件传播规则。

### 该怎么验证没有混淆两棵树？

同时测主题更新、各实例局部计数和卸载。只验证三个区域都能显示相同组件，还不能说明它们共享了 Provider 或具有同一生命周期。

## 面试速记卡

> - createPortal：同一 React 树，换一个 DOM 放置位置。
> - createRoot：建立独立根，不自动继承另一棵树的 Provider。
> - Context：沿逻辑树共享；同一组件函数不等于同一组件实例。
> - 局部 state：每个实例独立，需要共享就明确安排拥有者或状态源。
> - 卸载责任：主树带走自己的 Portal，独立根要单独 unmount。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
