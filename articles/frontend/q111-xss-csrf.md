# XSS 和 CSRF 有什么区别？HttpOnly、SameSite 和 Token 分别防什么？

[百度前端面试真题](../companies/baidu-frontend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q111-xss-csrf/) · [题库目录](../../README.md)

<!-- 以下对话为教学模拟；例子只用于防御设计，不提供攻击载荷。 -->

🧑‍💻 面试官：XSS 和 CSRF 有什么区别？

🙋‍♂️ 我：XSS 是不可信内容在页面里被当成脚本执行，CSRF 是诱导浏览器携带已有身份去发不想发的请求。

🧑‍💻 面试官：我给 Cookie 加了 HttpOnly，两个问题都解决了吗？

🙋‍♂️ 我：没有，它只能限制脚本直接读取 Cookie。

🧑‍💻 面试官：那脚本不读取 Cookie，直接在当前页面发操作请求呢？SameSite 又能不能代替所有 CSRF Token？

> 这道题要抓住「攻击利用了哪种信任」：XSS 借用了页面脚本权限，CSRF 借用了浏览器自动携带身份的行为。

## 面试速答（60 秒版）

XSS 是不可信输入被页面当作可执行内容，攻击者因此获得当前页面里的脚本能力。主要防护是按输出上下文正确编码，富文本使用可靠净化，并避免危险的动态执行入口，CSP 可作为额外防线。

CSRF 则利用浏览器会自动携带 Cookie 等凭据，让用户在不知情时触发服务端操作。可以结合 CSRF Token、来源校验、SameSite 和禁止用 GET 修改状态等措施。

HttpOnly 限制脚本读取 Cookie，但不会阻止浏览器发送 Cookie；SameSite 限制部分跨站携带，也有适用范围，不等于完整鉴权。

同时，XSS 可能直接在页面里读取 Token 或发合法形态的请求。因此，两类问题需要分别防，不能认为补了一个 Cookie 属性就安全了。

![XSS 与 CSRF：信任边界不同](https://note.lgdsunday.club/img/Q111/00-60s-overview.webp)

## 知识点详解：两种攻击分别借用了什么？

### XSS：数据越过了“只当内容”的边界

假设评论内容本来应该作为文字显示。如果应用把它直接放进能够解释 HTML 或执行脚本的位置，不可信内容就可能获得执行能力。

问题不在于它来自评论、URL 还是数据库，而在于输出位置把它当成了什么。HTML 文本、属性、URL 和 JavaScript 字符串，所需处理并不一样。

因此，不能只做一个全局替换就宣称处理了所有 XSS。尽量使用安全的内容插入方式；必须显示富文本时，使用维护良好的净化工具，并限制允许的结构。[OWASP XSS 防护指南](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)区分了这些输出上下文。

CSP 可以限制脚本来源与执行方式，但不应该代替正确编码。配置里随意允许内联脚本或不可信来源，也会削弱它。

### CSRF：不需要读取页面，也可能触发操作

假设用户已经登录网站 A，浏览器保存了 A 的登录 Cookie。另一个网站诱导浏览器向 A 发请求，在 Cookie 规则允许的情况下，身份会被自动带上。

攻击者可能读不到 A 的响应，但如果 A 只凭 Cookie 就执行操作，结果仍然可能已经发生。

这也解释了为什么 CORS 不是完整 CSRF 防护。响应不能被读，不等于请求从未到达，也不等于服务端没有修改数据。

[OWASP CSRF 防护指南](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)介绍了 Token、来源检查与 Cookie 策略等方式。设计时应该问：这个请求是否确实来自允许的交互，并且用户是否有操作权限？

### 防护措施不能混着背

| 措施              | 主要帮忙处理什么         | 不能保证什么              |
| --------------- | ---------------- | ------------------- |
| 上下文编码、富文本净化     | 避免不可信内容成为可执行内容   | 不自动判断请求是不是用户主动发起    |
| HttpOnly        | 限制脚本直接读取 Cookie  | 不阻止页面脚本携带 Cookie 请求 |
| SameSite        | 限制部分跨站 Cookie 携带 | 不覆盖所有同站风险与业务授权      |
| CSRF Token、来源检查 | 检查敏感请求的交互来源与合法形态 | 不修复页面里已经存在的 XSS     |
| CSP             | 给脚本执行增加约束        | 不代替基础输出防护           |

CSRF Token 还需要正确生成、与会话等上下文关联并校验，不能只放一个固定字符串。Token 不应该进 URL 或被随意记录到日志里。

SameSite 比较的是“站”，不是完整的 Origin。受控程度不同的同站子域，还需要特别考虑，不能把“同站”直接当成“可信”。

![HttpOnly：限制读取，不阻止发送](https://note.lgdsunday.club/img/Q111/01-detail.webp)

### 有 XSS 时，其他防护为什么可能被绕过？

如果恶意脚本已经运行在 A 的页面里，它可以利用页面现有的交互能力。有些方案中，它能读到页面里的 CSRF Token；即使不能读取 HttpOnly Cookie，也可能发出浏览器会自动带凭据的请求。

所以，“Cookie 不能被偷走”与“账户不能被操作”，是两件事。

遇到这种情况，修复不可信内容执行入口仍然必要。对于高风险操作，还可以增加重新确认、权限检查和异常监控，但这些是降低损失，不能把已存在的 XSS 当成没事。

## 面试官继续追问

### 把 Cookie 换成 Authorization，就没有 CSRF 了吗？

如果凭据只能由可信代码显式加到请求头，传统自动携带 Cookie 的 CSRF 条件会不同。但仍要看整个认证流程、Token 存储与请求校验，XSS 风险也没有消失。

### 删除 Cookie 中的用户 ID，保留 Session ID，就安全了吗？

不够。标识形式与请求来源是不同问题。服务端仍然需要有效会话、权限与敏感操作防护。

### 为什么不应该用 GET 修改数据？

GET 应具有安全语义。浏览器、预加载、爬虫或链接访问都可能触发它。把修改动作藏在 GET 中，不仅增加 CSRF 风险，也违背常见 HTTP 使用约定。

## 面试速记卡

> - XSS：不可信内容获得了页面执行能力。
> - CSRF：浏览器被诱导携带已有身份触发操作。
> - HttpOnly：防脚本读取 Cookie，不防所有账户操作。
> - SameSite：限制跨站携带，但不是权限与来源检查的全集。
> - 防护组合：输出防护与请求防护分开做，高风险操作再加确认。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **百度 · 前端 · 校招**：XSS 与 CSRF 有什么区别？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353158492217352192)；面试记录为 2021 年 9 月；原帖编辑于 2021-10-04。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
