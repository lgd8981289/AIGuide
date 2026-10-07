#!/usr/bin/env python3
"""整站「站内 SEO 体检」：扫描 dist/，输出可量化的缺陷清单。

设计原则：只报告「能明确判定为问题」的项，不做主观评分。
判定口径以中文 SERP 实际展示为准（中文按 2 列宽、ASCII 按 1 列宽）。

用法：
    python3 scripts/audit-onpage.py                 # 输出摘要 + 明细
    python3 scripts/audit-onpage.py --top 30        # 明细每类最多列 30 条

输出分区：
    1. 规模概览
    2. 标题：显示宽度分布 / 超长（SERP 截断）/ 过短 / 全站重复
    3. 描述：缺失 / 超长 / 以「……」结尾（被机械截断）/ 全站重复
    4. 正文体量：thin page 清单
    5. 内链：入链为 0 的孤儿页 / 入链 < 3 的弱链页
    6. 规范化与索引指令核对
"""
from __future__ import annotations

import argparse
import html
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

DIST = Path(__file__).resolve().parent.parent / "dist"

# 中文 SERP 的展示上限。Google 桌面端标题链接区约 600px ≈ 30 个全角字 ≈ 60 列；
# 描述约 920px ≈ 78 个全角字 ≈ 156 列。统一按「列」判定（全角 2 列 / ASCII 1 列）。
TITLE_LIMIT_COLS = 60
DESC_LIMIT_COLS = 156
WRITE_LIMIT_CHARS = 120  # sync-content.mjs 的 trimAtBoundary 写入上限（字符数，非列宽）

THIN_WORDS = 600  # 正文可视字数下限（含代码/中文，粗口径）

SKIP_DIRS = {"pagefind", "_astro", "img", "_ops"}


def display_width(text: str) -> int:
    """中文/全角按 2 列，ASCII 按 1 列。"""
    width = 0
    for ch in text:
        width += 2 if ord(ch) > 0x2E80 else 1
    return width


def strip_tags(fragment: str) -> str:
    fragment = re.sub(r"<(script|style)\b[^>]*>.*?</\1>", " ", fragment, flags=re.S | re.I)
    fragment = re.sub(r"<!--.*?-->", " ", fragment, flags=re.S)
    text = re.sub(r"<[^>]+>", " ", fragment)
    return html.unescape(re.sub(r"\s+", " ", text)).strip()


def visible_word_count(fragment: str) -> int:
    """粗口径字数：中日韩按字计，连续 ASCII 按词计。"""
    text = strip_tags(fragment)
    cjk = len(re.findall(r"[\u3000-\u9fff\uf900-\ufaff]", text))
    words = len(re.findall(r"[A-Za-z0-9_]+", text))
    return cjk + words


def page_path(html_file: Path) -> str:
    rel = html_file.relative_to(DIST)
    parent = str(rel.parent)
    return "/" if parent == "." else f"/{parent}/"


def is_article(path: str) -> bool:
    """文章页：/{分类}/{编号-关键词}/ —— 末段形如 q123-xxx 或 t123-xxx。"""
    parts = [p for p in path.split("/") if p]
    return len(parts) == 2 and re.fullmatch(r"[a-z]{1,2}\d{3}-[a-z0-9-]+", parts[1]) is not None


def is_legacy_redirect(html_text: str) -> bool:
    return "http-equiv" in html_text and "refresh" in html_text and "<title>页面已迁移</title>" in html_text


def collect() -> list[dict]:
    pages: list[dict] = []
    for html_file in sorted(DIST.rglob("index.html")):
        rel_parts = html_file.relative_to(DIST).parts
        if rel_parts and rel_parts[0] in SKIP_DIRS:
            continue
        raw = html_file.read_text(encoding="utf-8", errors="ignore")
        if is_legacy_redirect(raw):
            continue

        def grab(pattern: str, flags=re.S | re.I) -> str:
            m = re.search(pattern, raw, flags)
            return html.unescape(m.group(1)).strip() if m else ""

        title = grab(r"<title[^>]*>(.*?)</title>")
        desc = ""
        m = re.search(r'<meta\s+name="description"\s+content="(.*?)"', raw, re.S | re.I)
        if m:
            desc = html.unescape(m.group(1)).strip()
        robots = ""
        m = re.search(r'<meta\s+name="robots"\s+content="(.*?)"', raw, re.S | re.I)
        if m:
            robots = m.group(1).strip()
        canonical = ""
        m = re.search(r'<link\s+rel="canonical"\s+href="(.*?)"', raw, re.S | re.I)
        if m:
            canonical = m.group(1).strip()
        h1 = strip_tags(grab(r"<h1[^>]*>(.*?)</h1>"))

        # 正文体量：文章页取它自己的 <article>；列表页不能用 <article>（那是列表里的卡片），
        # 否则会把第一张卡片的文字当整页正文，把列表页误判成 thin page。
        this_path = page_path(html_file)
        if is_article(this_path):
            m = re.search(r"<article\b[^>]*>(.*?)</article>", raw, re.S | re.I)
            body = m.group(1) if m else raw
        else:
            m = re.search(r"<main\b[^>]*>(.*?)</main>", raw, re.S | re.I)
            body = m.group(1) if m else raw

        links = {
            u
            for u in re.findall(r'href="(/[^"#?]*)"', raw)
            if not u.startswith(("/img/", "/_astro/", "/pagefind/"))
        }

        pages.append(
            {
                "path": page_path(html_file),
                "title": title,
                "desc": desc,
                "robots": robots,
                "canonical": canonical,
                "h1": h1,
                "words": visible_word_count(body),
                "links": links,
            }
        )
    return pages


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--top", type=int, default=20, help="每类明细最多列出多少条")
    args = ap.parse_args()

    if not DIST.exists():
        print("dist/ 不存在，请先构建", file=sys.stderr)
        return 1

    pages = collect()
    by_path = {p["path"]: p for p in pages}

    # ---------- 入链统计 ----------
    inbound: dict[str, set[str]] = defaultdict(set)
    for p in pages:
        for target in p["links"]:
            if target in by_path and target != p["path"]:
                inbound[target].add(p["path"])

    print("=" * 72)
    print("站内 SEO 体检")
    print("=" * 72)
    print(f"扫描页面数：{len(pages)}")

    # ---------- 2. 标题 ----------
    print("\n" + "-" * 72)
    print(f"【标题】展示上限约 {TITLE_LIMIT_COLS} 列（≈ {TITLE_LIMIT_COLS // 2} 个全角字）")
    print("-" * 72)
    tw = {p["path"]: display_width(p["title"]) for p in pages}
    over = sorted([p for p in pages if tw[p["path"]] > TITLE_LIMIT_COLS], key=lambda p: -tw[p["path"]])
    short = sorted([p for p in pages if tw[p["path"]] < 28], key=lambda p: tw[p["path"]])
    dup = {t: ps for t, ps in
           ((t, [p["path"] for p in pages if p["title"] == t]) for t in {p["title"] for p in pages})
           if len(ps) > 1}
    print(f"超长（>{TITLE_LIMIT_COLS} 列）：{len(over)} 页")
    for p in over[: args.top]:
        print(f"    {tw[p['path']]:>3}列  {p['title'][:60]}")
    print(f"过短（<28 列）：{len(short)} 页")
    for p in short[: args.top]:
        print(f"    {tw[p['path']]:>3}列  {p['title']}  ({p['path']})")
    print(f"全站重复标题：{len(dup)} 组")
    for t, ps in list(dup.items())[: args.top]:
        print(f"    {t!r} -> {ps}")

    # ---------- 3. 描述 ----------
    print("\n" + "-" * 72)
    print(f"【描述】展示上限 {DESC_LIMIT_COLS} 列（≈ {DESC_LIMIT_COLS // 2} 个全角字）/ 写入上限 {WRITE_LIMIT_CHARS} 字")
    print("-" * 72)
    missing = [p for p in pages if not p["desc"]]
    dw = {p["path"]: display_width(p["desc"]) for p in pages if p["desc"]}
    d_over = sorted([p for p in pages if p["desc"] and dw[p["path"]] > DESC_LIMIT_COLS],
                    key=lambda p: -dw[p["path"]])
    ellipsis = [p for p in pages if p["desc"].endswith("……")]
    ddup = {d: ps for d, ps in
            ((d, [p["path"] for p in pages if p["desc"] == d]) for d in {p["desc"] for p in pages if p["desc"]})
            if len(ps) > 1}
    print(f"缺失 description：{len(missing)} 页")
    for p in missing[: args.top]:
        print(f"    {p['path']}")
    print(f"超出展示宽度（>{DESC_LIMIT_COLS} 列）：{len(d_over)} 页")
    for p in d_over[: args.top]:
        print(f"    {dw[p['path']]:>4}列  {p['desc'][:70]}")
    print(f"以「……」结尾（被机械截断）：{len(ellipsis)} 页")
    for p in ellipsis[: args.top]:
        print(f"    {dw[p['path']]:>4}列  {p['desc'][:70]}")
    print(f"全站重复描述：{len(ddup)} 组")
    for d, ps in list(ddup.items())[: args.top]:
        print(f"    {d[:50]!r} -> {len(ps)} 页: {ps[:3]}")

    # ---------- 4. 正文体量 ----------
    print("\n" + "-" * 72)
    print(f"【正文体量】thin 阈值 {THIN_WORDS} 字")
    print("-" * 72)
    arts = [p for p in pages if is_article(p["path"])]
    cats = [p for p in pages if not is_article(p["path"])]
    thin_a = sorted([p for p in arts if p["words"] < THIN_WORDS], key=lambda p: p["words"])
    thin_c = sorted([p for p in cats if p["words"] < 300], key=lambda p: p["words"])
    print(f"文章页 {len(arts)} 个，其中 thin（<{THIN_WORDS} 字）：{len(thin_a)} 个")
    for p in thin_a[: args.top]:
        print(f"    {p['words']:>5} 字  {p['path']}")
    print(f"非文章页 {len(cats)} 个，其中 <300 字：{len(thin_c)} 个")
    for p in thin_c[: args.top]:
        print(f"    {p['words']:>5} 字  {p['path']}")

    # ---------- 5. 内链 ----------
    print("\n" + "-" * 72)
    print("【内链】入链数 = 站内有多少个页面链接到它")
    print("-" * 72)
    zero = [p["path"] for p in pages if not inbound[p["path"]]]
    weak = sorted([p["path"] for p in pages if 0 < len(inbound[p["path"]]) < 3],
                  key=lambda u: len(inbound[u]))
    print(f"孤儿页（入链 0）：{len(zero)} 个")
    for u in zero[: args.top]:
        print(f"    {u}")
    print(f"弱链页（入链 1-2）：{len(weak)} 个")
    for u in weak[: args.top]:
        print(f"    {len(inbound[u])}  <- {u}")

    # 文章页入链分布（合并历史编号跳转页带来的入链不计数，这里只看真实 HTML 链接）
    art_in = sorted((len(inbound[p["path"]]), p["path"]) for p in arts)
    if art_in:
        print(f"文章页入链：最少 {art_in[0][0]}，中位 {art_in[len(art_in)//2][0]}，"
              f"最多 {art_in[-1][0]}")
        print("入链最少的 5 篇：")
        for n, u in art_in[:5]:
            print(f"    {n:>3}  {u}")

    # ---------- 6. 索引指令核对 ----------
    print("\n" + "-" * 72)
    print("【索引指令与规范化】")
    print("-" * 72)
    noindex = [p["path"] for p in pages if "noindex" in p["robots"]]
    no_robots = [p["path"] for p in pages if not p["robots"]]
    bad_canon = [p["path"] for p in pages if not p["canonical"].endswith(p["path"])]
    h1_mismatch = [p["path"] for p in pages if p["h1"] and p["h1"] != p["title"]]
    print(f"noindex 页：{len(noindex)} 个")
    for u in noindex[: args.top]:
        print(f"    {u}")
    print(f"无 robots meta：{len(no_robots)} 个")
    for u in no_robots[: args.top]:
        print(f"    {u}")
    print(f"canonical 与本页路径不一致：{len(bad_canon)} 个")
    for u in bad_canon[: args.top]:
        print(f"    {u} -> {by_path[u]['canonical']}")
    print(f"H1 与 title 不同：{len(h1_mismatch)} 个（文章页属正常，板块页需人工判断）")
    for u in h1_mismatch[: args.top]:
        print(f"    {u}\n      h1={by_path[u]['h1'][:50]!r}\n      ti={by_path[u]['title'][:50]!r}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
