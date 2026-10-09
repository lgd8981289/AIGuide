# 工厂模式和策略模式有什么区别？如何配合管理多种实现？

[百度AI应用开发面试真题](../companies/baidu-ai-application.md) · [阿里后端面试真题](../companies/alibaba-backend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/fullstack-system-design/q361-factory-vs-strategy-pattern/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：工厂模式和策略模式有什么区别？

🙋‍♂️ 我：工厂负责创建对象，策略负责切换算法。

🧑‍💻 面试官：文件可以上传到本地或对象存储，我按配置选一个实现，这是工厂还是策略？

🙋‍♂️ 我：选择和创建可以由工厂负责，各实现提供相同上传行为，可以作为策略。

🧑‍💻 面试官：如果上传服务里又写一遍 if else 判断存储类型，这个抽象还解决了什么？

> 先把「拿到哪个实现」和「如何执行当前行为」分开。工厂与策略可以配合，不需要争一个唯一标签。

## 面试速答（60 秒版）

工厂关注对象如何创建和取得，把具体实现的选择与初始化细节集中起来。策略关注同一个业务行为可以有不同实现，让调用方通过统一约定执行。

比如上传支持本地和对象存储，可以由工厂或注册表根据配置取得对应实现，再由上传服务调用统一的 save 方法。上传服务不必知道每种实现怎么连接和保存。

因此，两者不是互斥关系。工厂可以负责提供策略，策略负责执行行为。

实际设计时，我会先确认是否真的存在多种可替换行为，以及创建过程是否复杂。只有两个简单分支时，不一定需要堆出很多类；但如果调用处反复判断具体类型，通常说明选择职责还没有收好。

![工厂取得实现，策略执行行为](https://note.lgdsunday.club/img/Q361/01-overview.webp)

*图：工厂取得实现，策略执行行为。*

## 知识点详解：把创建选择与行为变化分别放好

### 从上传服务找出两个变化点

假设系统支持本地存储和对象存储。两者都能保存文件，但初始化参数不同：本地需要目录，对象存储需要客户端及桶配置。

第一个变化点是“如何取得一个可用的存储实现”。第二个变化点是“保存文件的行为如何执行”。把两者分开，上传业务才能只处理文件校验和调用。

如果每个调用处都重复判断存储类型、读取配置并创建客户端，新增一种实现就要到处修改。工厂负责收拢这部分创建和选择过程。

### 用一份小实现，看两种职责怎样配合

下面只展示职责，不执行真实存储 I/O。函数本身也可以作为策略，不必强行创建很多类。

#### TypeScript

```ts
type Saver = (name: string) => string;
const savers: Record<string, Saver> = {
  local: (name) => "local/" + name,
  cloud: (name) => "cloud/" + name,
};
function getSaver(kind: string): Saver {
  const saver = Object.hasOwn(savers, kind) ? savers[kind] : undefined;
  if (!saver) throw new Error("unsupported storage");
  return saver;
}
const saveFile = getSaver("cloud");
console.log(saveFile("report.pdf"));
```

#### Python

```python
savers = {
    "local": lambda name: "local/" + name,
    "cloud": lambda name: "cloud/" + name,
}

def get_saver(kind):
    if kind not in savers:
        raise ValueError("unsupported storage")
    return savers[kind]

save_file = get_saver("cloud")
print(save_file("report.pdf"))
```

getSaver/get\_saver 集中选择实现，属于工厂或提供器职责；取得的可调用对象，表达不同的保存策略。这是一个简化注册表，不等于已经展示了所有工厂模式变体。

### 别把简单工厂、工厂方法和抽象工厂混为一谈

简单工厂可以集中按参数选择对象。工厂方法通常通过可覆盖的创建方法，让具体创建延后到相应实现。抽象工厂则关注一组相互配套的产品创建。

它们都与创建有关，但解决的问题不同。面试不能看到一个 get 方法就直接宣布“这一定是抽象工厂”。

策略则关注行为替换：调用方依赖统一接口或函数约定，具体行为可以独立变化。实现对照可参考项目源码中的 [Factory Method](https://github.com/iluwatar/java-design-patterns/tree/master/factory-method) 与 [Strategy](https://github.com/iluwatar/java-design-patterns/tree/master/strategy)。

### 统一接口，还要统一行为契约

即使两个实现都有 save，也要说明它们返回什么、异常怎么表达、是否覆盖已有文件，以及操作是否支持重复执行。

否则调用方虽然不再检查类型，却仍然要为每种实现写特殊分支，抽象只是改了名字。

工厂还需要决定实例生命周期。对象存储客户端可能适合复用，本地操作也可能需要特定配置；不能每次调用都随意创建昂贵资源。

![接口一样，行为契约也要一致](https://note.lgdsunday.club/img/Q361/02-contract.webp)

*图：边界条件要在策略接口中约定清楚，而不是让每个实现各自定义一套行为。*

## 面试官继续追问

### 策略模式能完全消除 if else 吗？

不能，也没有必要。选择处可能仍然需要条件或注册表。目标是让选择集中、行为可替换，而不是禁止所有条件语句。

### Spring 注入实现后，还需要工厂吗？

如果容器已经提供固定实现，可以直接注入；如果需要按请求动态选择，可以使用明确的策略注册表。不要重复创建容器已有对象。

### 怎么测试是否设计过度？

看是否真的存在多种行为、变化是否频繁、调用处是否重复。少量稳定逻辑用简单函数也可能更清楚。

## 面试速记卡

> - 工厂：管理对象创建与取得。
> - 策略：管理同一行为的不同实现。
> - 配合方式：工厂提供策略，业务调用统一约定。
> - 统一接口：还要统一结果、异常和副作用契约。
> - 抽象尺度：围绕真实变化，不为了模式名称增加层次。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **百度 · 大模型生态集成 · 实习**：除了工厂模式，还了解哪些设计模式？（题意整理）。[面经来源](https://www.nowcoder.com/feed/main/detail/62d4ca9866d84d63bf6eafbb0a947bb8)；标题记录 2026 年 4 月；页面显示 04-22 编辑。
- **阿里巴巴 · Java后端 · 社招**：工厂、策略等设计模式分别怎样使用？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353157517968613376)；历史面经，面试年份未明确；页面编辑于 2024-07-19。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
