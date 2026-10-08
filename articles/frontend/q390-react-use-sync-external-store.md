# React 的 useSyncExternalStore 是什么？订阅外部状态为什么不直接用 useEffect？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q390-react-use-sync-external-store/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：React 组件怎样读取一个外部状态库？

🙋‍♂️ 我：读取当前值，再订阅变化；变化以后通知组件重新渲染。

🧑‍💻 面试官：第一次读完以后，useEffect 还没订阅，外部值就变了，会怎样？

🙋‍♂️ 我：只做最简单的订阅，可能漏掉这次变化。

🧑‍💻 面试官：两个组件渲染期间读到了不同版本呢？每次 getSnapshot 都返回一个新对象，又会怎样？

> 外部订阅不仅要“收到通知”，还要让 React 知道本次渲染读取的是哪一份稳定快照。

## 面试速答（60 秒版）

useSyncExternalStore 用于把 React 之外的可变数据接入组件。例如已有状态库，或者能够发出变化事件的浏览器数据。

它需要 subscribe 提供订阅与清理，getSnapshot 提供当前快照。外部数据变化后通知 React，React 再读取快照，判断是否需要更新。

快照必须稳定：数据没变，重复读取就应该得到相同结果；数据变了，再提供新的不可变快照。每次读取都创建新对象，会让 React 误以为数据一直在变。

它还帮助 React 检查渲染期间的外部数据一致性，这不是最简单的 useEffect 加 setState 能完整替代的。如果支持 SSR，还要提供一致的服务端初始快照。普通组件内部状态仍优先使用 React 自己的状态机制。

![外部状态与React怎样保持一致](https://note.lgdsunday.club/img/Q390/01-external-store-overview.webp)

## 知识点详解：通知变化之前，先约定怎样读取数据

### “外部”指的是放在哪儿？

假设两个组件都需要显示一个已有计数器状态库中的数字。状态保存在模块里，不由某个组件的 useState 管理。

库可以自己更新数值，但 React 不会因为模块变量变化就自动重新渲染。因此需要一个接口告诉 React：当前是什么，以及什么时候应该重新读取。

外部并不一定是远程服务器。第三方状态容器、浏览器属性，也都可能是这里的数据来源。

### subscribe 和 getSnapshot 分别负责什么？

subscribe 接收一个回调。数据变化时调用它，并返回取消订阅函数，让组件卸载后能够清理监听。

getSnapshot 则负责读取组件需要的快照。回调不是直接把所有新数据塞给组件，而是通知 React 再检查快照。

如果快照是数字或字符串，稳定比较比较直接。如果它是对象，就需要保证内容没变时引用也不变。React 使用 Object.is 比较快照，不会替你深度比较任意大对象。

### 为什么不能每次包一层新对象？

假设底层计数仍然是 1，但每次读取都返回一个新的 { count: 1 }。

内容虽然一样，对象却不是同一个。React 再次检查时会看到不同结果，可能不断触发更新，甚至提示快照应当缓存。

另一种错误是原地修改对象，再一直返回同一个引用。这样内容变了，比较却看不到引用变化。

合适的方式是：有真实变化时创建新的不可变快照，没变化时返回已有快照。下面只展示这套接口，不是完整状态管理库。

#### TypeScript

```ts
let snapshot: Readonly<{ count: number }> = Object.freeze({ count: 0 });
const listeners = new Set<() => void>();

export const getSnapshot = () => snapshot;
export function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => { listeners.delete(notify); };
}
export function increment() {
  snapshot = Object.freeze({ count: snapshot.count + 1 });
  for (const notify of listeners) notify();
}
```

组件把 subscribe 与 getSnapshot 传给 useSyncExternalStore 即可。这是 React/JavaScript 的接口，没有官方 Python Hook 对应实现；Python 服务可以提供初始数据，但不执行浏览器里的 React 渲染，因此这里不补一个假的同名 API。

![外部store未变时getSnapshot返回同一对象有变化才产生新快照](https://note.lgdsunday.club/img/Q390/02-stable-snapshot.webp)

### 为什么最简单的 useEffect 订阅还不够？

渲染先读了一次数据，Effect 订阅发生在后面。如果两者之间数据变了，仅靠后续事件回调可能错过那次变化。

还要考虑渲染可以被暂停、继续或重做。外部状态在过程中变化，多个组件可能读到不同版本。专门的订阅接口让 React 能再次检查快照，必要时重新组织更新，避免把不一致版本提交到界面。

这不表示所有用 Effect 订阅的代码都必然有错。手工方案需要自己补齐相应检查，不能只展示三行监听就说与框架机制等价。具体契约见 [React 官方说明](https://react.dev/reference/react/useSyncExternalStore)。

### SSR 的初始快照为什么要一致？

服务器可能没有浏览器属性，也可能使用不同的状态实例。getServerSnapshot 用于服务端渲染，也用于客户端接管服务端内容时的初始读取。

这两边需要获得一致的数据。如果服务器输出 count=0，客户端接管时直接用本地 count=5，就会遇到初始内容不对应。

真实用户状态还要按请求隔离，别把所有用户的数据塞进共享模块。初始数据传输也要安全序列化。Hook 解决渲染接入，不自动解决用户隔离与信息泄露。

## 面试官继续追问

### subscribe 写在组件里，可以吗？

可以写，但每次渲染产生新函数时，可能导致重新订阅。无须随参数变化的订阅函数适合保持稳定；依赖变化则需要正确更新，不能为了稳定漏掉新依赖。

### 使用这个 Hook，就不需要状态库了吗？

它提供订阅契约，不替你完成业务状态、更新规则和缓存管理。现有状态库可以在这个接口上接入 React。

### 怎么测试这套接口？

先确认连续读取引用相同，真实更新后引用改变，回调按预期触发，取消订阅后不再通知；再检查 SSR 与客户端初始快照，以及渲染期间更新的界面一致性。

## 面试速记卡

> - subscribe 管通知和清理，getSnapshot 管当前快照。
> - 没变化返回同一快照，变化后提供新的不可变快照。
> - 新对象不等于新数据，原地修改也可能隐藏变化。
> - 最简单的 Effect 订阅没有覆盖全部渲染一致性问题。
> - SSR 与客户端接管要使用一致初始数据。
> - 外部状态接入与业务状态管理，分别负责。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
