/** 按阅读范围保存，多个专题的标签页可以各自返回来源列表。 */
export function navigationContextKey(module, category, topic) {
  return `aiguide.navigation.return.v1:${module}:${category}:${topic}`;
}

/** 会话记录不可靠时保留页面内的静态分类链接，只接受本模块的站内列表。 */
export function resolveNavigationReturn(context, { category, topic, paths, origin }) {
  if (!context || context.category !== category || context.topic !== topic || typeof context.href !== 'string' || !context.href.trim()) return null;
  try {
    const target = new URL(context.href, origin);
    if (target.origin !== origin || !paths.includes(target.pathname)) return null;
    return target.pathname + target.search;
  } catch { return null; }
}
