# LRU 缓存怎么实现？为什么通常需要哈希表加双向链表？

[腾讯前端面试真题](../companies/tencent-frontend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/cs-basics/q201-lru-cache/) · [题库目录](../../README.md)

<!-- 以下对话为教学模拟，非真实面经。 -->

🧑‍💻 面试官：怎么设计 LRU 缓存？

🙋‍♂️ 我：用哈希表存数据，容量满了就删除最早插入的。

🧑‍💻 面试官：一个很早插入的键刚刚被访问过，还应该先删它吗？

🙋‍♂️ 我：不应该，访问也要更新顺序。

🧑‍💻 面试官：那查找和更新顺序怎样避免每次扫描所有键？缓存零或空值又怎么判断命中？

> LRU 的旧，指最久没被使用，不是最早插入。查找和访问顺序需要同时维护。

## 面试速答（60 秒版）

LRU 淘汰最近最少使用的条目。命中读取和写入都要更新最近使用位置，容量超限时删除最久未使用的条目。

经典结构是哈希表加双向链表：表定位节点，链表移动节点和删除尾部，在常见哈希假设下实现平均 O(1) 的 get、put。只用数组维护顺序会产生移动或扫描成本。

语言容器可以简化教学实现，例如 JS Map 的插入顺序、Python OrderedDict 的重排能力，但不要把它们的接口等同于所有平台都严格 O(1) 的保证。

还要定义容量零、更新已有键、缺失值、TTL 和并发语义。LRU 管容量淘汰，不自动保证数据新鲜或加载不重复。

![读取 A 更新使用顺序后，新增 C 应淘汰 B](https://note.lgdsunday.club/img/Q201/00-60s-overview.webp)

## 知识点详解：命中查找与访问顺序怎么配合

### 先拿容量二走一遍

假设依次 put(A)、put(B)，从旧到新是 A、B。此时 get(A) 命中，顺序应变成 B、A。再 put(C)，删除的是 B，保留 A、C。

如果你仍删除 A，实现的是按插入顺序淘汰的某种 FIFO，而不是这里定义的 LRU。更新已有键也应按本题规则视为一次使用。

缺失不能靠值是否为真判断。合法缓存可能存 0、false、空字符串或 None，必须独立判断键是否存在。

### 哈希表定位，双向链表移动

表中的值是链表节点引用，不是节点下标。命中后可以直接摘下节点并移到最近使用端，不需要从头寻找前驱。

淘汰时取最旧端的节点，同时从表和链表删除。两份结构必须一起更新，漏一份就会出现幽灵键或失效引用。

双向链表与哈希表各有职责，空间都是随容量增长。这里的平均 O(1) 依赖哈希操作的常见假设，不是最坏情况无条件承诺。

### 先用语言容器验证规则

下面是容器版，约定容量为非负整数，get 返回“是否命中＋值”，不混淆合法空值。TS 使用 Map 删除后重插来更新顺序；Python 使用 OrderedDict。它们不是手写双向链表的替代考卷，面试若要求完整结构，还需展开节点管理。

#### TypeScript

```ts
class LRU<K, V> {
  private items = new Map<K, V>();
  constructor(private capacity: number) {
    if (!Number.isInteger(capacity) || capacity < 0) {
      throw new RangeError("capacity");
    }
  }
  get(key: K): { hit: boolean; value?: V } {
    if (!this.items.has(key)) return { hit: false };
    const value = this.items.get(key) as V;
    this.items.delete(key);
    this.items.set(key, value);
    return { hit: true, value };
  }
  put(key: K, value: V): void {
    if (this.capacity === 0) return;
    this.items.delete(key);
    this.items.set(key, value);
    if (this.items.size > this.capacity) {
      const oldest = this.items.keys().next();
      if (!oldest.done) this.items.delete(oldest.value);
    }
  }
}
```

#### Python

```python
from collections import OrderedDict

class LRU:
    def __init__(self, capacity: int):
        if not isinstance(capacity, int) or capacity < 0:
            raise ValueError("capacity")
        self.capacity = capacity
        self.items = OrderedDict()

    def get(self, key):
        if key not in self.items:
            return False, None
        self.items.move_to_end(key)
        return True, self.items[key]

    def put(self, key, value):
        if self.capacity == 0:
            return
        self.items[key] = value
        self.items.move_to_end(key)
        if len(self.items) > self.capacity:
            self.items.popitem(last=False)
```

### 缓存规则正确，仍不等于生产缓存完整

假设数据源已经更新，本地 LRU 中的旧值仍可能命中。你需要另外约定过期、失效通知或版本检查。

多个请求同时 miss，也可能一起加载同一份数据。去重加载和并发同步不是 LRU 自动提供的。

验证先用 A、B、读 A、写 C 检查淘汰，再测试重复写、容量零和空值。之后才谈是否需要时间过期、按字节计费或分片缓存。

本题机制参考：[MDN Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)、[Python OrderedDict](https://docs.python.org/3/library/collections.html#collections.OrderedDict)。

## 面试官继续追问

### get 也会修改缓存吗？

会修改最近使用顺序，因此并发设计不能把它当成完全无状态的读取。

### 为什么不是单向链表？

摘下任意已定位节点需要前驱；双向链接能直接更新邻居，更适合本题操作。

### Map set 已有键会自动移到最后吗？

不会按本题要求重排，所以示例先 delete 再 set。规范也不保证所有 Map 实现严格 O(1)。

## 面试速记卡

> - LRU：最久未使用，不是最早插入。
> - 命中和更新：都刷新使用顺序。
> - 经典结构：哈希定位＋双向链表重排。
> - 缺失判断：用存在性，不用值的真假。
> - 生产边界：TTL、并发和去重加载另外设计。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **腾讯 · 前端 · 原帖未明确批次**：怎样实现 LRU，除了 Map 还可以用哪些数据结构？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/529319096907726848)；腾讯面试记录为 2023-08-28、2023-08-30；原帖编辑于 2023-09-07。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
