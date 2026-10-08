# OAuth 2.0 和 OpenID Connect 有什么区别？授权码与 PKCE 解决什么问题？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q164-oauth-oidc-pkce/) · [题库目录](../../README.md)

<!-- 以下对话为教学模拟，非真实面经。 -->

🧑‍💻 面试官：OAuth 2.0 就是第三方登录吗？

🙋‍♂️ 我：是，拿到第三方的 token，就能知道用户是谁。

🧑‍💻 面试官：如果这个 token 只允许读取某个资源，它保证了你的登录身份吗？

🙋‍♂️ 我：那应该还要读取用户信息。

🧑‍💻 面试官：那 ID Token 和 Access Token 分别交给谁？授权码被别人截走，又靠什么防止被兑换？

> 把「允许做什么」「确认你是谁」「谁能兑换授权码」分开，OAuth、OIDC 和 PKCE 就不会混在一起。

## 面试速答（60 秒版）

OAuth 2.0 主要解决授权：让应用在限定范围内访问资源，而不必拿到用户密码。OIDC 在 OAuth 之上增加身份认证语义，通过 ID Token 等信息，让客户端确认登录用户。

Access Token 面向资源服务器，ID Token 面向登录客户端，不能随意互换。客户端还要按协议验证签名、签发者、受众、有效期和对应的请求关联信息，不能只把 JWT 解码出来就算验证完成。

授权码流程先返回短期授权码，再向 token 端点兑换。PKCE 通过一次性 verifier 和对应 challenge，把兑换绑定到发起流程的一方，降低授权码被截获或注入后的滥用风险。实际接入会使用成熟库，配合 HTTPS、准确回调地址、请求关联及最小权限，而不是自行拼一套登录协议。

![OAuth 授权、OIDC 认证和 PKCE 绑定兑换的职责及两种 Token 受众](https://note.lgdsunday.club/img/Q164/00-60s-overview.webp)

## 知识点详解：同一条登录流程中，三个机制各做什么

### 先分清授权和认证

假设一个相册工具只想读取用户在另一平台的照片。用户同意后，平台发给工具一个限定能力的 Access Token，工具拿它访问照片 API。这回答的是「这个应用被允许做什么」。

如果工具还想借这个平台完成登录，则需要可靠回答「刚刚登录的是哪一个用户」。OIDC 为这个问题提供标准身份语义与 ID Token。不能仅凭存在一个 OAuth token，就自行推断认证过程、用户身份和 token 的受众。

ID Token 是发给客户端的认证结果。API 应验证为自己签发的访问凭据，而不是把给登录客户端的 ID Token 当作通用 API 门票。

### 授权码为什么要经过兑换

授权码流程把浏览器重定向带回的结果与最终访问凭据分开。客户端先发起请求，用户在授权服务器完成认证与同意，再携授权码返回已登记的回调地址；客户端向 token 端点兑换。

这能减少直接通过 URL 暴露访问令牌的机会，但授权码本身也需要保护。回调地址应严格匹配，授权码应按协议限制有效期与复用，机密客户端还需要合适的客户端认证。

在浏览器或原生应用中嵌一个固定 secret，不能让这个公开客户端突然变成能保密的客户端。用户可以看到或提取其中的内容。

### PKCE 绑定的是这一次兑换

客户端每次流程生成一个高熵随机 verifier。开始授权时发送根据它生成的 challenge；使用 S256 时，challenge 来自 SHA-256 再作 Base64url 编码。兑换时再提交原始 verifier，服务器检查它与之前的 challenge 是否对应。

于是，别人只截到授权码，通常仍缺少正确的 verifier。它不是把授权码加密，也不是证明用户有某项业务权限；它保护的是授权流程中的绑定。

当前 OAuth 安全最佳实践要求公开客户端使用 PKCE，并推荐机密客户端使用。新实现应采用 S256 等符合要求的安全方法，不把 plain 当作默认捷径。

### 每一项验证都要有明确对象

登录客户端验证 ID Token 的签发者、受众、有效期等，并按实际流程验证 nonce 等关联信息。请求关联和 CSRF 防护也要正确建立；state、nonce、PKCE 职责有交叉，但不能随意删掉安全库要求的检查。

资源服务器则验证 Access Token 是否面向自己、是否允许当前操作，以及是否有效。Access Token 不一定是 JWT，也不一定能在本地离线验签，具体按授权服务器约定处理。

测试接入时，应主动交换两个请求的回调、修改 state 或 nonce、换错受众、重用授权码，确认系统拒绝，而不只是验证正常登录成功。

本题机制参考：[OAuth Security BCP RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html)、[PKCE RFC 7636](https://www.rfc-editor.org/rfc/rfc7636.html)、[OpenID Connect Core](https://openid.net/specs/openid-connect-core-1_0.html)。

![PKCE 在授权请求提交 challenge，在 token 兑换提交 verifier](https://note.lgdsunday.club/img/Q164/01-detail.webp)

## 面试官继续追问

### PKCE 是替代 client secret 吗？

不能这样概括。机密客户端仍按协议进行客户端认证，PKCE 额外绑定授权请求与兑换。公开客户端不能依赖一个嵌入代码的固定 secret。

### 把 token 解码出来能算验证吗？

不能。解码只读取内容，不证明来源和适用范围。还要验证相应协议要求的签名、issuer、audience、时间与请求关联。

### OAuth 2.1 可以当作已发布标准来讲吗？

要检查实际标准状态。本题依据已发布的 OAuth 2.0、PKCE、OIDC 与 RFC 9700，不把草案版本冒充正式 RFC。

## 面试速记卡

> - OAuth：授权访问；OIDC：提供身份认证语义。
> - Access Token 给资源服务器，ID Token 给登录客户端。
> - 授权码先返回，再通过 token 端点兑换。
> - PKCE 用本次 verifier/challenge 绑定兑换，推荐 S256。
> - 解码不是验证，成熟库也需要正确配置。

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
