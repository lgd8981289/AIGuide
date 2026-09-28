#!/usr/bin/env python3
"""部署指南子域名与旧 /note/ 301；备份、nginx -t 成功后重载，失败恢复。"""
import argparse
from datetime import datetime, timezone
import os
from pathlib import Path
import re
import shutil
import subprocess

ORIGIN = "https://note.lgdsunday.club"
SITE_ROOT = Path("/sunday/resume2/AIGuide")
NOTE_CONFIG = r'''# Managed by AIGuide/scripts/configure-server-seo.py.
# Match the original request URI so escaped asset names and query strings survive.
map $request_uri $aiguide_note_redirect {
    default https://note.lgdsunday.club/;
    ~^/note/(?<aiguide_note_suffix>.*)$ https://note.lgdsunday.club/$aiguide_note_suffix;
    ~^/note(?<aiguide_note_query>\?.*)$ https://note.lgdsunday.club/$aiguide_note_query;
}

server {
    listen 80;
    server_name note.lgdsunday.club;
    location ^~ /.well-known/acme-challenge/ {
        root /var/www/aiguide-acme;
        default_type text/plain;
        try_files $uri =404;
    }
    location / { return 301 https://note.lgdsunday.club$request_uri; }
}

server {
    listen 443 ssl http2;
    server_name note.lgdsunday.club;
    ssl_certificate /etc/letsencrypt/live/note.lgdsunday.club/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/note.lgdsunday.club/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    root /sunday/resume2/AIGuide;
    index index.html;
    charset utf-8;
    error_page 404 /404.html;

    # 运维文件与备份保存在项目内，但不得通过网站读取。
    location = /_ops { return 404; }
    location ^~ /_ops/ { return 404; }

    location = /404.html {
        internal;
        add_header X-Robots-Tag "noindex, follow" always;
    }
    location = /robots.txt {
        add_header Cache-Control "public, max-age=300";
        try_files $uri =404;
    }
    location ^~ /_astro/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
    location ^~ /pagefind/ {
        add_header Cache-Control "no-cache";
        try_files $uri =404;
    }
    location ~* \.(?:png|jpg|jpeg|gif|svg|ico|webp|avif|woff2?)$ {
        expires 7d;
        try_files $uri =404;
    }
    location / {
        add_header Cache-Control "no-cache";
        try_files $uri $uri/ =404;
    }
    gzip on;
    gzip_types text/plain text/css application/javascript application/json application/xml image/svg+xml;
}
'''
LEGACY_HTTP = r'''
# Keep both HTTP legacy hosts one redirect away from the matching new URL.
server {
    listen 80;
    server_name lgdsunday.club www.lgdsunday.club;
    location = /note { return 301 $aiguide_note_redirect; }
    location ^~ /note/ { return 301 $aiguide_note_redirect; }
    location / { return 301 https://$host$request_uri; }
}
'''


def patch_nginx(text, robots_file):
    for host in ("lgdsunday.club", "www.lgdsunday.club"):
        names = list(re.finditer(r"(?m)^\s*server_name\s+" + re.escape(host) + r"\s*;", text))
        if len(names) != 1:
            raise ValueError("未找到唯一的 HTTPS server_name: " + host)
        start = text.rfind("server {", 0, names[0].start())
        if start < 0:
            raise ValueError("找不到 server 起点")
        depth, end, offset = 0, None, start
        for line in text[start:].splitlines(keepends=True):
            for index, char in enumerate(line.split("#", 1)[0]):
                depth += (char == "{") - (char == "}")
                if char == "}" and depth == 0:
                    end = offset + index + 1
                    break
            if end is not None:
                break
            offset += len(line)
        if end is None:
            raise ValueError("找不到 server 终点")
        block = text[start:end]
        if not re.search(r"listen\s+443\b", block):
            raise ValueError("目标不是 HTTPS server")
        for pattern in (r"location = /note\s*\{[^{}]*\}", r"location \^~ /note/\s*\{[^{}]*\}"):
            def redirect(match):
                return match[0].split("{", 1)[0] + "{\n            return 301 $aiguide_note_redirect;\n        }"
            block, count = re.subn(pattern, redirect, block)
            if count != 1:
                raise ValueError(host + " 的 /note 路由不唯一，停止修改")
        robots_pattern = r"location = /robots\.txt\s*\{[^{}]*\}"
        found = re.findall(robots_pattern, block)
        if len(found) != 1:
            raise ValueError("主站 robots 路由发生变化，停止修改")
        alias = re.search(r"\balias\s+([^;]+);", found[0])
        if not alias or alias[1] not in (str(robots_file), "/sunday/resume2/AIGuide-seo/robots.txt"):
            raise ValueError("主站 robots 文件位置发生未知变化，停止修改")
        block = block.replace(found[0], found[0].replace(alias[1], str(robots_file)))
        block = block.replace("# 访问 /note（不带末尾斜杠）时跳到 /note/；否则请求会落进下面的 Nuxt SPA 回退，被前端路由带回首页", "# 指南已迁移至 note.lgdsunday.club；长期保留逐页永久跳转")
        block = block.replace("# ^~ 很关键：让 /note/ 下的静态资源（css/js/图片/svg）不被下面的正则 location 抢走", "# 包括旧图片地址在内，保留完整路径、编码与查询参数")
        text = text[:start] + block + text[end:]
    # 原共享 HTTP server 继续服务其他主机；主域两种写法移到专用 HTTP server。
    pattern = r"(?m)^(\s*server_name\s+)([^;\n]+)(;)"
    def split_http(match):
        names = match[2].split()
        if "lgdsunday.club" not in names or "www.lgdsunday.club" not in names:
            return match[0]
        if "resume.lgdsunday.club" not in names:
            raise ValueError("共享 HTTP server 结构变化")
        names = [n for n in names if n not in ("lgdsunday.club", "www.lgdsunday.club")]
        return match[1] + " ".join(names) + match[3]
    return re.sub(pattern, split_http, text)


def merge_robots(text):
    # 简历汪保留自己的规则和 sitemap；指南在新主机根目录声明自己的 sitemap。
    text = re.sub(r"(?mi)^Disallow:[ \t]*/note/pagefind/[ \t]*\n?", "", text)
    return re.sub(r"(?mi)^Sitemap:[ \t]*https://(?:www\.)?lgdsunday\.club/note/[^\n]*\n?", "", text)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="只检查，不写入或重载")
    parser.add_argument("--prepare", action="store_true", help="只上线新站，不切换旧地址")
    args = parser.parse_args()
    config = Path("/etc/nginx/nginx.conf")
    nginx_entry = Path("/etc/nginx/conf.d/aiguide-note.conf")
    source_robots = Path("/sunday/resume2/jian-li-wang/.output/public/robots.txt")
    seo_dir = SITE_ROOT / "_ops"
    note_config = seo_dir / "nginx-note.conf"
    robots_file = seo_dir / "main-site-robots.txt"
    old_link = os.readlink(nginx_entry) if nginx_entry.is_symlink() else None
    old_entry = nginx_entry.read_bytes() if nginx_entry.exists() and old_link is None else None
    if old_link is not None and Path(old_link) != note_config:
        raise ValueError("Nginx 入口指向未知配置，停止修改")
    if old_entry is not None and not old_entry.startswith(b"# Managed by AIGuide/scripts/configure-server-seo.py."):
        raise ValueError("Nginx 入口不是指南管理的配置，停止修改")
    original = config.read_bytes()
    if args.prepare and b"return 301 $aiguide_note_redirect;" in original:
        raise ValueError("旧地址已完成迁移，不能再运行初次上线的 --prepare")
    updated = patch_nginx(original.decode(), robots_file).encode()
    robots = merge_robots(source_robots.read_text()).encode()
    for file in ("fullchain.pem", "privkey.pem"):
        if not Path("/etc/letsencrypt/live/note.lgdsunday.club", file).is_file():
            raise ValueError("新域名证书尚未签发")
    if args.check:
        print("预检通过：证书、旧域路由及主站 robots 匹配；目标 " + str(SITE_ROOT))
        return
    if not (SITE_ROOT / "index.html").is_file():
        raise ValueError("新站内容尚未上传")
    desired = {note_config: (NOTE_CONFIG + ("" if args.prepare else LEGACY_HTTP)).encode()}
    if not args.prepare:
        desired.update({config: updated, robots_file: robots})
    previous = {p: p.read_bytes() if p.exists() else None for p in desired}
    if old_link == str(note_config) and all(previous[p] == data for p, data in desired.items()):
        print("子域名及永久跳转已是最新，无需重载")
        return
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
    backup = seo_dir / "backups" / ("note-" + stamp)
    backup.mkdir(parents=True)
    (seo_dir / "backups").chmod(0o700)
    for p in desired:
        if p.exists(): shutil.copy2(p, backup / p.name)
    if old_entry is not None:
        (backup / "nginx-entry-before.conf").write_bytes(old_entry)
    try:
        for p, data in desired.items():
            p.write_bytes(data);p.chmod(0o600 if p == note_config else 0o644)
        if old_link != str(note_config):
            # 原子替换系统入口，配置正文保存在唯一项目目录内。
            temporary_link = nginx_entry.with_suffix(".link-tmp")
            temporary_link.symlink_to(note_config)
            os.replace(temporary_link, nginx_entry)
        subprocess.run(["nginx", "-t"], check=True)
        subprocess.run(["nginx", "-s", "reload"], check=True)
    except Exception:
        for p, data in previous.items():
            if data is None: p.unlink(missing_ok=True)
            else: p.write_bytes(data)
        if old_link != str(note_config):
            nginx_entry.unlink(missing_ok=True)
            if old_link is not None: nginx_entry.symlink_to(old_link)
            elif old_entry is not None: nginx_entry.write_bytes(old_entry)
        subprocess.run(["nginx", "-t"], check=True)
        subprocess.run(["nginx", "-s", "reload"], check=True)
        raise
    print(("新站已上线，旧地址未切换" if args.prepare else "新站与旧地址逐页 301 已生效") + "；备份：" + str(backup))


if __name__ == "__main__":
    main()
