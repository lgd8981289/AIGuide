# Python 的 assert 和 raise 有什么区别？为什么不能只用 assert 校验接口参数？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/python/q579-python-assert-vs-raise/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：Python 的 assert 能用来检查接口参数吗？

🙋‍♂️ 我：它可以在条件不成立时抛出 AssertionError。

🧑‍💻 面试官：如果服务用 python -O 启动，这条检查还会执行吗？

🙋‍♂️ 我：普通 assert 可能被优化选项移除。

🧑‍💻 面试官：那用户传了非法数量，系统是不是就放过去了？这种检查应该怎么写？

> 必要检查要在实际运行方式下仍然执行。内部调试断言和外部输入校验，承担的责任不同。

## 面试速答（60 秒版）

assert 用来表达程序内部预期应成立的条件，不成立时抛出 AssertionError。它适合帮助发现程序状态或开发假设出了问题。

但是，普通 Python 代码在启用优化选项时，assert 可以被移除。断言里的表达式和消息表达式也可能因此不再求值。

接口参数是否合法、用户有没有权限这类必要检查，应该用明确条件判断，并在失败时 raise 合适异常。不能让它们是否执行取决于调试断言有没有保留。

同时，assert 里面不应该放必须发生的副作用。即使条件写得正确，函数被跳过也可能改变程序行为。

![内部断言和必要检查，责任不同](https://note.lgdsunday.club/img/Q579/01-overview.webp)

## 知识点详解：检查如果能被移除，就不能承担入口责任

### 先问这条检查应该保护谁

假设我们接收任务数量，已经完成类型解析，现在需要保证数量大于零。这个限制属于接口约定，任何运行方式下都应该成立。

另一种检查是，某段内部算法结束以后，程序员预期计数与结果长度相同。这个断言帮助尽早发现程序错误，通常不是让外部用户靠它决定输入是否有效。

两者都可能“条件不成立就报错”，但需要执行的强度和异常语义不同。不能因为代码短，就把它们都交给 assert。

### assert 是语句，优化模式可以去掉它

普通模式执行 assert condition，条件为假会抛 AssertionError。优化模式可以在生成执行代码时省掉对应断言。

下面仅比较已经是数值的输入，不承担完整 JSON 类型校验。

#### Python

```python
def check_input(quantity):
    if quantity <= 0:
        raise ValueError("quantity 必须大于零")
    return quantity

def check_internal(count, rows):
    assert count == len(rows), "内部计数不一致"

try:
    check_input(-1)
except ValueError as error:
    print(error)
```

#### TypeScript（显式检查对照）

```typescript
function checkInput(quantity: number): number {
  if (quantity <= 0) throw new Error("quantity 必须大于零");
  return quantity;
}
try {
  checkInput(-1);
} catch (error) {
  console.log((error as Error).message);
}
```

TS 没有同名 Python assert 语句。这里展示显式判断的职责，不声称某个第三方断言库也会被 Python 的优化选项控制。

![两种运行方式，断言保留情况不同](https://note.lgdsunday.club/img/Q579/02-optimization.webp)

### 把必要动作放进断言，会一起消失

假设 assert write\_result() 既检查函数结果，又依赖函数写入数据。断言被移除时，write\_result 也可能不再执行。

即使平时一直返回 True，这种写法也把一个必要动作交给了可选检查。更清楚的方式是先执行动作，保存结果，然后决定用异常还是内部断言检查。

另外，assert (condition, message) 容易被误写成断言一个非空元组，和 assert condition, message 的含义不同。断言不是一个按两参数调用的普通函数，括号不能随便模仿函数调用。

![必要动作别藏在断言里](https://note.lgdsunday.club/img/Q579/03-sideeffect-v3.webp)

### 异常要能让调用方理解和处理

外部输入不合法时，可以选择符合接口约定的异常或错误响应；不能随意抛一个无法区分原因的 AssertionError，再让所有调用方猜测。

但内部断言也不是必须被忽略的“小错误”。它失败通常意味着程序假设不成立，应当保留足够上下文，回到实现检查原因。

验证这种边界，可以在普通模式和优化模式分别运行最小脚本，观察 assert 和显式 raise 的差异。不要只测试平时的启动命令，之后换部署参数却没有对应回归检查。

依据：[Python 3.11 assert 语句](https://docs.python.org/3.11/reference/simple_stmts.html#the-assert-statement)、[Python 命令行 -O](https://docs.python.org/3.11/using/cmdline.html#cmdoption-O)。

## 面试官继续追问

### 抛 AssertionError 和写 assert 完全一样吗？

显式 raise AssertionError 不会仅因为普通断言被优化移除就自动消失，但必要输入检查仍应采用清楚的异常约定。

### 函数加了类型注解，还需要运行时校验吗？

外部数据不会因为注解就自动符合约定。检查什么取决于输入来源和校验层，不能只依靠静态提示。

### 可以把所有 assert 都改成 raise 吗？

先看每条断言的目的。必要检查应明确保留，内部开发假设可以继续用断言表达，机械替换未必改善代码。

## 面试速记卡

> - assert 表达内部假设，失败抛 AssertionError。
> - 优化模式可以移除普通断言及其中求值。
> - 必要输入与权限检查采用实际条件判断和错误处理。
> - 断言里不放必须执行的副作用。
> - 验证部署方式，别只观察默认模式。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
