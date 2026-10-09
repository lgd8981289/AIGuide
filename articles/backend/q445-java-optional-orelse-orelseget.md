# Java Optional 怎么用？orElse 和 orElseGet 有什么区别？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q445-java-optional-orelse-orelseget/) · [题库目录](../../README.md)

*下面是一段教学模拟，不是真实面试记录。*

🧑‍💻 面试官：Optional 已经有值，orElse 里的默认查询还会执行吗？

🙋‍♂️ 我：不会，默认值不是为空才用吗？

🧑‍💻 面试官：默认值“被使用”和默认函数“被执行”，是同一回事吗？

🙋‍♂️ 我：Java 要先求出方法参数，查询可能已经发生了。

🧑‍💻 面试官：那 orElseGet 为什么能避免这个问题？是不是把函数调用加个括号就行？

> 区别不在返回哪个值，而在「默认值什么时候计算」：orElse 接收已经求出的值，orElseGet 接收需要时才调用的供应函数。

## 面试速答（60 秒版）

Optional 表达一个可能不存在的结果。orElse 和 orElseGet 都能在没有值时提供默认结果，但求值时机不同。

orElse 接收普通参数，因此如果参数是函数调用，这个函数在进入方法前就会执行，即使 Optional 已经有值。

orElseGet 接收 Supplier，只有 Optional 为空时，才需要调用它取得默认值。因此，默认值只是便宜常量，可以用 orElse；默认值涉及查询、计算或副作用，通常更适合 orElseGet。

另外，Optional 不会自动处理所有 null 与异常。应根据缺失语义选择 ofNullable、map 或明确抛出异常，不能把 get 当成不检查就能安全取值的接口。

![Optional：默认值何时计算：默认值不用，也可能算过了](https://note.lgdsunday.club/img/Q445/01-overview.webp)

图里画的是“最后返回什么”，不是“何时计算”。尤其是 orElse，默认值即使没被选中，也可能已经算过了。

## 知识点详解：值没有被使用，为什么查询却发生了？

### Java 先计算参数，再调用方法

假设 cacheResult 已经包含用户资料，但我们写 cacheResult.orElse(loadFromDatabase())。

进入 orElse 之前，Java 要先执行 loadFromDatabase，得到一个参数值。然后 orElse 再决定返回已有资料还是这个参数。

因此，数据库查询虽然没有成为返回值，却已经发生了。如果查询昂贵，浪费了工作；如果函数会写日志、修改数据或抛异常，这些影响也不会因为已有值而消失。

Optional 没有打破普通参数求值规则。[Optional 官方 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Optional.html)

![默认查询为什么已经执行：不用默认值，不代表没算](https://note.lgdsunday.club/img/Q445/02-mechanism.webp)

### orElseGet 传的是“怎样得到值”

写成 cacheResult.orElseGet(() -> loadFromDatabase()) 时，传入的是 Supplier。

Optional 有值时，不需要调用这个 Supplier。为空时，才执行其中的逻辑。

注意不要先在外面调用查询，再把已经求出的变量放进 Supplier。昂贵工作如果早已发生，换一个 API 名称也不能把它变回惰性。

同样，Supplier 被调用后如果抛异常，并不会自动变成 Optional.empty。它只是延迟计算，不是异常屏蔽。

### 缺失、null 和错误，要分别表达

of 用于明确非 null 的值，传 null 会报错；ofNullable 才允许把 null 转成空 Optional。

map 用于转换存在的值，映射函数产生 null 时会得到空结果。flatMap 则用于转换函数本来就返回 Optional 的情况，避免多包一层；函数本身不能返回 null 来冒充 Optional。

如果结果缺失属于错误，可以使用 orElseThrow 明确表达，而不是到处调用 get，等到 NoSuchElementException 出现才发现没有值。

“没有找到用户”与“查询数据库失败”也不是同一件事。不要捕获所有查询异常后返回 empty，让调用方误以为只是资料不存在。

### 它适合表达返回语义，不是所有地方都要包一层

方法返回一个可能缺失的结果时，Optional 能让调用者看到这个约束。

但参数、持久化实体字段和序列化对象是否使用它，需要看接口与框架支持。不能因为 Optional 能减少某些 null 判断，就把所有字段统一改成 Optional。

本文讲的是 Java 方法和求值机制。TypeScript 与 Python 有自己的缺失值与惰性计算写法，没有应当机械翻译的同名 Optional API，因此不提供伪造的双语言对应示例。

## 面试官继续追问

### 默认值是空字符串，需要 orElseGet 吗？

通常没有必要。常量求值很轻，orElse 能清楚表达默认值。要避免的是不必要的昂贵计算和副作用，不是禁止所有普通参数。

### Optional 有值，就一定可以安全使用里面的对象吗？

只能说明当前 Optional 存在一个非 null 值，不证明对象内容有效、权限正确或状态未过期。业务约束仍需检查。

### 是否应该用 empty 表示所有失败？

不应该。缺失、拒绝和系统故障应有明确语义，否则调用方无法正确重试、提示用户或记录故障。

## 面试速记卡

> - orElse：接收普通值，参数表达式会先求值。
> - orElseGet：接收 Supplier，仅在为空时计算默认值。
> - 选择：便宜常量可用 orElse，昂贵或有副作用的默认计算考虑 orElseGet。
> - null：of 不接收 null，ofNullable 可以表达缺失。
> - 错误语义：empty 不应掩盖查询异常或业务拒绝。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
