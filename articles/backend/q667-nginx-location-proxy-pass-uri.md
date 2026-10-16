# Nginx location 匹配顺序是什么？proxy_pass 带不带斜杠有什么区别？

[雷霆游戏运维面试真题](../companies/thunder-operations.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q667-nginx-location-proxy-pass-uri/) · [题库目录](../../README.md)

下面是一段模拟面试对话。

🧑‍💻 **面试官：** Nginx 的 location 怎么匹配？

🙋‍♂️ **我：** 先精确匹配，再前缀，再正则。

🧑‍💻 **面试官：** 那最长前缀匹配到了，正则还能覆盖它吗？^\~ 又阻止了什么？

🙋‍♂️ **我：** 还需要区分保存候选和最终选中。

🧑‍💻 **面试官：** 再看 `/api/users`。proxy\_pass 写成 `http://app/`，和 `http://app`，上游收到的路径一样吗？

> 先选中 location，再计算上游 URI。这是两个步骤，别把路径变化都归因于一个斜杠。

## 面试速答（60 秒版）

对于本文讨论的同层、无 rewrite 的常见配置，Nginx 先看精确匹配；没有命中时，保存最长的普通前缀候选。如果这个前缀带 ^\~，就不再用该层正则匹配覆盖它；否则按配置顺序检查正则，使用第一个匹配结果，正则都不匹配才回到前缀候选。

选好 location 后，再看 proxy\_pass 是否包含 URI 部分。在普通前缀 location `/api/` 中，`proxy_pass http://app/;` 会把匹配的 `/api/` 替换为 `/`，所以 `/api/users` 转发成 `/users`。如果写 `proxy_pass http://app;`，没有附带 URI 部分，这个简单场景下会保留 `/api/users`。

这里的关键是“有无 URI”，不只是斜杠。正则 location、变量、rewrite 和嵌套规则都有额外条件，不能把这个简单例子套到所有配置。

![先匹配配置，再算上游路径](https://note.lgdsunday.club/img/Q667/01-nginx-location-proxy-pass-uri.webp)

## 知识点详解：把匹配路径和转发路径分两遍算

### 最长前缀，先是候选

假设平级配置同时有 `/`、`/api/` 和一个匹配图片后缀的正则。请求是 `/api/logo.png`。

没有精确匹配时，最长前缀候选是 `/api/`。但如果它没有 ^\~，后面正则仍有机会选中这次请求。于是最终处理它的配置，不一定是你第一眼看见的 `/api/`。

如果把这个前缀改成 `^~ /api/`，在这个平级配置例子里，就会采用这个最长前缀，不再让正则覆盖。

精确匹配 `= /health` 又是另一条路。命中以后可以直接结束 location 搜索，不需要继续比较长短。[location 官方规则](https://nginx.org/en/docs/http/ngx_http_core_module.html#location)还涉及 URI 规范化和嵌套位置，真实配置有嵌套时必须进一步检查，不能只套这张简化主线。

### query 参数不参与 location 路径匹配

`/api/users?page=2` 的查询参数，不是用来匹配 location 路径的那一段。

因此不能靠写一个带查询参数的普通 location 来选择分页逻辑。要按需求使用对应变量或其他明确配置，并继续检查转发是否保留了预期参数。

排查时最好同时记录原始请求 URI、实际处理路径和上游请求，避免把路径规范化、重写和查询参数混为一谈。

![最长前缀，为什么还只是候选？](https://note.lgdsunday.club/img/Q667/02-nginx-location-proxy-pass-uri.webp)

### proxy\_pass 后面，究竟有没有 URI？

下面是两个独立示例，不要同时复制到同一层创建重复 location。它们使用 Nginx 配置语言，不涉及 TS/Python 的替代版本。

**示例 A：带 URI，替换匹配的前缀**

```nginx
location /api/ {
    proxy_pass http://app/;
}
```

请求 `/api/users`，匹配部分是 `/api/`。把它替换成 proxy\_pass 的 URI `/`，剩余的 `users` 接上去，就是 `/users`。

**示例 B：没有 URI 部分**

```nginx
location /api/ {
    proxy_pass http://app;
}
```

在这里限定的普通场景下，上游得到 `/api/users`。注意域名 app 后面那个斜杠，在示例 A 中已经构成 URI 部分。[proxy\_pass 官方文档](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_pass)明确区分了两种语义。

如果改成 `http://app/v1/`，就是把 `/api/` 替换成 `/v1/`。这样理解比“带斜杠去前缀、不带保留”更能覆盖实际修改。

![proxy\_pass 的 URI 替换哪一段？](https://note.lgdsunday.club/img/Q667/03-nginx-location-proxy-pass-uri.webp)

### 先验证上游看到了什么，再改配置

最好准备一个测试上游，记录收到的方法、路径和查询参数。分别请求 `/api/users`、带参数版本，以及边界路径 `/api`、相似路径 `/apix/`。

先运行 `nginx -t` 检查配置，再用 `nginx -T` 查看实际加载内容，确认没有 include、正则或 rewrite 改变结论。语法检查成功，只证明配置能被接受，不证明转发路径符合业务预期。

本文示例是官方规则推导，尚未在本机启动 Nginx；实际投用前仍需按最终配置做请求验收。

## 面试官继续追问

### 正则 location 也能照样替换前缀吗？

不能直接套这个例子。正则或命名 location 等场景中，匹配的替换片段不一定能按普通前缀确定，proxy\_pass 的 URI 使用受相应限制。先看所用配置形态，再对照文档。

### 加变量为什么可能变了？

带变量的 proxy\_pass 会引入不同的 URI 处理和解析条件。不要把静态上游地址的例子机械改成字符串拼接，尤其要检查用户输入是否能影响目标地址和路径。

## 面试速记卡

> - 先匹配：精确命中优先，否则保存最长前缀候选。
> - 再检查：^\~ 和正则决定该层候选是否被覆盖。
> - 再转发：proxy\_pass 有 URI 时，普通前缀按规则替换。
> - 示例：/api/ 加 <http://app/，把> /api/users 转成 /users。
> - 边界：正则、嵌套、变量和 rewrite 要另行核对。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **雷霆游戏 · 运维开发 · 秋招**：一个请求能匹配多个 location 时，Nginx 按怎样的规则和优先级选择？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/418140005200146432)；正文记录 9 月 18 日一面；原帖发布于 2022-11-04。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
