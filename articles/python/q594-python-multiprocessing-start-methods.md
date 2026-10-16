# Python 多进程的 spawn、fork、forkserver 有什么区别？为什么进程池会启动失败？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/python/q594-python-multiprocessing-start-methods/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：Python 多进程的 spawn、fork、forkserver 怎么区分？

🙋‍♂️ 我：它们是创建子进程的不同启动方式。

🧑‍💻 面试官：为什么我把进程目标写成 lambda，spawn 下会失败？

🙋‍♂️ 我：因为它需要能被子进程定位和序列化。

🧑‍💻 面试官：换成 fork 就应该到处都能运行吗？默认方式在不同平台和版本上一直一样吗？

> 子进程从哪里开始、怎样拿到目标函数，决定了启动能否成功。别把当前机器的默认方式，当成 Python 在所有环境里的保证。

## 面试速答（60 秒版）

spawn 会启动新的解释器，重新建立运行环境，进程目标需要能被定位，参数等也要满足序列化要求。启动动作通常放在 **main** 保护里，避免子进程导入入口时再次启动子进程。

fork 从父进程状态建立子进程，但不代表父子之后共享普通对象；多线程父进程里的锁和资源状态还可能带来风险。

forkserver 则通过专门的服务进程 fork 工作子进程，减少直接从复杂父进程复制状态的问题，但仍有平台与序列化约束。

默认方式会变。Windows、macOS 和 POSIX 不同，Python 3.14 也调整了 POSIX 的默认安排。我会显式选择并记录需要的 context，用顶层可导入函数做目标，再在实际部署平台验证，不靠换个默认值掩盖代码问题。

![子进程从哪里获得环境？](https://note.lgdsunday.club/img/Q594/01-overview.webp)

## 知识点详解：启动方式决定子进程怎样获得运行环境

### spawn 要重新准备一个解释器环境

假设我们把处理函数 submit 到进程池。spawn 的子进程不会继续在父进程当前 Python 指令旁边执行，而是启动解释器，按需要重新导入模块并找到目标。

所以函数最好定义在可导入模块的顶层。lambda、局部嵌套函数，以及打不开或不可序列化的参数，可能无法按要求交给子进程。连接对象和锁也不能想当然地复制成一个可用外部资源。

入口保护同样关键。模块导入期间若在顶层立即创建子进程，子进程导入时又触发创建，就会出现递归启动或启动阶段错误。

### 用明确 context 写一个可复查入口

将下面代码保存为独立 .py 文件，从终端运行。它不适合作为“随手在交互窗口粘贴就保证成功”的进程例子。

#### Python

```python
import multiprocessing as mp

def square(value):
    return value * value

def main():
    context = mp.get_context("spawn")
    with context.Pool(2) as pool:
        print(pool.map(square, [2, 3]))  # [4, 9]

if __name__ == "__main__":
    main()
```

get\_context 让当前这组进程相关对象遵循选定方式，不必随意改变整个应用的全局默认设置。不同 context 的锁等对象也未必能交叉使用，库应该允许调用方提供 context，而不是强行替整个程序拍板。

![入口保护，避免导入时再次启动](https://note.lgdsunday.club/img/Q594/02-bootstrap.webp)

### fork 没有把普通列表变成共享内存

fork 让子进程从父进程状态出发，父子后续修改一般仍各自独立。子进程 append 一个普通列表，不会因此修改父进程看到的列表。

更麻烦的是多线程场景。fork 时只有相关执行线程延续，其他线程留下的锁状态和外部库状态可能不再适合继续使用。想用 fork 避开序列化限制，却不检查资源和线程，往往只是把启动错误换成后续卡住。

forkserver 使用一个专门服务进程来建立工作进程，父应用不直接在复杂状态下 fork。但它并不消除目标可导入、传输和资源管理的所有要求。

![fork 初始相似，后续修改各自独立](https://note.lgdsunday.club/img/Q594/03-copy.webp)

### 默认值变化，文章要把版本写清楚

macOS 从 Python 3.8 起默认使用 spawn；Windows 使用 spawn。Python 3.14 在支持的 POSIX 平台把默认方式改为 forkserver，fork 不再是任何平台的默认方式。实际程序仍可查询可用启动方法和当前配置。

#### TypeScript（Node 子进程入口对照）

```typescript
// Node.js 的 worker/child_process 使用自己的入口与消息协议。
// 下面仅表示“目标位于独立可定位模块”，并非 Python 启动上下文。
export function square(value: number): number {
  return value * value;
}
console.log(square(3));
```

没有同款 API 时不机械翻译。跨语言工程共同需要明确子执行环境的入口、数据传输和错误回传，但具体启动语义要按运行时解释。

验证时记录操作系统、Python 版本和 context。准备顶层函数、局部函数与入口未保护的对照，检查失败原因；不要把一次成功当成跨平台承诺。

依据：[Python 3.11 multiprocessing 启动方法](https://docs.python.org/3.11/library/multiprocessing.html#contexts-and-start-methods)、[Python 3.14 默认方式变化](https://docs.python.org/3.14/library/multiprocessing.html#contexts-and-start-methods)。

![启动方法，要记录平台和版本](https://note.lgdsunday.club/img/Q594/04-versions-v3.webp)

## 面试官继续追问

### fork 更快就应该默认用吗？

还要看平台、线程、资源安全和实际任务开销。不能只凭启动速度判断整体正确性。

### **main** 保护能解决所有 pickle 错误吗？

不能。它防止不合时机的重复启动；目标、参数、结果仍需符合定位和传输要求。

### 进程池能传打开的数据库连接吗？

不要默认这样做。通常让工作进程按自己的生命周期建立连接，并遵循库对多进程的说明。

## 面试速记卡

> - spawn 新建解释器，目标要能定位和传输。
> - 入口保护避免导入时重复启动进程。
> - fork 后普通对象仍不是自动共享状态。
> - 多线程父进程的 fork 需要特别谨慎。
> - 默认 context 随平台和版本变化，部署时明确记录。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
