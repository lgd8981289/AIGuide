# React 错误边界 Error Boundary 是什么？为什么捕获不到所有错误？

[字节前端面试真题](../companies/bytedance-frontend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q294-react-error-boundary/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：React 错误边界能解决什么问题？

🙋‍♂️ 我：可以捕获错误，避免整个页面白屏。

🧑‍💻 面试官：按钮点击回调抛异常，它一定能捕获吗？

🙋‍♂️ 我：普通事件回调不在捕获范围。

🧑‍💻 面试官：商品卡片渲染出错，导航还要继续用，边界放在哪里？用户点击重试以后，为什么又立刻报错？

> 错误边界负责「隔离一片渲染故障」。降级界面能留下来，不等于导致故障的数据已经修好。

## 面试速答（60 秒版）

Error Boundary 是包住部分 React 子组件树的特殊组件。当子组件在渲染等受支持的阶段抛错时，它可以显示 fallback，避免这个区域的故障直接破坏整个页面。

类组件可以通过 getDerivedStateFromError 更新降级状态，并用 componentDidCatch 记录错误。它保护的是子树，不捕获自身错误，也不能当作所有事件和普通异步回调的全局 try/catch。

实际项目应按可以独立降级的功能区域放边界，并给用户可理解的提示和恢复路径。重试前还要修复数据、重新请求或调整状态；单纯清掉边界错误状态，坏数据仍在时会再次失败。

捕获范围还要看当前 React 版本。现代文档说明 useTransition 返回的 startTransition 中的相关错误可以被边界捕获，不能机械说“所有异步都不行”。

![Q294 面试速答总览：已目视核对技术关系；概念图不是实测结果。](https://note.lgdsunday.club/img/Q294/01-overview.webp)

## 知识点详解：商品列表出错，怎样让其他页面内容继续工作？

### 边界应该包住一个能够独立降级的区域

咱们假设页面包含导航、商品列表和购物车。商品列表由于数据结构异常，在渲染时抛错。

如果只在整个应用外面放一个边界，可能只剩一个全页错误提示。如果在列表外面设置区域边界，就可以让列表显示“暂时无法加载”，导航和其他可独立工作的区域继续存在。

也不能每个 span 都放一个边界。边界需要有独立的降级意义、提示和恢复动作。划分依据是故障影响与用户还能完成什么，而不是组件数量。

### 用一个最小边界，分清降级和日志

TypeScript / React：

```tsx
import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { failed: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("子树渲染失败", error, info.componentStack);
  }

  render() {
    return this.state.failed
      ? <p role="alert">这个区域暂时无法显示，请稍后重试。</p>
      : this.props.children;
  }
}
```

getDerivedStateFromError 让下一次渲染进入 fallback；componentDidCatch 可以记录错误和组件栈。示例用 console 演示记录位置，真实项目还需要合适的日志服务和敏感数据处理。

这个最小实现没有提供一套完整重试按钮，因为重试需要结合父层数据恢复设计。错误边界目前也没有一个内置函数组件 Hook 能直接替代这些生命周期；可以使用经过核验的封装库。

Python 没有 React 的相同运行时，不提供一个异常捕获装饰器冒充对应实现。

### 哪些错误不在这个保护范围里？

子树渲染、相关生命周期等错误，是错误边界关注的范围。普通事件处理函数、普通 setTimeout 等异步回调、服务端渲染，以及边界自身抛出的错误，不按这一套自动捕获。

因此，点击提交以后请求失败，通常应该在请求和交互逻辑中处理，把失败转成合理状态。不要指望边界把普通网络 Promise 的拒绝都收走。

同时，当前 [React 官方文档](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary) 明确列出例外：useTransition 返回的 startTransition，其 transition 函数中的错误可由错误边界捕获。旧版“异步都抓不到”少了这个条件。

如果希望把某些异步错误转交边界，也需要明确设计转换方式，不是拿到任何错误对象以后都自动生效。捕获范围与普通失败状态应分别处理。

![Q294 知识点示意：已目视核对技术关系；概念图不是实测结果。](https://note.lgdsunday.club/img/Q294/02-coverage.webp)

### 重置边界，不等于修复根因

假设商品数据缺少必要字段，组件每次渲染都会抛错。清掉 failed 以后，它再次渲染相同坏数据，自然又进入 fallback。

有用的重试需要先完成至少一个动作：重新获取有效数据，清理损坏状态，切换到安全输入，或者让父组件建立新的正确上下文，再重置或重新挂载边界。

日志还应能对上请求和页面状态，帮助定位哪个组件、什么数据或版本触发错误。fallback 上线以后仍要统计原始故障，不能因为页面不白屏就认为系统健康。

![Q294 知识点示意：已目视核对技术关系；概念图不是实测结果。](https://note.lgdsunday.club/img/Q294/03-recovery.webp)

## 面试官继续追问

**try/catch 包住 JSX，能代替错误边界吗？**

JSX 表达式建立的是元素描述，子组件真正渲染可能由 React 在后续执行。普通外层 try/catch 不能替代对子树渲染过程的保护。

**fallback 自己也报错怎么办？**

当前边界不能保护自己的错误，需要由更外层边界等方式处理。fallback 应尽量简单、少依赖已经出错的对象和复杂组件。

## 面试速记卡

> - 目标：隔离子组件树的渲染故障，显示 fallback。
> - 实现：getDerivedStateFromError 改降级状态，componentDidCatch 记录错误。
> - 常见排除：普通事件、普通异步回调、SSR、边界自身错误。
> - 版本例外：当前 useTransition 的 startTransition 错误可进入边界。
> - 放置：按能独立降级的功能区域，不是只放全页或每个小节点。
> - 恢复：先处理原因，再重置边界，避免立即再次失败。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **字节跳动 · 前端 · 社招**：React 错误边界能捕获哪些错误？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/786037843704479744)；原帖编辑于 2025-09-01。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
