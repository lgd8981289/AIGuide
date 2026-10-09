# 腾讯开发面试真题及答案 · Sunday面试指南

[全部公司真题](./README.md) · [在线阅读](https://note.lgdsunday.club/companies/tencent/development/)

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

## Agent面试题

- [单 Agent 和多 Agent 应该怎么选？什么时候才需要 Handoff？](../agent/q018-single-vs-multi-agent.md)
  我不会默认把任务拆成多个 Agent。先用单 Agent 加明确工具，看看它是否已经能稳定完成任务。如果主要问题只是步骤多，未必需要多 Agent；真正值得拆分的，往往是专业上下文、工具权限或对话责任需要分开。
- [Prompt Engineering 是什么？Agent 提示词应该怎样设计？](../agent/q456-agent-prompt-engineering.md)
  从退款查询任务解释 Prompt Engineering，讲清 Agent 提示词的目标、输入、工具边界、失败处理与评测方法，避免把角色设定或长提示词当成可靠性保证。

## 后端面试题

- [Nginx 的反向代理和负载均衡怎么工作？轮询与一致性哈希怎么选？](../backend/q171-nginx-reverse-proxy.md)
  反向代理是客户端先访问代理，由代理代表后端接收并转发请求。负载均衡是在多个上游实例之间选择目标，是反向代理可以提供的一项能力。Nginx 可以按轮询、权重、最少连接或哈希等方式选择上游。轮询适合工作相近的请求；

## 计算机基础面试题

- [TCP 为什么要三次握手、四次挥手？TIME_WAIT 有什么作用？](../cs-basics/q092-tcp-handshake-termination.md)
  TCP 三次握手的核心，是同步双方初始序号，并确认各自发送的 SYN 已经被对方收到。客户端先发 SYN，服务端用 SYN 加 ACK 既确认客户端，又提出自己的序号，客户端再发 ACK 确认服务端。
- [HTTP 和 HTTPS 有什么区别？TLS 怎样防止窃听、篡改和冒充？](../cs-basics/q093-https-tls.md)
  HTTP 定义请求和响应的语义，HTTPS 通常指通过 TLS 保护的 HTTP 通信。HTTP/3 使用 QUIC，而 QUIC 也集成了 TLS 1.3 的安全机制。TLS 主要处理保密性、完整性和身份验证。
- [select、poll、epoll 有什么区别？I/O 多路复用到底在复用什么？](../cs-basics/q197-io-multiplexing.md)
  select、poll 和 epoll 都能等待多个文件描述符的 I/O 状态。select 使用集合，常见 glibc fd_set 有大小限制；poll 使用描述符数组，没有同样的固定集合限制，但仍要处理扫描和传入的集合。
- [互斥锁、自旋锁和信号量有什么区别？等待资源时该睡眠还是忙等？](../cs-basics/q199-mutex-spinlock-semaphore.md)
  互斥锁主要提供独占临界区，并通常有持有者语义。自旋锁获取失败时反复检查，消耗 CPU，适合很短、能很快结束的临界区，不适合在持锁期间做耗时或阻塞操作。信号量管理可用许可计数。计数为零时等待，释放后允许继续；

