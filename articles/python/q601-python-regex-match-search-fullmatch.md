# Python 正则的 match、search、fullmatch 有什么区别？如何避免只匹配到一部分？

[深信服开发面试真题](../companies/sangfor-development.md) · [蚂蚁集团测试开发面试真题](../companies/ant-test-development.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/python/q601-python-regex-match-search-fullmatch/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：match、search 和 fullmatch 有什么区别？

🙋‍♂️ 我：match 从开头，search 到处找，fullmatch 要匹配整个字符串。

🧑‍💻 面试官：那用 match 匹配编号规则，ABC123后面带一段乱字符为什么还通过？

🙋‍♂️ 我：它只保证匹配从开头开始，没有要求覆盖全部。

🧑‍💻 面试官：给模式加 ^ 和 $ 就一定等同 fullmatch 吗？结尾有换行又怎样？

> 先确定是在文本里找一段，还是要求整个输入都符合规则。匹配成功以后，还要看它实际覆盖了多少字符。

## 面试速答（60 秒版）

re.match 只尝试从字符串开头匹配，但不要求用完整个字符串。re.search 会寻找第一个匹配位置，适合从文本中抽取内容。re.fullmatch 要求整个字符串满足模式，更适合完整字段的格式检查。

例如编号规则是三个大写字母加三位数字，match 可以在 ABC123xxx 中匹配到前缀；fullmatch 则会拒绝额外尾部。

^ 和 $ 还受到多行模式和结尾换行规则影响，不能把加锚点与 fullmatch 在所有情况下等同。

实际校验我会明确字符范围、长度和是否允许空白。正则只负责约定的文本格式，编号是否存在、用户是否有权使用，还需要后续检查；复杂输入也要控制长度，避免不必要的回溯成本。

![找片段，还是检查完整输入？](https://note.lgdsunday.club/img/Q601/01-overview-v3.webp)

## 知识点详解：开始位置、覆盖范围和搜索目的

### 三个 API 先决定从哪找、找多少

假设一个表单只允许编号 ABC123 这种格式。我们关心的是整份输入，而不是输入中有没有藏着一个看起来合法的片段。

match 固定开始位置，却允许模式在中间结束。search 甚至可以跳过前面的字符，找到后面的合法片段。fullmatch 才把覆盖完整字符串作为要求。

把需求写成“找出文章中第一个编号”时，search 又是合理选择。API 没有单纯的严格优劣，关键是用来搜索还是用来完整检查。

### 用 span 观察成功到底覆盖哪里

下面让同一个模式面对三份输入。打印实际匹配片段，就能避免只看 True/False 的误解。

#### Python

```python
import re

pattern = re.compile(r"[A-Z]{3}[0-9]{3}")
for text in ["ABC123", "ABC123xxx", "编号ABC123"]:
    match = pattern.match(text)
    search = pattern.search(text)
    full = pattern.fullmatch(text)
    print(
        text,
        match.group() if match else None,
        search.span() if search else None,
        bool(full),
    )
print(bool(re.match(r"^[A-Z]{3}[0-9]{3}$", "ABC123\n")))  # True
print(bool(pattern.fullmatch("ABC123\n")))              # False
```

match 处理 ABC123xxx 时，group 只返回 ABC123。它没有证明后面的 xxx 符合规则。span 则直接告诉我们找到哪段位置，尤其适合排查 search 在意外位置成功的情况。

![匹配到前缀，尾部还没检查](https://note.lgdsunday.club/img/Q601/02-coverage.webp)

### 结尾换行让锚点例子暴露差异

Python 的 $ 可以在字符串末尾，或者末尾换行之前匹配。所以示例里加了 ^ 和 $，仍可能接受尾部换行。MULTILINE 又会改变锚点对各行边界的处理。

如果需求允许输入两边空白，可以先按约定规范化，再 fullmatch；不允许就直接拒绝。不要为了让某条测试通过，就一律 strip，因为密码、签名文本或空格有意义的字段不能随便删字符。

也要明确数字范围。Python 的 Unicode 字符类与 ASCII 数字不完全同义，编号只接受 0 到 9 时，直接写 \[0-9] 通常更容易让合同被读懂。

![末尾换行，也属于输入的一部分](https://note.lgdsunday.club/img/Q601/03-newline.webp)

### JS 对照也要检查整段长度

#### TypeScript（完整覆盖检查）

```typescript
const pattern = /[A-Z]{3}[0-9]{3}/;
function isCode(text: string): boolean {
  const found = pattern.exec(text);
  return found !== null && found.index === 0 && found[0].length === text.length;
}
console.log(isCode("ABC123"));    // true
console.log(isCode("ABC123xxx")); // false
console.log(isCode("ABC123\n")); // false
```

JS 没有 Python re.fullmatch 的同名接口，这里用匹配起点和长度明确检查。不同引擎的字符类、标志和状态行为也不能直接假设一致，例如带 g 的正则还涉及 lastIndex。

测试除了合法输入，还应包含前缀、后缀、换行、空输入和超长输入。若格式越来越复杂，先考虑分段解析或专门解析器，别为了“一条表达式搞定”引入难以解释的回溯结构。

依据：[Python 3.11 re](https://docs.python.org/3.11/library/re.html)、[正则 HOWTO](https://docs.python.org/3.11/howto/regex.html)、[ECMAScript RegExp 执行](https://tc39.es/ecma262/#sec-regexpbuiltinexec)。

## 面试官继续追问

### match 成功可以直接认为输入合法吗？

只能说明模式从开头成功匹配了某段。是否完整覆盖、是否满足业务条件都要另查。

### 为什么不默认对所有输入 strip？

空白可能是数据的一部分。规范化必须有字段合同，不能把不合规输入悄悄变成另一份合法数据。

### compile 是否保证正则没有性能问题？

不会。它准备模式，不消除复杂回溯和长输入问题；还应限制输入并验证失败路径。

## 面试速记卡

> - match 限定开头，不要求完整覆盖。
> - search 寻找第一个匹配片段。
> - fullmatch 要求覆盖整个输入。
> - 锚点受换行和标志影响，不机械等同 fullmatch。
> - 格式检查之外，存在性和权限仍要核验。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **深信服 · Python开发 · 校招（原帖标签）**：re.search 和 re.match 有什么区别？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353157075456958464)；正文记录 9 月 19 日、9 月 20 日技术面；原帖编辑于 2020-09-27。
- **蚂蚁集团 · 测试开发（原帖称蚂蚁金服） · 2022暑期实习（原帖标题）**：Python re 模块中的 match 和 search 有什么区别？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/364846466995679232)；原帖编辑于 2022-06-10；蚂蚁部分的面试日期未明确。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
