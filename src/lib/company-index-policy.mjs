import fs from 'node:fs';
import path from 'node:path';
import { COMPANIES } from '../data/company-interviews.mjs';
import { getInterviewCollections } from './company-interviews.mjs';

// 收录门槛：题目数不足 5 篇的公司/岗位列表页属于薄汇总页，
// 保留页面可浏览与传递内部权重（noindex, follow），但不进入 sitemap 避免拉低整站质量分。
export const MIN_INDEXABLE_COMPANY_ARTICLES = 5;

export function isCompanyPageIndexable(page) {
  return page.kind !== 'legacy' && page.articleCount >= MIN_INDEXABLE_COMPANY_ARTICLES;
}

function collectExistingQnums(articlesDir) {
  const qnums = new Set();
  if (!fs.existsSync(articlesDir)) return qnums;
  for (const file of fs.readdirSync(articlesDir, { recursive: true })) {
    if (!String(file).endsWith('.md')) continue;
    const raw = fs.readFileSync(path.join(articlesDir, String(file)), 'utf8');
    const match = raw.match(/^qnum:\s*"?([QT]\d+)"?\s*$/m);
    if (match) qnums.add(match[1]);
  }
  return qnums;
}

/**
 * 返回应当从 sitemap 排除且标记为 noindex 的薄公司/岗位页面路径集合（带前后斜杠）。
 * 依赖层级不变量：公司总页匹配题数永远 >= 下属单岗位页匹配题数，
 * 因此不会出现“岗位页进 sitemap 但父级公司页被 noindex”的面包屑断层。
 */
export function getThinCompanyPaths(articlesDir) {
  const existingQnums = collectExistingQnums(articlesDir);
  const collections = getInterviewCollections();
  const thin = new Set();

  for (const view of collections) {
    const count = view.qnums.filter((qnum) => existingQnums.has(qnum)).length;
    if (count < MIN_INDEXABLE_COMPANY_ARTICLES) {
      thin.add(view.href);
    }
  }

  for (const company of COMPANIES) {
    const roles = collections.filter((view) => view.company.id === company.id);
    if (!roles.length) continue;
    const companyQnums = new Set(roles.flatMap((view) => view.qnums));
    const count = [...companyQnums].filter((qnum) => existingQnums.has(qnum)).length;
    if (count < MIN_INDEXABLE_COMPANY_ARTICLES) {
      thin.add(`/companies/${company.id}/`);
    }
  }

  return thin;
}
