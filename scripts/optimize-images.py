#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
图片优化：把 img-src/ 里打好水印的原图压成 WebP，输出到 public/img/
并在 public/img/.manifest.json 里记录每张图的尺寸与新文件名，供构建后回写 HTML 用。

- 原图只留在 img-src/（不进仓库、不进部署产物），public/img 里只有 WebP
- 增量：WebP 已存在且不比原图旧时跳过（重复构建很快）
- 尺寸上限 MAX_WIDTH：超宽截图等比缩小（默认 1600，正文栏宽 760，放大查看也够）

由 scripts/py.mjs 挑选带 Pillow 的解释器后调用；也可直接跑：python3 scripts/optimize-images.py --force
"""

import json
import sys
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:  # pragma: no cover
    print("错误：需要 Pillow，请先安装：pip3 install Pillow", file=sys.stderr)
    sys.exit(1)

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = SCRIPT_DIR.parent
SRC_DIR = ROOT / "img-src"
OUT_DIR = ROOT / "public" / "img"
MANIFEST = OUT_DIR / ".manifest.json"

MAX_WIDTH = 1600
QUALITY = 88  # 教程多是截图、文字多，质量给高一点
SUPPORTED = {".png", ".jpg", ".jpeg", ".webp"}
FORCE = "--force" in sys.argv or "-f" in sys.argv
# Pillow 10 起 Image.LANCZOS 改名，这里做兼容
LANCZOS = getattr(getattr(Image, "Resampling", Image), "LANCZOS")


def optimize_one(src: Path, dst: Path):
    """返回 (宽, 高, 是否重新生成)"""
    if not FORCE and dst.exists() and dst.stat().st_mtime >= src.stat().st_mtime:
        with Image.open(dst) as cached:
            return cached.width, cached.height, False

    dst.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(src) as raw:
        img = ImageOps.exif_transpose(raw)
        if img.width > MAX_WIDTH:
            ratio = MAX_WIDTH / img.width
            img = img.resize(
                (MAX_WIDTH, max(1, round(img.height * ratio))), LANCZOS
            )
        size = img.size
        img.convert("RGBA").save(dst, format="WEBP", quality=QUALITY, method=6)
    return size[0], size[1], True


def main():
    if not SRC_DIR.exists():
        print("  提示：img-src/ 不存在（先跑 npm run sync 生成原图），跳过图片优化")
        return 0

    manifest = {}
    built = skipped = 0
    raw_bytes = webp_bytes = 0

    for src in sorted(SRC_DIR.rglob("*")):
        if not src.is_file() or src.suffix.lower() not in SUPPORTED:
            continue

        rel = src.relative_to(SRC_DIR)  # 例如 Q003/xxx.png
        dst = (OUT_DIR / rel).with_suffix(".webp")
        width, height, is_new = optimize_one(src, dst)

        built += 1 if is_new else 0
        skipped += 0 if is_new else 1
        raw_bytes += src.stat().st_size
        webp_bytes += dst.stat().st_size

        # key = 原图在站内的路径（md 里引用的就是这个），value 给出 WebP 路径与尺寸
        manifest["/img/" + rel.as_posix()] = {
            "src": "/img/" + dst.relative_to(OUT_DIR).as_posix(),
            "w": width,
            "h": height,
        }

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=0), encoding="utf-8"
    )

    def mb(n):
        return f"{n / 1024 / 1024:.1f}MB"

    print(
        f"  图片优化：{len(manifest)} 张（新生成 {built}，命中缓存 {skipped}）"
        f"，{mb(raw_bytes)} → {mb(webp_bytes)}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
