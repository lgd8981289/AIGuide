# Python 的 python -m 和直接运行脚本有什么区别？`__main__` 有什么用？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/python/q583-python-module-main-execution/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：python app.py 和 python -m package.app 有什么区别？

🙋‍♂️ 我：都是运行 Python 代码，-m 是按模块名运行。

🧑‍💻 面试官：如果 app.py 里写 from .service import run，为什么直接运行可能报错？

🙋‍♂️ 我：因为缺少所属包的信息。

🧑‍💻 面试官：两种方式的 **name** 都可能是 **main**，那这个名字够不够解释相对导入？

> 入口身份和所属包要分开看。**main** 说明这次是入口执行，包上下文才决定点号相对导入从哪里开始。

## 面试速答（60 秒版）

直接运行脚本，是把指定文件作为入口执行。python -m 则先按模块名定位，再把这个模块作为入口运行。

这两种情况下，入口的 **name** 都可以是 **main**。主要差异在模块搜索起点和包上下文。-m 运行包中的模块时，会保留相应包信息，相对导入就能据此定位同包模块；直接运行一个内部文件，往往没有这份上下文。

if **name** == "**main**" 用来区分入口执行和普通导入。可复用的函数放在条件外，启动动作放在条件里，导入这个模块时就不会顺手启动程序。

实际项目我会从项目根目录按包运行，并把启动逻辑保持简短。不会靠到处修改 sys.path 来掩盖包结构和运行目录的问题。

![入口身份和包上下文，分别判断](https://note.lgdsunday.club/img/Q583/01-overview-v5.webp)

## 知识点详解：同一个文件，运行方式决定了入口上下文

### 先准备一个有包结构的项目

假设项目根目录下面有 demo 包，里面包含 **init**.py、app.py 和 service.py。service 提供 run，app 负责调用它。

app.py 写 from .service import run，这个点号表示从当前包开始定位。要完成这次导入，Python 得知道 app 属于 demo，不能只知道它在磁盘上和 service 紧挨着。

运行 python demo/app.py 时，文件作为入口，但它不一定具有 demo 的包上下文。运行 python -m demo.app 时，Python 按模块名定位 demo.app，包信息就可以保留下来。本文讨论正常包结构和普通命令行执行，测试框架或特殊启动器可能另外设置上下文。

### 入口名相同，所属包仍然不同

可以在 app.py 临时打印 **name**、**package** 和 **spec** 来观察。它们回答的分别是当前名称、包上下文和模块规格信息，不要只盯着 **name**。

一般直接按文件运行时，搜索路径首项是脚本目录；普通 -m 执行时，当前工作目录通常进入搜索路径。所以“我在 IDE 能运行，终端不行”，可能还涉及启动目录或解释器配置。

也不是说加 -m 就能找到所有东西。你仍要从能定位 demo 的环境运行，或者把项目正确安装进当前解释器环境。-P、隔离模式等选项还会改变默认搜索路径，本题不把普通启动行为推广到全部模式。

![点号导入，需要知道当前包](https://note.lgdsunday.club/img/Q583/02-lookup.webp)

### 用 main 函数把入口动作收起来

把下面两份代码放到前面的包文件中，然后在项目根目录运行 python -m demo.app。

#### Python

```python
# demo/service.py
def run():
    return "任务完成"

# demo/app.py
from .service import run

def main():
    print(run())

if __name__ == "__main__":
    main()
```

普通 import demo.app 仍然会执行条件外的定义和导入，只是不执行 main 的调用。这个判断不会让所有顶层代码都消失，也不会阻止其他代码主动调用 main。

#### TypeScript（入口拆分思路对照）

```typescript
export function run(): string {
  return "任务完成";
}
export function main(): void {
  console.log(run());
}
// 由项目单独的启动文件调用 main()。
```

JS 的 CommonJS 和 ESM 入口识别方式不同，TS 也没有 Python 同款 **main**。这里采用独立启动文件的思路，避免给出跨模块格式都通用的假判断。

![导入保留定义，入口才调用 main](https://note.lgdsunday.club/img/Q583/03-entry.webp)

### 包也可以有自己的入口文件

如果希望运行 python -m demo，可以在 demo/**main**.py 里导入并调用主函数。**main**.py 的作用是提供这个包被当作程序运行时的入口，不要求把全部业务代码都写进去。

再留意一个状态问题。入口运行与随后按正式模块名导入，不一定复用同一模块身份。把长期共享的配置、客户端和注册表放到入口之外的稳定模块，可以减少这类混乱。

验证时至少覆盖两种调用，python -m demo.app 是否正常完成，import demo.app 是否没有意外启动任务。再换到不正确的目录执行一次，确认报错确实来自模块定位，而不是盲目补路径。

依据：[Python 3.11 命令行 -m](https://docs.python.org/3.11/using/cmdline.html#cmdoption-m)、[**main** 官方说明](https://docs.python.org/3.11/library/__main__.html)、[Python 模块教程](https://docs.python.org/3.11/tutorial/modules.html)。

## 面试官继续追问

### 有 **init**.py，就能直接跑包内任何文件吗？

它不能代替入口的包上下文。仍要选合适的模块运行方式，或用绝对导入配合正确安装和路径。

### main 判断能防止模块顶层所有副作用吗？

只控制条件里的动作。条件外的网络请求、客户端初始化或打印，导入时仍可能执行。

### 为什么建议启动文件薄一点？

入口只组织启动参数和调用，业务函数可独立导入测试，也更不容易把入口身份当成共享状态容器。

## 面试速记卡

> - 直接运行按文件定位，-m 按模块名定位。
> - **name** 为 **main**，不等于包上下文完整。
> - 相对导入依赖包信息，不能只看磁盘邻居。
> - main 判断只控制放在判断里面的启动动作。
> - 包的 **main**.py 可以作为薄入口。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
