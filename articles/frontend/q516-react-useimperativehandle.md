# React 的 useImperativeHandle 有什么用？父组件怎样调用子组件的方法？

[端点前端面试真题](../companies/duandian-frontend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q516-react-useimperativehandle/) · [题库目录](../../README.md)

下面是一段模拟面试对话。

🧑‍💻 面试官：弹窗打开以后，父组件怎样让子组件输入框聚焦？

🙋‍♂️ 我：拿到子组件 ref，再调用输入框的 focus。

🧑‍💻 面试官：你想给父组件整颗 DOM，还是只给一个聚焦方法？

🙋‍♂️ 我：可以用 useImperativeHandle 暴露 focus。

🧑‍💻 面试官：如果暴露的是提交方法，它读到了旧的 props 呢？表单显示内容又应该通过方法还是 props 控制？

> useImperativeHandle 解决的是「对外暴露哪些操作」。它不会替你处理所有状态，也不会自动避免闭包里的旧值。

## 面试速答（60 秒版）

useImperativeHandle 可以让子组件定制父组件通过 ref 拿到的内容。父组件不必直接拿到内部 DOM，可以只拿到 focus、reset 这类有限的方法。

例如打开弹窗以后，需要把焦点放进子组件输入框。子组件在内部保存 DOM ref，再对外暴露一个 focus 方法，父组件只需要调用这个方法。

如果只是控制表单内容、选中状态或是否显示，通常用 props 和 state 更容易看清数据关系。命令式句柄更适合聚焦、滚动这类具体操作。

同时，暴露的方法如果读取 props 或 state，就要处理依赖更新。React 19 可以通过 ref prop 接收引用；React 18 及以前的对应写法需要 forwardRef。[官方 API](https://react.dev/reference/react/useImperativeHandle)。

![useImperativeHandle：只暴露需要的方法](https://note.lgdsunday.club/img/Q516/01-handle-overview.webp)

## 知识点详解：把内部 DOM 和公开操作分开

### 父组件拿到的，可以是一份小接口

假设 SearchInput 内部有一个输入框。父组件只需要在用户点击按钮时让它聚焦，没有必要知道内部用了几个元素。

因此，子组件可以公开一个只有 focus 的对象。输入框换成新的实现以后，只要这个方法仍然有效，父组件就不用跟着修改 DOM 查询逻辑。

这和把整个实例交出去不一样。接口越小，组件内部越容易调整，也更容易在测试中说明父组件可以做什么。

### React 19 的最小实现

下面展示浏览器 React 的 TypeScript 实现。Python 没有同一套官方 React Hook 与 DOM 运行环境，因此不提供机械翻译的 Python 版本。

#### TypeScript（React 19）

```tsx
import { useImperativeHandle, useRef } from "react";
import type { Ref } from "react";

type InputHandle = { focus(): void };

function SearchInput({ ref }: { ref?: Ref<InputHandle> }) {
  const input = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus() {
      input.current?.focus();
    }
  }), []);

  return <input ref={input} aria-label="搜索内容" />;
}

export default function SearchPanel() {
  const search = useRef<InputHandle>(null);
  return (
    <>
      <SearchInput ref={search} />
      <button onClick={() => search.current?.focus()}>
        聚焦搜索框
      </button>
    </>
  );
}
```

父组件的 search.current 指向公开句柄，子组件的 input.current 指向真实 DOM。点击按钮时，父组件调用 focus，再由子组件操作自己的输入框。

这也解释了为什么这里可以使用空依赖：方法读取的是稳定 ref 对象中的当前节点，没有捕获某次渲染的表单值。

![ref.current 接到的是 handle](https://note.lgdsunday.club/img/Q516/02-ref-handle.webp)

### 方法读到了旧值，就要重新检查依赖

假设公开方法变成 submit，里面使用当前 onSubmit 和表单内容。如果创建句柄时捕获了这些值，却一直使用空依赖，方法就可能读到旧渲染的数据。

依赖数组应包含句柄创建逻辑中使用的响应式值。依赖变化以后，React 会重新创建并赋值句柄。[依赖比较规则](https://react.dev/reference/react/useImperativeHandle)。

也可以通过其他明确设计读取最新值，但不能为了保持对象不变就隐瞒依赖。先保证语义正确，再考虑引用稳定是否有实际收益。

![方法为什么读到旧值？](https://note.lgdsunday.club/img/Q516/03-stale-values.webp)

### 不是所有交互都适合命令式方法

“现在聚焦”是一个动作；“这个输入框当前值是关键词 A”是状态。

如果父组件不停调用 setValue，子组件也保存另一份值，两个地方很容易出现谁覆盖谁的问题。让值通过 props 传入，再通过事件更新父状态，数据关系通常更清楚。

调用时还要处理组件尚未挂载或已经卸载的情况。ref.current 可能为空，不能假定某个异步回调到达时，子组件仍然存在。[DOM ref 的生命周期](https://react.dev/learn/manipulating-the-dom-with-refs)。

## 面试官继续追问

### 它返回一个 handle 对象吗？

Hook 自身返回 undefined。它把 createHandle 生成的内容交给传入的 ref，父组件从 ref.current 读取。

把这两个返回位置讲反，代码就很容易写成取 Hook 的返回值。

### 父组件调用方法，子组件一定重新渲染吗？

不一定。focus 改变焦点，不是 React 状态更新。

如果方法调用 setState，才会按 React 的状态机制安排更新。ref 和 state 仍然承担不同职责。

### 怎么测试这个接口？

挂载组件后触发父组件按钮，检查实际焦点；卸载后检查引用清理。方法读取 props 时，再更新 props 后调用，确认使用的是新值。

## 面试速记卡

> - 作用：定制父组件通过 ref 拿到的公开句柄。
> - 分工：父组件调用有限方法，子组件保留内部 DOM。
> - 数据关系：状态优先用 props／state，动作按需使用句柄。
> - 闭包边界：读取响应式值的方法要正确声明依赖。
> - 版本差异：React 19 使用 ref prop，旧版本使用 forwardRef。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **端点 · 前端 · 原帖未明确批次**：React 父组件怎样获取子组件的引用，useImperativeHandle 如何使用？（题意整理）。[面经来源](https://www.nowcoder.com/feed/main/detail/1df5be8aea734dcc980c3b9ef7ccb7c7)；原帖发布于 2024-10-30。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
