"""多站点提交的顺序、额度、历史状态和不确定回执隔离检查（不访问网络）。"""

from contextlib import redirect_stderr, redirect_stdout
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
import urllib.error
from unittest.mock import patch


spec = importlib.util.spec_from_file_location("bing", Path(__file__).parents[1] / "submit-bing.py")
bing = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bing)


class MultiSiteSubmissionTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        self.calls = []
        self.uncertain = False
        self.verified = True
        self.pages = {
            site: [site, site + "guides", site + "guides/example"]
            for site, _ in bing.TARGETS.values()
        }
        for context in [
            patch.object(bing, "LOCAL", self.root),
            patch.object(bing, "read_key", return_value="test-key"),
            patch.object(bing, "api_call", side_effect=self.api),
            patch.object(bing, "sitemap_urls", side_effect=lambda site, sitemap: self.pages[site]),
            patch.object(bing, "inspect_page", side_effect=lambda url, **kwargs: {"url": url, "sha256": "unchanged"}),
            redirect_stdout(io.StringIO()), redirect_stderr(io.StringIO()),
        ]:
            self.enterContext(context)

    def api(self, key, method, params=None, post=False):
        self.calls.append((method, params))
        if method == "GetUserSites":
            return [{"Url": site, "IsVerified": self.verified} for site, _ in bing.TARGETS.values()]
        if method == "GetUrlSubmissionQuota":
            return {"DailyQuota": 10, "MonthlyQuota": 2 if params["siteUrl"] == bing.TARGETS["www"][0] else 1}
        if method == "SubmitUrlBatch":
            if self.uncertain and params["siteUrl"] == bing.TARGETS["www"][0]:
                raise bing.ApiError("模拟提交超时", uncertain=True)
            return None
        raise AssertionError(method)

    def main(self, *args):
        with patch.object(bing.sys, "argv", ["submit-bing.py", *args]):
            return bing.main()

    def submissions(self):
        return [params for method, params in self.calls if method == "SubmitUrlBatch"]

    def test_all_submits_www_first_with_separate_quotas_and_receipts(self):
        self.assertEqual(self.main("--submit", "--site", "all"), 0)
        sent = self.submissions()
        self.assertEqual([p["siteUrl"] for p in sent], [bing.TARGETS["www"][0], bing.SITE])
        self.assertEqual([len(p["urlList"]) for p in sent], [2, 1])
        for name in ("www", "note"):
            local = bing.state_dir(name)
            state = json.loads((local / "state.json").read_text())
            self.assertEqual(set(state), set(sent[0 if name == "www" else 1]["urlList"]))
            receipt = json.loads(next(local.glob("receipt-*.json")).read_text())
            self.assertEqual(receipt["site"], bing.TARGETS[name][0])
            self.assertEqual(receipt["status"], "accepted")

    def test_www_skips_accepted_pages_and_preserves_legacy_note_state(self):
        legacy = {bing.SITE: {"status": "pending", "sha256": "old"}}
        (self.root / "state.json").write_text(json.dumps(legacy))
        before = (self.root / "state.json").read_bytes()
        self.pages[bing.TARGETS["www"][0]] = [bing.TARGETS["www"][0]]
        self.assertEqual(self.main("--submit", "--site", "www"), 0)
        self.assertEqual(self.main("--submit", "--site", "www"), 0)
        self.assertEqual(len(self.submissions()), 1)
        self.assertEqual((self.root / "state.json").read_bytes(), before)

    def test_unknown_www_submission_blocks_retry_but_note_still_runs(self):
        self.uncertain = True
        self.assertEqual(self.main("--submit", "--site", "all"), 1)
        self.assertEqual(len(self.submissions()), 2)
        www = bing.TARGETS["www"][0]
        receipt = json.loads(next(bing.state_dir("www").glob("receipt-*.json")).read_text())
        self.assertEqual(receipt["status"], "unknown")
        self.assertEqual(self.main("--submit", "--site", "www"), 1)
        self.assertEqual(len([p for p in self.submissions() if p["siteUrl"] == www]), 1)

    def test_default_note_reuses_existing_state_without_resubmitting(self):
        self.pages[bing.SITE] = [bing.SITE]
        (self.root / "state.json").write_text(json.dumps({bing.SITE: {"status": "accepted", "sha256": "unchanged"}}))
        self.assertEqual(self.main("--submit"), 0)
        self.assertEqual(self.submissions(), [])

    def test_unverified_site_never_submits(self):
        self.verified = False
        self.assertEqual(self.main("--submit", "--site", "www"), 1)
        self.assertEqual(self.submissions(), [])

    def test_www_url_scope_rejects_note_and_parameter_urls(self):
        site = bing.TARGETS["www"][0]
        self.assertEqual(bing.validate_url(site + "guides", site), site + "guides")
        for url in (bing.SITE, site + "?q=test", site + "#section", "http://www.lgdsunday.club/"):
            with self.assertRaises(bing.SubmissionError):
                bing.validate_url(url, site)


class PageRedirectTests(unittest.TestCase):
    def test_only_same_page_permanent_slash_redirect_is_allowed(self):
        url = "https://www.lgdsunday.club/guides"
        body = f'<link rel="canonical" href="{url}"><meta name="robots" content="index,follow">'.encode()
        error = urllib.error.HTTPError(url, 301, "Moved", {"Location": url + "/"}, None)
        with patch.object(bing, "request", side_effect=[error, (body, {"Content-Type": "text/html"})]) as fetch:
            result = bing.inspect_page(url, allow_trailing_slash_redirect=True)
            self.assertNotIn("error", result)
            self.assertEqual(result["url"], url)
            self.assertEqual(result["redirected_to"], url + "/")
            self.assertEqual(fetch.call_args_list[-1].args, (url + "/",))

    def test_cross_host_path_change_and_default_redirects_stay_blocked(self):
        url = "https://www.lgdsunday.club/guides"
        for destination, allowed in [("https://other.example/guides/", True),
                                     ("https://www.lgdsunday.club/login/", True), (url + "/", False)]:
            with self.subTest(destination=destination, allowed=allowed):
                error = urllib.error.HTTPError(url, 301, "Moved", {"Location": destination}, None)
                with patch.object(bing, "request", side_effect=error) as fetch:
                    self.assertIn("error", bing.inspect_page(url, allow_trailing_slash_redirect=allowed))
                    self.assertEqual(fetch.call_count, 1)

    def test_redirect_never_overrides_noindex_or_canonical_mismatch(self):
        url = "https://www.lgdsunday.club/guides"
        for canonical, robots in [(url, "noindex"), (url + "/", "index")]:
            with self.subTest(canonical=canonical, robots=robots):
                error = urllib.error.HTTPError(url, 301, "Moved", {"Location": url + "/"}, None)
                body = f'<link rel="canonical" href="{canonical}"><meta name="robots" content="{robots}">'.encode()
                with patch.object(bing, "request", side_effect=[error, (body, {"Content-Type": "text/html"})]):
                    self.assertIn("error", bing.inspect_page(url, allow_trailing_slash_redirect=True))


if __name__ == "__main__":
    unittest.main()
