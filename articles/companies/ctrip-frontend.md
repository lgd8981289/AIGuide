# 携程前端面试真题及答案 · Sunday面试指南

[全部公司真题](./README.md) · [在线阅读](https://note.lgdsunday.club/companies/ctrip/frontend/)

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

## 前端面试题

- [Promise 并发控制怎么实现？如何保证最多同时执行 N 个任务？](../frontend/q514-promise-concurrency-limit.md)
  Promise 并发控制怎么实现？从尚未启动的任务函数、执行名额与自动补位讲起，提供经过测试的 TypeScript 和 Python 示例，说明结果顺序、失败与取消边界。
- [dependencies、devDependencies、peerDependencies 有什么区别？依赖应该放在哪里？](../frontend/q515-npm-dependencies-devdependencies-peerdependencies.md)
  dependencies、devDependencies、peerDependencies 怎么选？用应用和 React 组件库说明三类依赖的责任，区分 npm 安装与构建打包，纠正 peer 永不自动安装等旧结论。
- [CSS 如何实现水平垂直居中？元素宽高不固定时应该怎么写？](../frontend/q539-css-horizontal-vertical-centering.md)
  CSS 水平垂直居中如何选择写法？区分文字和盒子、Flex/Grid 对齐与定位加 transform，说明不定宽高、父容器尺寸和溢出时的边界。

