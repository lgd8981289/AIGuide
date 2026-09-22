// 文章数据的统一入口：分类内序号（展示用编号）在这里计算一次，全站复用
//
// 背景：写作仓库的目录名带全局编号（Q003-LangGraph暂停与恢复 / T001-Claude-Code-DeepSeek），
// 那是维护编号；读者看到的是「所属分类内的序号」——LangChain 生态的第一道题就显示 Q001，
// AI 编程教程某个分类的第一篇就显示 T001。

import { getCollection, type CollectionEntry } from "astro:content";
import { CATEGORIES, type ModuleKey } from "./site";

export type Article = CollectionEntry<"articles">;

export interface ArticleWithOrder {
  entry: Article;
  module: ModuleKey;
  /** 分类内序号（从 1 开始） */
  order: number;
  /** 展示用编号：Q001、T001……（分类内编号） */
  displayNum: string;
}

function prefixOf(module: ModuleKey): string {
  return module === "tutorial" ? "T" : "Q";
}

function decorate(list: Article[], module: ModuleKey): ArticleWithOrder[] {
  const prefix = prefixOf(module);
  // 按写作仓库的全局编号排序，然后按分类内顺序重新编号
  return [...list]
    .sort((a, b) => a.data.qnum.localeCompare(b.data.qnum))
    .map((entry, i) => ({
      entry,
      module,
      order: i + 1,
      displayNum: `${prefix}${String(i + 1).padStart(3, "0")}`,
    }));
}

/** 按分类 slug 分组，组内按分类内顺序排列（分类 slug 全局唯一） */
export async function getArticlesByCategory(): Promise<
  Map<string, ArticleWithOrder[]>
> {
  const all = await getCollection("articles");
  const byCat = new Map<string, { module: ModuleKey; list: Article[] }>();
  for (const a of all) {
    const module = a.data.module;
    const bucket = byCat.get(a.data.category) ?? { module, list: [] };
    bucket.list.push(a);
    byCat.set(a.data.category, bucket);
  }
  const result = new Map<string, ArticleWithOrder[]>();
  for (const [cat, { module, list }] of byCat) {
    result.set(cat, decorate(list, module));
  }
  return result;
}

/** 按模块分组（侧边栏、模块落地页用） */
export async function getArticlesByModule(): Promise<
  Map<ModuleKey, ArticleWithOrder[]>
> {
  const byCat = await getArticlesByCategory();
  const byModule = new Map<ModuleKey, ArticleWithOrder[]>();
  for (const c of CATEGORIES) {
    const list = byCat.get(c.slug) ?? [];
    if (list.length === 0) continue;
    const bucket = byModule.get(c.module) ?? [];
    bucket.push(...list);
    byModule.set(c.module, bucket);
  }
  return byModule;
}

/** 扁平列表：按分类顺序 + 分类内顺序展开（首页、最新更新用） */
export async function getOrderedArticles(): Promise<ArticleWithOrder[]> {
  const byCat = await getArticlesByCategory();
  const flat: ArticleWithOrder[] = [];
  for (const c of CATEGORIES) {
    flat.push(...(byCat.get(c.slug) ?? []));
  }
  return flat;
}
