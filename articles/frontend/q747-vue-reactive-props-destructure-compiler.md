# Vue 3.5 的 props 解构为什么还能响应更新？与 reactive 解构有什么区别？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q747-vue-reactive-props-destructure-compiler/) · [题库目录](../../README.md)

*以下对话为教学模拟，用来讲解这道题。*

🧑‍💻 面试官：Vue 里解构一个数字属性，会丢失后续更新吗？

🙋‍♂️ 我：会，解构拿到的只是当时的数字，应该保留属性访问。

🧑‍💻 面试官：但 Vue 3.5 的 script setup 里，`const { count } = defineProps(...)` 后，watchEffect 还能重新执行，这是为什么？

🙋‍♂️ 我：可能 Vue 把 count 自动变成 ref 了？

🧑‍💻 面试官：那为什么不用 .value？又为什么把 count 直接传给 watch，仍然不对？

> 这个例外来自编译器。读到的是解构变量，编译后的代码却仍在访问 props 的属性。

## 面试速答（60 秒版）

Vue 3.5 默认支持 script setup 里的响应式 props 解构。编译器识别直接从 defineProps 解构出来的变量，并把同一脚本块中对它们的访问转换成对应的 props 属性访问。

因此，watchEffect 里读取 count，编译后仍然相当于读取 props.count，依赖可以被追踪。它不是把所有 JavaScript 解构都改成响应式，也不是给 count 自动创建一个需要 .value 的 ref。

普通 reactive 对象的基本类型属性解构，仍然只是取出当前值。props 解构的特定转换不能推广到这个场景。

把解构变量传给外部函数时，还要区分传值与传读取方式。`watch(count, ...)` 交出去的是当前值，需要改成 `watch(() => count, ...)`，让后面每次求值仍然读取 props。

![Vue3.5编译器转换而非自动ref](https://note.lgdsunday.club/img/Q747/01-props-destructure-overview.webp)

## 知识点详解：看起来是一个变量，实际读取入口被改了

### 先看这段代码为什么能更新

假设父组件会不断修改传进来的 count。子组件写在 Vue 单文件组件的 script setup 中：

```vue
<script setup lang="ts">
import { watchEffect, watch } from "vue";

const { count = 0 } = defineProps<{ count?: number }>();

watchEffect(() => {
  console.log("当前值", count);
});

watch(() => count, (value) => {
  console.log("变化以后", value);
});
</script>
```

这里的 defineProps 是编译宏，并不是运行时调用一个普通函数，再用 JavaScript 自己完成所有工作。[Vue 的 script setup 文档](https://vuejs.org/api/sfc-script-setup.html#reactive-props-destructure)给出了这段转换的解释。

为了理解，可以把 watchEffect 内部的读取看成编译成了 `props.count`。父组件更新 count 后，响应式系统能找到这一次读取关系，再重新执行副作用。

真正运行时仍然需要响应式系统。编译器负责让代码保留属性读取入口，不是绕开依赖收集，直接保证所有使用 count 的函数都自动执行。

### 为什么不是自动创建 ref？

如果 count 是 ref，我们通常需要在 JavaScript 中通过 count.value 读取。但这里直接写 count，编译器就知道要把它转换到哪个 prop。

这是一种语法层面的便利，不能根据代码外观推断 count 是一个可以任意传递的响应式容器。

同样，在普通 `.ts` 文件里对 reactive 对象执行 `const { count } = state`，并没有这份 defineProps 编译转换。关于普通代理属性和 toRef 的连接关系，Q109 已经详细解释；本题新增的正是“编译器识别了哪一种特定写法”。

Vue 3.4 及更早版本也不能直接按这里的默认行为理解。团队升级时要同时检查编译器与运行时版本，不只看 package.json 里某个组件库的版本号。

![普通reactive数字快照和defineProps编译入口对照](https://note.lgdsunday.club/img/Q747/02-reactive-versus-macro.webp)

### 为什么交给 watch 以后，又像丢了响应式？

看 `watch(count, callback)`。即使编译器把 count 改成 props.count，这个调用仍然是先读取属性，把当前数字传给 watch。

watch 收到一个数字，无法据此知道以后应该从哪里重新读取。它需要的是 ref、响应式对象或 getter 等合法的数据源。

把调用改成 `watch(() => count, callback)`，传进去的就变成一个函数。watch 后续执行这个 getter 时，函数内部又会访问 props.count，因此可以收集依赖。

传给自定义 Composable 也是这个道理。外部函数若只收一个 number，就只能拿到一次值；如果要追踪变化，可以约定接收 getter，并在 computed、watchEffect 等需要跟踪的地方调用 getter。只在外部函数初始化时调用一次 getter，也不会凭空建立持续更新。

### 默认值方便了，props 的只读约定没有变

可以在解构时写 `count = 0`，为未提供或值为 undefined 的 prop 安排默认值。null 不会被这个默认值替换。

数组和对象的默认值也有对应编译处理，不能把旧版 withDefaults 的工厂函数要求不加区分地搬过来。但不管语法怎样便利，子组件仍不应该直接给 prop 重新赋值。需要修改时，应通过事件或明确的模型协议，让拥有数据的父组件更新。

以上都属于 Vue 单文件组件编译机制，没有官方 Python 对应实现。使用 Python 模拟一个会变化的对象，不能证明 Vue 编译器真的执行了这些转换。

![watch(count)传当前值而getter保留后续属性访问](https://note.lgdsunday.club/img/Q747/03-value-versus-getter.webp)

## 面试官继续追问

### 只要变量也叫 count，编译器就会替换吗？

不会。编译器按作用域和绑定关系识别从 defineProps 解构出来的变量，不是全文件搜索同名字母再替换。函数参数或局部同名变量有自己的作用域。

### getter 传过去，外部函数就一定响应式了吗？

也不一定。getter 只是保留了以后读取的入口，外部函数还需要在可追踪的执行环境中使用它。普通函数读取一次，不会因此自动订阅以后所有更新。

### 怎么确认项目真的采用了这份行为？

查看锁定的 Vue 编译器版本，编译一个最小 SFC，检查生成代码是否读取 props 属性；再让父组件修改 count，验证 watchEffect 与 getter watch。普通 reactive 解构也作为对照，不能只验证页面最终碰巧变了。

## 面试速记卡

> - Vue 3.5：默认支持 script setup 中 defineProps 的响应式解构。
> - 核心机制：编译器把绑定的读取转换为 props 属性读取。
> - 不是 ref：没有自动出现一个可任意传递的 .value 容器。
> - 函数边界：传当前值和传 getter 不同，watch 应接合法数据源。
> - 普通 reactive：基本类型解构规则没被普遍改写。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
