import importlib.util
from pathlib import Path
import tempfile
import unittest

SPEC = importlib.util.spec_from_file_location(
    "server_seo", Path(__file__).resolve().parents[1] / "configure-server-seo.py"
)
seo = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(seo)


class SearchRedirectConfigTest(unittest.TestCase):
    def test_fresh_server_does_not_include_missing_file(self):
        with tempfile.TemporaryDirectory() as folder:
            self.assertEqual(seo.render_note_config(Path(folder)), seo.NOTE_CONFIG + seo.LEGACY_HTTP)

    def test_installed_redirects_survive_repeated_config_generation(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            fragment = root / "nginx-search-legacy-redirects.conf"
            fragment.write_text("# separately installed mappings\n")
            text = seo.render_note_config(root)
            directive = f"    include {fragment};\n"
            self.assertEqual(text.count(directive), 1)
            self.assertEqual(text.replace(directive, ""), seo.NOTE_CONFIG + seo.LEGACY_HTTP)
            self.assertLess(text.index("listen 443"), text.index(directive))
            self.assertLess(text.index(directive), text.index(seo.LEGACY_HTTP))
            self.assertEqual(seo.render_note_config(root), text)
            self.assertEqual(seo.render_note_config(root, prepare=True), text.removesuffix(seo.LEGACY_HTTP))


if __name__ == "__main__":
    unittest.main()
