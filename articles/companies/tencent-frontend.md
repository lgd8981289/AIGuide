# 腾讯前端面试真题及答案 · Sunday面试指南

[全部公司真题](./README.md) · [在线阅读](https://note.lgdsunday.club/companies/tencent/frontend/)

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

## 前端面试题

- [JavaScript 事件循环是什么？宏任务、微任务和 async/await 怎么执行？](../frontend/q104-js-event-loop.md)
  浏览器中的 JavaScript，通常先执行当前任务里的同步代码。当前调用栈清空后，会在微任务检查点处理排队的微任务，随后浏览器才有机会渲染、选择下一项任务。Promise 的后续回调和 await 后面的继续执行，通常进入微任务队列；
- [HTTP 强缓存和协商缓存有什么区别？Cache-Control、ETag 和 304 怎么配合？](../frontend/q105-http-browser-cache.md)
  强缓存是浏览器在缓存仍然新鲜时，直接复用已有响应，不需要为了这个资源向服务器验证。常用 Cache-Control: max-age 指定新鲜期。协商缓存是在需要验证时，带着资源标识询问服务器。
- [BFC 是什么？为什么能解决浮动塌陷和部分外边距重叠问题？](../frontend/q126-bfc-block-formatting-context.md)
  BFC 是普通块布局中的一个独立格式化区域。理解它时，我会先看容器内部和外部哪些布局关系被隔开。建立 BFC 的容器在计算自动高度时会包含内部浮动，内部子元素的外边距也不会与这个容器的外边距合并。
- [JavaScript 数组去重有哪些方法？为什么 Set 去不掉内容相同的对象？](../frontend/q298-array-dedup-business-key.md)
  JavaScript 数组去重有哪些方法？为什么 Set 去不掉内容相同的对象？先定义什么叫重复，再决定用值、引用还是业务键去重。讲清各种方法的适用条件与代价。

