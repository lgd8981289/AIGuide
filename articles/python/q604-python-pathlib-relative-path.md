# Python 的 pathlib 和 os.path 怎么选？相对路径究竟相对哪里？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/python/q604-python-pathlib-relative-path/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：pathlib 和 os.path 有什么区别？

🙋‍♂️ 我：一个用路径对象，一个主要用字符串函数。

🧑‍💻 面试官：Path('data/report.txt') 相对的是代码文件所在目录吗？

🙋‍♂️ 我：通常是当前工作目录。

🧑‍💻 面试官：如果用户传来一个绝对路径，拼到根目录后面，为什么根目录可能被丢掉？

> 先确定路径在哪个起点解释。把字符串拼得看起来像目录，不等于文件一定落在那个目录里。

## 面试速答（60 秒版）

pathlib 用 Path 对象表达路径操作，os.path 主要提供字符串形式的路径函数。两者都能处理常见路径需求，现有库支持 PathLike 时不必为了换风格全部重写。

相对路径通常以当前工作目录解释，和当前代码文件目录不是同一回事。程序从 IDE、终端或服务启动时，工作目录可能不同。

需要固定基准时，应该明确使用配置目录或根据 **file** 建立基准，再拼接相对路径。拼接还要注意后一个绝对路径可能替换前面的部分。

resolve 可以规范化并解析相应符号链接，但不会凭空创建文件，也不是完整权限校验。处理用户路径时，要限制允许的位置、检查规范化后的归属，并考虑符号链接和检查后再打开之间的竞争。

![相对路径，先问相对哪里](https://note.lgdsunday.club/img/Q604/01-overview-v3.webp)

## 知识点详解：路径对象不替我们决定文件根目录

### 路径操作和文件访问先分开

Path 可以组合目录、获取 suffix、name、parent，也可以调用读写与查询方法。PurePath 则只做路径结构操作，不访问文件系统。

例如 Path("data") / "report.txt" 表达组合路径，比手写斜杠更清楚；但这时还没验证文件存在。is\_file、open 等动作才需要接触实际文件系统。

os.path.join、basename 等已有代码也可以继续使用。选择取决于接口和团队习惯，不能说字符串路径天然错误，也不能因为得到一个 Path 对象就认为路径已经安全。

### 相对路径跟着当前工作目录

假设 project 下有 app.py 与 data/report.txt。你在 project 里启动，data/report.txt 可以找到；从别的目录启动相同脚本，默认相对路径可能指向另一个地方。

如果文件应固定在脚本目录旁，可以用 Path(**file**).resolve().parent 建立基准。如果属于可部署配置或用户数据，则更适合通过配置明确根目录，而不是假设源码旁总能写。

Notebook、交互解释器或特殊加载环境里不一定有普通 **file**，也要按实际入口提供基准。

### 后面的绝对路径，不再是普通子路径

下面使用 PurePosixPath 展示路径组合，不需要真的创建这些文件。

#### Python

```python
from pathlib import PurePosixPath

root = PurePosixPath("/srv/reports")
print(root / "today.txt")   # /srv/reports/today.txt
print(root / "/tmp/x.txt")  # /tmp/x.txt
print((root / "today.txt").name)  # today.txt
```

这是 POSIX 路径对照，Windows 盘符与根路径还有相应规则。用户输入若允许绝对路径，简单 root / user\_path 并不能保证仍在 root 中。

#### TypeScript（Node 路径语义对照）

```typescript
import path from "node:path";
const root = "/srv/reports";
console.log(path.posix.resolve(root, "today.txt"));
console.log(path.posix.resolve(root, "/tmp/x.txt")); // /tmp/x.txt
```

Node join 和 resolve 的行为不完全相同，此处特意选 posix.resolve 对照绝对部分影响，不能把所有叫 join 的 API 都认为有同一规则。

![绝对后段，会换掉原基准](https://note.lgdsunday.club/img/Q604/02-absolute.webp)

### 安全归属检查，不能只比较字符串前缀

检查 /srv/reports-evil/x 是否在 /srv/reports 内，用 startswith 会出错，因为文本前缀相同不代表目录层级相同。可以规范化基准和候选，再用相应路径归属操作检查。

涉及真实文件还要考虑符号链接。resolve 可以影响判断，但在检查到打开之间，路径仍可能被替换；高风险文件访问需要按平台使用更强的目录句柄和打开方式，不能给两行判断一个绝对安全承诺。

验证时从不同工作目录启动，传入 ..、绝对路径和相似前缀目录，并在隔离临时目录里测试符号链接。先把允许读取什么、是否跟随链接讲清楚，再谈具体代码。

依据：[Python 3.11 pathlib](https://docs.python.org/3.11/library/pathlib.html)、[os.path](https://docs.python.org/3.11/library/os.path.html)、[Node path.resolve](https://nodejs.org/api/path.html#pathresolvepaths)。

![相似前缀，不是同一个目录](https://note.lgdsunday.club/img/Q604/03-boundary.webp)

## 面试官继续追问

### resolve 会创建目标目录吗？

不会。路径解析和目录创建是两种动作，存在性检查也取决于选项与后续访问。

### 路径 startswith 根目录够吗？

不够。相似前缀目录和规范化问题会让字符串判断误判，应按目录层级并结合实际文件访问边界处理。

### 为什么服务上线后找不到相对文件？

先检查工作目录、解释器环境、配置根目录和实际部署路径，不只检查代码文件是否存在。

## 面试速记卡

> - Path 是路径表达和操作接口，不是安全认证。
> - 相对路径通常基于当前工作目录。
> - 固定资源根目录应明确配置或建立基准。
> - 绝对后段可能替换原路径基准。
> - 归属检查按目录结构，仍要考虑符号链接和竞争。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
