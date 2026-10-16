# Python 的 LEGB 作用域是什么？global、nonlocal 和闭包变量怎么理解？

[华为开发面试真题](../companies/huawei-development.md) · [大华开发面试真题](../companies/dahua-development.md) · [字节开发面试真题](../companies/bytedance-development.md) · [华为测试面试真题](../companies/huawei-testing.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/python/q581-python-legb-global-nonlocal/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：Python 的 LEGB 是什么？

🙋‍♂️ 我：查变量时，先找局部，再找外层函数，然后找模块和内置名称。

🧑‍💻 面试官：那函数里先 print(count)，后面才写 count += 1，为什么找不到模块里的 count？

🙋‍♂️ 我：因为后面的赋值让它被当成了局部变量。

🧑‍💻 面试官：循环里创建三个 lambda，为什么最后却都返回同一个数字？global 或 nonlocal 能解决吗？

> 先分清两个时刻。代码确定一个名字属于哪层作用域，和函数调用时读取这个名字的当前值，并不发生在同一步。

## 面试速答（60 秒版）

LEGB 是理解普通函数名称查找的一种顺序。L 是当前函数，E 是包围它的外层函数，G 是所在模块，B 是内置名称。

但查找之前，Python 已经会根据函数体里的绑定操作判断局部名字。如果函数里给 count 赋值，又没有 global 或 nonlocal 声明，那么这个 count 通常就是局部变量。赋值前读取它，会得到 UnboundLocalError，不会继续去模块找同名变量。

global 用来指明模块级名字，nonlocal 用来指明已经存在的外层函数名字。

闭包保存的是对外层绑定的访问能力。循环里的回调如果到最后才调用，读取的往往也是最后一次绑定的值。需要每个回调保留自己的数字时，可以用工厂函数创建独立绑定。

![名字属于哪层，值何时读取](https://note.lgdsunday.club/img/Q581/01-overview-v5.webp)

## 知识点详解：名字属于哪里，值又在什么时候读取

### LEGB 先帮我们定位一个名字

假设模块有一个默认折扣，函数里面又定义了本次请求的折扣。函数读取同名变量时，通常会先使用自己的局部绑定。没有这个局部名字，再往外层函数、模块和内置名称寻找。

这里的“外层”指代码嵌套形成的词法作用域，不能理解成“谁调用我，就去谁的局部变量里找”。换一个调用者，不会让函数自动读到调用者的所有变量。

类体也是一个容易多推一步的地方。类体内的名字不会像外层函数变量那样，自动成为方法的闭包。方法要访问类或实例属性，应该明确使用类名、self 等访问方式。LEGB 很好记，但它不能替代所有代码块的完整规则。

### 为什么后面的赋值会影响前面的读取？

我们先看这份最小代码。模块里明明已经有 count，但执行 bump 仍会报错。

#### Python

```python
count = 10

def bump():
    print(count)
    count += 1

try:
    bump()
except UnboundLocalError:
    print("局部 count 在读取时还没有值")
```

原因是函数体中出现了 count 的赋值。没有额外声明时，Python 会把这个函数使用的 count 判为局部名字。print 发生时，局部变量还没绑定，所以不会回头使用模块中的 10。

如果真的要修改模块变量，就在函数开头写 global count。不过，对请求计数这类状态，global 并不提供线程同步，也不让不同进程共享计数。普通计算函数直接返回新值，往往更容易测试。

![后面的赋值，先确定了局部名字](https://note.lgdsunday.club/img/Q581/02-local.webp)

### 闭包为什么没有记住每轮数字？

假设为三个菜单项准备回调。循环只反复更新一个外层名字，回调稍后调用时再读取它。闭包不会自动替每次循环保存一份快照。

下面先得到三个 2，再用工厂函数得到 0、1、2。factory 每次调用都拥有自己的 value 绑定，回调读取的对象就分开了。

#### Python

```python
def make_bad():
    return [lambda: i for i in range(3)]

def factory(value):
    def read():
        return value
    return read

print([f() for f in make_bad()])          # [2, 2, 2]
print([f() for f in [factory(i) for i in range(3)]])  # [0, 1, 2]
```

#### TypeScript（循环绑定对照）

```typescript
const withVar: Array<() => number> = [];
for (var i = 0; i < 3; i++) withVar.push(() => i);
const withLet: Array<() => number> = [];
for (let j = 0; j < 3; j++) withLet.push(() => j);
console.log(withVar.map(f => f())); // [3, 3, 3]
console.log(withLet.map(f => f())); // [0, 1, 2]
```

JS 的 let 循环会建立每轮的绑定，Python 的 for 没有这条相同规则。两段坏例子的最终数字也不同，不能只记住“闭包就是循环最后一项”。

![共享绑定和独立绑定，回调结果不同](https://note.lgdsunday.club/img/Q581/03-binding.webp)

### nonlocal 修改的是已有外层绑定

如果一个计数器闭包需要累加外层函数的 count，可以在内部声明 nonlocal count。它要求某层外部函数里已经存在这个名字；不能拿它声明一个全新的模块变量。

同样，给列表 append 和重新绑定列表也要分开。append 修改对象，通常不需要为了这次修改声明 nonlocal；执行 items = 新列表是在改绑定，就可能需要。

判断时可以依次问，当前代码是否绑定这个名字，绑定属于哪层，回调何时执行。三件事明确以后，UnboundLocalError 和晚绑定就不再是两种互不相关的“语法坑”。

依据：[Python 3.11 执行模型](https://docs.python.org/3.11/reference/executionmodel.html)、[Python 编程 FAQ 中的循环 lambda](https://docs.python.org/3.11/faq/programming.html#why-do-lambdas-defined-in-a-loop-with-different-values-all-return-the-same-result)、[TypeScript 的 let 声明](https://www.typescriptlang.org/docs/handbook/variable-declarations.html)。

## 面试官继续追问

### global 是全程序共享吗？

它指当前模块的全局命名空间。多个模块、进程或不同模块身份，并不因此自动合并状态。

### 默认参数也能固定每轮值吗？

可以用 lambda i=i: i，在函数创建时绑定默认值。这里用的是默认值求值时机；可变默认值的风险需要另行考虑。

### nonlocal 是复制外层变量吗？

它让内部使用并修改那个已有的外层绑定。多个闭包如果访问同一绑定，也会看见后续修改。

## 面试速记卡

> - LEGB 是普通函数查找名字的常用顺序。
> - 函数内的赋值会影响局部名字判定。
> - 赋值前读局部名字，可能抛 UnboundLocalError。
> - global 指模块，nonlocal 指已存在的外层函数绑定。
> - 闭包读绑定当前值，循环不会自动替回调拍快照。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **华为 · 开发（OD；原帖未明确细分岗位） · OD招聘**：什么是闭包？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/647514679367020544)；正文记录 7 月 12 日技术二面；原帖编辑于 2024-08-01。
- **大华 · Python开发（原帖标签） · 校招**：怎样在函数内部修改全局变量？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353155617470750720)；原帖编辑于 2019-09-28。
- **字节跳动 · 开发（基础架构；原帖未明确细分岗位） · 暑期实习**：闭包是什么，如何在装饰器中取得被装饰函数的返回值？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353154849422385152)；原帖编辑于 2019-03-04。
- **华为 · 软件测试（消费者 BG） · 原帖未明确批次**：Python 中的全局变量能否在函数内部修改？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353158531341819904)；正文记录 9 月 11 日两轮技术面；原帖编辑于 2021-11-06。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
