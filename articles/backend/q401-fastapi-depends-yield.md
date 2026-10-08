# FastAPI 的 Depends 是怎么工作的？为什么数据库依赖通常使用 yield？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q401-fastapi-depends-yield/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：Depends 是不是帮你创建一个全局对象？

🙋‍♂️ 我：它会把数据库连接注入接口，应该可以这样理解。

🧑‍💻 面试官：两个请求能共用一个数据库 Session 吗？yield 后面的关闭代码什么时候运行？

🙋‍♂️ 我：应该在接口函数返回以后吧。

🧑‍💻 面试官：如果返回 StreamingResponse，正文还在读取数据库呢？你运行的 FastAPI 版本又有什么影响？

> Depends 负责准备依赖，yield 负责围绕使用过程安排资源清理。清理时机取决于依赖范围和框架版本，不是一个永远固定的答案。

## 面试速答（60 秒版）

Depends 声明的是接口需要哪些依赖。FastAPI 根据依赖关系调用相应函数，处理参数和子依赖，再把结果交给接口。

同一请求中，相同依赖通常会复用已经得到的结果；这不等于跨请求的全局单例，也不意味着数据库 Session 可以给多个并发请求共用。

依赖使用 yield 时，前面的代码负责准备资源，yield 把资源交出去，后面的 finally 等代码负责清理。

按当前官方文档，yield 依赖默认是 request 范围，退出代码在响应发送后运行；function 范围则在接口函数结束后、响应发送前清理。流式响应是否还要使用资源，是选择范围的重要依据。上线前必须核对项目实际版本。

![yield依赖的清理时机取决于函数scope和请求scope](https://note.lgdsunday.club/img/Q401/01-depends-yield-overview-v2.webp)

## 知识点详解：沿着一次请求看资源怎样进入和退出

### 依赖不只是“把参数填进去”

假设接口需要“当前用户”和“数据库 Session”。当前用户依赖还可能需要令牌解析，令牌解析又依赖请求头。

FastAPI 会按依赖图组织这些调用，让前置依赖先得到结果，再调用依赖它的函数。依赖本身也可以声明和校验请求参数，接口不必把所有准备工作写进一个大函数。

同一请求内的缓存可以避免相同依赖重复计算；需要重新执行时，可以按框架提供的选项控制。但请求内复用不等于把依赖结果长期保存在全局。

![FastAPI依赖图中的请求内缓存不是跨请求全局单例](https://note.lgdsunday.club/img/Q401/02-dependency-cache.webp)

### yield 把资源的生命周期放到一起

下面只演示资源进入与清理，不连接真实数据库：

**Python（FastAPI 的 yield 依赖）：**

```python
from typing import Annotated
from fastapi import Depends, FastAPI

app = FastAPI()

class Resource:
    def close(self) -> None:
        print("关闭资源")

def get_resource():
    resource = Resource()
    try:
        yield resource
    finally:
        resource.close()

@app.get("/demo")
def demo(resource: Annotated[Resource, Depends(get_resource)]):
    return {"ok": True}
```

yield 之前创建资源，yield 交出资源，finally 保证进入退出过程时安排清理。真实数据库需要按库的要求处理事务、回滚和关闭，关闭 Session 不等于自动正确提交业务事务。

FastAPI 是 Python 框架，没有一份同名 TypeScript Depends 官方实现。下面仅对照“使用资源后清理”的职责，不模拟 FastAPI 依赖图或响应发送范围。

**TypeScript（通用资源管理示意）：**

```typescript
type Resource = { close(): Promise<void> };

async function withResource<T>(
  open: () => Promise<Resource>,
  use: (resource: Resource) => Promise<T>,
): Promise<T> {
  const resource = await open();
  try {
    return await use(resource);
  } finally {
    await resource.close();
  }
}
```

这个函数在 use 完成后清理。如果 use 只是返回一个稍后才消费的流，它就可能过早关闭资源。不要把这段通用代码当成完整的流式接口管理方案。

### “函数返回”和“响应发完”不是一回事

普通 JSON 接口看起来很快，容易把两个时刻当成同一个。流式响应却可能在接口函数返回以后，继续读取数据并发送内容。

按 [当前 FastAPI 文档](https://fastapi.tiangolo.com/tutorial/dependencies/dependencies-with-yield/)，默认 request 范围包含响应发送过程；function 范围只包围接口函数执行。

如果生成流的过程仍需要数据库资源，不能提前关闭它。如果资源只是用来做一次权限检查，后面的流不再依赖它，则可以考虑更早释放，减少长时间占用。

相关行为在历史版本中有过调整，所以查文档时要对照安装版本，而不是只背“yield 总在返回后关闭”。

### 异常和后台任务也要明确边界

业务异常可能传回 yield 依赖的退出过程。捕获后不能默默吞掉，让本该失败的请求看起来正常；需要按实际事务和错误处理规则重新抛出或转换异常。

后台任务也不应依赖一个生命周期已经结束的请求资源。更合适的是传递必要的 ID 等数据，由后台任务建立自己的资源和事务范围。

![后台任务不能依赖可能已经清理的请求资源](https://note.lgdsunday.club/img/Q401/03-background-resource.webp)

## 面试官继续追问

### 每个请求一定只调用依赖一次吗？

默认请求内复用有相应规则，但 use\_cache 等配置可以改变行为，依赖声明本身也会影响组织方式。不能脱离具体声明保证次数。

### yield 能自动保证事务成功吗？

不能。资源清理、事务提交和业务成功不是同一个概念。提交失败、回滚、重试等仍需要按数据库和业务规则设计。

### 同步和异步依赖能混用吗？

FastAPI 支持相应组织方式，但同步依赖不会让里面的阻塞操作变成异步。线程池、异步驱动和资源类型仍要匹配。

## 面试速记卡

> - Depends：组织依赖图，为接口提供需要的值。
> - 请求内缓存：不是跨请求全局单例。
> - yield：准备资源、交出资源、安排退出清理。
> - 范围差异：function 围绕接口函数，request 包含响应发送过程。
> - 工程边界：清理不等于提交，流与后台任务不能误用已经关闭的资源。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
