# React Suspense 是什么？为什么包住组件以后，接口请求仍然没有显示 loading？

[字节前端面试真题](../companies/bytedance-frontend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q341-react-suspense/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：React Suspense 是做什么的？

🙋‍♂️ 我：组件还没加载好时，显示 fallback。

🧑‍💻 面试官：我在组件里用 useEffect 请求接口，外面包了 Suspense，却没显示 loading，为什么？

🙋‍♂️ 我：可能是请求没有让渲染挂起。

🧑‍💻 面试官：那 lazy 加载的组件可以触发，普通请求却不行。你会怎样给图表页面安排加载边界？

> Suspense 等的是「渲染所需要、并且能被 React 感知的加载」，不是自动接管页面里的所有异步任务。

## 面试速答（60 秒版）

Suspense 是 React 的加载边界。当它内部的组件在渲染时，需要一个支持 Suspense 的资源而暂时无法继续，最近的 Suspense 就可以显示 fallback。

例如 lazy 加载组件代码，可以触发这个边界。但普通 useEffect 或事件里发出的接口请求，不会因为外面包了 Suspense，就自动变成这种加载来源。

所以图表页面要分开处理：组件代码可以通过 lazy 和 Suspense 管理；数据请求如果使用普通 Effect，就要自己维护 loading、error 和数据状态。如果使用支持 Suspense 的框架或数据方案，再按它的接入方式处理。

边界也不宜一律包住整页。可以保留已经可用的内容，让真正需要等待的区域单独显示占位。

![Suspense 不接管所有异步请求](https://note.lgdsunday.club/img/Q341/01-overview-v2.webp)

*图：Suspense 不接管所有异步请求。*

## 知识点详解：为什么普通接口请求没有触发 fallback？

### 先看 React 当时在执行哪一步

假设一个页面要加载图表模块，还要读取图表数据。这是两件不同的加载任务。

组件渲染时，如果需要 lazy 导入的代码，而代码还没有准备好，React 知道这次渲染暂时无法完成。它就能找到最近的 Suspense，让这个边界显示 fallback。

而普通 Effect 请求通常发生在组件提交之后。组件已经能完成初次渲染，只是后来开始获取数据。这个请求的 Promise 并没有自动成为 React 渲染需要等待的资源。

因此，包一层 Suspense 并不会把 Effect 里的 fetch 接管过来。官方文档明确区分了这些情况：[Suspense](https://react.dev/reference/react/Suspense)。

### lazy 等待的是组件代码

#### TypeScript

```tsx
import { lazy, Suspense } from "react";
const Chart = lazy(() => import("./Chart"));

export function ReportPage() {
  return (
    <section>
      <h1>数据报告</h1>
      <Suspense fallback={<p>图表模块加载中…</p>}>
        <Chart />
      </Suspense>
    </section>
  );
}
```

示例使用 React 官方 lazy/Suspense API。Python 没有同一套浏览器组件 API。本例的 Chart 模块需要默认导出组件，具体要求见 [lazy 文档](https://react.dev/reference/react/lazy)。

这里的 fallback 解释的是“图表代码还没拿到”。如果 Chart 内部随后用 Effect 获取数据，它仍然需要自己的数据加载状态。不要把这两个等待过程合成一个模糊的“组件加载”。

![渲染等待，与提交后请求分开](https://note.lgdsunday.club/img/Q341/02-timing.webp)

*图：渲染等待，与提交后请求分开。*

### 哪些数据请求可以配合 Suspense？

支持 Suspense 的框架或数据层，会在渲染读取资源时，使用 React 能识别的方式表示“尚未准备好”。React 才能据此挂起渲染。

这个接入过程不是简单地把任意请求函数包进 Suspense。不同框架和数据方案的缓存、错误传播及服务端集成都可能不同，应按各自官方方式使用。

如果项目仍使用普通 Effect 请求，那么明确处理 loading、error 和 success，往往比临时拼出一套不完整的 Suspense 数据缓存更可靠。

### 加载边界，决定哪些内容一起等待

假设页面上方是已经可用的报告说明，下方是需要加载的图表。如果 Suspense 包住整页，一块图表未准备好，可能导致说明区域也一起被占位替换。

把边界放在图表区域，说明就可以保持可读。如果图表里有多个必须同时出现的部分，可以让它们共享边界；如果有互相独立的区域，可以采用嵌套边界逐步展示。

边界不能越碎越好。很多小 loading 同时闪动，也会破坏阅读。我们要按用户认为“应该一起出现”的内容组织，而不只是按组件文件数划分。

![边界决定哪些内容一起等待](https://note.lgdsunday.club/img/Q341/03-boundary-v2.webp)

*图：边界决定哪些内容一起等待。*

## 面试官继续追问

### fallback 能显示接口错误吗？

fallback 主要表示等待。错误需要相应的错误边界或请求错误状态处理。把所有异常都变成一直 loading，会让用户以为还在等。

### 重新加载数据时，一定会把旧内容隐藏吗？

不一定，还要看更新方式、资源接入和边界。Transition 等机制可以帮助保留已经显示的内容。不能把首次加载的行为套到所有更新上。

### Suspense 可以加快网络请求吗？

它主要协调等待期间的展示，不会自动缩短请求耗时。预加载、缓存、并行请求和接口优化，需要另外处理。

## 面试速记卡

> - Suspense：处理 React 能感知的渲染等待。
> - lazy：组件代码加载可以触发边界。
> - 普通 Effect 请求：不会自动触发 Suspense。
> - 边界粒度：按应该一起出现的内容安排。
> - 等待与错误：分别处理，不让错误变成永久 loading。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **字节跳动 · 前端 · 原帖未明确批次**：React Suspense 的作用和实现机制是什么？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353156819747020800)；原帖编辑于 2020-08-24。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
