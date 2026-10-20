# 最小覆盖子串怎么求？重复字符为什么必须按数量匹配？

[字节测试开发面试真题](../companies/bytedance-test-development.md) · [虾皮后端面试真题](../companies/shopee-backend.md) · [腾讯后端面试真题](../companies/tencent-backend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/cs-basics/q752-minimum-window-substring-counts/) · [题库目录](../../README.md)

*以下对话为教学模拟，用来讲解这道题。*

🧑‍💻 面试官：找出 s 中包含 t 全部字符的最短子串，你会怎样做？

🙋‍♂️ 我：滑动窗口，用 Set 记录目标字符，全部出现了就收缩。

🧑‍💻 面试官：t 是 AAB，窗口只有 AB，Set 看起来齐了，实际上够吗？

🙋‍♂️ 我：不够，还缺一个 A，需要记录数量。

🧑‍💻 面试官：那窗口已经有三个 A，删除一个以后，应该立即变成不合法吗？

> 覆盖关心的是“还缺几份”，不只是“出现过哪些字符”。多出来的字符可以删，删到缺少时才必须停止收缩。

## 面试速答（60 秒版）

最小覆盖子串需要满足目标字符的数量要求。t 里有两个 A，窗口也至少需要两个 A，所以不能只用 Set。

先统计目标中每个字符的需求量，再向右扩张窗口。拿到一个仍然缺少的字符，就减少未满足的总数；总数降到 0，说明窗口已经合法。

这时不断移动左边界，尝试缩短窗口，并记录最短结果。移走多余字符不影响合法性；移走一个刚好够用的目标字符，窗口重新出现缺口，就停止收缩，继续向右寻找。

两个边界都只向前移动，配合计数表，时间是 O(|s|+|t|)，额外空间由目标中的不同字符数决定。没有合法窗口返回空串，空目标也要明确返回约定。

![最小覆盖窗口必须满足目标重复计数](https://note.lgdsunday.club/img/Q752/01-min-window-overview.webp)

## 知识点详解：窗口什么时候能缩，什么时候必须停？

### 先规定“覆盖”是什么意思

假设目标是 `AAB`。`AB` 不够，`AAAB` 足够，`BAA` 也足够。子串内部不需要保持 t 的字符顺序，但必须连续，并满足每一种字符的数量。

因此，这道题和最长无重复子串不同。后者发现重复以后收缩，本题则是满足目标以后收缩。两者都叫滑动窗口，移动条件却不能照搬。

咱们用一张缺口表记录还需要多少个字符。初始 A 为 2，B 为 1，总共缺 3 份。窗口每获得一个需要的字符，就填上一份缺口。

当 A 已经够用，再收到 A，计数可以变为负数。负数不表示程序出错，它表示窗口多了一份，以后可以先删掉这一份而不破坏覆盖。

![need负数表示可移除的多余字符](https://note.lgdsunday.club/img/Q752/02-deficit-surplus-counts.webp)

### 沿着一个例子收缩

s 取 `ABAAC`，t 取 `AAC`。右边界读到最后的 C，整个 `ABAAC` 首次满足两个 A、一个 C。

左边第一个 A 可以删，因为窗口还有两个 A；接下来的 B 根本不在目标里，也可以删。此时得到 `AAC`，长度 3。

如果再删一个 A，就只剩 `AC`，不够两个 A 了。这时停止收缩。下一轮需要右边再带来一个 A，才可能重新满足。

记录答案要发生在窗口仍然合法时，而不是先删掉必要字符，再拿已经不合法的窗口更新最短值。

![ABAAC中AAC目标的收缩步骤](https://note.lgdsunday.club/img/Q752/03-shrink-aac.webp)

### 让 missing 表示“尚未补齐的份数”

下面按题目常见的 ASCII 字母输入实现，两种语言的字符索引口径一致。相同最短长度时保留第一次找到的窗口；空目标返回空串，输入不被修改。

#### TypeScript

```ts
function minWindow(s: string, t: string): string {
  if (t.length === 0) return "";
  const need = new Map<string, number>();
  for (const ch of t) need.set(ch, (need.get(ch) ?? 0) + 1);
  let missing = t.length, left = 0;
  let bestStart = 0, bestLength = Infinity;
  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    if (need.has(ch)) {
      const count = need.get(ch)!;
      if (count > 0) missing--;
      need.set(ch, count - 1);
    }
    while (missing === 0) {
      if (right - left + 1 < bestLength) {
        bestStart = left;
        bestLength = right - left + 1;
      }
      const removed = s[left++];
      if (need.has(removed)) {
        const count = need.get(removed)! + 1;
        need.set(removed, count);
        if (count > 0) missing++;
      }
    }
  }
  return bestLength === Infinity ? "" : s.slice(bestStart, bestStart + bestLength);
}
```

#### Python

```python
from collections import Counter

def min_window(s, t):
    if not t:
        return ""
    need = Counter(t)
    missing, left = len(t), 0
    best_start, best_length = 0, float("inf")
    for right, ch in enumerate(s):
        if ch in need:
            if need[ch] > 0:
                missing -= 1
            need[ch] -= 1
        while missing == 0:
            if right - left + 1 < best_length:
                best_start = left
                best_length = right - left + 1
            removed = s[left]
            left += 1
            if removed in need:
                need[removed] += 1
                if need[removed] > 0:
                    missing += 1
    return "" if best_length == float("inf") else s[best_start:best_start + best_length]
```

注意右边加入字符时，先看旧计数是否大于 0，再扣减 missing；左边移走字符时，先恢复计数，再看它是否变成正数。两个判断对应的是“填上缺口”和“重新产生缺口”。

### while 里还有循环，为什么仍然线性？

right 最多前进 |s| 次，left 同样最多前进 |s| 次。某一轮收缩很多，不代表每一轮都从头扫描；已经离开的字符不会被 left 再处理一次。

初始化需求表还需要 O(|t|)。在计数表查找按常数时间分析的前提下，总时间为 O(|s|+|t|)，而不是 O(|s|²)。题目定义与重复计数要求见 [LeetCode 76](https://leetcode.com/problems/minimum-window-substring/)。

## 面试官继续追问

### 可以把 missing 改成“已满足的字符种类数”吗？

可以，但更新条件也必须一起改变。某字符数量跨过“刚好满足”的门槛时才调整种类数。不能让变量定义按种类，更新时却按每个字符递减。

### 如果输入包含 emoji 呢？

先定义字符单位。JavaScript 下标按 UTF-16 码元，Python 字符串通常按 Unicode 码点；用户感知字符还可能包含多个码点。需要统一分词或分段单位，再改计数与切片，不能直接声称这两份 ASCII 示例已经覆盖所有 Unicode 场景。

### 怎么测重复计数？

至少测 AB 对 AAB 无解、AAAB 对 AAB 可删多余 A、ABAAC 对 AAC 得到 AAC，以及空目标和大小写不同。小输入枚举全部子串，比较最短合法答案，能抓出“少算一份”和“多缩一步”。

## 面试速记卡

> - 覆盖条件：每个目标字符的数量都足够，不是只出现一次。
> - 扩张：收到仍缺的字符，missing 减一。
> - 收缩：合法时更新答案，删到重新缺少才停止。
> - 负数计数：表示多余份数，不应立即判错。
> - 复杂度：两端单调前进，时间 O(|s|+|t|)。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **字节跳动 · 测试开发 · 实习**：怎样求最小覆盖子串？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353157801662947328)；原帖编辑于 2021-04-18。
- **虾皮 · Java开发 · 校招提前批**：怎样求最小覆盖子串？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353158096702873600)；原帖发布于 2021-07-15。
- **腾讯 · 后台开发（广告） · 实习**：怎样求最小覆盖子串？（题意整理）。[面经来源](https://www.nowcoder.com/feed/main/detail/af7578c21bd24530bd8db37694fdc2b0)；原帖发布于 2024-03-21。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。
