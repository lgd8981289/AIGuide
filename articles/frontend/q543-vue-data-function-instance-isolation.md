# Vue 组件中的 data 为什么是函数？多个组件实例怎样避免共享数据？

[百度前端面试真题](../companies/baidu-frontend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q543-vue-data-function-instance-isolation/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：Vue 组件中的 data 为什么是函数？

🙋‍♂️ 我：每次创建实例时都能返回一份新数据，避免几个组件共用一份状态。

🧑‍💻 面试官：如果函数返回的是外面那个 shared 对象，还能隔离吗？

🙋‍♂️ 我：不能，写成函数也可能交回同一个对象。

🧑‍💻 面试官：那返回 { ...shared }，里面的 filters 就一定独立了吗？

> 关键是每个实例拿到怎样的对象；函数写法提供创建机会，不能自动消除共享引用。

## 面试速答（60 秒版）

Vue 组件可能同时创建多个实例。Options API 用 data 函数返回实例数据，可以让每个实例分别取得自己的状态对象。

例如页面有两个筛选面板，各自创建 filters，就不会因为修改左边而顺带改掉右边。

但函数必须真的返回合适的新对象。返回模块里同一个 shared，或者只浅复制外层而继续共享嵌套对象，仍可能互相影响。Composition API 中也要看数据是在实例执行的 setup 内创建，还是放在模块顶层共享，不能只根据 API 名字判断。

![同一组件，创建两份实例数据](https://note.lgdsunday.club/img/Q543/01-overview.webp)

## 知识点详解：两份组件实例，为什么拿到了同一个对象

### 组件可以复用，实例状态需要分开

假设页面左右各渲染一份筛选面板。组件定义可以是同一份，但左侧的关键词和右侧的关键词可能不同。

data 函数在创建实例时提供数据对象。如果函数内部新建关键词和筛选对象，每个实例就能保存自己的值。

因此，题目真正要确认的是数据归属。能解释‘同一组件定义创建两个实例’，比只背‘函数有作用域’更准确。

### 写成函数，仍然可以返回共享对象

假设开发者把 shared 放在模块顶层，再让 data 每次 return shared。函数调用虽然发生了两次，返回的引用却相同。

再换成返回 { ...shared }，也只新建外层对象。如果 filters 仍指向 shared.filters，嵌套字段继续共享。

修改 Vue 的响应式 API 不能替代这个对象身份判断。系统能够追踪变化，和这份数据是否应该被多个实例共同使用，是不同的问题。

![函数返回了同一个 shared](https://note.lgdsunday.club/img/Q543/02-shared-return.webp)

### 用最小对象工厂检查引用

下面不依赖 Vue，直接展示对象工厂怎样分别创建嵌套状态。Python 例子只是相同的对象归属问题，不是 Python 版 Vue。

#### TypeScript

```typescript
function createState() {
  return { filters: { keyword: '' } };
}
const left = createState();
const right = createState();
left.filters.keyword = 'agent';
console.log(right.filters.keyword); // 空字符串
console.log(left.filters === right.filters); // false
```

#### Python

```python
def create_state():
    return {'filters': {'keyword': ''}}

left = create_state()
right = create_state()
left['filters']['keyword'] = 'agent'
print(right['filters']['keyword'])  # 空字符串
print(left['filters'] is right['filters'])  # False
```

把 filters 提到函数外，两边就可能共享。验证时应检查嵌套对象的身份，不能只比较 left 和 right 是否不同。

![外层不同，里面还可能共享](https://note.lgdsunday.club/img/Q543/03-nested.webp)

### Composition API 同样要检查创建位置

在每个实例执行的 setup 内创建 ref 或 reactive，可以形成实例状态。写在普通模块作用域中的可变对象，则可能由多个实例访问。

当然，共享并不总是错误。例如全局偏好本来就需要多处同步，只是应通过清楚的状态方案管理。不能为了隔离把需要共享的值也随意复制。

本文以 Vue 3 Options API 为主，Vue 2 根实例曾允许的写法不直接套到 Vue 3。依据：[Vue Options State](https://vuejs.org/api/options-state.html)。

## 面试官继续追问

### data 返回新外层对象，就一定没有共享吗？

还要看嵌套对象和外部资源。浅复制可能继续保留内部引用。

### 所有数据都应该每个组件一份吗？

实例私有状态可以分别创建；全局偏好或共享业务状态则需要明确的共享归属与更新方式。

### 把 ref 写在组件文件顶部，一定是实例独立吗？

要看实际执行作用域。例如 script setup 与普通模块脚本的执行语义不同，不能只用文件顶部这个位置描述判断。

## 面试速记卡

> - 组件定义复用，实例数据仍可分别创建。
> - data 函数：提供实例数据的创建机会。
> - 返回共享引用：仍可能互相影响。
> - 浅复制：不自动复制嵌套对象。
> - Composition API：看创建作用域和状态目标。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **百度 · 前端 · 实习（原帖标签）**：Vue 2 组件的 data 为什么是函数？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/530709141912829952)；原帖编辑于 2023-09-15。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
