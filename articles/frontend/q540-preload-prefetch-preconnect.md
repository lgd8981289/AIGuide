# preload、prefetch 和 preconnect 有什么区别？前端资源预加载应该怎么选？

[腾讯前端面试真题](../companies/tencent-frontend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q540-preload-prefetch-preconnect/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：preload 和 prefetch 都是提前加载，区别在哪里？

🙋‍♂️ 我：preload 通常为当前页面的关键资源，prefetch 更偏可能在后续使用的资源。

🧑‍💻 面试官：那 preconnect 是不是也会把文件下载下来？

🙋‍♂️ 我：它主要提前准备连接，不负责指定文件的内容下载。

🧑‍💻 面试官：如果首屏资源本来就很多，全部 preload 会不会反而更慢？

> 提前做哪一步，要对应当前等待点；发现资源、建立连接和下载内容分别判断。

## 面试速答（60 秒版）

`preload` 可以让浏览器更早发现当前页面需要的资源，不必等到后面的 CSS 或脚本才找到它。`prefetch` 则提示可能在后续页面使用的资源，具体是否执行与调度仍由浏览器决定。

`preconnect` 主要提前准备到某个来源的连接，例如 DNS、连接建立和安全协商，不会因为它存在就下载指定文件。

实际使用时，应先看网络瀑布哪里在等。当前关键资源发现太晚，可以评估 preload；后续导航比较确定，可以考虑 prefetch；确定要访问较慢的远程来源，可以评估 preconnect。还要检查 as、crossorigin 与后续请求是否匹配，避免重复下载和争抢带宽。

![提前发现、预取、连接准备](https://note.lgdsunday.club/img/Q540/01-overview.webp)

## 知识点详解：资源开始下载之前，浏览器还在等什么

### preload 让当前资源早点被发现

假设字体藏在后面才加载到的样式规则里。浏览器如果迟迟没看到字体地址，就要等发现它以后才发起请求。

preload 可以在较早的位置提示这个资源。例如下面表示准备字体资源。

```html
<link rel="preload" href="/fonts/text.woff2"
      as="font" type="font/woff2" crossorigin>
```

下载文件不等于自动把字体用起来，仍然需要相应的 CSS 定义。preload 也不是把所有请求都设为最高优先级的万能按钮。

![资源还没被发现，就不会开始请求](https://note.lgdsunday.club/img/Q540/02-discovery.webp)

### prefetch 预测后续，preconnect 准备连接

假设当前页面打开以后，多数用户下一步会进入详情页。可以评估预取那一页需要的资源，但预测错误时，这次下载可能没有被使用。

```html
<link rel="prefetch" href="/detail.js" as="script">
<link rel="preconnect" href="https://cdn.example.com" crossorigin>
```

preconnect 连接的是来源，不能把它当成某个文件已经到达。它也不能保证浏览器一定提前建立并保留连接。上面的域名是示例，不代表需要访问这个网站。

![连接准备，不等于内容下载](https://note.lgdsunday.club/img/Q540/03-connection.webp)

### 地址相同，为什么还是可能再请求一次

preload 的资源类型与请求方式，会影响后续能否复用。as 写错、跨域模式不匹配，或者后续实际上需要另一份响应，都可能让效果与预期不同。

比如预加载字体，要与实际字体请求的跨域模式对应。只看到两条请求名字相近，也不能直接断定下载了两遍；要看请求、缓存和响应记录。

modulepreload 等还有各自用途。若任务针对模块依赖，应回对应文档确认，不能用普通脚本例子直接概括所有模块加载。

![后续请求要匹配预加载条件](https://note.lgdsunday.club/img/Q540/04-request-match.webp)

### 越早下载，越要看有没有抢走首屏资源的机会

假设首屏真正需要图片和样式，你却同时预取几份很大的后续脚本。网络容量有限，这些请求可能竞争连接或带宽。

因此，每加一条提示都应回答，哪个等待被减少了，以及是否拖慢了更关键的工作。比较时使用相同网络条件，检查发现时间、请求完成、未使用提示和首屏指标。

图中时间线只用于解释阶段，不是测得的性能数据。依据：[preload](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/preload)、[prefetch](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/prefetch)、[preconnect](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/preconnect)。

![提前下载，也可能挤占关键资源](https://note.lgdsunday.club/img/Q540/05-bandwidth.webp)

## 面试官继续追问

### preload 下载完成，就会执行脚本吗？

不会因为预加载本身就按普通脚本标签执行。资源的实际使用还需要相应引用与执行安排。

### 能给所有第三方域名都 preconnect 吗？

需要明确哪些来源很快就会使用。过多准备连接可能浪费资源，也不能保证所有连接都保留。

### prefetch 一定比 preload 优先级低吗？

它们的目的和常见调度不同，但具体优先级要按浏览器、资源类型与条件检查，别把经验值当协议绝对保证。

## 面试速记卡

> - preload：更早发现当前需要的资源。
> - prefetch：预测后续可能使用的资源。
> - preconnect：提前准备来源连接。
> - 复用：核对资源类型、地址与请求模式。
> - 效果：检查减少的等待和关键资源竞争。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **腾讯 · 前端（腾讯音乐） · 秋招（原帖标题）**：preload 和 prefetch 有什么区别，分别适合哪些资源？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/727507402857127936)；正文记录 9 月 24 日、9 月 26 日面试，未明确面试年份；原帖发布于 2025-03-07。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
