# Python 的 try、except、else、finally 按什么顺序执行？return 遇到异常会怎样？

[顺丰开发面试真题](../companies/sf-development.md) · [海康威视测试面试真题](../companies/hikvision-testing.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/python/q578-python-try-except-else-finally/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：try、except、else、finally 按什么顺序执行？

🙋‍♂️ 我：先执行 try，异常由 except 处理，finally 做收尾。

🧑‍💻 面试官：try 正常结束时，else 在哪里执行？如果 try 提前 return 呢？

🙋‍♂️ 我：正常走到末尾才进入 else，提前 return 仍要执行 finally。

🧑‍💻 面试官：如果 finally 也写了 return，会保留前面的返回值和异常吗？

> 先追踪当前准备怎样离开，再检查 finally 有没有发出新的离开动作。返回值和异常都可能在这里被覆盖。

## 面试速答（60 秒版）

try 中的代码先执行。出现异常时，解释器寻找匹配的 except；try 正常执行到末尾，才进入 else。finally 在这段控制流离开前执行，通常用来收尾。

如果 try 或 except 提前 return，else 不会因此执行，但 finally 仍然需要处理。执行完没有新的控制转移，原来的返回或异常才继续向外传。

但是，finally 里如果又 return 或抛出新异常，就可能替换原本准备传播的结果。这样会让错误被隐藏，所以收尾代码应尽量只负责清理，不顺手决定业务返回值。

还要记住，这些是正常解释器控制流的规则，进程被强制终止等情况不能依靠 finally 保证清理。

![正常、异常、返回走不同路径](https://note.lgdsunday.club/img/Q578/01-overview-v4.webp)

## 知识点详解：原来的结果，要等 finally 执行完才离开

### 正常、异常和提前返回，走的路径不同

假设我们解析一份输入。try 正常走到末尾，else 可以处理成功后的结果，然后 finally 完成收尾。

如果 try 中出现 ValueError，匹配的 except 先接住它，这次不会进入 else。except 处理结束以后，finally 仍会执行。

如果 try 已经 return，程序准备把返回值交给调用方，也不再进入 else。离开之前，finally 还有机会运行。把这些路径展开看，就不用把四个关键词机械记成永远全部执行。

### else 能让异常处理范围更明确

假设 try 只放输入解析，except 只想处理解析失败，那么解析成功以后的其他步骤可以放在 else。

else 中后来发生的异常，不会被前面这组 except 自动接住。这样有助于避免把“保存数据失败”也误解释为“输入格式不正确”。

但这不表示 else 是必须栏目。很短的代码可以按可读性组织，关键是确认哪一段异常会被哪一个处理器解释。

![else 的错误，不由前面 except 处理](https://note.lgdsunday.club/img/Q578/02-scope-v3.webp)

### finally 的 return，为什么能盖掉原来的结果？

下面故意保留一个不推荐的写法，便于看清控制流。try 已经准备返回 1，finally 又返回 2，调用方最终得到 2。

#### Python（用于观察覆盖，不推荐这样写业务）

```python
def example():
    try:
        return 1
    finally:
        return 2

print(example())  # 2
```

#### TypeScript（finally 控制流对照）

```typescript
function example(): number {
  try {
    return 1;
  } finally {
    return 2;
  }
}
console.log(example()); // 2
```

如果 try 中准备向外抛出异常，finally 又 return，同样可能把异常吞掉。Python 3.11 允许这里的写法，后续版本会对部分相关写法增加警告；不能因为代码可以运行，就认为清理里返回值值得推荐。

TS 没有 Python 的 try-else 语法。这个例子只对照 finally 的覆盖行为，不把两种语言的所有异常接口说成一样。

![finally 的返回覆盖原来的返回](https://note.lgdsunday.club/img/Q578/03-override.webp)

### 清理代码也可能失败，要留下原始原因

假设读取文件出错，关闭或记录清理信息时又出现另一个错误，外层看见的异常可能发生变化。日志与异常链应该帮助追踪原始原因，不能只留下“清理失败”。

因此，清理要尽量简单、可预测，并区分资源释放和业务补偿。释放文件句柄不意味着此前写了一半的数据已经自动回滚，finally 也没有提供数据库事务。

检查这类代码，准备正常路径、匹配异常、未匹配异常、提前返回和清理自身失败几种情况，记录实际执行顺序与向外传播结果。进程硬退出或被强制杀死属于另一种生命周期，不能拿普通异常测试承诺一定执行 finally。

依据：[Python 3.11 try 语句](https://docs.python.org/3.11/reference/compound_stmts.html#the-try-statement)、[Python 异常处理教程](https://docs.python.org/3.11/tutorial/errors.html)、[PEP 765 后续版本说明](https://peps.python.org/pep-0765/)、[MDN try/finally](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch)。

![收尾失败，要能找到前面的原因](https://note.lgdsunday.club/img/Q578/04-cleanup-v3.webp)

## 面试官继续追问

### finally 里只是打印，会改变返回值吗？

普通打印完成后，原来的返回继续。但打印或其他清理操作如果抛出异常，就需要按新的异常路径分析。

### except Exception 能捕获所有退出原因吗？

不能。SystemExit、KeyboardInterrupt 等不属于普通 Exception 分支；asyncio 取消也有对应规则，别用一条兜底处理掩盖所有退出语义。

### 有 finally，还需要 with 吗？

with 能把资源进入和退出协议封装起来，减少重复清理代码。是否使用由资源接口决定，不能认为 finally 已经自动管理所有资源。

## 面试速记卡

> - try 正常走到末尾才进入 else。
> - 异常由匹配的 except 处理，未匹配异常继续传播。
> - 提前 return 跳过 else，离开前仍执行 finally。
> - finally 里的新 return 或异常可能覆盖原结果。
> - 清理不等于事务回滚，强制终止不保证执行 finally。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **顺丰 · Python开发（丰图科技） · 校招（原帖标签）**：Python 的 try、except、else、finally、raise 怎样处理异常？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353157211826364416)；原帖编辑于 2020-10-25。
- **海康威视 · 软件测试 · 校招**：Python 的 try、except、finally 中出现 return 时，最终返回哪一个值？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353159469196582912)；原帖编辑于 2022-08-19。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
