# Python 的 *args 和 **kwargs 有什么区别？函数传参和参数解包怎么理解？

[字节后端面试真题](../companies/bytedance-backend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q548-python-args-kwargs-unpacking/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：\*args 和 \*\*kwargs 有什么区别？

🙋‍♂️ 我：前者收集多余位置参数，后者收集多余关键字参数。

🧑‍💻 面试官：写在函数调用里，它们还是收集吗？

🙋‍♂️ 我：调用里是把已有序列或映射展开成参数。

🧑‍💻 面试官：如果 user 已经按位置传入，解包字典又带 user，函数能自动挑一个吗？

> 星号出现在定义还是调用，动作不同；展开以后仍要遵守正常参数绑定规则。

## 面试速答（60 秒版）

在 Python 函数定义中，`*args` 把多余的位置参数收集成 tuple，`**kwargs` 把多余的关键字参数收集成 dict。args 和 kwargs 是惯用名字，真正决定语义的是星号。

在调用中，`*values` 展开可迭代对象作为位置参数，`**options` 展开映射作为关键字参数。展开以后仍进行普通绑定，所以同一个参数被位置和关键字重复赋值，会报错。

`*` 后面显式声明的参数还可以要求仅按关键字传递。设计包装与转发时，要核对名称、顺序和默认值，不应把未知参数都静默吞掉。

![定义收集，调用展开](https://note.lgdsunday.club/img/Q548/01-overview.webp)

## 知识点详解：同一个星号，怎样从收集变成展开

### 定义时，先绑定显式参数

假设函数先声明 user，再声明 \*parts 和 \*\*meta。调用时，第一个位置参数先绑定 user，多余的位置值才进入 parts。

关键字参数也先匹配显式名称，剩下的才进入 meta。不是把所有参数都原样装进两个容器，再由函数自己猜。

因此，\*args 不一定有内容，\*\*kwargs 也可以为空。两者名字可以换成其他合法名称，规则仍然相同。

![先绑定 user，再收剩余参数](https://note.lgdsunday.club/img/Q548/02-binding.webp)

### 调用时，把容器拆开送进去

假设已有 parts 列表与 options 字典，可以调用 function(user, \*parts, \*\*options)。序列拆成位置值，映射拆成关键字绑定。

如果 options 又包含 user，而前面已经给 user 一个位置值，就发生重复绑定。Python 不会因为后面的字典更新看起来像覆盖，就自动选择后者。

解包的键也要满足关键字调用要求。不能把任意字典都当成任意函数的有效参数合同。

![同一个参数，不能绑定两次](https://note.lgdsunday.club/img/Q548/03-duplicate.webp)

### 显式参数仍然值得保留

下面的 urgent 写在 \*parts 后面，是仅关键字参数。Python 演示完整规则，TypeScript 使用位置 rest 与独立选项对象展示转发；它没有 Python 同一套关键字调用语法。

#### Python

```python
def make_message(user, *parts, urgent=False, **meta):
    return {'user': user, 'parts': parts,
            'urgent': urgent, 'meta': meta}

parts = ['任务', '完成']
options = {'urgent': True, 'source': 'worker'}
print(make_message('alice', *parts, **options))
```

#### TypeScript

```typescript
function makeMessage(
  user: string,
  options: { urgent: boolean; source: string },
  ...parts: string[]
) {
  return { user, options, parts };
}
const parts = ['任务', '完成'];
console.log(makeMessage('alice',
  { urgent: true, source: 'worker' }, ...parts));
```

两种代码都转发多项内容，但参数绑定方式不同。不能把 TS 选项对象叫成真正的 \*\*kwargs。

### 包装函数不能替业务接口猜参数

如果只是记录日志再调用原函数，收集后原样展开可以保留调用能力。但业务接口如果接受任何未知参数，拼错名称也可能迟迟不被发现。

可以对允许的关键字、类型与值做明确检查，或使用更清楚的显式签名。`/` 表达仅位置参数，裸 `*` 表达后面仅关键字参数，也能帮助限定合同。

验证时除了正常调用，还要测试重复名称、缺失必填值和多余参数。依据：[Python 参数规则](https://docs.python.org/3/tutorial/controlflow.html)。

![关键字限定，让调用更清楚](https://note.lgdsunday.club/img/Q548/04-keyword-only.webp)

## 面试官继续追问

### kwargs 里的键会自动覆盖已绑定参数吗？

函数调用中通常会因为重复绑定报错，不能按普通字典合并的直觉理解。

### args 一定叫 args 吗？

不是。名称是惯例，\* 才表示位置参数收集或调用展开。

### 包装函数用了 \*args/\*\*kwargs，就完全保持签名了吗？

调用能力可以转发，但签名展示、元信息和校验需要另看。Python 装饰器常用 wraps 维护部分元信息，并不自动验证所有参数。

## 面试速记卡

> - 定义：\* 收位置参数，\*\* 收关键字参数。
> - 调用：\* 展序列，\*\* 展映射。
> - 先绑定显式参数，再收剩余参数。
> - 重复绑定通常报错，不自动覆盖。
> - 跨语言转发类似，关键字语法并不相同。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **字节跳动 · 后端开发 · 实习**：Python 的可变参数 *args 和 **kwargs 怎样使用？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353156033939972096)；正文记录 2 月 4 日一面；原帖编辑于 2020-02-10。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
