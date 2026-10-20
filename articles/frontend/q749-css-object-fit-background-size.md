# CSS object-fit 和 background-size 有什么区别？图片为什么会裁切或变形？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q749-css-object-fit-background-size/) · [题库目录](../../README.md)

*以下对话为教学模拟，用来讲解这道题。*

🧑‍💻 面试官：宽图放进正方形头像框，怎么保证不变形？

🙋‍♂️ 我：设置宽高 100%，再加 object-fit:cover。

🧑‍💻 面试官：图片确实没变形，但左右被裁掉了。产品要求完整展示时怎么办？

🙋‍♂️ 我：改成 contain，可能会留下空白。

🧑‍💻 面试官：如果是 div 的背景图呢？object-fit 还能管吗？图片本身有内容含义，又应该用哪一种？

> 先找承载图片的对象，再决定保留比例、填满区域还是完整展示。这几件事不能永远同时满足。

## 面试速答（60 秒版）

object-fit 控制 img、video 等替换元素的内容，怎样放进元素自己的内容盒；background-size 控制背景图片在背景定位区域里怎样缩放。它们名字相似，但处理的对象不同。

contain 保留比例并完整显示，区域比例不一致时可能留白；cover 保留比例并铺满区域，多出的部分会被裁切。object-fit 的 fill 会拉伸填满，图片比例与盒子不同时就可能变形。

同时还要区分盒子尺寸和图片内容。给 img 设置 object-fit，不会替它自动创建一个正方形，仍然需要宽高、aspect-ratio 等布局约束。

图片承载文章、商品等内容时，通常用 img 并提供适当的替代文字；纯装饰可以使用背景图。不要只为了 cover 写着方便，就把重要内容变成无法正确表达语义的背景。

![contain cover fill作用的视觉差异](https://note.lgdsunday.club/img/Q749/01-image-fit-overview.webp)

## 知识点详解：图片没变形，为什么人脸还是少了一半？

### 先把框固定，再讨论内容怎样放

假设原图是 400×200，宽高比为 2:1，要放进 200×200 的正方形框。

如果直接把图片内容拉成 200×200，横向缩小一半，纵向却不缩，人脸就会变窄。object-fit:fill 的行为就是填满内容盒，不承诺保留原始比例。

contain 选择的缩放倍数，要让整个内容都进入框内。这个例子变成 200×100，默认居中时，上下各留 50 的空白。

cover 则要先保证两个方向都覆盖框。图片仍是 400×200，默认居中时，框左右各裁掉 100。人没有被压扁，但画面确实少了一部分。

因此，“不变形”和“完整显示”并不是同一条要求。照片头像常愿意裁掉背景，商品说明图却可能必须完整显示，应该先问产品需要哪一个。

### object-fit 不负责创建那个框

一个 img 示例是：

```css
.avatar {
  width: 200px;
  height: 200px;
  object-fit: cover;
  object-position: 50% 30%;
}
```

width 和 height 决定元素内容区域的尺寸，object-fit 决定里面的图怎样缩放；object-position 再调整图在区域中的对齐位置。

如果只给 img 写 `width:100%; height:auto`，元素高度跟着原始图片比例变化，未必出现一个需要裁切的正方形框。此时反复改 object-fit，可能看不出你预想的效果。

[CSS Images 规范](https://drafts.csswg.org/css-images-3/#the-object-fit)把内容适配与元素本身的尺寸区分开。这个边界，比背 contain 和 cover 两个词更重要。

![400x200进200x200时留白与裁切的准确数量](https://note.lgdsunday.club/img/Q749/02-box-content-ratio.webp)

### 背景图用另一套入口

背景图是画在元素背景中的内容，不是 img 自身的替换内容。给普通 div 设置 object-fit，不能控制 background-image。

```css
.banner {
  min-height: 240px;
  background-image: url("banner.jpg");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
```

background-size:cover 与 contain 也表达铺满和完整包含，但它们依据的是背景定位区域。这个区域还会受到 background-origin 等属性影响，不能一概称为“永远等于内容盒”。

背景图也不会因为自身很高，就自动把一个没有内容、没有高度的 div 撑起来。布局尺寸仍然需要另外安排。

这两段都是 CSS 配置，不需要额外制造 TypeScript、Python 同名 API。

### 图片放在哪里，还会影响语义和资源选择

商品照片如果是用户理解商品必需的信息，应当保留 img 的内容语义，根据用途提供 alt；照片只是装饰时，alt 可以为空，不能机械写一个没有帮助的文件名。

CSS 背景没有 img 的 alt 接口，因此不适合偷偷承担必须读出的内容。背景图不显示时，页面也应该仍能理解。

另外，object-fit 和 background-size 处理的是“已经选中的图片怎样放进去”。它们不自动决定该下载 400px 还是 2000px 的文件。响应式资源选择属于 srcset、sizes 等另一层问题，Q366 对此已有专文。

![img与background两种对象及语义接口不同](https://note.lgdsunday.club/img/Q749/03-img-versus-background.webp)

## 面试官继续追问

### cover 把人脸裁掉，能不能只改 position？

可以通过 object-position 或 background-position 调整保留的部分，但画面比例不一致时，裁切仍然存在。如果必须完整显示全部文字或人物，就应重新评估 contain、区域比例或图片本身的构图。

### object-fit 适合给所有 div 用吗？

不适合。它主要处理替换元素的内容，不是普通盒子里所有后代的统一缩放器。

### 怎么测图片布局？

用宽图、竖图、方图分别放入同一组件，检查留白、裁切和实际元素尺寸；再关掉图片或查看无障碍信息，确认内容没有因为视觉适配而丢失。只看一张比例恰好一致的图，三个值可能都差不多。

## 面试速记卡

> - object-fit：管替换元素内容；background-size：管背景图。
> - contain：保比例、完整展示，可能留白。
> - cover：保比例、铺满区域，可能裁切。
> - fill：填满但不保证比例；适配属性不自动创建盒子尺寸。
> - 内容语义：重要图片保留可访问表达，资源清晰度另看 srcset 等机制。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
