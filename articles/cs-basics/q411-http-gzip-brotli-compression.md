# HTTP 的 gzip 和 Brotli 压缩有什么区别？Accept-Encoding 与 Content-Encoding 怎么配合？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/cs-basics/q411-http-gzip-brotli-compression/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：gzip 和 Brotli 你会怎么选？

🙋‍♂️ 我：Brotli 压得更小，全部用它。

🧑‍💻 面试官：动态响应的 CPU 成本呢？客户端只支持 gzip，缓存却给了它 br 内容，怎么办？

🙋‍♂️ 我：要按请求协商，还得区分缓存版本。

🧑‍💻 面试官：Content-Type: application/json，能说明内容没有压缩吗？图片已经压缩过，还要再压一遍吗？

> 压缩不是只比较文件大小。客户端接受什么、服务端实际发什么、缓存保存哪种表示，必须对得上。

## 面试速答（60 秒版）

gzip 和 Brotli 都可以用于 HTTP 内容压缩，Brotli 的编码名称是 br。Brotli 对许多文本资源能取得较好的压缩率，但实际收益和 CPU 成本取决于内容、压缩级别和是否预压缩。

客户端通过 Accept-Encoding 表明可接受的编码及相应偏好，服务端选择合适方式，再用 Content-Encoding 标明响应实际采用的编码。

Content-Type 仍描述解码后的媒体类型，比如 application/json，不是压缩算法。可缓存响应按 Accept-Encoding 变化时，还要正确处理 Vary 和缓存变体。

静态资源可以在构建时预压缩，动态响应要评估实时压缩成本。已经压缩的媒体、小响应和某些低延迟流式场景，不适合一律开启同样的压缩策略。

![HTTP压缩协商与正确缓存变体](https://note.lgdsunday.club/img/Q411/01-compression-overview.webp)

## 知识点详解：从协商到缓存，压缩后的内容怎样被正确使用？

### 谁先说“我能解开什么”？

客户端发送 Accept-Encoding，列出它可以处理的内容编码。服务端不能只因为 br 文件更小，就把客户端不能接受的编码发过去。

偏好还可以带 q 值，q=0 表示该项不可接受。服务端要按协议与自身可用表示选择，不是永远选请求头里的第一项。

一个协商例子是：

```http
Accept-Encoding: gzip, br
```

服务端若选择 Brotli，响应可以包含：

```http
Content-Type: application/json
Content-Encoding: br
Vary: Accept-Encoding
```

这只是头部关系示意，实际响应体必须真的按 br 编码，不能只加一行声明。[HTTP 内容协商规范](https://www.rfc-editor.org/rfc/rfc9110.html)

### Content-Type 和 Content-Encoding 为什么不冲突？

Content-Type 说明内容是什么，比如 JSON、HTML 或 CSS。Content-Encoding 说明为传输或存储应用了什么内容编码。

客户端先按编码解码，再按媒体类型处理。它们描述的是不同层次，因此 JSON 响应完全可以使用 gzip 或 br。

如果代理又压缩一次，却没有正确处理原有编码声明，客户端可能按错误方式解码。整条 CDN、网关与源站链路都应明确由谁负责压缩。

### 缓存为什么也要参加协商？

假设第一个客户端支持 br，CDN 缓存了压缩响应。第二个客户端只接受 gzip，如果缓存把两种请求当成同一个表示，就可能返回错误编码。

Vary: Accept-Encoding 告诉缓存这个请求头会影响响应选择。实际 CDN 可能还会规范化编码、自动压缩或采用自己的缓存策略，所以应验证配置，不是只写 Vary 就假设所有中间层正确。

如果已有其他 Vary 字段，也不能直接覆盖掉。编码变体的验证标记和资源版本同样要与实际表示匹配。

### 静态预压缩与动态压缩，成本不同

静态 JS、CSS、HTML 可以在构建阶段产生压缩版本，请求时选择已有产物。更高压缩级别的成本可以提前支付。

动态接口每次都要生成内容，再压缩，可能消耗实时 CPU 并增加等待。压缩得更小，不保证用户更早拿到第一段内容。

Brotli 与 gzip 的优劣应按目标内容和级别测试，不能把某个资源的结果推广到所有响应。[MDN HTTP 压缩说明](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Compression)

![静态预压缩与动态实时压缩承担不同CPU成本](https://note.lgdsunday.club/img/Q411/02-static-dynamic-compression.webp)

### 哪些内容不值得再压？

JPEG 等已压缩媒体，通常没有与纯文本同样的压缩收益。很小的响应也可能不值得支付额外开销。

流式输出还要检查压缩缓冲和 flush 行为，避免服务端虽然不断产出内容，客户端却要等到积累一批才看到。

如果响应包含秘密数据和攻击者可控输入，还要评估压缩相关侧信道风险，不能把节省流量当作唯一目标。

## 面试官继续追问

### HTTPS 已经加密，为什么还能压缩？

通常先进行内容编码，再由传输安全层保护数据。内容压缩与加密职责不同，不能把加密后的随机字节当普通文本继续压缩。

### 只看压缩率就能选级别吗？

不能。还要看压缩耗时、吞吐、首字节或首段延迟，以及解码环境。

### 怎样检查配置真的有效？

检查实际响应头和响应体，分别模拟不同 Accept-Encoding，经缓存再次请求，确认编码、变体和解码结果一致。

## 面试速记卡

> - Accept-Encoding：客户端能接受哪些内容编码。
> - Content-Encoding：响应实际使用的编码，必须与体一致。
> - Content-Type：解码后的媒体类型，不是压缩算法。
> - 缓存变体：按协商差异处理 Vary 与 CDN 策略。
> - 选型判断：压缩收益、实时成本、内容类型与流式延迟一起看。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
