# TypeScript 的 Partial、Required、Pick、Omit 有什么区别？怎么选择工具类型？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q337-typescript-utility-types/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：Partial、Required、Pick、Omit，你一般怎么选？

🙋‍♂️ 我：Partial 变可选，Required 变必选，Pick 选字段，Omit 去字段。

🧑‍💻 面试官：用户资料更新接口，能直接接收 Partial<User> 吗？

🙋‍♂️ 我：这样前端就可以只传需要修改的字段。

🧑‍💻 面试官：如果 User 里还有 id 和 role 呢？请求真的不会把它们传过来吗？

> 记住「字段范围」和「运行时输入」是两回事。工具类型能约束代码，不能替服务端拦住不该修改的字段。

## 面试速答（60 秒版）

这四个工具类型，都在改变对象类型的字段约束。Partial 把第一层属性变成可选，Required 把第一层可选属性变成必选；Pick 保留指定字段，Omit 排除指定字段。

那么实际选型时，我会先确定这个场景允许哪些字段，再决定它们是否必填。比如编辑用户资料，只允许修改 name 和 email，就先 Pick 这两个字段，再用 Partial 表示可以只改其中一个。

但这些变化只存在于类型检查阶段。它们不会自动删除真实对象里的字段，也不会检查接口收到的 JSON。所以服务端仍然需要校验输入，并明确提取允许更新的字段。

同时，Partial 默认不是递归处理。嵌套对象内部的必填属性，不会一起变成可选。

![先选字段，再决定是否必填](https://note.lgdsunday.club/img/Q337/01-overview.webp)

*图：先选字段，再决定是否必填。*

## 知识点详解：先选字段，再确定字段是否必填

### 为什么 Partial<User> 容易选错？

假设 User 包含 id、name、email、role。数据库里的完整用户对象需要这些字段，但“修改资料”并不应该允许用户更换自己的 id 或权限。

如果直接使用 Partial<User>，只是把四个字段都变成可选。它并没有表达“只能改姓名和邮箱”。类型看起来很省事，业务范围却变大了。

更清楚的办法，是先限定允许修改的字段，再处理必填关系。

#### TypeScript

```ts
type User = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
};
type UpdateProfile = Partial<Pick<User, "name" | "email">>;
const patch: UpdateProfile = { name: "小明" };
```

这是 TypeScript 编译期示例，Python 没有同一套 Partial/Pick 官方 API。Python 可以用 TypedDict 等方式表达输入结构，但不应该机械翻译这些工具类型。

### 四个工具类型，各自改变哪一件事？

| 工具类型        | 改变什么       | 不负责什么    |
| ----------- | ---------- | -------- |
| Partial<T>  | 第一层属性可选    | 限制可修改字段  |
| Required<T> | 第一层属性必选    | 保证网络数据完整 |
| Pick\<T, K> | 保留 K 指定的字段 | 从真实对象取值  |
| Omit\<T, K> | 排除 K 指定的字段 | 从真实对象删字段 |

Pick 和 Omit 的结果都是新类型，不是新的运行时对象。假设原对象有 role，把它赋给较窄的类型，并不会让对象里的 role 自动消失。

对于权限敏感的接口，采用允许字段名单通常更容易审查：新增一个数据库字段，不会自动变成可更新字段。而 Omit 适合确实需要“除某几个字段以外”的类型关系，不能因为写得短就一律使用它。

相关定义和例子可以在 [TypeScript 工具类型文档](https://www.typescriptlang.org/docs/handbook/utility-types.html) 中核对。

### 为什么说 Partial 是浅层的？

假设用户对象还有 address，而 address 中包含 city 和 street。`Partial<User>` 会允许完全不提供 address。

但是，只要提供了 address，它内部仍然要满足原来的地址类型。不会因为外层使用了 Partial，就可以只给 city 而漏掉必填的 street。

需要局部地址更新时，应该为这个更新场景明确建模。自定义 DeepPartial 也不是一段递归类型就能包办所有情况：数组、函数、日期和其他特殊对象，都要决定怎么处理。

![外层可选，不等于内部都可选](https://note.lgdsunday.club/img/Q337/02-shallow-v2.webp)

*图：外层可选，不等于内部都可选。*

### 类型检查通过，为什么后端还是要校验？

请求是 JSON，可能来自浏览器，也可能来自脚本。TypeScript 类型在运行时已经被擦除，它没有办法阻止用户直接发送 role。

因此，实际更新时需要做三件事：检查 name 和 email 的值是否合法；决定未知字段是拒绝还是忽略；只把允许字段写入数据库。

同样，`Required<T>` 只要求代码满足字段约束，并没有给缺失的数据补默认值。默认值需要运行时代码完成，再对补全结果进行检查。

![类型声明挡不住网络输入](https://note.lgdsunday.club/img/Q337/03-input.webp)

*图：类型声明挡不住网络输入。*

## 面试官继续追问

### as UpdateProfile 能完成校验吗？

不能。类型断言告诉编译器“按这个类型看待它”，没有执行数据检查。如果输入不可信，断言不会把它变可信。

### Omit\<T, K> 和手写一个 DTO，哪个更好？

如果输入与原类型长期保持同一关系，工具类型很方便；如果接口有自己的命名、校验和兼容周期，独立 DTO 往往更清楚。关键是业务关系是否真的相同。

### Required 和去掉 undefined 是一回事吗？

不是同一个概念。必填解决“属性是否可以缺席”，值是否允许 undefined 还要看具体类型及编译选项。不要把所有可选属性都理解成简单的 undefined 替换。

## 面试速记卡

> - Partial/Required：改变第一层属性的可选性。
> - Pick/Omit：改变类型里包含哪些字段。
> - 更新接口：先限定字段范围，再决定是否必填。
> - 工具类型：不删除真实字段，不校验 JSON，不补默认值。
> - 嵌套对象：浅层变化不能自动代表递归更新。

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
