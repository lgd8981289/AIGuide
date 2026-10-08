# React Server Components 是什么？和 SSR 有什么区别？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q138-react-server-components/) · [题库目录](../../README.md)

<!-- 以下对话为教学模拟，非真实面经。 -->

🧑‍💻 面试官：React Server Components 和 SSR 有什么区别？

🙋‍♂️ 我：它们都在服务器渲染组件，所以可以让首屏更快。

🧑‍💻 面试官：Client Component 在支持 SSR 的框架里，也可能先在服务器生成 HTML 吗？

🙋‍♂️ 我：可以，那服务器生成 HTML 并不代表它就是 Server Component。

🧑‍💻 面试官：对。真正的边界是什么？哪些组件代码发到浏览器，哪些交互代码还需要客户端运行？

> RSC 关注组件执行和代码边界，SSR 关注初始 HTML 在哪里生成；它们可以一起使用。

## 面试速答（60 秒版）

Server Components 在服务端或构建环境中执行，原始组件代码不会作为对应客户端组件代码发送到浏览器，可以在允许的服务端环境中读取数据，再把渲染结果交给后续处理。

SSR 是在服务器生成初始 HTML 的渲染方式，Client Components 也可能参与这个过程，并在浏览器中完成相应 hydration。因此，服务器执行过一次，并不是判断 RSC 的标准。

需要点击、状态和浏览器 API 的部分通常放在 Client Component 边界。跨边界传递的数据必须符合 React 支持的序列化规则，也不能把密钥或敏感结果泄露到输出中。具体路由、缓存和部署行为还要看使用的框架。

![Server Components 管执行与代码边界，SSR 生成初始 HTML，客户端组件随后承担交互](https://note.lgdsunday.club/img/Q138/00-60s-overview.webp)

## 知识点详解：服务器执行过，不等于 Server Component

### 先把执行位置和 HTML 生成分开

假设一个文章页面需要读取文章正文，下面还有收藏按钮。Server Component 可以读取文章并生成相应组件结果，收藏按钮的交互则需要客户端组件。

SSR 可以把这一页的初始内容生成 HTML，让浏览器先收到可显示的结构。客户端组件的 JavaScript 随后加载，接上需要的事件和状态。

所以 RSC 与 SSR 不是两套互斥方案。一个讨论哪些组件在哪个环境执行、哪些代码属于客户端包，另一个讨论初始 HTML 如何生成。不能只看服务器日志出现过某个组件，就认定它是 Server Component。

### Server Component 为什么不用自己的 useState？

Server Component 的这份代码不在浏览器里作为交互组件运行，所以不能依靠自己的 useState、事件处理和 window 来响应用户点击。

有交互需求时，可以把那一小块划为 Client Component，再从服务端部分传入允许的数据或内容。服务端部分仍可以负责数据读取，没必要因为一个按钮，把整页数据逻辑都搬到浏览器。

Client Component 这个名字也不意味着它只在浏览器执行。支持相应 SSR 的框架可能先用它生成初始 HTML，之后再在客户端接管交互。

### use client 是边界，不是给每一个组件贴标签

use client 标记的是模块依赖图中的客户端入口边界，相关导入链会影响客户端打包。不是所有视觉上放在它内部的内容都一定变成客户端代码；服务端内容可以按支持方式作为 children 等传入客户端组件。

use server 又是另一回事，它用于 Server Functions，不是“宣布这是 Server Component”。把两个指令背成一对组件标签，会在追问里很快出问题。

这里讲 React 支持的组件架构，不把 Next.js 的路由缓存规则当成所有 RSC 的固定行为，也不提供不存在的 Python React API。

### 不发代码，不等于不会泄露数据

服务端组件可以让某些依赖和数据库访问代码留在服务端，但返回给浏览器的内容仍会被看到。密钥没有打包进客户端，不代表你把密钥插进渲染结果就安全了。

跨边界的 props 还必须符合 React 支持的序列化类型。不能传任意普通函数和类实例，并假设客户端能原样接到它们；Server Function 引用等受支持机制要单独说明。

选型时还要检查框架支持、数据缓存、网络往返和部署条件。页面包可能变小，但服务端工作、传输数据和等待并不会凭空消失。

验收可检查构建产物、网络中的 HTML 与组件数据、浏览器加载的 JS，再测试按钮和客户端导航。分开这些证据，才能看清 RSC、SSR 和 hydration 分别做了什么。

本题机制参考：[React：Server Components](https://react.dev/reference/rsc/server-components)。

![服务端准备的内容可以传入客户端组件，视觉嵌套不等于所有源码进入客户端](https://note.lgdsunday.club/img/Q138/01-detail.webp)

## 面试官继续追问

### 所有服务端组件都必须每次请求重新跑吗？

不是。可以在构建阶段或请求期间等环境中执行，缓存与重新执行取决于框架和配置，不能把一个框架的默认策略推广到全部。

### RSC 完全不需要 JavaScript 吗？

不能这么说。它减少相关服务端组件代码进入客户端，但架构仍可能需要运行时处理和客户端组件 JS。

### 客户端组件能直接导入服务端密钥吗？

不应该。应维护服务端/客户端边界，使用框架提供的保护方式，并确保敏感值不进入输出或客户端产物。

## 面试速记卡

> - RSC：组件执行与客户端代码边界。
> - SSR：服务器生成初始 HTML，两者可以配合。
> - Client Component：可参与 SSR，也承担浏览器交互。
> - 指令：use client 定入口边界，use server 用于 Server Functions。
> - 安全：不发组件源码，不等于输出数据不可见。

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
