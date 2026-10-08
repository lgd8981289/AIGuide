import { COMPANIES, INTERVIEW_ROLES, INTERVIEW_SOURCES, INTERVIEW_NOTE, INTERVIEW_EMPTY_NOTE } from '../data/company-interviews.mjs';

export function validateInterviewSources(articles, sources = INTERVIEW_SOURCES) {
  const ids = new Set();
  const known = new Set(articles.map(a => a.qnum));
  for (const source of sources) {
    if (ids.has(source.id) || !COMPANIES.some(c => c.id === source.company)) throw new Error(`无效面经来源：${source.id}`);
    ids.add(source.id);
    const address = new URL(source.url);
    if (address.protocol !== 'https:' || address.hostname !== 'www.nowcoder.com' || !/^\/(discuss\/\d+|feed\/main\/detail\/[a-f\d]+)$/.test(address.pathname) || !source.dateLabel || !source.title || !source.topics.length || !/^\d{4}-\d{2}-\d{2}$/.test(source.reviewedAt ?? '') || !INTERVIEW_ROLES.some(r => r.id === source.roleKey)) throw new Error(`面经来源缺少证据：${source.id}`);
    const qnums = new Set();
    for (const item of source.topics) {
      if (!known.has(item.qnum) || qnums.has(item.qnum) || !['mentioned', 'related'].includes(item.relation) || !item.topic || (item.relation === 'mentioned' && !item.question?.trim())) throw new Error(`无效面经关联：${source.id}/${item.qnum}`);
      qnums.add(item.qnum);
    }
  }
}

export function interviewsForArticle(qnum, sources = INTERVIEW_SOURCES) {
  return sources.flatMap(source => source.topics.filter(t => t.qnum === qnum).map(topic => ({ ...topic, source, company: COMPANIES.find(c => c.id === source.company) })));
}

// 同一数据供文章、列表、SEO 和 GitHub 使用，related 永远不进入真题集合。
export function realQuestionsForArticle(qnum, sources = INTERVIEW_SOURCES) {
  return interviewsForArticle(qnum, sources).filter(m => m.relation === 'mentioned' && m.question && m.source.reviewedAt);
}

export function companyRoleHref(companyId, roleId) {
  return `/companies/${companyId}/${roleId}/`;
}

export function questionTags(qnum, sources = INTERVIEW_SOURCES) {
  const tags = new Map();
  for (const { company, source } of realQuestionsForArticle(qnum, sources)) {
    const role = INTERVIEW_ROLES.find(r => r.id === source.roleKey);
    const key = `${company.id}/${role.id}`;
    tags.set(key, { id: key, company: company.id, role: role.id,
      label: `${company.id === 'bytedance' ? '字节' : company.id === 'alibaba' ? '阿里' : company.name}${role.name}面试真题`,
      href: companyRoleHref(company.id, role.id) });
  }
  return [...tags.values()];
}

export function getInterviewCollections(sources = INTERVIEW_SOURCES) {
  const collections = new Map();
  for (const source of sources) {
    const topics = source.topics.filter(t => t.relation === 'mentioned' && t.question && source.reviewedAt);
    if (!topics.length) continue;
    const company = COMPANIES.find(c => c.id === source.company);
    const role = INTERVIEW_ROLES.find(r => r.id === source.roleKey);
    const key = `${company.id}/${role.id}`;
    const view = collections.get(key) ?? { id: key, company, role, href: companyRoleHref(company.id, role.id),
      label: `${company.id === 'bytedance' ? '字节' : company.id === 'alibaba' ? '阿里' : company.name}${role.name}面试真题`, sources: [], qnums: [] };
    view.sources.push({ ...source, topics });
    view.qnums = [...new Set([...view.qnums, ...topics.map(t => t.qnum)])];
    collections.set(key, view);
  }
  return [...collections.values()];
}

export function interviewDescription(description, matches) {
  const tags = [...new Set(matches.filter(m => m.relation === 'mentioned' && m.question).map(m => `${m.company.name}${INTERVIEW_ROLES.find(r => r.id === m.source.roleKey).name}`))];
  return tags.length ? `${description} 附${tags.slice(0, 2).join('、')}${tags.length > 2 ? '等岗位' : ''}公开面经中的真题题意与来源。` : description;
}

export function companyTagMarkdown(qnum, origin, linkForTag = tag => `${origin}${tag.href}`) {
  const tags = questionTags(qnum);
  return tags.length ? `${tags.map(t => `[${t.label}](${linkForTag(t)})`).join(' · ')}\n\n` : '';
}

export function companyMarkdown(qnum, origin = 'https://note.lgdsunday.club') {
  const matches = realQuestionsForArticle(qnum);
  const heading = '\n## 公司面试真题\n\n';
  if (!matches.length) return `${heading}${INTERVIEW_EMPTY_NOTE}\n\n[浏览公司面试真题](${origin}/companies/)\n`;
  return heading + INTERVIEW_NOTE + '\n\n' + matches.map(({ source, company, question }) =>
    `- **${company.name} · ${source.role} · ${source.stage}**：${question}（题意整理）。[面经来源](${source.url})；${source.dateLabel}。`
  ).join('\n') + `\n\n[浏览更多公司面试真题](${origin}/companies/)\n`;
}
