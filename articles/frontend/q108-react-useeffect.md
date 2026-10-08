# React 的 useEffect 怎么工作？依赖数组、清理函数和重复执行如何理解？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q108-react-useeffect/) · [题库目录](../../README.md)

<!-- 以下对话为教学模拟。 -->

🧑‍💻 面试官：useEffect 是干什么的？

🙋‍♂️ 我：组件渲染以后执行一些副作用，比如请求数据和订阅事件。

🧑‍💻 面试官：那我把计算总价也放进去，再 setState，可以吗？

🙋‍♂️ 我：能写出来，但如果只是根据当前数据算结果，通常不需要 Effect。

🧑‍💻 面试官：依赖变化时，先清理旧订阅还是先建立新订阅？开发时请求发了两次，直接加一个 ref 阻止第二次就好吗？

> useEffect 要抓住「同步外部系统」：组件当前需要哪条连接，旧连接什么时候撤掉，新连接什么时候建立。

## 面试速答（60 秒版）

useEffect 用来让组件与外部系统保持同步，比如建立连接、订阅事件或管理浏览器资源，不是把所有渲染后的逻辑都装进去。

组件提交后，React 根据依赖决定是否运行 Effect。依赖变化时，先执行上一次的清理函数，再用新的值执行 setup；组件卸载时也会清理。

不写依赖数组，通常每次提交后都会运行；空数组表示不因依赖变化而重新运行，但组件重新挂载仍会执行。依赖中的值用 Object.is 比较，新建对象和函数可能导致再次运行。

开发环境的 Strict Mode 在适用情况下会额外执行一次 setup、cleanup、setup，帮助暴露清理问题。应该让建立和撤销相互对应，而不是单纯屏蔽第二次执行。异步请求还需要防止旧响应覆盖新页面。

![useEffect：同步外部系统](https://note.lgdsunday.club/img/Q108/00-60s-overview.webp)

## 知识点详解：为什么不是“组件加载完就运行一次”？

### 先问这段代码需不需要 Effect

假设购物车已经有商品和数量，总价可以在渲染时直接计算。如果把它放进 Effect，再保存到 state，就多了一份需要维护的数据，还会多一次更新。

用户点击“提交订单”，则属于明确事件触发的操作。通常应该写在事件处理函数中，不能因为想“渲染后提交”，就放进一个可能重复执行的 Effect。

而连接聊天室不同。组件显示房间 A，就需要订阅 A；切换到 B，就需要取消 A、订阅 B。这才是与外部系统同步。

[React 官方 useEffect 文档](https://react.dev/reference/react/useEffect)明确了 setup、cleanup 与依赖的关系。先分清用途，再谈执行时机，代码会更容易判断。

### 把一次切换按时间展开

假设 Effect 依赖 `roomId`：

- 页面提交房间 A，执行 setup，建立 A 的连接。
- 下一次提交切换到房间 B，依赖变了，先 cleanup 断开 A。
- 然后执行新的 setup，建立 B 的连接。
- 页面离开，执行最后一次 cleanup，断开 B。

清理函数保留的是它那一轮 setup 使用的值，所以它知道要断开 A，不会因为新页面已经是 B 就清错连接。

不要把每一次组件函数调用都当成 Effect 已执行。React 可以进行未提交的渲染尝试，Effect 的同步工作与实际提交相关。

![切换房间：先清理，再建立](https://note.lgdsunday.club/img/Q108/01-detail.webp)

### 依赖不是“想什么时候执行就填什么”

Effect 读取了哪些响应式值，就需要正确声明相应依赖。少填一个，并不是优化；它可能使连接、回调或请求继续使用旧值。

而一个对象每次渲染都重新创建，即使属性内容相同，引用也不同。如果把它放进依赖，Effect 就可能重复运行。可以调整代码组织，把只供 Effect 使用的对象放到 setup 内部；需要共享时，再判断是否值得稳定引用。

空数组也不是“整个应用生命周期只运行一次”。组件卸载再挂载会运行，开发检查也可能额外运行。

### 清理不仅是断连接，还要防止旧结果生效

用户先选 A，再迅速选 B。两个请求按 A、B 发出，却可能按 B、A 返回。没有保护，A 的旧结果就会盖住 B 的页面。

下面是组件中的局部教学示例。它使用浏览器 API，不伪造 Python 版 React Hook。

```typescript
useEffect(() => {
  let active = true;
  const controller = new AbortController();
  setData(null);

  fetch(`/api/items/${encodeURIComponent(itemId)}`, {
    signal: controller.signal,
  })
    .then(response => {
      if (!response.ok) throw new Error("请求失败");
      return response.json();
    })
    .then(result => {
      if (active) setData(result);
    })
    .catch(error => {
      if (active && error.name !== "AbortError") setError(error);
    });

  return () => {
    active = false;
    controller.abort();
  };
}, [itemId]);
```

清理时，既尝试取消请求，也阻止这一轮的结果继续更新页面。取消不保证服务端已经停止业务处理，因此它不能用来实现“撤销一次下单”。

完整项目还要处理加载状态、错误恢复、缓存和请求去重。框架的数据加载机制或专门的数据层，可能比组件中手写每个请求更合适。

![旧请求回来，不能盖住新页面](https://note.lgdsunday.club/img/Q108/02-detail.webp)

### 开发时多执行一次，是在检查什么？

[Strict Mode 官方说明](https://react.dev/reference/react/StrictMode)介绍了额外的开发检查，具体行为与启用位置有关，不能说所有环境都固定执行两次。

它希望检查的是：建立连接后马上撤销，再建立，系统是否仍然正常。订阅有没有重复留下，计时器有没有取消，清理是否真的对应 setup。

如果用 ref 单纯挡住第二次，却没有补好 cleanup，组件以后真的重新挂载，问题仍然会回来。

## 面试官继续追问

### useEffect 一定在浏览器绘制之后吗？

不能这样保证。通常它允许浏览器先绘制，但交互触发等情况可能不同。如果必须在绘制前测量并调整布局，可以考虑 useLayoutEffect，同时注意阻塞绘制的成本。

### useEffect 的 setup 能直接写成 async 吗？

不建议。setup 应返回清理函数或不返回，而 async 函数返回 Promise。可以在 setup 内定义并调用异步函数，再正常返回 cleanup。

### Effect 里更新 state，就一定无限循环吗？

不一定。需要看更新是否导致相关依赖再次变化。反复创建依赖对象，又在 Effect 里更新 state，就可能形成循环；问题在依赖和更新关系，不在 setState 这个词本身。

## 面试速记卡

> - 用途：让组件与外部系统同步，不替代普通计算和点击事件。
> - 依赖变化：先清理旧 setup，再执行新 setup。
> - 依赖比较：Object.is 比较值，新引用可能触发重跑。
> - 开发检查：正确处理建立与撤销，不只挡住第二次执行。
> - 异步结果：旧请求不能覆盖新状态，取消也不等于撤销业务。

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
