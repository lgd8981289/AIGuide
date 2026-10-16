# Python 的 `__slots__` 有什么作用？为什么用了以后不能随便新增属性？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/python/q587-python-slots-instance-storage/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：**slots** 有什么作用？

🙋‍♂️ 我：它可以限制实例属性，减少一些存储开销。

🧑‍💻 面试官：子类没有声明 slots，为什么又能随便加属性？

🙋‍♂️ 我：因为子类可能重新有了实例字典。

🧑‍💻 面试官：那定义 slots 就保证省一半内存、能配合 cached\_property 吗？

> slots 先改变实例属性的存储安排。能否新增属性、能否弱引用、能省多少空间，都要结合继承和实际实例结构再判断。

## 面试速答（60 秒版）

**slots** 可以为实例声明固定的属性槽。没有实例 **dict** 时，实例通常不能随意增加未声明属性，也可能减少大量同结构对象的存储开销。

但 slots 不会自动禁止字段值变化，也不会冻结字段里的对象。它限制的主要是属性存储形态。

继承时还要看整个类层次。父类已经提供 **dict**，子类声明 slots 也不会把它拿掉；子类不声明 slots，又可能获得自己的字典。

需要弱引用时通常要安排 **weakref**，需要依靠实例字典的工具时则要保留 **dict** 或换设计。cached\_property 就不能直接用于只有普通槽、没有可写字典的实例。

所以我会先确认对象数量和动态属性需求，再用实际测量决定是否值得，不给 slots 一个固定节省比例。

![固定存储位置，字段值仍可改变](https://note.lgdsunday.club/img/Q587/01-overview.webp)

## 知识点详解：固定属性槽，改变的是实例存储

### 先看普通实例把属性放在哪里

假设程序中有大量二维坐标对象，每个对象都只有 x 和 y。普通自定义类的实例通常可以用自己的 **dict** 记录属性，因此随后增加 label 也很方便。

这种灵活性有存储成本。slots 允许类提前声明字段位置，让实例使用对应的槽保存引用。在没有实例字典的情况下，任意新名字没有位置可放，赋值就会失败。

这是一种对象存储设计。x 从 1 改成 2 仍然可以，x 指向的可变对象也不因此冻结。不要把 slots 和 frozen、只读属性当成同一开关。

### 固定字段，仍然可以修改字段值

下面的 Point 能修改 x，但新增 label 不行。

#### Python

```python
class Point:
    __slots__ = ("x", "y")
    def __init__(self, x, y):
        self.x, self.y = x, y

point = Point(1, 2)
point.x = 3
print(point.x)             # 3
print(hasattr(point, "__dict__"))  # False
try:
    point.label = "起点"
except AttributeError:
    print("没有 label 的存储位置")

class FlexiblePoint(Point):
    pass

child = FlexiblePoint(1, 2)
child.label = "允许新增"
print(child.__dict__)
```

这里子类没有自己的 slots 定义，因此重新获得了实例字典。父类的固定槽仍在，但子类可以另存动态属性。若子类不需要新增存储，可以声明 **slots** = ()；需要新槽则只列新增字段，不重复父类已有槽。

![子类又有字典，就能保存新属性](https://note.lgdsunday.club/img/Q587/02-inheritance-v5.webp)

### 继承和工具兼容性要一起检查

反过来也一样，父类已有实例字典，子类写 slots 不能把父类提供的字典删除。所以不能只看最末级类的两行定义就认定实例完全没有 **dict**。

弱引用需要相应支持，普通纯 slots 类可能需要把 **weakref** 放入声明。标准库 dataclass 的 slots=True 也有自己的生成与继承行为，选择之前应该核对版本。

cached\_property 将结果写进实例字典，纯槽对象没有对应字典时不能按这个机制工作。可以使用显式缓存槽，也可以保留 **dict**，但保留以后就要重新衡量原先的节省目标。

![缓存属性需要能放下计算结果](https://note.lgdsunday.club/img/Q587/03-compatibility.webp)

### TypeScript 的字段声明并不是 slots

TS 声明了 x 和 y，不代表 JS 运行时只能保存这两个属性。类型检查器约束和对象存储布局是不同层面的事情。

下面用 Object.seal 展示“限制新增属性但允许改现有属性”的运行时行为。它不是 Python 槽的内存布局对应物，只是帮助区分限制种类。

#### TypeScript

```typescript
const point: { x: number; y: number } = { x: 1, y: 2 };
Object.seal(point);
point.x = 3;
console.log(point.x); // 3
console.log(Reflect.set(point, "label", "起点")); // false
```

工程上可以用同样的数据量比较总内存，并把成员对象的占用一起考虑。sys.getsizeof 单个实例通常不能代表整张对象图。若只有少量对象，或者库依赖动态属性，先保持易用性往往更合理。

依据：[Python 3.11 **slots** 数据模型](https://docs.python.org/3.11/reference/datamodel.html#slots)、[dataclass slots 说明](https://docs.python.org/3.11/library/dataclasses.html)、[functools.cached\_property](https://docs.python.org/3.11/library/functools.html#functools.cached_property)、[ECMAScript Object.seal](https://tc39.es/ecma262/#sec-object.seal)。

## 面试官继续追问

### slots 会让 x 变成只读吗？

不会。现有槽可以重新赋值；只读需要其他约束，内部对象的可变性还要另看。

### 子类写空 slots 有什么意义？

它表示这一层不新增槽，也避免普通情况下给子类新增字典。父类是否已有字典仍要检查。

### 能拿单实例 getsizeof 算完整节省吗？

不能只据这一项下结论。它不包含所有被引用成员和其他间接开销，需要明确测量范围。

## 面试速记卡

> - slots 为实例声明固定属性存储。
> - 没有 **dict** 时，未声明属性通常不能新增。
> - 固定槽不等于只读或深度冻结。
> - 父类字典、子类声明会影响最终行为。
> - 弱引用和依赖实例字典的工具需要兼容检查。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
