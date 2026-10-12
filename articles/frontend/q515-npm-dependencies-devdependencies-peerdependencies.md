# dependencies、devDependencies、peerDependencies 有什么区别？依赖应该放在哪里？

[携程前端面试真题](../companies/ctrip-frontend.md) · [百度前端面试真题](../companies/baidu-frontend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q515-npm-dependencies-devdependencies-peerdependencies/) · [题库目录](../../README.md)

下面是一段模拟面试对话。

🧑‍💻 面试官：准备发布一个 React 组件库，React 和 TypeScript 分别放在哪里？

🙋‍♂️ 我：React 放 dependencies，TypeScript 放 devDependencies。

🧑‍💻 面试官：使用组件库的项目已经安装了 React。你希望组件库再带一份自己的 React 吗？

🙋‍♂️ 我：那应该声明成 peerDependencies，由使用方提供兼容版本。

🧑‍💻 面试官：你的源码也要编译和测试，开发机器上的 React 从哪里来？写了 peer，就不会自动安装吗？

> 先问「这个包由谁使用，谁负责提供依赖」。字段表达的是责任关系，安装行为还要看包管理器版本和选项。

## 面试速答（60 秒版）

dependencies 用来声明这个包运行时需要的依赖；devDependencies 用来声明开发、测试和构建这个包时需要的工具。

peerDependencies 则说明这个包要与使用方提供的某个宿主库配合，并声明可以接受的版本范围。例如 React 组件库通常希望使用应用的 React，而不是独立维护另一套 React 运行环境。

因此，TypeScript 编译工具可以放 devDependencies；组件库对 React 的兼容要求可以放 peerDependencies，开发和测试需要时也会在开发依赖中准备相应版本。

同时，依赖字段不直接决定是否打进产物。打包工具还需要配置 external 等规则。npm 从 v7 开始默认安装 peerDependencies，也不能再一概回答“peer 需要使用方手动安装”。[npm 文档](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/)。

![npm 三类依赖，各管哪段关系？](https://note.lgdsunday.club/img/Q515/01-deps-overview.webp)

## 知识点详解：以发布一个 React 组件库为例

### 先分清开发这个包和使用这个包

假设组件库源码用 TypeScript 编写。开发时需要编译器、测试工具和 React 环境；发布以后，应用通常使用已经构建好的 JavaScript 文件。

所以，应用是否需要 TypeScript 编译器，要看发布包究竟交付什么，而不是看作者使用了什么语言。已经发布为 JavaScript 的包，不会因为开发时用了 TypeScript，就要求所有使用方都装编译器。

dependencies 表达的是包使用时仍需要的运行依赖。devDependencies 表达的是维护该包所需的开发环境。对根项目和对依赖包，安装器处理开发依赖的范围也不同。

### peerDependencies 表达共同使用的兼容环境

组件库需要 React，但希望它和应用使用同一个兼容环境。这时，peerDependencies 可以声明宿主兼容要求。

比如组件库说支持某个 React 主版本，安装器会检查消费者的依赖树能否满足。它不是“这项依赖不重要”，也不是“安装器永远不安装”。

开发组件库时，仍然需要一个实际 React 版本来运行测试。因此，peer 声明和开发依赖可以承担不同职责：前者面对使用方，后者面对作者自己的工作环境。

不能为了少看到依赖冲突，就随意扩大支持范围。声明支持多个主版本以后，应该分别做兼容测试。

![peer 说兼容要求，dev 支撑本地测试](https://note.lgdsunday.club/img/Q515/02-author-consumer.webp)

这张图假设组件库的构建配置也把 React 排除出产物，并且消费者的安装结果满足兼容要求。peer 声明本身不完成打包排除，也不能单独保证最后只有一份框架实例。

### 安装与打包，要到各自阶段检查

假设 React 正确写进 peerDependencies，但构建器仍把它的代码打进组件库。消费者安装时看到的声明正确，运行时却可能加载重复内容。

反过来，某个依赖写在 dependencies 里，也不保证构建器一定把它打进 bundle。它可能被标成 external，由运行环境提供。

因此，要分别检查安装后的依赖树与发布后的文件。package.json 是依赖声明，bundle 是构建结果，不能只看一个文件判断全部行为。

### 为什么生产安装时经常找不到构建工具？

如果安装时省略 devDependencies，然后又在同一个目录执行 TypeScript 构建，编译器当然可能不存在。

前端项目常采用先安装完整构建环境、完成产物，再部署产物的流程。服务端项目则要检查哪些包在实际运行时仍被 import。

这里还要区分“未落盘安装”和“锁文件完全没有记录”。例如 npm 的 omit 选项可以省略依赖落盘，但相关依赖仍可能参与解析并记录在锁文件中。[npm ci 说明](https://docs.npmjs.com/cli/v11/commands/npm-ci/)。

![安装阶段与打包阶段分别检查](https://note.lgdsunday.club/img/Q515/03-install-build.webp)

## 面试官继续追问

### 一个包可以同时出现在 peer 和 dev 中吗？

可以，两者表达的关系不同。组件库对外声明 React 的兼容范围，内部开发又需要实际安装一个版本进行测试。

但不能以本地测试一个版本通过，就声称整个 peer 范围都验证过。

### 能不能把所有依赖都放 dependencies，省得想？

能安装不代表责任清楚。消费者可能多安装只用于测试的工具，也可能没有得到正确的宿主兼容约束。

从“发布包运行需要什么”逐项检查，比按团队习惯机械分类更可靠。

### 发布前怎样发现幽灵依赖？

先构建并打出真实发布包，再放到干净的消费者项目安装，验证导入、运行和类型声明。

只在仓库内部测试，可能误用根目录或其他工作区已经安装的依赖，从而掩盖缺失声明。

## 面试速记卡

> - dependencies：包使用时需要的运行依赖。
> - devDependencies：开发、构建与测试该包需要的依赖。
> - peerDependencies：与消费者共同使用的宿主兼容要求。
> - 两个阶段：安装器处理依赖树，构建器决定产物内容。
> - 验证方法：检查真实发布包，并在干净消费者项目里运行。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **携程 · 前端 · 秋招（原帖标题）**：peerDependencies 是什么，哪些依赖需要放入 devDependencies？（题意整理）。[面经来源](https://www.nowcoder.com/feed/main/detail/49c19c8ee0f74b149d7db81956b22f86)；原帖编辑于 2024-11-12。
- **百度 · 前端 · 原帖未明确批次**：dependencies 和 devDependencies 有什么区别？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/535581489552011264)；原帖发布于 2023-09-24。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
