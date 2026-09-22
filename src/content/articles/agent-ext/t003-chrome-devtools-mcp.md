---
title: "让 Codex 帮你检查网页：Chrome DevTools MCP 完整教程"
description: "教你安装并连接 Chrome DevTools MCP；让 Codex 打开网页并录制性能数据；查看 Console 和 Network；识别慢资源和明显报错；理解浏览器权限与调试边界。"
category: "agent-ext"
module: "tutorial"
qnum: "T003"
date: 2026-09-16
---
大家好，我是 Sunday。

昨天那篇 Codex MCP 的文章发出去以后，有位同学在留言区问了我一个问题：

> Playwright 和 Codex 默认的 Computer Use，有啥区别？

这个问题问得挺好。

因为昨天咱们做的事情，确实很容易让人产生这种感觉。

无论是 Playwright MCP，还是 Codex 自带的浏览器能力，好像都是打开网页、找到按钮、点一下，再把结果告诉我。

如果 MCP 只是换一种方式帮我点网页，那我为什么还要专门装它？

所以今天，我准备换一个更接近真实开发的场景。

假设你做了一个网页。

页面能打开，看起来也没崩。但是点击“加载学习清单”以后，它一直停在“正在加载”。首屏的图片还会突然把下面的内容顶下去。

![故障页面](/note/img/T003/01-故障页面.png)

遇到这种问题，光会点击按钮就不够了。

你得打开浏览器开发者工具，看看 Console 有没有报错，Network 里哪一个请求失败了，响应返回了什么。页面如果加载得慢，还得再录一段 Performance，看看时间到底花在了哪里。

以前这些事情，都得咱们自己一项项查。

现在可以把浏览器里的这些证据，直接交给 Codex。

今天咱们就来试一下 **Chrome DevTools MCP**。

## Chrome DevTools MCP 到底是干什么的？

Chrome DevTools MCP 是 Chrome DevTools 团队开源的一个项目。

它可以把咱们平时在 Chrome 开发者工具里看到的内容，提供给 Codex。比如：

- Console 里出现了什么报错；
- 页面发出了哪些网络请求；
- 某个请求为什么返回 404；
- 页面加载过程中，哪些元素发生了位移；
- 一次性能记录里的 LCP、CLS 等数据到底怎么样。

项目地址在这里：

https://github.com/ChromeDevTools/chrome-devtools-mcp

[配图建议：Chrome DevTools MCP 的 GitHub 首页，框出项目名称、ChromeDevTools 组织与简介]

看到这里，大家应该已经能感受到它和昨天 Playwright MCP 的区别了。

Playwright 更擅长“替我操作这个网页”。Chrome DevTools MCP 更擅长“替我检查这个网页为什么有问题”。

两者的能力会有重叠。Chrome DevTools MCP 也能点击按钮，Playwright 也能读取 Console 和网络请求。真正决定咱们怎么选的，是这次任务最需要什么。

如果我要自动填写表单、反复执行一段网页流程，我会先想到 Playwright。

如果我要查 Console、Network 和页面性能，我会先想到 Chrome DevTools MCP。

如果任务还要离开浏览器，在多个桌面软件之间点击和输入，那么 Codex 的 Computer Use 会更顺手。

不需要争谁更强。工具是跟着任务走的。

## 安装之前，先检查两个东西

Chrome DevTools MCP 会通过 `npx` 启动，所以电脑里需要有 Node.js。

先打开终端，分别运行：

```bash
node -v
npx -v
```

只要两条命令都能正常返回版本号，就可以继续。

官方目前要求使用 Node.js 的 LTS 版本，同时需要安装当前稳定版或更新版本的 Google Chrome。这篇文章实测时使用的是 Node.js 20.19.5、Google Chrome 154 和 Chrome DevTools MCP 1.9.0。

版本以后肯定会变，大家不需要和我一模一样。Node 太旧的话，直接去 Node.js 官网安装当前 LTS 版本就行。

另外，Chrome DevTools MCP 官方保证支持的是 Google Chrome 和 Chrome for Testing。其他 Chromium 浏览器有可能也能运行，但第一次练习，我建议直接用 Chrome，少给自己增加一个不确定因素。

## 把 Chrome DevTools MCP 接进 Codex

打开 Codex APP 的设置，搜索 `MCP`，找到添加 MCP Server 的入口。

[配图建议：Codex 设置中的 MCP 页面，框出“添加 MCP Server”]

进入配置页面以后，选择 `STDIO`。

然后按照下面填写：

- Name：`chrome-devtools`
- Transport：`STDIO`
- Command：`npx`
- Arguments：`-y`、`chrome-devtools-mcp@latest`、`--isolated`、`--no-usage-statistics`、`--no-performance-crux`

[配图建议：完整配置表单，确保五个 Arguments 是五个独立参数]

如果你的版本只有一个完整命令输入框，就填：

```bash
npx -y chrome-devtools-mcp@latest --isolated --no-usage-statistics --no-performance-crux
```

这里真正负责启动 MCP 的，是前面两部分：

```bash
npx -y chrome-devtools-mcp@latest
```

`npx` 负责找到并运行这个 npm 软件包，`-y` 表示遇到下载确认时直接同意，`chrome-devtools-mcp@latest` 是咱们要启动的 MCP Server。

后面的三个参数，是我这次为了练习主动加上的。

`--isolated` 会使用临时的浏览器环境。这样它不会直接使用咱们平时登录各种账号的 Chrome Profile，关闭以后，里面的 Cookie 和存储数据也不会继续保留。

`--no-usage-statistics` 用来关闭这个 MCP 自己的使用统计。

`--no-performance-crux` 会关闭性能分析时对 CrUX 真实用户体验数据的查询。咱们今天检查的是本地练习网页，本来也没有线上真实用户数据。

这两个 `no` 参数不是启动所必需的。我把它们写出来，是希望第一次练习时，数据范围尽量简单、清楚。

Windows 如果不能直接运行 `npx`，可以把 Command 改成 `cmd`，Arguments 依次填写：

```text
/c
npx
-y
chrome-devtools-mcp@latest
--isolated
--no-usage-statistics
--no-performance-crux
```

配置完成以后，点击添加或保存。

我这个版本会重新回到 Codex 对话框，然后出现一次 `plugin create` 调用。它做的是把刚才填写的配置真正写进 Codex。确认调用完成以后，重新打开 Codex，或者新建一个任务。

[配图建议：Codex 对话里的 plugin create 调用完成状态]

为什么我建议新建任务？

因为 Codex 会在任务开始时加载当前可以使用的工具。MCP 刚刚装好，老任务里不一定能立刻看到新工具。新建任务以后再验证，能少绕很多弯路。

## 先确认 Codex 真的调用到了它

MCP 列表里出现一个名字，只能说明配置已经保存。要确认它真的能用，还得让 Codex 调用一次。

可以先发下面这段提示词：

```text
这次检查只使用名称为 chrome-devtools 的 MCP Server。

请打开：
https://developers.chrome.com

录制一次页面加载的性能数据，然后告诉我：

1. 页面是否成功打开；
2. 这次记录里的 LCP 和 CLS；
3. 实际调用了哪些 chrome-devtools MCP 工具。

不要修改任何文件，也不要使用 Codex 内置浏览器、Computer Use、Playwright 或 Shell 代替。
```

第一次真正调用工具时，Chrome DevTools MCP 才会启动一个 Chrome 窗口。只是在 Codex 里把它连接成功，浏览器不会自己弹出来。

如果 Codex 打开页面、录制了 Trace，并且调用记录里能看到 `chrome-devtools` 提供的工具，这条链路就算跑通了。

[配图建议：Codex 调用 new_page、performance_start_trace 等工具的记录]

这里让 Codex 最后列出工具名称，不是为了显得专业。

同一个任务，Codex 可能用内置浏览器完成，也可能调用刚安装的 MCP。平时只看结果就够了；但咱们现在是在验证安装，必须知道它到底走了哪条路。

## 别急着让 Codex 改代码，先把问题查清楚

为了演示，我在本地准备了一个故障页面。

页面上只有一个“加载学习清单”的按钮。点击以后，它会一直停在“正在加载”。这是我为了教程预设的问题，不是真实线上事故。

大家练习时可以直接换成自己的本地项目地址。不要照抄我的 `127.0.0.1` 地址，因为这个地址只在我的电脑上有效。

我给 Codex 的第一段提示词是：

```text
这次只使用 chrome-devtools MCP 检查网页，不要先修改代码。

请打开：
http://127.0.0.1:4173

然后完成下面的检查：

1. 点击“加载学习清单”；
2. 观察页面最终停在什么状态；
3. 检查 Console 里的 error，并保留调用栈；
4. 检查这次点击产生的 Network 请求，重点查看失败请求的 URL、状态码和响应内容；
5. 把“页面现象—控制台报错—失败请求”串成一条证据链；
6. 先给出最可能的原因，不要修改任何文件；
7. 最后列出本次实际调用的 chrome-devtools MCP 工具。
```

我特意加了一句：**不要先修改代码。**

因为 AI 编程里有一个非常常见的问题。

你跟 AI 说“按钮点了没反应，帮我修一下”，它可能直接去搜索代码，看到一个可疑位置就开始改。

有时候能改对，有时候只是碰巧把表面现象盖住了。改完以后，咱们甚至不知道问题原来发生在哪。

而这段提示词要求它先复现，再找证据。

在我这次实际检查里，页面停在了“正在加载”。Console 里出现了资源 404 和一个没有处理的 Promise 异常，调用栈指向页面脚本。

继续看 Network，真正失败的请求也找到了：

```text
GET /api/course
Status: 404
```

它的响应内容是：

```json
{
  "error": "Not found",
  "path": "/api/course"
}
```

到这一步，咱们已经不是在猜“可能接口有问题”了。

页面点击以后请求了 `/api/course`，服务端明确返回 404。前端代码还继续把错误响应当作正常数据使用，于是又触发了后面的异常，加载状态也一直没有恢复。

这条链路就很清楚：

> 按钮一直加载，是页面现象；Promise 异常，是代码执行结果；`/api/course` 返回 404，才是需要继续往项目里追的直接证据。

## 让 Codex 修复，然后重新验证

问题查清楚以后，才轮到修改。

这一次，Chrome DevTools MCP 负责提供浏览器证据，Codex 再使用自己的文件能力检查当前项目。

我会继续告诉它：

```text
根据刚才得到的浏览器证据，检查当前项目里“加载学习清单”对应的代码。

请完成下面的工作：

1. 找到请求地址与服务端路由不一致的位置；
2. 修正请求地址；
3. 补上 response.ok 检查；
4. 在使用 data.items 之前确认它确实是数组；
5. 不要修改与这个问题无关的内容；
6. 修改完成后，重新使用 chrome-devtools MCP 打开页面并点击按钮；
7. 再次检查页面结果、Console 和 Network，确认问题真的消失。
```

为什么除了把 `/api/course` 改成正确地址，还要检查 `response.ok` 和 `data.items`？

因为只改地址，解决的是今天这一次拼写问题。

下次接口因为权限、服务异常或者网关问题返回错误时，前端仍然可能把错误 JSON 当成正常列表继续处理。真正完整的修复，应该让失败状态能够被识别，让返回数据在使用之前经过最基本的检查。

为了让前后对照更稳定，我在演示页里预先准备了一个对照版本。重新检查以后，按钮显示“已加载 3 项”，Network 里的 `/api/courses` 返回 200，Console 中也没有新的报错。

![对照页面](/note/img/T003/02-对照页面.png)

到这里，这个问题才算闭环。

AI 说“已经修复”不算证据。页面行为、网络状态和控制台结果都重新检查过，才算。

## 再往前一步：让 Codex 检查页面性能

功能正常，只能说明网页能用。

我这个练习页还有另一个故意留下的问题：首屏大图会晚一点出现，并且出现时会把下面的卡片往下顶。

如果只凭肉眼，我大概会说一句：“图片加载得有点慢，页面还抖了一下。”

但是这两个现象是不是同一个原因？图片有没有拖慢 LCP？页面到底移动了多少？这些都不能靠感觉回答。

我让 Codex 继续检查：

```text
继续只使用 chrome-devtools MCP 检查当前页面的加载性能。

请完成下面的工作：

1. 重新加载页面并录制一次 Performance Trace；
2. 告诉我这次记录中的 LCP 元素是谁，不要只给一个数字；
3. 检查是否发生 CLS，以及哪些元素发生了移动；
4. 找出首屏图片的资源耗时，并区分等待响应和下载时间；
5. 把能够确认的事实、可能原因和优化建议分开写；
6. 如果现有证据不能证明某个结论，请直接说明不能证明；
7. 不要修改代码。
```

这里面最关键的一句，是“告诉我 LCP 元素是谁”。

很多人看到一张图片加载得慢，就会直接得出结论：LCP 肯定是这张图片拖慢的。

但我这次实际录制出来的结果，并不是这样。

这次 Trace 里的 LCP 是 570ms，LCP 元素是页面标题，也就是那个 `H1`。首屏图片从发出请求到结束大约花了 1.6 秒，但它并不是这次记录里的 LCP 元素。

所以，我可以确认图片资源响应得慢，却不能拿这次 LCP 数据证明“图片拖慢了 LCP”。

反而是 CLS 的证据更清楚。

这次记录里的 CLS 是 0.084。Chrome DevTools MCP 继续分析以后，指出发生位移的是图片下面的内容区域，可能的直接原因是这张图片没有预留尺寸。

这个解释和页面现象能对上：浏览器一开始不知道图片到底有多高，先把下面的内容排上来；等图片加载完成，再腾出位置，于是下面的内容被顶了下去。

对照版给图片补上了宽高，并去掉了预设延迟。重新录制以后，这次 CLS 变成了 0.00，图片资源耗时大约 11ms。

不过这里我不会把两次 LCP 的差异直接写成优化成果。

一方面，两次记录里的 LCP 元素都是标题；另一方面，本地单次测试本身就会受到缓存、机器状态和运行时机影响。真要判断性能优化是否稳定，应该保持环境一致，多测几次，再比较同一个指标和同一个元素。

这也是我觉得 Chrome DevTools MCP 真正有用的地方。

它不是只甩给咱们几个分数，而是可以继续往下追：**这个分数对应谁，哪个元素发生了位移，哪一个请求在等待，现有证据到底能支持什么结论。**

LCP、CLS、INP 这些名字第一次看会有点绕。初学时可以先这样理解：

- LCP 关心页面主要内容多久出现在用户眼前；
- CLS 关心页面加载时会不会突然乱跳；
- INP 关心用户点击、输入以后，页面多久给出下一次画面反馈。

这次演示记录了页面加载，没有形成足够的交互样本，所以不能用它判断 INP。别为了让报告看起来完整，硬给一个不存在的结论。

## 我常用的三种提问方式

把工具装好只是第一步。真正决定结果的，还是咱们怎么描述任务。

如果网页功能不正常，我会这样问：

```text
请使用 chrome-devtools MCP 复现这个问题。
先观察页面结果，再检查 Console 和相关 Network 请求。
把现象、报错、失败请求与响应内容串起来。
在证据不足时不要修改代码，也不要猜测根因。
```

如果网页看起来很慢，我会这样问：

```text
请使用 chrome-devtools MCP 录制一次页面加载性能。
不要只列分数，请指出 LCP 元素、主要耗时阶段、布局移动的元素和慢请求。
把实验数据与真实用户数据分开，并说明结论的限制。
```

如果已经做完优化，我会这样问：

```text
请在相同页面、视口和网络条件下重新测试。
对比修改前后的页面行为、Console、Network 和 Performance。
只把证据能够支持的变化归因于本次修改。
```

这三段提示词里反复出现的，其实是同一件事：**先让 Codex 取证，再让它判断。**

## 几个特别容易踩的坑

第一个问题，是配置已经保存，但当前任务里看不到 `chrome-devtools` 工具。

先回到 MCP 列表确认服务存在，然后彻底退出并重新打开 Codex，再新建一个任务。不要在安装之前打开的老任务里反复试。

第二个问题，是终端能运行 `npx`，Codex 却提示找不到。

Codex 启动时读取的环境可能还是旧的。刚装完 Node.js 时，先彻底重启 APP。如果还不行，在终端执行 `which npx`，把返回的完整路径填到 Command 里。

第三个问题，是 MCP 显示连接成功，却没有出现 Chrome 窗口。

这不一定是错误。官方说明里提到，连接完成并不会自动打开浏览器。等 Codex 第一次调用 `new_page` 或其他需要浏览器的工具时，Chrome 才会启动。

第四个问题，是出现 `Target closed`。

这通常意味着 Chrome 没有正常启动。先关闭已有的 Chrome 实例，确认安装的是当前稳定版 Chrome，再试一次。官方排错文档也建议先运行下面这条命令，确认 MCP 本身能够启动：

```bash
npx -y chrome-devtools-mcp@latest --help
```

如果这条命令都不能正常显示帮助信息，就先解决 Node、npm 或 npx 的问题，不用急着在 Codex 里来回改配置。

## 最后还有一个权限问题

Chrome DevTools MCP 能检查浏览器，自然也能看到这个浏览器实例中的页面内容、请求和调试信息。

所以我今天使用了 `--isolated`，练习页里也没有登录信息、订单和真实业务数据。

以后调试自己的项目，我也建议先使用测试账号和测试环境。不要一边登录着公司后台、邮箱和支付页面，一边让不熟悉的浏览器工具随意检查整个 Profile。

工具能力越强，越应该先把它能接触到的数据范围想清楚。

## 写在最后

昨天咱们用 Playwright MCP 操作了一个网页。

今天换成 Chrome DevTools MCP，重点已经不是“Codex 能不能点这个按钮”，而是它点完以后，能不能继续看到 Console、Network 和 Performance 里的证据。

这也是我现在理解 MCP 的一个方式。

不要先问“我还能给 Codex 装多少个工具”。

先看自己正在做什么工作，其中哪一步 Codex 原来只能猜，哪一步需要它真正看见外部信息。

对于网页调试来说，Chrome DevTools MCP 补上的就是这双眼睛。

下次再遇到“按钮没反应”“接口怎么没数据”“页面为什么会抖”，可以先别把一张截图丢给 AI，让它凭经验猜。

让它打开网页，复现问题，把 Console、Network 和性能记录查一遍。

**能找到证据的 AI，才真正开始帮咱们调试网页。**

相关资料：

- Chrome DevTools MCP：https://github.com/ChromeDevTools/chrome-devtools-mcp
- Codex MCP 官方文档：https://developers.openai.com/codex/mcp
- LCP：https://web.dev/articles/lcp
- CLS：https://web.dev/articles/cls
- INP：https://web.dev/articles/inp

