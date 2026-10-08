# ResizeObserver 和 MutationObserver 有什么区别？监听元素变化该用哪个？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q364-resize-mutation-observer/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：ResizeObserver 和 MutationObserver 有什么区别？

🙋‍♂️ 我：一个看尺寸变化，一个看 DOM 变化。

🧑‍💻 面试官：侧栏收起后图表变宽，但 DOM 节点没有增删，应该用哪个？

🙋‍♂️ 我：ResizeObserver。

🧑‍💻 面试官：如果在它的回调里，每次再把宽度增加十像素呢？放进 requestAnimationFrame 就不会循环了吗？

> 看尺寸和看结构，是不同的观察目标。观察器回调还可能成为下一次变化的原因，需要防止自我触发。

## 面试速答（60 秒版）

ResizeObserver 观察元素的盒尺寸变化，适合图表、画布等根据容器尺寸调整的场景。它不只关注窗口 resize，也能感知容器自身变化。

MutationObserver 观察配置范围内的 DOM 变化，比如子节点增删、属性或文本变化。但 DOM 变化不一定导致尺寸变化，尺寸变化也不一定来自 DOM 增删。

实际选择时，我会先确定要观察的结果。如果是布局尺寸，就用 ResizeObserver；如果是节点结构或属性，就用 MutationObserver。

回调中需要避免反复修改同一个被观察条件。先检查是否真的需要更新，防止尺寸反馈循环；requestAnimationFrame 只能调整时机，不能自动消除错误循环。卸载时都要清理。

![尺寸变化，和 DOM 变化不同](https://note.lgdsunday.club/img/Q364/01-overview.webp)

*图：左侧是没有相关 DOM 变更的 CSS 尺寸变化；右侧是不会改变尺寸的数据属性变化。两种观察器不能互相替代。*

## 知识点详解：先选择观察目标，再处理回调影响

### 容器变宽，不一定有 DOM 结构变化

假设页面右侧放一个图表。左侧导航收起后，图表容器获得更多空间，但是图表元素本身没有新增子节点。

这时用 MutationObserver 观察子节点，就无法直接得到目标尺寸变化。ResizeObserver 才是在观察需要的结果。

窗口没有 resize，也不代表容器没变。父容器布局、文字换行和其他元素尺寸，都可能改变当前元素的尺寸。

### DOM 变化，也不一定改变盒尺寸

MutationObserver 可以按配置观察 attributes、childList 或 characterData，并决定是否包含 subtree。

比如按钮 data-state 改变，DOM 属性发生变化，但如果它不影响样式，按钮尺寸可能保持不变。反过来，字体加载或容器布局变化，也可能影响尺寸而没有对应的目标属性修改。

它们的范围可以分别核对 [MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) 和 [ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)。

### 图表场景，观察容器尺寸更直接

#### TypeScript

```ts
const host = document.querySelector<HTMLElement>("#chart-host");
if (host) {
  let lastWidth = -1;
  const observer = new ResizeObserver((entries) => {
    const width = entries[0].contentRect.width;
    if (width === lastWidth) return;
    lastWidth = width;
    // 把 width 传给图表；避免这里再次改变 host 宽度
    console.log("chart width", width);
  });
  observer.observe(host);
  // 组件卸载时：observer.disconnect()
}
```

这是浏览器观察器 API，Python 没有同一套接口。示例读取 contentRect；需要边框盒或设备像素尺寸时，应明确使用哪一种盒模型及浏览器支持。

### 为什么会出现 ResizeObserver loop？

假设观察到宽度 100，就设置成 110；下一次观察到 110，又设置成 120。尺寸变化和回调互相推动，逻辑上没有终点。

浏览器会按规范处理无法在当前轮完成的通知，避免当前帧无限卡住，但可能继续在后续帧增长。这不是替你修好了循环。

把修改放进 requestAnimationFrame，可能推迟到另一帧，仍然可能每帧继续加宽。真正的修复是明确目标尺寸，只在未达到目标时修改，或避免反向修改同一被观察条件。

![回调改尺寸，可能再次触发自己](https://note.lgdsunday.club/img/Q364/02-feedback.webp)

*图：回调改尺寸，可能再次触发自己。*

### MutationObserver 也要防止自触发

如果观察属性变化，回调里又无条件写同一个属性，可能生成新的通知。应检查新值是否已经满足要求，必要时限制观察范围。

不要为了观察一个按钮，把整个 document 的所有子树和属性都监听起来。更小的目标、更明确的配置，通常更容易理解和控制开销。

## 面试官继续追问

### window\.resize 不能做图表适配吗？

可以覆盖窗口变化，但不能代表所有容器变化。侧栏切换、父布局调整等场景，需要直接观察容器。

### ResizeObserver 能监听位置变化吗？

它主要观察盒尺寸，不是通用位置监听器。尺寸不变但移动位置，不应期待它必然通知。

### 回调里可以直接读取所有元素尺寸吗？

需要谨慎。大量额外测量和写入可能增加布局工作。优先使用通知中的信息，并分清读写阶段。

## 面试速记卡

> - ResizeObserver：观察元素盒尺寸。
> - MutationObserver：观察指定 DOM 结构、属性或文本变化。
> - 不等价：结构变化与尺寸变化没有一一对应关系。
> - 回调：避免无条件修改被观察条件。
> - rAF：调整时机，不自动修复无限反馈。

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
