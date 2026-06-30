import unittest

from neon_scraper.collectors.web.policy import is_url_allowed
from neon_scraper.core.models import WebSource


class WebPolicyTests(unittest.TestCase):
    def test_allows_same_host_and_allowed_path(self):
        source = WebSource(
            name="Example",
            base_url="https://example.com/public",
            enabled=True,
            seed_urls=("https://example.com/public",),
            allowed_paths=("/public",),
            blocked_patterns=("/login",),
        )

        allowed, reason = is_url_allowed(source, "https://example.com/public/page")

        self.assertTrue(allowed)
        self.assertIsNone(reason)

    def test_blocks_outside_host(self):
        source = WebSource(
            name="Example",
            base_url="https://example.com/",
            enabled=True,
            seed_urls=("https://example.com/",),
            allowed_paths=("/",),
            blocked_patterns=(),
        )

        allowed, reason = is_url_allowed(source, "https://evil.example.net/")

        self.assertFalse(allowed)
        self.assertEqual(reason, "outside_source_host")

    def test_blocks_onion_sources(self):
        source = WebSource(
            name="Onion",
            base_url="http://exampleexampleexample.onion/",
            enabled=True,
            seed_urls=("http://exampleexampleexample.onion/",),
            allowed_paths=("/",),
            blocked_patterns=(),
        )

        with self.assertRaises(ValueError):
            is_url_allowed(source, "http://exampleexampleexample.onion/")


if __name__ == "__main__":
    unittest.main()
