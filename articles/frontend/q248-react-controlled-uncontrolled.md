# React 受控组件和非受控组件有什么区别？value 和 defaultValue 怎么选？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q248-react-controlled-uncontrolled/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：React 的受控输入和非受控输入，有什么区别？

🙋‍♂️ 我：受控用 value，非受控用 defaultValue。

🧑‍💻 面试官：接口回来以后修改 defaultValue，当前输入值就会跟着更新吗？

🙋‍♂️ 我：不能把它当成持续控制当前值的方式，它主要提供初始值。

🧑‍💻 面试官：如果 value 一开始是 undefined，后来变成字符串，为什么 React 会提醒？这两种写法到底由谁保存当前值？

> 别只认属性名。看「输入框当前显示的值，最终由 React 状态决定，还是由 DOM 保存」。

## 面试速答（60 秒版）

受控输入通过 value 或 checked，由 React 提供当前值。用户输入产生事件，代码更新状态，再把新值传回输入框。因此，状态是显示值的主要来源。

非受控输入把当前值交给 DOM 保存，defaultValue、defaultChecked 主要提供初始值；需要提交时，可以通过 FormData 或 ref 读取，而不是每次都把输入写回 React 状态。

受控方式适合实时联动、校验和主动重置；非受控方式适合当前值不必持续驱动其他 React 内容的表单，但提交校验和交互需求仍要实现。

同一个输入生命周期中，不应在受控与非受控之间来回切换。文本受控值可以从空字符串开始；复选框看 checked，不把字符串 value 当成选中状态。

![输入框的值，谁说了算？](https://note.lgdsunday.club/img/Q248/01-overview.webp)

图中 input 标签只保留了关键属性。完整的受控实现还需要 onChange 更新状态；通过 FormData 读取的字段则需要 name，下面的代码会补齐。

## 知识点详解：输入一个名字，数据走哪条路？

### 受控方式，是一次明确的值反馈

假设页面有一个名字输入框，旁边要实时显示“你好，某某”。

使用受控输入时，React 状态保存 name，input 的 value 来自 name。用户输入后触发 onChange，事件中读到新的文字，更新 name；下一次渲染把这个值重新交给 input。

TypeScript / React：

```tsx
import { useState } from "react";

export function Greeting() {
  const [name, setName] = useState("");
  return (
    <label>
      姓名
      <input
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <span>你好，{name || "朋友"}</span>
    </label>
  );
}
```

如果只传 value，却没有让输入变化及时更新到状态，输入框就无法按预期自由修改。若确实是只读，应该明确表达只读意图，而不是留一个无法编辑却看似可输入的控件。

[React input 文档](https://react.dev/reference/react-dom/components/input)给出了 value、事件更新和受控边界。

![受控输入，是一条反馈回路](https://note.lgdsunday.club/img/Q248/02-feedback.webp)

### 非受控方式，React 不持续接管当前文字

同一个输入框，如果只需要在提交时读取，DOM 可以自己保存当前值。

defaultValue 提供起始文字，但之后用户怎么修改，不能把它当成 React 每次渲染都覆盖当前内容的 value。

TypeScript / React：

```tsx
import type { FormEvent } from "react";

export function ProfileForm() {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    console.log(data.get("name"));
  }

  return (
    <form onSubmit={submit}>
      <label>
        姓名
        <input name="name" defaultValue="Sunday" />
      </label>
      <button type="submit">提交</button>
    </form>
  );
}
```

name 让这个输入可以按名字进入 FormData；没有 onChange 状态反馈，也仍然可以输入和读取。

本题是 React 浏览器输入组件，没有同一套 Python React DOM API，不把后端表单库伪装成对应实现。

### 为什么加载数据时容易出现切换警告？

假设状态初始是 undefined，把它直接作为 value 传给 input；稍后接口回来，value 变成 "Sunday"。

最初没有持续的字符串 value 控制，后面却开始受控，这改变了同一个输入实例的使用约定。React 文档提醒不要在它的生命周期中这样切换。

可以在受控方案中用空字符串表示尚未填写；也可以在数据尚未就绪时暂不创建表单，准备好后按确定的方案初始化。

但不要只为了消掉警告，把所有 undefined 强行换成字符串，然后不管“尚未加载”和“用户确实留空”这两个业务状态。显示值和加载状态可以分别保存。

![不要中途换一套控制规则](https://note.lgdsunday.club/img/Q248/03-switch.webp)

### 想重置和联动时，权威来源应该一致

受控表单重置时，更新状态，输入跟着状态变化。别再用 DOM 操作改值，却让 React 状态还保留旧内容。

非受控表单可以按实际需求使用原生表单重置或明确操作 DOM，但旁边如果还有 React 展示，也要知道它不会凭空同步读取当前输入。

一个输入既由状态 value 驱动，又经常被外部脚本强行改值，会形成两套互相争夺控制权的路径。先选主要来源，再定义其他代码怎样配合。

### “受控组件”这个词，不只指 input

在更一般的组件设计中，如果重要状态由父组件通过 props 决定，也常称为受控；如果子组件自己管理，常称为非受控。[React 状态共享指南](https://react.dev/learn/sharing-state-between-components)解释了这种更广泛的用法。

但这种广义设计可以部分受控、部分内部管理，不必把一个复杂组件一刀切成两个互斥标签。

回答 input 题时，先限定当前输入值；讨论可复用组件时，再说哪些状态开放给父组件控制。别把两个层次混成同一条属性公式。

### 选型不是“受控永远先进，非受控只是省事”

实时校验、多个字段联动和页面其他内容依赖输入时，受控通常比较直接。只在提交读取的表单，非受控也有合理用途。

受控输入可能让相关组件随输入更新，但优化应围绕实际渲染范围，而不是直接断言所有受控表单都卡。也不能为了减少更新，把必要的可访问性、错误提示和业务校验省掉。

另外，checkbox、radio 的选中状态看 checked，defaultChecked 是初始选中值。value 通常是提交值，不负责表示现在是否勾选。

## 面试官继续追问

### 有 onChange，就一定受控吗？

不是。可以监听变化但不传 value 持续控制。判断仍然看当前值的主要来源。

### 接口数据更新，defaultValue 会持续同步吗？

不要依赖它做当前值同步。需要跟随外部数据时，采用明确的受控更新，或者在有意识的重建、重置边界中处理初始化。

### 父组件受控，子组件就不能保存任何内部状态了吗？

不是。可以由父组件控制表单值，子组件内部保存展开等局部状态。应逐项说明谁拥有哪份状态。

## 面试速记卡

> - 受控输入：value / checked 来自 React，事件更新后反馈新值。
> - 非受控输入：DOM 保存当前值，初始值不等于持续控制。
> - 切换边界：同一输入实例不要从 undefined 再跳到受控字符串。
> - 选型：看实时联动、重置和提交读取需求，不贴先进落后标签。
> - checkbox：看 checked 表示选中，不把 value 当勾选状态。

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
