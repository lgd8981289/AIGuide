---
title: "LangGraph 如何实现暂停和恢复？人工审批后从哪里继续执行？"
description: "LangGraph 通过保存执行状态，让任务能够暂停下来，等收到用户回复以后继续执行。 具体来说，需要配置一个负责保存检查点的 checkpointer ，并用 thread_id 标识当前线程。流程执行到人工审批的位置时，调用 inter……"
category: "langchain"
qnum: "Q003"
date: 2026-09-22
faqAnswer: "LangGraph 通过保存执行状态，让任务能够暂停下来，等收到用户回复以后继续执行。 具体来说，需要配置一个负责保存检查点的 checkpointer ，并用 thread_id 标识当前线程。流程执行到人工审批的位置时，调用 interrupt() ，就可以暂停并把待确认的内容返回给调用方。 用户回复后，需要使用相同的 thread_id 找回原来的 Graph，再通过 Command(resume=用户回复) 传回审批结果。这个结果会成为对应 interrupt() 的返回值，代码就可以根据同意或拒绝，决定后续流程。 这里要注意，恢复时中断节点会从头执行，因此暂停前的代码可能重复运行。生成草稿可以放在前一个节点，发送邮件则放在审批通过之后，并处理重复发送的问题。如果还要支持服务重启后恢复，就需要使用数据库等持久化存储来保存检查点。"
---
🧑‍💻 面试官：用 LangGraph 做一个邮件助手，邮件写好以后要等用户确认才能发送，这一步怎么做？

🙋‍♂️ 我：发送之前调用 `interrupt()` 暂停，等用户确认以后再恢复。

🧑‍💻 面试官：用户明天才确认，期间后端服务重启了，还能继续吗？

🙋‍♂️ 我：应该可以，需要用 checkpointer 保存状态，再通过原来的 `thread_id` 找回来。

🧑‍💻 面试官：那恢复的时候，是从暂停的下一行继续执行吗？

🙋‍♂️ 我：状态已经保存了，应该会接着往下执行吧。

🧑‍💻 面试官：如果生成邮件草稿和等待确认写在同一个节点里，恢复时会不会重新生成一份草稿？用户刚才确认的，又是哪一份？

> 这道题要抓住的是「恢复的位置」：LangGraph 会找回保存的状态，但发生中断的节点会从头执行。理解这一点，才能分清哪些代码会重跑，哪些操作需要单独处理。

## 面试速答（60 秒版）

LangGraph 通过保存执行状态，让任务能够暂停下来，等收到用户回复以后继续执行。

具体来说，需要配置一个负责保存检查点的 `checkpointer`，并用 `thread_id` 标识当前线程。流程执行到人工审批的位置时，调用 `interrupt()`，就可以暂停并把待确认的内容返回给调用方。

用户回复后，需要使用相同的 `thread_id` 找回原来的 Graph，再通过 `Command(resume=用户回复)` 传回审批结果。这个结果会成为对应 `interrupt()` 的返回值，代码就可以根据同意或拒绝，决定后续流程。

![ChatGPT Image 2026年9月22日 17_31_05](/note/img/Q003/ChatGPT%20Image%202026%E5%B9%B49%E6%9C%8822%E6%97%A5%2017_31_05.png)

这里要注意，恢复时中断节点会从头执行，因此暂停前的代码可能重复运行。生成草稿可以放在前一个节点，发送邮件则放在审批通过之后，并处理重复发送的问题。如果还要支持服务重启后恢复，就需要使用数据库等持久化存储来保存检查点。

## 知识点详解：LangGraph 暂停以后，怎样接着执行？

### 先把一次人工审批的过程走完

假设用户让 Agent 起草一封项目周报邮件，要求自己确认以后再发送。

在 LangGraph 中，我们可以把这件事拆成三个节点：

- 生成草稿
- 等待审批
- 发送邮件。

这里的节点，就是负责某一步处理的函数，节点之间通过 Graph 的状态传递数据。

整个过程可以这样理解：

![ChatGPT Image 2026年9月22日 17_37_57](/note/img/Q003/ChatGPT%20Image%202026%E5%B9%B49%E6%9C%8822%E6%97%A5%2017_37_57.png)

生成草稿的节点完成以后，会把收件人、标题和正文写进 Graph 状态。审批节点再读取这些内容，交给用户确认。

等待期间，应用可以先把审批页面展示出来，结束这次请求。等用户点击确认时，再发起一次恢复请求，因此不需要让同一个 HTTP 请求一直挂到用户回复。

那后端怎么知道，用户确认的是哪一份草稿，又应该从哪里继续？

这就需要 **先保存执行进度** 了。

### checkpointer 保存进度，thread_id 帮我们找回来

`checkpointer` 是 LangGraph 中负责读写检查点的组件。检查点保存 Graph 的状态和执行进度，让框架知道之前已经做到了哪里。

在这个例子里，已经生成的邮件内容需要保存在 Graph 状态中。这样恢复时，审批节点才能重新读取同一份草稿。

每个线程还需要一个 `thread_id`。可以把它理解成查找这段执行记录的标识。

恢复时继续使用原来的标识，LangGraph 才能找到对应的检查点。如果换成一个新标识，就找不到原来等待审批的那段流程。

![ChatGPT Image 2026年9月22日 18_16_02](/note/img/Q003/ChatGPT%20Image%202026%E5%B9%B49%E6%9C%8822%E6%97%A5%2018_16_02.png)

因此，需要留给后续节点使用的数据，应当通过节点返回值写入 Graph 状态。检查点由谁保存、存到哪里，则取决于配置的 checkpointer。

关于 LangChain 的持久化方案，大家可以查看这里：[官方持久化文档](https://docs.langchain.com/oss/javascript/langgraph/persistence)

### interrupt 提出确认请求，resume 带回用户回复

准备好状态存储以后，就可以在审批节点里调用 `interrupt()`。

下面分别给出 TypeScript 和 Python 的关键代码。代码只保留暂停和恢复相关的部分，省略状态类型与完整建图过程。

#### TypeScript（LangGraph.js）

```ts
import { Command, interrupt } from "@langchain/langgraph";

function reviewEmail(state: EmailState) {
  const approved = interrupt({
    question: "确认发送这封周报邮件吗？",
    to: state.to,
    draft: state.draft,
  });

  return { approved };
}

const config = {
  configurable: { thread_id: "weekly-email-001" },
};

// 首次调用会在 reviewEmail 中暂停
await graph.invoke(initialInput, config);

// 用户确认后，使用同一个 thread_id 恢复
await graph.invoke(new Command({ resume: true }), config);
```

#### Python（LangGraph）

```python
from langgraph.types import Command, interrupt


def review_email(state: EmailState):
    approved = interrupt({
        "question": "确认发送这封周报邮件吗？",
        "to": state["to"],
        "draft": state["draft"],
    })
    return {"approved": approved}


config = {
    "configurable": {"thread_id": "weekly-email-001"}
}

# 首次调用会在 review_email 中暂停
graph.invoke(initial_input, config=config)

# 用户确认后，使用同一个 thread_id 恢复
graph.invoke(Command(resume=True), config=config)
```

第一次执行到 `interrupt()` 时，Graph 会暂停，待确认的内容会返回给调用方。使用普通的 `invoke` 调用时，可以从结果的 `__interrupt__` 字段读取这些内容，再展示给用户。

恢复时，`thread_id` 必须与首次运行时相同。传入的 `true` 会成为原来那次 `interrupt()` 的返回值，也就是代码中的 `approved`。审批节点把它写回状态以后，预先设置的条件分支就可以决定：同意则进入发送节点，拒绝则结束。

不过，无论使用 TypeScript 还是 Python，框架都不会替我们自动写好同意和拒绝的业务分支。

### 恢复时，审批节点究竟执行了哪些代码？

如果咱们在 `interrupt()` 前后各打一条日志，就比较容易看清楚。按 LangGraph 的恢复机制，这两次调用会经历下面的过程：

| 时机 | 执行过程 |
| --- | --- |
| 第一次调用 | 打印“进入审批节点”，执行到 interrupt 后暂停 |
| 用户同意后恢复 | 再次打印“进入审批节点”，interrupt 取得传入的 true，然后打印“收到审批结果 true” |

也就是说，**恢复时会重新进入整个审批节点。再次走到对应的 interrupt 时，因为已经有了用户回复，它会返回这个值，让后面的代码继续执行。** 这是官方明确说明的行为。[官方中断文档](https://docs.langchain.com/oss/javascript/langgraph/interrupts)

现在再看开头的问题：如果把生成草稿写在这个节点里，而且放在 `interrupt()` 前面，恢复时就可能再次调用模型，生成另一份内容。

所以，咱们前面才把生成草稿放在单独的节点里。前一个节点完成并保存草稿以后，审批节点只读取它。这样，这次审批恢复就不会因为节点重跑而重新起草邮件。这种按步骤拆节点的方式，也便于控制一次恢复需要重做多少工作。[官方节点设计说明](https://docs.langchain.com/oss/javascript/langgraph/thinking-in-langgraph)

## 面试官继续追问

### 暂停期间服务重启了，还能恢复吗？

要看检查点存在哪里。

开发时常用的 `MemorySaver` 把数据放在进程内存里。服务一旦重启，这些记录就丢了，即使记得原来的 `thread_id` 也没用。

如果希望用户第二天仍然能继续审批，就需要使用数据库等持久化存储。服务重启后，重新加载兼容的 Graph 代码，连接原来的检查点存储，再用原 `thread_id` 恢复。

因此，能在同一个进程里暂停、恢复，还不足以证明系统支持重启恢复。

### 发送邮件已经拆成独立节点，是不是就不会重复发送了？

还不能这么保证。

假设邮件服务已经发送成功，但后端还没来得及保存成功结果就崩溃了。重新执行时，系统可能不知道上次已经发出，再调用一次发送接口。

如果邮件服务支持幂等键，可以为这次发送生成一个固定标识。重试时沿用它，让邮件服务识别出这是同一次发送。如果接口不支持，就需要核对发送记录，结果还不确定时先等待查询或人工处理。

拆节点控制的是哪些代码需要重跑；外部邮件到底发了几次，还需要发送接口和业务代码一起控制。

### 怎么确认暂停和恢复真的做对了？

可以围绕同一封测试邮件，检查几种情况：

- 用户同意以后，发出的内容与他刚才确认的内容一致。
- 用户拒绝以后，发送节点没有执行。
- 等待审批时重启服务，仍能找回原来的草稿并继续。
- 重复点击确认，以及发送成功后发生故障，都不会造成盲目重发。

同时，后端还要验证当前用户是否有权审批这封邮件。`thread_id` 只用于查找执行记录，知道这个标识，并不等于拥有审批权限。

## 面试速记卡

> - 暂停：调用 interrupt，向外提供待确认内容并等待回复。
> - 保存：checkpointer 保存 Graph 状态和进度，跨进程恢复需要持久化存储。
> - 恢复：使用原 thread_id，通过 Command 的 resume 传回用户回复。
> - 重跑：中断节点从头执行，resume 值成为对应 interrupt 的返回值。
> - 实践：草稿与审批分开，发送放在批准之后，并处理重复执行。

