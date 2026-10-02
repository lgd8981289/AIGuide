import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import topics from "./data/topics.json";

// 文章集合：由 scripts/sync-content.mjs 按 scripts/sources.json 从各写作仓库同步生成
// 源头一：../文章/{分类}/{Q编号}-{主题}/正文.md                          → module: interview
// 全栈题：../文章/全栈面试题/{分类}/{Q编号}-{主题}/正文.md           → module: programmer
// 源头二：../../一起来玩 AI 呀～/文章/{分类}/{T编号}-{主题}/正文.md      → module: tutorial
const articles = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/articles" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
    topic: z.string().min(1).optional(),
    // 顶层模块：AI 面试题、全栈面试题、AI 编程教程
    module: z.enum(["interview", "programmer", "tutorial"]).default("interview"),
    qnum: z.string(),
    date: z.coerce.date(),
    // 「面试速答」段落的完整文本，用于 FAQ 结构化数据
    faqAnswer: z.string().optional(),
  }).superRefine((article, context) => {
    if (article.topic && !topics.some((topic) => topic.id === article.topic && topic.category === article.category)) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["topic"], message: `${article.qnum} 的专题不属于分类 ${article.category}` });
    }
  }),
});

// 此集合只接收同步脚本生成的公开正文或试读，禁止直接指向私有课程源稿。
const course = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/course' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    chapter: z.number().int().positive(),
    chapterTitle: z.string(),
    order: z.number().int().positive(),
    free: z.boolean(),
    previewRatio: z.number().min(0).max(1),
    date: z.coerce.date(),
  }),
});

export const collections = { articles, course };
