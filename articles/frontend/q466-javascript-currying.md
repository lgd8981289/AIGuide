# JavaScript 函数柯里化是什么？如何实现支持多次传参的 curry？

[字节前端面试真题](../companies/bytedance-frontend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q466-javascript-currying/) · [题库目录](../../README.md)

*以下对话为教学模拟，不是真实面经。*

🧑‍💻 面试官：什么是函数柯里化？

🙋‍♂️ 我：把多个参数拆成多次传入，比如 add(1)(2)(3)。

🧑‍💻 面试官：那 add(1, 2)(3) 呢？函数有默认参数时，怎样知道参数收齐了？

🙋‍♂️ 我：需要明确接受几次参数、怎样判断结束。

> 柯里化先改变调用形式；通用实现还要明确参数数量与结束条件。

## 面试速答（60 秒版）

函数柯里化，是把接收多个参数的函数，转成逐步接收参数的函数。严格的形式通常是每次接收一个参数；工程中的 curry 工具常常也允许一次传多个参数。

实现时，可以用闭包保存已经收到的参数。参数没收齐，就返回一个继续接收参数的函数；数量达到约定值，再调用原函数。

需要注意，默认参数和剩余参数会影响 JavaScript 的 function.length，不能总靠它推断需要多少参数。一个实用的简化实现，可以要求调用方显式传入参数数量。

柯里化适合复用一部分固定参数，但不必把所有函数都改成多层调用。实现还要说明是否支持 this、占位符和不固定参数数量。

![速答总览：柯里化通过闭包逐步保存参数，通用实现必须明确参数数量、结束条件和状态复用。](https://note.lgdsunday.club/img/Q466/01-overview.webp)

## 知识点详解：闭包保存什么，什么时候调用原函数

### 先看三种调用形式

假设原函数接收三个数，返回它们的和：

```text
普通调用：sum(1, 2, 3)
严格逐个接收：curriedSum(1)(2)(3)
常见工具扩展：curriedSum(1, 2)(3)
```

后两种都可以最后得到 6，但每一步返回的东西不同。还没收齐参数时，返回的是函数，不是最终结果。

[MDN 的函数说明](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions)有助于理解参数与闭包；[Lodash 的 curry 文档](https://lodash.com/docs/4.18.1#curry)则提供了支持占位符等功能的工具实现。下面只实现最小机制，不冒充完整 Lodash。

### 每次调用，都创建一份新的参数记录

下面显式传入 arity，也就是要求的参数数量。仅支持固定数量、普通调用的函数，不处理 this 和占位符。

#### TypeScript

```typescript
function curry(fn: (...args: number[]) => number, arity: number) {
  const collect = (saved: number[]) =>
    (...next: number[]): any => {
      const all = [...saved, ...next];
      return all.length >= arity
        ? fn(...all.slice(0, arity))
        : collect(all);
    };
  return collect([]);
}
const sum = curry((a, b, c) => a + b + c, 3);
console.log(sum(1)(2)(3)); // 6
console.log(sum(1, 2)(3)); // 6
```

#### Python

```python
def curry(fn, arity):
    def collect(saved):
        def receive(*next_args):
            all_args = saved + next_args
            if len(all_args) >= arity:
                return fn(*all_args[:arity])
            return collect(all_args)
        return receive
    return collect(())

add = curry(lambda a, b, c: a + b + c, 3)
print(add(1)(2)(3))  # 6
print(add(1, 2)(3))  # 6
```

Python 示例展示相同的闭包机制，不是 JavaScript 工具库的翻译 API。

这两份实现都选择“收齐后取前 arity 个参数”的规则。多余参数会被忽略，这是示例约定，不是所有 curry 工具都必须这样做。真实工具还应验证 arity，并明确零参数、过量参数等行为。

### 为什么不要原地修改同一个参数数组

假设先保存 `const addOne = sum(1)`，以后分别调用 `addOne(2)(3)` 和 `addOne(4)(5)`。

我们希望它们分别得到 6 和 10。如果所有分支都共享一个数组，并不断 push，新一次调用可能混入上一次留下的参数。

上面每次都创建 all，再为下一层闭包保存它，所以两个分支不会互相污染。这也是面试中值得解释的地方：闭包本身不是问题，**共享的可变状态才可能影响复用**。

### function.length 为什么不总是答案

JavaScript 的 length 不等于函数“最多能接收几个参数”。它按照声明中的特定规则计数，默认参数和剩余参数都会影响结果。例如默认参数出现以后，后面的参数可能不计入 length。

如果原函数本来接收任意数量参数，curry 无法仅凭“参数数量够了”决定结束。可以显式设定数量，或者采用额外的结束调用等约定，但那已是另一种接口设计。

柯里化与偏函数应用也有联系。偏函数应用先固定部分参数，返回新函数；柯里化改变整个接收参数的结构。工程代码中经常混用这些称呼，面试时最好先说明自己采用的定义。

## 面试官继续追问

### 支持对象方法时，this 怎么处理？

需要明确在哪一层绑定或保留 this，并使用 call、apply 等方式调用原函数。上面的最小实现不保证方法调用语义，不应直接拿去包装依赖 this 的方法。

### 支持占位符难在哪里？

参数不仅要计数，还要记录哪些位置已经填入、哪些仍为空。需要定义补位顺序，不能简单把所有参数拼接后判断长度。

### 柯里化有哪些实际价值？

可以预先固定配置或复用处理步骤，例如先固定校验规则，再处理不同输入。若多层调用让代码更难读，就不必采用；它是接口组织方式，不是性能优化保证。

## 面试速记卡

> - 基本机制：没收齐返回函数，收齐后调用原函数。
> - 保存方式：闭包记录参数，每个分支避免共享可变数组。
> - 数量边界：function.length 不等于所有函数的实际参数需求。
> - 简化约定：固定 arity，不支持 this 与占位符。
> - 工程选择：复用固定参数有价值时使用，不强行多层调用。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **字节跳动 · 前端 · 实习**：怎样实现函数柯里化？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/756639561995870208)；原帖发布于 2025-05-26。
- **字节跳动 · 前端 · 原帖未明确批次**：函数柯里化如何工作？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353156819747020800)；原帖编辑于 2020-08-24。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
