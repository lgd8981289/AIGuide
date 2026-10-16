# HTTP 的 Content-Type 和 Accept 有什么区别？JSON、表单和文件上传如何编码？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/cs-basics/q681-http-content-type-accept/) · [题库目录](../../README.md)

下面是一段模拟面试对话。

🧑‍💻 **面试官：** Content-Type 和 Accept 都写 application/json，是不是一个意思？

🙋‍♂️ **我：** 一个描述当前内容，一个表达希望收到什么。

🧑‍💻 **面试官：** Accept 要 JSON，请求体就一定也是 JSON 吗？

🙋‍♂️ **我：** 不一定，请求体按它自己的 Content-Type 编码。

🧑‍💻 **面试官：** 浏览器用 FormData 上传文件，手动写 multipart/form-data，为什么服务端反而解析失败了？

> 请求里有两条独立信息：我现在发的是什么，我希望你回什么。格式标签还必须和实际字节一致。

## 面试速答（60 秒版）

Content-Type 描述当前表示的媒体类型。请求里它说明请求内容怎样解析，响应里则说明服务端返回的内容是什么。

Accept 表达客户端对响应媒体类型的偏好，可以列多种类型及权重，但不决定当前请求体的编码。请求发 JSON、响应收 JSON 是两个独立选择。

JSON、application/x-www-form-urlencoded 和 multipart/form-data 的字节组织不同。表单编码是键值编码，multipart 通过 boundary 分隔多个部分，适合包含文件和其他字段。

浏览器发送 FormData 时，通常让浏览器同时生成内容和带 boundary 的 Content-Type，不手动写一个缺少边界的标签。服务端也要校验实际内容，不能仅凭请求头相信上传类型。

![Content-Type 和 Accept 各管什么？](https://note.lgdsunday.club/img/Q681/01-http-content-type-accept.webp)

## 知识点详解：头部描述，要能对上正文

### 同一个请求，可以发一种内容、接收另一种内容

例如客户端发送表单字段，接受 JSON 结果。

```http
POST /profile HTTP/1.1
Content-Type: application/x-www-form-urlencoded
Accept: application/json

name=Sunday&city=Shanghai
```

这并不矛盾。Content-Type 是当前请求内容的说明，Accept 是响应偏好。响应到达后，还要看响应自己的 Content-Type，再用适合的方式解析。[RFC 9110 的 Content-Type 定义](https://www.rfc-editor.org/rfc/rfc9110.html#section-8.3)明确了它描述表示的职责。

这里展示的是 HTTP 报文片段，不是完整网络发送程序，也无需再写两份语言调用包装。

### 三种常见编码，不是只换一个头

| 类型                                | 正文的大致组织              | 需要注意                   |
| --------------------------------- | -------------------- | ---------------------- |
| application/json                  | JSON 文本，按 JSON 语法描述值 | 对象不能不序列化就直接当 JSON 字节发送 |
| application/x-www-form-urlencoded | 表单键值及百分号等编码规则        | 同名字段、空值与空格规则要按解析器约定    |
| multipart/form-data               | 多部分内容，用 boundary 分隔  | 边界参数必须与正文一致，文件与字段分别描述  |

给一段 JSON 文本贴表单类型标签，不会自动变成表单。服务端选中了错误解析器，就可能读不到字段或拒绝请求。

反过来，换成 JSON 头，也不会把任意字符串变成合法 JSON。类型、语法和业务字段校验是三道检查。

![三种正文，编码方法不同](https://note.lgdsunday.club/img/Q681/02-http-content-type-accept.webp)

### boundary 为什么不能随便省掉？

multipart 需要知道各部分在哪里开始、在哪里结束。这个分隔符不只出现在正文中，还需要通过 Content-Type 参数告诉接收方。

浏览器构造 FormData 时，会处理这组对应关系。手动覆盖成一个不带 boundary 的 multipart/form-data，可能让服务端不知道怎样切分。[RFC 7578](https://www.rfc-editor.org/rfc/rfc7578.html)定义了 multipart 表单和边界参数。

文件的原始名称与声称的类型也不自动可信。需要结合大小、允许类型、实际内容和保存策略检查，不能因为某个 part 写着 image/png 就跳过验证。

### Accept 是偏好协商，不是请求体格式开关

客户端可以在 Accept 中列多个媒体类型，并用 q 表达偏好。实际匹配还涉及范围与具体程度，不是永远只取文本上最大的一个数字。

服务端没有可接受表示时，可以按相应策略返回 406；协议也允许在一定条件下忽略偏好，不能承诺每台服务端都严格按同一方式协商。[RFC 9110 Accept 章节](https://www.rfc-editor.org/rfc/rfc9110.html#section-12.5.1)是规则依据。

这也不同于 415。415 常用于服务端不支持当前请求内容的媒体类型等情况，定位时先确认错在发送格式，还是响应协商。

![媒体类型与压缩，分开理解](https://note.lgdsunday.club/img/Q681/03-http-content-type-accept.webp)

### Content-Encoding 又在描述另一层

application/json 说明媒体格式，gzip 这类 Content-Encoding 说明内容采用了相应编码处理。charset 等参数也有各媒体类型自己的规则，不能把压缩、字符编码和媒体类型全混成“文件格式”。

排查时保留实际请求头、响应头和脱敏后的原始内容。只看某个前端对象打印结果，不一定能看见网络上真正发送的字节。

## 面试官继续追问

### 服务端返回了 JSON，客户端一定会自动转对象吗？

要看实际客户端 API。响应类型标签与解析动作仍需配合；也要处理错误响应可能返回文本或其他格式的情况，不能每次无条件调用 JSON 解析再把解析错误当成网络故障。

### 文件扩展名和 Content-Type 对上，就安全了吗？

不够。两者都可能来自不可信输入。还需根据用途检查真实内容、体积、解析风险和存储访问方式；它们不替代身份与资源权限。

## 面试速记卡

> - Content-Type：描述这份内容，作用于请求也作用于响应。
> - Accept：表达响应偏好，不决定请求体编码。
> - 编码：JSON、表单键值和 multipart 必须按不同格式组织字节。
> - boundary：multipart 头与正文要一致，浏览器 FormData 通常交给浏览器生成。
> - 分层：媒体格式、压缩、语法和业务验证不要混为一谈。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
