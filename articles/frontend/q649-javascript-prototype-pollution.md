# JavaScript 原型污染是什么？对象合并为什么可能影响其他对象？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q649-javascript-prototype-pollution/) · [题库目录](../../README.md)

*下面是用于讲题的模拟面试对话。*

🧑‍💻 面试官：接口收到一个 **proto** 字段，JSON.parse 就会污染所有对象吗？

🙋‍♂️ 我：解析通常只是得到一个同名的自身属性，后续怎样赋值或递归合并才是关键。

🧑‍💻 面试官：普通用户没有 isAdmin 字段，代码却读到了 true，可能从哪里来的？

🙋‍♂️ 我：可能沿原型链读到了被污染的属性。

🧑‍💻 面试官：那只过滤最外层的 **proto**，就能保证递归合并安全吗？

> 原型污染要沿写入路径和读取路径一起看。外部输入怎样碰到共享原型，以及程序为什么会信任继承来的值，缺一边都解释不完整。

## 面试速答（60 秒版）

原型污染是把不可信数据写进不该修改的原型，使其他对象在属性查找时受到影响。

常见入口是动态属性写入或不安全的递归合并。不可信键可能经过特殊属性路径触及原型；如果最终改到了共享的 Object.prototype，很多没有自身同名属性的对象都可能读到这份值。

但 JSON.parse 得到一个 **proto** 字段，不等于已经污染原型。需要继续看后续使用了哪种赋值、查找和合并逻辑。

防护优先使用明确的字段 Schema，避免把任意输入深度合并到配置或权限对象。必要的字典可以使用 Map 或无原型对象，同时用自身属性检查处理缺失值。权限判断还必须来自可信数据，不能让外部配置决定用户是不是管理员。

![原型污染，怎样影响无关对象？](https://note.lgdsunday.club/img/Q649/01-javascript-prototype-pollution.webp)

## 知识点详解：写一个对象，为什么会影响另一个？

### 先确认属性在哪里找到

假设对象没有自己的 isAdmin 字段，读取时可能沿原型链继续寻找。如果共享原型上被加了这个字段，读取结果就可能与开发者预期不同。

受影响对象不一定真的新增了一个自身字段。它可能只是继承到了污染值，所以遍历和直接读取表现也可能不同。这是 [MDN 原型污染说明](https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/Prototype_pollution)讨论的关键关系。

### 解析数据与合并数据，不是同一步

JSON 里的特殊键可以先作为普通自身属性存在。危险往往出现在后续代码把键和值写到目标对象，或者按输入给出的多层路径不断查找并写入时。

不同操作也不能一概而论。对象展开与某些赋值方式对属性设置器的处理不同；某一次浅拷贝没有触发问题，也不能证明后面的递归合并安全。

因此，排查应记录外部键、目标对象和每次路径读取。只看最终输入里有没有一个敏感单词，很容易漏掉嵌套结构或间接路径。

![解析 JSON，和危险写入是两步](https://note.lgdsunday.club/img/Q649/02-javascript-prototype-pollution.webp)

### 明确字段比接收任意配置更容易检查

假设设置接口只允许 theme，最直接的做法就是拒绝其他字段，并创建一份确定形状的新结果。下面没有动态深度写入，也不修改全局原型。

#### TypeScript

```typescript
function parsePreference(raw: unknown): { theme: "dark" | "light" } {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("需要对象");
  }
  if (Object.keys(raw).some(key => key !== "theme")) {
    throw new Error("存在未知字段");
  }
  const theme = Object.hasOwn(raw, "theme")
    ? (raw as Record<string, unknown>).theme : "light";
  if (theme !== "dark" && theme !== "light") throw new Error("主题无效");
  return { theme };
}
```

#### Python（字段白名单对照）

```python
def parse_preference(raw):
    if not isinstance(raw, dict):
        raise ValueError("需要对象")
    if set(raw) - {"theme"}:
        raise ValueError("存在未知字段")
    theme = raw.get("theme", "light")
    if theme not in ("dark", "light"):
        raise ValueError("主题无效")
    return {"theme": theme}
```

Python 字典没有 JavaScript 这套原型属性查找机制，这份代码仅对照白名单校验，不声称两种语言存在同一种漏洞。它们的输入都假定来自解析后的普通数据，不能替代完整的对象安全边界。

![只让允许的字段进配置](https://note.lgdsunday.club/img/Q649/03-javascript-prototype-pollution.webp)

### 字典对象和权限对象要分开处理

Map 不通过普通对象原型查找键，无原型对象也能减少继承属性的干扰。但把数据换个容器，不会自动修复后续把它重新合并进普通对象的代码。

自身属性检查适合确认字段是否真的存在。管理员身份则需要从服务端可信身份与权限记录取得，不能因为字段是“自身的”就相信用户传来的 true。

回归测试可以使用包含特殊键、嵌套未知字段和合法主题的数据，确认校验拒绝不支持的结构。测试前后还要确认无关普通对象没有新增可读属性，避免测试自己留下污染。

## 面试官继续追问

### 过滤 **proto** 就够了吗？

不够。还要考虑多层路径、constructor/prototype 等访问方式，以及具体合并算法。若接口只需要有限字段，限制 Schema 通常比维护一份越来越长的危险键名单更清楚。

### Object.hasOwn 能直接解决所有问题吗？

它帮助读取端区分自身与继承属性，不阻止写入端修改其他对象。外部数据即使是自身属性，也仍可能不可信，两边都要检查。

### 使用第三方深合并库，是否可以不用管？

仍要核对库版本、已知修复、合并目标和允许字段。对用户输入没有必要开放任意配置结构时，不应仅因为库提供了合并函数就放宽接口。

## 面试速记卡

> - 不可信动态写入可能触及原型，继承查找再把影响传播出去。
> - JSON 解析与后续合并分开检查，特殊键出现不等于已经污染。
> - 字段白名单与明确结果结构，减少任意深度写入。
> - Map、无原型对象和自身属性检查各有边界。
> - 权限来自可信身份与记录，不能信任外部管理员标记。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
