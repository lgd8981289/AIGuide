/** 指定题目优先，其余按原有同分类、同模块顺序补齐。 */
export function selectRelatedArticles(current, articles, preferred = [], fallback = [], limit = 4) {
  const byNumber = new Map();
  for (const article of articles) {
    const number = article.entry.data.qnum;
    if (byNumber.has(number)) throw new Error(`相关文章编号重复：${number}`);
    byNumber.set(number, article);
  }
  const chosen = preferred.map((number) => {
    if (!byNumber.has(number)) throw new Error(`相关文章不存在：${number}`);
    return byNumber.get(number);
  });
  const seen = new Set([current]);
  return [...chosen, ...fallback].filter((article) => {
    const number = article.entry.data.qnum;
    if (seen.has(number)) return false;
    seen.add(number);
    return true;
  }).slice(0, limit);
}
