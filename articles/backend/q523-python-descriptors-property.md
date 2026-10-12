# Python 描述符是什么？property 如何控制属性的读取和赋值？

[有赞开发面试真题](../companies/youzan-development.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q523-python-descriptors-property/) · [题库目录](../../README.md)

下面是一段模拟面试对话。

🧑‍💻 面试官：为什么 product.price = -1 有时会抛错？看起来只是赋值。

🙋‍♂️ 我：price 可能是 property，setter 会检查负值。

🧑‍💻 面试官：property 为什么能拦住这个赋值？它和实例字典里一个普通字段有什么不同？

🙋‍♂️ 我：它实现了描述符协议，会参与属性访问。

🧑‍💻 面试官：如果手动向实例字典写入同名 price，读取时会用哪一个？所有实现 **get** 的对象都一样吗？

> 先看「属性访问会经过谁」：数据描述符、实例字典与非数据描述符有不同优先级。

## 面试速答（60 秒版）

Python 描述符是实现了 **get**、**set** 或 **delete** 等方法的对象。把它放在类属性位置后，它可以参与这个类实例的属性读取、赋值或删除。

property 就是常见的数据描述符。读取属性时可以执行 getter，赋值时可以执行 setter，所以调用方仍然写 product.price，内部却能增加校验。

描述符还分两类：定义 **set** 或 **delete** 的是数据描述符；只有读取等行为的非数据描述符，优先级不同。通常属性访问先看数据描述符，再看实例字典，随后才看非数据描述符等类属性。[Python 描述符指南](https://docs.python.org/3/howto/descriptor.html)。

因此，不能把 property 当作普通实例字段，也不能认为所有 **get** 对象都能挡住同名实例属性。

![描述符：属性访问经过一层规则](https://note.lgdsunday.club/img/Q523/01-descriptor-overview.webp)

## 知识点详解：一次属性读取为什么会执行代码

### 描述符应放在类上，才能参与常规属性访问

假设 Product 类上有一个 price 描述符。访问 product.price 时，Python 的正常属性查找机制发现这个对象，并按协议调用它。

**get** 可以收到正在访问的实例与所属类，所以同一个描述符对象能够根据不同实例返回不同值。通过类访问时，实例参数可能为空，实现者需要考虑这一分支。

如果只是把一个描述符对象放进某个实例的普通字段，不会因此自动获得同样的协议分派。触发行为与它在属性查找中的位置有关。

本文按普通 object 属性访问解释。自定义 **getattribute** 可能改写过程，需要另行检查，不能把简化顺序当作所有代码都不可改变的规则。

### 数据描述符为什么优先？

假设 property 管理 price，实际值保存在 \_price。即使实例字典里出现一个同名 price，数据描述符仍然优先参与正常读取。

这样 setter 才能提供稳定的访问规则，而不是随便加一个同名字段就绕过正常属性入口。

非数据描述符则不同。它没有相同的写入控制，实例字典中的同名属性可以遮蔽它。方法绑定也与描述符有关，但此处重点是这两种查找优先级。

![同名属性先找谁？](https://note.lgdsunday.club/img/Q523/02-lookup-order.webp)

图中讨论的是参与读取、实现了 `__get__` 的描述符。在这个前提下，是否还定义 `__set__` 或 `__delete__`，决定它属于哪一类。图里的类定义只是位置示意，不是完整的可运行代码。

### 用 property 保留使用方式，增加校验

下面是 Python 的真实 property 实现。示例只检查非负值，用来解释访问路径，不是完整的金额类型设计。

#### Python

```python
class Product:
    def __init__(self, price):
        self.price = price

    @property
    def price(self):
        return self._price

    @price.setter
    def price(self, value):
        if value < 0:
            raise ValueError("价格不能为负")
        self._price = value
```

初始化通过 self.price 进入 setter；平时读取进入 getter。setter 写 \_price，避免再次给 price 赋值导致递归调用。

TypeScript 没有 Python 的描述符查找协议。下面用类访问器表达相同的“通过属性访问增加校验”，只是行为对照，不代表实例字典优先级相同。

#### TypeScript（属性访问器对照）

```typescript
class Product {
  private _price = 0;

  constructor(price: number) {
    this.price = price;
  }

  get price() {
    return this._price;
  }

  set price(value: number) {
    if (value < 0) throw new RangeError("价格不能为负");
    this._price = value;
  }
}
```

![price 入口，\_price 保存值](https://note.lgdsunday.club/img/Q523/03-property-route.webp)

### getter 没有 setter，也不等于普通可覆盖字段

只读 property 没有提供自己的 setter，正常赋值会失败。它仍然是数据描述符，不能理解成“没有 setter 的业务函数，所以退化成非数据描述符”。

这里要区分 property 对象的协议实现，与开发者有没有为这项属性配置赋值函数。[property 文档](https://docs.python.org/3/library/functions.html#property)。

另外，property 是属性入口的规则，不是安全权限。调用方仍可能直接修改 \_price；真正的业务安全不能依赖下划线命名。

![只读 property 仍是数据描述符](https://note.lgdsunday.club/img/Q523/04-data-vs-nondata.webp)

## 面试官继续追问

### **get** 为什么要区分类访问和实例访问？

通过 Product.price 访问时没有具体实例，描述符可能返回自身或其他类级信息；通过 product.price 时才读取该实例的数据。

不处理空实例，就可能在类访问和反射时出错。

### property 适合执行很重的网络请求吗？

可以写出这种代码，但普通属性读取通常给调用方较轻的预期。网络耗时、失败和副作用藏在读取后面，会让使用方式不清楚。

需要明确等待与重试时，方法接口通常更容易理解。

### 怎么验证查找顺序？

分别准备数据与非数据描述符，再向实例字典写入同名属性。检查前者仍经过描述符，后者被实例值遮蔽。

还应测试负值赋值、类访问和只读 property，不能只验证 getter 能打印一个值。

## 面试速记卡

> - 描述符：放在类上的协议对象，参与实例属性访问。
> - 数据描述符：定义 **set** 或 **delete**，通常优先于实例字典。
> - 非数据描述符：可以被同名实例属性遮蔽。
> - property：常见数据描述符，让属性访问执行 getter／setter。
> - 实现提醒：实际值用其他字段保存，避免 setter 递归。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **有赞 · Python开发 · 校招（原帖标签）**：怎样用 Python 的 property 创建只读属性？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353156916811603968)；正文记录 9 月 7 日一面；原帖编辑于 2020-09-07。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
