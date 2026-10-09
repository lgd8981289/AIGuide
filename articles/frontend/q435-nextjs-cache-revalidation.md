# Next.js 缓存为什么不更新？revalidateTag、updateTag 和 router.refresh 有什么区别？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q435-nextjs-cache-revalidation/) · [题库目录](../../README.md)

*下面是一段教学模拟，不是真实面试记录。*

🧑‍💻 面试官：用户修改资料成功，页面还显示旧值，你怎么办？

🙋‍♂️ 我：调用 router.refresh，重新获取页面。

🧑‍💻 面试官：服务端返回的也是缓存旧值，刷新页面会变新吗？

🙋‍♂️ 我：那还要让服务端数据缓存失效。

🧑‍💻 面试官：updateTag 和 revalidateTag 都能按标签更新，为什么还要分两个接口？

> 先找「旧值留在哪一层」：数据库、服务端缓存和浏览器里的页面不是同一个对象，刷新页面不等于让所有数据缓存失效。

## 面试速答（60 秒版）

router.refresh 主要重新请求当前路由的服务端组件结果，并更新客户端界面。它不会因此自动清除服务端的数据缓存，所以仍可能拿到旧数据。

updateTag 用于 Server Actions，会让相关标签缓存立即过期，适合用户提交后需要读到自己修改结果的场景。

revalidateTag 使用 max 配置时，采用 stale-while-revalidate：允许先返回旧内容，同时后台取得新内容，适合能够接受短暂陈旧的数据。

排查时先确认修改是否真正提交，再确认读取路径是否缓存、标签是否匹配，最后检查客户端是否取得更新结果。还要核对 Next.js 版本与缓存模式，不能把旧教程里的默认行为直接套到当前项目。

![缓存更新：刷新的是哪一层：页面刷新不等于数据缓存失效](https://note.lgdsunday.club/img/Q435/01-overview.webp)

## 知识点详解：一次写入之后，旧值可能留在哪里？

### 数据库新了，不代表每个页面都新了

假设用户把昵称从“小周”改成“小林”。

数据库已经提交，但服务端某个缓存函数仍保存“小周”，浏览器当前界面也还是“小周”。

接下来，如果浏览器重新请求页面，服务端依然从缓存函数取得“小周”，刷新确实发生了，却没有拿到新值。

所以先沿着读取链路找：页面的数据来自哪里？这一段有没有缓存？缓存由什么标签或路径控制？不要一看到旧界面，就连续堆上几个刷新函数。

当前官方入门文档中的 Cache Components 需要相应配置；未启用的项目应参考对应缓存模型。本文比较接口含义，不假定所有 fetch 默认缓存。[适用范围说明](https://nextjs.org/docs/app/getting-started/revalidating)

![数据库改了，旧值留在哪一层：沿读取链查旧值](https://note.lgdsunday.club/img/Q435/02-mechanism.webp)

### updateTag：这次提交后，要读到自己写入的内容

用户刚改完昵称，下一次读取不应继续使用旧标签缓存。updateTag 会使匹配条目立即过期，后续读取需要取得新数据。

它仅用于 Server Actions。这个限制意味着，不能从任何 Route Handler 里随手调用它。

另外，标签必须确实绑定在相应缓存数据上。写入时使用 users 标签，读取时只标 profile，调用没有覆盖到目标数据，仍不会解决问题。[updateTag 文档](https://nextjs.org/docs/app/api-reference/functions/updateTag)

“立即过期”也不是替数据库事务提交。应先确保业务写入成功，再进行相应缓存处理。

### revalidateTag：允许短暂旧值，后台更新

使用 revalidateTag(tag, "max") 时，访问相关缓存可以先获得陈旧内容，再触发后台更新。

假设是文章目录或不要求立刻一致的展示列表，这种方式可以降低等待新数据的延迟。但用户刚提交一项敏感修改后，需要立即确认，继续展示旧值就可能让他以为没有成功。

所以要根据读取的一致性要求选，而不是根据函数名判断哪个“刷新得更高级”。

不同第二参数对应不同配置；旧单参数调用的行为及弃用情况应看版本，不能把所有 revalidateTag 调用都概括成完全相同的后台更新。[revalidateTag 文档](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)

![立即过期和后台更新两条时间线：一致性需求决定策略](https://note.lgdsunday.club/img/Q435/03-mechanism.webp)

### router.refresh：更新浏览器看到的结果

router.refresh 关注当前客户端路由，重新请求服务端组件结果并合并界面变化，不负责替我们修改服务端数据缓存。

因此可以分成两个问题：服务端下一次读取能否拿到新值，浏览器有没有发起适当的新读取。

前者检查失效策略，后者检查返回结果和刷新路径。Action 本身也可以结合返回值、跳转和框架更新流程，不需要所有场景都额外重复调用一次 refresh。[useRouter 文档](https://nextjs.org/docs/app/api-reference/functions/use-router)

排查时还要确认环境：开发热更新与生产构建的缓存表现可能不同。最终结论应该来自使用版本的生产验证，不是刷新几次浏览器的感觉。

## 面试官继续追问

### 刷新后数据库数据还是旧的，是不是缓存问题？

先确认业务写入有没有提交、读取是否命中了预期数据库或副本。不能把写入失败和副本延迟全部当成 Next.js 缓存错误。

### revalidatePath 和按标签失效怎么选？

路径适合描述具体页面的失效范围，标签适合描述多处共享的缓存数据。先确定哪些读取需要更新，再选择范围；不要全站清缓存来掩盖错误的关联关系。

### Python 后端返回新值，Next.js 就一定显示新值吗？

不一定。Next.js 读取路径可能仍有自己的缓存，浏览器也可能还没有更新。Python HTTP 服务没有这些 Next.js 函数的同名实现，应明确各层职责。

## 面试速记卡

> - updateTag：Server Action 内立即使标签缓存过期，满足读到自己写入。
> - revalidateTag(tag, "max")：允许陈旧内容，访问时进行后台更新。
> - router.refresh：更新当前客户端路由结果，不自动清除服务端数据缓存。
> - 排查顺序：写入提交、读取来源、缓存关联、界面更新。
> - 版本要求：确认实际 Next.js 版本及缓存模式，不沿用未经核对的旧默认值。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
