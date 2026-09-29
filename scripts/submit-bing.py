#!/usr/bin/env python3
"""Bing URL Submission API：默认预览，--submit 才提交；仅依赖 Python 标准库。"""

import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import fcntl
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SITE = "https://note.lgdsunday.club/"
API = "https://ssl.bing.com/webmaster/api.svc/json/"
LOCAL = ROOT / ".bing"
MAX_BYTES = 8 * 1024 * 1024


class SubmissionError(Exception):
    pass


class ApiError(SubmissionError):
    def __init__(self, message, uncertain=False):
        super().__init__(message)
        self.uncertain = uncertain


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def now():
    return datetime.now(timezone.utc).isoformat()


def read_key(path):
    # 不 source .env，兼容用户现有的连字符／长破折号键名。
    values = []
    for line in path.read_text(encoding="utf-8-sig").splitlines():
        match = re.match(r"^\s*(?:export\s+)?([^=#]+?)\s*=\s*(.*)$", line)
        if not match:
            continue
        name = re.sub(r"[-—–_]", "", match[1].strip()).upper()
        if name != "BINGAPIKEY":
            continue
        value = match[2].strip()
        if value[:1] in ('"', "'"):
            quote = value[0]
            end = value.find(quote, 1)
            if end < 0 or value[end + 1:].strip().split("#", 1)[0].strip():
                raise SubmissionError("Bing API Key 的引号格式不正确")
            value = value[1:end]
        else:
            value = re.split(r"\s+#", value, maxsplit=1)[0].strip()
        values.append(value)
    if len(values) != 1 or not values[0]:
        raise SubmissionError(".env 中需要唯一且非空的 BING_API_KEY（也支持 BING-API—KEY）")
    return values[0]


def request(url, payload=None):
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode() if payload is not None else None,
        headers={"User-Agent": "AIGuide-BingSubmit/1.0", "Content-Type": "application/json; charset=utf-8"},
        method="POST" if payload is not None else "GET",
    )
    # API Key 位于官方要求的查询参数中，禁止重定向和输出请求 URL。
    with urllib.request.build_opener(NoRedirect).open(req, timeout=30) as response:
        body = response.read(MAX_BYTES + 1)
        if len(body) > MAX_BYTES:
            raise SubmissionError("响应过大，已停止处理")
        return body, response.headers


def api_call(key, method, params=None, post=False):
    params = params or {}
    query = {"apikey": key, **({} if post else params)}
    try:
        body, _ = request(API + method + "?" + urllib.parse.urlencode(query), params if post else None)
    except urllib.error.HTTPError as error:
        raise ApiError(f"{method} 返回 HTTP {error.code}", uncertain=error.code >= 500) from None
    except Exception as error:
        raise ApiError(f"{method} 未取得可确认的响应（{type(error).__name__}）", uncertain=True) from None
    try:
        result = json.loads(body)
    except (ValueError, UnicodeError):
        raise ApiError(f"{method} 返回非 JSON 响应", uncertain=True) from None
    if not isinstance(result, dict) or "d" not in result or "ErrorCode" in result:
        raise ApiError(f"{method} 响应结构异常", uncertain=True)
    return result["d"]


def validate_url(url):
    parsed = urllib.parse.urlsplit(url)
    if parsed.scheme != "https" or parsed.netloc != urllib.parse.urlsplit(SITE).netloc or parsed.query or parsed.fragment:
        raise SubmissionError("地图中存在非本站规范 URL，已停止")
    return url


def sitemap_urls():
    pending = [SITE + "sitemap-index.xml"]
    visited, urls = set(), []
    while pending:
        address = pending.pop(0)
        if address in visited:
            continue
        validate_url(address)
        visited.add(address)
        if len(visited) > 20:
            raise SubmissionError("网站地图层级或数量超出本脚本限制")
        body, _ = request(address)
        root = ET.fromstring(body)
        kind = root.tag.rsplit("}", 1)[-1]
        locations = [validate_url(n.text.strip()) for n in root.iter() if n.tag.rsplit("}", 1)[-1] == "loc" and n.text]
        if kind == "sitemapindex":
            pending.extend(locations)
        elif kind == "urlset":
            urls.extend(locations)
        else:
            raise SubmissionError("无法识别网站地图格式")
    return list(dict.fromkeys(urls))


class PageHead(HTMLParser):
    def __init__(self):
        super().__init__()
        self.canonical, self.robots = [], []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "link" and "canonical" in attrs.get("rel", "").lower().split():
            self.canonical.append(attrs.get("href"))
        if tag == "meta" and attrs.get("name", "").lower() in ("robots", "bingbot"):
            self.robots.append(attrs.get("content", ""))


def inspect_page(url):
    try:
        body, headers = request(url)
        parser = PageHead()
        parser.feed(body.decode("utf-8"))
        directives = " ".join(parser.robots + [headers.get("X-Robots-Tag", "")]).lower()
        if parser.canonical != [url] or re.search(r"\b(noindex|none)\b", directives):
            raise SubmissionError("canonical 不匹配或页面禁止索引")
        if "text/html" not in headers.get("Content-Type", "").lower():
            raise SubmissionError("页面响应不是 HTML")
        return {"url": url, "sha256": hashlib.sha256(body).hexdigest()}
    except urllib.error.HTTPError as error:
        return {"url": url, "error": f"HTTP {error.code}"}
    except Exception as error:
        return {"url": url, "error": str(error) if isinstance(error, SubmissionError) else type(error).__name__}


def write_json(path, value):
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")
    temporary.replace(path)


def select_batch(pages, state, quota):
    for value in (quota.get("DailyQuota"), quota.get("MonthlyQuota")):
        if type(value) is not int or value < 0:
            raise SubmissionError("接口未返回有效的日／月剩余额度")
    if any(record.get("status") == "pending" for record in state.values()):
        raise SubmissionError("存在上次结果未确认的提交，已阻止自动重试；请先核对 .bing/state.json 和回执")
    changed = [p for p in pages if state.get(p["url"], {}).get("status") != "accepted" or state[p["url"]].get("sha256") != p["sha256"]]
    limit = min(500, quota["DailyQuota"], quota["MonthlyQuota"])
    return changed, changed[:limit]


def run(args):
    key = read_key(ROOT / ".env")
    sites = api_call(key, "GetUserSites")
    if not any(s.get("Url", "").rstrip("/") == SITE.rstrip("/") and s.get("IsVerified") is True for s in sites):
        raise SubmissionError("API Key 未获得目标站点的已验证访问权限")
    quota = api_call(key, "GetUrlSubmissionQuota", {"siteUrl": SITE})
    urls = sitemap_urls()
    print(f"线上地图：{len(urls)} 个 URL；剩余日额度 {quota['DailyQuota']}，月额度 {quota['MonthlyQuota']}", flush=True)
    with ThreadPoolExecutor(max_workers=4) as pool:
        pages = list(pool.map(inspect_page, urls))
    bad = [p for p in pages if "error" in p]
    if bad:
        print(json.dumps(bad, ensure_ascii=False))
        raise SubmissionError("部分页面预检失败，本轮没有提交")
    state_file = LOCAL / "state.json"
    state = json.loads(state_file.read_text()) if state_file.exists() else {}
    changed, batch = select_batch(pages, state, quota)
    print(f"预检通过 {len(pages)}；新增／变化 {len(changed)}；未变化跳过 {len(pages) - len(changed)}；本轮可提交 {len(batch)}", flush=True)
    if not args.submit:
        print("预览完成。运行 npm run bing:submit 才会提交 URL。")
        return 0
    if not batch:
        print("无需提交。" if not changed else "额度不足，待额度恢复后重新运行。")
        return 0 if not changed else 2
    started = now()
    receipt = {"started_at": started, "site": SITE, "method": "SubmitUrlBatch", "quota_before": quota, "url_count": len(batch), "urls": [p["url"] for p in batch]}
    receipt_file = LOCAL / ("receipt-" + datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ") + ".json")
    # 先记录在途状态；即使进程中断，也不盲目重复消耗额度。
    for page in batch:
        state[page["url"]] = {"sha256": page["sha256"], "status": "pending", "requested_at": started}
    write_json(state_file, state)
    try:
        response = api_call(key, "SubmitUrlBatch", {"siteUrl": SITE, "urlList": receipt["urls"]}, post=True)
        if response is not None:
            raise ApiError("SubmitUrlBatch 未返回文档定义的成功结果", uncertain=True)
    except ApiError as error:
        receipt.update(status="unknown" if error.uncertain else "rejected", error=str(error))
        if not error.uncertain:
            for page in batch:
                state[page["url"]]["status"] = "rejected"
            write_json(state_file, state)
        write_json(receipt_file, receipt)
        raise
    receipt.update(status="accepted", http_status=200, response={"d": None}, finished_at=now())
    write_json(receipt_file, receipt)
    for page in batch:
        state[page["url"]].update(status="accepted", accepted_at=receipt["finished_at"])
    write_json(state_file, state)
    print(f"Bing 已接收 {len(batch)} 个 URL（HTTP 200），不代表已收录。回执：{receipt_file}", flush=True)
    try:
        after = api_call(key, "GetUrlSubmissionQuota", {"siteUrl": SITE})
        receipt["quota_after"] = after
        write_json(receipt_file, receipt)
        print(f"剩余日额度 {after['DailyQuota']}，月额度 {after['MonthlyQuota']}")
    except ApiError as error:
        print(f"提交已成功；提交后额度查询失败：{error}")
    remaining = len(changed) - len(batch)
    if remaining:
        print(f"还有 {remaining} 个 URL 未提交；额度允许时再次运行会继续处理。")
    return 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--submit", action="store_true", help="实际提交；默认只做预览")
    args = parser.parse_args()
    LOCAL.mkdir(mode=0o700, exist_ok=True)
    try:
        with (LOCAL / "submit.lock").open("a") as lock:
            fcntl.flock(lock.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
            return run(args)
    except BlockingIOError:
        print("另一个 Bing 提交流程正在运行。", file=sys.stderr)
    except SubmissionError as error:
        print(f"已停止：{error}", file=sys.stderr)
    except Exception as error:
        # 不输出 traceback，避免网络错误把含 API Key 的 URL 带入日志。
        print(f"已停止：{type(error).__name__}。请检查文件格式、网络和本地提交状态。", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
