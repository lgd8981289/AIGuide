# Webpack 的 Loader 和 Plugin 有什么区别？分别在构建的哪一步执行？

[字节前端面试真题](../companies/bytedance-frontend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q463-webpack-loader-vs-plugin/) · [题库目录](../../README.md)

*以下对话为教学模拟，不是真实面经。*

🧑‍💻 面试官：Webpack 的 Loader 和 Plugin 有什么区别？

🙋‍♂️ 我：Loader 转换文件，Plugin 扩展功能。

🧑‍💻 面试官：把 TypeScript 转成 JavaScript，和生成一份构建报告，分别应该放在哪里？

🙋‍♂️ 我：前者用 Loader，后者用 Plugin。

🧑‍💻 面试官：多个 Loader 的顺序呢？Plugin 是不是等所有 Loader 结束才执行？

> 区分它们，既要看处理对象，也要看接入构建的位置。Plugin 不是“最后执行的 Loader”。

## 面试速答（60 秒版）

Loader 主要处理模块内容。例如 Webpack 遇到 TypeScript 文件，可以通过相应 Loader 把源码转换成能够继续处理的形式。

Plugin 则通过构建生命周期中的钩子扩展行为。例如检查构建过程、调整产物或生成报告，它不只围绕某一个文件转换。

配置多个 Loader 时，普通转换阶段通常从右往左执行；还有 pitch 等特殊阶段，不能把一句顺序口诀套到所有情况。

Plugin 会在注册的钩子被触发时执行，不一定等到构建结束。实际选择时，先看需求是转换模块内容，还是参与构建过程，再决定使用 Loader 或 Plugin。

![速答总览：Loader 处理模块内容，Plugin 在构建生命周期钩子上参与工作，不能用固定先后顺序区分。](https://note.lgdsunday.club/img/Q463/01-overview.webp)

## 知识点详解：沿着一份文件，看两种扩展怎样工作

### Loader 改的是模块交给下一步的内容

咱们假设入口文件引用了一个 TypeScript 模块。Webpack 解析依赖以后，需要把这个模块加入构建。但模块里的类型语法不能原样作为普通 JavaScript 处理，所以需要相应转换。

Loader 接收到模块内容，处理以后返回结果，Webpack 再继续分析。处理结果还可以包含 Source Map 等信息，不只是把一个字符串换成另一个字符串。

[Webpack Loader 文档](https://webpack.js.org/concepts/loaders/)说明了规则匹配和链式处理。这里要注意：不是所有 Loader 都做语言转换。有的负责处理样式、资源或其他模块内容；分类依据是它怎样参与模块处理，而不是输出文件扩展名。

### 链式转换中，顺序会改变输入

假设配置为 `use: ["style-loader", "css-loader"]`，普通阶段先经过右侧的 css-loader，再经过左侧的 style-loader。

可以理解成接力：后一段处理依赖前一段的结果。如果把顺序反过来，下一个 Loader 接收到的内容就可能不是它能够处理的内容。

不过，Loader 还存在 pitch 阶段等机制，其方向与普通阶段不同，并可能影响后续执行。因此，面试中先说“普通阶段从右向左”，再补充特殊阶段，不要直接说“任何 Loader 永远从右向左”。

实际排查顺序问题时，要检查当前 Loader 的输入要求和文档，而不是把多个名称按印象排列。

![普通 Loader 转换的输入输出顺序](https://note.lgdsunday.club/img/Q463/02-loader-chain.webp)

### Plugin 接的是构建事件，不是同一条转换链

Webpack 构建会经历建立依赖、生成模块、组织产物等过程。Plugin 可以在某个钩子上注册逻辑，等构建走到对应位置时执行。

例如生成构建报告，需要看到模块或产物信息；在合适的构建钩子里获取这些信息，比把报告生成逻辑塞进每个文件的 Loader 更合理。

[Webpack Plugin 文档](https://webpack.js.org/concepts/plugins/)解释了这种扩展方式。同一个 Plugin 可以注册多个钩子，也可以参与较早的阶段。因此，“Loader 先执行、Plugin 最后执行”不是可靠的顺序描述。

更准确的关系是：模块转换发生在构建过程之中，Plugin 在它订阅的过程节点上参与工作。两者不是先后排队的两类插件。

### 根据需求选，而不是根据代码长短选

如果需求是删除某种源文件中的特殊标记，可以考虑模块转换。若需求是汇总整个构建中用了哪些模块，就需要构建级信息，Plugin 更符合这个需求。

当然，复杂扩展可能同时包含两种机制。判断时依旧要分清职责：哪部分改变模块内容，哪部分观察或调整构建状态。

验证时可以使用很小的项目，只放一个入口和两个模块。检查转换前后代码、Source Map 和生成产物；对于 Plugin，再检查它的钩子在什么条件下触发，开发监听模式下是否重复执行。小范围验证比直接放进大项目后看“能不能打包”更容易定位问题。

## 面试官继续追问

### Babel 和 Loader 是什么关系？

Babel 是转换工具，babel-loader 是把它接入 Webpack 模块处理的适配。两者不是同一个东西，Babel 也可以不通过 Webpack 使用。

### 一个 Plugin 只能运行一次吗？

不是。监听模式、多次编译或不同钩子都可能让相关逻辑多次执行。需要按所订阅钩子的语义处理状态，不要把进程启动次数当成编译次数。

### 为什么不能用 Loader 做全局统计？

可能勉强实现，但模块处理存在缓存、并行和多次构建等条件。依赖副作用累积全局结果容易出错，应优先使用适合构建级工作的接口。

## 面试速记卡

> - Loader：参与模块内容的处理与转换。
> - Plugin：通过构建生命周期钩子扩展行为。
> - 顺序边界：普通 Loader 链从右向左，特殊阶段另看机制。
> - 常见误区：Plugin 不等于最后执行的 Loader。
> - 选择依据：模块级转换，还是构建级协作。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **字节跳动 · 前端 · 原帖未明确批次**：Webpack 的 Loader 和 Plugin 分别做什么？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353156819747020800)；原帖编辑于 2020-08-24。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
