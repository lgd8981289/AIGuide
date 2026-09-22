import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// 文章集合：由 scripts/sync-content.mjs 按 scripts/sources.json 从各写作仓库同步生成
// 源头一：../文章/{分类}/{Q编号}-{主题}/正文.md                          → module: interview
// 源头二：../../一起来玩 AI 呀～/文章/{分类}/{T编号}-{主题}/正文.md      → module: tutorial
const articles = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/articles" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
    // 所属顶层模块：interview = AI 面试题，tutorial = AI 编程教程
    module: z.enum(["interview", "tutorial"]).default("interview"),
    qnum: z.string(),
    date: z.coerce.date(),
    // 「面试速答」段落的完整文本，用于 FAQ 结构化数据
    faqAnswer: z.string().optional(),
  }),
});

export const collections = { articles };
