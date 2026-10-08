# Vue 3 的 shallowRef 和 markRaw 有什么区别？什么时候不需要深度响应式？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q362-shallowref-markraw/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：shallowRef 和 markRaw 都能避免深度响应式，它们一样吗？

🙋‍♂️ 我：shallowRef 只追踪 value 的替换，markRaw 让对象不被代理。

🧑‍💻 面试官：shallowRef 里改 count，页面为什么不更新？

🙋‍♂️ 我：内部对象没有自动转换成深层响应式对象。

🧑‍💻 面试官：那把 markRaw 对象的 nested 单独放进 reactive，nested 还一定保持原引用吗？

> shallowRef 管「容器如何追踪」，markRaw 管「对象是否转换」。不要把两者都理解成深度冻结。

## 面试速答（60 秒版）

shallowRef 创建一个只追踪 value 访问和替换的 ref。放进去的普通对象不会自动做深层响应式转换，所以替换整个 value 可以触发更新，直接修改内部普通字段通常不会。

markRaw 则给对象标记，让它本身跳过 Vue 的代理转换。它适合某些第三方实例或不需要响应式处理的对象。

两者可以配合：用 shallowRef 保存图表实例，再在需要时替换实例。但 markRaw 不会冻结对象，也不会递归把所有嵌套对象都标记为原始。

实际选择时，我会明确数据是否采用整体替换。如果业务依赖细粒度字段更新，就不能为了性能直接改成浅层；如果使用原始对象和代理混合，还要注意引用身份差异。

![浅层容器，与原始对象分开](https://note.lgdsunday.club/img/Q362/01-overview-v2.webp)

*图：内部修改不自动触发，指的是放入 shallowRef 的普通对象；已有响应式对象的行为仍然保留。*

## 知识点详解：减少深层转换以后，谁负责触发更新？

### shallowRef 的边界在 value 这一层

假设页面保存一份很大的不可变数据快照。每次刷新都得到完整新对象，而不是逐项修改旧对象。

这个场景可以评估 shallowRef：它保留内部值，不自动把整棵普通对象转换为深层代理；当 value 被替换，依赖它的更新仍然可以触发。

#### TypeScript

```ts
import { shallowRef } from "vue";
const state = shallowRef({ count: 0 });

state.value.count = 1; // 不会单独触发浅层 ref 的更新
state.value = { count: 2 }; // 替换 value 会触发
```

示例使用 Vue 官方响应式 API，Python 没有同一套框架实现。如果传入的值本来就是响应式对象，它自身的响应式行为仍然存在；“浅层”不意味着自动取消已有代理。

### 内部修改以后，需要更新怎么办？

可以采用整体替换，让更新规则保持一致。如果确实已经修改内部普通数据，也可以在合适位置使用 triggerRef 显式触发相关依赖。

但是，频繁修改细小字段又不断手动 triggerRef，可能说明浅层方案不符合业务。选择 shallowRef 的前提，是团队能够遵守它的更新约定，而不是只为了省转换成本。

### markRaw 保护的是对象本身，不是整棵引用图

假设图表库返回一个复杂实例。我们不希望 Vue 给它套代理，可以使用 markRaw，让这个实例保持原始。

但如果实例内部有 nested，nested 本身没有单独标记。把它拿出来放进另一个 reactive 对象，再读取时，就可能得到代理后的引用。

于是，原始 nested 与代理 nested 用 === 比较可能不同。集合键、第三方实例判断等依赖身份的场景，需要特别注意。

这些浅层和身份边界可以核对 [Vue 高级响应式 API](https://vuejs.org/api/reactivity-advanced.html)。

![原始 nested 与代理 nested 可能不同](https://note.lgdsunday.club/img/Q362/02-identity.webp)

*图：原始 nested 与代理 nested 可能不同。*

### 什么时候用，什么时候不要用？

| 数据特征         | 可以评估                  |
| ------------ | --------------------- |
| 大数据快照，每次整体替换 | shallowRef            |
| 不希望代理的第三方实例  | markRaw               |
| 需要同时替换第三方实例  | shallowRef 配合 markRaw |
| 经常依赖嵌套字段变化   | 常规深层响应式或明确局部设计        |

它们都不是 readonly，也不是 Object.freeze。对象仍然可能被其他代码修改，只是响应式追踪范围改变了。

此外，保存图表实例还要处理卸载时的 dispose。跳过代理并不会自动释放第三方资源，这属于实例生命周期，而不是响应式 API 的职责。

## 面试官继续追问

### shallowRef.value 赋回同一个对象，会触发吗？

不能依靠这种写法表达内部变更。同一引用没有产生预期的值替换；需要按框架规则使用新对象或显式触发。

### markRaw 可以提升所有页面性能吗？

不能。失去需要的追踪会导致界面不更新。只有确认转换成本和数据使用方式后，才值得使用。

### 大列表一定改成 shallowRef 吗？

先确认瓶颈是转换、渲染还是布局。浅层只解决其中一部分，虚拟列表和组件组织可能更重要。

## 面试速记卡

> - shallowRef：追踪 value 的访问与替换。
> - 内部普通字段：修改不会自动触发浅层 ref。
> - markRaw：对象本身跳过代理，不递归冻结。
> - 身份风险：原始对象与代理引用可能不同。
> - 工程前提：明确整体替换约定和资源清理。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
