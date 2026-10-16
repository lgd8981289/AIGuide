# Python 的 subprocess.run 和 Popen 有什么区别？为什么读取子进程输出会卡住？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/python/q600-python-subprocess-run-popen/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：subprocess.run 和 Popen 有什么区别？

🙋‍♂️ 我：run 更适合等待一个命令完成，Popen 可以自己管理执行过程。

🧑‍💻 面试官：我先读 stdout，再读 stderr，为什么子进程可能卡住？

🙋‍♂️ 我：另一个管道可能写满，子进程等人读取。

🧑‍💻 面试官：那 communicate 是否适合无限输出？命令参数从用户输入来，又该怎么避免注入？

> 子进程是否完成，除了计算速度还受管道影响。谁负责持续读取输出、谁负责超时和退出状态，要在启动前安排好。

## 面试速答（60 秒版）

subprocess.run 是常用的高层入口，启动外部程序并等待完成，适合一次性命令。Popen 更底层，适合需要自己控制通信、轮询或持续输出的场景。

stdout 和 stderr 使用 PIPE 时，都需要及时消费。只等待退出，或者先阻塞读完一路再读另一路，可能因另一管道写满而互相等待。有限输出通常可以用 communicate 同时处理两路并等待完成。

communicate 会把输出收集到内存，不适合无限或超大输出。此时要重定向文件，或设计并发持续读取。

还要检查退出码和超时。传参数列表、默认不启 shell 能减少 shell 注入风险，但程序自身的选项和路径仍要校验，不能把所有用户输入直接当可信命令。

![启动、通信、退出，分别负责](https://note.lgdsunday.club/img/Q600/01-overview-v2-v3.webp)

## 知识点详解：外部程序、输出管道和调用方怎样互相等待

### run 负责常见的一次性调用

假设我们调用一个外部转换程序，希望拿到退出码和少量输出。run 可以组织启动、等待和结果对象，check=True 让非零退出码变成异常。

下面为了可复现，只运行当前 Python 解释器的一段固定代码，不依赖机器装了其他命令。

#### Python

```python
import subprocess
import sys

result = subprocess.run(
    [sys.executable, "-c", "print('完成')"],
    capture_output=True,
    text=True,
    encoding="utf-8",
    check=True,
    timeout=5,
)
print(result.stdout.strip())  # 完成

process = subprocess.Popen(
    [sys.executable, "-c", "import sys; print('ok'); print('warn', file=sys.stderr)"],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True,
    encoding="utf-8",
)
stdout, stderr = process.communicate(timeout=5)
print(process.returncode, stdout.strip(), stderr.strip())
```

第二段使用 Popen，是为了说明通信和等待需要自己安排。正文这个固定短命令正常完成；若 communicate 超时，实际代码还应按后面说明补终止与收尾。

### 两根管道为什么会形成死锁？

管道缓冲区有限。假设父进程先 read stdout 到结束，子进程却正在大量写 stderr。stderr 没人读，写满以后子进程暂停；它不能继续完成并关闭 stdout，父进程就等不到 stdout 结束。

只调用 wait 也可能一样，子进程要先把输出写完，父进程却只等它退出。communicate 处理两路输出，避免这种常见等待关系，但不提供无限容量。

重定向到文件可以让输出不全部积累在父进程内存。如果确实需要实时展示，则安排两路读取、大小限制和退出协调，不要只在最后一次性 read。

![另一根管道写满，也会卡住](https://note.lgdsunday.club/img/Q600/02-pipes.webp)

### 超时以后，谁负责结束和读取剩余输出？

run 在常见 timeout 路径中会处理子进程终止与等待，但进程创建本身可能无法在所有平台及时中断，不能把 timeout 描述成精确墙钟上限。

Popen.communicate 超时不会替你自动杀掉子进程。常见模式是捕获 TimeoutExpired，调用 kill，再次 communicate 收集剩余输出并等待结束。是否先 terminate 再等待，以及怎样处理子进程树，要结合平台和工作内容安排。

只发 kill 而不等待和处理管道，可能留下不完整的状态与资源。任务已经对外产生的副作用也不会因杀进程自动回滚。

![communicate 超时，要继续安排收尾](https://note.lgdsunday.club/img/Q600/03-timeout-v2.webp)

### 参数列表减少 shell 解释，却不消除所有风险

不要把用户输入拼成 shell=True 的命令字符串。参数列表能避开许多 shell 元字符的解释，但如果外部程序把某个参数当作选项、脚本或路径，风险仍在。

#### TypeScript（Node execFile 对照）

```typescript
import { execFile } from "node:child_process";
execFile(
  process.execPath,
  ["-e", "console.log('完成')"],
  { timeout: 5000, encoding: "utf8" },
  (error, stdout, stderr) => {
    if (error) { console.error(error.message); return; }
    console.log(stdout.trim());
  }
);
```

Node execFile、spawn 与 Python API 的缓冲、事件和超时合同不同，本例只对应“固定程序＋参数数组”的一次调用思路。持续大输出需要按 Node 流协议消费，不能直接翻译 communicate。

验证时用一个会写 stdout 和 stderr 的可控子程序，测试非零退出、大输出与超时后的资源状态。不要在生产服务器上拿未知命令做死锁试验。

依据：[Python 3.11 subprocess](https://docs.python.org/3.11/library/subprocess.html)、[Node child\_process.execFile](https://nodejs.org/api/child_process.html#child_processexecfilefile-args-options-callback)。

![不拼 shell 字符串，参数仍要校验](https://note.lgdsunday.club/img/Q600/04-arguments.webp)

## 面试官继续追问

### communicate 为什么也可能吃掉很多内存？

它通常把捕获输出收集起来。输出无上限时，需要文件或持续流式消费和大小约束。

### Popen 超时就自动 kill 吗？

communicate 超时通常不会自动 kill，需要调用方明确终止，再等待并清理通信。

### shell=False 能保证命令安全吗？

它减少 shell 解释风险，但目标程序、参数选项、路径和权限仍必须校验。

## 面试速记卡

> - run 组织一次性启动和等待，Popen 提供更细控制。
> - PIPE 输出需要消费，不能只等进程退出。
> - communicate 适合有限输出，不是无限缓冲。
> - Popen 超时后的终止、等待和剩余输出由调用方安排。
> - 参数列表避开部分 shell 解释，仍需输入与权限检查。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
