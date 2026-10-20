# React useId 有什么用？为什么不能拿它当列表 key？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q744-react-useid-accessibility-hydration/) · [题库目录](../../README.md)

*以下对话为教学模拟，用来讲解这道题。*

🧑‍💻 面试官：表单组件里写一个固定的 input id，会有什么问题？

🙋‍♂️ 我：组件在页面里出现两次，id 就重复了，可以用 useId 生成。

🧑‍💻 面试官：那列表也需要唯一标识，能用 useId 当 key 吗？

🙋‍♂️ 我：它既然能生成唯一 ID，好像也可以。

🧑‍💻 面试官：但列表删除第一条以后，剩下的身份应该跟着数据走，还是跟着某次组件调用走？

> “这两个 DOM 属于一组”和“这一条数据还是原来的数据”，需要的是两种身份。

## 面试速答（60 秒版）

useId 用来生成与组件中某次 Hook 调用关联的标识，常见用途是把 label、input 和说明文字关联起来，避免同一个表单组件出现多次时，写死的 id 发生冲突。

它也考虑了服务端渲染与客户端水合。在组件树一致的前提下，React 能够让两端生成对应的 ID，不需要依赖全局计数器或每次渲染随机生成。

但列表 key 应该来自数据本身，例如用户 ID。key 是 React 用来判断是否复用组件的依据，不能等组件开始执行以后，再用内部生成的 useId 反过来决定它是谁。

因此，useId 适合 DOM 关联，不适合数据库主键、跨会话身份或列表 key；多个独立 React 根还需要考虑 identifierPrefix，不能把唯一性理解成脱离应用范围的全球唯一。

![两个复用表单实例保持各自标签和说明关联](https://note.lgdsunday.club/img/Q744/01-useid-overview.webp)

## 知识点详解：同一个输入框，也会需要几种不同的标识

### 把组件写两遍，固定 id 就会撞车

假设页面同时显示“收件邮箱”和“备用邮箱”，两处都复用 EmailField。组件内部若固定写 `id="email"`，页面就有了两个同名 id，label 关联和辅助说明都可能指错对象。

useId 让每个实例准备自己的标识。下面是 React 的 TypeScript 组件片段，Python 没有 React Hook 的官方对应实现，不提供同名函数来凑对照。

#### TypeScript（React）

```tsx
import { useId } from "react";

export function EmailField({ label }: { label: string }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={`${id}-input`}>{label}</label>
      <input id={`${id}-input`} aria-describedby={`${id}-hint`} />
      <p id={`${id}-hint`}>请填写可以接收邮件的地址</p>
    </div>
  );
}
```

这里没有必要调用两次 useId。一个基础标识加上不同后缀，就能关联这组 input 和 hint。真正重要的是 htmlFor、id 和 aria-describedby 最终能对上，不要依赖 React 输出的具体字符串长相。

### 为什么不能在 map 里给每一项调用 useId？

首先，Hook 不能放在循环里调用。列表数量变化，会让 Hook 的调用顺序发生变化。

就算把 useId 放进子组件，父组件也仍然需要先有 key，才能决定这次子组件是否延续旧实例。

假设列表是用户 A、B、C，删除 A 后变成 B、C。我们希望 B 的输入状态继续属于 B，而不是复用“原来第一个位置”的状态。这个要求来自用户数据的身份，应该由 `key={user.id}` 表达。

列表 key 与 DOM id 还处于不同范围。key 只需在同一组兄弟节点中区分数据；DOM id 要满足文档内的关联需求。两者都叫标识，却不是同一个接口。

![列表key要跟着数据变化而不是某次Hook执行](https://note.lgdsunday.club/img/Q744/02-dom-id-versus-key.webp)

### 服务端和客户端为什么不各生成一个随机数？

服务端先输出 HTML，客户端随后对这份 HTML 做水合。假如服务端生成 A，客户端又随机生成 B，两边属性就对不上了。

全局计数也存在问题。客户端接管不同组件的先后顺序，未必与服务端输出顺序相同。

[React 官方 useId 文档](https://react.dev/reference/react/useId)解释，它利用组件的父路径等信息来形成对应标识，因此不依赖两端以相同先后顺序完成渲染。但这仍有一个前提，服务端和客户端的组件树需要一致。

如果客户端根据 window 宽度多渲染了一段组件，useId 不会替我们修复这份结构差异。它解决 ID 对应，不是自动修复所有水合问题。

### 多个 React 根，怎样避免互相撞到？

有些页面由几个独立 React 应用组成，各自调用 createRoot。此时应为它们设置不同的 identifierPrefix；某个根同时做服务端渲染时，该根在服务端和客户端使用的前缀又必须一致。

因此，生成出来的 ID 不适合保存到数据库，等用户下次打开页面继续作为业务身份。组件卸载、重建或渲染结构变化，都不是跨会话身份协议。

![SSR与水合需要组件树一致而非随机数一致](https://note.lgdsunday.club/img/Q744/03-ssr-id-match.webp)

## 面试官继续追问

### 把 useId 用在 CSS 选择器里可以吗？

不要依赖其内部格式。某些字符放进 CSS 选择器需要转义，项目中可以用 class 表达样式，用 useId 处理关联；必须拼选择器时，按平台规则正确转义。

### 所有 label 都必须用 useId 吗？

也不必。label 直接包住 input 时，可以形成隐式关联。需要跨位置关联说明、错误文字，或者多个相关元素时，明确的 id 更方便。先看 HTML 语义，不是每个输入框都必须增加一个 Hook。

### 怎么检查这段代码真的有用？

同页渲染两次组件，检查 ID 是否不同、各自引用是否存在，再验证点击 label 能否聚焦自己的输入框。服务端项目还要检查水合日志和两端树结构，不能只测单个纯客户端实例。

## 面试速记卡

> - useId：为组件中的关联元素生成标识，不依赖字符串内部格式。
> - DOM 关联：label、input、说明和错误信息应该互相对应。
> - 列表 key：来自数据身份，不由 useId 生成。
> - 水合前提：两端组件树一致，ID 对应不等于修复结构差异。
> - 多个根：使用不同前缀；同一个根两端前缀一致。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
