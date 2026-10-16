# React useEffectEvent 是什么？如何读取最新状态，又不让 Effect 反复执行？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q542-react-useeffectevent/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：useEffectEvent 解决什么问题？

🙋‍♂️ 我：可以从 Effect 中拆出需要读取最新值、但不应重新触发整个 Effect 的逻辑。

🧑‍💻 面试官：连接由 roomId 决定，提示声音由 muted 决定。muted 改了，需要重新连接吗？

🙋‍♂️ 我：通常不需要，但连接事件发生时，提示逻辑要看到最新 muted。

🧑‍💻 面试官：那把 roomId 也藏进 Effect Event，依赖数组留空可以吗？

> 先判断哪个值应该改变同步关系，哪个值只在事件发生时读取；该触发 Effect 的依赖要保留。

## 面试速答（60 秒版）

`useEffectEvent` 可以把 Effect 中的非响应式逻辑提取出来，让这段逻辑在执行时读取最新的 props 和 state，同时不因为这些读取就重新触发 Effect。

例如聊天连接取决于 roomId，但连接成功时是否播放提示音，要看最新 muted。roomId 仍是连接 Effect 的依赖，提示逻辑则可以放进 Effect Event。

它不能用来随意省略依赖。应该导致重新同步的值仍要保留，也不能把它当成普通点击回调到处传。使用时按当前官方调用限制与 lint 规则检查。

![连接看 roomId，提示看最新偏好](https://note.lgdsunday.club/img/Q542/01-overview.webp)

## 知识点详解：连接什么时候重建，提示什么时候读取偏好

### 先把两种变化分开

假设页面连接某个聊天室。roomId 从 A 变成 B，连接就应该从 A 切换到 B。

与此同时，用户切换静音设置，只改变‘连接成功时要不要播放提示音’。这个变化通常不要求重建聊天室连接。

如果把所有读取值都放在同一个 Effect 中，依赖很容易变成 roomId 和 muted。这样每次切静音，可能都要重新连接。问题出在两段职责被混到了一起。

### Effect Event 在事件执行时读取最新值

可以让连接 Effect 仍围绕 roomId 建立与清理连接，连接成功的处理再调用 Effect Event。

当事件发生时，Effect Event 读取最新的 muted，决定是否提示。这样用户改偏好以后，下一次事件能看到新值，而连接不会只为偏好变化重建。

这属于 Effect 同步过程中的事件逻辑。它不同于缓存一个闭包以后期待闭包自动更新，也不是让所有状态读取都脱离 React 的依赖规则。

![两种变化，触发不同动作](https://note.lgdsunday.club/img/Q542/02-reactivity.webp)

### 哪些依赖不能藏进去

roomId 决定了应该连接哪个聊天室。若把它读进 Effect Event，再让连接 Effect 永远不重新执行，页面可能仍连着旧聊天室。

判断标准可以很具体。这个值变化以后，外部连接、订阅或同步目标是否应该改变？如果应该，它就是要保留的依赖。

不要通过‘lint 不报了’判断逻辑正确。检查实际变化是否触发了该发生的同步，才更可靠。

![事件发生时，再读当前值](https://note.lgdsunday.club/img/Q542/03-latest-values.webp)

### 它也不是一个到处传的稳定回调

当前官方文档限制 Effect Event 的调用与传递方式，应遵守支持该 API 的 lint 规则。它不适合直接当普通 UI 点击事件，也不应随意传给别的组件作为通用回调。

官方还指出返回函数的身份不是用来维持稳定引用的。因此，不要把它当成 useCallback 的替代，再放进依赖列表或其他身份敏感位置。

验证这个例子时，分别改变 roomId、改变 muted，以及在改变 muted 后触发连接事件。三项对应不同的预期，不能只测首次挂载。

本题按 React 自身机制说明；Python 没有同一套官方组件运行时，不补一个看似相同的函数。依据：[React useEffectEvent](https://react.dev/reference/react/useEffectEvent)。

![藏起 roomId，会留下旧连接](https://note.lgdsunday.club/img/Q542/04-missing-dependency.webp)

## 面试官继续追问

### 所有回调都改成 Effect Event，可以吗？

它用于特定的 Effect 事件逻辑，不能当通用事件处理方案。普通交互回调仍按相应组件逻辑组织。

### 用 ref 保存最新值，也能实现吗？

部分场景可以，但要自己维护读写约定，并确认这种非响应式读取是否符合目标。不能因此绕过所有同步依赖。

### roomId 和 muted 都变化时，应该怎样检查？

roomId 变化触发切换连接；之后事件发生应读取当前偏好。还要检查旧连接的清理，避免旧事件影响新页面。

## 面试速记卡

> - 响应式部分：值变化时应重新同步。
> - 事件部分：发生时读取最新 props/state。
> - 依赖：不能为了少重跑而隐藏同步目标。
> - 调用范围与 lint：按官方限制使用。
> - Effect Event 不等于通用稳定回调。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
