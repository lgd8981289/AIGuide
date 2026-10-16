# TypeScript 的 .d.ts 声明文件有什么用？declare 和运行时代码是什么关系？

[编程猫前端面试真题](../companies/codingcat-frontend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q650-typescript-declaration-files/) · [题库目录](../../README.md)

*下面是用于讲题的模拟面试对话。*

🧑‍💻 面试官：老 JavaScript 库没有类型，写一个 declare function，函数就能用了？

🙋‍♂️ 我：类型检查器会认识这个调用，但运行时仍要真正加载函数实现。

🧑‍💻 面试官：我声明它返回 string，实际库返回 number，TS 会替我转换吗？

🙋‍♂️ 我：不会。声明只是描述预期，写错以后类型检查也会相信错误描述。

🧑‍💻 面试官：编辑器有提示、构建通过，线上却说方法不存在，你从哪查？

> 声明文件回答“代码应该怎样使用”，真正的 JavaScript 才回答“运行时有什么”。两条解析路径都要对上。

## 面试速答（60 秒版）

.d.ts 是 TypeScript 的类型声明文件，用来描述已有 JavaScript 模块或运行环境提供的类型与 API，通常不包含实际业务实现。

declare 表示某个名字由外部运行环境或实现提供，不会因为写了声明就生成对应函数。它可以让没有 TS 源码的库获得类型提示，也可以描述浏览器或其他环境提供的全局能力。

使用时要确认包的类型入口和运行时入口都正确。类型文件存在、编辑器能补全，不代表实际加载的 JavaScript 一定有那个方法。

因此，声明需要与真实版本保持一致。遇到运行时缺失或返回形状不同，要检查导入、模块导出、包入口和版本，不能不断补 any 或 declare 来掩盖实现问题。

![声明文件说明什么，谁真正执行？](https://note.lgdsunday.club/img/Q650/01-typescript-declaration-files.webp)

## 知识点详解：一个库可以有两份入口

### JavaScript 负责执行，声明负责告诉检查器

假设一个 greeting.js 已经导出 greet 函数。旁边的 greeting.d.ts 可以写出它允许的参数和返回类型。

#### TypeScript（greeting.d.ts）

```typescript
export declare function greet(name: string): string;
```

它没有描述函数怎样拼接字符串。实现必须真的由 JavaScript 提供，导出形式也要与声明匹配。[官方声明文件介绍](https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html)解释了声明与已有代码的关系。

#### Python（greeting.pyi 类型存根对照）

```python
def greet(name: str) -> str: ...
```

Python 的 .pyi 存根也用于类型描述，实际逻辑由对应模块提供，见 [Python 类型存根规范](https://typing.python.org/en/latest/spec/distributing.html#stub-files)。这里两段都是声明文件内容，不是可以单独运行并产生问候的实现。

### declare 不会安装外部依赖

如果给一个不存在的全局工具写了声明，类型检查可能允许调用，运行时仍可能报 ReferenceError。给对象补一个方法签名，也不会把方法添加到原型或实例上。

常见误区是编译报“找不到这个名字”，于是只补 declare。报错消失以后，没有确认宿主页面、脚本或依赖包是否实际提供它，问题便被推迟到线上。

所以，声明外部名字之前，需要说明它来自哪一个真实实现、由谁加载、在什么环境存在。

![写了 declare，为什么还找不到函数？](https://note.lgdsunday.club/img/Q650/02-typescript-declaration-files.webp)

### 包的 types 与运行时入口分别解析

包可以通过 package.json 的类型相关配置指向声明，也会用模块导出规则选择运行时文件。两条入口不一致，编辑器就可能看见一个接口，而运行时加载的是另一份代码。

检查时先确认实际安装版本，再看导入路径命中哪个导出。ESM 和 CommonJS 的导出形状、条件导出，以及项目采用的模块解析方式，都会影响结果。不能把某一种项目配置下找到类型，写成所有消费者都能这样使用。

![声明和实现，都要检查兼容](https://note.lgdsunday.club/img/Q650/03-typescript-declaration-files.webp)

### 声明本身也需要测试

先用调用示例检查合法输入有没有提示、非法输入能不能被拒绝。再在目标运行环境真正导入模块，检查名字、参数和返回值是否与声明一致。

只有静态调用测试，会漏掉“类型写对、实现没打包”；只有运行测试，则可能漏掉类型过宽、调用者拿不到正确推断。声明更新也要跟随真实 API，而不应把旧版方法长期留在补全列表里。

## 面试官继续追问

### 所有 .d.ts 里的名字都是全局的吗？

不是。文件是否作为模块、声明写在哪个作用域，会影响可见范围。外部模块声明和全局增强也有各自用途，不能为了图省事把所有名字放进全局。

### 给缺类型的库写 declare module，是否就解决了？

需要真实描述你使用的导出和参数。如果只写一个过宽声明，让所有调用都变成 any，主要作用只是关闭检查，不能称为提供了可靠类型支持。

### 类型文件和实现由不同包提供，有什么风险？

两者版本可能不同步。升级时要检查实际 API 与声明的兼容范围，并保留真实导入测试，尤其关注被删除的方法和变更的返回类型。

## 面试速记卡

> - .d.ts 描述类型与 API，通常不提供业务实现。
> - declare 描述外部已有能力，不会创建函数或加载依赖。
> - 类型入口与运行时入口分别解析，版本和导出形状要一致。
> - 声明写错，类型检查器也可能给出错误信心。
> - 静态调用测试与实际导入测试一起检查声明质量。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **编程猫 · 前端 · 社招**：项目中的 .d.ts 文件有什么作用？（题意整理）。[面经来源](https://www.nowcoder.com/feed/main/detail/ceceb105bbfd4bf8aadd5a810c6fe9e3)；原帖编辑于 2025-02-14。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
