# 网易前端面试真题及答案 · Sunday面试指南

[全部公司真题](./README.md) · [在线阅读](https://note.lgdsunday.club/companies/netease/frontend/)

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

## 前端面试题

- [HTTP 强缓存和协商缓存有什么区别？Cache-Control、ETag 和 304 怎么配合？](../frontend/q105-http-browser-cache.md)
  强缓存是浏览器在缓存仍然新鲜时，直接复用已有响应，不需要为了这个资源向服务器验证。常用 Cache-Control: max-age 指定新鲜期。协商缓存是在需要验证时，带着资源标识询问服务器。
- [浏览器为什么会跨域？CORS 预检请求和携带 Cookie 怎么处理？](../frontend/q107-cors-cross-origin.md)
  同源通常要求协议、主机与端口相同。不同来源之间，浏览器按同源策略和 CORS 规则处理。有些请求可以直接发，但响应需要服务端许可，页面脚本才能读取；另一些先发 OPTIONS 预检，询问来源、方法与请求头是否允许，再发正式请求。
- [CSR、SSR、SSG、ISR 有什么区别？Next.js 项目怎么选？](../frontend/q147-ssr-csr-ssg-isr.md)
  CSR 主要由浏览器执行应用代码生成界面；SSR 在请求处理时生成 HTML；SSG 在构建阶段预生成页面。它们描述的重点是页面内容的生成位置与时机。
- [CSS 伪类和伪元素有什么区别？::before 能代替真正的 HTML 内容吗？](../frontend/q307-css-pseudo-class-element.md)
  CSS 伪类和伪元素有什么区别？::before 能代替真正的 HTML 内容吗？状态选择和局部生成不是一回事，重要内容仍需要真实语义。讲清选择器写法差异与可访问性边界。

## 计算机基础面试题

- [HTTP 常见状态码有哪些？401、403 和 502、503、504 怎么区分？](../cs-basics/q251-http-status-codes.md)
  HTTP 状态码描述本次请求的处理结果与响应语义。1xx 是信息响应，2xx 表示成功处理，3xx 涉及重定向等后续处理，4xx、5xx 分别属于客户端错误和服务端错误类别，但这些分类不是对真实故障责任人的直接判决。

