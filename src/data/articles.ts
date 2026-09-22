// 文章数据的统一入口：分类内序号（展示用题号）在这里计算一次，全站复用
//
// 背景：写作仓库的目录名带全局编号（Q003-LangGraph暂停与恢复），那是维护编号；
// 读者看到的是「所属分类内的序号」——LangChain 生态的第一道题就显示 Q001。

import { getCollection, type CollectionEntry } from "astro:content";
import { CATEGORIES } from "./site";

export type Article = CollectionEntry<"articles">;

export interface ArticleWithOrder {
  entry: Article;
  /** 分类内序号（从 1 开始） */
  order: number;
  /** 展示用题号：Q001、Q002……（分类内编号） */
  displayNum: string;
}

function decorate(list: Article[]): ArticleWithOrder[] {
  // 按写作仓库的全局编号排序，然后按分类内顺序重新编号
  return [...list]
    .sort((a, b) => a.data.qnum.localeCompare(b.data.qnum))
    .map((entry, i) => ({
      entry,
      order: i + 1,
      displayNum: `Q${String(i + 1).padStart(3, "0")}`,
    }));
}

/** 按分类 slug 分组，组内按分类内顺序排列 */
export async function getArticlesByCategory(): Promise<
  Map<string, ArticleWithOrder[]>
> {
  const all = await getCollection("articles");
  const byCat = new Map<string, Article[]>();
  for (const a of all) {
    const list = byCat.get(a.data.category) ?? [];
    list.push(a);
    byCat.set(a.data.category, list);
  }
  const result = new Map<string, ArticleWithOrder[]>();
  for (const [cat, list] of byCat) {
    result.set(cat, decorate(list));
  }
  return result;
}

/** 扁平列表：按六大分类顺序 + 分类内顺序展开（首页、最新更新用） */
export async function getOrderedArticles(): Promise<ArticleWithOrder[]> {
  const byCat = await getArticlesByCategory();
  const flat: ArticleWithOrder[] = [];
  for (const c of CATEGORIES) {
    flat.push(...(byCat.get(c.slug) ?? []));
  }
  return flat;
}
