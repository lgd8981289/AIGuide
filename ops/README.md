# 搜索旧网址的 301 配置

`nginx-search-legacy-redirects.conf` 只包含 2026-10-16 实际检查过的 19 个旧文章网址，兼容带尾斜杠和不带尾斜杠的 38 个精确路径，保留查询参数。来源为本站 Bing `GetPageStats` 返回的历史落地页；新地址逐一与已发布网址登记表和线上 canonical 核对，19 个目标均返回 200。

2026-10-16 已按用户授权安装，生产环境 `nginx -t` 通过；38 个路径及其带查询参数版本全部确认返回正确 301，19 个目标均可访问。`scripts/configure-server-seo.py` 会在该文件已安装时保留 include，后续常规发布不会将其移除；新环境没有该文件时不输出 include。

提交本文件或仅构建网站不等于安装配置。它只适用于 `note.lgdsunday.club` 的 HTTPS `server` 块，不可包含进其他域名或主站的 server 块。以下步骤供后续重新安装或迁移时使用。

部署时先备份当前 `/sunday/resume2/AIGuide/_ops/nginx-note.conf` 并检查现有同路径规则，再把本文件放到受保护的 `_ops/` 目录，在该 HTTPS server 块内增加：

```nginx
include /sunday/resume2/AIGuide/_ops/nginx-search-legacy-redirects.conf;
```

必须先通过服务器上的 `nginx -t`，才可 reload。语法检查或 reload 失败时恢复原配置并复检。不要用历史的整份模板覆盖当前服务器配置；原证书、缓存、主站和旧域跳转应继续使用现有配置。

上线验收须使用不自动跟随跳转的 GET 请求，逐一确认 38 个旧路径返回 301、Location 是对应的新地址；再检查带 `?from=seo-check` 的请求仍保留参数，以及 19 个落地页的 200、自指 canonical 和可索引状态。首页、非目标文章和随机不存在路径还须分别保持 200、200、404。原 HTML 跳转页可继续作为配置回退。

本轮没有给两个缺失源稿的旧教程（`/practice/t005-context-engineering/`、`/agent-ext/t009/`）添加重定向。先查明下架原因：恢复时应使用可信原稿；只有确有等价替代内容时才建立对应 301。不要把它们统一重定向首页。

后续新规则必须先核对原页面与目标内容的对应关系，并将目标保留在已发布网址保护表中。不得根据标题相似度自动猜测迁移关系。
