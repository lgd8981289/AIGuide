# Vue 的 computed、watch、watchEffect 有什么区别？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q139-vue-computed-watch/) · [题库目录](../../README.md)

<!-- 以下对话为教学模拟，非真实面经。 -->

🧑‍💻 面试官：Vue 的 computed、watch、watchEffect 有什么区别？

🙋‍♂️ 我：computed 有缓存，watch 用来监听数据变化。

🧑‍💻 面试官：购物车总价改变后，要更新界面，还要保存草稿。这两件事都放 watch 里吗？

🙋‍♂️ 我：可以监听商品列表，然后重新计算总价，再发保存请求。

🧑‍💻 面试官：那总价的来源有两个了。保存请求回来得比下一次修改还晚，又怎么办？

> 先分清两件事：算出一个值，还是因为变化去做一件事。前者用 computed，后者再考虑 watch 或 watchEffect。

## 面试速答（60 秒版）

`computed` 适合从已有状态算出新值，例如根据购物车商品算总价。它会跟踪响应式依赖，在依赖没有变化时复用计算结果，计算函数应当保持纯粹。

`watch` 适合有明确监听目标的副作用，例如用户改了搜索词，再请求接口。它只跟踪指定的来源，回调里读到的其他状态不会自动成为监听目标。

`watchEffect` 会立即执行，并自动跟踪同步执行过程中读到的响应式依赖，适合依赖关系较直接的副作用。

实际使用时，派生值优先交给 computed；异步请求还要处理过期结果、清理和执行时机，不能只把请求塞进监听函数。

![computed派生值、watch明确来源、watchEffect自动同步收集依赖](https://note.lgdsunday.club/img/Q139/00-60s-overview.webp)

## 知识点详解：算值和做事，为什么要分开

### 总价是算出来的，不必再保存一份

假设购物车有数量、单价和优惠规则。页面需要显示总价，提交时也需要拿到总价。

如果用 watch 计算后写入另一个 `total`，你就同时维护了商品状态和总价状态。忘记监听优惠规则，或者初始化时没执行回调，两份数据就可能对不上。

用 computed 表达关系更直接：总价由哪些状态决定，就在计算函数里读取这些状态。Vue 根据依赖决定何时重新计算。这里的缓存针对响应式依赖，不是把任意函数调用都永久缓存；只读取 `Date.now()` 也不会让它自动随时间更新。

计算过程里不要请求接口、修改别的状态或操作 DOM。这些动作不是总价的一部分。

### watch 和 watchEffect，区别在于谁说明依赖

下面这段 Vue 3 + TypeScript 代码同时演示两种职责。Python 没有对应的 Vue 响应式运行时，不把它机械翻译成 Python API。

```ts
import { computed, ref, watch } from 'vue';

const quantity = ref(2);
const price = ref(15);
const total = computed(() => quantity.value * price.value);

watch(quantity, (next, previous) => {
  console.log(`数量：${previous} → ${next}`);
});
```

watch 指定监听 `quantity`，总价则根据数量和单价派生。如果换成 watchEffect，函数同步读取的 quantity、price 都可以被收集为依赖。

这在短逻辑里很方便，函数变长后，也可能让依赖不够直观。尤其是异步函数，watchEffect 只收集第一次 await 之前同步读取的依赖；不要以为 await 之后读到的状态也自动被监听。

### 请求发生变化时，先把旧任务收好

搜索词从 A 变成 B，A 的请求不一定先回来。如果直接把每次结果写到页面，旧结果就可能覆盖新结果。

可以在监听回调里创建 AbortController，用回调提供的 `onCleanup` 注册取消动作；同时考虑接口是否真的支持取消，必要时再用请求序号忽略过期结果。

Vue 3.5 起还提供 `onWatcherCleanup`，但它必须在监听函数的同步执行阶段注册，不能等 await 完才调用。回调参数形式的 onCleanup 不受这一项同步注册限制。

清理解决的是上一轮任务失效，不等于自动处理请求异常。取消、失败、加载状态仍然需要分别写清楚。

### 拿 DOM 时，再问一句它更新了没有

默认 watcher 回调执行时，所属组件的 DOM 还没有完成本轮更新。如果你要读取更新后的元素尺寸，可以选择 `flush: 'post'`。

`flush: 'sync'` 会同步触发，也不做常规批量合并。对一次会连续修改很多次的数组使用它，可能让回调执行得非常频繁。

深度监听同样有成本。不要为了省去分析依赖，直接给大对象全部开 deep；对象被原地修改时，回调里的新旧值也可能是同一个对象引用，并不是现成的差异快照。

本题机制参考：[Vue：Computed Properties](https://vuejs.org/guide/essentials/computed.html)、[Vue：Watchers](https://vuejs.org/guide/essentials/watchers.html)。

## 面试官继续追问

### computed 缓存的是整个页面吗？

不是。它复用的是计算结果，是否重新计算取决于它跟踪的响应式依赖。页面渲染还有自己的更新过程。

### watchEffect 可以替代所有 watch 吗？

不建议。需要明确指定触发来源、比较新旧值或控制首次执行时，watch 通常更清楚。

### watch 请求用了取消，就不会出现竞态了吗？

还要看取消是否生效，以及结果写入是否有保护。不能取消的任务可以通过请求序号判断结果是否过期。

## 面试速记卡

> - computed：用已有状态算新值，计算函数保持纯粹。
> - watch：明确指定监听来源，再执行副作用。
> - watchEffect：自动收集同步执行阶段读取的依赖。
> - 异步监听：处理清理、过期结果和异常。
> - DOM 时机：需要更新后的 DOM，考虑 flush: 'post'。

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
