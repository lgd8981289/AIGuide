---
title: "从0到1跑通 Codex MCP，这次把安装和调用讲透了！"
description: "教你理解 MCP、MCP Client、MCP Server 和 Tool 的关系；在 Codex APP 中接入 Playwright MCP；让 Codex 打开 TodoMVC、添加待办并完成点击；"
category: "agent-ext"
module: "tutorial"
qnum: "T002"
date: 2026-09-16
---
大家好，我是 Sunday。

昨天有位同学问我，如何在 Codex 里面安装 MCP Server。

然后，我给他远程演示了一遍。

但是我觉得可能还会有其他同学对这种安装不太熟悉。

因此，今天咱们就通过一个比较常用的 `Playwright MCP` 来为大家系统的看下 `Codex` 安装 `MCP` 的全过程～

## 什么是 Playwright MCP？

从名字也能看出来 `Playwright` 就是个 `MCP` 

![image-20260916143232598](/note/img/T002/image-20260916143232598.png)

Playwright 属于微软开源的，本来就是一个浏览器自动化工具，可以 **代替人去打开网页、读取页面、输入文字和点击按钮。**

![image-20260916143351754](/note/img/T002/image-20260916143351754.png)

而 Playwright MCP 做的事情，就是把这些操作交给 Codex。直接让 Codex 代替人去执行：打开网页、操作网页的操作。

接入以后，咱们就不需要自己写自动化脚本，只要告诉 Codex 想在网页里完成什么，它就可以调用 Playwright 提供的工具一步步操作。

今天使用的 [TodoMVC](https://demo.playwright.dev/todomvc)，又刚好是 Playwright 官方提供的演示页面。不需要登录，也没有啥真实业务数据。就算操作错了，刷新页面重新来一次就行。

![image-20260916143540940](/note/img/T002/image-20260916143540940.png)

不过，Playwright MCP 并不会随着 Codex 一起装进电脑。要让 Codex 调用它，得先在电脑上把这个 MCP Server 启动起来。

并且，Playwright MCP 得配合 `Node` 使用，没有的话，可以先自己安装下。Node 的安装比较基础，这里就不说了

## 把 Playwright 装进 Codex

接下来打开 Codex 的设置，搜索 `MCP`，找到 **添加 MCP 服务器**

![image-20260916145043417](/note/img/T002/image-20260916145043417.png)

进入 MCP Server 的配置页面。

按照下面的方式进行配置：

![image-20260916154910549](/note/img/T002/image-20260916154910549.png)

> 方便大家复制：
>
> - 名称：`playwright`
> - 类型：`STDIO`
> - 启动命令：`npx`
> - 参数：`-y、@playwright/mcp@latest、--isolated`
>

这几个配置项，可以把它理解成：**告诉 Codex 去哪里找到 Playwright MCP，以及应该怎样把它启动起来。**

### 名称：playwright

这是给 MCP Server 起的名字，主要是给自己看的。

配置完成以后，Codex 的 MCP 列表和工具调用记录里，都会显示这个名字。它原则上可以改成别的，但直接使用 `playwright` 最清楚。

### 类型：STDIO

Transport 表示 Codex 和 MCP Server 采用什么方式通信。

`STDIO` 是“标准输入和标准输出”的缩写。简单理解就是：Codex 在电脑上启动 Playwright MCP，然后双方通过本地进程传递消息。

这种配置方式是运行本地 MCP Server 时常见的连接方式。

### 启动命令：npx

Command 是 Codex 真正需要运行的命令。

`npx` 是 Node.js 提供的工具。它可以找到并启动一个 npm 软件包，没有安装时也可以先下载再运行。

所以这里填写 `npx`，就是让 Codex 通过 Node.js 启动 Playwright MCP。

### 参数

这里的参数比较多。

咱们一个个来看。

如果是做过前端开发的同学，在使用  `npx` 的时候，第一次运行某个软件包时候，应该都有见过类似这个样的提示（网上找的图）：

![Using apt Commands in Linux [Ultimate Guide]](/note/img/T002/apt-commands-examples-10-20260916150347912.png)

一般咱们是不是都输入一个 `Y`

那么，加上 `-y`，相当于提前回答“同意”，避免 Playwright MCP 卡在确认提示上。

其他的配置参数，比如：

- `@playwright/mcp@latest` 这是需要启动的软件包名称。`@playwright/mcp` 是 Playwright MCP 在 npm 中的包名，`@latest` 表示使用当前发布的最新版本。
- `--isolated` 这个参数会让 Playwright 使用一个临时、隔离的浏览器环境。

把这些内容连起来，其实就是一条完整命令：

```shell
npx -y @playwright/mcp@latest --isolated
```

翻译成人话就是：

> 使用 `npx` 启动最新版 Playwright MCP。如果需要下载就直接同意，并且把浏览器运行在一个临时的隔离环境里。

其他的配置参数还有挺多的，不一个个说了，感兴趣的可以看 github 的文档：`https://github.com/microsoft/playwright-mcp`

![image-20260916150601395](/note/img/T002/image-20260916150601395.png)

配置填完，点击 **保存**，他会自动重启  Codex 。

![image-20260916154938184](/note/img/T002/image-20260916154938184.png)

Codex 重新打开以后，先回到 MCP 设置，应该就可以看到咱们刚才添加的 `playwright` 了

![image-20260916145618808](/note/img/T002/image-20260916145618808.png)

那么看到这个页面，基本上就 OK 了

大家也可以直接在 `codex` 的输入框里输入 `/mcp` ，这样可以看到所有可以调用的 `MCP Server`，就比较 “专业”。。。

![image-20260916150745357](/note/img/T002/image-20260916150745357.png)

然后咱们就来测试一下。

为了方便咱们测试，我这里的提示词写的复杂了一点，主要是给大家把整个流程展示出来：

```text
这次演示必须只使用名称为 playwright 的 MCP Server。

禁止使用 Codex 内置浏览器、Computer Use、Shell、curl 或其他浏览器工具。

请打开：https://demo.playwright.dev/todomvc

然后依次完成下面的操作：

1. 添加“学习 MCP”
2. 添加“完成公众号排版”
3. 添加“检查文章标题”
4. 勾选“学习 MCP”
5. 告诉我页面上还剩几项未完成

为了方便录制，请遵守下面的要求：

- 每一步都单独调用一次 Playwright MCP 工具；
- 不要使用 browser\_run\_code\_unsafe 合并执行；
- 打开页面后等待 3 秒；
- 输入文字时使用 browser\_type，并设置 slowly=true；
- 每添加一项待办，都调用 browser\_wait\_for 等待 2 秒；
- 点击复选框前等待 2 秒；
- 完成以后等待 5 秒；
- 不要关闭浏览器；
- 最后列出本次实际调用的 Playwright MCP 工具名称。
```

回车之后，Codex 的思考过程如下：

![image-20260916155352407](/note/img/T002/image-20260916155352407.png)

然后咱们来看看 Codex 的自动执行结果：

「插入视频」

## 写在最后

这篇文章写到这里，昨天那位同学问我的问题，应该也算讲清楚了。

在 Codex 里面安装一个 MCP Server，并没有想象中那么复杂。

就拿今天的 Playwright MCP 来说，官方给咱们的其实就是一条启动命令：

```shell
npx -y @playwright/mcp@latest --isolated
```

咱们要做的，就是看懂这条命令，把启动程序和后面的参数分别填进 Codex，然后保存、重启，再找一个真实任务试一下。

以后遇到其他 MCP，也可以从这里开始。

先去它的官方仓库看看怎么启动、需要什么环境。如果它和 Playwright 一样，采用本地 `STDIO` 的方式运行，那就找到启动命令，把 Command 和 Arguments 拆开填进 Codex。

如果官方提供的是一个远程地址，那配置方式会不一样，但思路还是一样的：**先弄清楚这个 MCP 怎么连接，再把它需要的信息交给 Codex。**


