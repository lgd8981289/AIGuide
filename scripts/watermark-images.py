#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
图片水印脚本：给文章配图打上「lgdsunday.club@程序员Sunday」水印

- 输入：写作仓库 ../文章/{分类}/{Q编号}-{主题}/正文.assets/ 下的原图（保持干净，不动它）
- 输出：站点 img-src/{Q编号}/ 下的同名文件（带水印）
- 幂等：每次都从原始素材重新生成，重复跑不会叠加水印
- 增量：原图、处理参数及输出哈希均未变化时复用；--force 强制重建

由 scripts/py.mjs 负责挑选带 Pillow 的解释器后调用；
也可以直接运行：python3 scripts/watermark-images.py
"""

import json
import argparse
import os
import shutil
import sys
import time
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps
except ImportError:  # pragma: no cover
    print("错误：需要 Pillow，请先安装：pip3 install Pillow", file=sys.stderr)
    sys.exit(1)

from image_cache import (atomic_output, cache_hit, file_hash, prune_files, read_cache,
                         recipe_hash, run_jobs, save_cache, worker_count)

WATERMARK = "lgdsunday.club@程序员Sunday"

# ---- 水印样式（想调浓淡 / 密度改这里） ----
WATERMARK_ANGLE = -24        # 旋转角度（斜向平铺）
WATERMARK_SCALE = 0.021      # 字号 = 图片宽度 × 该比例
WATERMARK_ALPHA_ON_DARK = 46  # 深色区域：用浅色字，透明度
WATERMARK_ALPHA_ON_LIGHT = 26  # 浅色区域：用深色字，透明度（数字越小越浅）
WATERMARK_GAP_X = 1.0        # 横向间距 = 单个水印宽度 × 该系数
WATERMARK_GAP_Y = 1.7        # 纵向间距 = 单个水印高度 × 该系数
LUMA_THRESHOLD = 150         # 区域亮度高于此值视为浅色背景

# 候选中文字体（macOS 自带，按优先级）
FONT_CANDIDATES = [
    "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
    "/System/Library/Fonts/Hiragino Sans GB.ttc",
    "/System/Library/Fonts/Supplemental/Songti.ttc",
    "/Library/Fonts/Arial Unicode.ttf",
]

SUPPORTED_SUFFIXES = {".png", ".jpg", ".jpeg", ".webp"}
SKIP_SUFFIXES = {".gif"}  # 动图跳过，避免丢帧

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = SCRIPT_DIR.parent
# 打水印后的原图先落到 img-src/（不直接进 public/），再由 optimize-images.py 压成 WebP
IMG_DIR = ROOT / "img-src"
CACHE = ROOT / ".cache/image-pipeline/watermark.json"

# 来源配置与正文同步共用一份（scripts/sources.json）
SOURCES = json.loads((SCRIPT_DIR / "sources.json").read_text(encoding="utf-8"))["sources"]


def load_font(size):
    for path in FONT_CANDIDATES:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                continue
    return ImageFont.load_default()


def build_tile(font, color, angle):
    """生成一块旋转后的水印贴图（RGBA，透明底）"""
    try:
        left, top, right, bottom = font.getbbox(WATERMARK)
    except AttributeError:  # pragma: no cover - 兼容老版 Pillow
        right, bottom = font.getsize(WATERMARK)
        left = top = 0

    pad = max(6, round(getattr(font, "size", 20) * 0.3))
    w = (right - left) + pad * 2
    h = (bottom - top) + pad * 2

    tile = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(tile).text((pad - left, pad - top), WATERMARK, font=font, fill=color)
    # BICUBIC 在 Pillow 10+ 改名为 Resampling.BICUBIC，这里做兼容
    resample = getattr(getattr(Image, "Resampling", Image), "BICUBIC")
    return tile.rotate(angle, expand=True, resample=resample)


def paste_tile(layer, tile, x, y):
    """把一块水印贴到图层上。

    注意：必须用 alpha_composite（叠加），不能用 paste。
    paste(tile, pos, tile) 会把 alpha 再乘一遍，透明度 26 会被压成 4，水印几乎看不见。
    """
    try:
        layer.alpha_composite(tile, dest=(x, y))
    except TypeError:  # pragma: no cover - Pillow < 9.2 不支持 dest 参数
        mask = tile.getchannel("A").point(lambda v: 255 if v else 0)
        layer.paste(tile, (x, y), mask)


def tile_positions(width, height, tile):
    """算出斜向平铺的坐标（隔行错位，避免整齐的网格感）"""
    step_x = max(120, round(tile.width * WATERMARK_GAP_X))
    step_y = max(60, round(tile.height * WATERMARK_GAP_Y))

    positions = []
    row = 0
    y = -round(tile.height * 0.55)
    while y < height:
        x = -round(tile.width * 0.5) + (round(step_x / 2) if row % 2 else 0)
        while x < width:
            positions.append((x, y))
            x += step_x
        y += step_y
        row += 1
    return positions


def add_watermark(img):
    """斜向平铺一层很浅的水印，按底图明暗逐像素切换浅色字 / 深色字"""
    base = img.convert("RGBA")
    width, height = base.size

    font_size = max(11, round(width * WATERMARK_SCALE))
    font = load_font(font_size)

    light_tile = build_tile(
        font, (255, 255, 255, WATERMARK_ALPHA_ON_DARK), WATERMARK_ANGLE
    )
    dark_tile = build_tile(
        font, (18, 20, 28, WATERMARK_ALPHA_ON_LIGHT), WATERMARK_ANGLE
    )

    # 同一组位置铺两层：一层浅色字（给深色区域用），一层深色字（给浅色区域用）
    positions = tile_positions(width, height, light_tile)
    light_layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    dark_layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    for x, y in positions:
        paste_tile(light_layer, light_tile, x, y)
        paste_tile(dark_layer, dark_tile, x, y)

    # 底图亮度（轻微模糊，避免噪点导致逐像素跳变）→ 决定每个像素用哪一层
    blur = max(3, round(width * 0.012))
    luma = base.convert("L").filter(ImageFilter.GaussianBlur(blur))
    light_bg_mask = luma.point(lambda v: 255 if v > LUMA_THRESHOLD else 0)
    layer = Image.composite(dark_layer, light_layer, light_bg_mask)

    out = Image.alpha_composite(base, layer)
    # 还原为不透明模式，避免 JPEG 保存报错
    return out.convert("RGB") if img.mode in ("RGB", "L") else out.convert("RGBA")


def process_image(src_path, dst_path):
    with Image.open(src_path) as raw:
        img = ImageOps.exif_transpose(raw)
        marked = add_watermark(img)

        dst_path.parent.mkdir(parents=True, exist_ok=True)
        suffix = src_path.suffix.lower()
        if suffix in (".jpg", ".jpeg"):
            marked.convert("RGB").save(
                dst_path, format="JPEG", quality=92, optimize=True
            )
        elif suffix == ".png":
            marked.save(dst_path, format="PNG", optimize=True)
        else:
            marked.save(dst_path, format="WEBP", quality=92)


def process_job(job):
    key, src, dst, source_hash, recipe = job
    with atomic_output(dst) as temporary:
        process_image(src, temporary)
        if file_hash(src) != source_hash:
            raise RuntimeError(f"图片在处理中发生变化，请重试：{src}")
    return key, {"source": source_hash, "recipe": recipe, "output": file_hash(dst)}


def main():
    started = time.perf_counter()
    parser = argparse.ArgumentParser(description="增量生成文章图片水印")
    parser.add_argument("--only", help="限定原始文章编号，例如 Q001,T002")
    parser.add_argument("--force", "-f", action="store_true", help="强制重新打水印")
    args = parser.parse_args()
    selected = set(args.only.split(",")) if args.only is not None else None
    if selected is not None and any(not (len(num) >= 4 and num[0] in "QT" and num[1:].isdigit()) for num in selected):
        print("--only 需要逗号分隔的原始文章编号", file=sys.stderr)
        return 1
    workers = worker_count()
    cache = read_cache(CACHE)
    entries = {key: value for key, value in cache.items()
               if selected is not None and key.split("/")[0] not in selected}
    font = load_font(20)
    font_path = getattr(font, "path", None)
    recipe = recipe_hash(__file__, {"font": file_hash(font_path) if font_path else "default"})
    jobs = []
    expected = set()
    seen_articles = set()
    passthrough = []
    hits = 0
    skipped = 0

    for source in SOURCES:
        source_root = (ROOT / source["root"]).resolve()
        label = source.get("label") or source["module"]

        if not source_root.exists():
            raise FileNotFoundError(f"找不到写作仓库，保留已有图片：{label}（{source_root}）")

        for cat_name in source["categories"]:
            cat_dir = source_root / cat_name
            if not cat_dir.exists():
                continue

            for entry in sorted(cat_dir.iterdir()):
                if not entry.is_dir():
                    continue
                # 目录名形如 Q003-xxx / T001-xxx，取编号前缀
                num = entry.name.split("-")[0]
                if selected is not None and num not in selected:
                    continue
                if not num or not num[0].isalpha() or not num[1:].isdigit():
                    continue
                if not (entry / "正文.md").is_file():
                    continue
                if num in seen_articles:
                    raise ValueError(f"正文编号重复：{num}")
                seen_articles.add(num)

                assets = entry / "正文.assets"
                if not assets.exists():
                    continue

                for src in sorted(assets.rglob("*")):
                    if not src.is_file():
                        continue
                    suffix = src.suffix.lower()
                    key = (Path(num) / src.relative_to(assets)).as_posix()
                    expected.add(key)
                    dst = IMG_DIR / key
                    if suffix in SKIP_SUFFIXES or suffix not in SUPPORTED_SUFFIXES:
                        skipped += 1
                        passthrough.append((src, dst))
                        continue
                    source_hash = file_hash(src)
                    previous = cache.get(key, {})
                    if not args.force and cache_hit(previous, source_hash, recipe, dst):
                        entries[key] = previous
                        hits += 1
                    else:
                        jobs.append((key, src, dst, source_hash, recipe))

    if selected is not None and selected - seen_articles:
        raise ValueError("限定同步的文章不存在：" + ",".join(sorted(selected - seen_articles)))
    print(f"  水印：待处理 {len(jobs)} 张，命中缓存 {hits} 张，最多 {workers} 个进程", flush=True)
    entries.update(run_jobs(process_job, jobs, workers))
    for src, dst in passthrough:
        if not dst.exists() or file_hash(src) != file_hash(dst):
            with atomic_output(dst) as temporary:
                shutil.copyfile(src, temporary)
    removed = prune_files(IMG_DIR, expected, selected)
    save_cache(CACHE, entries)
    print(f"  水印完成：新生成 {len(jobs)}，命中缓存 {hits}，清理 {removed}；耗时 {time.perf_counter()-started:.2f}s")
    if skipped:
        print(f"  跳过 {skipped} 个不支持的格式（gif 等）")
    return 0


if __name__ == "__main__":
    sys.exit(main())
