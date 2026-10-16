# Socket 的 bind、listen、accept、connect 分别做什么？为什么 accept 会返回新的 Socket？

[有赞开发面试真题](../companies/youzan-development.md) · [腾讯后端面试真题](../companies/tencent-backend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/cs-basics/q679-socket-bind-listen-accept-connect/) · [题库目录](../../README.md)

下面是一段模拟面试对话。

🧑‍💻 **面试官：** TCP 服务端调用 accept，拿到的还是监听 Socket 吗？

🙋‍♂️ **我：** 不是，会得到一个用于这条连接的新 Socket。

🧑‍💻 **面试官：** 监听的已经占着 8080，新连接也用 8080，为什么不冲突？

🙋‍♂️ **我：** 一条连接还要结合对端地址和端口来区分。

🧑‍💻 **面试官：** 那 accept 没被应用调用之前，TCP 握手是不是就一定不能完成？

> 监听对象负责接纳连接，已连接对象负责某一对端的数据。端口号不是一个进程里每个 Socket 必须独占的身份证。

## 面试速答（60 秒版）

以 Linux TCP Socket 为例，bind 把 Socket 绑定到本地地址，listen 让它成为被动监听对象；accept 从待接纳连接中取得一条连接，并返回新的已连接文件描述符，原监听对象继续接纳其他连接。

客户端通常通过 connect 发起到目标地址的连接，不显式 bind 时，系统可以按规则分配合适本地地址和临时端口。

监听 Socket 和连接 Socket 的职责不同。多个已连接 Socket 可以使用相同服务端端口，通过本地和对端的地址、端口等信息区分连接。

TCP 握手主要由内核协议栈处理，不是等应用执行 accept 才逐条发送握手包。排查时要区分监听、排队、接纳和应用读写，也要检查阻塞或非阻塞 API 的返回条件。

![监听入口，与每条连接分开](https://note.lgdsunday.club/img/Q679/01-socket-bind-listen-accept-connect.webp)

## 知识点详解：监听端口，和服务每个客户端分别做

### bind 确定本地位置，不是连接远端

服务端通常先创建 Socket，再绑定要监听的本地地址与端口。绑定到某个具体地址，和绑定所有适用接口，覆盖范围可能不同。[bind 手册](https://man7.org/linux/man-pages/man2/bind.2.html)定义了这一步。

客户端 connect 则指定要连接的对端。它也需要本地地址和端口，只是常由系统自动选择，不代表客户端只有远端地址、没有自己的通信端点。

本文讨论 Linux 上常见 TCP API 的语义。Node、Python、Java 的高级封装会隐藏或重组部分调用，不应机械把每个高级方法当成一个独立底层系统调用。

### listen 把对象变成接纳连接的入口

listen 作用于监听 Socket。它准备让协议栈接受相应的连接请求，backlog 参与排队容量管理。

这里容易把“半连接”和“已完成、等待应用接纳”的队列全部算成同一个可移植数字。Linux 对 backlog 的解释与内核限制需要一起看，不能只把参数调大就宣称再也不会拒绝连接。[listen 手册](https://man7.org/linux/man-pages/man2/listen.2.html)说明了相关语义。

### accept 返回新对象，监听入口继续留下

假设两个客户端先后连到服务端 8080。监听对象仍然负责等待新连接，应用每次 accept 成功，取得一个可以与具体客户端通信的已连接对象。

这份新描述符可以读取、写入和关闭对应连接。关闭它不等于关闭监听入口；关闭监听入口，也不能简单说已经自动逐一处理了所有已接纳连接的业务收尾。

[accept 手册](https://man7.org/linux/man-pages/man2/accept.2.html)明确说明新 Socket 与原监听 Socket 的区别。描述符是进程使用内核资源的句柄，不是远端端口号。

![同一个端口，可以对应多条连接](https://note.lgdsunday.club/img/Q679/02-socket-bind-listen-accept-connect.webp)

### 同一个服务端端口，靠什么区分连接？

在同一网络命名空间、同一协议的常见讨论里，TCP 连接可以按本地 IP、本地端口、远端 IP、远端端口来区分。

客户端 A 和 B 即使都访问服务端 8080，对端这一半通常不同，所以可以对应不同连接。涉及多地址、端口复用或网络命名空间时，还要按操作系统规则继续分析，不能把四元组当成所有对象全局唯一标识。

### 没有 accept，内核也可能已经收到完整连接

应用还没来得及 accept，内核可以已经完成某些连接的握手，并把它们放到等待接纳的队列。

这就是为什么服务端“还能握手，但业务没有响应”，不一定是 TCP 完全没通。应用可能没有及时接纳，或者接纳后卡在工作线程、读取与处理阶段。[connect 手册](https://man7.org/linux/man-pages/man2/connect.2.html)也区分同步与非阻塞的连接过程。

非阻塞 connect 返回正在进行，不等于已经连接成功；需要等相应就绪事件，再按 API 检查最终结果。就绪通知与业务成功，又是不同层。

## 面试官继续追问

![连接建立，不等于应用已经 accept](https://note.lgdsunday.club/img/Q679/03-socket-bind-listen-accept-connect.webp)

### accept 返回以后，就能一次读到完整消息吗？

不能。TCP 提供字节流，应用还需要定义消息边界并处理部分读写。连接建立成功，只证明到达了通信阶段。

### UDP 也需要 listen 和 accept 吗？

不能把 TCP 的这条流程直接套过去。UDP Socket 和它的 connect 用法有不同语义，讨论前先确认协议类型。

## 面试速记卡

> - bind：绑定本地地址；connect：发起或设置对端连接语义。
> - listen：建立被动接纳入口，队列容量还受系统约束。
> - accept：返回新连接对象，监听对象继续接纳。
> - 区分：相同服务端端口，可以对应不同对端连接。
> - 分层：握手、应用接纳、字节流读写和业务成功不是同一步。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **有赞 · Python开发 · 校招（原帖标签）**：TCP 编程的系统调用过程是什么？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353156916811603968)；正文记录 9 月 7 日一面；原帖编辑于 2020-09-07。
- **腾讯 · C++后端 · 校招（原帖标签）**：TCP 握手与挥手状态怎样对应到 POSIX Socket API？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353155945926696960)；原帖编辑于 2019-11-30。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
