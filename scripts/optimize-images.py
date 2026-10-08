#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
图片优化：把 img-src/ 里打好水印的原图压成 WebP，输出到 public/img/
并在 public/img/.manifest.json 里记录每张图的尺寸与新文件名，供构建后回写 HTML 用。

- 原图只留在 img-src/（不进仓库、不进部署产物），public/img 里只有 WebP
- 增量：输入内容、处理参数与输出哈希均一致时跳过，不依赖时间戳
- 尺寸上限 MAX_WIDTH：超宽截图等比缩小（默认 1600，正文栏宽 760，放大查看也够）

由 scripts/py.mjs 挑选带 Pillow 的解释器后调用；也可直接跑：python3 scripts/optimize-images.py --force
"""

import argparse
import sys
import time
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:  # pragma: no cover
    print("错误：需要 Pillow，请先安装：pip3 install Pillow", file=sys.stderr)
    sys.exit(1)

from image_cache import (atomic_output, cache_hit, file_hash, prune_files, read_cache,
                         recipe_hash, run_jobs, save_cache, worker_count, write_json)

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = SCRIPT_DIR.parent
SRC_DIR = ROOT / "img-src"
OUT_DIR = ROOT / "public" / "img"
MANIFEST = OUT_DIR / ".manifest.json"
CACHE = ROOT / ".cache/image-pipeline/optimize.json"

MAX_WIDTH = 1600
QUALITY = 88  # 教程多是截图、文字多，质量给高一点
SUPPORTED = {".png", ".jpg", ".jpeg", ".webp"}
# Pillow 10 起 Image.LANCZOS 改名，这里做兼容
LANCZOS = getattr(getattr(Image, "Resampling", Image), "LANCZOS")


def optimize_one(src: Path, dst: Path):
    """保持原有画质与编码参数，返回 (宽, 高, 是否重新生成)。"""
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


def process_job(job):
    key, src, dst, source_hash, recipe = job
    with atomic_output(dst) as temporary:
        width, height, _ = optimize_one(src, temporary)
        if file_hash(src) != source_hash:
            raise RuntimeError(f"图片在压缩中发生变化，请重试：{src}")
    return key, {"source": source_hash, "recipe": recipe, "output": file_hash(dst), "w": width, "h": height}


def main():
    started = time.perf_counter()
    parser = argparse.ArgumentParser(description="增量压缩文章图片")
    parser.add_argument("--force", "-f", action="store_true")
    args = parser.parse_args()
    workers = worker_count()
    if not SRC_DIR.exists():
        print("  提示：img-src/ 不存在（先跑 npm run sync 生成原图），跳过图片优化")
        return 0

    manifest = {}
    entries = {}
    cache = read_cache(CACHE)
    recipe = recipe_hash(__file__, {"width": MAX_WIDTH, "quality": QUALITY, "method": 6})
    jobs = []
    targets = {}
    skipped = 0
    raw_bytes = webp_bytes = 0

    for src in sorted(SRC_DIR.rglob("*")):
        if not src.is_file() or src.suffix.lower() not in SUPPORTED:
            continue

        rel = src.relative_to(SRC_DIR)  # 例如 Q003/xxx.png
        dst = (OUT_DIR / rel).with_suffix(".webp")
        key = rel.as_posix()
        target = dst.relative_to(OUT_DIR).as_posix()
        if target in targets.values():
            raise ValueError(f"多个原图映射到同一 WebP，请改名：{target}")
        targets[key] = target
        source_hash = file_hash(src)
        previous = cache.get(key, {})
        if not args.force and cache_hit(previous, source_hash, recipe, dst):
            with Image.open(dst) as cached:
                entries[key] = {**previous, "w": cached.width, "h": cached.height}
            skipped += 1
        else:
            jobs.append((key, src, dst, source_hash, recipe))
        raw_bytes += src.stat().st_size

    print(f"  WebP：待处理 {len(jobs)} 张，命中缓存 {skipped} 张，最多 {workers} 个进程", flush=True)
    entries.update(run_jobs(process_job, jobs, workers))
    for key, target in targets.items():
        entry = entries[key]
        webp_bytes += (OUT_DIR / target).stat().st_size
        manifest["/img/" + key] = {
            "src": "/img/" + target,
            "w": entry["w"],
            "h": entry["h"],
        }

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    write_json(MANIFEST, manifest)
    removed = prune_files(OUT_DIR, set(targets.values()) | {MANIFEST.name})
    save_cache(CACHE, entries)

    def mb(n):
        return f"{n / 1024 / 1024:.1f}MB"

    print(
        f"  图片优化：{len(manifest)} 张（新生成 {len(jobs)}，命中缓存 {skipped}，清理 {removed}）"
        f"，{mb(raw_bytes)} → {mb(webp_bytes)}；耗时 {time.perf_counter()-started:.2f}s"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
