# 字节前端面试真题及答案 · Sunday面试指南

[全部公司真题](./README.md) · [在线阅读](https://note.lgdsunday.club/companies/bytedance/frontend/)

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

## 前端面试题

- [JavaScript 事件循环是什么？宏任务、微任务和 async/await 怎么执行？](../frontend/q104-js-event-loop.md)
  浏览器中的 JavaScript，通常先执行当前任务里的同步代码。当前调用栈清空后，会在微任务检查点处理排队的微任务，随后浏览器才有机会渲染、选择下一项任务。Promise 的后续回调和 await 后面的继续执行，通常进入微任务队列；
- [HTTP 强缓存和协商缓存有什么区别？Cache-Control、ETag 和 304 怎么配合？](../frontend/q105-http-browser-cache.md)
  强缓存是浏览器在缓存仍然新鲜时，直接复用已有响应，不需要为了这个资源向服务器验证。常用 Cache-Control: max-age 指定新鲜期。协商缓存是在需要验证时，带着资源标识询问服务器。
- [JavaScript 原型链是什么？new 和继承是怎么实现的？](../frontend/q116-prototype-chain-new.md)
  原型链就是 JavaScript 查找对象属性的一条路径。先查对象自己的属性，没有找到，再查它的原型，继续往上找，直到原型为 null。用 new 创建实例时，实例通常会连接到构造函数的 prototype 对象。
- [Promise.all、allSettled、race、any 有什么区别？失败后其他任务会停止吗？](../frontend/q120-promise-concurrency-methods.md)
  Promise.all 要求全部成功，只要有一个失败，聚合结果就会失败。适合几个结果缺一不可的情况，例如页面必须同时拿到配置和权限。allSettled 会等所有任务有结果，再分别给出成功或失败，适合允许局部失败、需要完整报告的批量处理。
- [TypeScript 的 any、unknown、never 有什么区别？](../frontend/q123-any-unknown-never.md)
  any 允许咱们按需要访问属性、调用方法，编译器会放宽相关检查。这在迁移旧代码时有时方便，但错误也可能一路传到后面的代码。unknown 同样可以接收各种值，但使用前要先判断它是什么。
- [React Fiber 是什么？为什么渲染可以暂停和继续？](../frontend/q136-react-fiber.md)
  Fiber 可以理解成 React 用来表示组件及其渲染工作的一种内部结构。React 不再只依赖一次递归调用走完整棵树，而是能记录工作进度，并在合适的工作单元边界调度后续计算。
- [pnpm 和 npm 有什么区别？lockfile 为什么应该提交？](../frontend/q150-pnpm-lockfile.md)
  pnpm 使用内容寻址存储复用包文件，再通过项目中的虚拟存储和链接组织依赖关系。不同项目可以复用内容，但各自仍有自己的依赖图和版本组合。lockfile 记录依赖解析结果和相关信息，让后续安装更可复现。
- [React 错误边界 Error Boundary 是什么？为什么捕获不到所有错误？](../frontend/q294-react-error-boundary.md)
  Error Boundary 是包住部分 React 子组件树的特殊组件。当子组件在渲染等受支持的阶段抛错时，它可以显示 fallback，避免这个区域的故障直接破坏整个页面。
- [React 的 useLayoutEffect 和 useEffect 有什么区别？什么时候需要在绘制前测量 DOM？](../frontend/q301-uselayouteffect-vs-useeffect.md)
  React 的 useLayoutEffect 和 useEffect 有什么区别？什么时候需要在绘制前测量 DOM？只有必须在显示前测量并纠正布局，才值得阻挡绘制。讲清两者在绘制时机上的差别。

## 计算机基础面试题

- [两数之和怎么用哈希表实现？为什么要先查再存，不能重复使用同一个元素？](../cs-basics/q331-two-sum.md)
  两数之和怎么用哈希表实现？为什么要先查再存？每轮只在已经经过的元素里找补数，找到的自然就是另一个位置，也不会重复使用同一个元素。讲清查与存的顺序为何不能颠倒。

