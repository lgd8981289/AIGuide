import { getOrderedArticles } from './articles'
import { createRelatedArticleSelector } from '../lib/related-articles.mjs'

/** 按源稿全局编号维护，真实标题和 URL 从文章集合读取。 */
export const ARTICLE_RELATED: Record<string, string[]> = {
  Q005: ['Q023', 'Q024', 'Q026'],
  Q028: ['Q004', 'Q033'],
  // MCP 概念题连接到动手配置教程。
  Q008: ['T002'],
  Q050: ['T002'],
  Q064: ['T002'],
  Q071: ['T002'],
  // JVM：类加载 → 元空间/反射；GC：存活判断 → 回收算法 → 收集器与安全点。
  Q226: ['Q219', 'Q264', 'Q161'],
  Q219: ['Q226', 'Q223', 'Q740'],
  Q223: ['Q246', 'Q288', 'Q219'],
  Q246: ['Q223', 'Q288', 'Q552'],
  Q288: ['Q246', 'Q552', 'Q740'],
  // Python 异步：任务组、超时、队列背压和协程锁之间的执行关系。
  Q595: ['Q439', 'Q596', 'Q597'],
  Q439: ['Q595', 'Q596', 'Q597'],
  Q598: ['Q597', 'Q593', 'Q596'],
  Q610: ['Q609', 'Q611'],
  // RAG：切片 → 父子回查/上下文增强；召回 → 重排 → 多样性与评测。
  Q017: ['Q048', 'Q389', 'Q005'],
  Q024: ['Q023', 'Q387', 'Q026'],
  // Agent：调用流程 → 协议边界 → 错误重试；状态 → 记忆 → 持久化。
  Q004: ['Q008', 'Q028', 'Q033'],
  Q007: ['Q497', 'Q496'],
  T006: ['Q058', 'Q035'],
}

let selector: Promise<ReturnType<typeof createRelatedArticleSelector>> | undefined
export async function getRelatedArticles(qnum: string) {
  selector ??= getOrderedArticles().then(createRelatedArticleSelector)
  return (await selector)(qnum, ARTICLE_RELATED[qnum] ?? [])
}
