import { getOrderedArticles } from './articles'
import { CATEGORIES } from './site'
import { COMPANIES, INTERVIEW_REVIEWED_AT } from './company-interviews.mjs'
import { getInterviewCollections, validateInterviewSources } from '../lib/company-interviews.mjs'

export async function getCompanyPages() {
  const articles = await getOrderedArticles()
  validateInterviewSources(articles.map(a => a.entry.data))
  const collections = getInterviewCollections()

  function resolve(sources: typeof collections[number]['sources']) {
    return articles.flatMap(article => {
      const matches = sources.flatMap(source => source.topics.filter(topic => topic.qnum === article.entry.data.qnum).map(topic => ({ source, ...topic })))
      return matches.length ? [{ article, matches }] : []
    })
  }
  function groups(entries: ReturnType<typeof resolve>) {
    return CATEGORIES.map(category => ({ category, entries: entries.filter(item => item.article.entry.data.category === category.slug) })).filter(group => group.entries.length)
  }
  const rolePages = collections.map(view => {
    const entries = resolve(view.sources)
    return { ...view, kind: 'role' as const, name: view.company.name, updated: INTERVIEW_REVIEWED_AT,
      title: `${view.label}及答案`, articleCount: entries.length, entries, groups: groups(entries),
      description: `${view.label}及答案：收录 ${entries.length} 篇已有技术解析，按知识分类展示题目、摘要和原文入口，并附公开面经中的题意、岗位、批次与来源。`,
      guideSlug: '' }
  })
  const companyPages = COMPANIES.flatMap(company => {
    const roles = rolePages.filter(view => view.company.id === company.id)
    if (!roles.length) return []
    const sources = roles.flatMap(view => view.sources)
    const entries = resolve(sources)
    return [{ id: company.id, kind: 'company' as const, company, role: null, name: company.name,
      label: `${company.name}面试真题`, href: `/companies/${company.id}/`, updated: INTERVIEW_REVIEWED_AT,
      title: `${company.name}面试真题及答案：按岗位浏览`, articleCount: entries.length, sources, entries, groups: groups(entries),
      description: `${company.name}面试真题及答案：按${roles.map(r => r.role.name).join('、')}岗位浏览 ${entries.length} 篇技术解析，查看具体题目、答案和公开面经出处。`, guideSlug: '' }]
  })
  // 保留已经出现过的指南地址；规范入口统一为公司与岗位列表。
  const aliases = [
    ['bytedance-interview', 'bytedance/frontend'],
    ['baidu-frontend-interview', 'baidu/frontend'],
    ['alibaba-backend-interview', 'alibaba/backend'],
    ['baidu-campus-interview', 'baidu/frontend'],
  ].map(([guideSlug, id]) => {
    const view = rolePages.find(page => page.id === id)!
    if (guideSlug !== 'baidu-campus-interview') return { ...view, kind: 'legacy' as const, guideSlug }
    const sources = view.sources.filter(s => s.stage.startsWith('校招'))
    const entries = resolve(sources)
    return { ...view, kind: 'legacy' as const, guideSlug, sources, entries, groups: groups(entries), articleCount: entries.length }
  })
  return [...companyPages, ...rolePages, ...aliases]
}
export type CompanyPage = Awaited<ReturnType<typeof getCompanyPages>>[number]
