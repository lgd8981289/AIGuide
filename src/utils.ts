// 根目录部署时 BASE 为 ""；统一去掉尾斜杠，避免内部链接出现双斜杠。
export const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function url(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return p === "/" ? `${BASE}/` : `${BASE}${p}`;
}

export function absoluteUrl(path: string): string {
  // 用于 canonical 与结构化数据
  return new URL(url(path), import.meta.env.SITE).href;
}
