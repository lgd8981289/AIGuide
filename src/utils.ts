// 站内 URL 工具：部署在子目录 /note 下，所有内部链接都要带上 base 前缀
// 注意：trailingSlash: "always" 时 BASE_URL 自带尾斜杠（"/note/"），统一去掉再拼
export const BASE = import.meta.env.BASE_URL.replace(/\/$/, ""); // "/note"

export function url(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return p === "/" ? `${BASE}/` : `${BASE}${p}`;
}

export function absoluteUrl(path: string): string {
  // 用于 canonical 与结构化数据
  return `https://lgdsunday.club${url(path)}`;
}
