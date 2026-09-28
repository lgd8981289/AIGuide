# Sunday 的面试指南（AIGuide）

网站入口：[note.lgdsunday.club](https://note.lgdsunday.club/)。指南部署在独立子域名的根目录；原 `lgdsunday.club/note/` 和 `www.lgdsunday.club/note/` 均逐页 301 到新地址。

## 服务器目录

服务器只保留 `/sunday/resume2/AIGuide/` 一个项目目录：

```text
AIGuide/
├── index.html、文章、图片等网站文件
├── BingSiteAuth.xml
└── _ops/                    # 运维文件，网站禁止访问
    ├── nginx-note.conf      # 新域名的 Nginx 配置
    ├── main-site-robots.txt # 简历汪主站使用的 robots
    └── backups/             # 内容和配置备份
```

`/etc/nginx/conf.d/aiguide-note.conf` 是指向上述 `nginx-note.conf` 的符号链接。证书仍由系统 `/etc/letsencrypt/` 管理。上传站长验证文件时，放在 `AIGuide/` 根目录；本地同时放入 `public/`，以便随构建发布。

发布脚本会保护 `_ops/` 和 Bing 验证文件；打包内容备份时排除 `_ops/`，避免重复备份历史备份。目录合并详情见 [单目录维护记录](docs/audits/2026-09-29-single-directory.md)。

<div align="center">

<img src="assets/wechat-qrcode.jpg" alt="微信搜一搜或扫码关注公众号：程序员Sunday" width="520">

<br>

<b>微信搜一搜「程序员Sunday」，或扫码关注</b>
<br>
新文章第一时间推送 · 站点文章需要解锁时，回复「验证码」领取链接

</div>

## 仓库范围

本仓库只保存站点代码和配置，不提交文章正文、文章配图及生成缓存：

- `src/content/articles/`：由 `npm run sync` 从本地文章目录同步。
- `public/img/`、`img-src/`：同步、处理生成的文章配图。
- `.astro/`、`dist/`：构建缓存和产物。

这些文件保留在本地，仍可通过 `./deploy.sh --sync` 同步、构建和部署。
新克隆仓库需要先准备 `scripts/sources.json` 指定的本地文章来源，再运行同步。

迁移验收与恢复位置见 [2026-09-28 子域名迁移记录](docs/audits/2026-09-28-note-migration.md)。旧 `/note/` 的跳转至少保留至 2027-09-28，建议长期保留。
