# TypeScript 的协变和逆变是什么？为什么函数参数类型不能随便替换？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q394-typescript-variance/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：Dog 是 Animal 的子类型，那么接收 Dog 的函数，能替换接收 Animal 的函数吗？

🙋‍♂️ 我：Dog 能赋值给 Animal，函数应该也能这样替换吧。

🧑‍💻 面试官：调用方传进来的是一只猫，你的函数却调用了 `bark()`，怎么办？

🙋‍♂️ 我：那参数的方向好像反过来了。

🧑‍💻 面试官：如果换成函数返回值呢？还有，为什么有些方法写法又能通过检查？

> 看替换是否安全，要站在调用方这边：传进来的值，替换后的函数接得住吗？返回的值，还满足原来的要求吗？

## 面试速答（60 秒版）

协变和逆变，说的是类型之间的父子关系，在另一个类型结构里会沿着什么方向传递。

对于函数，返回值通常按协变检查。调用方需要 Animal，函数返回更具体的 Dog 没问题，因为 Dog 满足 Animal 的要求。

参数则要反过来看。调用方可能传入任意 Animal，所以不能换成一个只接收 Dog 的函数；但一个能接收所有 Animal 的函数，可以用在只会传入 Dog 的地方。这就是参数逆变。

TypeScript 开启 `strictFunctionTypes` 后，普通函数类型的参数会按这种规则检查。不过方法声明存在双变兼容的例外，所以不能看到某段代码通过编译，就认为所有函数替换都是安全的。

![函数参数与返回值的安全替换方向](https://note.lgdsunday.club/img/Q394/01-variance-overview.webp)

## 知识点详解：把函数放到调用方的位置来看

### 先把父子关系说清楚

假设 Animal 只有名字，Dog 在此基础上还会叫。那么每只 Dog 都能当成 Animal 使用，反过来却不成立。

这不是名字相似，而是结构满足要求。TypeScript 主要按结构判断兼容性；“有名字”不能保证“有 bark 方法”。

### 返回值为什么是协变？

假设页面需要一个“返回 Animal 的函数”，拿到结果后只读取名字。如果实际函数返回 Dog，多出来的 bark 不影响页面使用。

但页面需要 Dog 时，返回 Animal 就不够了。页面可能调用 bark，而返回对象未必有这个方法。

因此，返回值允许用更具体的类型替换。Dog 可以替换 Animal，返回 Dog 的函数也可以替换返回 Animal 的函数，方向相同。

### 参数为什么是逆变？

函数参数不是函数交出来的东西，而是调用方交给函数的东西。

假设某个接口承诺：“你可以传任意 Animal。”替换进去的函数必须遵守这份承诺。一个只接受 Dog 的函数缩小了接收范围，调用方传入别的 Animal 时就会出问题。

反过来，如果调用方只会传 Dog，一个接受所有 Animal 的函数当然也能处理它。参数接收范围可以扩大，不能偷偷缩小。

下面的代码用于静态类型检查；错误行是刻意保留的反例。

**TypeScript（开启 strictFunctionTypes）：**

```typescript
type Animal = { name: string };
type Dog = Animal & { bark(): void };

type AnimalHandler = (value: Animal) => void;
type DogHandler = (value: Dog) => void;

const handleAnimal: AnimalHandler = value => {
  console.log(value.name);
};
const handleDog: DogHandler = value => {
  value.bark();
};

const safe: DogHandler = handleAnimal;
// @ts-expect-error: 调用方可能传入没有 bark 的 Animal
const unsafe: AnimalHandler = handleDog;
```

**Python（同一替换关系，用 Callable 表达）：**

```python
from dataclasses import dataclass
from typing import Callable

@dataclass
class Animal:
    name: str

@dataclass
class Dog(Animal):
    def bark(self) -> None:
        print("汪")

def handle_animal(value: Animal) -> None:
    print(value.name)

def handle_dog(value: Dog) -> None:
    value.bark()

safe: Callable[[Dog], None] = handle_animal
# 静态类型检查应报错；Python 本身不会拦截这个赋值。
unsafe: Callable[[Animal], None] = handle_dog
```

Python 的类型注解不会自动变成运行时参数校验。这里比较的是可调用对象的类型兼容规则，不是在说两种语言的编译行为完全一样。

### 为什么有些 TypeScript 方法能通过？

`strictFunctionTypes` 主要收紧的是函数类型的参数检查。形如 `handle(value: Animal): void` 的方法声明保留了双变兼容规则，和 `handle: (value: Animal) => void` 这种函数属性不完全一样。

这是 TypeScript 为兼容既有类型结构保留的取舍，不是参数逆变失效了。双变允许某些两个方向的替换，也就可能放过前面那种不安全情况。

设计公共回调接口时，不能只问“编译器让不让写”，还要检查调用方到底可能传什么。类型断言和 `any` 同样可以绕过检查，却不会替我们补上缺失的 bark。

## 面试官继续追问

### 协变、逆变和继承是一回事吗？

不是。继承或结构兼容先建立 Dog 与 Animal 的关系；变型讨论的是，这种关系放到函数、容器等类型结构里以后怎样传递。

### 泛型都是协变的吗？

不能统一回答。类型参数出现在返回位置、接收位置还是同时参与读写，影响都不同。可变容器还涉及读写约束，TypeScript 的实际兼容规则也存在历史取舍，不能拿函数返回值的规则直接套过去。

### 怎么验证自己没有记反？

画出调用方会传入的值，以及它打算怎样使用返回值。参数问“接不接得住”，返回值问“够不够用”，比背箭头更稳。

## 面试速记卡

> - 协变：父子关系在类型结构中保持原方向。
> - 函数返回值：可以返回更具体、满足要求的类型。
> - 函数参数：替换后必须接得住调用方可能传入的值。
> - strictFunctionTypes：普通函数参数严格检查，方法声明存在双变例外。
> - 判断安全性：通过类型检查，不等于绕过检查的写法也安全。

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
