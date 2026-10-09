# 腾讯前端面试真题及答案 · Sunday面试指南

[全部公司真题](./README.md) · [在线阅读](https://note.lgdsunday.club/companies/tencent/frontend/)

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

## 前端面试题

- [JavaScript 事件循环是什么？宏任务、微任务和 async/await 怎么执行？](../frontend/q104-js-event-loop.md)
  浏览器中的 JavaScript，通常先执行当前任务里的同步代码。当前调用栈清空后，会在微任务检查点处理排队的微任务，随后浏览器才有机会渲染、选择下一项任务。Promise 的后续回调和 await 后面的继续执行，通常进入微任务队列；
- [HTTP 强缓存和协商缓存有什么区别？Cache-Control、ETag 和 304 怎么配合？](../frontend/q105-http-browser-cache.md)
  强缓存是浏览器在缓存仍然新鲜时，直接复用已有响应，不需要为了这个资源向服务器验证。常用 Cache-Control: max-age 指定新鲜期。协商缓存是在需要验证时，带着资源标识询问服务器。
- [浏览器为什么会跨域？CORS 预检请求和携带 Cookie 怎么处理？](../frontend/q107-cors-cross-origin.md)
  同源通常要求协议、主机与端口相同。不同来源之间，浏览器按同源策略和 CORS 规则处理。有些请求可以直接发，但响应需要服务端许可，页面脚本才能读取；另一些先发 OPTIONS 预检，询问来源、方法与请求头是否允许，再发正式请求。
- [JavaScript 闭包是什么？为什么变量没有被释放，什么时候会内存泄漏？](../frontend/q110-js-closure-memory.md)
  闭包是函数与它所处词法环境的组合，使函数能够访问定义位置外层的变量。外层函数返回以后，只要相关函数及环境仍然可达，需要的变量就可能继续存在。闭包不是把当时所有变量都拍成一份快照。多个函数可以共享同一个变量，读取时看到后续修改；
- [XSS 和 CSRF 有什么区别？HttpOnly、SameSite 和 Token 分别防什么？](../frontend/q111-xss-csrf.md)
  XSS 是不可信输入被页面当作可执行内容，攻击者因此获得当前页面里的脚本能力。主要防护是按输出上下文正确编码，富文本使用可靠净化，并避免危险的动态执行入口，CSP 可作为额外防线。
- [JavaScript 原型链是什么？new 和继承是怎么实现的？](../frontend/q116-prototype-chain-new.md)
  原型链就是 JavaScript 查找对象属性的一条路径。先查对象自己的属性，没有找到，再查它的原型，继续往上找，直到原型为 null。用 new 创建实例时，实例通常会连接到构造函数的 prototype 对象。
- [防抖和节流有什么区别？搜索框和滚动事件分别怎么选？](../frontend/q119-debounce-throttle.md)
  防抖会把一段连续触发合并处理。常见的尾部防抖，是每次触发重新计时，等一段时间没有新触发，再执行最后一次。因此，搜索建议、输入校验这类关心最终输入的功能，通常适合防抖。节流则控制执行频率。
- [Promise.all、allSettled、race、any 有什么区别？失败后其他任务会停止吗？](../frontend/q120-promise-concurrency-methods.md)
  Promise.all 要求全部成功，只要有一个失败，聚合结果就会失败。适合几个结果缺一不可的情况，例如页面必须同时拿到配置和权限。allSettled 会等所有任务有结果，再分别给出成功或失败，适合允许局部失败、需要完整报告的批量处理。
- [BFC 是什么？为什么能解决浮动塌陷和部分外边距重叠问题？](../frontend/q126-bfc-block-formatting-context.md)
  BFC 是普通块布局中的一个独立格式化区域。理解它时，我会先看容器内部和外部哪些布局关系被隔开。建立 BFC 的容器在计算自动高度时会包含内部浮动，内部子元素的外边距也不会与这个容器的外边距合并。
- [从输入 URL 到页面显示，浏览器到底经历了什么？](../frontend/q129-browser-navigation-rendering.md)
  浏览器先解析 URL，确定导航目标，再按缓存、已有连接和协议情况获取页面。需要时进行域名解析与连接建立；HTTPS 还涉及安全握手，但不能把每次导航都说成重新走完整 TCP 流程，HTTP/3 也不使用 TCP。
- [事件冒泡、事件捕获和事件委托有什么区别？](../frontend/q130-dom-event-propagation.md)
  DOM 事件通常经历捕获、目标和冒泡三个阶段。捕获阶段沿祖先路径向目标走，支持冒泡的事件再从目标向外传播；目标阶段是监听目标本身的处理。事件委托通常利用冒泡，把一组子元素的处理放在稳定的父元素上。
- [Vue 组件通信有哪些方式？props、emit、provide/inject、Pinia 怎么选？](../frontend/q141-vue-component-communication.md)
  父组件向子组件传数据，优先用 props；子组件通知父组件发生了什么，使用 emit。组件事件不会像 DOM 事件一样沿祖先自动冒泡。一组深层组件共享同一个上下文，例如表单、主题或组件库配置，可以用 provide/inject。
- [JavaScript 怎么判断数据类型？typeof、instanceof 和 Array.isArray 有什么区别？](../frontend/q221-js-type-checking.md)
  typeof 适合先判断字符串、数字、布尔值等基本类别，但它不能细分普通对象、数组和日期，null 的结果也是 object，函数则返回 function。instanceof 通常沿原型链检查一个对象是否与指定构造器关联。
- [Promise 的 then、catch、finally 怎么传递结果？为什么漏写 return 会出错？](../frontend/q247-promise-chaining.md)
  then 每次返回一个新的 Promise。这个新 Promise 的结果，主要由回调的执行结果决定，不是原来的 Promise 被反复修改。回调返回普通值，后面得到这个值；
- [Vue 3 生命周期有哪些？父子组件的执行顺序是什么？](../frontend/q256-vue-lifecycle-parent-child.md)
  Vue 的生命周期，就是一个组件从创建、挂载、更新到卸载的过程。生命周期钩子让咱们在这些阶段安排工作，例如挂载后访问 DOM，卸载时清理计时器和事件订阅。
- [JavaScript 的 for...in 和 for...of 有什么区别？为什么普通对象不能直接 for...of？](../frontend/q271-for-in-vs-for-of.md)
  for...in 枚举对象的可枚举字符串属性名，既可能有自有属性，也可能包含继承属性；它不会直接给出属性值，也不会枚举 Symbol 键。for...of 则使用迭代协议，从可迭代对象里依次取值。
- [JavaScript 的 map 和 forEach 有什么区别？为什么不能直接用 forEach 等待异步任务？](../frontend/q280-map-foreach-async.md)
  map 用于把每个元素转换成结果，再收集成一个新数组。forEach 主要用于逐项执行操作，返回值是 undefined，不收集回调的结果。两者都会调用回调，但都不会自动等待 async 回调完成。
- [script 的 defer 和 async 有什么区别？会影响执行顺序和 DOMContentLoaded 吗？](../frontend/q296-defer-vs-async.md)
  script 的 defer 和 async 有什么区别？会影响执行顺序和 DOMContentLoaded 吗？下载可以并行，执行时机与依赖顺序仍要分别安排。讲清两种属性下执行与事件触发的差异。
- [JavaScript 数组去重有哪些方法？为什么 Set 去不掉内容相同的对象？](../frontend/q298-array-dedup-business-key.md)
  JavaScript 数组去重有哪些方法？为什么 Set 去不掉内容相同的对象？先定义什么叫重复，再决定用值、引用还是业务键去重。讲清各种方法的适用条件与代价。
- [Fetch 和 Axios 有什么区别？为什么遇到 404 时处理方式不同？](../frontend/q465-fetch-vs-axios-error-handling.md)
  解释 Fetch 和 Axios 在 404、500 时的默认错误语义，区分网络、HTTP、JSON 解析和业务失败，提供 TS Fetch 与 Python httpx 示例及取消、重试边界。
- [JavaScript 垃圾回收怎么工作？标记清除为什么能处理循环引用？](../frontend/q467-javascript-garbage-collection.md)
  通过对象引用环和窗口监听器解释 JavaScript 垃圾回收，讲清可达性、标记清除、闭包与内存泄漏，提供堆快照和保留路径的排查思路。

## 计算机基础面试题

- [TCP 为什么要三次握手、四次挥手？TIME_WAIT 有什么作用？](../cs-basics/q092-tcp-handshake-termination.md)
  TCP 三次握手的核心，是同步双方初始序号，并确认各自发送的 SYN 已经被对方收到。客户端先发 SYN，服务端用 SYN 加 ACK 既确认客户端，又提出自己的序号，客户端再发 ACK 确认服务端。
- [HTTP 和 HTTPS 有什么区别？TLS 怎样防止窃听、篡改和冒充？](../cs-basics/q093-https-tls.md)
  HTTP 定义请求和响应的语义，HTTPS 通常指通过 TLS 保护的 HTTP 通信。HTTP/3 使用 QUIC，而 QUIC 也集成了 TLS 1.3 的安全机制。TLS 主要处理保密性、完整性和身份验证。
- [TCP 和 UDP 有什么区别？实时通信为什么不总是选择 TCP？](../cs-basics/q191-tcp-vs-udp.md)
  TCP 提供面向连接、可靠有序的字节流。应用要自己定义消息边界，不能假设一次 write 就对应对方一次 read。UDP 发送数据报，保留数据报边界，但不提供 TCP 那样的顺序、重传与连接级可靠交付保证。
- [LRU 缓存怎么实现？为什么通常需要哈希表加双向链表？](../cs-basics/q201-lru-cache.md)
  LRU 淘汰最近最少使用的条目。命中读取和写入都要更新最近使用位置，容量超限时删除最久未使用的条目。经典结构是哈希表加双向链表：表定位节点，链表移动节点和删除尾部，在常见哈希假设下实现平均 O(1) 的 get、put。
- [如何判断括号字符串是否合法？为什么要用栈？](../cs-basics/q359-valid-parentheses.md)
  如何判断括号字符串是否合法？为什么要用栈？右括号必须匹配最近一个尚未关闭的左括号，扫描结束也不能留下未关闭项。讲清匹配规则与容易被忽略的边界情况。

## 系统设计面试题

- [CDN 是什么？回源、缓存刷新和缓存命中率应该怎么理解？](../fullstack-system-design/q212-cdn-cache-origin.md)
  CDN 通过边缘节点分发内容，缓存命中时减少回源访问与传输距离，但不保证所有用户物理最近或所有请求都缓存。缓存键决定哪些请求共用表示，可能涉及路径、查询参数、请求头和 Cookie 等策略。

