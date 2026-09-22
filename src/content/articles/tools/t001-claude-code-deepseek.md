---
title: "无需 Claude 账号！Claude Code APP + DeepSeek 零基础完整教程 + 7 大使用技巧"
description: "教你安装 APP、配置第三方推理、验证模型路由，并掌握 Code 本地会话中的文件引用、任务描述、修改确认、Diff 检查、权限切换、运行中纠正和会话管理。"
category: "tools"
module: "tutorial"
qnum: "T001"
date: 2026-09-15
---
大家好，我是 Sunday。

最近有很多同学问我：没有 Claude 账号，那么还有可以体验 Claude Code 吗？

答案是：**可以的。**

![image-20260915141708918](/note/img/T001/image-20260915141708918.png)

我们首先要知道：工具和模型是两个完全不同的东西。

Claude Code 是一个 Agent 工具，而 Claude 、DeepSeek 这些则是模型。

我们在一个 Agent 工具里面输入自然语言，Agent 工具就会去调用大模型来完成你想要做的事情。

那么在这样一个过程中，就会存在三个角色，分别是：

| 角色       | 由谁承担                 | 负责什么                               |
| ---------- | ------------------------ | -------------------------------------- |
| 使用者     | 你                       | 提出目标、限制范围、检查结果           |
| Agent 工具 | Claude Code APP          | 管理会话、读取文件、调用工具、展示修改 |
| 模型服务   | Claude API、DeepSeek API | 理解任务、生成回答、判断下一步动作     |

因此，我们完全可以保留 Claude Code 这套 Agent 工具，把模型服务从原先的 Claude 换成 DeepSeek。

那么咱们就既可以使用到 Claude Code 这样顶级的 Agent 工具的能力，又可以完全访问咱们自己的 DeepSeek 模型了

那么具体要怎么做呢？

咱们一起来看看吧～

## 对接步骤

在开始之前，咱们需要先准备好两样东西。

### 提前准备：

##### 第一：电脑

macOS 或者 Windows 都可以。不需要安装 Node 什么的。

##### 第二：DeepSeek 开放平台账号

可以在 DeepSeek 网页里面访问和拥有 DeepSeek 账号不是一回事。

没有注册过账号的同学，需要打开 [DeepSeek 开放平台](https://platform.deepseek.com/)，登录以后进入 API Keys 管理页面，创建一个新的 API Key

![image-20260915111940758](/note/img/T001/image-20260915111940758.png)

API Key 可以理解成调用模型时使用的凭证。Claude Code APP 带着它请求 DeepSeek，平台才知道这次用量应该记在哪个账户下。

同时，咱们需要知道，想要使用 DeepSeek 的 API，那么需要有一定的额度，这个额度是需要 **充值的**

因此，我们需要保证有对应的可用余额才可以，需要的话可以在右侧点击充值按钮

![image-20260915112106714](/note/img/T001/image-20260915112106714.png)

就这些东西，挺简单的吧。

然后咱们就开始正式的对接流程

### 第一步：安装 Claude Code APP

打开 [Claude Code Desktop 官方入门页面](https://code.claude.com/docs/en/desktop-quickstart)，下载与你电脑对应的版本。

![image-20260915113250827](/note/img/T001/image-20260915113250827.png)

- macOS 选择 Universal 版本，Intel 与 Apple 芯片都可以使用；
- 普通 Windows 电脑选择 x64 版本；
- Windows ARM64 和 Linux 用户按照官方页面提供的对应入口下载。

下载完成后，一路下一步就可以直接安装的。

安装完成之后，咱们打开 `Claude Code APP`，会进入这个页面

<img src="%E6%AD%A3%E6%96%87.assets/image-20260915113334995.png" alt="image-20260915113334995" style="zoom:33%;" />

他让咱们登录 Claude 账号。

但是很遗憾，咱们没有 Claude 账号。所以，咱们不走这一步，咱们就直接停留在登录页面就可以。

接下来我们要先打开开发者模式，把模型请求改到 DeepSeek。

### 第二步：在登录页面开启 Developer Mode

### macOS 的操作路径

保持 Claude APP 在前台，点击屏幕顶部系统菜单栏中的：`Help → Troubleshooting → Enable Developer Mode`

![image-20260915113632130](/note/img/T001/image-20260915113632130.png)

###  Windows 的操作路径

点击登录页面左上角的应用菜单，也就是 `☰`，然后选择：`Help → Troubleshooting → Enable Developer Mode `（我没有 windows 的电脑，所以就没办法给大家截图了）

开启后，APP 会重新启动，菜单栏中会多出一个 `Developer` 菜单。

![image-20260915114018321](/note/img/T001/image-20260915114018321.png)

接着打开：`Developer → Configure Third-Party Inference…`

![image-20260915114101120](/note/img/T001/image-20260915114101120.png)

这就是第三方模型的配置窗口。

![image-20260915120111836](/note/img/T001/image-20260915120111836.png)

### 第三步：把第三方推理地址改成 DeepSeek

进入配置窗口后，先打开左侧的 `Connection`。

按照下面的表格填写：

- Inference provider：`Gateway`
- Credential kind：`Static API key`
- Gateway base URL：`https://api.deepseek.com/anthropic`
- Gateway API key：你在 DeepSeek 开放平台创建的 API Key
- Gateway auth scheme：`Bearer`

![image-20260915120243778](/note/img/T001/image-20260915120243778.png)

这五项填写完以后，先不要着急点击 `Test connection`。

咱们还需要继续往下找到 `Model list`。这是当前版本 Claude Desktop 接入 DeepSeek 时非常关键的一步。

Claude Desktop 默认会访问下面这个地址，自动获取模型列表：`https://api.deepseek.com/anthropic/v1/models`

但是目前这个地址会返回 `404`。

如果没有手动指定模型，点击测试时一定是不通的，所以我们必须得修改 `Model list`

![image-20260915122241618](/note/img/T001/image-20260915122241618.png)

咱们按照下面的方式继续配置：

1. 将 `Model discovery` 关闭
2. 点击 `Add model`
3. Model ID 填写 `claude-sonnet-4-6`
4. Display name 留空
5. `Offer 1M-context variant` 保持关闭；
6. Tier alias 选择 `sonnet`
7. 只有这一个模型时，`Default for tier` 可以保持关闭。

![image-20260915122418013](/note/img/T001/image-20260915122418013.png)

这里咱们虽然这里填写的是 `claude-sonnet-4-6`，但是实际调用的并不是 Claude Sonnet。DeepSeek 官方会把所有以 `claude-sonnet` 开头的模型名映射到 `deepseek-flash`。

配置完成后，再点击 `Test connection`。

如果页面显示类似下面的绿色结果，就说明地址、API Key、鉴权方式和模型映射都已经验证成功：

![image-20260915122447286](/note/img/T001/image-20260915122447286.png)

最后点击 **Apply Changes**。

这就表示把配置应用到当前电脑，并让 APP 使用新配置重新启动。

![image-20260915120347641](/note/img/T001/image-20260915120347641.png)

> 你可能还会看到有类似 `Export` 的提示。
>
> 这玩意主要 是给企业设备管理系统导出 `.mobileconfig`、`.reg` 等部署文件。个人电脑本地使用时，不需要导出，直接点击 `Apply Changes` 即可。

### 第四步：进入 Code

APP 重新打开后，你可能会看到 `Chat`、`Cowork` 和 `Code` 等不同入口。

![image-20260915122554832](/note/img/T001/image-20260915122554832.png)

它们的区别可以简单理解为：

- `Chat` 对应 **普通对话、问答**
- `Cowork` 对应 **在独立环境中执行较长任务**
- Code 对应 **围绕本地文件夹执行编程与文件任务**

这里，咱们主要使用 **Code** 就可以

打开 `Code` 后，咱们就得做点功能验证了，首先创建一个文件夹，比如我叫他：`claude-code-practice`

然后在输入框附近完成四个选择：

1. Environment 选择 `Local`；
2. 点击 `Select folder`，选择刚刚创建的 `claude-code-practice`；
   ![image-20260915122752948](/note/img/T001/image-20260915122752948.png)
3. 在模型下拉框中选择刚才添加的 `Claude Sonnet 4.6`，它实际映射到 `deepseek-flash`；
   ![image-20260915122823727](/note/img/T001/image-20260915122823727.png)
4. 权限模式选择 `Manual（手动模式）`。
   ![image-20260915134841318](/note/img/T001/image-20260915134841318.png)

`Manual` 对初学者最友好。模型想编辑文件或者运行命令时，APP 会先展示准备进行的操作，让你决定接受还是拒绝。

### 第五步：测试 DeepSeek

正式让 AI 读文件之前，先发送一条最简单的消息：

```text
请只回复“连接成功”。不要读取文件，不要修改文件，也不要调用任何工具。
```

![image-20260915123913995](/note/img/T001/image-20260915123913995.png)

如果 APP 正常返回“连接成功”，说明至少完成了两件事：

1. APP 可以请求你填写的 Gateway 地址；
2. DeepSeek 接受了这把 API Key，并返回了模型结果。

接着打开 DeepSeek 开放平台的用量或账单页面，确认刚才出现了一次新的 API 调用。

![image-20260915124038539](/note/img/T001/image-20260915124038539.png)

那么到这里，恭喜你，咱们已经完成了 Claude Code + DeepSeek 的配置啦～

## Claude Code 使用技巧

配置成功，只能说明咱们已经把 Claude Code APP 和 DeepSeek 连接起来了。

但是对于第一次使用的同学来说，接下来肯定还会有一堆问题：

- 怎么让它读取电脑里面的文件？
- 怎么让它帮咱们修改文件？
- 它准备修改的时候，咱们应该看什么？
- 如果它理解错了，怎么让它停下来？
- `Manual`、`Accept edits` 和 `Plan` 到底应该怎么选？

所以下面咱们先不做什么复杂的项目，就用刚才创建的 `claude-code-practice` 文件夹，把 Claude Code APP 最常用的几个操作体验一遍。

### 第一个技巧：使用 `@`，明确告诉它要读取哪个文件

首先，在 `claude-code-practice` 文件夹中创建一个 `notes.md` 文件。

内容可以随便写，比如：

```text
你好，我是程序员 Sunday。

请帮我安排一下本周的学习计划：

- 周一到周五：学习《Agent 大模型 0 ～ 1 系统课》
- 周六到周日：准备训练营和跳槽
```

然后回到 Claude Code APP，在输入框中输入 `@`。

这时，APP 会列出当前项目目录中的文件。

![image-20260915124604049](/note/img/T001/image-20260915124604049.png)

选择 `notes.md`，然后发送：

```text
请读取 @notes.md。

告诉我这份笔记安排了哪几件事。
这一步只读取，不要修改任何文件。
```

如果它能够准确说出工作日和周末的两项安排，就说明 Claude Code 已经成功读取到了咱们电脑里的真实文件。

![image-20260915134448985](/note/img/T001/image-20260915134448985.png)

`@` 的作用，就是把一个具体文件明确交给 Claude Code。

以后项目中的文件越来越多时，咱们可以直接输入 `@文件名`，让它把注意力放在指定文件上。一次任务涉及多个文件，也可以在同一条消息中引用多个文件。

### 第二个技巧：把任务一次说清楚

Claude Code 能不能做好一件事，和咱们怎样描述任务有很大的关系。

一条实用的任务说明，最好包含四部分：

1. **材料**：它应该读取哪些文件；
2. **目标**：希望它完成什么事情；
3. **范围**：哪些内容允许修改，哪些不能动；
4. **结果**：最终应该得到什么文件或者效果。

比如，咱们现在想把笔记整理成一份学习计划，就可以这样说：

```text
请读取 @notes.md，并在当前目录中创建 learning-plan.md。

要求：
1. 按照工作日和周末整理学习安排；
2. 使用 Markdown 格式；
3. 每项安排后面增加一个可以勾选的任务框；
4. 只创建 learning-plan.md，不要修改 notes.md；
5. 修改前先告诉我你准备做什么。
```

这段话并不复杂，但是材料、目标、范围和最终结果都说清楚了。

Claude Code 接受到这个任务之后，就会执行对应的操作

![image-20260915140853406](/note/img/T001/image-20260915140853406.png)

同时会创建出 `learning-plan.md` 文件

![image-20260915140942100](/note/img/T001/image-20260915140942100.png)

### 第三个技巧：先看清楚它准备做什么，再点击允许

如果咱们选择的是 `Manual`，Claude Code 准备创建 `learning-plan.md` 时，不会直接修改电脑里的文件，而是会先弹出操作申请。

![image-20260915141037789](/note/img/T001/image-20260915141037789.png)

这个时候先别急着点击允许，至少检查三个地方：

1. 它准备操作的文件，是不是 `learning-plan.md`；
2. 它执行的是创建还是修改，有没有碰到 `notes.md`；
3. 它准备写入的内容，是否符合咱们刚才提出的要求。

确认没有问题以后，再点击接受。

如果文件名不对、修改范围超出了要求，直接拒绝，然后在输入框中告诉它哪里需要调整。

### 第四个技巧：学会看 Diff，不要只看它说“已经完成”

文件修改完成以后，Claude Code 通常会显示类似 `+12 -1` 的变化统计。

![image-20260915141134593](/note/img/T001/image-20260915141134593.png)

点击这个位置，就可以打开 Diff，也就是文件修改前后的对比。

Diff 里面一般会用绿色表示新增的内容，用红色表示删除的内容。

咱们也不需要一开始就看懂所有代码，先检查几个最直观的问题就可以：

- 修改的是不是正确的文件；
- 新增的内容是不是咱们想要的；
- 有没有误删原来的内容；
- 有没有顺手修改任务范围之外的文件。

如果结果不满意，可以直接继续告诉它：

```text
刚才生成的内容太复杂了。

请只修改 learning-plan.md：
1. 保留工作日和周末两个部分；
2. 每个部分只保留一个任务；
3. 不要修改 notes.md。
```

Claude Code 会记住当前会话前面的内容，一轮一轮地调整结果。

### 第五个技巧：根据任务选择权限模式

输入框旁边的权限模式，决定了 Claude Code 在执行操作之前，需要向咱们确认到什么程度。

![image-20260915141213403](/note/img/T001/image-20260915141213403.png)

如果你是第一次使用，建议先选择 `Manual`。Claude Code 每次准备修改文件或者运行命令，都会先把要做的事情展示出来，等你确认以后再继续。这样虽然会多点几次按钮，但你可以清楚看到它做了什么，尤其适合刚开始练习、处理重要目录，或者任务范围还没有说清楚的时候。

等你熟悉了文件修改和 Diff，可以尝试 `Accept edits`。普通的文件编辑会直接应用，你可以等任务完成后再集中检查修改结果，遇到其他需要授权的命令，Claude Code 仍然可能停下来询问。它更适合目标明确、修改范围可控的任务。

如果任务比较复杂，你还没有决定具体怎么改，可以切换到 `Plan`。Claude Code 会先读取文件、分析问题并给出执行方案，暂时不会修改源文件。等方案确认以后，再切换到 `Manual` 或 `Accept edits` 开始执行。

在最初的使用中，咱们主要掌握这三个模式就够了。

菜单中第四个 `Bypass permissions` 需要额外开启，它会跳过操作确认，不适合作为最开始时候使用时的默认选项。

### 第六个技巧：打断会话

Claude Code 开始执行以后，咱们不需要一直等到它做完。

如果发现它读取了错误的文件、准备做多余的事情，或者对任务的理解明显不对，可以直接点击停止按钮。

![image-20260915141339553](/note/img/T001/image-20260915141339553.png)

也可以在它运行时输入新的要求，让它停下当前方向并按照新的说明继续。

不要担心打断会浪费花掉的 Token。

及时纠正，通常比等它完成一大堆错误修改以后再返工更省时间和钱。

中断以后，仍然要检查 Diff 和真实文件，因为停止操作并不代表之前已经完成的修改会自动消失。

### 第七个技巧：一个会话尽量只处理一个连续任务

Claude Code 左侧显示的每一条记录，都可以理解成一个独立会话。它会记住当前会话中读过的文件、提出过的要求和已经完成的修改。

如果你还在继续调整这份学习计划，就留在当前会话中沟通。这样不需要每次重新解释背景。

如果你准备开始一件完全不同的事情，比如检查另一个项目、分析一份新文档，或者处理一个新的需求，就可以点击 `New` 创建新会话。

![image-20260915141442091](/note/img/T001/image-20260915141442091.png)

这样做有两个好处：

1. 新任务不会被前面无关的对话干扰；
2. 每个会话的名字和目标更清楚，以后想继续时更容易找到。

所以，咱们可以记住一个很简单的原则：同一个目标，在原会话中继续。换了一个目标任务，就新建会话。

## 总结

到这里，咱们就已经完成了 Claude Code APP 和 DeepSeek 的连接。

并且了解了一些 Claude Code APP 的基本使用

这些功能看起来并不复杂，但它们已经构成了日常使用 Claude Code 最基本的工作流程：**告诉它要看什么，说清楚要做什么，检查它准备怎么做，最后验收真实结果。**

等这些基本操作用熟以后，咱们再去研究 `CLAUDE.md`、Skill、MCP、Git 工作流和自动化任务，就会容易很多啦。

到时候看大家的需求，如果有需要的话那么到时候咱们再写一篇更加深入的 Claude Code 深入教程～

