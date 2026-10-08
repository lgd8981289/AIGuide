# 虚拟列表是什么？几万条数据怎样做到滚动不卡顿？

[百度前端面试真题](../companies/baidu-frontend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q149-virtual-list/) · [题库目录](../../README.md)

<!-- 以下对话为教学模拟，非真实面经。 -->

🧑‍💻 面试官：虚拟列表怎么实现？

🙋‍♂️ 我：只渲染屏幕里的数据，滚到哪里就显示哪里。

🧑‍💻 面试官：只渲染十行，滚动条为什么还能代表十万行？

🙋‍♂️ 我：给外层设置总高度。

🧑‍💻 面试官：每一行高度不一样时，scrollTop 除以行高还能算对吗？

> 虚拟列表要同时维护真实滚动空间和当前渲染窗口；减少 DOM，不等于减少了全部数据成本。

## 面试速答（60 秒版）

虚拟列表只渲染可见区域附近的少量行，同时用占位空间保留整份列表的滚动范围。用户滚动时，根据位置更新要渲染的数据区间和偏移量。

固定行高时，可以用 scrollTop 与行高计算起始索引，再根据视口高度确定结束位置，并增加少量 overscan 减少快速滚动时的空白。

动态行高需要测量和累计高度，不能继续简单相除。还要处理行状态、稳定 key、焦点、尺寸变化和滚动锚点。

它主要减少 DOM 和渲染工作，不自动解决全部数据下载、搜索或内存问题。是否使用，应先确认长列表确实造成瓶颈。

![完整列表总空间保持滚动范围，只挂载可见窗口附近节点](https://note.lgdsunday.club/img/Q149/00-60s-overview.webp)

## 知识点详解：少量 DOM，怎么撑起完整滚动空间

### 屏幕里只有几行，空间却代表整份列表

假设有 10,000 行，每行固定 40px，视口高 400px。整份列表的逻辑高度是 400,000px，但屏幕一次大约只看到 10 行。

容器保留总高度，里面只放当前窗口的行，并把它们移动到对应的垂直位置。窗口之外的数据仍然可以存在，但对应 DOM 不必一直挂着。

滚动到 800px 时，第一条完整起始行索引是 20。窗口更新后，显示这附近的数据；滚动条长度仍然由总空间决定，而不是由当前十几个节点决定。

### 固定行高，先把区间算法算对

下面仅计算区间，不是完整 DOM 组件。约定输入非负、行高大于 0，结束索引不包含在区间里。

### TypeScript

```typescript
function visibleRange(
  count: number, scrollTop: number, viewport: number,
  rowHeight: number, overscan = 2
) {
  const first = Math.floor(scrollTop / rowHeight);
  const last = Math.ceil((scrollTop + viewport) / rowHeight);
  return {
    start: Math.min(count, Math.max(0, first - overscan)),
    end: Math.min(count, last + overscan)
  };
}
console.log(visibleRange(10000, 800, 400, 40));
// { start: 18, end: 32 }
```

### Python

```python
import math

def visible_range(count, scroll_top, viewport, row_height, overscan=2):
    first = math.floor(scroll_top / row_height)
    last = math.ceil((scroll_top + viewport) / row_height)
    return {
        "start": min(count, max(0, first - overscan)),
        "end": min(count, last + overscan),
    }

print(visible_range(10000, 800, 400, 40))
# {'start': 18, 'end': 32}
```

overscan 多画一点窗口之外的行，用少量额外工作换快速滚动时的稳定。太大又会抵消减少节点的收益。

### 动态行高，要知道每行累计到哪里

评论内容有长有短，图片加载后还可能改变行高。此时第 20 行的位置不能继续按 20×固定高度计算。

通常要记录测量结果和累计高度，根据 scrollTop 查找落在哪一行；高度变化后更新后续偏移。实现可以使用前缀累计和、二分定位，较复杂场景再选择适合更新的数据结构。

如果上方行突然增高，还需要保护滚动锚点，否则用户正在看的内容会跳动。窗口尺寸、字体和图片加载都可能触发重新测量，不能只在第一次挂载时量一次。

### 被移出窗口的行，状态放在哪里？

行节点会被移除或复用。输入框草稿如果只存在行组件内部，离开窗口后可能丢失；用下标身份又可能让状态跟错数据。

需要长期保留的行状态可以按稳定 ID 存在窗口之外，焦点和键盘导航也要专门处理。浏览器查找、打印和无障碍阅读可能受未挂载内容影响，需要按产品需求补足。

最后，虚拟化不会让十万条数据的下载、过滤和内存自动消失。数据分页、服务端搜索和渲染虚拟化可以配合，但负责的成本不同。

本题机制参考：[web.dev：Virtualize large lists](https://web.dev/articles/virtualize-long-lists-react-window)。

![动态行高通过测量累计偏移定位可见行，并处理高度变化](https://note.lgdsunday.club/img/Q149/01-detail.webp)

## 面试官继续追问

### 虚拟列表和无限加载是一回事吗？

不是。虚拟列表控制挂载多少节点；无限加载控制何时获取更多数据。可以组合，也可以独立使用。

### overscan 越大越稳吗？

可能减少空白，但增加节点和渲染成本，需要按行复杂度与滚动速度测。

### 动态行高只用平均高度可以吗？

平均高度可以作为初始估算，但要逐步测量修正，否则偏移和滚动定位会累积误差。

## 面试速记卡

> - 核心：完整滚动空间 + 局部渲染窗口。
> - 固定高度：位置换索引，结束区间要处理边界。
> - 动态高度：测量、累计偏移与锚点。
> - 行状态：稳定ID，重要状态不能随窗口移除丢失。
> - 成本边界：减少DOM，不等于减少全部数据成本。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **百度 · 前端 · 实习（原帖标签）**：虚拟列表怎样实现？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/530709141912829952)；原帖编辑于 2023-09-15。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
