/** 专题配置及文章归属必须在同步清理旧产物之前完成校验。 */
export function validateArticleTopics(topics, assignments, categories, articles) {
  if (!Array.isArray(topics) || !Array.isArray(assignments)) {
    throw new Error("专题定义和文章专题映射必须是数组");
  }
  const categoryIds = new Set(categories);
  const byId = new Map();
  for (const topic of topics) {
    if (!topic || typeof topic.id !== "string" || typeof topic.category !== "string"
      || !categoryIds.has(topic.category) || !topic.id.startsWith(`${topic.category}:`)
      || !/^[a-z0-9-]+:[a-z0-9-]+$/.test(topic.id)
      || typeof topic.name !== "string" || !topic.name.trim() || topic.name !== topic.name.trim()) {
      throw new Error(`专题定义无效：${topic?.id ?? "未提供 ID"}`);
    }
    if (byId.has(topic.id)) throw new Error(`专题 ID 重复：${topic.id}`);
    byId.set(topic.id, topic);
  }
  const byArticle = new Map();
  for (const assignment of assignments) {
    if (!assignment || !/^[QT]\d{3,}$/.test(assignment.qnum ?? "")) {
      throw new Error(`文章专题编号无效：${assignment?.qnum ?? "未提供编号"}`);
    }
    const { qnum, topic } = assignment;
    if (byArticle.has(qnum)) throw new Error(`文章专题重复登记：${qnum}`);
    if (!byId.has(topic)) throw new Error(`${qnum} 引用了未知专题：${topic}`);
    if (articles) {
      if (!articles.has(qnum)) throw new Error(`专题映射找不到文章：${qnum}`);
      if (articles.get(qnum) !== byId.get(topic).category) {
        throw new Error(`${qnum} 的专题 ${topic} 不属于文章分类 ${articles.get(qnum)}`);
      }
    }
    byArticle.set(qnum, topic);
  }
  return byArticle;
}
