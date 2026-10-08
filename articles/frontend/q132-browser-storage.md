# localStorage、sessionStorage、Cookie 和 IndexedDB 怎么选？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q132-browser-storage/) · [题库目录](../../README.md)

<!-- 以下对话为教学模拟，非真实面经。 -->

🧑‍💻 面试官：localStorage、sessionStorage、Cookie 和 IndexedDB 怎么选？

🙋‍♂️ 我：localStorage 永久保存，sessionStorage 关闭页面就没了，Cookie 比较小，IndexedDB 能放很多数据。

🧑‍💻 面试官：永久是多久？刷新会清掉 sessionStorage 吗？Cookie 和其他三个最大的行为差异是什么？

🙋‍♂️ 我：刷新通常不会清掉，它们的生命周期不一样。

🧑‍💻 面试官：还有网络请求。哪个会按规则自动带给服务器？如果要保存离线文章和阅读位置，你会怎么分？

> 先问数据要不要随请求发送，再看生命周期、数据规模和读写方式，别只背容量表。

## 面试速答（60 秒版）

Cookie 的重要特点是浏览器会按域、路径、安全和 SameSite 等规则随匹配请求发送，因此常用于服务端会话；它不是专门用来存大量页面数据的。

localStorage 和 sessionStorage 是同步的字符串键值存储，数据不会自动附在每次请求里。前者通常跨浏览器重启保留，后者按来源和标签页会话隔离，刷新一般仍在，但不能把“持久”理解成永不删除。

IndexedDB 是异步的客户端事务数据库，适合较多结构化数据、索引查询和离线内容。实际项目还要考虑配额、淘汰、异常和迁移；这些客户端数据不能代替服务端可信状态。

![阅读偏好、临时草稿、离线数据和服务端会话分别对应不同存储行为](https://note.lgdsunday.club/img/Q132/00-60s-overview.webp)

## 知识点详解：给阅读站点选存储，先看数据怎么使用

### 阅读位置和离线文章，不必放在同一个地方

假设我们做一个文章阅读站点，想保存主题偏好、当前标签页草稿、离线文章，以及用户登录会话。

主题偏好是一个小字符串，localStorage 往往够用；当前标签页中的临时编辑内容，可以考虑 sessionStorage；离线文章正文和元数据需要较多结构化读写，IndexedDB 通常更合适。

登录会话则要先设计服务端鉴权方式。若使用 Cookie 会话，要考虑 HttpOnly、Secure、SameSite、有效期以及服务端失效机制。不能因为 localStorage 使用简单，就把所有敏感信息塞进去。

### 四种方案的行为边界是什么？

| 方案             | 怎么读写              | 生命周期与隔离             | 是否自动随请求发送 |
| -------------- | ----------------- | ------------------- | --------- |
| localStorage   | 同步，字符串键值          | 通常按来源隔离，跨重启保留       | 不会        |
| sessionStorage | 同步，字符串键值          | 按来源和标签页会话隔离，刷新通常保留  | 不会        |
| Cookie         | HTTP 头或允许的客户端 API | 按 Cookie 属性和浏览器策略   | 符合规则时会    |
| IndexedDB      | 异步事务，结构化记录与索引     | 按来源等存储规则管理，有配额和淘汰条件 | 不会        |

“按来源”通常涉及协议、主机和端口，现代浏览器还可能有分区存储等额外规则。Cookie 的域与路径规则不同，不能直接套用 Web Storage 的来源模型。

sessionStorage 在新标签页的表现也不能只背“全新空白”：有 opener 等情况下，初始数据可能被复制，之后再各自独立。这里最重要的是它不是一个所有标签页持续共享的区域。

### 持久保存，不等于永远可靠

用户可以主动清数据，隐私模式有自己的生命周期，存储配额也可能被耗尽。IndexedDB 等还可能受浏览器的淘汰与持久化策略影响。具体容量与行为应查看目标浏览器，别把某个数字当成所有环境的保证。

所以离线文章要区分“可重新下载的缓存”和“用户还没同步的重要草稿”。缓存丢了可以补，草稿丢了就是数据损失。重要内容需要同步、导出或其他恢复机制，而不是依赖一句“localStorage 永久”。

大数据频繁 JSON 序列化再写 localStorage，也可能阻塞主线程。IndexedDB 的异步读写更适合这类数据，但仍需设计版本升级、事务和错误处理，不是换个 API 名字就完事。

### 客户端可以保存状态，不能决定可信状态

阅读偏好被用户修改通常没有严重问题，但权限、余额和订阅状态不能仅相信浏览器里的值。请求到服务端以后，仍需用可信身份与服务端记录判断。

HttpOnly 能阻止页面脚本直接读取相应 Cookie，但不是全面防住 XSS；恶意脚本仍可能在用户身份下发起操作。使用 Cookie 也要处理 CSRF 等问题，不能只靠一个属性概括整个安全方案。

验收时可以刷新、重开浏览器、开新标签页、模拟配额异常，并在 Network 中观察请求携带的 Cookie。再检查离线文章迁移与草稿同步失败时的提示，才能知道方案是否适合真实使用。

本题机制参考：[MDN：Web Storage](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)、[MDN：IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)、[MDN：HTTP Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies)。

## 面试官继续追问

### localStorage 的值可以直接放对象吗？

它存储字符串，通常需要自行序列化和解析；类型、循环引用与错误处理不能忽略。结构化对象数据较多时可考虑 IndexedDB。

### Cookie 一定可以被 JavaScript 读取吗？

不是。HttpOnly Cookie 不允许页面脚本通过相应客户端 API 读取，但浏览器仍可按规则随请求发送。

### sessionStorage 关掉浏览器就绝对消失吗？

不要把会话恢复等浏览器行为忽略掉。面试中先说标签页会话模型，再说明刷新一般保留，恢复行为与浏览器策略有关。

## 面试速记卡

> - Cookie：按规则随请求发送，先考虑服务端会话与安全属性。
> - Web Storage：同步字符串键值，不自动发送。
> - sessionStorage：来源与标签页会话隔离，刷新通常保留。
> - IndexedDB：异步事务与索引，适合结构化和离线数据。
> - 可靠性：持久不是永久，客户端记录也不等于可信业务状态。

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
