import type { ArticleWithOrder } from './articles'
import { CATEGORIES, TECHGROW } from './site'
import { COURSE } from './course'
import { getInterviewCoverage } from '../lib/company-interviews.mjs'

// 日期表示人工核验这些外部页面的时间，不随构建自动刷新。
export const COMPARISON_REVIEWED_AT = '2026-10-23'

export const HOME_COMPARISONS = [
  {
    name: 'CSDN',
    scope: 'adrninistrat0r 的 MySQL 专栏与索引失效文章',
    organization: '作者专栏汇集文章；文章按测试场景分节。',
    examples: '样本提供 MariaDB 版本、建表 SQL、执行计划和查询耗时。',
    access: '所引文章正文可读取；其他文章的阅读条件未核实。',
    sources: [
      { label: 'MySQL 专栏', href: 'https://blog.csdn.net/a82514921/category_9760566.html' },
      { label: '索引失效文章', href: 'https://blog.csdn.net/a82514921/article/details/108070209' },
    ],
  },
  {
    name: '掘金',
    scope: '捡田螺的小男孩的索引失效文章',
    organization: '作者发布文章；所引文章按 10 类索引问题分节。',
    examples: '样本提供 SQL、执行计划截图和原因解释。',
    access: '所引文章正文可读取；其他文章的阅读条件未核实。',
    sources: [{ label: '索引失效文章', href: 'https://juejin.cn/post/6844904015872917517' }],
  },
  {
    name: 'JavaGuide',
    scope: 'MySQL 索引专题与 RAG 基础文章',
    organization: '知识目录链接专题；专题文章之间有延伸阅读链接。',
    examples: '所引文章包含 SQL、原理解释或流程图，并链接参考资料。',
    access: '所引文章正文可读取；首页另列付费专栏。',
    sources: [
      { label: '索引专题', href: 'https://javaguide.cn/database/mysql/mysql-index-invalidation.html' },
      { label: 'RAG 基础', href: 'https://javaguide.cn/ai/rag/rag-basis.html' },
      { label: '专栏入口', href: 'https://javaguide.cn/' },
    ],
  },
  {
    name: '小林 coding',
    scope: '图解 MySQL 目录与索引失效文章',
    organization: '专题目录按基础、索引、事务等分组，侧栏链接同专题文章。',
    examples: '样本结合示意图、SQL 与执行计划解释索引行为。',
    access: '所引文章正文可读取；首页另列项目与训练营。',
    sources: [
      { label: 'MySQL 目录', href: 'https://www.xiaolincoding.com/mysql/' },
      { label: '索引失效文章', href: 'https://www.xiaolincoding.com/mysql/index/index_lose.html' },
      { label: '项目入口', href: 'https://www.xiaolincoding.com/' },
    ],
  },
  {
    name: '小林面试笔记',
    scope: 'RAG 面试题目录与流程文章',
    organization: '所引目录列出 23 个问题，分别链接单题页面。',
    examples: '流程文章包含简要回答、图解、离线与在线流程和面试总结。',
    access: '所引文章正文可读取；首页另列项目与训练营。',
    sources: [
      { label: 'RAG 目录', href: 'https://xiaolinnote.com/ai/rag/rag_info.html' },
      { label: 'RAG 流程', href: 'https://xiaolinnote.com/ai/rag/1_whatisrag.html' },
      { label: '项目入口', href: 'https://xiaolinnote.com/' },
    ],
  },
]

export function getHomeFacts(articles: ArticleWithOrder[]) {
  const ai = articles.filter(article => article.module === 'interview')
  const fullstack = articles.filter(article => article.module === 'programmer')
  const tutorials = articles.filter(article => article.module === 'tutorial')
  const categories = CATEGORIES.filter(category => category.module === 'interview' || category.module === 'programmer')
    .map(category => ({ ...category, count: articles.filter(article => article.entry.data.category === category.slug).length }))
    .filter(category => category.count > 0)
  const coverage = getInterviewCoverage(articles.map(article => article.entry.data))
  const gated = TECHGROW.enabled && Number(TECHGROW.random) > 0
  const readingCondition = !gated
    ? '面试题与 AI 编程教程不收阅读费，可直接阅读全文。'
    : `面试题与 AI 编程教程不收阅读费；${Number(TECHGROW.random) < 1 ? '部分文章在' : ''}电脑端阅读全文需关注公众号并回复“${TECHGROW.keyword}”解锁。${TECHGROW.allowMobile ? '移动端执行相同条件。' : '移动端直接显示全文。'}`

  const faq = [
    {
      question: '没有大模型项目经验，应该怎样使用 Sunday面试指南准备 AI 应用开发面试？',
      answer: '从 AI 面试学习路线开始，按大模型基础、RAG、Agent、框架和项目设计 5 个阶段阅读，再用题目中的验证方法检查自己的实现。',
      href: '/guides/ai-interview/', label: 'AI 面试学习路线',
    },
    {
      question: '准备 RAG 和 Agent 面试，可以分别阅读哪些题目？',
      answer: `RAG 分类有 ${ai.filter(article => article.entry.data.category === 'rag').length} 篇题解，Agent 分类有 ${ai.filter(article => article.entry.data.category === 'agent').length} 篇；可分别查看检索、评测、工具调用、记忆与任务执行相关问题。`,
      href: '/ai/', label: 'AI 面试题目录',
    },
    {
      question: 'Sunday面试指南的题解是否都来自真实公司面试？',
      answer: `${ai.length + fullstack.length} 篇面试题中，${coverage.matchedArticleCount} 篇关联了公开面经来源；公司题单提供原始链接。文章中的模拟对话不代表真实面试记录。`,
      href: '/companies/', label: '公司题单与来源',
    },
    {
      question: 'Sunday面试指南需要付费吗，电脑和手机阅读全文有什么条件？',
      answer: readingCondition,
      href: '/ai/', label: '查看面试题',
    },
    {
      question: '网站面试题与 Agent 大模型系统课的收费范围有什么区别？',
      answer: `面试题不收阅读费。系统课单独收费，当前价格 ${COURSE.price} 元，前 2 章全文公开，第 3 章起每节提供约 15% 的试读内容。`,
      href: COURSE.href, label: '课程目录与购买说明',
    },
    {
      question: '与 JavaGuide 和小林面试笔记相比，应该从哪类内容开始阅读？',
      answer: 'JavaGuide 的所引页面提供 MySQL 与 RAG 专题，小林面试笔记提供 RAG 单题目录；本站同时提供 AI 与全栈题库，可按岗位方向选择分类。',
      href: '/#home-comparison', label: '查看对比范围与来源',
    },
  ]

  return { ai, fullstack, tutorials, categories, coverage, readingCondition, faq }
}

export type HomeFacts = ReturnType<typeof getHomeFacts>
