# 华为开发面试真题及答案 · Sunday面试指南

[全部公司真题](./README.md) · [在线阅读](https://note.lgdsunday.club/companies/huawei/development/)

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

## Java 面试题

- [FastAPI、Flask 和 Django 有什么区别？Python 后端开发应该怎么选？](../backend/q550-fastapi-vs-flask-vs-django.md)
  比较FastAPI、Flask与Django的API开发、类型校验、ORM、后台和异步能力，解释async不等于自动高并发以及团队选型方法。
- [Java 的 Comparable 和 Comparator 有什么区别？多字段排序怎么实现？](../backend/q551-java-comparable-vs-comparator.md)
  区分Java Comparable与Comparator的自然顺序和外部策略，讲清多字段排序、比较器契约以及TreeSet把不同对象视为同项的原因。

## Python面试题

- [Python 的 LEGB 作用域是什么？global、nonlocal 和闭包变量怎么理解？](../python/q581-python-legb-global-nonlocal.md)
  LEGB 是理解普通函数名称查找的一种顺序。L 是当前函数，E 是包围它的外层函数，G 是所在模块，B 是内置名称。
- [Python 的单下划线、双下划线和双端下划线有什么区别？](../python/q592-python-underscore-name-mangling.md)
  单前导下划线通常表示内部使用的约定，不是强制私有权限。普通 from module import 也会受它影响，但显式导入仍可以访问；__all__ 还能明确导出名单。

## 系统设计面试题

- [SOLID 五大设计原则是什么？怎样判断代码需要拆分还是抽象？](../fullstack-system-design/q564-solid-design-principles.md)
  用通知模块串联SOLID五大原则，讲清单一职责、开闭、里氏替换、接口隔离和依赖倒置，说明何时拆分及如何避免过度抽象。

