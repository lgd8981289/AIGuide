# 小米前端面试真题及答案 · Sunday面试指南

[全部公司真题](./README.md) · [在线阅读](https://note.lgdsunday.club/companies/xiaomi/frontend/)

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

## 前端面试题

- [HTTP 强缓存和协商缓存有什么区别？Cache-Control、ETag 和 304 怎么配合？](../frontend/q105-http-browser-cache.md)
  强缓存是浏览器在缓存仍然新鲜时，直接复用已有响应，不需要为了这个资源向服务器验证。常用 Cache-Control: max-age 指定新鲜期。协商缓存是在需要验证时，带着资源标识询问服务器。
- [浏览器为什么会跨域？CORS 预检请求和携带 Cookie 怎么处理？](../frontend/q107-cors-cross-origin.md)
  同源通常要求协议、主机与端口相同。不同来源之间，浏览器按同源策略和 CORS 规则处理。有些请求可以直接发，但响应需要服务端许可，页面脚本才能读取；另一些先发 OPTIONS 预检，询问来源、方法与请求头是否允许，再发正式请求。
- [JavaScript 闭包是什么？为什么变量没有被释放，什么时候会内存泄漏？](../frontend/q110-js-closure-memory.md)
  闭包是函数与它所处词法环境的组合，使函数能够访问定义位置外层的变量。外层函数返回以后，只要相关函数及环境仍然可达，需要的变量就可能继续存在。闭包不是把当时所有变量都拍成一份快照。多个函数可以共享同一个变量，读取时看到后续修改；
- [JavaScript 原型链是什么？new 和继承是怎么实现的？](../frontend/q116-prototype-chain-new.md)
  原型链就是 JavaScript 查找对象属性的一条路径。先查对象自己的属性，没有找到，再查它的原型，继续往上找，直到原型为 null。用 new 创建实例时，实例通常会连接到构造函数的 prototype 对象。
- [JavaScript 深拷贝和浅拷贝有什么区别？structuredClone 能替代 JSON 拷贝吗？](../frontend/q118-deep-shallow-copy.md)
  浅拷贝会创建新的外层对象，但里面的嵌套对象通常还是原来的引用。因此，修改副本的嵌套数据，可能影响原对象。深拷贝会继续复制内部可复制的数据，让副本和原对象分开。不过，不同方法能处理的类型不同，不能把深拷贝理解成所有对象都能原样复制。
- [CSS 盒模型有什么区别？box-sizing 怎样影响元素宽高？](../frontend/q125-css-box-model.md)
  CSS 盒模型从里到外是 content、padding、border 和 margin。默认的 content-box 把 width 和 height 用在内容区上，内边距和边框要另外加。
- [从输入 URL 到页面显示，浏览器到底经历了什么？](../frontend/q129-browser-navigation-rendering.md)
  浏览器先解析 URL，确定导航目标，再按缓存、已有连接和协议情况获取页面。需要时进行域名解析与连接建立；HTTPS 还涉及安全握手，但不能把每次导航都说成重新走完整 TCP 流程，HTTP/3 也不使用 TCP。
- [Vue 3 的 v-model 是怎么实现的？自定义组件如何支持双向绑定？](../frontend/q140-vue-v-model.md)
  组件上的 v-model 本质上是一个约定：父组件传入 modelValue，子组件需要更新时触发 update:modelValue，父组件再更新自己的状态。
- [Vue 组件通信有哪些方式？props、emit、provide/inject、Pinia 怎么选？](../frontend/q141-vue-component-communication.md)
  父组件向子组件传数据，优先用 props；子组件通知父组件发生了什么，使用 emit。组件事件不会像 DOM 事件一样沿祖先自动冒泡。一组深层组件共享同一个上下文，例如表单、主题或组件库配置，可以用 provide/inject。
- [JavaScript 怎么判断数据类型？typeof、instanceof 和 Array.isArray 有什么区别？](../frontend/q221-js-type-checking.md)
  typeof 适合先判断字符串、数字、布尔值等基本类别，但它不能细分普通对象、数组和日期，null 的结果也是 object，函数则返回 function。instanceof 通常沿原型链检查一个对象是否与指定构造器关联。
- [CSS 定位有哪些方式？absolute、fixed 和 sticky 有什么区别？](../frontend/q233-css-position-containing-block.md)
  CSS 常见定位值包括 static、relative、absolute、fixed 和 sticky。static 参与普通布局，定位偏移不按定位方式生效。relative 保留原本的布局位置，再相对正常位置偏移。
- [Vue 3 生命周期有哪些？父子组件的执行顺序是什么？](../frontend/q256-vue-lifecycle-parent-child.md)
  Vue 的生命周期，就是一个组件从创建、挂载、更新到卸载的过程。生命周期钩子让咱们在这些阶段安排工作，例如挂载后访问 DOM，卸载时清理计时器和事件订阅。

## 计算机基础面试题

- [进程、线程和协程有什么区别？CPU 密集与 I/O 密集任务怎么选？](../cs-basics/q091-process-thread-coroutine.md)
  进程是操作系统中的资源与隔离单位，通常有独立地址空间；同一进程里的线程共享很多资源，各自有执行状态，可以由操作系统调度。协程则通常由语言运行时或库安排。
- [HTTP 和 HTTPS 有什么区别？TLS 怎样防止窃听、篡改和冒充？](../cs-basics/q093-https-tls.md)
  HTTP 定义请求和响应的语义，HTTPS 通常指通过 TLS 保护的 HTTP 通信。HTTP/3 使用 QUIC，而 QUIC 也集成了 TLS 1.3 的安全机制。TLS 主要处理保密性、完整性和身份验证。
- [HTTP/1.1、HTTP/2、HTTP/3 有什么区别？队头阻塞是怎么解决的？](../cs-basics/q190-http-versions.md)
  HTTP/1.1 支持连接复用，但同连接的流水线响应仍受顺序限制，实践中常用多连接并发。HTTP/2 使用二进制帧和流，让多个请求在一个连接上交错传输，并通过 HPACK 压缩头字段。
- [GET 和 POST 有什么区别？安全性、幂等性和参数位置该怎么理解？](../cs-basics/q194-get-vs-post.md)
  GET 的语义是获取目标资源的表示，POST 是让目标资源按自己的规则处理提交的内容。参数放在哪里，不是二者的定义。GET 属于安全、幂等的方法。这里安全指客户端没有请求改变资源状态，不是密码传输安全；
- [OSI 七层模型和 TCP/IP 四层模型有什么区别？一次请求经过哪些层？](../cs-basics/q290-osi-vs-tcpip.md)
  OSI 七层是理解通信职责的参考模型；TCP/IP 四层则更贴近互联网协议体系的组织方式。两者不是两套需要同时逐层运行的机器。常见对应是：OSI 的应用、表示、会话合到 TCP/IP 应用层；传输层对应传输层；网络层对应网际层；
- [死锁产生的四个必要条件是什么？预防、避免和检测有什么区别？](../cs-basics/q328-deadlock-four-conditions.md)
  死锁产生的四个必要条件是什么？预防、避免和检测有什么区别？等待很久不一定就是死锁，关键是资源等待是否形成无法解除的闭环。讲清四个条件如何同时成立、又从哪里打破。

