# 自动化：百度普通收录每日提交（21:00）

任务：在 AIGuide 项目运行 `npm run baidu:submit`（= `python3 scripts/submit-baidu.py --submit`），把百度当日配额用满。
状态文件：`.baidu/state.json`、回执 `.baidu/receipt-<ts>.json`（均已 gitignore）。

## 执行记录

- **2026-10-08 21:00**（首次由本自动化执行）：结果 **over quota，提交 0 条**，退出码 0 → 正常。
  - 原因：当天 16:18（08:18 UTC）的首次运行已用掉全部约 10 条配额（首页 + 6 个入口页，success=7）。
  - 当前规模：线上 sitemap **601** URL（注意：已从记忆中的 561 增长到 601，文章页 460）。
  - 累计已推 7 / 601，队列下一批预计为 `/system-design/`、`/agent-ext/`、`/tutorial/`、`/tools/`、`/practice/`、`/reviews/`、`/frontend/`、`/backend/`、`/database/`（20 个入口页剩余部分），之后才是文章页。

- **2026-10-09 21:00**：结果 **成功提交 10 条，退出码 0**。首页 + 9 个入口页（system-design、agent-ext、tutorial、tools、practice、reviews、frontend、backend、database）。回执 `.baidu/receipt-20261009T130049Z.json`。
  - 规模变化：线上 sitemap **652** URL（入口页 20、文章页 500、其他 131）。累计已推 **16 / 652**。
  - 下一批（preview 实测）：首页 + 剩余 4 个新入口页（cs-basics、fullstack-system-design、programmer、companies）+ agent-course，之后是入口页轮转、再进文章页。

- **2026-10-10 21:00**：结果 **成功提交 10 条，退出码 0**（当日首次跑，deploy.sh 当天未消耗配额）。命中：首页 + 4 个新入口页（cs-basics、fullstack-system-design、programmer、companies）+ agent-course + 4 个入口页复推（ai、llm、agent、rag）。回执 `.baidu/receipt-20261010T130034Z.json`。
  - 规模变化：线上 sitemap **673** URL（入口页 20、文章页 513、其他 139）。累计已推 **21 / 673**。
  - 下一批（preview 实测）：首页 + 入口页轮转剩余（engineering、langchain、system-design、agent-ext、tutorial、tools、practice、reviews、frontend），之后进文章页。

- **2026-10-12 17:10**（本次，手动补跑；10-11 21:00 无执行记录，runs 里缺 10-11）：结果 **成功提交 10 条，退出码 0**。首页 + 9 个入口页（engineering、langchain、system-design、agent-ext、tutorial、tools、practice、reviews、frontend）**全为复推**。回执 `.baidu/receipt-20261012T091016Z.json`。
  - 规模：线上 sitemap **708** URL（首页 1｜入口页 20｜文章页 533｜其他 154）。**累计去重仅 21 个不同 URL**，从未推过 687。
  - **⚠️ 发现饥饿问题**：`plan()` 的 sort_key 以 **tier 为第一优先级**，首页+20 个入口页（共 21 条）恒在 533 个文章页之前，而日配额仅 10 → 连续 3 轮（10-09/10-10/10-12）**文章页一条都没被推到**，与「入口页推完才进文章页」的设计意图不符。属排序策略问题，非报错；按用户要求**未改脚本**，只上报 + 给建议（入口页复推降级 / 入口页设 maxCount / 入口页与文章页混排）。
  - 下一批（preview 实测）：首页 + 入口页轮转（backend、database、cs-basics、fullstack-system-design、programmer、companies、agent-course、ai、llm）。

## 判断要点（勿误判）

- `"error": 400, "message": "over quota"` + 退出码 0 = **正常**，说明当天配额已被消耗，无需重试、不改脚本。
- 若出现 `site error` / 网络不可用 / Python 异常 → 才是真故障，需原文上报，不动脚本与 deploy.sh。
- 若 21:00 这次是当天第一次跑（即 deploy.sh 当天没发布过），预期能推约 10 条。
- 队列会跨天接力，一轮覆盖完后自动开第二轮。
