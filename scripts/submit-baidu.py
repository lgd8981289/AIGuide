#!/usr/bin/env python3
"""百度普通收录（API 提交）：默认预览，--submit 才真正提交；仅依赖 Python 标准库。

为什么需要这个脚本（而不是靠 deploy.sh）：
  · deploy.sh 只在「你手动发布」时才推，且只推本次 rsync 改动的页面；
  · 百度单站每日配额极小（2026-10-08 实测 note.lgdsunday.club 约 10 条/天），
    561 条 sitemap 不可能一次推完，也不该反复推同一批 URL。
  · 本脚本把「推哪些」变成一条可持续的传送带：按优先级 + 是否推过排队，
    每天把当天配额用满，跨天自动接力，直到全站覆盖一轮；之后自动进入第二轮
    （队列按「最久没推过」重排），无需人工干预。

队列优先级（数字越小越先推）：
  0 首页
  1 单段入口页（/ai/ /llm/ /agent/ …，20 个模块/分类汇总页）
  2 面试题文章页（按发布日期倒序，新的先推）
  3 其余（/agent-course/ 课程章节、/companies/、/guides/ 等）

用法：
  python3 scripts/submit-baidu.py                 # 预览：只打印计划，不发请求
  python3 scripts/submit-baidu.py --submit        # 真正提交（受当日配额限制）
  python3 scripts/submit-baidu.py --submit --limit 20
  python3 scripts/submit-baidu.py --submit --offline   # 用本地 dist/sitemap-0.xml 而不是线上
"""

import argparse
from datetime import datetime, timezone
import fcntl
import json
from pathlib import Path
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
LOCAL = ROOT / ".baidu"
STATE_FILE = LOCAL / "state.json"
LOCK_FILE = LOCAL / "lock"

SITE_URL = "https://note.lgdsunday.club"
# ⚠️ 百度要求 site 参数是「站点域名」，不带协议头（部分账号带协议也能过，但不保证）
SITE = "note.lgdsunday.club"
# ⚠️ 这是「普通收录 → API 提交」的推送密钥，20 位字母数字。
#     不要和 src/data/site.ts 的 SITE_VERIFICATION.baidu 混了 —— 那个是 codeva-xxxxx 验证码。
TOKEN_DEFAULT = "O77VS8F6Br5oe0OD"
API = "http://data.zz.baidu.com/urls"

SITEMAP_LIVE = f"{SITE_URL}/sitemap-0.xml"
SITEMAP_LOCAL = ROOT / "dist" / "sitemap-0.xml"
URLS_FILE = ROOT / "scripts" / "article-published-urls.json"
DATES_FILE = ROOT / "scripts" / "article-published-dates.json"

LIMIT_DEFAULT = 10
# 连续失败这么多次就判定该 URL 无效，从队列里剔除（避免它每天白占一个配额）
INVALID_AFTER_ATTEMPTS = 3
KEEP_RUNS = 30

# 单段入口页的推送顺序：AI 类在前（差异化 + 主要增长方向），全栈类在后
ENTRY_ORDER = [
    "ai",
    "llm",
    "agent",
    "rag",
    "engineering",
    "langchain",
    "system-design",
    "agent-ext",
    "tutorial",
    "tools",
    "practice",
    "reviews",
    "frontend",
    "backend",
    "database",
    "cs-basics",
    "fullstack-system-design",
    "programmer",
    "companies",
    "agent-course",
]


def now():
    return datetime.now(timezone.utc).isoformat()


# --------------------------------------------------------------------------- #
# 配置：默认值写在脚本里，允许 .env 用 BAIDU_PUSH_TOKEN / BAIDU_SITE 覆盖
# --------------------------------------------------------------------------- #
def read_env(path):
    values = {}
    if not path.exists():
        return values
    for line in path.read_text(encoding="utf-8-sig").splitlines():
        match = re.match(r"^\s*(?:export\s+)?([^=#]+?)\s*=\s*(.*)$", line)
        if not match:
            continue
        name = re.sub(r"[-—–_]", "", match.group(1).strip()).upper()
        value = match.group(2).strip()
        if value[:1] in ('"', "'") and value[-1:] == value[:1]:
            value = value[1:-1]
        values[name] = value
    return values


def load_config():
    env = read_env(ROOT / ".env")
    return env.get("BAIDUPUSHTOKEN") or TOKEN_DEFAULT, env.get("BAIDUSITE") or SITE


# --------------------------------------------------------------------------- #
# 取 URL 列表与优先级
# --------------------------------------------------------------------------- #
def fetch_sitemap(offline):
    if not offline:
        try:
            with urllib.request.urlopen(SITEMAP_LIVE, timeout=20) as resp:
                return resp.read().decode("utf-8"), "线上 sitemap"
        except Exception as error:  # noqa: BLE001 - 线上拿不到就退回本地
            print(f"    ! 线上 sitemap 读取失败（{error}），改用本地 dist/")
    if not SITEMAP_LOCAL.exists():
        raise SystemExit(f"✗ 找不到 {SITEMAP_LOCAL}，请先 npm run build 或去掉 --offline")
    return SITEMAP_LOCAL.read_text(encoding="utf-8"), "本地 dist/sitemap-0.xml"


def parse_sitemap(xml_text):
    # 命名空间无关地取所有 <loc>
    return re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", xml_text)


def article_index():
    """返回 {完整URL: (发布日期, 序号)}，用于文章页排序。"""
    try:
        urls = json.loads(URLS_FILE.read_text(encoding="utf-8")).get("articles", {})
    except (OSError, json.JSONDecodeError):
        urls = {}
    try:
        dates = json.loads(DATES_FILE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        dates = {}
    index = {}
    for article_id, path in urls.items():
        index[f"{SITE_URL}{path}"] = (dates.get(article_id, "0000-00-00"), article_id)
    return index


def path_of(url):
    return urllib.parse.urlparse(url).path


def build_queue(all_urls):
    """给每个 URL 算出 (tier, order)，按优先级排序。"""
    articles = article_index()
    # 文章页：按发布日期倒序 → order = 负的日期序号
    newest_first = sorted(articles.keys(), key=lambda u: (articles[u][0], articles[u][1]), reverse=True)
    article_order = {url: i for i, url in enumerate(newest_first)}

    row_rank = {name: i for i, name in enumerate(ENTRY_ORDER)}
    queue = []
    for url in all_urls:
        path = path_of(url)
        segments = [s for s in path.split("/") if s]
        if path == "/" or not segments:
            queue.append((url, 0, 0))
        elif len(segments) == 1:
            name = segments[0]
            queue.append((url, 1, row_rank.get(name, len(ENTRY_ORDER))))
        elif url in article_order:
            queue.append((url, 2, article_order[url]))
        else:
            queue.append((url, 3, 0))
    # 同 tier 内按 order 稳定排序
    queue.sort(key=lambda item: (item[1], item[2], item[0]))
    return queue


# --------------------------------------------------------------------------- #
# 状态
# --------------------------------------------------------------------------- #
def load_state():
    if not STATE_FILE.exists():
        return {"version": 1, "site": SITE, "urls": {}, "invalid": [], "runs": []}
    try:
        state = json.loads(STATE_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        print("    ! state.json 损坏，已重置")
        return {"version": 1, "site": SITE, "urls": {}, "invalid": [], "runs": []}
    state.setdefault("urls", {})
    state.setdefault("invalid", [])
    state.setdefault("runs", [])
    return state


def save_state(state):
    state["updatedAt"] = now()
    state["runs"] = state["runs"][-KEEP_RUNS:]
    LOCAL.mkdir(parents=True, exist_ok=True)
    tmp = STATE_FILE.with_suffix(".tmp")
    tmp.write_text(json.dumps(state, ensure_ascii=False, indent=2, sort_keys=True), encoding="utf-8")
    tmp.replace(STATE_FILE)


def plan(queue, state):
    """按「没推过的优先 → 推过但最久没推的优先」排出一条待推队列。"""
    records = state["urls"]
    invalid = set(state["invalid"])

    def sort_key(item):
        url, tier, order = item
        record = records.get(url)
        pushed = record is not None
        return (tier, 1 if pushed else 0, (record or {}).get("lastPushedAt") or "", order, url)

    candidates = [item for item in queue if item[0] not in invalid]
    return sorted(candidates, key=sort_key)


# --------------------------------------------------------------------------- #
# 提交
# --------------------------------------------------------------------------- #
def post(urls, site, token):
    body = ("\n".join(urls) + "\n").encode("utf-8")
    request = urllib.request.Request(
        f"{API}?site={urllib.parse.quote(site)}&token={urllib.parse.quote(token)}",
        data=body,
        headers={"Content-Type": "text/plain"},
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        raw = error.read().decode("utf-8", "replace")
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return {"error": error.code, "message": raw[:200]}


def mark(state, urls, ok):
    for url in urls:
        record = state["urls"].setdefault(url, {"firstPushedAt": None, "lastPushedAt": None, "count": 0, "attempts": 0})
        record["attempts"] = record.get("attempts", 0) + 1
        if ok:
            record["count"] = record.get("count", 0) + 1
            record["lastPushedAt"] = now()
            if not record.get("firstPushedAt"):
                record["firstPushedAt"] = record["lastPushedAt"]
        elif record["attempts"] >= INVALID_AFTER_ATTEMPTS:
            state["invalid"].append(url)


def push(queue, state, site, token, limit):
    remaining = [item for item in queue]
    sent = []
    receipts = []

    # 第一步：先用单条探测当日剩余配额（百度返回的 remain 是「这一批之后还剩多少」）
    probe = remaining.pop(0)
    resp = post([probe[0]], site, token)
    receipts.append(resp)
    if "success" not in resp:
        message = str(resp.get("message", ""))
        # 配额用完是「今天的正常状态」，不是这个 URL 有问题 → 不计失败次数，
        # 否则连续几天在配额用完后运行会把队首 URL 误判成无效。
        if "quota" in message.lower():
            print(f"    今日配额已用完（{message}），本次不再提交")
            return sent, resp
        print(f"    ✗ 首条提交未成功：{json.dumps(resp, ensure_ascii=False)[:200]}")
        mark(state, [probe[0]], ok=False)
        return sent, resp

    mark(state, [probe[0]], ok=True)
    sent.append(probe[0])
    quota = int(resp.get("remain", 0) or 0)
    print(f"    首条已提交，当日剩余配额：{quota}")

    # 第二步：把剩余配额（且不超过 --limit）用掉
    batch_size = max(0, min(quota, limit - 1, len(remaining)))
    if batch_size:
        batch = [item[0] for item in remaining[:batch_size]]
        resp2 = post(batch, site, token)
        receipts.append(resp2)
        accepted = int(resp2.get("success", 0) or 0)
        mark(state, batch[:accepted], ok=True)
        mark(state, batch[accepted:], ok=False)
        sent.extend(batch[:accepted])
        print(f"    批量提交 {len(batch)} 条 → 成功 {accepted} 条，剩余配额 {resp2.get('remain', '?')}")
        if resp2.get("not_same_site"):
            print(f"    ! 有 {len(resp2['not_same_site'])} 条不属于本站，已忽略")
    save_state(state)
    return sent, (receipts[-1] if receipts else {})


# --------------------------------------------------------------------------- #
# 主流程
# --------------------------------------------------------------------------- #
def main():
    parser = argparse.ArgumentParser(description="百度普通收录 API 提交（配额轮转）")
    parser.add_argument("--submit", action="store_true", help="真正提交；不加只预览")
    parser.add_argument("--limit", type=int, default=LIMIT_DEFAULT, help=f"本次最多推多少条（默认 {LIMIT_DEFAULT}）")
    parser.add_argument("--offline", action="store_true", help="用本地 dist/sitemap-0.xml 而不是线上 sitemap")
    parser.add_argument("--status", action="store_true", help="只看进度，不规划本次提交")
    args = parser.parse_args()

    token, site = load_config()
    xml_text, source = fetch_sitemap(args.offline)
    all_urls = sorted(set(parse_sitemap(xml_text)))
    if not all_urls:
        raise SystemExit("✗ sitemap 里没有解析出任何 URL")

    state = load_state()
    queue = plan(build_queue(all_urls), state)
    pushed = sum(1 for url in all_urls if url in state["urls"])
    never = sum(1 for item in queue if item[0] not in state["urls"])
    tiers = {}
    for _, tier, _ in queue:
        tiers[tier] = tiers.get(tier, 0) + 1

    print(f"站点：{site}    来源：{source}")
    print(f"共 {len(all_urls)} 个 URL｜已推过 {pushed}｜从未推过 {never}｜已判无效 {len(state['invalid'])}")
    print(f"分层：首页 {tiers.get(0, 0)}｜入口页 {tiers.get(1, 0)}｜文章页 {tiers.get(2, 0)}｜其他 {tiers.get(3, 0)}")

    if args.status:
        if state["runs"]:
            last = state["runs"][-1]
            print(f"上次运行：{last.get('at')}｜提交 {last.get('success', 0)} 条")
        return 0

    if not queue:
        print("\n本轮已全部推过，下次运行会自动开始新一轮。")
        return 0

    todo = queue[: args.limit]
    print(f"\n本次计划（最多 {args.limit} 条，实际受当日配额限制）：")
    for url, tier, _ in todo:
        flag = "新" if url not in state["urls"] else "复"
        print(f"  [{tier}][{flag}] {url}")

    if not args.submit:
        print("\n预览模式：未发任何请求。加 --submit 才会真正提交。")
        return 0

    print("\n开始提交 ……")
    LOCAL.mkdir(parents=True, exist_ok=True)
    with LOCK_FILE.open("w") as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except OSError:
            print("    ! 已有另一个提交任务在跑，本次跳过")
            return 0
        sent, last_resp = push(queue, state, site, token, args.limit)
        state["runs"].append({
            "at": now(),
            "success": len(sent),
            "remain": last_resp.get("remain"),
            "urls": sent,
            "source": source,
        })
        save_state(state)

    receipt = LOCAL / f"receipt-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}.json"
    receipt.write_text(json.dumps({"sent": sent, "response": last_resp}, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n✓ 本次提交 {len(sent)} 条，回执：{receipt.relative_to(ROOT)}")
    if len(sent) == 0:
        # 「今天配额已经用完」是正常状态，不该让定时任务报错
        if "quota" in str(last_resp.get("message", "")).lower():
            print("  （今日配额已用完，明天继续）")
            return 0
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
