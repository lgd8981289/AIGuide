# 深信服开发面试真题及答案 · Sunday面试指南

[全部公司真题](./README.md) · [在线阅读](https://note.lgdsunday.club/companies/sangfor/development/)

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

## Java 面试题

- [Python 的垃圾回收机制是什么？引用计数为什么处理不了循环引用？](../backend/q547-python-reference-counting-garbage-collection.md)
  Python 垃圾回收如何处理循环引用？以 CPython 解释 del、引用计数与循环 GC，提供 Python 实验和 TypeScript 可达性对照，说明对象释放与进程内存下降不是同一件事。

## Python面试题

- [Python 正则的 match、search、fullmatch 有什么区别？如何避免只匹配到一部分？](../python/q601-python-regex-match-search-fullmatch.md)
  re.match 只尝试从字符串开头匹配，但不要求用完整个字符串。re.search 会寻找第一个匹配位置，适合从文本中抽取内容。re.fullmatch 要求整个字符串满足模式，更适合完整字段的格式检查。

## 计算机基础面试题

- [ARP 协议是什么？有了 IP 地址为什么还需要 MAC 地址？](../cs-basics/q678-arp-ip-mac-next-hop.md)
  ARP 协议是什么？还原 IPv4 以太网下寻找下一跳链路地址的过程和缓存作用。

