import unittest

from neon_scraper.utils.validation import normalize_domain


class ValidationTests(unittest.TestCase):
    def test_normalize_domain_lowercases_and_strips_trailing_dot(self):
        self.assertEqual(normalize_domain("Example.COM."), "example.com")

    def test_normalize_domain_rejects_invalid_domain(self):
        with self.assertRaises(ValueError):
            normalize_domain("not a domain")


if __name__ == "__main__":
    unittest.main()
