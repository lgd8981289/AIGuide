# pytest 的 fixture 是什么？scope 和 yield 如何影响测试隔离？

[微派测试面试真题](../companies/weipai-testing.md) · [小马智行测试面试真题](../companies/pony-testing.md) · [腾讯测试面试真题](../companies/tencent-testing.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/python/q615-pytest-fixture-scope-yield/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：fixture 是什么？scope 有什么作用？

🙋‍♂️ 我：fixture 准备测试需要的资源，scope 控制复用范围。

🧑‍💻 面试官：把一个会被修改的列表改成 session scope，测试会有什么变化？

🙋‍♂️ 我：后面的用例可能拿到前面改过的同一列表。

🧑‍💻 面试官：yield 后的清理在什么时候跑？如果创建到一半就在 yield 前失败，又谁负责释放？

> 资源复用和状态隔离是一笔交换。scope 越大，创建次数可能越少，但越需要明确每个测试如何恢复干净状态。

## 面试速答（60 秒版）

pytest fixture 把测试资源的准备、依赖和清理组织在一起。测试通过名字请求它，pytest 在适当时机创建并提供结果。

scope 决定复用生命周期，默认 function 通常每个测试一份，module 或 session 则可能被更多测试共用。扩大 scope 可以减少重复准备，但可变状态更容易串到后面的用例。

yield 前准备并交出资源，yield 后执行收尾。测试失败时也应安排清理；但如果 fixture 在 yield 前就失败，尚未走到的后置代码不会替已创建资源自动执行。

因此我会把资源获取与释放配成明确动作，按依赖顺序组织 fixture，避免用会话级共享可变对象换取一点启动速度却牺牲隔离。

![准备、交给测试、收尾](https://note.lgdsunday.club/img/Q615/01-overview-v2.webp)

## 知识点详解：fixture 何时创建、谁共享、怎样清理

### fixture 是测试依赖，不只是一个工具函数

假设两个测试都要一份待处理列表。用 fixture 定义这份初始状态，测试参数写名字就能请求它，其他 fixture 也可以依赖它。

同一个测试中多处请求同一个 fixture，pytest 通常会在相应生命周期内复用已经创建的结果，不是每写一次名字都重新调用。

因此读 fixture 时要画依赖关系。某资源依赖另一资源时，先准备依赖再准备自己；不要靠函数在文件里排列的先后顺序推断执行顺序。

### scope 变大，共享范围也变大

下面保存成 test\_records.py，默认每个测试获得一份初始列表。

#### Python

```python
import pytest

@pytest.fixture
def records():
    items = []
    yield items
    items.clear()

def test_add(records):
    records.append("A")
    assert records == ["A"]

def test_starts_empty(records):
    assert records == []
```

如果把 records 改为 scope="session"，这份列表会在会话范围复用。第一个测试添加 A 后，并不会在每个测试结束就执行会话资源的最终清理，后续测试可能看到 A。

共享资源不是天然不可以。数据库连接等昂贵设施可以较大范围复用，但每个测试的事务和数据状态要有独立策略。连接复用与测试数据共用需要拆开。

![扩大 scope，后面的测试会共享状态](https://note.lgdsunday.club/img/Q615/02-scope.webp)

### yield 后收尾，也有到达前提

pytest 在 fixture 已经 yield 出资源后，测试成功或失败都会按相应流程执行收尾。依赖资源通常按适当的逆向顺序清理，避免先关闭底层资源却还要清理上层对象。

但是 fixture 在 yield 前先创建文件、再连接失败，后面的 yield 和清理代码根本没到达，就不能期待它们自动收掉已经创建的文件。可以把动作拆成更小 fixture，使用上下文管理器或正确注册 finalizer。

清理本身也可能失败，需要让错误暴露而不是全部吞掉。测试进程被强杀又是另一种情况，不能把正常收尾合同扩大成所有系统退出都保证执行。

![yield 前失败，后置清理尚未开始](https://note.lgdsunday.club/img/Q615/03-failure.webp)

### 不同语言测试钩子，合同需要重新对齐

#### TypeScript（Node 每用例状态对照）

```typescript
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

let records: string[];
beforeEach(() => { records = []; });
test("添加记录", () => {
  records.push("A");
  assert.deepEqual(records, ["A"]);
});
test("起点为空", () => {
  assert.deepEqual(records, []);
});
```

这个示例按默认非并发测试安排状态；并发用例不应依赖同一可变全局变量。Node 钩子也没有自动得到 pytest fixture 的名字依赖和 scope 合同，不能机械改名。

验证隔离时让用例换顺序运行，并单独与全量各跑一次。只有全量或某种顺序才失败，常常值得检查共享 fixture、全局缓存和清理边界，而不急着给测试加 sleep。

依据：[pytest fixture 复用、scope 与 yield](https://docs.pytest.org/en/stable/how-to/fixtures.html)、[fixture 顺序解释](https://docs.pytest.org/en/stable/reference/fixtures.html)、[Node 测试钩子](https://nodejs.org/api/test.html)。

![依赖先建立，收尾反向安排](https://note.lgdsunday.club/img/Q615/04-dependencies.webp)

## 面试官继续追问

### session scope 一定更好吗？

它可能减少准备，但扩大共享范围。状态恢复和失败隔离成本要一起考虑。

### 一个测试请求同 fixture 两次会新建两份吗？

在同一个相应生命周期里通常复用已创建结果，不能把请求次数当创建次数。

### yield 前失败，后面的清理自动跑吗？

尚未到达的 yield 后代码不会执行，需要为已经获取的资源安排独立可靠的清理。

## 面试速记卡

> - fixture 组织测试依赖、准备与清理。
> - scope 决定资源复用生命周期。
> - 大 scope 可减少准备，也增加串状态风险。
> - yield 后清理以成功交出资源为前提。
> - 依赖顺序与资源所有权，比文件排列更重要。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **微派 · 测试工程师 · 25届校招**：pytest 的 fixture 功能是什么？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/724964939189776384)；原帖发布于 2025-02-28。
- **小马智行 · 自动驾驶测试 · 秋招（原帖标签）**：pytest 的 fixture 解决什么问题，怎样用于组织测试用例？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/924026132939165696)；标题记录面试日期 2026-08-28；页面显示 09-04 编辑，未明确编辑年份。
- **腾讯 · 测试（云架构） · 原帖未明确批次**：fixture 的作用是什么？（题意整理）。[面经来源](https://www.nowcoder.com/feed/main/detail/b49fb9e1b29f4b6989ef0bcc3a73555a)；页面显示 02-06 发布，未明确年份。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
