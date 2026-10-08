# 阿里前端面试真题及答案 · Sunday面试指南

[全部公司真题](./README.md) · [在线阅读](https://note.lgdsunday.club/companies/alibaba/frontend/)

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

## 前端面试题

- [JavaScript 事件循环是什么？宏任务、微任务和 async/await 怎么执行？](../frontend/q104-js-event-loop.md)
  浏览器中的 JavaScript，通常先执行当前任务里的同步代码。当前调用栈清空后，会在微任务检查点处理排队的微任务，随后浏览器才有机会渲染、选择下一项任务。Promise 的后续回调和 await 后面的继续执行，通常进入微任务队列；
- [JavaScript 闭包是什么？为什么变量没有被释放，什么时候会内存泄漏？](../frontend/q110-js-closure-memory.md)
  闭包是函数与它所处词法环境的组合，使函数能够访问定义位置外层的变量。外层函数返回以后，只要相关函数及环境仍然可达，需要的变量就可能继续存在。闭包不是把当时所有变量都拍成一份快照。多个函数可以共享同一个变量，读取时看到后续修改；
- [从输入 URL 到页面显示，浏览器到底经历了什么？](../frontend/q129-browser-navigation-rendering.md)
  浏览器先解析 URL，确定导航目标，再按缓存、已有连接和协议情况获取页面。需要时进行域名解析与连接建立；HTTPS 还涉及安全握手，但不能把每次导航都说成重新走完整 TCP 流程，HTTP/3 也不使用 TCP。

## 计算机基础面试题

- [HTTP/1.1、HTTP/2、HTTP/3 有什么区别？队头阻塞是怎么解决的？](../cs-basics/q190-http-versions.md)
  HTTP/1.1 支持连接复用，但同连接的流水线响应仍受顺序限制，实践中常用多连接并发。HTTP/2 使用二进制帧和流，让多个请求在一个连接上交错传输，并通过 HPACK 压缩头字段。

