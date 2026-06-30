import unittest

from neon_scraper.web import parse_targets, render_message, review_form, split_lines


class WebInterfaceTests(unittest.TestCase):
    def test_split_lines_ignores_blank_lines(self):
        self.assertEqual(split_lines("one\n\n two "), ["one", "two"])

    def test_parse_targets_from_form(self):
        targets = parse_targets(
            {
                "domains": ["Example.COM\n"],
                "usernames": ["neonjess"],
                "emails": ["Test@Example.com"],
                "organizations": [""],
            }
        )

        self.assertEqual(len(targets), 3)
        by_type = {target.target_type: target.value for target in targets}
        self.assertEqual(by_type["domain"], "example.com")
        self.assertEqual(by_type["username"], "neonjess")
        self.assertEqual(by_type["email"], "test@example.com")

    def test_render_message_escapes_html(self):
        html = render_message("<script>alert(1)</script>")

        self.assertIn("&lt;script&gt;", html)

    def test_review_form_contains_status(self):
        html = review_form(7, "reviewed")

        self.assertIn("finding_id", html)
        self.assertIn("reviewed", html)


if __name__ == "__main__":
    unittest.main()
