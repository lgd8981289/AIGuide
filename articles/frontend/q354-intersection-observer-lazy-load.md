# IntersectionObserver 是什么？如何实现图片懒加载和滚动加载？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q354-intersection-observer-lazy-load/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：IntersectionObserver 能做什么？

🙋‍♂️ 我：观察元素是否进入视口，可以做图片懒加载。

🧑‍💻 面试官：交叉比例大于零，就证明用户真正看到了图片吗？

🙋‍♂️ 我：不一定，交叉是几何关系。

🧑‍💻 面试官：无限滚动的哨兵一直在视口里，为什么会重复请求？提前加载又怎么设置？

> 观察器负责通知「相交状态」，加载器负责决定「是否请求」。几何通知不能替代请求状态管理。

## 面试速答（60 秒版）

IntersectionObserver 可以异步观察目标元素与视口或指定根容器的相交情况，不必自己在每次滚动时遍历所有元素的位置。

图片懒加载可以在目标接近可见区域时设置真实地址，再取消观察；提前加载可以通过 rootMargin 扩大观察范围。threshold 则表示交叉比例跨过哪些阈值时通知。

但通知不等于每次滚动都会触发，也不等于证明用户真正看到了内容。元素遮挡和实际可见性需要另外判断。

无限加载还要维护 loading、hasMore、分页位置和错误状态。组件卸载时清理观察器，避免重复绑定。普通图片场景也可以先评估浏览器原生 loading="lazy"，不一定需要自己写一套。

![几何通知，不替你管理请求](https://note.lgdsunday.club/img/Q354/01-overview.webp)

*图：勾选表示检查已完成；真正开始加载的条件是没有请求正在执行，并且还有下一页。*

## 知识点详解：相交通知怎样变成稳定的懒加载？

### 为什么不用一直监听 scroll 算位置？

假设列表有很多图片。每次滚动都读取每张图片的位置，会让代码不断处理几何测量，还需要自己安排节流和时机。

IntersectionObserver 把相交观察交给浏览器，异步给出变化结果。它不适合精确追踪每个像素位置，但很适合“接近区域时开始准备”。

root 默认是视口，也可以设为某个滚动容器。目标必须在相应观察关系中。rootMargin 调整根区域的边界，threshold 决定关注的比例，见 [MDN 文档](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)。

### 图片接近视口，就换上真实地址

#### TypeScript

```ts
const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    const img = entry.target as HTMLImageElement;
    const src = img.dataset.src;
    if (src) {
      img.src = src;
      delete img.dataset.src;
    }
    observer.unobserve(img);
  }
}, { rootMargin: "200px 0px", threshold: 0 });

document.querySelectorAll<HTMLImageElement>("img[data-src]")
  .forEach((img) => observer.observe(img));
// 页面或组件销毁时：observer.disconnect()
```

这是浏览器 DOM API，Python 无相同官方接口。此例用于解释触发机制；图片应预留宽高，真实项目还要处理加载失败。

取消观察可以避免同一图片反复触发加载逻辑。rootMargin 为正，可以在图片真正进入视口之前提供准备时间，但不是保证下载一定完成。

![提前区域与交叉比例，分别设置](https://note.lgdsunday.club/img/Q354/02-margin.webp)

*图：rootMargin 改变的是观察边界。跨过阈值时进入和离开都可能收到通知，要继续判断 isIntersecting。*

### threshold 不是“达到这个比例才算加载成功”

threshold 关注交叉比例的跨越。初次观察时也可能收到通知，所以回调不能假设“每条记录都代表刚刚进入”。

用于懒加载时，通常检查 isIntersecting，再决定是否处理。用于曝光统计时，还可能需要持续可见时间、页面是否在前台等条件。单次相交通知不能自动成为有效曝光。

### 无限滚动还需要一个请求状态机

假设底部哨兵进入视口后加载下一页。请求进行中，布局变化可能再次触发相交；如果没有 loading 保护，就可能重复拉取同一页。

因此，开始请求前先检查 loading 和 hasMore，并立即设置 loading。成功后推进分页位置，失败时保留可重试状态，最后再解除 loading。

还要考虑列表不足一屏：哨兵加载后可能一直相交，没有新的阈值跨越。不能假设观察器会自动不断通知直到填满屏幕，可以在请求完成后检查是否还需继续加载，或者明确重新观察。

![哨兵相交，请求仍需防重入](https://note.lgdsunday.club/img/Q354/03-request.webp)

*图：哨兵相交，请求仍需防重入。*

## 面试官继续追问

### 原生 lazy 和观察器怎么选？

普通图片优先评估原生能力；需要自定义预加载距离、复杂容器或触发其他任务时，再使用观察器。注意原生懒加载行为由浏览器决定。

### 可以用它判断元素被弹窗挡住吗？

基础交叉观察不等于遮挡判断。应明确具体可见性能力及浏览器支持，不能把几何相交包装成完整视觉检测。

### 一个图片配一个观察器吗？

不必。一个观察器可以观察多个目标，减少管理开销。不同配置需求才考虑分别创建。

## 面试速记卡

> - 观察对象：目标与视口或根容器的相交关系。
> - rootMargin：调整提前触发范围。
> - threshold：关注交叉比例跨越，不是加载进度。
> - 请求控制：防重入、分页推进、失败重试另行处理。
> - 清理：取消单个目标或 disconnect 整个观察器。

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
