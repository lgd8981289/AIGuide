#!/usr/bin/env python3
"""检查真实构建产物；错误时阻止部署。仅使用 Python 标准库。"""
from html.parser import HTMLParser
from pathlib import Path
import json
import re
import sys
from urllib.parse import unquote, urlsplit
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
ORIGIN = "https://note.lgdsunday.club"
BASE = "/"
NS = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}


class Page(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.titles = []
        self.meta = {}
        self.canonical = []
        self.icons = []
        self.images = []
        self.links = []
        self.schemas = []
        self.classes = set()
        self.h1 = 0
        self.h1_titles = []
        self.search_bodies = 0
        self.capture = None
        self.buffer = ""
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.classes.update((attrs.get("class") or "").split())
        self.search_bodies += "data-pagefind-body" in attrs
        self.h1 += tag == "h1"
        if tag in ("title", "h1") or tag == "script" and attrs.get("type") == "application/ld+json":
            self.capture = tag
            self.buffer = ""
        if tag == "meta":
            self.meta[attrs.get("name", attrs.get("property", ""))] = attrs.get("content", "")
        if tag == "link" and attrs.get("rel") == "canonical":
            self.canonical.append(attrs.get("href"))
        if tag == "link" and attrs.get("rel") == "icon":
            self.icons.append(attrs)
        if tag == "img":
            self.images.append(attrs)
        if tag == "a" and attrs.get("href"):
            self.links.append(attrs["href"])

    def handle_data(self, data):
        if self.capture:
            self.buffer += data

    def handle_endtag(self, tag):
        if tag != self.capture:
            return
        if tag == "title":
            self.titles.append(self.buffer)
        elif tag == "h1":
            self.h1_titles.append(self.buffer)
        else:
            value = json.loads(self.buffer)
            self.schemas.extend(value if isinstance(value, list) else [value])
        self.capture = None


def main():
    errors = []
    def check(ok, message):
        if not ok:
            errors.append(message)
    website_titles = json.loads((ROOT / "scripts/article-titles.json").read_text())
    content_root = ROOT / "src/content/articles"
    sources = list(content_root.rglob("*.md"))
    expected_titles = {}
    course_root = ROOT / "src/content/course"
    course_sources = list(course_root.rglob("*.md"))
    course_free = {}
    course_name = "从 0 到 1 转型 Agent 应用开发工程师"
    for source in course_sources:
        frontmatter = source.read_text().split("---", 2)[1]
        course_url = ORIGIN + "/agent-course/" + source.relative_to(course_root).with_suffix("").as_posix() + "/"
        expected_titles[course_url] = json.loads(re.search(r'^title: (.+)$', frontmatter, re.M)[1])
        chapter = int(re.search(r'^chapter: (\d+)$', frontmatter, re.M)[1])
        free = re.search(r'^free: (.+)$', frontmatter, re.M)[1] == "true"
        check(free == (chapter <= 2), "课程免费章节范围错误: " + course_url)
        ratio = float(re.search(r'^previewRatio: (.+)$', frontmatter, re.M)[1])
        check(ratio == 1 if free else .10 <= ratio <= .16, "课程试读比例错误: " + course_url)
        course_free[course_url] = free
    for source in sources:
        frontmatter = source.read_text().split("---", 2)[1]
        num = json.loads(re.search(r'^qnum: (.+)$', frontmatter, re.M)[1])
        synced_title = json.loads(re.search(r'^title: (.+)$', frontmatter, re.M)[1])
        expected = website_titles.get(num, synced_title)
        check(synced_title == expected, f"网站标题配置尚未同步，请先运行 npm run sync:content: {num}")
        expected_titles[ORIGIN + "/" + source.relative_to(content_root).with_suffix("").as_posix() + "/"] = expected
    urls = [x.text for x in ET.parse(DIST / "sitemap-0.xml").findall("s:url/s:loc", NS)]
    index = [x.text for x in ET.parse(DIST / "sitemap-index.xml").findall("s:sitemap/s:loc", NS)]
    check(index == [ORIGIN + BASE + "sitemap-0.xml"], "sitemap 索引地址错误")
    check(len(urls) == len(set(urls)), "sitemap 存在重复 URL")
    check((DIST / "sitemap.xml").read_bytes() == (DIST / "sitemap-0.xml").read_bytes(), "sitemap 别名不一致")
    titles, descriptions = set(), set()
    article_count = 0
    image_paths = set()
    for url in urls:
        check(url.startswith(ORIGIN + BASE) and url.endswith("/"), "非规范 sitemap URL: " + url)
        file = DIST / unquote(urlsplit(url).path[len(BASE):]) / "index.html"
        if not file.is_file():
            errors.append("sitemap 页面不存在: " + url)
            continue
        page = Page(file.read_text())
        check(page.canonical == [url], "canonical 错误: " + url)
        check(page.meta.get("og:url") == url, "og:url 错误: " + url)
        check(page.meta.get("og:site_name") == "Sunday 的面试指南", "站点名称错误: " + url)
        check(bool(page.icons) and page.icons[0].get("href") == "/apple-touch-icon.png", "指南独立图标缺失: " + url)
        check("https://lgdsunday.club/note/" not in json.dumps(page.schemas), "结构化数据残留旧域地址: " + url)
        if url == ORIGIN + BASE:
            website = next((s for s in page.schemas if s.get("@type") == "WebSite"), {})
            check(website.get("name") == "Sunday 的面试指南" and website.get("url") == url, "首页站点名称结构化数据错误")
        check(page.h1 == 1, "H1 数量错误: " + url)
        check(len(page.titles) == 1 and bool(page.titles[0]), "title 缺失或重复: " + url)
        check(page.meta.get("description"), "description 缺失: " + url)
        check("noindex" not in page.meta.get("robots", ""), "sitemap 页面被禁止索引: " + url)
        check("max-image-preview:large" in page.meta.get("robots", ""), "缺少大图预览设置: " + url)
        if page.titles:
            check(page.titles[0] not in titles, "重复标题: " + url)
            titles.add(page.titles[0])
        check(page.meta.get("description") not in descriptions, "重复描述: " + url)
        descriptions.add(page.meta.get("description"))
        article = next((s for s in page.schemas if s.get("@type") == "Article"), None)
        if article:
            article_count += 1
            expected = expected_titles.get(url)
            check(expected is not None, "文章缺少对应同步源稿: " + url)
            check(page.h1_titles == [expected], "文章 H1 与网站标题不一致: " + url)
            # BaseLayout 的 article 页面不追加站点名；课程页仍由页面传入课程品牌。
            expected_page_title = f"{expected}｜慕课网 {course_name}" if url in course_free else expected
            check(page.titles == [expected_page_title], "文章 title 与网站标题不一致: " + url)
            check(article.get("headline") == expected, "文章结构化标题与网站标题不一致: " + url)
            check(page.meta.get("og:title") == page.meta.get("twitter:title") == expected_page_title, "文章分享标题不一致: " + url)
            breadcrumb = next((s for s in page.schemas if s.get("@type") == "BreadcrumbList"), {})
            crumbs = breadcrumb.get("itemListElement", [])
            check(bool(crumbs) and crumbs[-1].get("name") == expected, "文章面包屑标题不一致: " + url)
            check(page.search_bodies == 1, "文章搜索正文范围不正确: " + url)
            check(article.get("mainEntityOfPage") == url, "文章结构化 URL 错误: " + url)
            if article.get("isAccessibleForFree") is False:
                gated_class = "course-paywall" if url in course_free else "gated-content"
                check(article.get("hasPart", {}).get("cssSelector") == "." + gated_class and gated_class in page.classes, "受限内容标记与正文不一致: " + url)
            if url in course_free:
                check(article.get("isAccessibleForFree") is course_free[url], "课程付费结构化数据错误: " + url)
                check(("course-paywall" in page.classes) is not course_free[url], "课程付费提示范围错误: " + url)
                check("慕课网" in page.meta.get("description", "") and course_name in page.meta.get("description", ""), "课程 SEO 描述缺少品牌: " + url)
                check("techgrow" not in file.read_text().lower(), "课程误接入公众号验证码: " + url)
        else:
            check(page.search_bodies == 0, "非文章页面进入全文索引: " + url)
        for schema in page.schemas:
            if schema.get("@type") == "ItemList":
                for item in schema.get("itemListElement", []):
                    check(item.get("name") == expected_titles.get(item.get("url")), "列表结构化标题与文章不一致: " + url)
        for img in page.images:
            src = img.get("src") or img.get("data-src", "")
            # 灯箱在打开时使用被点击图片的地址；关注弹窗的 data-src 则需要检查。
            if not src and "lb-img" in (img.get("class") or "").split():
                continue
            if urlsplit(src).scheme or src.startswith("//"):
                continue
            check(src.startswith(BASE), "图片仍为非站内规范路径: " + url + " " + src)
            image_paths.add(src)
            check((DIST / unquote(urlsplit(src).path.removeprefix(BASE))).is_file(), "图片不存在: " + src)
            if src.startswith((BASE + "img/", BASE + "course-assets/")):
                check(img.get("width") and img.get("height"), "正文图片缺少尺寸: " + src)
                check(img.get("alt"), "正文图片缺少替代文本: " + src)
        for link in page.links:
            target = urlsplit(link)
            check(not (target.netloc in ("lgdsunday.club", "www.lgdsunday.club") and target.path.startswith("/note")), "站内链接残留旧域地址: " + link)
            if target.netloc and target.netloc != urlsplit(ORIGIN).netloc or not target.path.startswith(BASE):
                continue
            local = DIST / unquote(target.path[len(BASE):])
            check(local.is_file() or (local / "index.html").is_file(), "站内链接不存在: " + link)
    check(article_count == len(sources) + len(course_sources), "构建文章数与源稿不一致")
    check(len(course_sources) == len(json.loads((ROOT / "scripts/course-lessons.json").read_text())["lessons"]), "课程目录与同步小节数不一致")
    course_page = Page((DIST / "agent-course/index.html").read_text())
    course_schema = next((s for s in course_page.schemas if s.get("@type") == "Course"), {})
    check(course_schema.get("name") == "Agent 大模型 0 到 1 系统课" and course_schema.get("alternateName") == course_name and course_schema.get("offers", {}).get("price") == 499, "课程名称、平台名称或价格标记错误")
    check(len(course_schema.get("hasPart", [])) == len(course_sources), "课程结构化目录不完整")
    error_page = Page((DIST / "404.html").read_text())
    check("noindex" in error_page.meta.get("robots", ""), "404 页面缺少 noindex")
    check(not any("/404" in u for u in urls), "404 被放入 sitemap")
    if errors:
        print("SEO 检查失败：\n" + "\n".join(errors), file=sys.stderr)
        sys.exit(1)
    print(f"SEO 检查通过：{len(urls)} 个页面、{article_count} 篇文章、{len(image_paths)} 个图片地址；sitemap、canonical、结构化数据及内链有效。")


if __name__ == "__main__":
    main()
