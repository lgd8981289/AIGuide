# Python 的 JSON 和 pickle 有什么区别？为什么不能反序列化不可信 pickle？

[京东测试开发面试真题](../companies/jd-test-development.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/python/q603-python-json-pickle-serialization/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：JSON 和 pickle 怎么选？

🙋‍♂️ 我：JSON 适合跨语言，pickle 能保存更多 Python 对象。

🧑‍💻 面试官：那接口收一个 pickle 文件，loads 以后再检查类型是否安全，行不行？

🙋‍♂️ 我：不行，反序列化本身就可能执行危险操作。

🧑‍💻 面试官：JSON 解析成功又是否代表字段、大小和数据类型都符合接口要求？

> 先区分把数据读出来与恢复对象时执行动作。安全检查不能放在危险反序列化已经完成之后。

## 面试速答（60 秒版）

JSON 是通用的数据交换格式，主要表达对象、数组、字符串、数字、布尔和空值。它适合跨语言接口，但不能原样保留所有 Python 类型，例如元组读回会成为列表，自定义类需要另设计字段格式。

pickle 更贴近 Python 对象序列化，可以保存更丰富的对象关系，但依赖相应环境和定义，也不适合作为公开跨语言接口。

最重要的边界是不反序列化不可信 pickle。loads 可能在恢复对象时执行操作，不能先加载再检查“结果看起来是不是字典”。

JSON 不会按 pickle 那种协议重建任意 Python 类，但解析后仍需要字段校验、大小限制和资源约束。选择时把互操作性、版本演进和信任边界一起考虑，不只比较序列化有多方便。

![交换数据，与恢复对象协议不同](https://note.lgdsunday.club/img/Q603/01-overview-v3.webp)

## 知识点详解：通用数据格式与 Python 对象恢复协议

### JSON 保存的是约定的数据结构

假设接口需要交付一份坐标和标签。JSON 可以明确写字段、数字和数组，其他语言也能读懂。

但是元组和列表在这个格式里都通常变成数组，读回 Python 时就是列表。字典键也需要关注字符串规则，自定义类、日期和 Decimal 需要明确转换方式。

因此“序列化再读回完全相同对象”不是 JSON 的默认合同。接口应该定义字段语义，而不是依赖 Python 内部数据类型恰好没变。

### 同一份数据，读回类型可能不同

这里只对自己创建的可信数据使用 pickle，示例不提供处理上传 pickle 的入口。

#### Python

```python
import json
import pickle

data = {"point": (1, 2), "tags": ["A"]}
json_text = json.dumps(data, ensure_ascii=False)
json_result = json.loads(json_text)
pickle_bytes = pickle.dumps(data)
pickle_result = pickle.loads(pickle_bytes)  # 仅处理本例自己生成的可信数据

print(type(json_result["point"]).__name__)    # list
print(type(pickle_result["point"]).__name__)  # tuple
```

pickle 还能处理更多对象关系，但不是所有对象都能随意保存。函数和类通常涉及名称与定义环境，数据库连接、外部资源等也不适合靠它完整恢复。

换版本、移动模块路径或变更类定义后，旧文件是否还能读，需要实际兼容策略，不能承诺一个 pickle 文件永久独立于代码存在。

![元组经过 JSON，读回变成列表](https://note.lgdsunday.club/img/Q603/02-types.webp)

### 不可信 pickle，不能先读取再过滤

pickle 的恢复过程可能调用对象协议里的操作。问题发生在 loads 过程中，等它返回以后检查结果类型，已经错过了阻止这些操作的时机。

所以来自用户上传、未知网络来源或可被别人修改的文件，不应当直接 loads。限制“结果只能是 dict”也不是通用防线，受限反序列化要有严格设计，不能用几行白名单对所有场景保证安全。

可信来源还要包含完整性和存储权限。自己上周写出的文件，如果所在目录后来可被其他人替换，也不能只凭文件扩展名继续相信。

![检查结果太晚，恢复过程已经发生](https://note.lgdsunday.club/img/Q603/03-trust.webp)

### JSON 仍需要资源与字段检查

#### TypeScript（JSON 的运行时结果检查）

```typescript
const raw: unknown = JSON.parse('{"point":[1,2]}');
if (
  typeof raw !== "object" || raw === null ||
  !("point" in raw) ||
  !Array.isArray((raw as { point?: unknown }).point)
) {
  throw new Error("point 格式不正确");
}
console.log((raw as { point: unknown[] }).point);
```

这里只检查了一个数组字段，成员类型和长度还没全部验证。TS 的类型断言不替代运行时检查；Python 里也一样，json.loads 成功只是语法层面读出结构。

还要限制输入大小、嵌套深度或处理资源，按合同拒绝不支持的值。Python json 对 NaN 等扩展有默认行为，严格跨语言协议不能想当然接受；需要明确序列化与解析选项。

测试应该包含类型损失、错误字段、超大输入和版本变化。安全测试用无害固定数据，不需要构造会执行系统命令的 pickle 来“证明危险”。

依据：[Python 3.11 pickle 安全警告与协议](https://docs.python.org/3.11/library/pickle.html)、[json 类型转换与资源限制](https://docs.python.org/3.11/library/json.html)、[ECMAScript JSON.parse](https://tc39.es/ecma262/#sec-json.parse)。

![语法读出以后，再检查数据合同](https://note.lgdsunday.club/img/Q603/04-validation-v3.webp)

## 面试官继续追问

### Base64 包一层 pickle 就安全了吗？

不会。Base64 是编码，不改变反序列化恢复对象的行为和信任要求。

### JSON 解析成字典就能进业务吗？

还需要验证字段、成员类型、范围和权限，并限制输入资源。

### pickle 可以跨 Python 项目直接通用吗？

需要相应类与模块定义、协议和环境兼容。它不是像 JSON 那样独立的跨语言字段合同。

## 面试速记卡

> - JSON 表达通用数据，未必保留全部 Python 类型。
> - pickle 恢复更丰富对象，但依赖代码环境。
> - 不反序列化不可信 pickle。
> - 先 loads 后检查类型，不能补救恢复过程风险。
> - JSON 语法成功后仍需字段与资源校验。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **京东 · 测试开发 · 校招提前批**：JSON 怎样与 Python 的 list 相互转换？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353158125387718656)；正文记录 7 月 20 日一面后约二面；原帖发布于 2021-07-22。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
