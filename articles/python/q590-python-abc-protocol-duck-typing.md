# Python 的鸭子类型、ABC 和 Protocol 有什么区别？接口约束应该怎么写？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/python/q590-python-abc-protocol-duck-typing/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：鸭子类型、ABC 和 Protocol 有什么区别？

🙋‍♂️ 我：鸭子类型看能不能用，ABC 和 Protocol 可以描述接口。

🧑‍💻 面试官：一个类没有继承 Protocol，但方法符合，类型检查器可以接受吗？

🙋‍♂️ 我：一般可以，Protocol 主要是结构化约束。

🧑‍💻 面试官：那 runtime\_checkable 检查通过，是否证明方法参数和返回值都正确？

> 先问约束发生在哪个阶段。类型检查器接受对象、运行时允许实例化、实际调用成功，这三个结果不能互相替代。

## 面试速答（60 秒版）

鸭子类型强调按对象实际提供的能力使用它，不要求都继承某个共同父类。调用需要 read 方法，就使用能满足约定的对象。

ABC 可以表达显式的抽象基类，通过 abstractmethod 等声明抽象要求，通常让未实现抽象方法的子类不能直接实例化。它适合需要共同继承体系或共享行为的场景。

Protocol 主要为静态类型检查描述结构。对象即使不继承它，只要成员和签名满足要求，检查器也可以接受。

runtime\_checkable 可以让部分 Protocol 参与运行时 isinstance 检查，但这不是完整签名和返回值校验。选择时要区分继承关系、静态约束与实际数据校验，不能把“检查通过”当成对象所有行为都可靠。

![三个阶段，检查的事情不同](https://note.lgdsunday.club/img/Q590/01-overview-v2.webp)

## 知识点详解：接口约束放在继承、静态检查还是调用现场

### 先写一个真正需要的能力

假设报告生成器只需要把文本写出去。它不关心接收者是文件、内存缓冲区还是测试替身，只需要对方提供 write(text)。

直接调用这个方法，是鸭子类型的常见写法。缺少成员时会在运行时失败，行为不符合约定时则可能得到错误结果。简单不等于没有合同，参数、返回值、异常和副作用仍应说明。

如果我们希望编辑器和检查器提前提醒传错对象，就可以把这份能力写成 Protocol。

### Protocol 让结构合同能被检查

下面的 MemoryWriter 没有继承 Writer，但方法签名符合要求，静态检查器可以据此判断使用是否合法。

#### Python

```python
from typing import Protocol

class Writer(Protocol):
    def write(self, text: str) -> int: ...

class MemoryWriter:
    def __init__(self):
        self.parts = []
    def write(self, text: str) -> int:
        self.parts.append(text)
        return len(text)

def publish(writer: Writer) -> int:
    return writer.write("报告完成")

print(publish(MemoryWriter()))  # 4
```

#### TypeScript（结构化接口对照）

```typescript
interface Writer { write(text: string): number; }
class MemoryWriter {
  parts: string[] = [];
  write(text: string): number {
    this.parts.push(text);
    return text.length;
  }
}
function publish(writer: Writer): number {
  return writer.write("报告完成");
}
console.log(publish(new MemoryWriter()));
```

两边都能表达结构约束，但字符串长度、方差规则和运行时语法不完全一样。这份简单中文字符串在两段代码里都得到 4，不代表所有 Unicode 文本计数行为都相同。

![没有继承，也能符合写入接口](https://note.lgdsunday.club/img/Q590/02-structural-v2.webp)

### ABC 还可以控制抽象类的实例化

如果使用 abc.ABC，并把 write 标为 abstractmethod，显式子类没有实现这些抽象成员时，通常不能直接实例化。抽象方法也可以提供部分实现，供子类委托使用。

ABC 的 register 能登记虚拟子类，但不会自动把基类方法拷进去，也不会像显式继承那样强制补齐全部抽象实现。因此“isinstance 为真”和“对象继承了所有实现”也需要区分。

已有多个彼此独立的库对象需要适配一个小能力时，Protocol 往往比要求它们全改基类更灵活。框架需要共同实现或明确继承关系时，ABC 则可能更合适。

### 运行时结构检查不能验完整行为

给 Protocol 添加 runtime\_checkable 后，可以做相应 isinstance 检查。但它主要检查需要的属性是否存在，并不完整核验函数签名，也不保证调用后返回约定类型。

较新版本还调整过运行时成员检测方式，所以别依赖动态 **getattr** 恰好让检查通过这样的技巧。本文按 CPython 3.11 基础语义说明静态结构约束，运行时细节需按目标版本复核。

工程测试仍要调用实际方法，检查返回值和错误路径。还可以准备一个“名字相同但参数错误”的假实现，让静态检查和运行测试分别揭示各自能发现的问题。

依据：[Python 3.11 typing.Protocol](https://docs.python.org/3.11/library/typing.html#typing.Protocol)、[abc 抽象基类](https://docs.python.org/3.11/library/abc.html)、[PEP 544](https://peps.python.org/pep-0544/)、[Python 3.12 runtime\_checkable 变更](https://docs.python.org/3.12/library/typing.html#typing.runtime_checkable)。

![方法存在，不等于签名和行为正确](https://note.lgdsunday.club/img/Q590/03-runtime-v4.webp)

## 面试官继续追问

### Protocol 一定要显式继承吗？

使用方通常可以靠结构符合得到静态接受。显式继承可以帮助检查类实现，但不是所有调用方都必须继承。

### ABC 和 Protocol 能替代输入校验吗？

不能。接口能力约束和外部数据解析是不同责任，运行时仍要校验实际输入和结果。

### 只要方法同名就是鸭子类型符合吗？

还要满足调用和行为约定。同名但参数、返回或副作用不符合，实际使用仍会出错。

## 面试速记卡

> - 鸭子类型按能力使用对象，不强制同一继承。
> - ABC 表达抽象继承要求和共享行为。
> - Protocol 主要描述静态结构合同。
> - runtime\_checkable 不完整校验方法签名和结果。
> - 类型接受、可实例化、实际行为分别验证。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
