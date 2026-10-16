# 每日温度怎么用单调栈解决？为什么每个元素最多入栈、出栈一次？

[瀚博半导体开发面试真题](../companies/vastai-development.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/cs-basics/q683-daily-temperatures-monotonic-stack/) · [题库目录](../../README.md)

*下面是用于讲题的模拟面试对话。*

🧑‍💻 **面试官：** 每天要等几天，才会遇到更高温度，怎么求？

🙋‍♂️ **我：** 从每一天往后找第一个更暖的日子。

🧑‍💻 **面试官：** 如果温度一直下降，你会重复检查多少次？

🙋‍♂️ **我：** 可能到 O(n²)，需要让没等到答案的日期集中等待。

🧑‍💻 **面试官：** 栈里放温度还是下标？相同温度能帮前一天结束等待吗？

> 栈里保存“还没等到更暖一天”的下标。新温度到来，只结算那些确实被它超过的旧日期。

## 面试速答（60 秒版）

用单调栈保存尚未找到答案的日期下标，从栈底到栈顶，对应温度保持不升，也就是允许相同温度留下。

遍历到第 i 天，如果当天温度大于栈顶日期的温度，就弹出那个日期 j，答案为 i-j。持续处理，直到栈空或当前温度不再更高，再把 i 入栈。

因为按日期从前到后扫描，这次弹出时遇到的就是第一个更暖日期。没被弹出的日期最终保持 0，表示后面没有符合条件的日子。

每个下标最多入栈、出栈一次，所以两层循环的总操作量是 O(n)，额外空间 O(n)。比较必须是严格大于，相等不是更暖。

![单调栈，保存还没等到升温的日期](https://note.lgdsunday.club/img/Q683/01-daily-temperatures-monotonic-stack.webp)

## 知识点详解：新的一天，能替哪些旧日期结账？

### 下标同时保存日期与温度入口

假设温度为 `[70,71,69,72]`。第 1 天的 71，让第 0 天结束等待；第 3 天的 72，又同时让第 2 天和第 1 天得到答案。

所以结果是 `[1,2,1,0]`。72 自己后面没有更暖的一天，保留 0。[LeetCode 739 原题](https://leetcode.cn/problems/daily-temperatures/)要求的就是等待天数，而不是温度差。

栈中保存下标，就既能通过原数组取温度，又能用 i-j 算间隔。只存温度，会丢掉计算等待时间需要的位置。

### 被挡在下面的日期，为什么不用先检查？

栈顶是最近进入、还没等到更暖日期的位置。若新温度连栈顶都没超过，下面不比栈顶更冷的日期，也不会被它解决。

反过来，超过栈顶就可以弹出。弹出以后再看新的栈顶，可能还可以继续结算。维护“不升”的温度顺序，正是为了让这个判断成立。

相同温度不能出栈，因为题目要严格更高。两个相同温度都留着，后面真正升温时，再分别计算不同等待天数。

![新温度替旧日期结账](https://note.lgdsunday.club/img/Q683/02-daily-temperatures-monotonic-stack.webp)

### 循环里弹很多次，总量仍然有限

#### TypeScript

```typescript
function dailyTemperatures(temperatures: number[]): number[] {
  const answer = Array(temperatures.length).fill(0);
  const stack: number[] = [];
  for (let i = 0; i < temperatures.length; i++) {
    while (stack.length > 0 &&
           temperatures[i] > temperatures[stack[stack.length - 1]]) {
      const day = stack.pop()!;
      answer[day] = i - day;
    }
    stack.push(i);
  }
  return answer;
}
```

#### Python

```python
def daily_temperatures(temperatures: list[int]) -> list[int]:
    answer = [0] * len(temperatures)
    stack: list[int] = []
    for i, current in enumerate(temperatures):
        while stack and current > temperatures[stack[-1]]:
            day = stack.pop()
            answer[day] = i - day
        stack.append(i)
    return answer
```

某一轮可能弹出很多日期，但弹出以后就不会再次入栈。把所有轮次加起来，最多 n 次入栈和 n 次出栈，因此不能仅凭代码里有 while 套 for 就判 O(n²)。

## 面试官继续追问

### 为什么得到的是第一个更暖日，而不是随便一个？

扫描严格按日期推进。某日期尚在栈中，就说明之前扫描过的后续日期都没有解决它；第一次能让它弹出的当前日，就是最近的符合条件日期。

### 哪些输入最值得测？

全相等检查严格比较，单调下降检查未解决项，最后一天突然升高检查一次弹很多项。再用逐日向后查找的短输入基准对拍，检查的是距离而不是温差。

## 面试速记卡

> - 栈中：还没等到更暖日的下标。
> - 单调性：温度从底到顶不升，相同温度可以同时等待。
> - 弹出：当前温度严格更高，距离就是 i-j。
> - 正确性：按日期推进，第一次解决就是最近更暖日。
> - 复杂度：每个下标最多进出一次，时间 O(n)、空间 O(n)。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **瀚博半导体 · GPU驱动开发 · 原帖未明确批次**：怎样解决每日温度问题？（题意整理）。[面经来源](https://www.nowcoder.com/feed/main/detail/c026920386c446039dd750b08ed7cd18)；原帖发布于 2023-03-24。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
