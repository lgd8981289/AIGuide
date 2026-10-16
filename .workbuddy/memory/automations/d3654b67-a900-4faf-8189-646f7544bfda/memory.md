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

- **2026-10-12 21:53**（本次，本自动化 21:00 窗口）：结果 **over quota，提交 0 条，退出码 0** → 正常。原因：当天 17:10 的补跑已把约 10 条配额用完。回执 `.baidu/receipt-20261012T135330Z.json`。
  - 规模：线上 sitemap **708** URL（首页 1｜入口页 20｜文章页 533｜其他 154）。累计已推 **21 / 708**（去重后仍是 21 个不同 URL，从未推过 687）。
  - 本批计划（全为**复推**，因配额为零未发出）：首页 + backend、database、cs-basics、fullstack-system-design、programmer、companies、agent-course、ai、llm。
  - **饥饿问题仍未解决**：连续 4 轮（10-09/10-10/10-12×2）文章页 0 条入队，入口页恒占前排。按用户要求未改脚本，仅记录 + 建议（入口页复推降级 / 入口页设 maxCount / 入口页与文章页混排）。

- **2026-10-13 23:12**（本次，本自动化 21:00 窗口延迟执行）：结果 **成功提交 10 条，退出码 0**（当天首次跑，deploy.sh 未消耗配额）。命中首页 + backend、database、cs-basics、fullstack-system-design、programmer、companies、agent-course、ai、llm，**10 条全部为复推**。回执 `.baidu/receipt-20261013T151212Z.json`。
  - 规模：线上 sitemap **761** URL（首页 1｜入口页 20｜文章页 569｜其他 171）。累计去重仍 **21 / 761**，从未推过 740。
  - 下一批（preview 实测）：首页 + agent、rag、engineering、langchain、system-design、agent-ext、tutorial、tools、practice —— **仍全为复推**。
  - **饥饿问题持续第 5 轮**（10-09/10-10/10-12×2/10-13）：文章页 0 条入队，21 条「首页+入口页」恒占前排把 10 条/天配额吃干。建议（未执行，待用户定）：入口页复推降级为「轮转一轮后才允许复推」/ 入口页设 maxCount / 入口页与文章页混排。

- **2026-10-13 23:16**（本次，21:00 窗口的第二次触发/延迟）：结果 **over quota，提交 0 条，退出码 0** → 正常。原因：当天 23:12 的上一次运行已把约 10 条配额用完。回执 `.baidu/receipt-20261013T151608Z.json`。
  - 规模：线上 sitemap **761** URL（首页 1｜入口页 20｜文章页 569｜其他 171）。累计去重仍 **21 / 761**，从未推过 740。
  - 本批计划（全为**复推**，因配额为零未发出）：首页 + agent、rag、engineering、langchain、system-design、agent-ext、tutorial、tools、practice。
  - **饥饿问题持续第 6 轮**（10-09/10-10/10-12×2/10-13×2）：文章页 0 条入队。建议同前（入口页复推降级 / 入口页设 maxCount / 入口页与文章页混排），未执行，待用户定。

- **2026-10-14 21:00**（本次）：结果 **成功提交 10 条，退出码 0**（当天首次跑，deploy.sh 未消耗配额）。命中首页 + `/python/`（**唯一新增，新入口页**）+ 8 个入口页复推（agent、rag、engineering、langchain、system-design、agent-ext、tutorial、tools）。回执 `.baidu/receipt-20261014T130050Z.json`。
  - 规模：线上 sitemap **861** URL（首页 1｜入口页 21｜文章页 637｜其他 202）。累计去重 **22 / 861**，从未推过 839。
  - 下一批（preview 实测）：首页 + practice、reviews、frontend、backend、database、cs-basics、fullstack-system-design、programmer、companies —— **仍全为复推**。
  - **饥饿问题持续第 7 轮**（10-09/10-10/10-12×2/10-13×2/10-14）：637 个文章页 0 条入队，21 条「首页+入口页」恒占前排把 10 条/天配额吃干。建议（未执行，待用户定）：入口页复推降级为「轮转一轮后才允许复推」/ 入口页设 maxCount / 入口页与文章页混排。

- **2026-10-14 22:11**（本次，21:00 窗口的第二次触发）：结果 **over quota，提交 0 条，退出码 0** → 正常。原因：当天 21:00 的上一次运行已把约 10 条配额用完。回执 `.baidu/receipt-20261014T141129Z.json`。
  - 规模：线上 sitemap **861** URL（首页 1｜入口页 21｜文章页 637｜其他 202）。累计去重 **22 / 861**，从未推过 839。
  - 本批计划（全为**复推**，因配额为零未发出）：首页 + practice、reviews、frontend、backend、database、cs-basics、fullstack-system-design、programmer、companies。
  - **饥饿问题持续第 8 轮**（10-09/10-10/10-12×2/10-13×2/10-14×2）：637 个文章页 0 条入队，21 条「首页+入口页」恒占前排把 10 条/天配额吃干。建议（未执行，待用户定）：入口页复推降级为「轮转一轮后才允许复推」/ 入口页设 maxCount / 入口页与文章页混排。

- **2026-10-15 21:00**（本次）：结果 **成功提交 10 条，退出码 0**（当天首次跑，deploy.sh 未消耗配额）。命中首页 + `/go/`（**唯一新增入口页**）+ 8 个入口页复推（practice、reviews、frontend、backend、database、cs-basics、fullstack-system-design、programmer）。回执 `.baidu/receipt-20261015T130100Z.json`。
  - 规模：线上 sitemap **954** URL（首页 1｜入口页 22｜文章页 700｜其他 231）。累计去重 **23 / 954**，从未推过 931。
  - 下一批（preview 实测，未发请求）：首页 + companies、agent-course、ai、llm、python、agent、rag、engineering、langchain —— **仍全为复推**。
  - **饥饿问题持续第 9 轮**（10-09 起）：700 个文章页 0 条入队，22 条「首页+入口页」恒占前排把 10 条/天配额吃干。建议（未执行，待用户定）：入口页复推降级为「轮转一轮后才允许复推」/ 入口页设 maxCount / 入口页与文章页混排。

## 判断要点（勿误判）

- `"error": 400, "message": "over quota"` + 退出码 0 = **正常**，说明当天配额已被消耗，无需重试、不改脚本。
- 若出现 `site error` / 网络不可用 / Python 异常 → 才是真故障，需原文上报，不动脚本与 deploy.sh。
- 若 21:00 这次是当天第一次跑（即 deploy.sh 当天没发布过），预期能推约 10 条。
- 队列会跨天接力，一轮覆盖完后自动开第二轮。
