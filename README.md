# Sunday 的面试指南（AIGuide）

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
