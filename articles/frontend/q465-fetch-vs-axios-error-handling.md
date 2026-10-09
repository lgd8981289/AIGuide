# Fetch 和 Axios 有什么区别？为什么遇到 404 时处理方式不同？

[腾讯前端面试真题](../companies/tencent-frontend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q465-fetch-vs-axios-error-handling/) · [题库目录](../../README.md)

*以下对话为教学模拟，不是真实面经。*

🧑‍💻 面试官：Fetch 和 Axios 有什么区别？

🙋‍♂️ 我：Fetch 是浏览器自带的，Axios 用起来更方便。

🧑‍💻 面试官：接口返回 404，为什么 Fetch 进入成功回调，Axios 通常却进入 catch？

🙋‍♂️ 我：它们默认判断失败的方式不一样。

🧑‍💻 面试官：那返回 200，但是业务字段写着失败，又该由谁判断？

> 请求有没有拿到响应、HTTP 状态是否符合预期、业务是否成功，是三个不同问题。

## 面试速答（60 秒版）

Fetch 是 Web 平台提供的请求 API，Axios 是一个请求库。它们最值得注意的差别之一，是默认错误处理方式。

Fetch 收到 404 或 500 响应时，通常仍然返回 fulfilled 的 Promise，需要我们检查 response.ok 或 status。网络失败、请求取消等情况才会走到相应的异常处理。

Axios 默认会把不满足 validateStatus 的 HTTP 状态当作拒绝，通常 404 会进入 catch；这个规则可以配置。

不过，HTTP 200 不代表业务成功。两种方式都需要应用检查业务结果，并统一处理网络错误、HTTP 错误、解析错误和业务错误。实际选择还要看团队的取消、超时、拦截和运行环境需求。

![速答总览：Fetch 与 Axios 默认 HTTP 拒绝策略不同，但网络、状态、解析和业务结果都需要分层处理。](https://note.lgdsunday.club/img/Q465/01-overview.webp)

## 知识点详解：一次请求，分几层判断结果

### 404 说明服务器回答了，不是没有响应

咱们假设前端查询一个不存在的订单。服务器返回 HTTP 404，并附带一段 JSON。

对于 Fetch，这次请求已经拿到了响应对象。它不会仅因为状态码是 404 就自动拒绝，因此需要应用检查状态。[MDN 的 Fetch 使用说明](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)明确区分了 HTTP 状态和请求失败。

Axios 的默认策略则不同，会根据 validateStatus 判断状态码是否可接受。相关行为可以查[Axios 官方仓库的请求配置与错误处理](https://github.com/axios/axios)。改过配置以后，404 也可以被视为可接受响应，所以面试时最好说“默认行为”，不说“永远”。

### 先检查状态，再按照接口约定解析内容

下面展示 Fetch 的基本处理。它不是完整请求封装，只说明几个判断发生在哪里。

#### TypeScript：浏览器 Fetch

```typescript
async function loadOrder(id: string, signal?: AbortSignal) {
  const response = await fetch(
    "/api/orders/" + encodeURIComponent(id), { signal }
  );
  if (!response.ok) {
    throw new Error("HTTP " + response.status);
  }
  return await response.json();
}
```

这里还有一个容易漏掉的情况：HTTP 200 的内容并不一定是合法 JSON。调用 json 时可能出现解析错误。所以“响应已到达”和“数据能够使用”，还需要分开处理。

#### Python：httpx，展示相同的分层判断

```python
import httpx

async def load_order(order_id: str):
    async with httpx.AsyncClient(timeout=5.0) as client:
        response = await client.get(
            "https://example.com/api/orders",
            params={"id": order_id},
        )
        response.raise_for_status()
        return response.json()
```

Python 这里用的是 httpx，不是 Fetch 或 Axios 的官方 Python 版本。raise\_for\_status 会检查 HTTP 状态；网络异常、状态异常和 JSON 解析仍是不同情况。实际代码还应使用应用配置的地址，并按吞吐需要管理客户端生命周期。

### 业务失败，还要看业务协议

假设接口返回 200，内容却是 `{"success": false, "reason": "订单已取消"}`。

Fetch 的状态检查会通过，Axios 默认也不会因为这个字段自动报错。是否需要抛出业务异常、展示提示或进入补救流程，都由应用约定决定。

因此，统一请求层可以整理错误类型，但不要把所有异常都显示成“网络不稳定”。订单不存在、用户无权访问、接口返回格式错误，需要不同处理。

对于重试尤其如此。网络超时不能证明服务器没有执行动作；创建订单这类操作，必须结合幂等机制，而不是任何 catch 都重新发送一次。

![请求、状态、解析与业务四层错误](https://note.lgdsunday.club/img/Q465/02-error-layers.webp)

### 取消和超时，也需要明确含义

Fetch 可以使用 AbortController 取消请求；超时通常需要通过取消机制或目标环境支持的接口组织。Axios 也提供相应配置，但具体行为与运行环境和适配器有关。

取消客户端等待，不保证服务器停止业务执行。如果用户离开页面以后提交已经到达服务器，后端仍可能完成操作。

选型时可以先列需求：是否需要统一拦截、默认配置、运行环境适配，以及团队是否已经有稳定封装。简单应用用 Fetch 足够合理；复杂请求管理使用 Axios 也有价值。不要把“原生”或“少一个依赖”当成忽略错误边界的理由。

## 面试官继续追问

### 404 一定应该抛异常吗？

不一定。如果查询结果允许不存在，应用可以把它解释为空结果。关键是明确接口语义，而不是让每个页面随意处理。

### catch 能区分所有失败吗？

可以捕获很多异常，但需要检查类型或上下文。一个笼统 catch 不会自动告诉我们错误发生在网络、HTTP、解析还是业务层。

### 每个请求都创建客户端合适吗？

浏览器 Fetch 没有相同的客户端对象管理问题；Python httpx 等客户端通常要考虑连接复用和关闭。示例用于说明语义，生产服务应按生命周期复用合适的客户端。

## 面试速记卡

> - Fetch 默认：HTTP 404、500 仍可能返回正常响应对象。
> - Axios 默认：按 validateStatus 判断 HTTP 状态是否拒绝。
> - 三层判断：请求响应、HTTP 状态、业务结果分别处理。
> - 解析边界：200 响应也可能不是合法 JSON。
> - 重试边界：客户端超时不等于服务端没有执行。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **腾讯 · 前端（TEG / QQ音乐 / PCG） · 暑期实习**：Axios 在前端项目中怎样使用？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353156343349583872)；面试记录为 2020 年 3 月；原帖编辑于 2020-04-19。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
