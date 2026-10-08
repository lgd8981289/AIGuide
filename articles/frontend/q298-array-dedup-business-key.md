# JavaScript 数组去重有哪些方法？为什么 Set 去不掉内容相同的对象？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q298-array-dedup-business-key/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：JavaScript 数组怎么去重？

🙋‍♂️ 我：可以把数组交给 Set，再转回数组。

🧑‍💻 面试官：两份 { id: 7 } 放进去，为什么还剩两份？

🙋‍♂️ 我：它们不是同一个对象引用，Set 不按内容比较。

🧑‍💻 面试官：那按 id 去重，同一个用户名字更新了，你保留第一条还是最后一条？顺序怎么算？

> 去重的第一步不是选 API，而是定义「重复的是谁，以及哪份数据应该留下」。

## 面试速答（60 秒版）

如果数组保存的是原始值，Set 是常见的去重方法。它采用 SameValueZero 比较，能合并重复的 NaN，也把正零和负零当作相同值。

但对象按引用身份比较，两个内容相同的新对象仍然是两个成员。业务列表通常要先确定唯一键，例如用户 id，再用 Set 记录已经见过的键，或者用 Map 保存对应对象。

同时要明确保留规则。保留第一条，可以遇到重复键就跳过；保留最后一条，可以覆盖 Map 中的值。不过覆盖已有键不会自动把它移到最后。因此，保留哪份对象和按什么顺序输出，需要分别设计。不能随手 stringify 就把所有对象去重规则解决了。

![数组去重，先定义重复](https://note.lgdsunday.club/img/Q298/01-overview.webp)

*图：数组去重，先定义重复。*

## 知识点详解：合并两页用户列表，重复到底是什么意思？

### Set 没有替你判断业务身份

假设第一页返回用户 7，第二页也返回用户 7，但两次接口分别创建了对象。它们内容可能相同，也可能第二次返回了新名字。

Set 能看到这是两份对象，却不知道 id 表示同一个人。它没有做错，只是我们需要的相等规则不在它的职责里。[Set 文档](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set)说明了原始值与对象身份的比较方式。

直接写两个相同字面量，与把同一个对象引用放入两次，结果并不一样。测试时要把这两种输入分开。

### 保留第一条：把身份与内容拆开

遍历用户列表时，记录已经见过的 id。没见过就保留当前对象，见过就跳过。这样输出顺序就是每个 id 第一次出现的顺序。

下面两版都假设 id 是可信的整数。Python 的 set 与 JS 的 Set 并非所有类型都具有相同规则，这里只对同一业务键实现相同行为。

#### TypeScript

```ts
function uniqueUsers<T extends { id: number }>(users: T[]): T[] {
  const seen = new Set<number>();
  return users.filter(user => {
    if (seen.has(user.id)) return false;
    seen.add(user.id);
    return true;
  });
}
```

#### Python

```python
def unique_users(users):
    seen = set()
    result = []
    for user in users:
        if user['id'] not in seen:
            seen.add(user['id'])
            result.append(user)
    return result
```

这段代码没有复制对象。后续修改对象，结果中的同一个对象也会变化。去重和深拷贝不是同一件事。

### 保留最后一条，不代表最后出现的位置

假设输入顺序是「用户 7 的旧信息、用户 8、用户 7 的新信息」。Map 覆盖 7 对应的值后，留下的是新信息，但键的迭代顺序仍然是 7、8。[Map 文档](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)说明了插入顺序规则。

如果要求按照最后出现的位置输出，就不能只覆盖值。可以明确删除后重新插入，或从右往左扫描、保留首次见到的键，最后反转结果。先说明顺序契约，再选实现。

![同一个ID，保留哪条记录？](https://note.lgdsunday.club/img/Q298/02-firstlast.webp)

*图：同一个ID，保留哪条记录？。*

### 为什么不直接把对象转成 JSON？

JSON 比较的是一种序列化结果，不是自动定义的业务相等。字段顺序、被忽略的值、日期表示与循环引用都可能改变行为。

用户列表以 id 识别人，写 id 就更清楚。确实需要按多个字段去重时，要定义字段类型、空值和分隔方式，避免把不同组合拼成同一个字符串。

验证至少覆盖重复 id、更新字段、缺失 id 和顺序。数据很大时还要考虑内存；精确去重必须保存足够的身份信息，并不存在一个不存状态、又保证所有历史都不重复的万能写法。

## 面试官继续追问

### 数字 7 和字符串 "7" 是同一个键吗？

JS Set 不会把它们自动合并。接口如果混用了类型，先按业务规则规范化，别靠宽松相等碰运气。

### 可以用 filter 加 indexOf 吗？

可以用于某些原始值，但 indexOf 对 NaN 的行为不同，而且反复扫描可能带来平方级比较。语义与规模都要核对。

### 不同租户的 id 相同怎么办？

身份键要包含租户，不能只保留 id。键的范围也是去重规则的一部分。

## 面试速记卡

> - 原始值：Set 按 SameValueZero 比较。
> - 对象：相同内容不等于相同引用。
> - 业务键：明确 id 的类型、范围和缺失值处理。
> - 保留规则：第一条、最后一条与输出顺序分别定义。
> - JSON：是序列化格式，不是通用相等规则。

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
