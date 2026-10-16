# Python 的 `__getattr__` 和 `__getattribute__` 有什么区别？为什么容易无限递归？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/python/q589-python-getattr-getattribute/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：**getattr** 和 **getattribute** 都能拦属性，它们有什么区别？

🙋‍♂️ 我：getattribute 负责普通属性读取，getattr 是找不到时的补救。

🧑‍💻 面试官：那我在 getattribute 里写 self.name，为什么就无限递归了？

🙋‍♂️ 我：因为这次 self.name 又进入了同一个钩子。

🧑‍💻 面试官：怎样委托默认访问？如果属性内部抛了 AttributeError，又会不会进入 getattr？

> 沿着一次 obj.name 的调用走下去，先看谁接管读取，再看 AttributeError 是否触发回退。递归问题就藏在钩子自己又读了一次 self 属性的地方。

## 面试速答（60 秒版）

普通 obj.attr 读取会经过 **getattribute**。如果这一步最终抛出 AttributeError，常规属性访问机制还可以调用 **getattr** 作为回退。

所以 **getattr** 更适合提供不存在属性的动态值，不会自然拦住所有已有属性；**getattribute** 的影响范围更大，也更容易破坏原本的访问规则。

重写 getattribute 时，不要直接用 self.attr 读取内部数据，否则可能再次进入自己。普通类可以通过 object.**getattribute**(self, name) 委托默认实现；有继承安排时也要考虑 super 的委托链。

另外，属性存在但 getter 内部抛出 AttributeError，也可能触发 getattr。错误处理必须区分确实没有属性，还是属性计算出了问题。缺失时正确抛 AttributeError，不要用 None 掩盖所有错误。

![先正常查找，失败才回退](https://note.lgdsunday.club/img/Q589/01-overview.webp)

## 知识点详解：一次属性读取，怎样进入钩子和回退

### getattr 只在正常读取失败后接手

假设对象已有 name，但希望读取不存在的 display\_name 时临时生成一个值。**getattr** 可以处理 display\_name，对其他缺失名字抛 AttributeError。

普通 name 的查找仍然照原规则完成，不会为了每次访问先调用 **getattr**。这一点比“getattr 是动态属性”更值得记住，因为它决定了能否统一审计所有读取。

描述符、实例字典和继承查找在已有 Q523 里展开过。本题不重新背一遍完整优先级，只跟踪两个钩子的调用时机。

### 默认读取失败，才走到回退

下面能读到正常 name，也能读到补出来的 display\_name。age 没有定义，应该明确报错。

#### Python

```python
class Profile:
    def __init__(self, name):
        self.name = name

    def __getattr__(self, attr):
        if attr == "display_name":
            name = object.__getattribute__(self, "name")
            return f"用户 {name}"
        raise AttributeError(attr)

profile = Profile("小李")
print(profile.name)          # 小李
print(profile.display_name)  # 用户 小李
print(hasattr(profile, "age"))  # False

class LoggedProfile(Profile):
    def __getattribute__(self, attr):
        return object.__getattribute__(self, attr)

print(LoggedProfile("小王").display_name)
```

LoggedProfile 的委托让默认访问继续工作。缺失 display\_name 时，普通点号读取机制会再进入继承来的 **getattr**。如果直接调用 profile.**getattribute**(某名字)，并不是完全等同于外层点号访问的所有回退安排。

### 为什么 self.name 会把自己再叫回来？

假设 getattribute 接到 name，又为了记录日志读取 self.name。这次读取仍属于普通属性读取，所以它再次调用 getattribute；如果路径没有结束条件，就会一直重复，最终抛 RecursionError。

内部状态应通过明确委托拿到，日志也尽量不要再格式化整个 self。格式化对象可能触发别的属性读取，反而让一份看似无害的日志引出重入。

不存在的名字不要统一返回 None。hasattr 等工具依赖 AttributeError 判断缺失，返回 None 会让它们以为属性存在，也可能把拼错字段名变成静默错误。

![钩子里的 self.name 又进入同一个钩子](https://note.lgdsunday.club/img/Q589/02-recursion.webp)

### 动态代理也要保留错误含义

一个 property 内部可能因代码错误抛 AttributeError，这时外层读取也可能进入 **getattr**。如果回退恰好返回某个默认值，真正的 getter 问题就被遮住了。

动态访问因此应该限定自己负责的名字，对其他名字保留合理异常；不要包一个宽泛 except 后全部“兜底”。特殊方法调用还可能绕过普通实例读取路径，例如 len 的隐式协议查找，不能靠 getattribute 拦住一切语言操作。

#### TypeScript（JS Proxy 显式委托对照）

```typescript
const target = { name: "小李" };
const profile = new Proxy(target, {
  get(object, key, receiver) {
    if (key === "displayName") return `用户 ${object.name}`;
    return Reflect.get(object, key, receiver);
  }
});
console.log(profile.name);
```

JS Proxy 的 get trap 和 Python 钩子不是同一套协议，缺失属性默认值也不同。这里只对照“拦截后仍应委托默认访问”，不机械对应异常回退。

依据：[Python 3.11 属性访问钩子](https://docs.python.org/3.11/reference/datamodel.html#customizing-attribute-access)、[Python getattr 与 hasattr](https://docs.python.org/3.11/library/functions.html#getattr)、[ECMAScript Proxy get](https://tc39.es/ecma262/#sec-proxy-object-internal-methods-and-internal-slots-get-p-receiver)。

![属性内部出错，也可能被回退遮住](https://note.lgdsunday.club/img/Q589/03-fallback-v2-v3.webp)

## 面试官继续追问

### getattr(obj, name) 只调用 **getattr** 吗？

它做的是属性读取，先走正常查找；失败后才可能进入回退钩子。函数名和钩子名相近，不等于只跑同名钩子。

### getattribute 能统一拦 len(obj) 吗？

不能这样保证。隐式特殊方法查找有自己的规则，通常从类型查找，可能绕过实例钩子。

### 何时只用 getattr 更合适？

仅补少量动态缺失属性时。已有属性仍保持默认规则，影响范围更小，也更易解释缺失异常。

## 面试速记卡

> - 普通点号读取先经过 **getattribute**。
> - 最终 AttributeError 可以触发 **getattr** 回退。
> - 钩子里再次 self.attr，可能重入自己。
> - 明确委托默认实现，保留缺失异常语义。
> - 特殊方法隐式调用不保证经过实例属性钩子。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
