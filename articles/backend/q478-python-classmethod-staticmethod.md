# Python 实例方法、类方法和静态方法有什么区别？classmethod 和 staticmethod 怎么选？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q478-python-classmethod-staticmethod/) · [题库目录](../../README.md)

*以下对话为教学模拟，不是真实面经。*

🧑‍💻 面试官：Python 实例方法、类方法和静态方法有什么区别？

🙋‍♂️ 我：实例方法用 self，类方法用 cls，静态方法都不用。

🧑‍💻 面试官：子类调用继承的 classmethod，cls 是父类还是子类？如果一个工具函数不需要对象状态，为什么一定要放进类？

> 区别在调用时自动绑定谁，以及方法真正需要使用谁的状态。

## 面试速答（60 秒版）

实例方法通过实例调用时，会自动绑定这个实例，所以可以访问实例状态。classmethod 自动绑定类，通常通过 cls 访问类相关信息，继承调用时也能获得实际调用的类。

staticmethod 不自动绑定实例或类，只是把一个普通函数放在类的命名空间里。

实际选择时，处理某个对象的数据用实例方法；需要根据实际类创建对象或实现类级行为，可以考虑 classmethod；与类概念相关但不需要绑定状态的工具，可以用 staticmethod。

如果只是独立工具函数，放在模块里也完全合理。不是看到没有 self，就必须加 staticmethod。

![速答总览：三种方法按自动绑定的对象区分，选择取决于实例状态、实际类或独立参数需求。](https://note.lgdsunday.club/img/Q478/01-overview-v2.webp)

## 知识点详解：同一个函数入口，怎样得到不同的第一个参数

### 实例方法，知道当前处理的是哪个对象

咱们假设每个订单对象保存自己的金额。计算这个订单的折扣，需要访问当前对象的数据，所以适合实例方法。

通过实例访问方法时，Python 会按描述符绑定规则，把实例作为相应参数传入。self 是约定名称，不是因为变量叫 self 才自动发生绑定。

[Python 数据模型](https://docs.python.org/3/reference/datamodel.html)说明了方法和描述符行为。这里先关注调用结果，不需要把整个描述符协议展开成另一道题。

### classmethod，知道实际调用的是哪个类

类方法常用于替代构造入口。比如从文本创建一个对象，使用 cls(...)，能够让子类调用时创建相应子类，而不是把父类名称写死。

#### Python

```python
class Order:
    def __init__(self, amount):
        self.amount = amount

    def discounted(self, ratio):
        return self.amount * ratio

    @classmethod
    def from_text(cls, text):
        return cls(int(text))

    @staticmethod
    def valid_amount(value):
        return value >= 0

class SpecialOrder(Order):
    pass

order = SpecialOrder.from_text("100")
print(type(order).__name__)  # SpecialOrder
print(order.discounted(0.8))  # 80.0
```

这里的继承能力来自实际绑定的 cls。如果 from\_text 中写死 Order(...)，子类调用也会得到 Order，就失去了这个目的。

[官方 classmethod 文档](https://docs.python.org/3/builtins/functions.html#classmethod)说明了类参数及继承调用行为。

### staticmethod，主要提供名称上的归属

valid\_amount 不需要某个订单对象，也不需要实际类，只检查输入值。因此，它可以成为静态方法。

但如果这个校验在很多不相关模块使用，独立模块函数可能更清楚。静态方法的价值通常是表达“这个功能与这个类的概念有关”，而不是提供特殊执行能力。

[staticmethod 文档](https://docs.python.org/3/builtins/functions.html#staticmethod)明确说明它不接收隐式的第一个参数。也不要因为没有实例参数，就认为它不能访问任何外部状态；函数仍可能读取全局变量，只是那样做需要额外考虑依赖。

### TypeScript 的 static，不等于 Python 的 classmethod

TypeScript 有静态方法，但没有 Python 同名装饰器和完全一样的绑定规则。可以通过类上的 this 配合构造入口实现某些类似行为，不过类型约束需要自己处理。

#### TypeScript：区分实例行为与类命名空间

```typescript
class Order {
  constructor(public amount: number) {}
  discounted(ratio: number) {
    return this.amount * ratio;
  }
  static validAmount(value: number) {
    return value >= 0;
  }
}
console.log(new Order(100).discounted(0.8)); // 80
console.log(Order.validAmount(100)); // true
```

这个例子对应实例与静态用途，不伪造一个 Python classmethod 的官方 TS 翻译。

选择方法类型时，可以先问三个问题：需要当前对象吗？需要实际类吗？还是只需要输入参数？答案清楚以后，装饰器就不难选了。

## 面试官继续追问

### classmethod 可以通过实例调用吗？

可以，绑定的仍然是类，而不是把实例当成 cls。是否这样调用方便阅读，是另外一个问题。

### self 和 cls 可以改名吗？

技术上可以，但不建议。它们是广泛使用的约定，改名不会改变绑定机制，却会增加理解成本。

### 静态方法一定更快吗？

不要把方法分类作为性能优化口诀。应按语义选择；真正的性能差异需要在具体工作量下测量。

## 面试速记卡

> - 实例方法：绑定实例，适合处理对象状态。
> - 类方法：绑定实际类，适合可继承的类级入口。
> - 静态方法：不自动绑定实例或类。
> - 选择顺序：需要对象、需要类，还是只需要参数。
> - 模块函数：独立工具不必强行放进类。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
