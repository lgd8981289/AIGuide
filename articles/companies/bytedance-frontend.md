# 字节前端面试真题及答案 · Sunday面试指南

[全部公司真题](./README.md) · [在线阅读](https://note.lgdsunday.club/companies/bytedance/frontend/)

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

## 前端面试题

- [JavaScript 事件循环是什么？宏任务、微任务和 async/await 怎么执行？](../frontend/q104-js-event-loop.md)
  浏览器中的 JavaScript，通常先执行当前任务里的同步代码。当前调用栈清空后，会在微任务检查点处理排队的微任务，随后浏览器才有机会渲染、选择下一项任务。Promise 的后续回调和 await 后面的继续执行，通常进入微任务队列；
- [HTTP 强缓存和协商缓存有什么区别？Cache-Control、ETag 和 304 怎么配合？](../frontend/q105-http-browser-cache.md)
  强缓存是浏览器在缓存仍然新鲜时，直接复用已有响应，不需要为了这个资源向服务器验证。常用 Cache-Control: max-age 指定新鲜期。协商缓存是在需要验证时，带着资源标识询问服务器。
- [React 的 useEffect 怎么工作？依赖数组、清理函数和重复执行如何理解？](../frontend/q108-react-useeffect.md)
  useEffect 用来让组件与外部系统保持同步，比如建立连接、订阅事件或管理浏览器资源，不是把所有渲染后的逻辑都装进去。组件提交后，React 根据依赖决定是否运行 Effect。
- [Vue 3 响应式原理是什么？Proxy、ref 和 reactive 有什么区别？](../frontend/q109-vue3-reactivity.md)
  Vue 3 的 reactive 为对象创建响应式代理。依赖执行时读取属性，系统记录这段逻辑依赖哪个属性；属性改变后，再通知相关依赖更新。Proxy 负责拦截操作，依赖收集和触发机制负责建立对应关系。
- [XSS 和 CSRF 有什么区别？HttpOnly、SameSite 和 Token 分别防什么？](../frontend/q111-xss-csrf.md)
  XSS 是不可信输入被页面当作可执行内容，攻击者因此获得当前页面里的脚本能力。主要防护是按输出上下文正确编码，富文本使用可靠净化，并避免危险的动态执行入口，CSP 可作为额外防线。
- [JavaScript 原型链是什么？new 和继承是怎么实现的？](../frontend/q116-prototype-chain-new.md)
  原型链就是 JavaScript 查找对象属性的一条路径。先查对象自己的属性，没有找到，再查它的原型，继续往上找，直到原型为 null。用 new 创建实例时，实例通常会连接到构造函数的 prototype 对象。
- [防抖和节流有什么区别？搜索框和滚动事件分别怎么选？](../frontend/q119-debounce-throttle.md)
  防抖会把一段连续触发合并处理。常见的尾部防抖，是每次触发重新计时，等一段时间没有新触发，再执行最后一次。因此，搜索建议、输入校验这类关心最终输入的功能，通常适合防抖。节流则控制执行频率。
- [Promise.all、allSettled、race、any 有什么区别？失败后其他任务会停止吗？](../frontend/q120-promise-concurrency-methods.md)
  Promise.all 要求全部成功，只要有一个失败，聚合结果就会失败。适合几个结果缺一不可的情况，例如页面必须同时拿到配置和权限。allSettled 会等所有任务有结果，再分别给出成功或失败，适合允许局部失败、需要完整报告的批量处理。
- [ES Module 和 CommonJS 有什么区别？循环依赖时会发生什么？](../frontend/q121-esm-vs-commonjs.md)
  ES Module 通过 import/export 表达模块依赖，导入通常与导出的绑定相连。CommonJS 则通过 require 执行模块并取得 module.exports，可以在运行过程中按条件加载。
- [TypeScript 的 any、unknown、never 有什么区别？](../frontend/q123-any-unknown-never.md)
  any 允许咱们按需要访问属性、调用方法，编译器会放宽相关检查。这在迁移旧代码时有时方便，但错误也可能一路传到后面的代码。unknown 同样可以接收各种值，但使用前要先判断它是什么。
- [BFC 是什么？为什么能解决浮动塌陷和部分外边距重叠问题？](../frontend/q126-bfc-block-formatting-context.md)
  BFC 是普通块布局中的一个独立格式化区域。理解它时，我会先看容器内部和外部哪些布局关系被隔开。建立 BFC 的容器在计算自动高度时会包含内部浮动，内部子元素的外边距也不会与这个容器的外边距合并。
- [React Fiber 是什么？为什么渲染可以暂停和继续？](../frontend/q136-react-fiber.md)
  Fiber 可以理解成 React 用来表示组件及其渲染工作的一种内部结构。React 不再只依赖一次递归调用走完整棵树，而是能记录工作进度，并在合适的工作单元边界调度后续计算。
- [Tree Shaking 是什么？为什么没用到的代码仍然进了包？](../frontend/q145-tree-shaking.md)
  Tree Shaking 是根据模块依赖和导出使用情况，移除可以安全删除的代码。ESM 的静态结构更有利于分析，但使用 ESM 并不保证所有无用代码都能删干净。副作用是关键限制。
- [pnpm 和 npm 有什么区别？lockfile 为什么应该提交？](../frontend/q150-pnpm-lockfile.md)
  pnpm 使用内容寻址存储复用包文件，再通过项目中的虚拟存储和链接组织依赖关系。不同项目可以复用内容，但各自仍有自己的依赖图和版本组合。lockfile 记录依赖解析结果和相关信息，让后续安装更可复现。
- [JavaScript 怎么判断数据类型？typeof、instanceof 和 Array.isArray 有什么区别？](../frontend/q221-js-type-checking.md)
  typeof 适合先判断字符串、数字、布尔值等基本类别，但它不能细分普通对象、数组和日期，null 的结果也是 object，函数则返回 function。instanceof 通常沿原型链检查一个对象是否与指定构造器关联。
- [Git merge 和 rebase 有什么区别？为什么共享分支要谨慎变基？](../frontend/q234-git-merge-vs-rebase.md)
  merge 把两条历史合到一起。分支已经分叉时，通常建立一个连接两边历史的合并提交；如果可以快进，也可能只是移动指针，不产生新的合并提交。rebase 则把待迁移提交的改动，在新的基点上重新应用。
- [CSS 的 px、em、rem、vw、vh 有什么区别？响应式布局怎么选单位？](../frontend/q283-css-units-responsive.md)
  px 是 CSS 像素，不必等于一个设备物理像素。em 与字号有关：用于 font-size 时，按继承的字号计算；用于 padding 等属性时，通常按元素自身字号计算。rem 则按根元素字号计算。
- [React 合成事件是什么？和原生 DOM 事件有什么区别？](../frontend/q289-react-synthetic-events.md)
  React 合成事件是 React 提供给事件处理函数的事件对象，封装了常用属性与行为，让组件通过 onClick 等声明式接口处理交互，也可以通过 nativeEvent 访问底层原生事件。
- [React 错误边界 Error Boundary 是什么？为什么捕获不到所有错误？](../frontend/q294-react-error-boundary.md)
  Error Boundary 是包住部分 React 子组件树的特殊组件。当子组件在渲染等受支持的阶段抛错时，它可以显示 fallback，避免这个区域的故障直接破坏整个页面。
- [React 的 useLayoutEffect 和 useEffect 有什么区别？什么时候需要在绘制前测量 DOM？](../frontend/q301-uselayouteffect-vs-useeffect.md)
  React 的 useLayoutEffect 和 useEffect 有什么区别？什么时候需要在绘制前测量 DOM？只有必须在显示前测量并纠正布局，才值得阻挡绘制。讲清两者在绘制时机上的差别。
- [CSS 伪类和伪元素有什么区别？::before 能代替真正的 HTML 内容吗？](../frontend/q307-css-pseudo-class-element.md)
  CSS 伪类和伪元素有什么区别？::before 能代替真正的 HTML 内容吗？状态选择和局部生成不是一回事，重要内容仍需要真实语义。讲清选择器写法差异与可访问性边界。
- [React Suspense 是什么？为什么包住组件以后，接口请求仍然没有显示 loading？](../frontend/q341-react-suspense.md)
  React Suspense 是什么？为什么包住组件以后，接口请求仍然没有显示 loading？Suspense 只响应能让渲染挂起的加载来源，普通 Effect 请求需自行管理状态。讲清两种加载路径的区别。
- [Webpack 的 Loader 和 Plugin 有什么区别？分别在构建的哪一步执行？](../frontend/q463-webpack-loader-vs-plugin.md)
  沿着模块转换与构建生命周期解释 Webpack Loader 和 Plugin 的区别，说明普通 Loader 顺序、pitch 边界及 Plugin 钩子，纠正常见执行顺序误解。
- [Babel 是怎么把新语法转成旧语法的？为什么还需要 Polyfill？](../frontend/q464-babel-transformation-polyfill.md)
  解释 Babel 的解析、AST 转换与代码生成，区分语法兼容、辅助函数和 Polyfill，说明 preset-env、core-js 配置及应用与库的不同兼容责任。
- [JavaScript 函数柯里化是什么？如何实现支持多次传参的 curry？](../frontend/q466-javascript-currying.md)
  用 TS 与 Python 实现固定参数数量的 curry，解释闭包、分支复用、默认参数、function.length、this 和占位符边界，并区分柯里化与偏函数应用。

## 后端面试题

- [JWT 和 Session 有什么区别？Cookie 在登录认证中负责什么？](../backend/q106-jwt-vs-session.md)
  Session 方案通常在服务端保存会话状态，浏览器携带会话标识，服务端查到有效记录以后才接受身份。JWT 是一种 Token 格式。常见签名 JWT 携带声明，服务端验证签名、过期时间、签发方和目标接收方等条件后才能接受。
- [Node.js 如何利用多核？worker_threads、cluster、child_process 怎么选？](../backend/q152-node-multicore-concurrency.md)
  Node.js 常见应用主线程上的 JavaScript 执行是单线程，但整个运行时不只有一条线程。异步 I/O、底层线程池和应用 JavaScript 的执行要分开理解。多进程或多个服务副本可以承接更多请求，并提供进程隔离。
- [Express 和 Koa 的中间件有什么区别？洋葱模型是怎么执行的？](../backend/q160-express-vs-koa-middleware.md)
  Express 和 Koa 都用中间件组织请求处理，但 next 的约定不同。Express 调用 next()，把处理交给后面的中间件。
- [REST、GraphQL 和 gRPC 有什么区别？接口设计应该怎么选？](../backend/q165-rest-graphql-grpc.md)
  这三者不是同一层面的三种数据格式。REST 是一组架构约束，常见 HTTP 资源接口用资源、方法和状态表达操作；GraphQL 用类型化 Schema 描述数据，让客户端选择字段；
- [SQL 注入是什么？为什么参数化查询能防注入，拼接排序字段却仍有风险？](../backend/q232-sql-injection-parameterized.md)
  SQL 注入为什么能生效？参数化查询把输入挡在语法结构之外，那动态排序字段为什么仍有风险？讲清预编译的边界与白名单兜底方式。
- [JWT 无感刷新怎么实现？多个请求同时 401 怎么办？](../backend/q376-jwt-refresh-token-concurrency.md)
  解释 JWT 无感刷新、并发 401 和晚到旧请求的处理方法，区分凭据失效与网络故障，并说明写请求重试的幂等边界。
- [N+1 查询是什么？为什么一个列表接口会执行上百次 SQL？](../backend/q379-orm-n-plus-one-query.md)
  解释 ORM 的 N+1 查询如何产生，比较 JOIN、批量查询与 DataLoader，结合查询次数、结果膨胀和分页判断优化方案。
- [单点登录 SSO 怎么实现？不同域名的网站如何共享登录状态？](../backend/q398-sso-cross-domain-login.md)
  从 Cookie 域边界解释 SSO 与 OIDC 跳转、授权码兑换和会话建立，说明应用验证要求及单点退出为什么不自动成立。

## 计算机基础面试题

- [HTTP 和 HTTPS 有什么区别？TLS 怎样防止窃听、篡改和冒充？](../cs-basics/q093-https-tls.md)
  HTTP 定义请求和响应的语义，HTTPS 通常指通过 TLS 保护的 HTTP 通信。HTTP/3 使用 QUIC，而 QUIC 也集成了 TLS 1.3 的安全机制。TLS 主要处理保密性、完整性和身份验证。
- [HTTP/1.1、HTTP/2、HTTP/3 有什么区别？队头阻塞是怎么解决的？](../cs-basics/q190-http-versions.md)
  HTTP/1.1 支持连接复用，但同连接的流水线响应仍受顺序限制，实践中常用多连接并发。HTTP/2 使用二进制帧和流，让多个请求在一个连接上交错传输，并通过 HPACK 压缩头字段。
- [DNS 解析过程是什么？递归查询、迭代查询和 DNS 缓存有什么区别？](../cs-basics/q193-dns-resolution.md)
  DNS 的作用是查询域名对应的记录，不只查询 IP。应用通常先经过本机解析机制，再向配置的递归解析器请求结果。递归查询是把查到答案的责任交给对方；迭代查询是对方给出答案或下一步该问的服务器，查询方继续查。
- [BFS 和 DFS 有什么区别？什么时候能用 BFS 求最短路径？](../cs-basics/q205-bfs-vs-dfs.md)
  BFS 按距离起点的层次扩展，常用队列；DFS 沿分支深入再回退，用递归栈或显式栈。邻接表下完整遍历常见复杂度都是 O(V+E)。在无权图或各边等权的情况下，BFS 可以找最少边数的路径；
- [两数之和怎么用哈希表实现？为什么要先查再存，不能重复使用同一个元素？](../cs-basics/q331-two-sum.md)
  两数之和怎么用哈希表实现？为什么要先查再存？每轮只在已经经过的元素里找补数，找到的自然就是另一个位置，也不会重复使用同一个元素。讲清查与存的顺序为何不能颠倒。

