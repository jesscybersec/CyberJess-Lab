import unittest

from neon_scraper.collectors.web.extractor import extract_text, find_snippets


class WebExtractorTests(unittest.TestCase):
    def test_extracts_title_and_text(self):
        title, text = extract_text(
            "<html><head><title>Neon</title></head>"
            "<body><h1>Hello</h1><p>neonjess was here.</p></body></html>"
        )

        self.assertEqual(title, "Neon")
        self.assertIn("neonjess was here", text)

    def test_finds_case_insensitive_snippet(self):
        snippets = find_snippets("hello NeonJess from the public web", "neonjess", 5)

        self.assertEqual(len(snippets), 1)
        self.assertIn("NeonJess", snippets[0])


if __name__ == "__main__":
    unittest.main()

