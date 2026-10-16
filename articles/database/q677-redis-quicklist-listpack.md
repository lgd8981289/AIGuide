# Redis 的 quicklist 是什么？为什么 List 不直接使用普通链表或一个 listpack？

[京东后端面试真题](../companies/jd-backend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/database/q677-redis-quicklist-listpack/) · [题库目录](../../README.md)

下面是一段模拟面试对话。

🧑‍💻 **面试官：** Redis List 的底层是不是每个元素一个链表节点？

🙋‍♂️ **我：** 不能这么说，quicklist 通常把多个元素放进一个紧凑块，再把块串起来。

🧑‍💻 **面试官：** 块里面现在还一定是 ziplist 吗？

🙋‍♂️ **我：** 得看版本，本文讨论 Redis 8.2 的 listpack 相关实现。

🧑‍💻 **面试官：** 那小 List 会不会直接采用 listpack？查询中间第十万个元素，能因为有链表就变成 O(1) 吗？

> 先分清 List 的逻辑类型、对象编码和 quicklist 节点里的容器，别把三个名字当成同一层。

## 面试速答（60 秒版）

quicklist 可以理解成一条由数据块组成的双向链表。常规压紧节点里的 listpack 连续存放多个元素，既减少“每元素一个节点”的指针开销，又避免把整个大列表永远塞进一个连续块。

节点大小和压缩策略影响内存、移动与访问成本，不能无限放大，也不能断言每个节点都只对应一个元素。实现还存在特殊的大元素节点等情况，要限定版本。

本文核对 Redis 8.2：List 对象可以使用 listpack 或 quicklist 编码，不是所有 List 都固定为 quicklist，也不应继续把内部统一讲成 ziplist。

它有利于相应的列表操作，但不让任意位置查找都变成常数时间。排查时应确认实际编码、元素分布和访问方式，再看配置，不仅凭元素个数猜内存效果。

![quicklist 链接的是块](https://note.lgdsunday.club/img/Q677/01-redis-quicklist-listpack.webp)

## 知识点详解：为什么既需要连续块，也需要链？

### 每元素一个节点，指针开销会跟着元素数量涨

假设列表里都是很短的值。如果每个元素都单独分配一个链表节点，节点指针和分配管理开销就可能占据不小比例。

连续紧凑存放多个元素，可以减少这些额外结构，也让相邻数据更集中。但如果整个列表始终是一大块，插入和扩展时的移动、重分配又可能变重。

quicklist 把二者结合：外部用节点串接，节点内部再批量存储元素。解释时先画“块与块”，再放大某个块里的元素，比先背一长串字段名更清楚。

### 双向的是块链，不是每个元素都有 next、prev

本文使用 [Redis 8.2 quicklist.h](https://github.com/redis/redis/blob/8.2/src/quicklist.h)核对结构。节点之间有前后关联，普通压紧容器里则由 listpack 存放多个元素。

因此，从一个节点去前后节点，与在某个 listpack 内找到目标元素，是两个层次的操作。不要把块链上的双向指针，画到块里每个小元素上。

源码还区分 packed 与 plain 容器等情况，大元素不应该被硬塞进“所有节点都必须含多个 listpack 元素”的口令里。

![元素、连续块与块链](https://note.lgdsunday.club/img/Q677/02-redis-quicklist-listpack.webp)

### 小 List 可能还没用上 quicklist

逻辑类型是 List，不代表对象编码只能有一种。[Redis 8.2 t\_list.c](https://github.com/redis/redis/blob/8.2/src/t_list.c)中有 listpack 与 quicklist 的处理和转换路径。

这也是为什么排查内存时，要先看实际对象编码，再讨论 quicklist 参数。不能看见客户端执行 LPUSH，就直接断定已经创建了某种固定节点结构。

可以在受控测试 Redis 中用 `OBJECT ENCODING key` 观察编码，再改变元素数量与大小对比。命令反映当前对象内部编码，不构成跨版本永久保证。[OBJECT ENCODING 文档](https://redis.io/docs/latest/commands/object-encoding/)介绍了这个观察入口。

### 块大小，是空间与操作成本的交换

块过小，会有更多节点管理和指针开销；块过大，某些位置修改、内存重分配和解压缩成本可能提高。

压缩深度又是另一项权衡。两端经常操作的位置与中间节点，可以有不同处理策略，但具体配置值与语义应查所用版本，不能照抄旧版参数名称后就默认生效。

正确的测试数据至少同时包含短元素、少量大元素，以及真实操作比例。只用十个短字符串得到一个节省比例，不能外推所有任务队列和消息列表。

![块大小需要取舍](https://note.lgdsunday.club/img/Q677/03-redis-quicklist-listpack.webp)

### 中间位置，不会因为“双向”就瞬间到达

链表允许从两端出发，仍不代表能够直接按任意下标跳到目标。访问中间元素，需要沿结构找到相应块，并定位块内元素。

所以选择 List 时要结合操作模式。大量按索引随机访问，并不能仅凭 quicklist 名字带 quick 就得到保证。关注的是相应 Redis 命令的复杂度，而不是数据结构名称的直觉。

## 面试官继续追问

### 为什么旧题解总写 ziplist？

那往往对应历史版本。应该说清当时实现，再核对当前 listpack 及对象编码路径。版本变化不是靠把一个名词全局替换就能完整解释。

### 怎样证明调参真的更好？

看实际编码、MEMORY USAGE、命令延迟分布和负载恢复；同时记录版本、配置和元素大小。本文只做源码核验，没有在本机启动 Redis，也没有编造内存节省数据。

## 面试速记卡

> - 层次：List 是逻辑类型，listpack/quicklist 是相关对象编码。
> - 结构：quicklist 串接数据块，常规块内部用 listpack 批量存元素。
> - 版本：不把旧 ziplist 图直接当作 Redis 8.2 现状。
> - 成本：块大小、压缩和元素分布共同影响空间与操作。
> - 边界：双向块链不提供任意下标 O(1) 查找。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **京东 · AI后端（京东科技） · 原帖未明确批次**：Redis 为什么用 listpack 替换压缩列表，quicklist 的查询复杂度是多少？（题意整理）。[面经来源](https://www.nowcoder.com/feed/main/detail/982e512939ba4284af35dd4974eca42e)；页面显示 04-01 发布，未明确年份。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
