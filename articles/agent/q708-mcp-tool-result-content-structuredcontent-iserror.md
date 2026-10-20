# MCP 工具的 content、structuredContent 和 isError 有什么区别？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/agent/q708-mcp-tool-result-content-structuredcontent-iserror/) · [题库目录](../../README.md)

*下面是一段用于讲题的模拟面试对话。*

🧑‍💻 面试官：MCP 工具已经在 content 中返回一段 JSON 文本，为什么还要有 structuredContent？

🙋‍♂️ 我：文本需要再解析，structuredContent 则提供原生 JSON 值，可以按 outputSchema 校验和处理。

🧑‍💻 面试官：那是不是 content 给模型看，structuredContent 只给页面渲染？

🙋‍♂️ 我：不能这样固定分工，实际由 Host 怎么使用结果决定。

🧑‍💻 面试官：工具返回了“订单不存在”，HTTP 也是 200，这次到底算成功还是失败？

> 先认清结果是哪一层：协议有没有接住请求，工具有没有完成操作，业务数据又表示什么。

## 面试速答（60 秒版）

MCP 的 `content` 是内容块列表，可以包含文本，也可以包含协议支持的图片、音频或资源等内容。`structuredContent` 是工具返回的结构化 JSON 数据，便于应用按字段处理，并与 `outputSchema` 对照校验。

二者不是“模型专用”和“页面专用”的固定分工。Host 可以把结构化结果提供给模型，也可以用文本做界面展示，需要看具体集成。

`isError: true` 表示工具执行层面的错误，例如参数含义不合法或业务操作失败；JSON-RPC 的 `error` 则表示协议请求等层面的问题。HTTP 成功接收，不代表工具完成了任务。

还要注意版本。本文按 MCP 2026-07-28 规范核验，structuredContent 可以是符合输出 Schema 的任意 JSON 值，不能继续把旧版本中的对象限制说成永久规则。

![内容、结构化数据、错误标记，各看一层](https://note.lgdsunday.club/img/Q708/01-tool-result-overview.webp)

## 知识点详解：工具结果既要能展示，也要能可靠处理

### JSON 字符串和 JSON 数据，接法不同

假设查询订单，工具在文本里写了 `{"order_id":"O1","status":"shipped"}`。人可以阅读，但代码要先确认它确实是合法 JSON，再解析和检查字段。

如果返回 `structuredContent`，字段已经作为 JSON 值传输，应用不用从一段自然语言里猜出数据。不过，数据仍可能不符合约定，字段值也未必真实，解析便利不等于业务正确。

`content` 则提供内容块表达。它不只是一个字符串，也不能把所有块都按 `text` 读取。遇到图片、音频、资源等内容时，Host 需要按类型和能力处理。当前格式见[官方工具结果规范](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)。

### outputSchema 约束的是结构化结果

假设工具承诺返回订单号与状态，输出 Schema 可以声明它们的类型、必填项和状态范围。服务端必须按声明返回结构化数据，客户端也应进行验证。

下面是 2026-07-28 规范下的一个简化 JSON-RPC 完成结果，省略了工具定义。它是协议数据示例，与 TS、Python 无关，不需要机械复制成两份实现。

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "result": {
    "resultType": "complete",
    "content": [
      { "type": "text", "text": "{\"order_id\":\"O1\",\"status\":\"shipped\"}" }
    ],
    "structuredContent": {
      "order_id": "O1",
      "status": "shipped"
    },
    "isError": false
  }
}
```

当前规范为了向后兼容，建议返回结构化结果时，同时在文本块中给出序列化 JSON。两份表示要保持一致，不要让页面读到“已发货”，模型却读到“已取消”。

还要区分版本。在 2026-07-28 中，结构化结果可以是对象、数组、标量或 null，只要符合声明的输出 Schema；旧协议、SDK 和供应商适配层可能有不同限制。接入时核对协商版本与实际库，不能只看最新文档就假设旧客户端都支持。

![JSON 文本，还要解析；JSON 值按字段取](https://note.lgdsunday.club/img/Q708/02-tool-result-structure.webp)

### 工具失败，为什么不都扔成 JSON-RPC error？

假设请求调用一个不存在的工具，协议层无法按要求执行，可以返回 JSON-RPC `error`。

另一个请求已经找到工具，也进入了业务处理，只是日期不合法、资料服务失败或业务操作被拒绝。这类可供模型理解并调整的反馈，通常放在工具结果中，设置 `isError: true`。

两种错误要分开记录。否则，监控里可能把业务失败算成协议故障，或者因为 HTTP 返回 200 就把失败任务算成成功。[规范的错误处理部分](https://modelcontextprotocol.io/specification/2026-07-28/server/tools#error-handling)明确区分了它们。

“订单不存在”究竟属于普通查询结果还是工具错误，需要在工具契约里统一。允许空结果的检索，可以正常返回空集合；本应完成某项操作却无法继续，则需要明确的失败信息。不能同一个工具今天把它当成功，明天又只靠一句文本表示失败。

![HTTP 收到、工具完成、业务成功，分层判断](https://note.lgdsunday.club/img/Q708/03-tool-error-layers.webp)

### 应用拿到结果以后，还要过哪些检查？

先根据结果类型判断是否已经完成。新版协议还支持要求补充输入的结果，不能收到任何 `result` 就当成最终数据。

拿到完成结果后，再检查 `isError`、输出 Schema 与业务字段；最后才决定给模型什么内容、向用户展示什么，以及是否继续下一步。工具返回的文本仍然是数据，不因为来自 MCP 就自动具有系统指令的权限。

例如后续要发送通知，就必须核对真实订单状态和当前授权，不能只因文本里出现“查询成功”就触发动作。

### 怎样验证接入没有读错？

准备正常对象、合法空结果、Schema 不匹配、两份内容不一致、工具错误和协议错误几类样本。再测试当前客户端对数组输出和非文本内容块的支持。

检查 Host 真正交给模型与页面的内容，尤其是它是否丢掉了结构化结果、忽略了 isError，或把内部错误堆栈暴露出去。本文核对的是协议与集成判断，没有运行真实 MCP 服务或声称完成 SDK 兼容性测试。

## 面试官继续追问

### structuredContent 能保证模型不出现幻觉吗？

不能。它是服务端工具数据的传输结构，不是模型生成时的约束机制。即使字段通过校验，事实来源和模型如何使用它，仍需检查。

### isError 没有设为 true，就说明业务成功了吗？

它只表示没有以这个标记报告工具执行错误。应用仍要理解正常结果中的业务状态，不能把“查询到审核未通过”当成“审批成功”。

### 结果同时包含敏感字段和公开摘要怎么办？

最好先在服务端按权限裁剪。Host 也应明确选择进入模型和页面的内容，不要把 structuredContent 当成天然不会被模型看到的秘密通道。

## 面试速记卡

> - content 是内容块列表，不只支持文本。
> - structuredContent 提供 JSON 数据，outputSchema 描述其约定。
> - 模型与页面如何使用两类内容，由 Host 集成决定。
> - 工具错误看 isError，协议错误看 JSON-RPC error，业务结果还要单独理解。
> - 2026-07-28 支持任意 JSON 根值，旧客户端仍需核对兼容性。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
