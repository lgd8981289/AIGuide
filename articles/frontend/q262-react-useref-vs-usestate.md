# React 的 useRef 和 useState 有什么区别？为什么修改 ref 页面不更新？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q262-react-useref-vs-usestate/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：useRef 和 useState 都能保存值，为什么要分成两个 Hook？

🙋‍♂️ 我：state 改变会更新页面，ref 改变不会。

🧑‍💻 面试官：那计时器的句柄和页面上的秒数，你分别放哪里？

🙋‍♂️ 我：句柄放 ref，秒数放 state。

🧑‍💻 面试官：如果我把秒数也放 ref，然后每秒修改 current，页面为什么停在原来的数字？ref 没更新，还是 React 没有重新渲染？

> 先判断这个值是「拿来显示的」，还是「留着以后操作的」。能保存值，不代表能通知页面更新。

## 面试速答（60 秒版）

useState 保存参与渲染的状态。通过 setter 请求更新后，React 会根据更新规则安排渲染，组件再用新的状态生成界面。

useRef 返回一个在多次渲染之间保持身份的对象。修改 ref.current 能保存最新值，但这个修改本身不会触发重新渲染，适合保存计时器句柄、DOM 引用等不直接决定显示内容的数据。

因此，页面上的秒数放 state，停止计时器要用的句柄放 ref。也不要为了绕开 state 的更新规则，把所有值都塞进 ref；如果一个值需要参与界面计算，就应该让 React 能追踪它。

![计时器秒数与控制句柄的职责区分](https://note.lgdsunday.club/img/Q262/01-state-ref-overview-v2.webp)

## 知识点详解：做一个计时器，为什么要存两种数据？

### 显示的秒数，和停止计时器用的句柄

假设咱们写一个页面计时器。点击开始后，页面每秒显示一个新的数字；点击停止后，不再继续计时。

完成这个功能需要保存两份数据。

第一份是秒数，用户需要看到它变化。第二份是 setInterval 返回的句柄，代码之后要把它交给 clearInterval。用户不需要看到这个句柄，也不需要因为它换了一个值，就重新生成整页界面。

所以，秒数适合放 state，句柄适合放 ref。区分依据不是“数字用 state、对象用 ref”，而是这个值在功能里承担什么职责。

### state 更新，为什么能让数字重新显示？

组件函数执行时，React 提供本次渲染的状态。组件根据它生成 JSX，React 再把相应变化提交到界面。

调用 setter，就是向 React 请求一次状态更新。如果更新确实需要渲染，组件会再次执行，并得到本次对应的状态值。[React 状态说明](https://react.dev/learn/state-as-a-snapshot)把它描述为渲染时的快照。

这里也别背成“调用 setter，立刻把当前函数里的变量改掉”。当前事件处理函数拿到的仍然是它所在那次渲染的状态。连续递增时，通常采用函数式更新，让每次计算基于前一份状态。

### ref 更新，为什么 React 不知道？

ref 是一个包含 current 属性的对象。后续渲染仍能拿到同一个 ref 对象，因此它能跨渲染保存信息。

但给 current 赋值，本质上是修改普通对象属性。React 不会把每一次这样的赋值都登记成状态更新，也不会因为它改变就自动再次调用组件。[useRef 官方文档](https://react.dev/reference/react/useRef)明确说明了这点。

假设事件里把 ref.current 从 0 改成 1，再用弹窗读它，可以看到 1。说明数据已经改变。

但如果原来的界面显示的是 0，这次赋值没有安排新渲染，界面就还在原来的结果上。不是 ref 丢了数据，而是保存和重新显示之间，没有发生状态更新这一步。

如果之后其他状态导致组件重新渲染，某些写法可能碰巧显示出 ref 的新值。这不代表 ref 已经成为可靠的渲染状态。React 也不建议在渲染过程中随意读写 current 来决定输出。

![ref 属性改变与 React 渲染通知分离](https://note.lgdsunday.club/img/Q262/02-ref-no-render.webp)

### 把这两个职责写在同一个组件里

下面是浏览器 React 的 TypeScript 示例。Python 没有相同的 React Hook 运行时，因此不提供一个名字相似、行为却不同的版本。

```tsx
import { useEffect, useRef, useState } from "react";

export function Timer() {
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<number | null>(null);

  function stop() {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function start() {
    if (timerRef.current !== null) return;
    timerRef.current = window.setInterval(() => {
      setSeconds(previous => previous + 1);
    }, 1000);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);

  return (
    <div>
      <p>已计时 {seconds} 秒</p>
      <button onClick={start}>开始</button>
      <button onClick={stop}>停止</button>
    </div>
  );
}
```

开始时先检查句柄，避免连续点击创建多个计时器。每一轮只更新 seconds，句柄留给停止操作使用。组件卸载时，也会清理尚未停止的计时器。

这个例子演示的是 Hook 的职责，不是精确计时方案。浏览器后台调度可能延后计时器；需要真实经过时间时，应以时间戳计算，不直接把回调次数当作精确秒数。

![计时器句柄跨渲染保留及重复启动与清理](https://note.lgdsunday.club/img/Q262/03-timer-ownership.webp)

### 普通变量为什么不能代替 ref？

把句柄写成组件函数里的普通局部变量，每次渲染都会重新执行相应声明。之前的值未必还能通过下一轮事件函数拿到。

放在组件外面虽然不随这个组件重建，却又可能被多份组件共享。页面上放两个计时器，不能让它们误用同一个句柄。

ref 正好保存“属于当前组件这份实例、需要跨渲染使用、又不需要触发显示更新”的信息。

验证时，可以连续点击开始，确认只创建一个计时器；点击停止，确认数字不再增加；重新开始，确认能够继续；离开页面，确认没有遗留回调。不要只测试第一秒有没有变化。

## 面试官继续追问

### ref 只能保存 DOM 吗？

不是。DOM 引用是常见用途，但它也能保存句柄、请求序号等其他值。关键仍然是用途，不是类型。

### ref 能解决所有闭包旧值问题吗？

不能一概而论。它可以让某些回调读取最新值，但你需要明确什么时候更新 ref、谁读取，以及这个值是否本该参与渲染。否则可能只是绕开 React 的数据流，让问题更难追踪。

### 修改 state 里面的对象，再放进 ref，可以更新页面吗？

不能靠这一步通知 React。参与渲染的状态要按状态更新规则处理，不应直接修改原对象，再期待 ref 替你触发界面更新。

## 面试速记卡

> - state：保存参与界面计算的数据，通过更新接口请求渲染。
> - ref：保存跨渲染的可变信息，修改 current 不主动触发渲染。
> - 计时器：秒数用 state，停止用的句柄用 ref。
> - 普通变量：组件内局部变量会随执行重新声明，组件外变量可能被共享。
> - 边界：不随意在渲染过程中读写 ref，也别把所有状态搬进 ref。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
