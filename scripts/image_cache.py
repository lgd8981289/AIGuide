"""图片流水线的本地缓存；缓存和临时文件都不进入发布目录。"""
from concurrent.futures import ProcessPoolExecutor
from contextlib import contextmanager
import hashlib
import json
import os
from pathlib import Path
import tempfile

from PIL import __version__ as pillow_version, features


def file_hash(path):
    digest = hashlib.sha256()
    with Path(path).open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def recipe_hash(script, settings):
    value = {"script": file_hash(script), "helper": file_hash(__file__),
             "pillow": pillow_version, "webp": features.version("webp"), "settings": settings}
    return hashlib.sha256(json.dumps(value, sort_keys=True).encode()).hexdigest()


def read_cache(path):
    try:
        value = json.loads(Path(path).read_text(encoding="utf8"))
        if isinstance(value, dict) and value.get("version") == 1 and isinstance(value.get("entries"), dict):
            return {key: entry for key, entry in value["entries"].items() if isinstance(entry, dict)}
    except (OSError, ValueError):
        pass
    return {}


def cache_hit(entry, source_hash, recipe, output):
    return (entry.get("source") == source_hash and entry.get("recipe") == recipe
            and output.is_file() and entry.get("output") == file_hash(output))


@contextmanager
def atomic_output(destination):
    destination = Path(destination)
    destination.parent.mkdir(parents=True, exist_ok=True)
    fd, filename = tempfile.mkstemp(prefix=".image-tmp-", suffix=destination.suffix, dir=destination.parent)
    os.close(fd)
    temporary = Path(filename)
    try:
        yield temporary
        temporary.chmod(0o644)
        os.replace(temporary, destination)
    finally:
        temporary.unlink(missing_ok=True)


def write_json(path, value):
    path = Path(path)
    content = json.dumps(value, ensure_ascii=False, sort_keys=True, indent=2) + "\n"
    if path.exists() and path.read_text(encoding="utf8") == content:
        return
    with atomic_output(path) as temporary:
        temporary.write_text(content, encoding="utf8")


def save_cache(path, entries):
    write_json(path, {"version": 1, "entries": entries})


def worker_count():
    value = int(os.environ.get("AIGUIDE_IMAGE_WORKERS", min(4, os.cpu_count() or 1)))
    if value < 1 or value > 32:
        raise ValueError("AIGUIDE_IMAGE_WORKERS 必须是 1 到 32 的整数")
    return value


def run_jobs(function, jobs, workers):
    if not jobs:
        return []
    if workers == 1:
        return [function(job) for job in jobs]
    results = []
    with ProcessPoolExecutor(max_workers=min(workers, len(jobs))) as executor:
        for result in executor.map(function, jobs):
            results.append(result)
            if len(results) % 50 == 0:
                print(f"  图片加工进度：{len(results)}/{len(jobs)}", flush=True)
    return results


def prune_files(directory, expected, selected=None):
    """只清理本流水线管理的目录；限定同步不触碰其他文章。"""
    if not directory.exists():
        return 0
    removed = 0
    for file in directory.rglob("*"):
        if not file.is_file():
            continue
        rel = file.relative_to(directory)
        if selected is not None and rel.parts[0] not in selected:
            continue
        if rel.as_posix() not in expected:
            file.unlink()
            removed += 1
    for folder in sorted(directory.rglob("*"), key=lambda p: len(p.parts), reverse=True):
        if folder.is_dir() and not any(folder.iterdir()):
            folder.rmdir()
    return removed
