import unittest

from neon_scraper.collectors.tor.client import TorHttpResult
from neon_scraper.collectors.tor.collector import TorCollector
from neon_scraper.core.models import Target, TorSource
from neon_scraper.utils.rate_limit import RateLimiter


VALID_ONION = "http://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.onion/"


class FakeTorClient:
    def get(self, url):
        return TorHttpResult(
            url=url,
            status_code=200,
            content_type="text/html",
            text="<title>Onion</title><p>neonjess appears here.</p>",
            content_sha256="abc123",
        )


class TorCollectorTests(unittest.TestCase):
    def test_collects_from_allowlisted_onion_source(self):
        collector = TorCollector(
            sources=[
                TorSource(
                    name="Example Onion",
                    base_url=VALID_ONION,
                    enabled=True,
                    seed_urls=(VALID_ONION,),
                    allowed_paths=("/",),
                    blocked_patterns=("/login",),
                )
            ],
            client=FakeTorClient(),
            snippet_radius=20,
            rate_limiter=RateLimiter(0),
        )

        findings = collector.collect(Target(value="neonjess", target_type="username"))

        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0].source_type, "tor")
        self.assertEqual(len(collector.request_logs), 1)


if __name__ == "__main__":
    unittest.main()

