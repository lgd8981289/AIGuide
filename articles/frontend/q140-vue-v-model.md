# Vue 3 的 v-model 是怎么实现的？自定义组件如何支持双向绑定？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q140-vue-v-model/) · [题库目录](../../README.md)

<!-- 以下对话为教学模拟，非真实面经。 -->

🧑‍💻 面试官：Vue 3 自定义组件的 v-model 怎么实现？

🙋‍♂️ 我：父子组件共用一个值，子组件修改后父组件就会变。

🧑‍💻 面试官：子组件直接改 props 就可以了吗？

🙋‍♂️ 我：那应该是子组件发事件给父组件。

🧑‍💻 面试官：这个事件叫什么？用了 defineModel，是不是就没有这套过程了？

> v-model 没有让父子组件随便互改数据，它把“传入值”和“通知更新”写成了一组配合。

## 面试速答（60 秒版）

组件上的 `v-model` 本质上是一个约定：父组件传入 `modelValue`，子组件需要更新时触发 `update:modelValue`，父组件再更新自己的状态。

Vue 3.4 起，子组件可以使用 `defineModel()` 简化这套声明。它是编译宏，背后仍然是 prop 和更新事件，不是绕过单向数据流。

命名模型例如 `v-model:title`，对应 `title` 和 `update:title`，一个组件也可以有多个模型。

设计表单组件时，要说清楚什么时候通知更新、是否需要转换值，以及父子初始值是否一致。不要把直接修改只读 prop 当成双向绑定。

![父组件通过modelValue传值，子组件通过更新事件通知父组件](https://note.lgdsunday.club/img/Q140/00-60s-overview.webp)

## 知识点详解：双向绑定背后仍然是一次通知

### 先不用语法糖，看清谁拥有数据

假设你做一个昵称输入框。昵称状态放在父组件，子组件只负责显示输入框和报告输入变化。

父组件把当前昵称传下来；用户输入后，子组件报告新值；父组件接收报告，更新昵称，再把新的值传回来。

这样，数据的拥有者始终是父组件。子组件能够提出修改，并不代表它可以直接覆盖传入的 prop。

默认组件 v-model 把这套配合约定为 `modelValue` 与 `update:modelValue`。命名模型则把 modelValue 换成指定名称。这里说的是自定义组件，原生输入元素还有各自的值和事件处理规则。

### defineModel 简化声明，没有取消约定

Vue 3.4+ 的单文件组件可以这样写。这是 Vue 编译宏，不存在同一套 Python 实现。

### TypeScript / Vue

```vue
<script setup lang="ts">
const nickname = defineModel<string>({ required: true });
</script>

<template>
  <input v-model="nickname" />
</template>
```

父组件使用 `<NicknameInput v-model="nickname" />`。子组件中这个模型 ref 的读写会接入生成的 prop 和事件逻辑。

如果你接手的是较早版本或没有使用宏，也可以明确声明 modelValue prop，并在输入事件中 emit 更新事件。面试时先解释协议，再介绍宏，才不会把实现原理说成“框架自动同步”。

### 多个字段，就分别约定更新通道

例如地址选择组件同时提供省份和城市，可以使用 `v-model:province` 和 `v-model:city`。它们分别对应两组 prop 与更新事件，并不是任意变量都会被自动识别。

这样设计能让父组件独立控制字段，但字段之间有约束时仍要处理。例如省份变化后，旧城市可能不再有效，需要明确由谁清空，以及通知顺序。

修饰符和模型转换也需要有清楚的规则。去掉首尾空格可以在约定的位置处理；不要让父子组件各做一次不一致的转换，最后看起来像输入值自己跳来跳去。

### 默认值和提交时机，决定组件好不好用

子组件给 defineModel 设置默认值，并不一定会把父组件的 undefined 自动变成同一个值。官方文档专门提醒过这个初始值不同步的问题。必填模型可以要求父组件传入状态；可选模型则要明确初始化策略。

另外，不是每个输入都应该立刻更新父组件。一个需要点击“确定”才生效的编辑器，可以在内部保留草稿，确认后再通知父组件。此时草稿和正式值是有意分开，不是忘记同步。

所以，v-model 解决的是接口约定。是否实时提交、是否校验、取消时如何恢复，仍然是组件设计。

本题机制参考：[Vue：Component v-model](https://vuejs.org/guide/components/v-model.html)、[Vue：Props](https://vuejs.org/guide/components/props.html)。

## 面试官继续追问

### 直接修改对象 prop 的内部字段呢？

嵌套对象的引用可能允许这种修改，但会让父组件状态通过隐蔽路径改变。除非双方明确约定，否则优先通过事件或受控操作通知拥有者。

### defineModel 是运行时从 Vue 导入的普通函数吗？

在 script setup 中它是编译宏，由单文件组件编译器处理，不需要按普通运行时函数导入。

### 只用 v-model 就能保证表单值有效吗？

不能。它负责值与更新通知，校验、提交和回滚需要另外设计。

## 面试速记卡

> - 默认模型：modelValue + update:modelValue。
> - 命名模型：title + update:title。
> - defineModel：Vue 3.4+ 编译宏，仍然生成 prop 与更新事件。
> - 数据归属：父组件拥有值，子组件通知修改。
> - 组件边界：初始化、草稿、校验和提交时机要单独定义。

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
