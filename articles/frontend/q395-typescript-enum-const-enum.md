# TypeScript 的 enum 和 const enum 有什么区别？为什么很多项目改用 as const？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q395-typescript-enum-const-enum/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：enum 和 const enum 有什么区别？

🙋‍♂️ 我：const enum 更省代码，所以状态值全部用它就行。

🧑‍💻 面试官：那运行时能遍历它吗？如果公共库更新了枚举值，使用方还在用旧版本编译的代码呢？

🙋‍♂️ 我：内联以后，使用方可能保留旧值。

🧑‍💻 面试官：有人用对象加 as const，这又和 const enum 有什么不同？

> 先分清两件事：你只需要编译时的类型约束，还是还需要运行时真正存在的一组值？

## 面试速答（60 秒版）

普通 enum 通常会生成运行时对象，代码可以读取或遍历它。数字枚举还会生成从数值到名字的反向映射，字符串枚举不会。

const enum 在常见的 TypeScript 编译方式下，会把成员值直接内联到使用位置，不保留枚举对象。因此代码可能更少，但也不能再把它当普通对象遍历，而且会受到编译工具和配置影响。

公共库尤其要小心发布声明中的 const enum：编译时内联的值与运行时依赖版本不一致，可能产生兼容问题。

对象加 as const 则保留普通 JavaScript 对象，同时让 TypeScript 推导出更精确的字面量类型。需要运行时值、遍历和较直观的工具链兼容性时，它常常更合适。不过 as const 只是类型断言，不会在运行时冻结对象。

![enum const enum及as const的运行时区别](https://note.lgdsunday.club/img/Q395/01-enum-overview.webp)

## 知识点详解：类型删掉以后，程序里还剩什么？

### 普通 enum 不只是一个类型名字

假设我们给任务设置两个状态：

```typescript
enum Status {
  Pending = 0,
  Done = 1,
}
console.log(Status.Pending); // 0
console.log(Status[0]);      // "Pending"
```

数字枚举在运行时提供正向与反向映射。因此遍历键时可能同时看见名字和数值形式的键，不能直接假设每个键都代表一个选项。

如果成员改成字符串，运行时对象仍在，但不会自动提供数值枚举那种反向映射。不要把“enum 能反查名字”说成所有枚举都具备的能力。

### const enum 把值搬到了使用位置

```typescript
const enum StateCode {
  Pending = 0,
  Done = 1,
}
const next = StateCode.Done;
```

常见的 tsc 默认编译结果会直接使用数值 1，而不是运行时再访问 `StateCode.Done`。

这里的收益是减少枚举对象与属性访问，不是保证整段业务执行明显更快。真实项目还会受到 `preserveConstEnums`、转译器和构建配置影响，不能只根据源码里的 const 就判断产物。

也不能把它当成“更快的对象”传给一个函数。对象都可能不在，遍历或动态按名字访问就无从谈起。

### 公共库为什么容易踩坑？

假设库的旧版把 Done 定义成 1，使用方编译时把这个值内联了。后来运行环境安装新版库，新版协议却把 Done 改成 2。

使用方源码没变，已经构建好的代码也不会自动把 1 改成 2。它和运行时依赖可能说的是两套状态值。

另外，发布在 `.d.ts` 中的环境 const enum，与 `isolatedModules` 等按单文件处理的工具链有兼容限制。这里的问题不是所有 const enum 都不能用，而是公共声明、版本分发和构建方式一起增加了约束。

状态码本来就应该保持协议稳定。普通 enum 也不能替不兼容的协议改动兜底，只是 const enum 的内联让版本错配更难察觉。

![公共const enum的编译版本与运行版本错配](https://note.lgdsunday.club/img/Q395/02-public-const-enum-version.webp)

图中的“运行时 v2”指库在运行时对这些数值的解释，不是说 const enum 一定会生成一个可读取的运行时枚举对象。

### as const 为什么常见？

**TypeScript：**

```typescript
const StatusValue = {
  Pending: "pending",
  Done: "done",
} as const;

type StatusValue =
  (typeof StatusValue)[keyof typeof StatusValue];

const next: StatusValue = StatusValue.Done;
const options = Object.values(StatusValue);
```

对象是真实存在的，`options` 可以用于渲染选项；联合类型则限制 next 的合法值。类型名和对象名可以相同，因为它们处在不同的使用位置。

但 as const 不会执行冻结操作。如果运行时确实要求对象不能修改，还要考虑 `Object.freeze`；它本身也是浅冻结，不能顺带保证所有嵌套对象都不可变。

**Python（表达运行时枚举，不是 const enum 的机械翻译）：**

```python
from enum import Enum

class Status(str, Enum):
    PENDING = "pending"
    DONE = "done"

next_status = Status.DONE
options = [item.value for item in Status]
```

Python 的 Enum 提供运行时枚举对象。它没有 TypeScript const enum 那种“由 tsc 在编译阶段内联并擦除”的对应语义。需要静态限定字符串时还可以用 Literal，但 Literal 同样不是运行时枚举容器。

## 面试官继续追问

### 项目里是不是应该完全禁用 enum？

没有必要一刀切。已有协议、代码生成器和团队工具链都可能适合普通 enum。先判断是否需要运行时对象，再核对编译与分发方式。

### const enum 一定没有运行时对象吗？

不能脱离配置回答。`preserveConstEnums` 等配置会改变产物。这里的默认内联行为，要和具体编译器及参数一起验证。

### 用字符串状态就不会有兼容问题吗？

也不会。改字符串、删除状态、改变状态含义，都可能破坏旧客户端。类型写法和协议兼容是两个层面的问题。

## 面试速记卡

> - enum：通常保留运行时对象，数字枚举有反向映射。
> - const enum：常见 tsc 默认方式内联成员值，需核对编译配置。
> - 公共库风险：声明文件、独立编译与版本错配。
> - as const：保留对象并收窄类型，不等于运行时冻结。
> - 选型依据：需要什么运行时能力，以及采用什么构建和发布方式。

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
