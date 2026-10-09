# 字节算法面试真题及答案 · Sunday面试指南

[全部公司真题](./README.md) · [在线阅读](https://note.lgdsunday.club/companies/bytedance/algorithm/)

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

## 大模型基础面试题

- [RoPE 旋转位置编码是什么？Transformer 为什么需要位置信息？](../llm/q382-rope-rotary-position-embedding.md)
  从 Q、K 旋转解释 RoPE 位置编码与相对位置关系，说明 Transformer 为什么需要位置，以及长度扩展和缓存坐标的边界。
- [MHA、MQA、GQA 有什么区别？为什么 GQA 能减少 KV Cache？](../llm/q383-mha-mqa-gqa.md)
  比较 MHA、MQA、GQA 的查询头与键值头关系，解释 GQA 如何减少 KV Cache，以及缓存比例、总显存和吞吐为何不能混为一谈。

## 计算机基础面试题

- [合并区间怎么做？为什么要先按区间左端点排序？](../cs-basics/q491-merge-intervals.md)
  提供 TS、Python 合并区间实现，解释左端点排序、包含关系与不变条件，区分闭区间和半开区间，分析最后追加、输入校验及时间空间复杂度。

