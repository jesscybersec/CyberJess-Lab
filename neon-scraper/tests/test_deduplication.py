import unittest

from neon_scraper.analysis.deduplication import deduplicate_findings
from neon_scraper.core.models import Finding


class DeduplicationTests(unittest.TestCase):
    def test_deduplicate_findings_removes_duplicate_keys(self):
        finding = Finding(
            target="example.com",
            target_type="domain",
            source="dns",
            source_type="dns",
            title="A record",
            value="192.0.2.10",
        )

        self.assertEqual(deduplicate_findings([finding, finding]), [finding])


if __name__ == "__main__":
    unittest.main()
