# Java 的 BIO、NIO、AIO 有什么区别？阻塞、非阻塞和异步怎么区分？

[美团后端面试真题](../companies/meituan-backend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q494-java-bio-nio-aio/) · [题库目录](../../README.md)

*以下对话为教学模拟，不是真实面经。*

🧑‍💻 面试官：BIO、NIO、AIO 有什么区别？

🙋‍♂️ 我：BIO 同步阻塞，NIO 同步非阻塞，AIO 异步非阻塞。

🧑‍💻 面试官：NIO 的文件读取一定非阻塞吗？Selector 通知可以读，等于已经把数据读完了吗？

> “是否等待调用返回”和“谁在完成后通知”，是不同维度。NIO 包名也不保证所有操作都非阻塞。

## 面试速答（60 秒版）

BIO 通常指传统阻塞 I/O，调用读取时，线程可能等待操作满足条件再返回。

Java NIO 提供 Buffer、Channel 和 Selector 等抽象，其中可选择的通道可以配置为非阻塞，通过就绪通知协调多个连接。但不是所有 NIO 通道都支持这种方式，文件通道不能直接按 Socket Selector 模型理解。

AIO 使用异步通道等接口，提交操作后，通过 Future 或完成处理器获得结果。底层怎样实现，仍取决于平台和提供者，不等于完全没有线程等待。

选型时我会说明目标是文件还是网络、连接规模和框架能力。现代虚拟线程也会影响阻塞模型的成本，所以不能把一个接口口诀直接当成架构结论。

![速答总览：I/O 要分清等待、就绪与完成；Java NIO 包并不保证所有通道非阻塞。](https://note.lgdsunday.club/img/Q494/01-overview.webp)

## 知识点详解：阻塞、就绪和完成，分别说明什么

### BIO 的调用方，可能停在读取调用里

咱们假设连接还没有足够可读数据。传统阻塞读取可能让调用线程等待，直到有数据、结束、错误或相应条件满足。

这不代表每个连接任何时候都占满 CPU。等待线程与忙计算线程不同，但平台线程大量等待仍有调度和内存成本。

[Java InputStream 文档](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/io/InputStream.html)说明了相关读取语义。实际网络 API 还有超时、关闭等条件，需要按使用的对象检查。

### NIO 的非阻塞通道，先告诉你现在能做什么

可选择 Socket 通道可以配置非阻塞，读取没有数据时可能立即返回相应结果，而不是一直等。

Selector 帮助观察多个通道的就绪情况。收到可读通知以后，应用仍然需要读取、处理数据，并考虑一次没有读完、协议边界和状态变化。

所以，就绪通知不是完成通知。它告诉你可以尝试某种操作，不是已经替你读取并加工完整业务消息。

[Java channels 包说明](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/nio/channels/package-summary.html)区分了可选择通道与异步通道。FileChannel 等对象不能因为位于 NIO 包里，就被说成能以同样方式注册到 Selector。

### AIO 把结果交给完成入口

使用 AsynchronousSocketChannel 等接口，可以提交读写操作，然后通过 Future 或 CompletionHandler 等方式获取结果。

应用不必用相同方式持续轮询“现在是否就绪”，但仍需要管理缓冲区、操作生命周期、错误与部分读写。

[异步 Socket 通道文档](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/nio/channels/AsynchronousSocketChannel.html)说明了接口限制。异步接口不等于内核一定用某一种异步机制实现，也不等于整个系统没有工作线程。

不能在操作尚未完成时随意复用正在使用的缓冲区，更不能把一次读取回调当成完整消息已到齐；TCP 仍然是字节流。

![Selector 就绪与异步完成的区别](https://note.lgdsunday.club/img/Q494/02-readiness-vs-completion.webp)

### 用两个问题拆开容易混淆的术语

第一个问题：调用线程是否需要等当前操作满足条件才能返回？这帮助理解阻塞与非阻塞。

第二个问题：应用收到的是“可以尝试操作”的就绪信息，还是“某次操作已经完成”的结果？这帮助理解 Selector 与异步完成接口。

如果只背四个字，遇到文件、不同通道和具体调用方式就容易出错。比如拿到异步 Future 后立即 get，调用方仍可能等待；接口提供异步能力，不保证你的使用方式没有同步等待。

### 选型不能脱离框架和线程模型

大量连接、事件驱动协议处理，可能适合成熟的 NIO 框架。但手写状态机、缓冲区和背压有复杂度，不能只因为听起来高性能就自行实现。

阻塞代码配合虚拟线程时，线程成本与传统平台线程不同，仍需关注资源限制和实际 API 行为。异步接口也需要验证平台支持和框架成熟度。

这道题讨论 Java 接口，不提供伪造的 TS、Python BIO/NIO/AIO 对应库。其他语言有事件循环与异步 I/O，但不能机械复制 Java 类和平台语义。

![异步接口立即等待 Future 仍会阻塞调用方](https://note.lgdsunday.club/img/Q494/03-future-blocking-use.webp)

图中使用同一操作作对照，时长相同是示意条件，不是不同 I/O 实现的性能测试结果。

## 面试官继续追问

### NIO 的 read 返回 0 是什么情况？

对于相应非阻塞通道，可能表示当前没有读到数据，不应直接当成连接结束。具体结束与异常按 API 约定处理。

### AIO 可以一次读到完整消息吗？

不能保证。需要根据应用协议累积和解析，异步完成只是某次操作的结果。

### 虚拟线程会让 NIO 完全没价值吗？

不会直接得出这种结论。框架、协议、连接数、资源限制和工作负载仍然不同，应按目标验证。

## 面试速记卡

> - BIO：传统读取可能让调用线程等待。
> - NIO：可选择通道支持非阻塞与就绪协调，但不是全部通道。
> - AIO：提交操作，通过 Future 或完成入口获取结果。
> - 关键区别：就绪不等于完成，异步接口不等于没有工作线程。
> - 选型条件：目标 I/O、框架、线程模型和资源限制。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **美团 · Java后端 · 实习**：BIO、NIO、AIO 有什么区别？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353156355747946496)；面试记录为 2020-04-21、2020-04-24；原帖编辑于 2020-11-14。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
