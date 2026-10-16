# Python 的 pytest 和 unittest 有什么区别？已有 unittest 用例能继续用吗？

[微派测试面试真题](../companies/weipai-testing.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/python/q614-python-pytest-vs-unittest/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：pytest 和 unittest 怎么选？

🙋‍♂️ 我：unittest 是标准库，pytest 写断言和组织测试比较方便。

🧑‍💻 面试官：已有一批 TestCase，用 pytest 跑是不是要全部重写？

🙋‍♂️ 我：大多数普通 unittest 用例可以直接被 pytest 收集。

🧑‍💻 面试官：那 pytest fixture 参数能随便加到 TestCase 方法里吗？两者生命周期都完全一样吗？

> 可以复用测试用例，不代表所有扩展机制完全互通。选测试框架时，先看已有资产和需要的组织方式。

## 面试速答（60 秒版）

unittest 是 Python 标准库测试框架，常用 TestCase、setUp、tearDown 和 assert 方法组织用例。pytest 支持函数式用例、普通 assert 的失败展示、fixture 和参数化等扩展。

pytest 能收集并运行很多已有 unittest.TestCase，所以迁移不必一开始全部重写。可以先统一运行入口，再逐步为新用例采用合适写法。

但兼容不等于所有特性都能直接混用。例如 TestCase 方法不能像普通 pytest 函数那样直接通过形参请求 fixture；官方提供的 autouse、usefixtures 等支持也有边界。

我会根据项目规模、现有用例、插件需求和团队维护能力选择。用哪个框架都要保证断言验证真实行为、测试互不串状态，不用框架名称代替测试质量。

![统一运行，不必先重写全部用例](https://note.lgdsunday.club/img/Q614/01-overview.webp)

## 知识点详解：运行入口可以统一，用例组织仍有差异

### unittest 把用例组织在 TestCase 里

假设测试一个折扣函数。unittest 用类承载用例，用 assertEqual 等方法表达预期，并用 setUp/tearDown 为每个测试准备和清理状态。

它在标准库里，不额外依赖 pytest 就能运行。既有项目如果已经有稳定的 TestCase、发现方式和 CI，也不必为了新写法立即推倒重来。

pytest 可以在这些资产之上增加运行与报告能力，再让新测试逐渐使用函数与 fixture。是否改写，应当由测试维护收益决定。

### 同一个业务合同，可以用两种写法

下面保存为 test\_discount.py。pytest 会收集函数式用例，也会识别 TestCase。

#### Python

```python
import unittest

def discounted(price, ratio):
    return price * ratio

class DiscountTest(unittest.TestCase):
    def test_half(self):
        self.assertEqual(discounted(100, 0.5), 50)

def test_half_with_pytest():
    assert discounted(100, 0.5) == 50
```

运行 python -m unittest 可以发现相应 TestCase，不会自动把普通 pytest 风格函数当成 unittest 方法；python -m pytest 则可以运行这两类用例。当前示例用整数结果，避免把不必要的浮点误差问题塞进框架比较。

断言的失败信息影响定位体验，但不改变业务定义。无论写 self.assertEqual 还是 assert，都要先知道预期是否正确。

![能收集旧用例，不等于任意注入 fixture](https://note.lgdsunday.club/img/Q614/02-compatibility.webp)

### fixture 注入不是对所有方法都自动支持

普通 pytest 函数可以把 fixture 名字写在参数里，请求相应资源。unittest.TestCase 方法按自己的调用协议执行，不能直接照搬这个参数注入方式。

官方兼容说明支持通过适合的 autouse fixture 或 usefixtures 等方式安排某些资源，但参数化等能力不能一律视为直接支持。遇到混用，先核对目标机制再设计边界。

生命周期阶段的报告也可能不同。迁移后失败归属和清理次序应该实际验证，不只看用例数量一样就算兼容完成。

### 测试框架不能替代好测试

#### TypeScript（Node 测试运行器对照）

```typescript
import { test } from "node:test";
import assert from "node:assert/strict";

function discounted(price: number, ratio: number): number {
  return price * ratio;
}
test("半价结果为50", () => {
  assert.equal(discounted(100, 0.5), 50);
});
```

Node 内置运行器是这里使用的实际库，不是 unittest 或 pytest 的 TS 版。测试发现、钩子和运行命令应按项目 Node/TS 工具链安排。

选框架时可以先迁移一组包含准备、异常和清理的代表性测试，观察发现结果、失败信息和状态隔离。大量旧用例完全 mock 掉真实逻辑时，即使用更好的报告也发现不了合同错误。

依据：[Python 3.11 unittest](https://docs.python.org/3.11/library/unittest.html)、[pytest unittest 兼容说明](https://docs.pytest.org/en/stable/how-to/unittest.html)、[pytest 断言说明](https://docs.pytest.org/en/stable/how-to/assert.html)、[Node test runner](https://nodejs.org/api/test.html)。

![换运行器，仍要验证同一份合同](https://note.lgdsunday.club/img/Q614/03-quality.webp)

## 面试官继续追问

### pytest 运行旧 TestCase，需要全部改 assert 吗？

普通兼容用例通常不需要。可以先复用，必要时再调整写法和资源组织。

### TestCase 方法加 fixture 参数就能用吗？

不能按普通 pytest 函数的注入方式直接使用，应按兼容文档安排支持的机制。

### 测试多就代表覆盖好了？

要看关键行为、边界和失败路径是否被有效断言。数量不是覆盖质量的替代指标。

## 面试速记卡

> - unittest 提供标准库 TestCase 组织方式。
> - pytest 支持函数、assert 展示和 fixture 扩展。
> - 很多旧 TestCase 可被 pytest 直接运行。
> - 兼容运行不等于所有 fixture/参数化机制互通。
> - 框架选择服务维护，断言质量仍由测试设计决定。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **微派 · 测试工程师 · 25届校招**：pytest 和 unittest 各有什么优点和区别？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/724964939189776384)；原帖发布于 2025-02-28。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
