# Python 装饰器是什么？functools.wraps 为什么不能随便省略？

[百度AI应用开发面试真题](../companies/baidu-ai-application.md) · [快手AI应用开发面试真题](../companies/kuaishou-ai-application.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q155-python-decorator/) · [题库目录](../../README.md)

<!-- 以下对话为教学模拟，非真实面经。 -->

🧑‍💻 面试官：Python 装饰器的原理是什么？

🙋‍♂️ 我：在函数上加一个标签，调用时自动多做一些事情。

🧑‍💻 面试官：这个标签是谁处理的？不使用 @ 语法还能实现吗？

🙋‍♂️ 我：可以把函数传进另一个函数，返回包装函数。

🧑‍💻 面试官：包装后原函数名称、异常和异步行为都能保持吗？

> 装饰器不是标签魔法，而是定义时的一次替换：把原对象交给装饰器，再把返回的对象绑定回这个名字。

## 面试速答（60 秒版）

Python 装饰器接收一个函数或其他可装饰对象，返回处理后的对象。对函数来说，`@decorator` 可以理解为定义完成后执行 `func = decorator(func)`。

常见实现是返回包装函数，在调用原函数前后增加日志、校验或缓存。多个装饰器按嵌套顺序组合，不能随意交换。

包装时要保留参数、返回值和异常语义，使用 functools.wraps 帮助保留名称、文档和原函数引用。wraps 不会自动修复包装逻辑。

异步函数需要使用正确的异步包装并等待原函数，不能用同步计时器只测创建协程的时间。

![函数定义时应用装饰器并替换绑定，调用时进入包装和原函数](https://note.lgdsunday.club/img/Q155/00-60s-overview.webp)

## 知识点详解：定义时替换，调用时才进入包装

### 定义阶段和调用阶段，是两次不同的动作

假设你希望给几个计算函数增加调用日志，不想把同样的日志复制到每个函数里。

装饰器先在函数定义时拿到原函数，构建一个包装函数并返回。原来的名称此后指向包装函数。真正调用这个名称时，才执行日志和原函数。

装饰器本身也可以在定义时做注册等工作，所以不能把里面所有代码都理解成“每次调用才执行”。带参数的装饰器还会多一层工厂，用于先保存配置，再接收函数。

### 把替换过程写出来，就没有魔法了

下面两种语言都演示函数包装。Python 使用装饰器语法和 wraps；TypeScript 使用高阶函数，不冒充 Python 装饰器或 TypeScript 类装饰器 API。

### Python

```python
from functools import wraps

def logged(fn):
    @wraps(fn)
    def wrapped(*args, **kwargs):
        print("before")
        try:
            return fn(*args, **kwargs)
        finally:
            print("after")
    return wrapped

@logged
def double(n):
    return n * 2

print(double(3))  # before、after，然后 6
print(double.__name__)  # double
```

### TypeScript

```typescript
function logged(fn: (n: number) => number) {
  return (n: number) => {
    console.log('before');
    try {
      return fn(n);
    } finally {
      console.log('after');
    }
  };
}
const double = logged(n => n * 2);
console.log(double(3)); // before、after，然后 6
```

这里用 finally 确保异常时也执行结束日志，同时让原异常继续传播。真实日志系统还要避免记录敏感参数，以及日志错误覆盖业务异常。

### 多个包装，顺序会影响结果

如果依次写 `@a`、`@b`，对象替换可以理解为 `f = a(b(f))`。定义时先让 b 处理函数，再交给 a。

调用时通常先进入外层 a，再进入内层 b，返回时反向退出。鉴权放在缓存外侧还是内侧，就可能影响未授权请求是否先拿到缓存结果。

不过，装饰器可以返回不同对象，不一定都按同一包装模板工作。解释顺序时以实际返回对象为准，不把日志示例当成所有装饰器的固定行为。

### 元数据和异步语义，不能丢在包装外面

不用 wraps 时，函数名称和文档可能变成包装函数自己的信息，影响调试、文档生成和一些框架的检查。wraps 会帮助保留相关元数据，并提供 **wrapped**。

它不保证参数校验、缓存键或异常处理正确。装饰器保存可变状态时，还要分析共享和并发。

异步函数调用产生协程，业务执行发生在等待过程中。要统计完整异步耗时，包装器应是 async 函数并 await 原函数；只调用后立刻结束计时，测到的并不是接口完成时间。

生成器也有类似区别：创建对象和消费数据不是同一阶段。知道被装饰对象什么时候真正做事，才能把包装放对。

本题机制参考：[Python：Function definitions](https://docs.python.org/3/reference/compound_stmts.html)、[Python：functools.wraps](https://docs.python.org/3/library/functools.html)。

## 面试官继续追问

### 装饰器必须返回函数吗？

函数包装常常返回函数，但语义上返回值会重新绑定名称，也可以是其他合适的可调用对象或对象；要看使用场景。

### wraps 能保证行为完全不变吗？

不能。它主要处理元数据和原函数引用，参数、异常和执行时机仍由包装代码决定。

### 两个装饰器换顺序，效果一样吗？

不保证。替换和调用嵌套顺序变化，鉴权、缓存、事务等都可能受到影响。

## 面试速记卡

> - 定义时：func = decorator(func)。
> - 调用时：进入装饰器返回的对象。
> - 组合：上面的装饰器包住下面的结果。
> - wraps：保留元数据，不替你修复业务语义。
> - 异步：等待实际执行，别只测协程创建。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **百度 · 大模型生态集成 · 实习**：Python 装饰器是什么？（题意整理）。[面经来源](https://www.nowcoder.com/feed/main/detail/62d4ca9866d84d63bf6eafbb0a947bb8)；标题记录 2026 年 4 月；页面显示 04-22 编辑。
- **快手 · AI应用开发算法 · 原帖未明确批次**：Python 装饰器有哪些应用场景？（题意整理）。[面经来源](https://www.nowcoder.com/feed/main/detail/4f0f37f01fa64605a51b635bdeba16b4)；页面显示 05-02 发布，未明确年份。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
