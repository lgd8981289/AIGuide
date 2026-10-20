# React useActionState 和 useFormStatus 有什么区别？表单状态由谁维护？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q745-react-useactionstate-useformstatus/) · [题库目录](../../README.md)

*以下对话为教学模拟，用来讲解这道题。*

🧑‍💻 面试官：React 表单提交时，useActionState 和 useFormStatus 都能拿到 pending，它们一样吗？

🙋‍♂️ 我：都是管理提交状态的，可以互相替换。

🧑‍💻 面试官：那用户名校验失败，错误文字放在哪？提交按钮拆成组件，又怎么知道所属表单正在提交？

🙋‍♂️ 我：一个需要保存提交结果，另一个只需要读父表单状态。

🧑‍💻 面试官：如果在 Form 组件顶层调用 useFormStatus，再在返回值里创建 form，为什么 pending 一直不变？

> 两个 Hook 的区别，先看状态属于谁：Action 的返回结果由 useActionState 保存，表单里的子组件由 useFormStatus 读取提交状态。

## 面试速答（60 秒版）

useActionState 把一个 Action 与状态连接起来。它接收 Action 函数和初始状态，返回当前结果、触发 Action 的函数，以及这组 Action 是否仍在处理中。Action 会收到上一次状态，返回值再成为新状态，因此适合保存表单校验错误和提交结果。

useFormStatus 不负责保存这份结果，它读取最近父 form 的提交状态。比如把提交按钮做成通用组件，它不用接收好几层 pending 参数，也能知道所属表单有没有正在提交。

关键是，这个按钮组件必须位于 form 里面。在一个组件里调用 useFormStatus，再由这个组件自己创建 form，Hook 读不到这个尚未成为它父节点的表单。

两者经常配合使用，但不提供服务端鉴权和幂等保证。按钮禁用了，也不能据此认为重复提交和越权问题已经解决。

![两个Hook各自保存Action结果或读取父表单状态](https://note.lgdsunday.club/img/Q745/01-action-form-status-overview.webp)

## 知识点详解：一次提交，有结果，也有进行中的状态

### 用户名没填，应该返回什么？

咱们假设正在写一个修改昵称的表单。用户点提交以后，有几件事需要分别处理：收集 name、检查输入、等待保存、显示结果，以及在等待时禁用按钮。

其中，“昵称不能为空”是一份可显示的业务结果。可以让 Action 返回 `{ message: "请填写昵称" }`，由 useActionState 保存，再渲染到页面。

而“提交中”只是这次操作的进行状态，不应该靠错误文字是否为空推断。一次成功结果可以仍然保留在页面上，下一次提交又已经开始了。

### 两个 Hook 可以各做一部分

下面是 React 19 系列的 TypeScript 组件。save 是传入的异步保存函数，示例不假装连接真实服务。React 没有官方 Python Hook 实现，这里不机械补一个 Python 版本。

#### TypeScript（React）

```tsx
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

type Result = { message: string };

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>{pending ? "保存中" : "保存"}</button>;
}

export function NameForm({ save }: { save: (name: string) => Promise<void> }) {
  const [state, formAction] = useActionState<Result, FormData>(
    async (_previous, data) => {
      const name = String(data.get("name") ?? "").trim();
      if (!name) return { message: "请填写昵称" };
      try {
        await save(name);
        return { message: "已保存" };
      } catch {
        return { message: "保存失败，请稍后重试" };
      }
    },
    { message: "" },
  );

  return (
    <form action={formAction}>
      <input name="name" aria-label="昵称" />
      <SubmitButton />
      <p role="status">{state.message}</p>
    </form>
  );
}
```

注意 Action 的第一个参数是 previous state，第二个才是 FormData。如果把普通表单函数原样搬过来，仍然把第一个参数当 FormData，读取字段就会失败。

把 formAction 交给 form 的 action，是让 React 在相应 Action 上下文里触发它。如果手动从事件处理函数调用异步 Action，则需要使用 startTransition 等正确入口，不能只拿到函数以后随处调用，再期待 pending 都能自动对应。

### 为什么 Hook 和 form 写在同一个组件里不行？

组件执行 Hook 的时候，能够读取的是它上方已经存在的上下文。这个组件返回的 form 是它的后代，不会倒过来成为它自己的父节点。

SubmitButton 被 form 包住，因此能读取这份状态。NameForm 自己若调用 useFormStatus，读取的只能是更上层的 form；没有上层 form，就读不到这次提交。

[useFormStatus 的官方约定](https://react.dev/reference/react-dom/hooks/useFormStatus)也明确区分了父 form 与当前组件返回的 form。这是组件层级问题，不是 Hook 调用早了一点，包一层 setTimeout 也解决不了。

![useFormStatus读取父form而非当前组件返回的form](https://note.lgdsunday.club/img/Q745/02-parent-form-hierarchy.webp)

### 一直点保存，会同时执行很多次吗？

同一个 useActionState 的 Action 会排队，后一次使用前一次的结果作为 previous state。pending 表示这组被触发的 Action 仍有未完成项，不只表示某一次 fetch。

因此，useActionState 适合结果存在前后关联的更新，但不该被当成通用并发请求库。[官方 useActionState 文档](https://react.dev/reference/react/useActionState)对此有专门的队列说明。

示例把可预期的保存失败转成文字结果；未被处理的异常则还有错误边界等处理路径。真实项目应按错误性质决定，不要把所有程序错误都伪装成“输入不合法”。

![useActionState队列与pending范围](https://note.lgdsunday.club/img/Q745/03-action-state-queue.webp)

## 面试官继续追问

### useActionState 只能搭配 Server Function 吗？

不只能。客户端 Action 也可以使用。Server Function 涉及的传输、序列化和渐进增强是另一层能力，不是这个 Hook 自动生成了一个安全服务端接口。

### 乐观更新的值也放这里吗？

可以配合 useOptimistic 展示“尚未确认但先显示”的内容；useActionState 保存 Action 的结果。两者对应的确认程度不同，不能把本地先显示的昵称当成服务器已经保存。

### 怎样验证表单状态没有串？

同页放两个表单，延迟其中一个 save，检查只有所属按钮进入 pending；再测试空值、成功、失败和连续提交。服务端另测权限和重复提交，不能用按钮禁用代替。

## 面试速记卡

> - useActionState：保存 Action 返回状态，并提供触发函数和 pending。
> - 参数顺序：先 previous state，再接提交数据。
> - useFormStatus：读取最近父 form 的提交状态，不保存业务结果。
> - 层级要求：在 form 的子组件里读取，不能读取自己刚返回的 form。
> - 工程边界：UI pending 不代替服务端鉴权、幂等和真实成功确认。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
