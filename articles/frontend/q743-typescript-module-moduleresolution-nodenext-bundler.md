# TypeScript 的 module 和 moduleResolution 有什么区别？NodeNext 与 Bundler 怎么选？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q743-typescript-module-moduleresolution-nodenext-bundler/) · [题库目录](../../README.md)

*以下对话为教学模拟，用来讲解这道题。*

🧑‍💻 面试官：项目找不到一个包，把 moduleResolution 改成 bundler 就好了，这样改可以吗？

🙋‍♂️ 我：Bundler 支持的解析方式更宽松，可以先解决类型检查报错。

🧑‍💻 面试官：但这是编译以后交给 Node 直接运行的服务。TypeScript 不报错了，Node 还会怎么找文件？

🙋‍♂️ 我：如果它要求扩展名，运行时仍然可能找不到。

🧑‍💻 面试官：所以 module 和 moduleResolution 分别管哪一步？你是在匹配工具链，还是只把红线消掉了？

> 类型检查通过，只说明 TypeScript 按当前配置理解了导入；配置还得符合最终真正加载模块的工具。

## 面试速答（60 秒版）

module 主要告诉 TypeScript 怎样理解和输出模块代码，moduleResolution 则告诉它如何从导入路径找到对应的文件和类型声明。这两项需要配合，不是互不相关的两个开关。

如果编译产物交给现代 Node 直接运行，通常选择匹配的 Node 模式，例如 NodeNext。TypeScript 会结合文件后缀和 package.json 的 type，判断文件按 ESM 还是 CommonJS 处理，再使用相应解析规则。

如果源码交给 Vite 等打包工具处理，可以采用 Bundler 解析，并配合适当的 module 设置，例如 Preserve 或 ESNext。Bundler 允许的无扩展名相对导入，不代表 Node 原生 ESM 也允许。

因此，选配置之前先回答“谁运行这份代码”。不能只为了消除一个报错，就让类型检查和实际运行采用两套规则。

![类型解析与模块输出要匹配真实运行者](https://note.lgdsunday.club/img/Q743/01-module-resolution-overview.webp)

## 知识点详解：从一行 import，追到真正执行它的人

### 输出代码和查找文件，是两个问题

看这一行 `import { value } from "./value.js"`。

TypeScript 需要先找到它对应的源码或声明文件，检查 value 的类型。这是模块解析要做的事情。源码可能是 value.ts，产物最终才是 value.js，所以“导入写 .js”并不等于检查阶段只能找到 .js。

接着，编译器还要决定如何理解和输出这行模块代码。保留 import，还是在某种输出模式下形成 require，都与 module 设置、文件类别有关。即使 noEmit 不输出文件，module 仍会影响类型检查中的模块语义与解析分支，不能说它只在生成代码时才有用。

因此，moduleResolution 不是指定一种打包器，module 也不是替你安装依赖。

### NodeNext 要模拟 Node 的边界

假设一个最小项目，package.json 包含 `"type": "module"`，TypeScript 编译后不再打包，直接运行输出的 JavaScript。

配置可以采用：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "outDir": "dist"
  }
}
```

在这个前提下，普通 .ts 文件按 ESM 处理；.mts 与 .cts 则可以更明确地表达模块类别。相对导入应符合 Node ESM 的路径要求，例如在源码里写将来产物的 `.js` 后缀，而不是假定 Node 会自动尝试每一种扩展名。

NodeNext 会随 TypeScript 所支持的最新 Node 行为演进。需要锁定特定运行环境时，也要评估相应的固定 Node 模式，并锁定编译器版本，而不是把 Next 理解成永远相同的一组规则。

### Bundler 为什么允许另一种写法？

打包工具可以读取源码依赖图，解析 `./value`，把依赖合进产物，或者按自己的规则改写产物。TypeScript 的 Bundler 解析就是为了配合这种处理方式。

例如，交给打包器的项目可使用：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Preserve",
    "moduleResolution": "Bundler",
    "noEmit": true,
    "strict": true
  }
}
```

这里 TypeScript 不生成最终 JavaScript，构建工具负责后面的转换。Preserve 需要支持它的 TypeScript 版本，不能把这份配置直接塞给较老的编译器。

[TypeScript 官方模块参考](https://www.typescriptlang.org/docs/handbook/modules/reference.html#the-moduleresolution-compiler-option)强调了两类解析的运行环境差异。Bundler 同样理解 package.json 的 imports、exports 等现代包入口规则，但它不强制相对路径采用 Node ESM 的扩展名要求。

问题也恰恰在这里。如果产物根本不经过打包，直接交给 Node，它不会因为 TypeScript 用过 Bundler，就学会打包器的解析方式。

![Node ESM与打包器允许的相对导入不同](https://note.lgdsunday.club/img/Q743/02-nodenext-bundler-paths.webp)

### 配 paths，为什么运行时仍然报错？

paths 让 TypeScript 知道某种导入对应哪里，并不保证输出时替你改写这个路径。

比如 `@/utils` 在编辑器里能够跳转，但浏览器或 Node 不认识这个别名，仍然会失败。需要由构建工具、运行时支持的包映射或其他实际加载机制接上这段路径。

这道题针对 TypeScript 工具链，没有对应的 Python 配置翻译。Python 的模块搜索机制不能拿来冒充 NodeNext 的运行结果。

![paths不是产物路径重写器](https://note.lgdsunday.club/img/Q743/03-path-alias-not-runtime.webp)

## 面试官继续追问

### 只要设成 ESNext 就是 ESM 项目了吗？

不够。还要看文件后缀、package.json、运行时加载规则和构建产物。配置描述的是一部分契约，不会让旧运行时自动支持新语法。

### 发布 npm 库，也能直接照搬前端应用配置吗？

要先确定消费者怎样使用。应用总会经过某个打包器，不代表库的使用者也一定会。需要检查 exports、声明文件和实际 ESM/CommonJS 入口；必要时准备分别运行的消费样例。

### 怎样确认配置真的对了？

除了 tsc，至少走一遍真实构建和实际启动。在干净目录安装产物，分别检查相对导入、包的 exports 分支和路径别名。只看开发服务器能启动，可能掩盖产物直接运行时的问题。

## 面试速记卡

> - module：决定模块的理解与输出语义；noEmit 时仍有影响。
> - moduleResolution：决定导入怎样找到文件、包入口和类型。
> - NodeNext：模拟现代 Node，结合文件类别选择解析路径。
> - Bundler：配合打包器，不替 Node 原生 ESM 放宽规则。
> - 验证：类型检查、构建产物和真实启动都要对上。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
