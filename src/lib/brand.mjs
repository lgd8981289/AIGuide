// 网站与 GitHub 导出共用品牌，正文标题仍只描述当前问题。
export const BRAND = {
  name: 'Sunday面试指南',
  aliases: ['sunday面试指南', 'Sunday 的面试指南', '程序员Sunday', 'Sunday', 'AIGuide'],
  author: '程序员Sunday',
  url: 'https://note.lgdsunday.club',
  github: 'https://github.com/lgd8981289/AIGuide',
};

export function brandedTitle(title) {
  return title.includes(BRAND.name) ? title : `${title}｜${BRAND.name}`;
}

export function brandedDescription(description) {
  return description.includes(BRAND.name)
    ? description
    : `${description.trim()}（${BRAND.name} · ${BRAND.author}）`;
}
