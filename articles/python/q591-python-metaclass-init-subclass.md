# Python 的 metaclass 是什么？和 `__init_subclass__` 各适合做什么？

[字节后端面试真题](../companies/bytedance-backend.md) · [网易后端面试真题](../companies/netease-backend.md) · [字节开发面试真题](../companies/bytedance-development.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/python/q591-python-metaclass-init-subclass/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：metaclass 是什么？

🙋‍♂️ 我：它是创建类的类，可以控制类的创建。

🧑‍💻 面试官：那它和 **new** 创建实例，是同一件事吗？

🙋‍♂️ 我：不是，一个是在建立类对象，一个是在建立实例。

🧑‍💻 面试官：只是想把每个插件子类登记起来，还需要写元类吗？

> 先把创建类与创建实例画在两个时间点。再问需求究竟需要改类的构造过程，还是只想在子类出现时做一次检查或登记。

## 面试速答（60 秒版）

Python 的类本身也是对象。metaclass 参与创建这个类对象，默认通常是 type。它可以影响类命名空间准备、类对象创建和初始化等过程。

**init\_subclass** 则是父类提供给新子类的钩子。子类定义完成相应创建阶段时，父类可以据此登记插件、检查约定或处理类声明参数。

如果只是要求子类提供某个名称，或者把新子类加入注册表，通常先考虑 **init\_subclass**。需要深度改变类创建流程，才进一步考虑 metaclass。

两者都发生在类定义相关阶段，别和实例的 **init** 混淆。多继承还可能引出元类冲突和钩子的合作调用问题，因此选型不能只看哪种写法更“高级”。

![先创建类，再创建实例](https://note.lgdsunday.club/img/Q591/01-overview-v2.webp)

## 知识点详解：创建类对象和登记子类，需求大小不同

### 类定义执行后，也要产生一个对象

假设代码执行 class SearchPlugin: ...。类体里的定义先组织成命名空间，再由元类参与创建 SearchPlugin 这个类对象。之后调用 SearchPlugin()，才进入创建具体插件实例的过程。

默认 type 能创建普通类。自定义元类通常继承 type，必要时重写相关阶段。类创建过程还涉及 **prepare**、**new**、**init** 等，不要把它缩成“所有元类都只是给方法加装饰器”。

但是，大多数业务需求并不需要接管这些阶段。先解释为什么普通父类钩子不够，元类才有选用依据。

### 登记插件，可以先用子类钩子

下面假设每个插件类都有唯一 key。定义子类时完成登记，不必为了这个目的创建元类。

#### Python

```python
class Plugin:
    registry = {}

    def __init_subclass__(cls, *, key, **kwargs):
        super().__init_subclass__(**kwargs)
        if key in Plugin.registry:
            raise ValueError("插件 key 重复")
        Plugin.registry[key] = cls

class SearchPlugin(Plugin, key="search"):
    pass

print(Plugin.registry["search"] is SearchPlugin)  # True
```

这时注册表保存的是类，不是已经构造好的插件实例。什么时候创建实例、是否注入客户端、如何关闭资源，仍要另行安排。

super 的合作调用也有意义。多个父类各自处理声明参数时，自己的参数先消费，剩余参数传下去，避免某个钩子截断后续父类处理。最终未被支持的参数应当暴露错误。

![子类定义时，登记的是类](https://note.lgdsunday.club/img/Q591/02-registration-v2.webp)

### 什么时候才值得引入元类？

如果框架需要定制类命名空间、统一改变类创建结果，或者对整个类创建协议有要求，元类更贴近那个层级。例如 **prepare** 可以参与提供类体执行所用的映射。

仅在类创建后验证一个字段，或登记一个子类，往往没必要抢更大的控制范围。类装饰器也是一个选择，它在类创建后处理类对象，但对子类自动继承钩子的方式不同。

元类不是性能优化按钮。还可能让多继承组合更难，因为新类需要兼容父类的元类要求，不能随意挑两个互不兼容的创建者。

![按需要的控制范围选择工具](https://note.lgdsunday.club/img/Q591/03-choice.webp)

### 显式注册也有自己的好处

#### TypeScript（显式插件登记对照）

```typescript
type PluginConstructor = new () => object;
const registry = new Map<string, PluginConstructor>();
function register(key: string, ctor: PluginConstructor): void {
  if (registry.has(key)) throw new Error("插件 key 重复");
  registry.set(key, ctor);
}
class SearchPlugin {}
register("search", SearchPlugin);
console.log(registry.get("search") === SearchPlugin);
```

TS 没有 Python 同款元类和 **init\_subclass** 协议，这里用显式注册表达相同业务需求。显式注册能让模块加载顺序和登记动作更容易看见，也不一定比隐式钩子差。

对于自动注册，还要检查插件模块是否真的被导入。类定义没有执行，登记钩子自然不会凭空发现它。测试时准备重复 key、遗漏参数和多继承的子类，确认失败发生在预期时刻。

依据：[Python 3.11 定制类创建](https://docs.python.org/3.11/reference/datamodel.html#customizing-class-creation)、[PEP 487 简化类创建定制](https://peps.python.org/pep-0487/)。

## 面试官继续追问

### 元类 **call** 和类创建有什么关系？

类是元类的实例，调用类可能经过元类的调用行为，并组织实例创建。但这要和元类创建类对象的 **new** 阶段分开。

### 自动注册为什么找不到插件？

先查对应模块是否导入、类定义是否执行、是否满足 key 条件。注册钩子不负责自动扫描所有文件。

### 类装饰器与子类钩子怎么选？

只修饰当前一个类时装饰器直接；希望父类对后续子类都执行约定时，可以用子类钩子。需要改变类构造协议再看元类。

## 面试速记卡

> - 类也是对象，默认元类通常为 type。
> - 元类参与类创建，实例创建是另一阶段。
> - 子类登记和简单约束先考虑 **init\_subclass**。
> - 多继承钩子应合作调用并处理剩余参数。
> - 自动注册仍依赖类定义实际执行。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **字节跳动 · Python后端 · 社招**：Python 的 metaclass 是什么？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353156424916213760)；原帖编辑于 2020-05-11；标题中的 2019 届是毕业届次。
- **网易 · 游戏服务端（天下、在线事业部） · 社招**：Python 的 metaclass 是什么？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353156544126722048)；原帖编辑于 2020-06-25；仅取网易服务端段落。
- **字节跳动 · 开发（基础架构；原帖未明确细分岗位） · 暑期实习**：是否了解 Python 的元类型？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353154849422385152)；原帖编辑于 2019-03-04。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
