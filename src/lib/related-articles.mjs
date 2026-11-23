// 标题与摘要提供主题信号；三级专题限定学习范围，人工关系负责前置知识和跨模块教程。
// 文档频率降低全站通用词的影响，不按目录位置或发布时间分流。
const segmenter = new Intl.Segmenter('zh', { granularity: 'word' });
const stopwords = new Set('什么 为什么 怎么 如何 哪些 有哪些 区别 不同 关系 原理 理解 说明 介绍 一个 一种 以及 其中 通过 可以 需要 使用 实现 处理 支持 进行 方式 场景 问题 常见 面试 面试题 题目 教程 解析 核心 机制 系统 应用 开发 工作 关键 实际 设计 数据 对比 讲清 不是 而是 是否 什么时候 哪个 用于 解决 怎样 是什么 怎么样 的 了 和 与 在 是 为 中 对 从 把 被 到 能 让 时 地 得 要 会 也 更 来 上 下 后 前 吗 呢'.split(' '));

function terms(text) {
  return [...segmenter.segment(String(text ?? '').toLowerCase())]
    .filter(part => part.isWordLike)
    .map(part => part.segment)
    .filter(term => term.length > 1 && !stopwords.has(term) && !/^\d+$/.test(term));
}

function ecosystems(title) {
  const groups = [
    ['java', /\b(java|jvm|jdk|spring|mybatis|g1|zgc)\b/i],
    ['javascript', /\b(javascript|typescript|node(?:\.js)?|react|vue)\b/i],
    ['python', /\b(python|asyncio|django|fastapi)\b/i],
    ['go', /\b(go|goroutine|gogc)\b/i],
  ];
  return new Set(groups.filter(([, pattern]) => pattern.test(title)).map(([name]) => name));
}

export function createRelatedArticleSelector(articles) {
  const byNumber = new Map();
  const docs = articles.map(article => {
    const data = article.entry.data;
    if (byNumber.has(data.qnum)) throw new Error(`相关文章编号重复：${data.qnum}`);
    byNumber.set(data.qnum, article);
    const weights = new Map();
    for (const [text, weight] of [[data.title, 3], [data.description, 1]]) {
      for (const term of new Set(terms(text))) weights.set(term, (weights.get(term) ?? 0) + weight);
    }
    return { article, data, weights, ecosystems: ecosystems(data.title),
      technical: new Set(terms(data.title).filter(term => /[a-z]/.test(term))) };
  });
  const frequency = new Map();
  for (const { weights } of docs) for (const term of weights.keys()) frequency.set(term, (frequency.get(term) ?? 0) + 1);
  for (const doc of docs) {
    for (const [term, weight] of doc.weights) doc.weights.set(term, weight * (1 + Math.log((docs.length + 1) / (frequency.get(term) + 1))));
    doc.norm = Math.hypot(...doc.weights.values()) || 1;
  }
  const docByNumber = new Map(docs.map(doc => [doc.data.qnum, doc]));
  return function select(current, preferred = [], limit = 4) {
    const source = docByNumber.get(current);
    if (!source) throw new Error(`当前文章不存在：${current}`);
    const chosen = preferred.map(number => {
      if (!byNumber.has(number)) throw new Error(`相关文章不存在：${number}`);
      return byNumber.get(number);
    });
    const ranked = docs.filter(doc => doc !== source).map(doc => {
      let dot = 0;
      for (const [term, weight] of source.weights) dot += weight * (doc.weights.get(term) ?? 0);
      const similarity = dot / (source.norm * doc.norm);
      const sameTopic = Boolean(source.data.topic && source.data.topic === doc.data.topic);
      const sameCategory = source.data.category === doc.data.category;
      const compatible = !source.ecosystems.size || !doc.ecosystems.size
        || [...source.ecosystems].some(value => doc.ecosystems.has(value));
      const sharedTechnical = [...source.technical].some(value => doc.technical.has(value));
      return { doc, similarity, sameTopic, sameCategory,
        compatible, sharedTechnical,
        score: similarity + (sameTopic ? 0.24 : 0) + (sameCategory ? 0.06 : 0) };
    }).filter(item => item.compatible && (item.sameCategory || item.sameTopic || (item.sharedTechnical && item.similarity >= 0.18)))
      .sort((a, b) => b.score - a.score || a.doc.data.qnum.localeCompare(b.doc.data.qnum));
    const seen = new Set([current]);
    return [...chosen, ...ranked.map(item => item.doc.article)].filter(article => {
      const number = article.entry.data.qnum;
      if (seen.has(number)) return false;
      seen.add(number);
      return true;
    }).slice(0, limit);
  };
}
