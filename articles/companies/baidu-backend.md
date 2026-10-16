# 百度后端面试真题及答案 · Sunday面试指南

[全部公司真题](./README.md) · [在线阅读](https://note.lgdsunday.club/companies/baidu/backend/)

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

## Java 面试题

- [BeanFactory 和 FactoryBean 有什么区别？为什么 getBean 可能拿到不同对象？](../backend/q520-beanfactory-vs-factorybean.md)
  BeanFactory 和 FactoryBean 有什么区别？用容器、工厂和产品三个对象解释 getBean 的返回结果，并说明产品单例缓存与初始化、销毁职责的边界。
- [CopyOnWriteArrayList 是什么？为什么适合读多写少的场景？](../backend/q521-copyonwritearraylist-read-write-snapshots.md)
  CopyOnWriteArrayList 为什么适合读多写少？图解复制数组、发布新版本和迭代器快照，区分结构快照与元素状态，再说明频繁写入和大列表的成本。
- [HashMap 底层怎么实现？put、扩容和链表转红黑树经历了什么？](../backend/q652-java-hashmap-put-resize-treeify.md)
  HashMap 底层怎么实现？沿一次写入追踪桶定位、冲突处理、树化条件与扩容迁移。

## Go面试题

- [Go 逃逸分析是什么？变量什么时候分配到堆上？](../go/q673-go-escape-analysis-stack-heap.md)
  Go 逃逸分析是什么？把变量生命周期、编译器分析和实际分配结果联系起来。

