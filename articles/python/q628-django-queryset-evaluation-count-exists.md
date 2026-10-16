# Django QuerySet 什么时候执行 SQL？count、len 和 exists 有什么区别？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/python/q628-django-queryset-evaluation-count-exists/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：QuerySet 为什么说是惰性的？

🙋‍♂️ 我：filter 等常常先构造查询，真正读取结果时才执行。

🧑‍💻 面试官：我先 exists，再遍历同一个 QuerySet，只会发一次 SQL 吗？

🙋‍♂️ 我：未求值时 exists 通常单独查询，不会填满遍历需要的结果缓存。

🧑‍💻 面试官：那 count、len、bool 分别会拿什么数据？已经求值之后，又有哪些变化？

> 先决定需要“是否存在”“有多少条”还是“完整记录”，再看这个 QuerySet 有没有结果缓存。

## 面试速答（60 秒版）

Django QuerySet 通常先构造查询，迭代、list、len、bool 等操作会触发求值。普通求值把结果保存在这个 QuerySet 的缓存里，再次使用可能不重新查询。

未求值时，count 通常让数据库统计数量，exists 做存在性检查；len 则需要取回结果才能计算长度。因此只要数量或存在判断时，不必先加载完整记录。

不过如果随后一定要遍历，同一个未求值 QuerySet 先做 exists，可能多发一次查询。已有完整结果缓存时，count 和 exists 又可能直接使用缓存。

缓存属于具体 QuerySet，不是所有同条件查询共享的全局缓存。克隆查询、iterator、数据新鲜度也有不同边界，排查应该结合实际 SQL 次数，而不是只数 Python 代码行。

![要数量、存在，还是完整记录？](https://note.lgdsunday.club/img/Q628/01-overview-v2.webp)

## 知识点详解：查数量、查存在、取记录，不是同一份工作

### 写出查询，还不代表结果已经在内存里

假设我们只需要展示有效商品。Item.objects.filter(active=True) 通常先保存查询条件；继续 order\_by 也是构造查询，不马上取完整记录。

开始普通迭代或调用 list 时，Django 执行并获取结果。len 和 bool 也会触发普通求值，不能把 bool(qs) 当成只查一个存在标志。

还存在切片、repr、序列化等其他求值入口，具体行为按 QuerySet 文档确认。因此调试输出也可能改变你以为尚未执行的状态。

### 三个接口，按需要的数据选择

未求值的 qs 调用 count，通常发 COUNT 查询，结果是一个数量。exists 通常使用存在性查询，返回布尔值。len(qs) 则取回完整结果并计算长度，普通结果缓存也随之建立。

只要数量，就用 count；只问有没有，就考虑 exists。如果紧接着必须读取所有对象，也可以直接求值一次，再使用已得到的结果判断与遍历。

这里的“通常”有条件。QuerySet 已经完整求值时，count 与 exists 可以用现有缓存，不能说它们每调用一次一定再发 SQL。

### 同一个 QuerySet，普通结果会被复用

下面是 Django 项目中可运行的片段，假设 Item 已存在、迁移完成，并且有 active 字段。不要在未配置 Django 的独立 Python 文件里直接执行。

#### Python

```python
from django.db import connection
from django.test.utils import CaptureQueriesContext
# Item 从当前项目的 models 导入
qs = Item.objects.filter(active=True)
with CaptureQueriesContext(connection) as captured:
    rows = list(qs)
    assert qs.count() == len(rows)
    assert qs.exists() == bool(rows)
    assert list(qs) == rows
assert len(captured) == 1
```

这个简单模型查询没有关联预取和 deferred 字段读取，普通 list(qs) 执行一次，后续接口使用已有结果。批次测试使用最小模型实际验证，不把这一个次数承诺扩大到带额外查询的任意代码。

这是 Django 的 Python ORM 行为。TS 侧不同 ORM 的缓存合同并不相同，不提供虚构的 TS QuerySet。

![同一个 QuerySet，重复遍历可用缓存](https://note.lgdsunday.club/img/Q628/02-cache-v3.webp)

### 缓存归谁，决定了何时会重新读取

同一个 qs 的普通遍历可能复用缓存；重新调用 Item.objects.filter(...) 得到的另一个 QuerySet，没有自动共享前者结果。all 等克隆也不能简单当成复制已取出的缓存。

iterator 适合特定的流式读取需求，不使用普通 QuerySet 结果缓存；如果之前已经求值，再调用它可能重新执行查询。省内存的选择要结合数据库驱动与读取方式，不能承诺总内存固定。

缓存结果也不代表数据库永远没有变化。需要新鲜结果时明确重新查询，并用 CaptureQueriesContext 或数据库观测确认次数，生产环境注意观测开销与敏感 SQL。

依据：[QuerySet 求值、count、exists 与 iterator](https://docs.djangoproject.com/en/5.2/ref/models/querysets/)、[QuerySet 缓存](https://docs.djangoproject.com/en/5.2/topics/db/queries/#caching-and-querysets)、[Django 数据库优化](https://docs.djangoproject.com/en/5.2/topics/db/optimization/)。

![先查存在，再遍历，可能查询两次](https://note.lgdsunday.club/img/Q628/03-double.webp)

## 面试官继续追问

### exists 后遍历，为什么可能发两次？

存在性结果通常没有填满记录缓存，遍历还需要读取完整记录。

### len 与 count 永远谁更快？

只要数量且未求值时 count 避免搬完整记录；已有缓存或还要遍历时需要按实际任务看。

### 两个相同 filter 共享结果吗？

具体 QuerySet 结果缓存不是全局查询缓存，不能按同条件自动共享。

## 面试速记卡

> - 构造查询与读取结果分开。
> - 未求值时 count 查数量，exists 查存在。
> - len、bool、普通迭代会获取结果。
> - 完整缓存可能被同一个 QuerySet 复用。
> - 新查询、克隆、iterator 与数据新鲜度单独确认。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
