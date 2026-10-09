# Promise.all、allSettled、race、any 有什么区别？失败后其他任务会停止吗？

[字节前端面试真题](../companies/bytedance-frontend.md) · [腾讯前端面试真题](../companies/tencent-frontend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q120-promise-concurrency-methods/) · [题库目录](../../README.md)

<!-- 以下对话为教学模拟，非真实面经。 -->

🧑‍💻 面试官：Promise.all 里有一个请求失败，剩下的请求会怎样？

🙋‍♂️ 我：all 返回的 Promise 会失败。

🧑‍💻 面试官：失败，是不是意味着其他请求也被取消了？

🙋‍♂️ 我：不是，其他请求可能还在运行。

🧑‍💻 面试官：那三个备用地址里，最先成功的结果和最先返回的结果，应该分别用什么方法？

> 这四个方法先看「什么条件算结束」，再看失败怎么汇总；聚合 Promise 结束，不等于底层任务取消。

## 面试速答（60 秒版）

Promise.all 要求全部成功，只要有一个失败，聚合结果就会失败。适合几个结果缺一不可的情况，例如页面必须同时拿到配置和权限。

allSettled 会等所有任务有结果，再分别给出成功或失败，适合允许局部失败、需要完整报告的批量处理。

race 接受最先完成的任务，不管它成功还是失败；any 则等待第一个成功，只有全部失败才整体失败。因此，抢最快响应和找一个可用响应，条件不同。

还要知道，Promise 本身不是取消工具。all 提前失败、race 已经返回以后，其他网络请求可能继续执行。需要取消时，必须结合请求 API 的取消能力，并处理已经发生的操作。

![四种 Promise 聚合方法采用不同的结束与失败条件](https://note.lgdsunday.club/img/Q120/00-60s-overview.webp)

## 知识点详解：几个请求一起跑，到底等谁、返回什么？

### 把四个方法放进同一个加载场景

假设页面同时请求用户资料、通知和推荐内容。资料失败就不能进入页面，推荐失败却可以先显示其他内容。

如果简单把三个请求全部放进 all，一个推荐错误就会让聚合结果失败。这个行为没有错，只是咱们把“可选内容”写成了“必须成功”。

先把任务之间的关系说清楚，再选方法。请求是互相独立的，也不等于结果都可以被忽略。

### 用结束条件比较，比背名称更直接

| 方法         | 成功条件     | 失败条件         | 结果组织                  |
| ---------- | -------- | ------------ | --------------------- |
| all        | 全部成功     | 任意一个失败       | 按输入顺序返回值              |
| allSettled | 全部完成状态变化 | 普通任务失败记录在结果中 | 按输入顺序返回状态             |
| race       | 第一个完成成功  | 第一个完成失败      | 第一个完成的状态与值            |
| any        | 任意一个成功   | 全部失败         | 首个成功值或 AggregateError |

allSettled 的“完成”包括成功和失败，不是把错误假装成成功。输入迭代本身等异常，也不能因此宣布任何调用都绝不会拒绝。

另外，输入数组的顺序和请求完成的顺序不同。all 的结果可以保持输入顺序，即使后面的请求先回来。

### 聚合方法不负责启动所有工作

调用一个 async 函数，或者创建网络请求时，相应工作就可能已经开始了。Promise.all 接收这些 Promise，并观察它们的状态，并不是一个自动分配线程的任务调度器。

```typescript
const jobs = [
  Promise.resolve("profile"),
  Promise.reject(new Error("recommendation unavailable")),
];
const results = await Promise.allSettled(jobs);
console.log(results.map(result => result.status));
// ["fulfilled", "rejected"]
```

这段展示 JavaScript 的 Promise API。Python 的 asyncio.gather、wait 有自己的任务与取消规则，不能把它们标成四种 Promise 方法的逐行对应版本。

如果需要限制一次只执行五个任务，还得另做并发控制。给一万个请求套一层 all，不会自动变成安全的五路执行。

### 最快返回与第一个可用，不是一回事

假设两个备用服务，一个很快返回错误，另一个稍后返回正确结果。race 会先得到错误；any 可以继续等成功。

但 any 成功以后，其他请求不会因此自动停止。如果只是只读查询，可以主动取消不需要的剩余请求，省掉资源。涉及写操作时，取消客户端等待也不代表服务端动作没有完成。

超时也有类似问题。race 一个请求和定时器，可以限制咱们等待多久，却没有自动限制请求在后端执行多久。验收时要同时看返回结果和仍在运行的工作。

本题机制参考：[MDN Promise 并发方法](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)。

![聚合 Promise 已经返回时，未被明确取消的其他请求仍可能继续](https://note.lgdsunday.club/img/Q120/01-detail.webp)

## 面试官继续追问

### 传空数组时会怎样？

all 和 allSettled 的聚合状态可以成功，any 会以 AggregateError 失败，race 会保持等待。处理通用输入时，要单独考虑空集合。

### all 失败以后，怎么保留已经成功的部分？

可以用 allSettled，或者逐项保存结果。选择取决于是否允许部分成功，而不是给 all 的 catch 再补一句忽略错误。

### all 是 CPU 并行计算吗？

不是。它聚合异步状态，不会把主线程上的重计算自动交给多个 CPU。执行模型和结果汇总需要分开说明。

## 面试速记卡

> - all：缺一不可，任意失败会使聚合失败。
> - allSettled：等到全部有状态，保留每项成败。
> - race：要最先完成，成功失败都算。
> - any：要第一个成功，全部失败才报聚合错误。
> - 取消：聚合结束后，剩余任务仍可能运行。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **字节跳动 · 前端 · 社招**：Promise.all 与其他组合方法怎样使用？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/786037843704479744)；原帖编辑于 2025-09-01。
- **腾讯 · 前端 · 原帖未明确批次**：怎样手写 Promise.all？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/529319096907726848)；腾讯面试记录为 2023-08-28、2023-08-30；原帖编辑于 2023-09-07。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
