# React 的 useReducer 是什么？和 useState 有什么区别，异步请求应该写在哪里？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q303-react-usereducer/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：useReducer 和 useState 有什么区别？

🙋‍♂️ 我：useReducer 把状态变化集中在 reducer 里，根据 action 计算新状态。

🧑‍💻 面试官：提交表单有 loading、error、data，用三个 state 不行吗？

🙋‍♂️ 我：可以，但需要避免几份状态被更新成互相矛盾的组合。

🧑‍💻 面试官：那请求直接写进 reducer，是不是更集中？开发模式重复执行，会不会提交两次？

> 集中的是「状态怎样变化」，不是把所有工作塞进一个函数。

## 面试速答（60 秒版）

useState 适合直接更新相对简单的状态。useReducer 接收 state 和 action，由 reducer 统一计算下一份状态，适合多个字段需要按同一规则一起变化的功能。

reducer 应该是纯函数，不修改原状态，也不在里面请求接口、写存储或启动计时器。请求由事件处理等副作用位置发起，再把成功或失败交给 reducer。

它不会自动让状态成为全局状态，也不会自动提高性能。真正的收益是状态转换更集中、更容易单独测试。表单还要定义提交中能不能再次提交、旧请求能不能覆盖新结果，这些约束需要自己写出来。

![状态转换交给 reducer](https://note.lgdsunday.club/img/Q303/01-overview.webp)

*图：状态转换交给 reducer。*

## 知识点详解：三个布尔值，怎样变成一组矛盾？

### 先把表单允许的状态讲清楚

假设表单有「编辑中、提交中、成功、失败」四个阶段。如果分别保存 loading、success、error，代码可能忘了清除上次错误，出现既成功又失败的显示。

这不说明 useState 不好，而是这些字段属于同一套转换。可以用一个明确的 status，再让对应的数据和错误跟着阶段变化。

### reducer 收到的是事件，不是执行命令

例如 submit 把状态改成 submitting，success 保存结果，failure 保存错误。reducer 根据当前状态判断某个 action 是否合理；提交中重复 submit 可以返回原状态。

[useReducer 官方文档](https://react.dev/reference/react/useReducer)规定了参数、更新行为和纯函数要求。dispatch 请求的是下一轮状态，当前事件函数不会因此立即得到新快照。

![接口调用在 reducer 外](https://note.lgdsunday.club/img/Q303/02-effects.webp)

*图：接口调用在 reducer 外。*

### 用一个纯函数演示转换

下面是同一规则的 TypeScript 与 Python 实现。Python 版只是纯状态转换函数，不是 React Hook。

#### TypeScript

```ts
type State = { status: 'editing' | 'submitting' | 'success' };
type Action = { type: 'submit' | 'success' | 'reset' };
function reducer(state: State, action: Action): State {
  if (action.type === 'reset') return { status: 'editing' };
  if (action.type === 'submit' && state.status === 'editing')
    return { status: 'submitting' };
  if (action.type === 'success' && state.status === 'submitting')
    return { status: 'success' };
  return state;
}
```

#### Python

```python
def reducer(state, action):
    if action == 'reset':
        return {'status': 'editing'}
    if action == 'submit' and state['status'] == 'editing':
        return {'status': 'submitting'}
    if action == 'success' and state['status'] == 'submitting':
        return {'status': 'success'}
    return state
```

为了看清转换，示例只保留三种状态。实际表单还要加入失败、取消与请求身份，不要直接把这个最小模型当成完整提交方案。

### 为什么不能在里面调用接口？

同样的输入应得到同样的状态结果，React 才能安全调用 reducer。请求却会修改外部世界，可能成功、失败或重复发生，不符合这个约束。

因此，事件处理发起请求，结果回来以后 dispatch 对应 action。如果允许重置后再次提交，就要给请求一个身份，旧请求回来时先检查归属。仅凭「当前是 submitting」不一定能分清两次提交。

测试也可以离开组件：给定状态和 action，检查输出状态、原对象没有被修改、无效转换没有进入不允许的阶段。之后再验证组件的请求与显示，不用把所有错误都留到点击页面时才发现。

## 面试官继续追问

### 开发模式 reducer 调用两次，为什么不应产生两份结果？

严格模式会用额外调用检查纯函数，React 会忽略其中一次结果。纯计算没问题，外部副作用却可能已经发生，所以不能写在里面。

### reducer 一定要返回新对象吗？

状态改变时通常返回新对象；没有变化可以返回原对象。直接改原对象再返回，会让更新判断和历史状态都变得不可靠。

### 它能替代 Redux 吗？

它处理的是当前组件的状态转换。共享范围、订阅、开发工具等是另外的需求，不能只因函数形状相似就认为两者等价。

## 面试速记卡

> - useReducer：集中同一功能的状态转换。
> - action：描述发生了什么，由规则计算下一状态。
> - 纯函数：不修改旧状态，不执行外部副作用。
> - 请求：在副作用位置执行，结果按身份回填。
> - 测试：有效转换、无效转换与原状态不变分开检查。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
