# Python 的 `__str__` 和 `__repr__` 有什么区别？日志和调试应该实现哪个？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/python/q588-python-str-repr/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：**str** 和 **repr** 的区别是什么？

🙋‍♂️ 我：str 给用户看，repr 给开发者看。

🧑‍💻 面试官：为什么 print(user) 和 print(\[user]) 出来的内容不一样？

🙋‍♂️ 我：容器显示成员时会使用 repr。

🧑‍💻 面试官：如果 repr 里把整个对象字典都打印出来，日志会不会泄露密码和令牌？

> 对象表示先回答“谁要看、需要看什么”。调试信息应当有用，但不能因为叫 repr 就把敏感字段全部交出去。

## 面试速答（60 秒版）

**str** 提供更适合用户阅读的字符串，print(obj) 和 str(obj) 通常会使用它。**repr** 提供更明确的开发调试表示，repr(obj)、容器成员显示以及 f-string 的 !r 都会用到它。

如果没有实现 **str**，默认行为可以退回 **repr**。只实现 str 并不会让列表里展示对象时也使用同一种文本。

repr 最好能标明类型和关键状态，条件允许时尽量不含歧义，但不是所有对象都必须能用 eval 还原。

实际项目里，我会为对象写一个简洁的 repr，保留排查所需的编号和状态，排除密码、Token 和个人敏感信息。给用户展示的文案再由 str 或专门的展示方法提供。对象表示也不应该触发网络查询或修改状态。

![同一用户，两种阅读目的](https://note.lgdsunday.club/img/Q588/01-overview-v5.webp)

## 知识点详解：同一个对象，可以有面向读者和面向调试的表示

### 先看两个输出分别想表达什么

假设用户对象有编号、昵称和访问令牌。界面只想显示昵称，日志则需要知道是哪一个用户对象、编号是什么。两份文本的目的不同，所以不用强行让它们一致。

**str** 和 **repr** 都必须返回字符串。repr 的重点是尽量明确，避免只给出一个没有类型和上下文的昵称。条件适合时可以做成近似构造表达式，但数据库连接、文件或复杂状态对象很难用一段文本完整还原。

所以“repr 必须能 eval”说得太满。更实际的要求是，让开发者分得清对象是什么，又不把调试表示当作序列化协议。

### 为什么列表里使用了另一种显示？

下面分别打印对象、对象列表和显式 repr。

#### Python

```python
class User:
    def __init__(self, user_id, name, token):
        self.user_id = user_id
        self.name = name
        self.token = token

    def __str__(self):
        return self.name

    def __repr__(self):
        return f"User(user_id={self.user_id!r}, name={self.name!r})"

user = User(7, "小李", "secret-token")
print(user)          # 小李
print([user])        # [User(user_id=7, name='小李')]
print(f"{user!r}")    # User(user_id=7, name='小李')
```

print 列表时，外层列表需要展示自己的结构，再使用成员的 repr。因此只实现 **str**，并不能保证对象在所有位置都只显示昵称。

!r 明确请求 repr；!s 请求 str。字符串字段使用 !r，也能让引号、换行等更容易识别，而不是看起来像未转义的普通标签。

![打印列表，成员走 repr](https://note.lgdsunday.club/img/Q588/02-container.webp)

### 不要让调试表示顺便做业务工作

如果 **repr** 为了展示关联对象名称，顺便访问数据库，那么简单打印列表也可能多次发查询。对象一多，日志就会改变请求的性能，甚至在异常处理时再抛另一种异常。

对象表示应该尽量使用已经有的、获取成本可控的数据。需要更完整的报告，就使用一个明确的方法，让调用者知道它可能访问外部资源。

敏感信息也要在类定义处处理。直接 return str(self.**dict**) 很方便，但会把后续新增的 Token 字段一并输出。数据类默认 repr 也会纳入字段，需要使用 repr=False 等配置排除敏感项。

![调试摘要要选字段，不要倒出整个对象](https://note.lgdsunday.club/img/Q588/03-safe.webp)

### 跨语言调试输出，不要假设同一协议

#### TypeScript（明确输出方法对照）

```typescript
class User {
  constructor(
    public userId: number,
    public name: string,
    private token: string
  ) {}
  toString(): string { return this.name; }
  debugSummary(): string {
    return `User(userId=${this.userId}, name=${JSON.stringify(this.name)})`;
  }
}
const user = new User(7, "小李", "secret-token");
console.log(String(user));
console.log(user.debugSummary());
```

JS 的 toString 不等于 Python 的 repr。Node console.log 对对象的检查也有自己的规则，不能承诺实现 toString 就会让所有日志输出隐藏私有字段。这里显式调用安全摘要，不用语言的检查行为代替敏感数据策略。

复查时可以覆盖单对象、对象列表、!r 和异常日志。再检查输出里有没有凭据，以及一次表示是否触发了额外操作。日志里看得清和数据不会泄露，两项都要验证。

依据：[Python 3.11 **repr** 与 **str**](https://docs.python.org/3.11/reference/datamodel.html#object.__repr__)、[Python 格式转换](https://docs.python.org/3.11/library/string.html#format-string-syntax)、[dataclass 字段 repr 配置](https://docs.python.org/3.11/library/dataclasses.html#dataclasses.field)。

## 面试官继续追问

### 只实现 repr，print 对象会怎样？

默认 str 可以退回 repr，所以能得到这份表示。自定义其他协议时仍以具体类行为为准。

### repr=False 就能保证数据绝不泄露吗？

它只影响相应生成的 repr。序列化、手写日志、异常和其他输出路径仍要审查。

### repr 能作为持久化格式吗？

通常不应这样做。它服务调试，格式可能改变；持久化需要明确字段、版本和安全解析规则。

## 面试速记卡

> - str 服务可读展示，repr 服务明确调试。
> - 容器展示成员通常使用 repr。
> - !r 明确请求 repr，!s 请求 str。
> - repr 不要求所有对象都可 eval 还原。
> - 对象表示应避免敏感字段、外部查询和副作用。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
