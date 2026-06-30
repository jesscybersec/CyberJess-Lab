import unittest

from neon_scraper.collectors.web.client import HttpResult
from neon_scraper.collectors.web.collector import WebCollector
from neon_scraper.core.models import Target, WebSource


class FakeClient:
    calls = []

    def get(self, url):
        self.calls.append(url)
        return HttpResult(
            url=url,
            status_code=200,
            content_type="text/html",
            text="<title>Example</title><p>Public mention of neonjess.</p>",
            content_sha256="abc123",
        )


class FakeRobots:
    def can_fetch(self, url):
        return True


class WebCollectorTests(unittest.TestCase):
    def test_collects_matching_snippet(self):
        client = FakeClient()
        collector = WebCollector(
            sources=[
                WebSource(
                    name="Example",
                    base_url="https://example.com/",
                    enabled=True,
                    seed_urls=("https://example.com/",),
                    allowed_paths=("/",),
                    blocked_patterns=("/login",),
                )
            ],
            client=client,
            robots_checker=FakeRobots(),
            snippet_radius=20,
            max_depth=0,
            max_pages_per_source=1,
        )

        findings = collector.collect(Target(value="neonjess", target_type="username"))

        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0].source_type, "web")
        self.assertIn("sha256:abc123", findings[0].value)
        self.assertEqual(len(collector.request_logs), 1)
        self.assertTrue(collector.request_logs[0].allowed_by_policy)

    def test_crawls_allowed_same_host_links_with_depth_limit(self):
        class CrawlClient:
            def __init__(self):
                self.calls = []

            def get(self, url):
                self.calls.append(url)
                if url.endswith("/"):
                    html = (
                        "<title>Home</title>"
                        "<a href='/profile'>Profile</a>"
                        "<a href='/login'>Login</a>"
                    )
                else:
                    html = "<title>Profile</title><p>neonjess profile page</p>"
                return HttpResult(
                    url=url,
                    status_code=200,
                    content_type="text/html",
                    text=html,
                    content_sha256="abc123",
                )

        client = CrawlClient()
        collector = WebCollector(
            sources=[
                WebSource(
                    name="Example",
                    base_url="https://example.com/",
                    enabled=True,
                    seed_urls=("https://example.com/",),
                    allowed_paths=("/",),
                    blocked_patterns=("/login",),
                )
            ],
            client=client,
            robots_checker=FakeRobots(),
            snippet_radius=20,
            max_depth=1,
            max_pages_per_source=5,
        )

        findings = collector.collect(Target(value="neonjess", target_type="username"))

        self.assertEqual(len(findings), 1)
        self.assertIn("https://example.com/profile", client.calls)
        blocked = [
            log for log in collector.request_logs if log.blocked_reason == "crawl_discovery:blocked_pattern"
        ]
        self.assertEqual(len(blocked), 1)


if __name__ == "__main__":
    unittest.main()
