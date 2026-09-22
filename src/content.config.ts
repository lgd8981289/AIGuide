import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// 文章集合：由 scripts/sync-content.mjs 从写作仓库同步生成
// 源头：../文章/{分类}/{Q编号}-{主题}/正文.md
const articles = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/articles" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
    qnum: z.string(),
    date: z.coerce.date(),
    // 「面试速答」段落的完整文本，用于 FAQ 结构化数据
    faqAnswer: z.string().optional(),
  }),
});

export const collections = { articles };
