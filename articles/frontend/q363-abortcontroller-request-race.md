# AbortController 怎么取消请求？为什么旧请求的结果还可能覆盖新结果？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q363-abortcontroller-request-race/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：搜索框输入变化时，怎么取消上一次请求？

🙋‍♂️ 我：为请求创建 AbortController，新请求开始时取消旧 controller。

🧑‍💻 面试官：取消了，旧结果就绝对不会覆盖新结果吗？

🙋‍♂️ 我：还要考虑请求已经完成，以及后续异步处理。

🧑‍💻 面试官：如果旧请求正在解析结果或做额外转换，你用什么判断它还有没有资格更新页面？

> 取消负责减少不需要的工作，版本检查负责保护页面结果。两者要配合，不能把“发出取消”当成“旧结果绝不会提交”。

## 面试速答（60 秒版）

AbortController 通过 signal 向支持取消的操作发出中止通知。例如 fetch 接收 signal，调用 abort 后，相关请求或响应体读取可以被中止。

但取消不是对所有异步代码的强制终止。请求可能已经完成，后面的解析或转换也未必支持同样的取消。

所以搜索等竞态场景，我会给每次操作分配一个递增版本。只有版本仍然是当前版本，而且没有被取消，才允许更新数据、错误和 loading。

这样既能减少旧请求消耗，也能避免晚到的旧结果覆盖新结果。每次请求使用新的 controller，组件卸载时取消并使旧版本失效。服务端是否已经执行了副作用，还要另外处理。

![取消省工作，版本守结果](https://note.lgdsunday.club/img/Q363/01-overview.webp)

*图：取消省工作，版本守结果。*

## 知识点详解：取消请求，和拒绝旧结果是两道保护

### 旧请求为什么可能后返回？

假设用户先搜索 cat，再马上搜索 car。第一次请求慢，第二次请求快。如果谁最后返回就更新页面，cat 的旧结果会把 car 的新结果覆盖。

这个问题与请求发出顺序不同。异步完成顺序由网络和服务处理决定，所以必须明确“当前页面只接受哪一次请求的结果”。

### AbortController 做到哪里为止？

fetch 支持 signal，可以在操作中止时拒绝相应 Promise。但已经完成的 Promise 不会重新变成未完成；自行编写的后续计算，也不会自动被 controller 关闭。

一个 signal 被中止后不能重新恢复，所以每次请求应创建新的 controller。行为可核对 [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)。

### 提交结果前，再检查一次版本

#### TypeScript

```ts
let version = 0;
let controller: AbortController | undefined;
async function search(query: string): Promise<unknown | undefined> {
  const mine = ++version;
  controller?.abort();
  const current = new AbortController();
  controller = current;
  try {
    const response = await fetch("/api/search?q=" + encodeURIComponent(query), {
      signal: current.signal,
    });
    if (!response.ok) throw new Error("HTTP " + response.status);
    const data: unknown = await response.json();
    if (mine !== version || current.signal.aborted) return undefined;
    return data; // 调用方也应在实际提交处保持相同版本约定
  } catch (error) {
    if (mine !== version || current.signal.aborted) return undefined;
    throw error;
  }
}
```

这是浏览器 fetch 示例，Python 没有对应的 AbortController 官方 API；Python 异步客户端需要使用它自己的取消与清理机制。

示例把请求结果作为返回值。真实页面应把最终版本检查和状态提交放在同一处，避免检查后又等待另一段异步逻辑，再无条件更新。

![晚返回的旧结果，不再有提交资格](https://note.lgdsunday.club/img/Q363/02-race.webp)

*图：晚返回的旧结果，不再有提交资格。*

### loading 和 error 也会发生竞态

不仅 data 会被旧请求覆盖。旧请求的 finally 如果直接把 loading 改为 false，也可能让新请求还在执行时，页面提前显示“加载结束”。

同样，旧请求的错误也可能覆盖新请求成功状态。因此，数据、错误和 loading 都应按当前版本更新，而不是只保护成功分支。

卸载时需要取消当前操作，并使所有未完成版本失效，避免页面销毁后仍提交结果。

![旧请求 finally 也不能结束新 loading](https://note.lgdsunday.club/img/Q363/03-loading.webp)

*图：旧请求 finally 也不能结束新 loading。*

### 浏览器取消，不等于服务端撤销

如果请求已经到达服务端，服务端可能继续执行。查询请求通常只是多做了工作；付款、提交任务等副作用，则不能依靠关闭客户端请求来撤回。

需要幂等、任务状态和明确取消接口时，应单独设计。不能把网络中止当作业务事务回滚。

## 面试官继续追问

### 防抖能代替取消和版本检查吗？

不能。防抖减少发起频率，已经发出的请求仍可能发生乱序。

### 只判断错误名称是 AbortError 够吗？

不总够。取消可以有自定义原因，不同 API 的错误也可能不同。结合 signal 状态和当前版本判断，更贴近当前操作。

### 多个独立请求共用一个 controller 呢？

只有确实需要一起取消时才共用。否则取消一个操作，可能把其他仍需要的请求一并中止。

## 面试速记卡

> - controller：向支持 signal 的操作发出中止。
> - 版本：决定谁有资格提交当前结果。
> - 保护范围：data、error、loading 都要检查。
> - 生命周期：每次新建，卸载取消并使旧版本失效。
> - 服务端：客户端中止不代表副作用回滚。

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
