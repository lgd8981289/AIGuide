# 百度前端面试真题及答案 · Sunday面试指南

[全部公司真题](./README.md) · [在线阅读](https://note.lgdsunday.club/companies/baidu/frontend/)

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

## 前端面试题

- [JavaScript 事件循环是什么？宏任务、微任务和 async/await 怎么执行？](../frontend/q104-js-event-loop.md)
  浏览器中的 JavaScript，通常先执行当前任务里的同步代码。当前调用栈清空后，会在微任务检查点处理排队的微任务，随后浏览器才有机会渲染、选择下一项任务。Promise 的后续回调和 await 后面的继续执行，通常进入微任务队列；
- [HTTP 强缓存和协商缓存有什么区别？Cache-Control、ETag 和 304 怎么配合？](../frontend/q105-http-browser-cache.md)
  强缓存是浏览器在缓存仍然新鲜时，直接复用已有响应，不需要为了这个资源向服务器验证。常用 Cache-Control: max-age 指定新鲜期。协商缓存是在需要验证时，带着资源标识询问服务器。
- [JavaScript 闭包是什么？为什么变量没有被释放，什么时候会内存泄漏？](../frontend/q110-js-closure-memory.md)
  闭包是函数与它所处词法环境的组合，使函数能够访问定义位置外层的变量。外层函数返回以后，只要相关函数及环境仍然可达，需要的变量就可能继续存在。闭包不是把当时所有变量都拍成一份快照。多个函数可以共享同一个变量，读取时看到后续修改；
- [XSS 和 CSRF 有什么区别？HttpOnly、SameSite 和 Token 分别防什么？](../frontend/q111-xss-csrf.md)
  XSS 是不可信输入被页面当作可执行内容，攻击者因此获得当前页面里的脚本能力。主要防护是按输出上下文正确编码，富文本使用可靠净化，并避免危险的动态执行入口，CSP 可作为额外防线。
- [JavaScript 原型链是什么？new 和继承是怎么实现的？](../frontend/q116-prototype-chain-new.md)
  原型链就是 JavaScript 查找对象属性的一条路径。先查对象自己的属性，没有找到，再查它的原型，继续往上找，直到原型为 null。用 new 创建实例时，实例通常会连接到构造函数的 prototype 对象。
- [JavaScript 的 this 指向谁？箭头函数、call、apply、bind 有什么区别？](../frontend/q117-this-binding.md)
  JavaScript 的普通函数，this 通常由调用方式决定。以 obj.run() 调用时，obj 是接收对象；把 run 单独拿出来调用，就不会自动记住原来的 obj。
- [防抖和节流有什么区别？搜索框和滚动事件分别怎么选？](../frontend/q119-debounce-throttle.md)
  防抖会把一段连续触发合并处理。常见的尾部防抖，是每次触发重新计时，等一段时间没有新触发，再执行最后一次。因此，搜索建议、输入校验这类关心最终输入的功能，通常适合防抖。节流则控制执行频率。
- [从输入 URL 到页面显示，浏览器到底经历了什么？](../frontend/q129-browser-navigation-rendering.md)
  浏览器先解析 URL，确定导航目标，再按缓存、已有连接和协议情况获取页面。需要时进行域名解析与连接建立；HTTPS 还涉及安全握手，但不能把每次导航都说成重新走完整 TCP 流程，HTTP/3 也不使用 TCP。
- [Vue Router 的 hash 和 history 模式有什么区别？刷新为什么会 404？](../frontend/q143-vue-router-modes.md)
  hash 模式把前端路由放在后面，这一部分不会随 HTTP 请求发送到服务器，所以静态服务器通常只需要提供入口页面。history 模式使用正常的路径。
- [CSR、SSR、SSG、ISR 有什么区别？Next.js 项目怎么选？](../frontend/q147-ssr-csr-ssg-isr.md)
  CSR 主要由浏览器执行应用代码生成界面；SSR 在请求处理时生成 HTML；SSG 在构建阶段预生成页面。它们描述的重点是页面内容的生成位置与时机。
- [虚拟列表是什么？几万条数据怎样做到滚动不卡顿？](../frontend/q149-virtual-list.md)
  虚拟列表只渲染可见区域附近的少量行，同时用占位空间保留整份列表的滚动范围。用户滚动时，根据位置更新要渲染的数据区间和偏移量。
- [CSS 定位有哪些方式？absolute、fixed 和 sticky 有什么区别？](../frontend/q233-css-position-containing-block.md)
  CSS 常见定位值包括 static、relative、absolute、fixed 和 sticky。static 参与普通布局，定位偏移不按定位方式生效。relative 保留原本的布局位置，再相对正常位置偏移。
- [var、let、const 有什么区别？暂时性死区和变量提升怎么理解？](../frontend/q236-var-let-const-tdz.md)
  var、let、const 的区别，主要看作用域、初始化时机和能不能重新赋值。var 通常以函数为作用域，普通 if、for 代码块不会单独限制它。进入相应作用域时，var 绑定已经初始化为 undefined；

## 计算机基础面试题

- [HTTP 和 HTTPS 有什么区别？TLS 怎样防止窃听、篡改和冒充？](../cs-basics/q093-https-tls.md)
  HTTP 定义请求和响应的语义，HTTPS 通常指通过 TLS 保护的 HTTP 通信。HTTP/3 使用 QUIC，而 QUIC 也集成了 TLS 1.3 的安全机制。TLS 主要处理保密性、完整性和身份验证。
- [HTTP 常见状态码有哪些？401、403 和 502、503、504 怎么区分？](../cs-basics/q251-http-status-codes.md)
  HTTP 状态码描述本次请求的处理结果与响应语义。1xx 是信息响应，2xx 表示成功处理，3xx 涉及重定向等后续处理，4xx、5xx 分别属于客户端错误和服务端错误类别，但这些分类不是对真实故障责任人的直接判决。

