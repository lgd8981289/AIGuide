# LangChain 的 ToolRuntime 是什么？工具怎样取得用户身份和状态？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/langchain/q706-langchain-toolruntime-injected-context/) · [题库目录](../../README.md)

*下面是一段用于讲题的模拟面试对话。*

🧑‍💻 面试官：查询订单工具需要订单号和用户身份，两者都定义成模型参数吗？

🙋‍♂️ 我：订单号可以从问题中提取，当前身份应该由应用提供，工具通过运行上下文取得。

🧑‍💻 面试官：在 LangChain 中，ToolRuntime 具体帮你解决哪一段？

🙋‍♂️ 我：它让工具读取本次运行的 Context、State，以及 Store 等信息。运行参数不需要让模型生成。

🧑‍💻 面试官：参数已经隐藏了，如果工具返回整个用户对象，或者只按订单号查询，还安全吗？

> 注入解决“工具从哪里拿可信依赖”，授权还要回答“这个人能不能操作这份数据”。

## 面试速答（60 秒版）

ToolRuntime 是 LangChain 工具读取运行信息的入口。工具可以通过它访问当前状态、应用传入的 Context、Store、工具调用标识等，不需要把这些都设计成模型填写的参数。

例如查询订单，模型只提供订单号。应用在完成登录认证后，把当前用户 ID 放进运行上下文；工具再结合订单号和当前身份执行查询。

Python 可以在工具函数中声明 `runtime: ToolRuntime`，由工具执行节点注入，模型看到的工具 Schema 不包含这个参数。TypeScript 通常从工具回调的第二个配置参数读取，对应字段的命名也不同。

不过，运行上下文不是自动授权。工具仍需要限制数据范围，返回时只给必要字段；也不要直接把整个 Runtime 拼进提示词或日志。

![模型填订单号，应用给当前身份](https://note.lgdsunday.club/img/Q706/01-toolruntime-overview.webp)

## 知识点详解：工具有两种输入，不应该都让模型填

### 业务参数与运行依赖，来源不同

假设用户问“帮我查订单 O1”。订单号来自用户问题，可以作为工具的显式参数。

当前用户是谁，则应该来自服务端的认证结果。数据库连接、资料服务客户端，也应该由应用环境准备。它们不是模型推断出来的事实，更不能因为模型声称“我是管理员”就随之改变。

ToolRuntime 把运行信息交给真正执行工具的代码。模型提出的是业务请求，工具代码则在可信环境里决定怎样完成它。两条路径在工具这里汇合，但不能把来源混为一谈。

### 两种语言的工具定义，长得并不完全一样

下面只展示工具定义，假设应用已经通过 Context 传入当前身份。返回字符串仅用于说明字段来源，不代表真实订单查询或权限校验。

#### TypeScript

```ts
import { tool, type ToolRuntime } from "langchain";
import { z } from "zod";

const lookupOrder = tool(
  ({ orderId }, runtime: ToolRuntime) => {
    const { userId } = runtime.context as { userId: string };
    return `query order=${orderId} within user=${userId}`;
  },
  {
    name: "lookup_order",
    description: "查询当前用户的订单",
    schema: z.object({ orderId: z.string() }),
  },
);
```

#### Python

```python
from typing_extensions import TypedDict
from langchain.tools import tool, ToolRuntime
from langgraph.graph import MessagesState

class UserContext(TypedDict):
    user_id: str

@tool
def lookup_order(
    order_id: str,
    runtime: ToolRuntime[UserContext, MessagesState],
) -> str:
    """查询当前用户的订单。"""
    user_id = runtime.context["user_id"]
    return f"query order={order_id} within user={user_id}"
```

Python 的两个类型参数分别描述 Context 和 State；JS 示例用第二个回调参数访问上下文。不要把 Python 的 `tool_call_id` 照搬成 JS 字段，JS 对应 `toolCallId`。具体入口见 [Python 工具文档](https://docs.langchain.com/oss/python/langchain/tools)与 [JS 工具文档](https://docs.langchain.com/oss/javascript/langchain/tools)。

本次使用 JS LangChain 1.5.16、LangGraph 1.5.0，以及 Python LangChain 1.4.6、LangGraph 1.2.15，构造工具调用消息交给 ToolNode，验证了模型参数 Schema 中没有 Runtime，以及工具能取得应用 Context。没有请求真实模型，也没有访问真实订单库。

![Runtime 是执行时注入，不是模型参数](https://note.lgdsunday.club/img/Q706/02-toolruntime-injection.webp)

### Runtime 里几类信息，也要分开使用

State 是当前任务的工作数据，可以读取对话或业务进度；Context 是本次应用传入的依赖与配置。Store 则是跨运行保存信息的存储入口，是否持久化取决于具体实现。

工具调用 ID 用于把工具结果对应回那一次请求，不能直接拿它当业务幂等键。一个任务重试后可能产生新的调用 ID，但业务上仍然是同一笔退款。

因此，需要修改任务状态时，要按框架支持的更新方式返回；需要访问长期数据时，要检查命名空间与用户归属。不能因为工具拿到了 Store，就任意读取整个数据库。

### 工具定义隐藏参数，为什么还不算安全？

先看入口。假设应用直接接受浏览器传来的 `user_id`，不验证就放进 Context，隐藏之后仍然是不可信身份，只是换了一个位置。

再看查询。工具拿到了正确的用户 ID，却只按订单号查询，也可能越权。应该让数据查询或授权检查真正使用当前身份与租户范围。

最后看出口。完整用户记录可能包含手机号、令牌或内部备注。工具只返回完成本题所需的字段，不要为调试方便把整个对象转成字符串。

这三段检查缺一不可。Runtime 帮助组织传递路径，不能替业务代码作出全部安全判断。

![身份可信、查询受限、返回最少](https://note.lgdsunday.club/img/Q706/03-toolruntime-security.webp)

## 面试官继续追问

### 直接手动调用工具，会自动得到这些运行信息吗？

不要假设会。需要检查调用入口是否提供了对应的执行上下文。通过 Agent 或 ToolNode 执行，与拿到一个普通函数直接调用，不是同一套注入过程。

### 工具能从 State 读取用户说的身份吗？

可以读到文本，不代表可以拿它授权。用户输入是业务内容，当前认证身份要走可信应用入口，两者应保留来源区别。

### 从 Runtime 读取长期记忆，就会自动进入模型吗？

不会仅凭存储存在就自动进入。工具返回什么、节点注入什么，才决定模型实际看到什么，也要在这一步做访问范围和内容筛选。

## 面试速记卡

> - 模型填写业务参数，应用提供当前身份与运行依赖。
> - ToolRuntime 让工具读取 State、Context、Store 等运行信息。
> - Python 使用注入参数，JS 通常使用工具回调的第二个参数。
> - 隐藏参数不等于可信身份，更不等于已经完成授权。
> - 工具返回、日志和提示词都不要直接暴露完整 Runtime。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
