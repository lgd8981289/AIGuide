# Python 的 match case 和 if else 有什么区别？为什么 case 里的名字可能是赋值？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/python/q577-python-match-case-patterns/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：Python 的 match case，就是另一种 switch 吗？

🙋‍♂️ 我：我理解它可以按不同条件走分支。

🧑‍💻 面试官：那它能直接检查字典里有哪些字段吗？

🙋‍♂️ 我：可以写对应的结构模式。

🧑‍💻 面试官：如果我先定义 NAME = 'search'，再写 case NAME，是比较这个值，还是把输入绑定给 NAME？

> 模式既可以检查结构，也可以捕获数据。一个裸名字出现在 case 里，可能正在接收值，而不是读取已有常量。

## 面试速答（60 秒版）

Python 的 match case 从 3.10 开始提供结构模式匹配。它可以根据值和数据形状选择分支，同时把匹配到的部分绑定到名字。

例如一条操作数据里包含 type 和 query，可以用映射模式检查这些字段，再拿到 query 继续处理。guard 则能在结构匹配成功后增加条件。

需要小心的是，case NAME 这样的裸名字通常属于捕获模式，会接收当前输入；它不会因为 NAME 大写，就自动比较之前定义的常量。比较枚举或常量时，需要使用符合值模式规则的写法，比如带限定的名称。

因此，结构明确、需要拆出字段的分支可以考虑 match。简单真假判断用 if 仍然直接；模式匹配也不能代替完整输入校验。

![检查结构，再拿字段做判断](https://note.lgdsunday.club/img/Q577/01-overview-v3.webp)

## 知识点详解：匹配结构以后，名字从哪里得到值

### 先用一条操作数据看模式在检查什么

假设一个接口读到 {"type": "search", "query": "Python"}。处理搜索时，既需要确认操作类型，也需要拿到关键词。

映射模式可以把这两件事放在一起。指定的 type 值要匹配，query 对应的值要满足相应模式，再把它交给后面的代码。

#### Python（3.10+）

```python
def dispatch(action):
    match action:
        case {"type": "search", "query": str(query)} if query.strip():
            return f"搜索 {query}"
        case {"type": "cancel"}:
            return "取消"
        case _:
            return "操作数据不符合要求"

print(dispatch({"type": "search", "query": "Python"}))
print(dispatch({"type": "search", "query": " "}))
```

#### TypeScript（显式检查对照，无同名模式 API）

```typescript
function dispatch(action: { type?: unknown; query?: unknown }): string {
  if (action.type === "search" && typeof action.query === "string" && action.query.trim()) {
    return `搜索 ${action.query}`;
  }
  if (action.type === "cancel") return "取消";
  return "操作数据不符合要求";
}
console.log(dispatch({ type: "search", query: "Python" }));
console.log(dispatch({ type: "search", query: " " }));
```

Python 这里的 str(query) 是类模式的一种写法，检查对应值是否满足字符串模式，并捕获值；不能把它理解成强行调用 str 转换任意输入。

### 为什么 case NAME 会把名字改掉？

case 中的裸名字通常表示捕获，把当前被匹配的值绑定给这个名字。即使你提前给 NAME 赋过值，即使它全部大写，这个语法含义也不会自动改变。

如果这个模式无条件接收输入，后面的分支还可能被判定为不可达。遇到这样的错误，先检查是不是把常量比较写成了捕获。

比较枚举成员时，可以采用 Status.OK 这样的限定名称；比较简单字符串，也可以直接用字符串字面量。\_ 是通配模式，不会像普通捕获名字那样登记一个结果变量。

![case 裸名字，是接收值](https://note.lgdsunday.club/img/Q577/02-capture-v3.webp)

### guard 是结构检查之后的条件

在上面的搜索分支里，结构模式先拿到字符串 query，随后 if query.strip() 检查它是不是只剩空白。

guard 不成立，就继续尝试后面的 case。它可以使用已经捕获的值，因此适合补充结构以外的条件。但在 guard 里写复杂副作用，会让分支推理更难，也可能在后续分支继续执行前改变状态。

需要大量外部查询或业务判断时，先用模式拿到字段，再交给明确函数处理，通常更容易测试。

![结构匹配成功，条件仍可能拒绝](https://note.lgdsunday.club/img/Q577/03-guard-v3.webp)

### 模式匹配检查了什么，没检查什么？

映射模式通常不要求输入只包含列出的几个键。输入额外带有其他字段，不一定因此匹配失败。类模式也可能按对象协议读取属性，并不等于只看一份被动 JSON。

因此，接口如果要求禁止额外字段、检查取值范围或统一错误格式，仍需要实际校验方案。模式匹配适合组织分支，不应让它在没有说明的情况下承担全部校验约定。

测试时可以准备类型不符、缺字段、额外字段、空白字符串和正常数据，分别确认选中了哪个分支。本文使用 Python 3.11 运行基线，语法最低要求为 3.10。

依据：[PEP 636 模式匹配教程](https://peps.python.org/pep-0636/)、[Python 3.11 match 语句规范](https://docs.python.org/3.11/reference/compound_stmts.html#the-match-statement)。

## 面试官继续追问

### match 会做字符串到数字的自动转换吗？

不能把模式当转换函数。例如 int() 类模式检查对应对象形态，不等于把任意字符串解析为整数。

### 一个模式里可以把同一个捕获名字写两遍吗？

通常不能把重复捕获写成隐含的相等检查。需要比较已捕获的值时，用适当 guard 表达条件。

### 很多 if 都值得改成 match 吗？

不需要。只有模式能清楚表达结构与拆解时才有明显收益，简单条件保持 if 也容易理解。

## 面试速记卡

> - match case 按值与结构选分支，也能捕获数据。
> - 裸名字通常是捕获，大写不会自动变成常量比较。
> - 限定名称和字面量可以表达值匹配。
> - guard 在模式成功以后补充条件。
> - 映射模式允许的额外字段与接口校验要求要分开。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
