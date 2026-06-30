import unittest

from neon_scraper.core.database import Database
from neon_scraper.core.models import Finding, RequestLog


class DatabaseTests(unittest.TestCase):
    def test_database_initializes_and_stores_finding(self):
        with self.subTest("sqlite persistence"):
            import tempfile
            from pathlib import Path

            with tempfile.TemporaryDirectory() as temp_dir:
                database = Database(Path(temp_dir) / "osint.sqlite")
                database.initialize()
                run_id = database.create_run("2026-06-30T00:00:00+00:00", "test")

                inserted = database.save_findings(
                    run_id,
                    [
                        Finding(
                            target="example.com",
                            target_type="domain",
                            source="dns",
                            source_type="dns",
                            title="A record",
                            value="192.0.2.10",
                        )
                    ],
                )

                rows = database.findings_for_run(run_id)
                self.assertEqual(inserted, 1)
                self.assertEqual(len(rows), 1)
                self.assertEqual(rows[0]["target"], "example.com")

    def test_database_stores_request_logs(self):
        with self.subTest("request audit persistence"):
            import tempfile
            from pathlib import Path

            with tempfile.TemporaryDirectory() as temp_dir:
                database = Database(Path(temp_dir) / "osint.sqlite")
                database.initialize()
                run_id = database.create_run("2026-06-30T00:00:00+00:00", "test")

                inserted = database.save_request_logs(
                    run_id,
                    [
                        RequestLog(
                            timestamp="2026-06-30T00:00:01+00:00",
                            source="Example",
                            source_type="web",
                            url="https://example.com/",
                            method="GET",
                            status_code=200,
                            allowed_by_policy=True,
                            content_sha256="abc123",
                        )
                    ],
                )

                rows = database.request_logs_for_run(run_id)
                self.assertEqual(inserted, 1)
                self.assertEqual(len(rows), 1)
                self.assertEqual(rows[0]["source_type"], "web")

    def test_search_and_review_findings(self):
        with self.subTest("analyst workflow"):
            import tempfile
            from pathlib import Path

            with tempfile.TemporaryDirectory() as temp_dir:
                database = Database(Path(temp_dir) / "osint.sqlite")
                database.initialize()
                run_id = database.create_run("2026-06-30T00:00:00+00:00", "test")
                database.save_findings(
                    run_id,
                    [
                        Finding(
                            target="neonjess",
                            target_type="username",
                            source="Example",
                            source_type="web",
                            title="Profile",
                            value="neonjess profile page",
                        )
                    ],
                )

                rows = database.search_findings("profile")
                self.assertEqual(len(rows), 1)
                self.assertEqual(rows[0]["review_status"], "unreviewed")

                updated = database.update_finding_review(
                    rows[0]["id"],
                    "reviewed",
                    "Looks relevant.",
                )
                reviewed = database.search_findings("relevant")

                self.assertTrue(updated)
                self.assertEqual(reviewed[0]["review_status"], "reviewed")
                self.assertEqual(reviewed[0]["analyst_notes"], "Looks relevant.")


if __name__ == "__main__":
    unittest.main()
