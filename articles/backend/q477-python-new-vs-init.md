# Python 的 __new__ 和 __init__ 有什么区别？对象创建时先执行哪个？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q477-python-new-vs-init/) · [题库目录](../../README.md)

*以下对话为教学模拟，不是真实面经。*

🧑‍💻 面试官：Python 的 **new** 和 **init** 有什么区别？

🙋‍♂️ 我：它们都是构造方法，一个先执行，一个后执行。

🧑‍💻 面试官：如果 **new** 返回的不是当前类实例，**init** 还会按你说的执行吗？

> 先创建对象，再初始化对象。顺序背对了，还要把返回值条件说清楚。

## 面试速答（60 秒版）

**new** 负责创建并返回对象，**init** 负责初始化已经创建的对象。正常实例化过程中，先调用 **new**，得到当前类的实例以后，再调用相应的 **init**。

因此，**init** 不是“创建对象”的地方，也不应该返回一个新对象；它需要返回 None。

大多数普通类只需定义 **init**。继承不可变类型、控制实例创建等场景，才可能需要定制 **new**。

还有一个重要边界：如果 **new** 返回的不是当前类的实例，就不会继续按普通流程调用这个类的初始化。因此，我会把对象创建、返回值判断和属性初始化分开解释，而不是只背先后顺序。

![速答总览：new 创建对象，init 初始化对象；返回对象类型决定是否继续普通初始化。](https://note.lgdsunday.club/img/Q477/01-overview-v2.webp)

## 知识点详解：调用一个类时，对象经历了什么

### **init** 执行以前，对象已经存在

咱们假设有一个 Order 类，创建时需要保存订单号。常见写法是在 **init** 里给 self.order\_id 赋值。

这个 self 必须已经是一个对象。对象通常由 **new** 创建，所以它不是在 **init** 里才凭空出现。

[Python 数据模型文档](https://docs.python.org/3/reference/datamodel.html#object.__new__)分别定义了这两个方法。类的实例化还涉及元类调用机制，但理解普通类时，可以先抓住“创建 → 检查返回对象 → 初始化”这条主线。

#### Python：观察普通流程

```python
class Order:
    def __new__(cls, order_id):
        print("create")
        return super().__new__(cls)

    def __init__(self, order_id):
        print("initialize")
        self.order_id = order_id

order = Order("A001")
print(order.order_id)
```

预期依次输出 create、initialize 和 A001。这个示例只用于观察机制，普通 Order 并不需要自己重写 **new**。

### 两个方法接收到的对象不同

**new** 的第一个参数通常是 cls，表示需要创建实例的类；它必须返回一个对象。**init** 的第一个参数是 self，表示要初始化的实例。

**init** 需要返回 None。试图在里面 return 一个业务对象，并不能改变普通构造流程返回的实例，反而会产生不符合协议的错误。

这里也不能把 **new** 直接称为“任何情况下只调用一次的方法”。实例创建可以被定制，甚至返回既有对象。重复调用类时，初始化是否重复执行，还要看返回对象和实际流程。

### 返回值改变，后续流程也会改变

如果 **new** 返回一个不属于当前类的对象，就不会正常继续调用当前类的 **init**。

如果它返回当前类的实例，包括返回既有实例，仍可能再次进行初始化。因此，写所谓单例时只缓存 **new** 的对象，还不足以证明初始化只发生一次。

单例还涉及线程安全、参数变化和测试隔离，这些不是“重写 **new**”一句话就能解决的。这里先解释协议，不把教学例子包装成可直接用于生产的单例方案。

![返回旧实例仍可能再次初始化](https://note.lgdsunday.club/img/Q477/02-cached-instance-init.webp)

### 不可变类型，值通常在创建时确定

继承 str、tuple 等不可变类型时，想改变实例的底层值，通常需要在 **new** 中完成，因为 **init** 发生时值已经创建。

普通可变业务对象一般只需要在 **init** 中设置属性。能够重写 **new**，不意味着每个类都应该这么做。

TypeScript 没有 Python **new** / **init** 的同一套协议。下面只展示 JavaScript 类构造函数的一般用法，不能按方法名称逐个对应。

#### TypeScript：普通构造函数

```typescript
class Order {
  constructor(public orderId: string) {}
}
const order = new Order("A001");
console.log(order.orderId);
```

比较语言时，可以说明两边都有实例创建与初始化行为，但不要把 Python 的具体返回值规则直接套到 TypeScript。

## 面试官继续追问

### **init** 可以省略吗？

可以。如果不需要自定义初始化，沿用已有行为即可。不是每个 Python 类都必须声明它。

### 直接调用 **init** 等于重新创建对象吗？

不是。它是在现有对象上执行初始化逻辑，不会自动走一遍普通实例创建流程。

### **new** 返回旧实例有什么风险？

初始化可能重复，参数可能覆盖旧状态。还要考虑并发与测试隔离，不能只看对象身份相同。

## 面试速记卡

> - **new**：创建并返回对象，接收 cls。
> - **init**：初始化既有对象，接收 self，返回 None。
> - 条件边界：返回当前类实例，才走通常的初始化流程。
> - 不可变类型：底层值通常在创建阶段确定。
> - 普通业务类：通常只需定义 **init**。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
