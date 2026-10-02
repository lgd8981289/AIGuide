#!/usr/bin/env python3
"""验证发布文本与 Pagefind：未公开的课程句子不能随网页、静态资源或搜索片段下发。"""
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
import gzip
import json
import os
import re

ROOT = Path(__file__).resolve().parent.parent
CONFIG = json.loads((ROOT / 'scripts/course-lessons.json').read_text())
SOURCE = (ROOT / os.environ.get('AIGUIDE_COURSE_SOURCE', CONFIG['source'])).resolve()


class Text(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.parts = []
        self.feed(html)

    def handle_data(self, data):
        self.parts.append(data)


def compact(value):
    return re.sub(r'[\s\u200b*_`\\]', '', value)


html_text = compact(' '.join(''.join(Text(f.read_text()).parts) for f in (ROOT / 'dist').rglob('*.html')))
public_md = compact(' '.join(f.read_text() for f in (ROOT / 'src/content').rglob('*.md')))
# 同时检查 HTML 属性/注释、JS、JSON 与 source map，不能只检查页面可见文字。
text_extensions = {'.html', '.js', '.mjs', '.json', '.xml', '.txt', '.map', '.md', '.css', '.svg'}
published_files = [f for f in (ROOT / 'dist').rglob('*') if f.is_file() and f.suffix in text_extensions]
published_text = '\n'.join(f.read_text() for f in published_files)
published_text = re.sub(r'\\u([0-9a-fA-F]{4})', lambda m: chr(int(m[1], 16)), published_text)
published_text = compact(unescape(published_text))
search_texts = []
course_urls = set()
expected_titles = {'/agent-course/' + lesson['id'] + '/': lesson['title'] for lesson in CONFIG['lessons']}
for fragment in (ROOT / 'dist/pagefind/fragment').glob('*.pf_fragment'):
    data = json.loads(gzip.decompress(fragment.read_bytes()).decode().removeprefix('pagefind_dcd'))
    # 完整检查片段中的正文与元数据，不能因为 UI 仅显示摘要就忽略隐藏字段。
    search_texts.append(json.dumps(data, ensure_ascii=False))
    if data['url'].startswith('/agent-course/'):
        course_urls.add(data['url'])
        assert data['meta']['title'] == expected_titles.get(data['url']), 'Pagefind 课程标题未同步: ' + data['url']
search_text = compact(' '.join(search_texts))
expected_urls = {'/agent-course/' + lesson['id'] + '/' for lesson in CONFIG['lessons']}
assert course_urls == expected_urls, 'Pagefind 缺少课程小节或收录了额外课程页面'
checked = 0
for lesson in CONFIG['lessons']:
    if lesson['chapter'] <= 2:
        continue
    raw = (SOURCE / lesson['source']).read_text()
    candidates = []
    for line in raw.splitlines():
        text = compact(line)
        if len(text) >= 20 and len(re.findall(r'[\u4e00-\u9fff]', text)) >= 10 and not re.search(r'[!\[\]<>|]', text):
            snippet = text[:100]
            if snippet not in public_md:
                candidates.append(snippet)
    assert candidates, '缺少可核验的付费正文样本: ' + lesson['id']
    for snippet in candidates:
        assert snippet not in html_text, '付费正文出现在 HTML: ' + lesson['id']
        assert snippet not in published_text, '付费正文出现在发布文件: ' + lesson['id']
        assert snippet not in search_text, '付费正文出现在搜索索引: ' + lesson['id']
        checked += 1
print(f'课程搜索检查通过：{len(expected_urls)} 节课程及新标题被索引，{checked} 段未公开正文样本未出现在 {len(published_files)} 个发布文本文件或搜索片段中。')
