# Python 的 get、setdefault 和 defaultdict 有什么区别？读取时会新增键吗？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/python/q569-python-get-setdefault-defaultdict/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：字典里 key 不存在，get 和 setdefault 有什么区别？

🙋‍♂️ 我：都可以返回一个默认值。

🧑‍💻 面试官：setdefault 调用完，字典还是原来的样子吗？

🙋‍♂️ 我：没有这个键的时候，它会把默认值放进去。

🧑‍💻 面试官：如果默认值要调用函数生成，已有 key 时函数还会执行吗？defaultdict 又在哪一步调用工厂？

> 比较这些方法时，要同时看返回了什么、字典有没有被修改，以及默认值在什么时候创建。

## 面试速答（60 秒版）

dict.get 用来读取键，缺失时返回默认值，通常不会把这个键写进字典。setdefault 则在键缺失时把默认值写进去，再返回对应值。

defaultdict 可以提前配置一个默认值工厂。通过下标读取缺失键时，它会调用工厂生成值，并把结果保存到字典里。常见用法是按类别收集列表。

这里有个容易忽略的地方。get(key, make\_value()) 和 setdefault(key, make\_value()) 的参数会先求值，即使 key 已经存在，make\_value 也已经执行了。defaultdict 的工厂则在相应的缺失键访问时调用。

所以，只想读取时可以用 get；想顺便初始化缺失项时考虑 setdefault；经常按键分组时，defaultdict 往往更方便。还要记住，defaultdict 的 get 本身不会触发下标读取时的工厂行为。

![缺失键，三种方法做了什么](https://note.lgdsunday.club/img/Q569/01-overview.webp)

## 知识点详解：返回默认值和写入默认值，差了一个动作

### 只读取和顺便初始化，目的不一样

假设统计结果里暂时没有课程B。界面希望显示空列表，但暂时不想把课程B登记进结果，这时 get 可以返回默认列表，字典仍没有这个键。

如果我们准备把一个学员加入课程B分组，就需要先获得真正保存到字典里的列表。setdefault 可以在缺失时完成初始化，后续 append 修改的就是字典里保存的对象。

但如果课程B已经存在，两者都返回已有值。这个已有值可能是 None，也可能是空列表，方法不会因为它是假值，就自动替换成另一个默认值。

### 参数在进入方法前已经计算了

看下面的例子，课程A已经存在，setdefault 不需要插入默认列表，工厂却仍然打印了创建信息。

#### Python

```python
from collections import defaultdict

def make_list():
    print("创建列表")
    return []

plain = {"课程A": ["小李"]}
plain.setdefault("课程A", make_list())  # 仍打印创建列表
lazy = defaultdict(make_list)
print(lazy.get("课程B"))               # None，不调用工厂
lazy["课程B"].append("小王")           # 缺失下标访问才创建
```

如果默认值只是空列表，这点开销一般不值得写一大段优化代码。但默认值生成需要读文件或有其他副作用，就必须知道这一步不会被自动省掉。

![已有键，默认值函数也可能先执行](https://note.lgdsunday.club/img/Q569/02-evaluation.webp)

### defaultdict 的工厂，在哪次访问发生？

它的工厂由缺失键的下标访问触发。拿到默认列表以后，后续再读这个键，就会得到已经保存的那份列表，不会每次重新创建。

下面用 TS 的 Map 写相近的分组逻辑，显式检查键是否存在。JavaScript 没有同名内置 defaultdict，这个函数只是对照工厂调用时机。

#### TypeScript（Map 分组行为对照）

```typescript
function getOrCreate<K, V>(map: Map<K, V>, key: K, factory: () => V): V {
  if (!map.has(key)) map.set(key, factory());
  return map.get(key) as V;
}
const groups = new Map<string, string[]>();
getOrCreate(groups, "课程B", () => []).push("小王");
console.log(groups.get("课程B")); // ["小王"]
```

这里用 has 而没有直接判断 get 的结果是否为真，也是为了区别“没有这个键”和“已有键保存了假值”。

### 把同一份默认列表交给多个键，会发生什么？

假设先创建 shared = \[]，再把它传给不同键的 setdefault。多个新键可能都指向 shared，改其中一组，就会影响其他组。

需要每组独立列表，就应该为各组创建新对象。例如 defaultdict(list) 会在相应缺失访问时调用 list 工厂。它不会因为工厂相同，就默认让所有键共享一个列表。

验证时可以检查已有键、缺失键和已有 None 三种情况，再数一数工厂调用次数。还可以用身份比较确认两组是否引用同一个列表，这比只看最终打印结果更清楚。

依据：[Python 3.11 字典方法](https://docs.python.org/3.11/library/stdtypes.html#mapping-types-dict)、[defaultdict 的 **missing** 行为](https://docs.python.org/3.11/library/collections.html#collections.defaultdict)。

![不同分组，别共用同一个篮子](https://note.lgdsunday.club/img/Q569/03-sharing.webp)

## 面试官继续追问

### get 没写默认值，缺失键会报错吗？

dict.get 默认返回 None。通过 d\[key] 读取则通常会抛 KeyError；defaultdict 的下标读取另有工厂规则。

### setdefault 适合替换已有空列表吗？

它按键是否存在判断，不按列表是否为空判断。需要替换时，明确写赋值条件。

### defaultdict 适合所有读取接口吗？

不一定。下标读取缺失键可能写入一条新记录，如果只是检查存在性，应避免无意增加数据。

## 面试速记卡

> - get 读取并返回默认值，通常不登记缺失键。
> - setdefault 缺失时初始化，已有键返回原值。
> - 普通调用参数先求值，昂贵默认值不会自动延迟。
> - defaultdict 工厂由缺失下标访问触发，get 不触发。
> - 分组需要独立可变值，检查是否意外共享对象。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
