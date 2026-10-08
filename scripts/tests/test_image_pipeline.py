"""用隔离的小图片验证缓存正确性，不写入真实文章或发布目录。"""
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

from PIL import Image

SCRIPTS = Path(__file__).resolve().parents[1]


class ImagePipelineTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="aiguide-image-test-")
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        (self.root / "scripts").mkdir()
        for name in ["watermark-images.py", "optimize-images.py", "image_cache.py"]:
            shutil.copyfile(SCRIPTS / name, self.root / "scripts" / name)
        (self.root / "scripts/sources.json").write_text(json.dumps({"sources": [
            {"root": "source", "module": "interview", "categories": {"articles": "agent"}}
        ]}))
        for num in ["Q001", "Q002"]:
            article = self.root / "source/articles" / (num + "-test")
            (article / "正文.assets").mkdir(parents=True)
            (article / "正文.md").write_text("# Test\n")
            Image.new("RGB", (320, 180), "white").save(article / "正文.assets/image.png")

    def source(self, num="Q001"):
        return self.root / "source/articles" / (num + "-test") / "正文.assets/image.png"

    def marked(self, num="Q001"):
        return self.root / "img-src" / num / "image.png"

    def webp(self, num="Q001"):
        return self.root / "public/img" / num / "image.webp"

    def run_script(self, name, *args, success=True, workers="1"):
        result = subprocess.run([sys.executable, str(self.root / "scripts" / name), *args],
            env={**os.environ, "AIGUIDE_IMAGE_WORKERS": workers}, text=True, capture_output=True)
        if success:
            self.assertEqual(result.returncode, 0, result.stderr + result.stdout)
        else:
            self.assertNotEqual(result.returncode, 0)
        return result.stdout

    def sync(self, workers="1"):
        self.run_script("watermark-images.py", workers=workers)
        return self.run_script("optimize-images.py", workers=workers)

    def snapshot(self):
        return {str(p.relative_to(self.root)): (p.read_bytes(), p.stat().st_mtime_ns)
                for directory in ["img-src", "public/img"]
                for p in (self.root / directory).rglob("*") if p.is_file()}

    def test_repeat_touch_and_single_image_change(self):
        self.sync(workers="2")
        before = self.snapshot()
        os.utime(self.source(), (1, 1))
        self.assertIn("命中缓存 2", self.sync())
        self.assertEqual(self.snapshot(), before)
        Image.new("RGB", (320, 180), "navy").save(self.source())
        os.utime(self.source(), (1, 1))
        self.run_script("watermark-images.py", "--only=Q001")
        self.assertIn("新生成 1", self.run_script("optimize-images.py"))
        after = self.snapshot()
        self.assertNotEqual(after["img-src/Q001/image.png"][0], before["img-src/Q001/image.png"][0])
        self.assertNotEqual(after["public/img/Q001/image.webp"][0], before["public/img/Q001/image.webp"][0])
        for key in ["img-src/Q002/image.png", "public/img/Q002/image.webp"]:
            self.assertEqual(after[key], before[key])

    def test_settings_missing_corrupt_and_force(self):
        self.sync()
        self.marked().write_bytes(b"truncated")
        self.webp().unlink()
        self.sync()
        with Image.open(self.marked()) as image:
            image.load()
        self.webp().write_bytes(b"invalid output")
        self.assertIn("新生成 1", self.run_script("optimize-images.py"))
        script = self.root / "scripts/watermark-images.py"
        script.write_text(script.read_text().replace('WATERMARK_ANGLE = -24', 'WATERMARK_ANGLE = -15'))
        self.assertIn("新生成 2", self.run_script("watermark-images.py"))
        self.run_script("optimize-images.py")
        script = self.root / "scripts/optimize-images.py"
        script.write_text(script.read_text().replace('QUALITY = 88', 'QUALITY = 70'))
        self.assertIn("新生成 2", self.run_script("optimize-images.py"))
        self.assertIn("新生成 2", self.run_script("watermark-images.py", "--force"))
        self.assertIn("新生成 2", self.run_script("optimize-images.py", "--force"))

    def test_removal_and_only_preserves_other_articles(self):
        self.sync()
        before = self.marked("Q002").read_bytes()
        self.source().unlink()
        self.run_script("watermark-images.py", "--only=Q001")
        self.run_script("optimize-images.py")
        self.assertFalse(self.marked().exists())
        self.assertFalse(self.webp().exists())
        self.assertEqual(self.marked("Q002").read_bytes(), before)
        manifest = json.loads((self.root / "public/img/.manifest.json").read_text())
        self.assertEqual(list(manifest), ["/img/Q002/image.png"])

    def test_invalid_input_and_missing_source_preserve_outputs(self):
        self.sync()
        before = self.snapshot()
        self.run_script("watermark-images.py", "--only=Q999", success=False)
        self.assertEqual(self.snapshot(), before)
        self.source().write_bytes(b"broken source")
        self.run_script("watermark-images.py", success=False)
        self.assertEqual(self.snapshot(), before)
        shutil.move(self.root / "source", self.root / "source-unavailable")
        self.run_script("watermark-images.py", success=False)
        self.assertEqual(self.snapshot(), before)

    def test_broken_cache_rebuilds_instead_of_trusting_mtime(self):
        self.sync()
        for name in ["watermark", "optimize"]:
            cache = self.root / ".cache/image-pipeline" / (name + ".json")
            cache.write_text('{"version":1,"entries":null}')
            script = "watermark-images.py" if name == "watermark" else "optimize-images.py"
            self.assertIn("新生成 2", self.run_script(script))

    def test_content_sync_and_image_pipeline_end_to_end(self):
        shutil.copyfile(SCRIPTS / "sync-content.mjs", self.root / "scripts/sync-content.mjs")
        shutil.copyfile(SCRIPTS / "article-url-policy.mjs", self.root / "scripts/article-url-policy.mjs")
        (self.root / "src/lib").mkdir(parents=True)
        (self.root / "src/data").mkdir(parents=True)
        shutil.copyfile(SCRIPTS.parent / "src/lib/article-topics.mjs", self.root / "src/lib/article-topics.mjs")
        for name, content in {"scripts/article-titles.json": "{}",
                              "scripts/article-slugs.json": json.dumps({"Q001": "image-one", "Q002": "image-two"}),
                              "scripts/article-published-urls.json": json.dumps({
                                  "version": 1, "site": "https://note.lgdsunday.club",
                                  "verifiedAt": "2026-10-07T00:00:00Z", "articles": {}}),
                              "scripts/article-topics.json": "[]", "src/data/topics.json": "[]"}.items():
            (self.root / name).write_text(content)

        def content_sync():
            result = subprocess.run(["node", str(self.root / "scripts/sync-content.mjs")],
                                    capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)

        content_sync()
        self.sync()
        before = self.snapshot()
        content_sync()
        self.sync()
        self.assertEqual(self.snapshot(), before)
        Image.new("RGB", (320, 180), "green").save(self.source())
        content_sync()
        self.assertIn("新生成 1", self.sync())
        self.source().unlink()
        content_sync()
        self.sync()
        self.assertFalse(self.marked().exists())
        self.assertFalse(self.webp().exists())
        self.assertEqual(self.marked("Q002").read_bytes(), before["img-src/Q002/image.png"][0])

    def test_output_collision_and_broken_input_do_not_replace_webp(self):
        self.sync()
        before = self.webp().read_bytes()
        Image.new("RGB", (320, 180), "black").save(self.marked().with_suffix(".jpeg"))
        self.run_script("optimize-images.py", success=False)
        self.assertEqual(self.webp().read_bytes(), before)
        self.marked().with_suffix(".jpeg").unlink()
        self.marked().write_bytes(b"corrupt intermediate")
        self.run_script("optimize-images.py", success=False)
        self.assertEqual(self.webp().read_bytes(), before)
        self.assertEqual(list((self.root / "public/img").rglob(".image-tmp-*")), [])


if __name__ == "__main__":
    unittest.main()
