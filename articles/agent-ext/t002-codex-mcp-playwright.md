# Codex 接入 Playwright MCP 教程：安装、调用与验证

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/agent-ext/t002-codex-mcp-playwright/) · [题库目录](../../README.md)

大家好，我是 Sunday。

用 Codex 写前端，你大概率遇到过这个场景：

改完一段样式，Codex 很笃定地告诉你「已完成，问题已修复」。你满怀期待切到浏览器，一看——版式还是乱的。

这事不能怪它写得差。真正的原因是：**从头到尾，它压根没「看见」过这个页面。**

Codex 能做的只有读文件、改文件、跑命令。页面长什么样、控制台有没有报错、点一下按钮有没有反应，它一概不知道。

想让它知道，就得给它配一个浏览器。而把浏览器接进 AI 编程工具的标准答案，就是 **MCP**（Model Context Protocol，模型上下文协议）。

这篇把三件事讲透：

1. Codex 的 MCP 到底怎么写配置（这里有个第一次配必然踩的坑）
2. 怎么把 Playwright MCP 接进去，让 Codex 真的能开浏览器
3. 装好之后能干什么，以及几个常见报错怎么解

## 先说那个坑：Codex 用的是 TOML，不是 JSON

如果你配过 Claude Desktop 或者 Cursor 的 MCP，脑子里大概已经有一份 JSON 模板了。长这样：

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

很多人（包括我）第一反应就是把这段 JSON 原样贴进 Codex，然后发现**它完全不理你**。

因为 Codex 的配置文件是 TOML 格式，路径在 `~/.codex/config.toml`。字段名和结构都要变：

| Claude Desktop / Cursor（JSON）     | Codex（TOML）                         |
| --------------------------------- | ----------------------------------- |
| `"mcpServers": { "名字": { ... } }` | `[mcp_servers.名字]`                  |
| `"command": "npx"`                | `command = "npx"`                   |
| `"args": ["a", "b"]`              | `args = ["a", "b"]`                 |
| `"env": { "K": "v" }`             | `[mcp_servers.名字.env]` 下写 `K = "v"` |

两个最容易写错的地方：

- 顶层键是 **`mcp_servers`**（下划线），不是 `mcpServers`。写成驼峰 Codex 会直接忽略这一整段。
- 一个 server 对应**一个独立的 `[mcp_servers.xxx]` 表**，不是塞进一个大对象里。

TOML 有个好处：它其实比 JSON 好读，因为每个 server 都是一段独立配置，加一个就多一段。

## 两种加法：命令行 or 手写配置

### 方式一：命令行（推荐新手）

Codex 自带 `codex mcp` 系列子命令，不用手动编辑文件：

```bash
# 添加一个 MCP server。-- 之后是启动它的命令
codex mcp add playwright -- npx -y "@playwright/mcp@latest"

# 看看都配了哪些 server
codex mcp list

# 查看某一个 server 的详情（可以加 --json）
codex mcp get playwright

# 删掉一个
codex mcp remove playwright
```

`codex mcp list` 会输出一张表，能看到每个 server 的名字、传输方式（transport）和状态。**这一步很关键**——不要配完就以为成了，一定要 list 一下确认它是 Connected，而不是 Failed。

### 方式二：手写 `~/.codex/config.toml`（推荐长期使用）

上面那份，我在**本地真实在用的配置**是这份：

```toml
[mcp_servers.playwright]
enabled = true
command = "npx"
args = ["-y", "@playwright/mcp@latest", "--isolated"]
```

就三行核心内容，但每一行都有讲究：

- `enabled = true`：显式打开。想临时停用某个 server 时改成 `false` 即可，**不必删配置**，以后想用再改回来。
- `command = "npx"` / `args = [...]`：`"npx" command + args 数组` 这套写法和 Claude Desktop、Cursor 是一致的，只有外层容器换了格式。
- `--isolated`：**让浏览器把用户数据放在内存里，不落盘。** 这是我最推荐的参数，原因有两个。一是每次会话都是干净环境，不会被上次的登录态、缓存、localStorage 干扰；二是不会在你机器上留一堆零散 profile 目录。

如果你反过来需要「记住登录状态方便反复调试」，那就把 `--isolated` 去掉。Playwright MCP 默认会保留 profile，登录一次后面就不用再登。**这是「干净」和「方便」之间的取舍，看你日常在调什么。**

配好之后，重启 Codex，再跑一次 `codex mcp list` 确认。在 Codex 的交互界面里输入 `/mcp` 也能看到每个 server 的实时状态。

## 装完之后，Codex 能做什么

Playwright MCP 接进来以后，Codex 手上就多了一整套浏览器工具。常用的有这些：

| 工具                               | 作用               |
| -------------------------------- | ---------------- |
| `browser_navigate`               | 打开一个网址           |
| `browser_snapshot`               | 抓当前页面的**可访问性快照** |
| `browser_click` / `browser_type` | 按 ref 点击、输入      |
| `browser_fill_form`              | 一次填完多个表单字段       |
| `browser_take_screenshot`        | 截图               |
| `browser_console_messages`       | 读控制台输出           |
| `browser_network_requests`       | 看网络请求            |
| `browser_evaluate`               | 在页面上执行 JS        |

这里有个设计值得单独说一句：**`browser_snapshot` 返回的不是截图，而是可访问性树的文本快照。**

为什么这么做？因为让模型「看图片」又慢又贵又不稳，而文本快照它天生就会读。官方给的数据是，一次快照大概 200～400 token，而截图方案动辄几千。所以 Playwright MCP 在默认情况下**甚至不需要视觉模型**——它只读结构，然后按快照里给出的元素引用去点。

于是整个工作流就变成了这样：

```text
你：把首页的卡片间距改大一点，改完自己看一眼对不对

Codex：改完了，我打开页面看一下
     → browser_navigate { url: "http://localhost:3000" }
     → browser_take_screenshot
     → 发现卡片没变化，检查控制台
     → browser_console_messages
     → 发现是样式被另一个类覆盖了
     → 改文件，再刷新，再截图
     → 现在对了
```

注意最后那句「现在对了」——**这是它自己验证过才说的，不是猜的。** 这一句话的质量差别，就是有没有配浏览器的差别。

## 避坑清单

这几个是实际配下来最容易卡住的地方，按出现频率排：

**1. 第一次启动就报「握手失败」**

最常见的原因不是配置写错，而是 **npx 第一次要把包下载下来**。冷启动下载会超过 Codex 默认的 10 秒启动窗口，直接就超时了。

解法：把超时调大。`startup_timeout_ms` 和 `startup_timeout_sec` 是同一个东西的两种单位，写哪个都行。

```toml
[mcp_servers.playwright]
command = "npx"
args = ["-y", "@playwright/mcp@latest", "--isolated"]
startup_timeout_sec = 30
```

**2. 报 `spawn npx ENOENT`**

说明 Codex 那个进程在 PATH 里找不到 `npx`。尤其是从桌面应用启动 Codex 时，它拿到的 PATH 和你终端里的可能不是一套。

解法：直接写绝对路径。

```toml
command = "/usr/local/bin/npx"
```

macOS 用 Homebrew 装的 Node，路径通常是 `/opt/homebrew/bin/npx`。

**3. `codex mcp list` 显示 Connected，但就是没有工具**

server 起来了，但工具没注册上。先跑 `codex mcp tools <名字>` 看工具列表是不是空的。

如果确实是空的，多半是 server 缺了环境变量或者初始化参数。**顺带提醒：`[mcp_servers.xxx.env]` 里的变量名是区分大小写的**，`GITHUB_PERSONAL_ACCESS_TOKEN` 写成 `github_personal_access_token` 就是不行。

**4. 想用 SSE / 远程 HTTP 的 server**

注意一点：Codex 对**本地 server 只支持 stdio**（就是你启动一个进程、通过标准输入输出通信这种）。如果你手上是一个 SSE 类型的 server，需要先加一层 `mcp-proxy` 之类的适配器转成 stdio。

反过来，如果是别人托管好的**远程 MCP**，Codex 是原生支持的，写 `url` 就行，还能配 OAuth：

```toml
[mcp_servers.someRemoteServer]
url = "https://example.com/mcp"
```

**5. 一个配置写错，全部 server 一起挂**

这个是 Codex 当前版本已知的行为：如果某一段配置格式有问题，可能导致所有 server 在启动时一起握手失败。排查办法是**先只留一个 server，确认能跑，再逐个加回来**。

## 最后

回头看这件事，我觉得 MCP 真正的价值不在于「多接了几个工具」，而在于它**把 AI 的验证闭环补上了**。

以前 AI 写完代码说「已完成」，你只能信或者不信。现在它能自己打开页面、自己截图、自己读控制台报错、自己回去改。你从「帮它检查」变成了「抽查」。

这一篇讲的是 Playwright MCP——解决「看得见页面」。下一篇我会接着写 **Chrome DevTools MCP**，解决「看得见性能、网络和渲染细节」。两个配合起来，前端这块的验收基本就能交出去了。

如果你也配好了，欢迎在评论区说说你踩到的坑，我看到都会回。

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
