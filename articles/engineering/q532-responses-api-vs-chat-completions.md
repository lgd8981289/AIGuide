# OpenAI Responses API 和 Chat Completions 有什么区别？开发 Agent 应该怎么选？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/engineering/q532-responses-api-vs-chat-completions/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：Responses API 和 Chat Completions 有什么区别？

🙋‍♂️ 我：Responses 把工具与结果拆成不同类型的 Item，也支持更直接的状态衔接。

🧑‍💻 面试官：那模型返回一个查询订单的 function\_call，你还需要执行查询吗？

🙋‍♂️ 我：需要，自己的函数还是由应用执行，再把结果回传。

🧑‍💻 面试官：如果 output 里面第一个 Item 不是文本，你的页面会不会读错？

> 迁移要同时调整输入、输出和状态管理；自己的工具执行责任仍然要讲清楚。

## 面试速答（60 秒版）

`Chat Completions` 主要围绕 `messages` 和返回的 `choices` 组织交互。`Responses API` 则用不同类型的 Item 表达消息、工具请求、工具结果等内容，返回的是 `output` 数组。

Responses 可以结合官方提供的工具和会话状态能力，更方便地组织多轮任务。对于咱们自己的函数，模型提出调用以后，应用仍要检查参数和权限、实际执行，再把结果交回模型。

因此，迁移时不能只替换请求地址。还要检查输出解析、函数结果关联、历史衔接以及数据存储设置。官方当前建议新项目使用 Responses；已有兼容接口则按实际功能、模型支持和迁移成本判断。

![消息与执行记录，结构不同](https://note.lgdsunday.club/img/Q532/01-overview.webp)

## 知识点详解：从一组聊天消息，走到一串有类型的执行记录

### 先看两套返回结构

假设用户问‘订单什么时候发货’，模型可能先申请查询，再解释结果。

Chat Completions 的响应一般从 choices 中取出 message。这个 message 可能包含文本，也可能包含工具请求。Responses 的 output 则是一组 Item，每个 Item 用 type 表明它是什么。

这就意味着 output\[0] 不能默认理解成最终答案。它可能是推理相关记录或工具调用。只需要文本时可以使用 SDK 的 output\_text 辅助属性；需要完整执行过程时，应按类型处理各项。

### 自定义函数调用，要把结果对应回去

模型提出查询请求以后，应用取出函数名称与参数，检查当前用户是否有权查询，再调用订单服务。

返回工具结果时，需要使用本次调用的关联标识。Responses 中，自定义函数调用与 function\_call\_output 通过 call\_id 对应。一次响应里可能有多个调用，不能只按数组位置猜谁对应谁。

结果本身也应表达真实状态，例如‘没有找到订单’或‘上游超时’，而不是工具执行失败以后还填一段看似成功的数据。

官方托管工具和自定义函数的执行方式有区别。不能因为某些内置工具可以由服务处理，就认为所有本地工具也自动在云端执行。

![工具结果，要找到对应调用](https://note.lgdsunday.club/img/Q532/02-call-id.webp)

### 状态衔接，和权限管理是两回事

Responses 可以用 previous\_response\_id 衔接先前响应，或按需要使用持久会话能力。应用也可以自行维护输入记录。

但衔接历史并不等于省略上下文成本，更不意味着不用设置数据保留策略。具体存储行为、可用模型和组织限制，需要核对当前官方说明。

业务身份仍应由后端可信信息确定。不能因为上一轮模型记得用户姓名，就放弃本轮订单权限检查。

![衔接历史，还要管理应用状态](https://note.lgdsunday.club/img/Q532/03-state.webp)

### 怎样检查一次迁移有没有漏项

可以先准备几组协议夹具，分别包含纯文本、函数调用、多个调用和非成功状态。检查前端会不会把工具参数展示成答案，后端能否把每个结果关联到正确调用。

再验证正常问答、多轮追问、工具失败与取消。原来依赖的结构化输出和流式事件，也要逐项核对，不能照旧字段直接解析。

本文讲接口职责，没有发出真实模型请求。依据：[OpenAI 官方迁移文档](https://developers.openai.com/api/docs/guides/migrate-to-responses)。

![第一个输出，不一定是文本](https://note.lgdsunday.club/img/Q532/04-output-types.webp)

## 面试官继续追问

### 用了 previous\_response\_id，就不用考虑 Token 成本了吗？

历史衔接解决的是传递方式，不能直接推出历史免费。要按当前计费与上下文说明确认输入成本和保留范围。

### output\_text 为空，就一定是接口坏了吗？

可能返回了工具请求、拒绝或其他状态。需要先看响应状态和 Item 类型，再决定执行工具、提示用户或处理失败。

### MCP 工具和自己的 function 都一样执行吗？

执行承载方式不同。要看是远程 MCP、官方工具，还是应用本地函数，分别确认授权、执行和返回责任。

## 面试速记卡

> - Chat Completions：messages 与 choices/message。
> - Responses：按 type 处理 output Items。
> - 自定义函数：应用执行，并按 call\_id 返回结果。
> - 历史衔接：方便传递，不自动消除成本和权限检查。
> - 迁移：同时验证结构、状态与失败路径。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
