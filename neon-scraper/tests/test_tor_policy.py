import unittest

from neon_scraper.collectors.tor.policy import is_tor_url_allowed
from neon_scraper.collectors.tor.validator import TorValidationError, validate_onion_url
from neon_scraper.core.models import TorSource


VALID_ONION = "http://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.onion/"


class TorPolicyTests(unittest.TestCase):
    def test_validates_v3_onion_url(self):
        validate_onion_url(VALID_ONION)

    def test_rejects_non_onion_url(self):
        with self.assertRaises(TorValidationError):
            validate_onion_url("https://example.com/")

    def test_allows_allowlisted_path(self):
        source = TorSource(
            name="Example",
            base_url=VALID_ONION,
            enabled=True,
            seed_urls=(VALID_ONION,),
            allowed_paths=("/",),
            blocked_patterns=("/login",),
        )

        allowed, reason = is_tor_url_allowed(source, VALID_ONION)

        self.assertTrue(allowed)
        self.assertIsNone(reason)

    def test_blocks_disallowed_path(self):
        source = TorSource(
            name="Example",
            base_url=VALID_ONION,
            enabled=True,
            seed_urls=(VALID_ONION,),
            allowed_paths=("/public",),
            blocked_patterns=("/login",),
        )

        allowed, reason = is_tor_url_allowed(source, f"{VALID_ONION}private")

        self.assertFalse(allowed)
        self.assertEqual(reason, "path_not_allowlisted")


if __name__ == "__main__":
    unittest.main()

