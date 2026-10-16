# Python 的 f-string、format 和百分号格式化有什么区别？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/python/q575-python-fstring-format/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：Python 里你会用 f-string、format，还是百分号格式化？

🙋‍♂️ 我：简单变量插入，我通常用 f-string。

🧑‍💻 面试官：如果要把编号补到四位，把小数显示成两位，f-string 怎么写？

🙋‍♂️ 我：可以在占位位置加格式规格。

🧑‍💻 面试官：格式化以后原来的数字会变成字符串吗？日志里直接用 f-string，会等到真正输出才计算吗？

> 格式化生成一段展示文本。表达式何时求值、显示规则如何指定、原数据是否改变，要分别确认。

## 面试速答（60 秒版）

这三种方式都能生成格式化字符串。百分号格式化采用较早的占位方式，format 通过花括号指定字段，f-string 则能在字符串里直接写表达式，常见局部变量拼接会更直观。

f-string 和 format 可以使用格式规格，比如指定宽度、小数位或百分比。格式化得到的是展示文本，原来的数值并不会因此被修改。

同时，f-string 在执行到这个表达式时就会求值。把它传给日志函数，不代表里面的计算可以等到日志真的输出时再做。

因此，普通展示按可读性选择，旧代码可以保留已有风格；涉及日志开销、数字精度或输入校验时，还要分别处理对应问题。

![格式化把字段变成展示文本](https://note.lgdsunday.club/img/Q575/01-overview.webp)

## 知识点详解：先算字段，再把字段放进文本

### 三种写法，先观察相同结果

假设页面要显示一个姓名和一个价格，三种写法都能完成。区别首先在字段放在哪、表达式怎样组织。

#### Python

```python
name, price = "课程A", 12.5
print("%s：%.2f" % (name, price))
print("{}：{:.2f}".format(name, price))
print(f"{name}：{price:.2f}")
print(f"编号{7:04d}，进度{0.125:.1%}")  # 编号0007，进度12.5%
print(type(price).__name__)              # float
```

#### TypeScript（模板字符串与显式格式化对照）

```typescript
const name = "课程A", price = 12.5;
console.log(`${name}：${price.toFixed(2)}`);
console.log(`编号${String(7).padStart(4, "0")}，进度${(0.125 * 100).toFixed(1)}%`);
console.log(typeof price); // number
```

TS 模板字符串没有直接对应 Python 完整格式规格的语法。例子调用各自实际存在的方法，只对照这几个展示结果，不能保证所有舍入与区域格式都一致。

### 宽度和小数位，控制的是展示结果

编号 7 显示成 0007，可以让一组编号在界面上对齐。四位通常表达最小显示宽度，不是把五位数字自动截掉一位。

价格显示两位小数，也只是生成一个按规则排列的字符串，price 仍然保存原来的数值。把这个字符串当成已经完成精确计算，容易在后面的逻辑里混淆数据和展示。

例如需要固定精度的小数运算，应先规定数值表示与计算规则，再在展示阶段格式化。格式化不能修复前面已经发生的精度损失。

![数据值和显示格式，两份东西](https://note.lgdsunday.club/img/Q575/02-presentation.webp)

### f-string 中的表达式，会在当前执行点计算

假设写 logger.debug(f"结果 {build\_summary()}")。在调用 debug 之前，f-string 已经需要 build\_summary 的返回值，因此这个函数会先执行。

即使当前日志级别没有输出 debug，生成摘要的工作也可能已经做了。把普通参数交给日志框架可以延迟一部分字符串格式化，但函数调用本身仍遵守参数先求值的规则；昂贵的摘要要另外判断是否需要生成。

这和“模板看起来还没显示”没有关系。表达式进入哪一轮执行，就在那一轮处理，不会天然等到用户看到文本才开始。

![日志没输出，函数也可能已经算了](https://note.lgdsunday.club/img/Q575/03-evaluation-v2.webp)

### 选择写法时，优先看谁需要读这段代码

几个局部变量与短表达式，f-string 通常最容易读。模板需要独立保存、按名字替换字段时，format 的组织方式可能更符合已有代码。

旧模块已经大量使用百分号格式化，并不需要为了写法统一就全部改掉。先确认变化带来可读性收益，再核对占位符与参数的对应关系。

验证时使用空字符串、长编号、负数和不同小数，检查展示要求是否兑现。本文代码按 Python 3.11 语法解释，后续版本扩展的 f-string 语法需要另外核对。

依据：[Python 3.11 输入输出与格式化](https://docs.python.org/3.11/tutorial/inputoutput.html)、[格式规格语法](https://docs.python.org/3.11/library/string.html#format-specification-mini-language)、[Logging HOWTO](https://docs.python.org/3.11/howto/logging.html)。

## 面试官继续追问

### 宽度写四位，12345 会只显示四位吗？

不会因为最小宽度四位就截断较长内容。需要截断时明确写截断逻辑。

### f-string 能替代参数校验吗？

不能。它处理表达式和展示格式，外部输入是否满足范围或字段约束需要实际校验。

### 把日志改成 logger.debug('%s', build\_summary())，昂贵函数会延迟吗？

不会。build\_summary 作为参数仍先执行；延迟的是日志框架内部部分格式化，昂贵函数还需要在合适条件下调用。

## 面试速记卡

> - 三种写法都能生成文本，按字段组织与可读性选择。
> - 格式规格控制展示，通常不改变原数值。
> - 宽度是最低要求，不自动截断长内容。
> - f-string 在执行到表达式时求值。
> - 日志格式化延迟，不等于普通参数函数延迟执行。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
