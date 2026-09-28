#!/usr/bin/env python3
"""线上验收新站与四种旧域地址：逐页 301、canonical、资源、robots、404。"""
import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
import json
from urllib.error import HTTPError
from urllib.parse import urlsplit, urljoin, quote
from urllib.request import Request, build_opener, HTTPRedirectHandler
import xml.etree.ElementTree as ET
from importlib.util import spec_from_file_location, module_from_spec

spec = spec_from_file_location('seo', Path(__file__).with_name('check-seo.py'))
seo = module_from_spec(spec);spec.loader.exec_module(seo)
NEW = 'https://note.lgdsunday.club'
class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl): return None

def fetch(url, head=False):
    req = Request(url, method='HEAD' if head else 'GET', headers={'User-Agent': 'AIGuide-Migration-Check/1.0'})
    try: response = build_opener(NoRedirect).open(req, timeout=25)
    except HTTPError as e: response = e
    with response:
        return response.status, dict(response.headers), response.read() if not head else b''

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--old-sitemap', required=True)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    old = [x.text for x in ET.parse(args.old_sitemap).findall('s:url/s:loc', seo.NS)]
    status, _, body = fetch(NEW + '/sitemap-0.xml')
    assert status == 200
    new = [x.text for x in ET.fromstring(body).findall('s:url/s:loc', seo.NS)]
    assert set(new) == {u.replace('https://lgdsunday.club/note/', NEW+'/', 1) for u in old}
    resources = set()
    def page_check(url):
        status, _, body = fetch(url)
        assert status == 200, (url, status)
        page = seo.Page(body.decode())
        assert page.canonical == [url], (url, page.canonical)
        assert page.meta.get('og:site_name') == 'Sunday 的面试指南'
        assert 'noindex' not in page.meta.get('robots', '')
        assert '/note/img/' not in body.decode()
        assets = []
        for img in page.images:
            src = img.get('src') or img.get('data-src')
            if src and src.startswith('/'): assets.append(urljoin(NEW, src))
        return {'url': url, 'status': status, 'canonical': page.canonical[0]}, assets
    with ThreadPoolExecutor(max_workers=6) as pool:
        checked = list(pool.map(page_check, new))
    for _, assets in checked: resources.update(assets)
    cases = []
    for host in ('lgdsunday.club', 'www.lgdsunday.club'):
        for scheme in ('http', 'https'):
            for u in old:
                cases.append((scheme+'://'+host+urlsplit(u).path, u.replace('https://lgdsunday.club/note/',NEW+'/',1)))
            for suffix, target in [('/note', '/'),('/note?utm_source=migration&x=%E4%B8%AD', '/?utm_source=migration&x=%E4%B8%AD'),('/note/rag/q040/?a=1&b=%2F', '/rag/q040/?a=1&b=%2F')]:
                cases.append((scheme+'://'+host+suffix, NEW+target))
    # 中文图片和空格编码也必须在旧链接跳转中原样保留。
    for resource in sorted(resources):
        path = urlsplit(resource).path
        cases.append(('https://lgdsunday.club/note'+path, NEW+path))
    def redirect_check(case):
        url, target = case
        status, headers, _ = fetch(url, True)
        assert status == 301 and headers.get('Location') == target, (url,status,headers.get('Location'),target)
        return {'url':url,'status':status,'location':target}
    with ThreadPoolExecutor(max_workers=6) as pool:
        redirects = list(pool.map(redirect_check,cases))
    resources.update(NEW+p for p in ['/apple-touch-icon.png','/favicon.svg','/og-cover.jpg','/pagefind/pagefind.js','/sitemap-index.xml','/sitemap.xml'])
    def resource_check(url):
        status,_,_ = fetch(url,True)
        assert status == 200,(url,status)
        return {'url':url,'status':status}
    with ThreadPoolExecutor(max_workers=6) as pool: assets = list(pool.map(resource_check,sorted(resources)))
    status,_,body=fetch(NEW+'/robots.txt');assert status==200 and (NEW+'/sitemap-index.xml').encode() in body
    status,_,body=fetch(NEW+'/migration-missing-page/');assert status==404 and 'noindex' in seo.Page(body.decode()).meta.get('robots','')
    for host in ('lgdsunday.club','www.lgdsunday.club'):
        status,_,body=fetch('https://'+host+'/');assert status==200 and '简历汪'.encode() in body
        status,_,body=fetch('https://'+host+'/robots.txt');assert status==200 and b'/note/' not in body
    status,headers,_=fetch('http://note.lgdsunday.club/rag/q040/?from=http',True)
    assert status==301 and headers.get('Location')==NEW+'/rag/q040/?from=http'
    report={'checkedAt':datetime.now(timezone.utc).isoformat(),'pages':[r for r,_ in checked],'redirects':redirects,'resources':assets,'robots404MainSites':'passed'}
    dest=Path(args.output);dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(json.dumps(report,ensure_ascii=False,indent=2))
    print(f'线上迁移验收通过：{len(new)} 个页面、{len(redirects)} 个逐页跳转、{len(assets)} 个资源；robots、404、主站和 HTTP/HTTPS 正常。')
if __name__=='__main__': main()
