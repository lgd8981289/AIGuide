import { getCollection } from 'astro:content';
import { COURSE } from './course';

export async function getCourseLessons() {
  const lessons = await getCollection('course');
  if (!lessons.length) throw new Error('课程内容缺失，请先执行 npm run sync:course');
  return lessons.sort((a, b) => a.data.chapter - b.data.chapter || a.data.order - b.data.order);
}

export async function getCourseChapters() {
  const lessons = await getCourseLessons();
  return [...new Set(lessons.map((entry) => entry.data.chapter))].map((number) => {
    const items = lessons.filter((entry) => entry.data.chapter === number);
    return { number, title: items[0].data.chapterTitle, lessons: items, free: number <= 2 };
  });
}

export const lessonPath = (id: string) => `${COURSE.href}${id}/`;
