# 事件冒泡、事件捕获和事件委托有什么区别？

[腾讯前端面试真题](../companies/tencent-frontend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q130-dom-event-propagation/) · [题库目录](../../README.md)

<!-- 以下对话为教学模拟，非真实面经。 -->

🧑‍💻 面试官：事件捕获和冒泡有什么区别？

🙋‍♂️ 我：捕获从外向内，冒泡从内向外，事件委托是在父元素监听子元素的事件。

🧑‍💻 面试官：按钮里有一个图标，点图标时 event.target 是按钮吗？

🙋‍♂️ 我：可能是那个图标，所以要往上找到按钮。

🧑‍💻 面试官：那 currentTarget 是谁？stopPropagation 会不会连按钮自己的默认行为也一起取消？

> 先分清传播路径、监听位置和默认行为，事件委托才不会靠碰运气。

## 面试速答（60 秒版）

DOM 事件通常经历捕获、目标和冒泡三个阶段。捕获阶段沿祖先路径向目标走，支持冒泡的事件再从目标向外传播；目标阶段是监听目标本身的处理。

事件委托通常利用冒泡，把一组子元素的处理放在稳定的父元素上。event.target 是此次事件的目标，currentTarget 是当前执行监听器所挂的元素，两者不一定相同。

实现时我会从实际点击元素找到要处理的按钮，并确认它属于当前容器。阻止传播使用 stopPropagation，取消可取消的默认行为使用 preventDefault，两者不能混为一谈。

![点击图标的事件沿捕获、目标和冒泡路径传播，监听位置不等于事件目标](https://note.lgdsunday.club/img/Q130/00-60s-overview.webp)

## 知识点详解：一次点击，为什么会经过不止一个元素

### 先把目标和路径放进同一个例子

假设一个列表容器中有删除按钮，按钮内部又有图标。用户点图标，这次点击的目标通常是图标，不是它外面的按钮。

事件沿相应路径先进入捕获阶段，再到目标，随后在允许冒泡时向祖先传播。列表监听器能收到这个点击，并不意味着 target 变成了列表。

在列表监听器执行时，currentTarget 是列表；同一事件到按钮监听器时，currentTarget 则是按钮。普通 DOM 树例子中 target 通常不随冒泡改变，但跨 Shadow DOM 边界可能发生 retargeting，不能把“永远不变”推广到所有场景。

### 事件委托要找到操作目标，不只看点击目标

如果直接判断 target.tagName 是否等于 BUTTON，点击按钮文字可能正常，点击内部图标却失效。更稳妥的方式是查找最近的操作元素，并检查容器边界。

下面是浏览器 TypeScript 示例。Python 没有原生 DOM 事件 API，所以不伪造对应版本；测试时可以用浏览器自动化另写测试代码。

```typescript
const list = document.querySelector<HTMLElement>("#list");
if (list) {
  list.addEventListener("click", event => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest<HTMLButtonElement>(
      "button[data-action='remove']"
    );
    if (!button || !list.contains(button)) return;
    console.log("remove", button.dataset.id);
  });
}
```

这个小例子假设操作按钮都归这个列表管理。如果有嵌套列表，还要进一步确认最近的列表根就是当前根，避免外层误处理内层按钮。事件委托减少了逐个注册的工作，也让后插入的元素可以沿同一路径处理，但不是所有事件都适合这么做。

### 传播和默认行为是两套控制

链接点击后跳转，是默认行为；点击继续传到父元素，是传播。stopPropagation 主要停止进一步传播，不等于取消链接跳转。

preventDefault 作用于可取消的默认行为，调用时还要考虑事件是否 cancelable，以及监听器是不是 passive。它也不会自动停止父元素的监听器。

同一元素上有多个监听器时，stopPropagation 不会阻止其余同元素监听器继续执行；需要这种行为的是 stopImmediatePropagation。全局滥用后者很容易破坏别的组件，所以不要把它当成常规修复。

### 委托的收益，要和组件边界一起看

列表不断新增项目时，父级委托很方便。若每个子组件都有独立生命周期、复杂状态和无障碍交互，框架自身的事件组织往往更易维护。

另外，focus、blur 等事件不按普通 click 的方式冒泡，可以按需求使用捕获或对应可冒泡事件。Shadow DOM 内外的可见路径又受事件 composed 属性和开放/封闭边界影响。

最直接的验证方法，是依次点击按钮本体、内部图标、列表空白处和嵌套列表，再打印 target、currentTarget、eventPhase。这样能看见传播关系，而不是只验证最顺手的一次点击。

本题机制参考：[MDN：Event bubbling](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Event_bubbling)、[MDN：stopImmediatePropagation](https://developer.mozilla.org/en-US/docs/Web/API/Event/stopImmediatePropagation)、[MDN：composedPath](https://developer.mozilla.org/en-US/docs/Web/API/Event/composedPath)。

![事件委托先定位最近的操作按钮，再确认该按钮属于当前容器](https://note.lgdsunday.club/img/Q130/01-detail.webp)

## 面试官继续追问

### 捕获阶段监听器一定最后执行吗？

不是。祖先上的捕获监听器在目标阶段之前执行。目标上的捕获与非捕获监听器属于目标阶段，不能把目标本身简单算成一次向下和一次向上。

### 事件委托一定更快吗？

不一定。它可能减少监听器数量，但增加目标识别和路由逻辑。要看规模、更新方式和测量结果。

### preventDefault 为什么没有效果？

先检查事件是否可取消、监听器是否 passive，以及期望阻止的行为是否真是该事件的默认行为，不要直接改成 stopPropagation。

## 面试速记卡

> - 传播：捕获到目标，再按事件规则冒泡。
> - target：事件目标；currentTarget：当前监听器所在元素。
> - 委托：找到操作元素，并检查所属容器边界。
> - stopPropagation：停止进一步传播，不自动取消默认行为。
> - preventDefault：取消可取消的默认行为，不自动停止传播。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **腾讯 · 前端（TEG / QQ音乐 / PCG） · 暑期实习**：捕获、冒泡和事件委托怎样工作？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353156343349583872)；面试记录为 2020 年 3 月；原帖编辑于 2020-04-19。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
