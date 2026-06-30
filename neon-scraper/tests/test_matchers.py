import unittest

from neon_scraper.analysis.matchers import match_keywords, match_target


class MatcherTests(unittest.TestCase):
    def test_matches_email_with_high_confidence(self):
        matches = match_target(
            "Contact me at test@example.com for details.",
            "test@example.com",
            "email",
            20,
        )

        self.assertEqual(len(matches), 1)
        self.assertEqual(matches[0].match_type, "email")
        self.assertEqual(matches[0].confidence, "high")

    def test_matches_username_before_punctuation(self):
        matches = match_target("hello neonjess.", "neonjess", "username", 20)

        self.assertEqual(len(matches), 1)
        self.assertEqual(matches[0].matched_value, "neonjess")

    def test_matches_keywords(self):
        matches = match_keywords("this page mentions exposure monitoring", ("exposure",), 20)

        self.assertEqual(len(matches), 1)
        self.assertEqual(matches[0].match_type, "keyword")


if __name__ == "__main__":
    unittest.main()

