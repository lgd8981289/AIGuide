# Vue Router 导航守卫有哪些？执行顺序、异步鉴权和重定向怎么处理？

[小红书前端面试真题](../companies/xiaohongshu-frontend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q646-vue-router-navigation-guards/) · [题库目录](../../README.md)

*下面是用于讲题的模拟面试对话。*

🧑‍💻 面试官：未登录用户进入管理页，用 beforeEach 跳登录页就安全了吗？

🙋‍♂️ 我：它控制的是浏览器导航，管理接口还要做服务端鉴权。

🧑‍💻 面试官：登录信息要异步加载，页面会不会先进去，再被赶出来？

🙋‍♂️ 我：可以在守卫里等待检查完成，再决定是否放行。

🧑‍💻 面试官：跳到登录页以后，守卫发现仍未登录，又跳一次登录页呢？

> 守卫控制一次导航能否继续。把待检查、放行、取消和重定向这几条路径分清，才能避免页面闪动和跳转循环。

## 面试速答（60 秒版）

Vue Router 导航守卫分为全局、路由独享和组件内守卫。它们在不同阶段检查导航，决定继续、取消或者改去另一个位置。

常见的全局 `beforeEach` 适合检查登录等共享条件，`beforeResolve` 位于导航确认前、异步组件等已经解析之后，`afterEach` 则在确认后做观察和统计，不能再像前置守卫那样阻止导航。

守卫可以返回 Promise，所以异步鉴权可以等待结果以后再决定。未登录时返回登录路由，明确取消时返回 false，允许时返回 true 或不返回阻止结果。

实现时要让登录页等公共入口免于反复重定向，并区分未登录、无权限和网络失败。前端守卫只能管理导航体验，真实数据和操作权限仍在服务端检查。

![一次 Vue 导航，先检查什么？](https://note.lgdsunday.club/img/Q646/01-vue-router-navigation-guards.webp)

## 知识点详解：一次导航从离开旧页面到进入新页面

### 先离开旧页面，再检查全局和新页面

Vue Router 4 的完整流程包含多个阶段。先触发离开旧组件的 `beforeRouteLeave`，再进入全局 `beforeEach`；复用组件时执行 `beforeRouteUpdate`。随后检查路由 `beforeEnter`、解析异步路由组件，再运行新组件的 `beforeRouteEnter` 和全局 `beforeResolve`。

导航确认以后执行 `afterEach`，再进入 DOM 更新等后续步骤。官方的[完整导航解析流程](https://router.vuejs.org/guide/advanced/navigation-guards.html#the-full-navigation-resolution-flow)给出了具体顺序。

顺序的价值在于知道当前能看到什么。离开守卫适合检查旧页面未保存的编辑；进入新组件之前，不能假设新实例已经创建。参数变化复用组件，也不能认为每次都会重新触发路由独享的 beforeEnter。

### 异步登录检查要交出一个明确结果

假设进入管理页之前要请求当前登录用户。守卫可以等待查询完成，再判断路由是否要求登录。下面是挂接片段，`router` 是应用已创建的 Router，`loadCurrentUser` 是应用自己的身份查询函数，需要有超时和错误处理。

#### TypeScript

```typescript
router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true;

  const user = await loadCurrentUser();
  if (!user) {
    return { name: "login", query: { redirect: to.fullPath } };
  }
  return true;
});
```

这里假定登录页本身没有 requiresAuth。否则跳转仍会再次进入同一条拒绝逻辑，形成循环。网络失败也不应该直接解释成“用户无权限”，应用应显示可重试的错误或其他明确状态。

Vue Router 在浏览器运行，没有对应的 Python 导航守卫 API。Python 服务端的接口鉴权承担另一项职责，不能把它包装成这段代码的同库翻译。

![守卫要把决定交回导航流程](https://note.lgdsunday.club/img/Q646/02-vue-router-navigation-guards.webp)

### 返回重定向，与再调用一次导航不同

当前守卫返回一个路由位置后，原导航会被替换为新的导航过程。新目标也会经过适用的守卫，因此要检查它是否仍落在相同的重定向条件里。

优先使用返回值把当前检查的结论表达完整。兼容旧写法时会看到 `next`，但一次执行路径只能按约定完成一次，不能一边返回结果、一边再调用 next，让控制过程变得不清楚。

登录后使用 redirect 时，也应确认目标是应用允许的内部位置，不能直接信任外部输入作为任意跳转地址。

![页面守卫，替代不了接口权限](https://note.lgdsunday.club/img/Q646/03-vue-router-navigation-guards.webp)

### 怎样检查没有漏掉异常路径？

至少覆盖未登录访问受保护路由、已登录访问、直接进入登录页、身份查询失败和快速连续切换页面。记录最终位置和导航失败情况，确认没有重复请求和循环。

如果参数变化时复用同一组件，还要检查数据是否随新参数更新。守卫执行了，不代表组件里的旧请求就自动取消；同样，看到管理页也不代表服务端已经授权。

## 面试官继续追问

### beforeEach 和 beforeResolve 应该选哪一个？

如果不允许进入，越早确认越能减少无用工作，常见登录检查适合前者。只有确实需要等异步组件或组件守卫处理之后，再做最终确认的工作，才放到后者；不要只因为“更晚”就认为更安全。

### afterEach 能阻止用户进入吗？

它属于导航完成后的钩子，用于统计或观察，也能接收导航失败信息，但不靠返回 false 取消已经确认的导航。需要阻止时应使用前置守卫。

### 路由 meta 里写了角色，是不是权限系统已经完成？

meta 是前端配置。服务端仍要验证当前身份、目标对象和具体动作，不能信任浏览器传来的角色字段，也不能只隐藏按钮就认为权限已经收住。

## 面试速记卡

> - 守卫分全局、路由独享和组件内，阶段决定它能检查什么。
> - 异步守卫等待明确结果，再放行、取消或重定向。
> - 登录页等公共入口避免落入重复跳转条件。
> - afterEach 负责导航后的观察，不能替代前置阻止。
> - 前端控制导航体验，服务端检查真实访问权限。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **小红书 · 前端（社区技术） · 原帖未明确批次**：Vue 的导航守卫有哪些？（题意整理）。[面经来源](https://www.nowcoder.com/feed/main/detail/66d5fe85c5b545e1b23bd044791f368c)；原帖发布于 2023-08-19。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
