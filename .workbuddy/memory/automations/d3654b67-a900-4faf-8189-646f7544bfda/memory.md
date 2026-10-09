# 自动化：百度普通收录每日提交（21:00）

任务：在 AIGuide 项目运行 `npm run baidu:submit`（= `python3 scripts/submit-baidu.py --submit`），把百度当日配额用满。
状态文件：`.baidu/state.json`、回执 `.baidu/receipt-<ts>.json`（均已 gitignore）。

## 执行记录

- **2026-10-08 21:00**（首次由本自动化执行）：结果 **over quota，提交 0 条**，退出码 0 → 正常。
  - 原因：当天 16:18（08:18 UTC）的首次运行已用掉全部约 10 条配额（首页 + 6 个入口页，success=7）。
  - 当前规模：线上 sitemap **601** URL（注意：已从记忆中的 561 增长到 601，文章页 460）。
  - 累计已推 7 / 601，队列下一批预计为 `/system-design/`、`/agent-ext/`、`/tutorial/`、`/tools/`、`/practice/`、`/reviews/`、`/frontend/`、`/backend/`、`/database/`（20 个入口页剩余部分），之后才是文章页。

## 判断要点（勿误判）

- `"error": 400, "message": "over quota"` + 退出码 0 = **正常**，说明当天配额已被消耗，无需重试、不改脚本。
- 若出现 `site error` / 网络不可用 / Python 异常 → 才是真故障，需原文上报，不动脚本与 deploy.sh。
- 若 21:00 这次是当天第一次跑（即 deploy.sh 当天没发布过），预期能推约 10 条。
- 队列会跨天接力，一轮覆盖完后自动开第二轮。
