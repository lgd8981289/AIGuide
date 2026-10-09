# 三数之和怎么去重？排序加双指针为什么能做到 O(n²)？

[美团AI应用开发面试真题](../companies/meituan-ai-application.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/cs-basics/q490-three-sum-two-pointers/) · [题库目录](../../README.md)

*以下对话为教学模拟，不是真实面经。*

🧑‍💻 面试官：三数之和，怎样避免返回重复组合？

🙋‍♂️ 我：三重循环找出来，再用集合去重。

🧑‍💻 面试官：能把时间降到 O(n²) 吗？排序以后，哪些位置需要跳过重复值？

> 先把一个数固定，剩下两数用有方向的指针查找；去重跟着每一层的选择发生。

## 面试速答（60 秒版）

三数之和可以先排序，再逐个固定第一个数，用左右指针寻找另外两个数。

和小于目标，左指针右移；和大于目标，右指针左移；等于目标，就保存结果并跳过左右重复值。固定数也需要跳过重复，避免再次产生同一组数值。

排序后每次双指针扫描是线性的，外层固定数进行 O(n) 次，所以总时间通常为 O(n²)，比三重循环更低。

还要区分题目要求的是不同下标还是不同数值组合。经典题需要三个不同下标，但结果按数值组合去重。返回结果的空间和排序实现的额外空间，也不能直接忽略。

![速答总览：三数之和利用排序确定指针方向，在固定数与命中两层去重，保留不同下标的重复值。](https://note.lgdsunday.club/img/Q490/01-overview.webp)

## 知识点详解：指针为什么能移动，重复为什么能跳过

### 排序让大小变化有了方向

咱们使用经典目标 0。固定 nums\[i] 后，寻找 nums\[left] + nums\[right] = -nums\[i]。

数组有序时，如果三个数之和太小，继续把右指针左移只会更小，所以需要移动左指针增大候选。和太大时，移动右指针减小候选。

这不是随便试两个方向，而是利用有序性排除不可能的范围。[三数之和原题](https://leetcode.cn/problems/3sum/)要求返回不重复的数值三元组，三个位置必须不同。

### 去重，分别发生在固定数和命中以后

外层如果当前固定数与前一个相同，就跳过，因为前一轮已经处理过这个数值作为第一项的组合。

命中以后，左右两边相同的数值也需要跨过去，否则下一轮可能再次得到同一组结果。没命中时，普通单步移动已经保持查找正确性；无需为了去重破坏方向。

#### TypeScript

```typescript
function threeSum(input: number[]): number[][] {
  const nums = [...input].sort((a, b) => a - b);
  const result: number[][] = [];
  for (let i = 0; i < nums.length - 2; i++) {
    if (i > 0 && nums[i] === nums[i - 1]) continue;
    if (nums[i] > 0) break;
    let left = i + 1, right = nums.length - 1;
    while (left < right) {
      const sum = nums[i] + nums[left] + nums[right];
      if (sum < 0) left++;
      else if (sum > 0) right--;
      else {
        result.push([nums[i], nums[left], nums[right]]);
        const a = nums[left], b = nums[right];
        while (left < right && nums[left] === a) left++;
        while (left < right && nums[right] === b) right--;
      }
    }
  }
  return result;
}
```

#### Python

```python
def three_sum(values):
    nums = sorted(values)
    result = []
    for i in range(len(nums) - 2):
        if i > 0 and nums[i] == nums[i - 1]:
            continue
        if nums[i] > 0:
            break
        left, right = i + 1, len(nums) - 1
        while left < right:
            total = nums[i] + nums[left] + nums[right]
            if total < 0:
                left += 1
            elif total > 0:
                right -= 1
            else:
                result.append([nums[i], nums[left], nums[right]])
                a, b = nums[left], nums[right]
                while left < right and nums[left] == a:
                    left += 1
                while left < right and nums[right] == b:
                    right -= 1
    return result
```

这里复制后排序，不修改输入。JavaScript 示例默认数据是安全整数范围内的普通数值，不把浮点精确相等问题混入整数题。

### 用一个组合，观察指针怎样收拢

数组排序后为 \[-4, -1, -1, 0, 1, 2]。固定第一个 -1，左右指针开始对应另一个 -1 和 2，和为 0，得到 \[-1, -1, 2]。

随后跳过相同端点，继续检查 0 与 1，得到 \[-1, 0, 1]。外层到达第二个 -1 时直接跳过，不重新产生这两组结果。

注意两个 -1 可以同时出现在结果里，因为它们来自不同下标。去重不是把原数组重复元素全部删除，否则会丢失合法答案，例如 \[0, 0, 0]。

![固定第一个负一后命中两组结果](https://note.lgdsunday.club/img/Q490/02-two-pointer-walk.webp)

### 复杂度要把示例的复制也算进去

每个固定数对应一次左右指针收拢，指针不会在同一轮来回移动，因此扫描总量为 O(n²)。排序的 O(n log n) 通常不会超过这一主项。

这份实现复制了输入，所以至少有 O(n) 的额外存储；结果本身也需要空间。排序内部空间取决于语言实现，不能无条件写“额外空间 O(1)”。

验证时应检查空数组、少于三个数、全零、没有答案、大量重复和正负混合。还可以对短数组用三重循环作为对照，确认结果集合相同且没有重复。

![允许重复数值但不重复使用下标](https://note.lgdsunday.club/img/Q490/03-values-vs-indices.webp)

## 面试官继续追问

### 为什么 nums\[i] 大于 0 可以结束？

目标为 0 且数组有序时，后面的数也不会更小，三个数不可能再凑成 0。换成其他目标需要调整判断。

### 能先把重复元素删掉吗？

不能。一个合法组合可能需要两个或三个相同数值，但来自不同位置。

### 换成任意 target 怎么办？

指针移动依据改成与 target 比较；固定数的提前终止也要重新推导，不直接保留大于 0 的条件。

## 面试速记卡

> - 主方法：排序，固定一个数，另外两个双指针。
> - 移动依据：和小左移进，和大右移退。
> - 去重位置：固定数去重，命中后跳过重复端点。
> - 下标边界：允许相同数值，必须来自不同位置。
> - 复杂度：O(n²)，复制输入和结果空间单独计入。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **美团 · AI应用开发 · 原帖未明确批次**：怎样实现三数之和？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/870623192925167616)；标题记录 3 月 30 日面试，页面显示 04-06 发布；未明确年份。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
