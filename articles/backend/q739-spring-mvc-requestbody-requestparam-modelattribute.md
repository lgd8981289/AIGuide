# Spring MVC 的 RequestBody、RequestParam 和 ModelAttribute 有什么区别？

[昆仑数智开发面试真题](../companies/kunlun-development.md) · [蚂蚁集团开发面试真题](../companies/ant-development.md) · [阿里后端面试真题](../companies/alibaba-backend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q739-spring-mvc-requestbody-requestparam-modelattribute/) · [题库目录](../../README.md)

*下面是一段用于讲解的模拟面试对话。*

🧑‍💻 **面试官：** 一个 POST 接口，前端提交表单字段，为什么 @RequestBody 接不到预期对象？

🙋‍♂️ **我：** POST 的参数在请求体里，应该用 RequestBody，可能字段名不对。

🧑‍💻 **面试官：** 请求体里是 JSON，还是 application/x-www-form-urlencoded？

🙋‍♂️ **我：** 这个没有确认。

🧑‍💻 **面试官：** 如果只是查列表，URL 上有 page 和 size，你还会让它走同一种对象解析吗？

> 参数注解选哪一个，先看客户端究竟发了什么格式，以及服务端准备怎样解析；不能只看 GET 还是 POST。

## 面试速答（60 秒版）

在 Spring MVC 里，`@RequestParam` 主要绑定 Servlet 请求参数，也就是查询参数和表单参数，适合接收 page、size 这类单独的值。

`@ModelAttribute` 通过数据绑定把参数组织到一个对象里，适合一组查询条件或表单字段。它不是把 JSON 请求体直接反序列化成对象。

`@RequestBody` 则通过 HttpMessageConverter 读取请求体，根据内容类型和转换器能力转成目标对象，常见的是接收 JSON。

因此，选择时要把 Content-Type、字段位置和目标结构对齐。接收到对象以后，类型转换、Bean Validation、业务校验和授权仍然是不同步骤。尤其不能直接绑定一个包含敏感属性的持久化实体，让客户端随便填写角色或归属人。

![Spring MVC 按参数位置和编码选择 RequestParam、ModelAttribute 或 RequestBody](https://note.lgdsunday.club/img/Q739/01-binding-overview.webp)

## 知识点详解：同样是参数，三条入口做的事不同

### RequestParam 取的是 Servlet 参数

假设列表地址是 `/courses?page=2&size=20`，page 和 size 都是查询参数。用 @RequestParam 接收，Spring 可以把文本转换成需要的数字类型。

如果是标准表单提交，Content-Type 为 application/x-www-form-urlencoded，请求体里也是一组字段。Servlet 会把它们纳入参数体系，因此仍然可以用 @RequestParam 绑定。

所以，“RequestParam 只接 GET”不对，“POST 的数据必须用 RequestBody”也不对。请求方法没有替我们决定数据编码。[RequestParam 官方文档](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/requestparam.html)明确把查询参数和表单数据都列入了绑定范围。

默认必填的参数缺失，和传入了一段无法转换的文字，是两类问题。可选字段可以根据需要使用 required=false、默认值或 Optional，但默认值也应符合业务，不能把非法输入悄悄解释成一个有效请求。

### ModelAttribute 把一组字段绑定到对象

当查询条件很多时，每个参数单独写一遍会比较零散。可以设计一个专用的查询对象，让 ModelAttribute 根据绑定规则，把参数填到它的构造参数或属性中。

这里是“根据字段名绑定”，不是“把整个请求体交给 JSON 解析器”。构造绑定、属性绑定以及可配置的字段规则，会影响最终允许哪些输入进入对象。某些默认参数解析规则还可能把合适的复杂对象隐式当作 ModelAttribute，因此接口文档和注解最好能清楚表达意图。

需要特别注意过度绑定。假设数据库实体除了 name，还包含 ownerId、role 或 enabled，直接把实体作为表单绑定对象，可能让客户端影响不该修改的字段。更稳妥的做法是使用只包含允许输入字段的专用 DTO，并按需要限制绑定字段。[ModelAttribute 文档](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/modelattrib-method-args.html)对安全绑定也有说明。

![专用输入 DTO 限制可绑定范围，敏感字段与授权不能交给客户端填写](https://note.lgdsunday.club/img/Q739/02-binding-security.webp)

### RequestBody 通过转换器读取请求体

客户端发送 `Content-Type: application/json`，请求体是一份 JSON 文档。这时 @RequestBody 可以让相应的消息转换器把它转换成输入对象。

这条路径是否可用，取决于媒体类型、目标类型与注册的转换器。它并不是见到 POST 就自动按 JSON 解析；发送格式与声明不符，或者没有合适的转换器，就可能出现媒体类型或消息读取错误。

还有一点，请求体不是可以任意重复读取的字符串变量。Servlet 参数解析可能已经读取了表单请求体，再试图用另一种方式读取，不一定可靠。官方也建议表单数据使用参数绑定，而不是把表单接收统一改成 RequestBody。[RequestBody 文档](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/requestbody.html)解释了这个限制。

![Servlet 参数解析可能读取表单请求体，不能假定再读 RequestBody 仍可靠](https://note.lgdsunday.club/img/Q739/03-body-stream.webp)

### 解析成功，不等于请求已经有效

把文本 `20` 转成整数，是类型转换。要求 size 在允许范围内，是字段约束。确认当前用户有权访问某个课程，是授权判断。三个动作不能相互替代。

@Valid 可以触发对应对象的 Bean Validation，但不能代替数据库状态检查与权限校验。错误响应也应区分字段缺失、格式错误、约束失败和业务不允许，让调用方知道该改哪里。

验证接口时，先保存实际 HTTP 请求，而不是只看前端对象长什么样。分别准备查询参数、URL 编码表单、JSON，以及错误 Content-Type；再测试缺失字段、重复字段、无法转换的数值和禁止绑定的敏感字段。本文核对 Spring Framework 7.0.9 文档，未把上述用例冒充已经运行过的 MockMvc 集成测试。

## 面试官继续追问

### 上传文件也用这三个注解硬套吗？

需要先区分 multipart 的普通字段和文件部分，结合 MultipartFile、RequestPart 等机制设计。尤其 JSON 部分与普通文本字段可能需要不同解析路径，不能把 multipart 当成单一 JSON 请求体。

### 一个 JSON 请求体能拆成两个 RequestBody 吗？

不应把同一条输入流当成两份独立请求体读取。通常设计一个包含所需字段的请求 DTO，或者按协议把不同数据放到明确的位置。

### Spring WebFlux 的 RequestParam 也是表单和查询都接吗？

不要直接照搬 MVC 的 Servlet 参数语义。WebFlux 的对应注解与表单处理有自己的边界。题目先限定栈，再查该栈的文档，这篇只讨论 Spring MVC。

## 面试速记卡

> - RequestParam：Servlet 查询参数与表单参数。
> - ModelAttribute：按绑定规则，把一组字段组织到对象。
> - RequestBody：通过消息转换器读取并转换请求体。
> - 选型依据：字段位置、Content-Type、目标类型，不只看请求方法。
> - 安全边界：专用输入 DTO；解析、校验、业务检查与授权分开。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **昆仑数智 · 开发（原帖未明确细分岗位） · 原帖未明确批次**：Spring 接收参数的 RequestBody、RequestParam、PathVariable 注解有什么区别？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/603726385772855296)；原帖发布于 2024-03-30。
- **蚂蚁集团 · 开发（密算科技；原帖未明确细分岗位） · 秋招**：Spring Controller 中 RequestParam 和 RequestBody 有什么区别？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/676821795248373760)；原帖编辑于 2024-10-26。
- **阿里巴巴 · 后端开发（阿里妈妈） · 原帖未明确批次**：RequestParam、RequestBody 怎样把 HTTP 请求的数据绑定到 Controller 入参，底层原理是什么？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/670604259720785920)；原帖发布于 2024-10-01。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
