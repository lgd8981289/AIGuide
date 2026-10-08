# React.memo、useMemo、useCallback 有什么区别？什么时候值得用？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q135-react-render-cache/) · [题库目录](../../README.md)

<!-- 以下对话为教学模拟，非真实面经。 -->

🧑‍💻 面试官：memo、useMemo、useCallback 分别做什么？

🙋‍♂️ 我：memo 缓存组件，useMemo 缓存值，useCallback 缓存函数。

🧑‍💻 面试官：子组件已经 memo，父组件每次都传一个新对象，为什么还会渲染？

🙋‍♂️ 我：因为引用变了，可以再用 useMemo 固定对象。

🧑‍💻 面试官：那是不是所有对象和函数都应该缓存？项目启用了 React Compiler，这个答案还一样吗？

> 先找重复工作，再看哪一道比较边界失效；缓存有成本，编译器配置也会改变方案。

## 面试速答（60 秒版）

memo 主要尝试在 props 没变化时跳过组件重渲染；useMemo 缓存一次计算的结果；useCallback 保留函数引用。它们作用的边界不同，也都不是正确性的保证。

新对象和新函数引用可能让浅比较失效，但稳定引用只有遇到实际比较或依赖场景时才有意义。缓存很便宜的工作，可能只增加依赖和维护成本。

我会先用 Profiler 找重复而昂贵的工作，再选择缓存位置，并保留完整依赖。若项目启用了 React Compiler，应先确认它已自动优化哪些部分，而不是继续机械地给所有组件加 memo。

![组件、计算结果和函数引用分别对应不同缓存边界](https://note.lgdsunday.club/img/Q135/00-60s-overview.webp)

## 知识点详解：缓存要接在真正能省工作的地方

### 三个工具，拦的不是同一种工作

假设父页面每秒更新时间，但下面的图表只依赖一份不变的数据。

memo 可以尝试让图表在 props 相同的时候跳过父级更新带来的重渲染；useMemo 可以缓存图表数据转换的结果；useCallback 可以保留传给图表的操作函数引用。

它们可以配合，也可以单独使用。缓存函数不等于函数内部计算结果被缓存，缓存数据也不等于整个组件不会渲染。memo 组件自己的状态或读取的 Context 改变时，仍可能更新。

### 为什么看起来没变的 props，比较起来变了？

每次渲染新建一个配置对象，即使字段完全一样，它仍是另一个对象。默认 memo 比较 props 时按 Object.is 等相应规则检查，新的引用通常会被视为变化。

这时先问能不能传更简单的 prop。例如图表只需要 color 字符串，没必要外面包一个每轮新建的 config 对象。确实需要稳定对象，再考虑 useMemo。

useCallback 也是同样的道理。如果函数没有传给需要引用稳定的子组件，也不参与相关依赖设计，单纯“每次创建了一个函数”并不自动构成值得优化的问题。

### 缓存不是修复错误依赖的捷径

useMemo 和 useCallback 的依赖要包含计算所使用的相关响应式值。故意把依赖写成空数组，可能把旧数据和旧闭包保留下来。

假设删除函数需要当前 userId，但它的依赖没有 userId。用户切换后，即使函数引用非常稳定，也可能删错对象。性能看起来更好，业务却错了。

自定义 memo 比较函数也要比较影响输出和行为的 props，不能只比较一个显示字段，忽略回调里的旧状态。比较本身还有成本，深度比较可能比直接渲染更贵。

这些都是 React 的前端 API，本题用行为讲清机制，不提供不存在的 Python 同名实现。

### 先说明是否启用 React Compiler

React Compiler 能自动做一部分组件与计算的缓存优化，但前提是项目配置启用并覆盖了相关代码。它不是“升级 React 后所有地方都自动免费缓存”。

因此，旧项目、未启用编译器的项目，以及已经编译优化的项目，不能套完全相同的手工清单。阅读产物、查看编译器覆盖情况，再结合 Profiler 判断手工缓存是否仍有必要。

评估时重复执行同一交互，看渲染次数、实际耗时和内存，而不是只看 console.log 少了。开发环境 Strict Mode 的额外调用，也不能直接当生产性能数字。

本题机制参考：[React：memo](https://react.dev/reference/react/memo)、[React：useMemo](https://react.dev/reference/react/useMemo)、[React：useCallback](https://react.dev/reference/react/useCallback)。

## 面试官继续追问

### useMemo 的值可以当业务持久状态吗？

不应该。它是性能优化，React 可以在相应条件下丢弃缓存。需要可靠保存的业务状态应使用 state、ref 或适当的状态系统。

### memo 能阻止 Context 更新吗？

不能把 memo 当作 Context 更新屏障。组件读取的 Context 值变化时，仍可能重渲染；可考虑拆分数据边界和消费位置。

### 自定义比较函数返回 true 表示什么？

表示认为新旧 props 可视作等价，允许跳过这次相应渲染。因此返回条件必须覆盖实际输出和行为，不能只求跳过越多越好。

## 面试速记卡

> - memo：组件 props 比较边界。
> - useMemo：缓存计算结果，不是业务状态保证。
> - useCallback：保留函数引用，不缓存每次调用结果。
> - 依赖：稳定引用不能以保留错误旧值为代价。
> - 选型：先测重复工作，再看 React Compiler 覆盖情况。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
