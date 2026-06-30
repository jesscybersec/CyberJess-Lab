import sqlite3
import unittest

from neon_scraper.reporting.markdown import generate_markdown_report


class ReportingTests(unittest.TestCase):
    def test_report_includes_request_audit_summary(self):
        import tempfile
        from pathlib import Path

        with tempfile.TemporaryDirectory() as temp_dir:
            connection = sqlite3.connect(":memory:")
            connection.row_factory = sqlite3.Row
            connection.execute(
                """
                CREATE TABLE findings (
                    target TEXT, target_type TEXT, source TEXT, source_type TEXT,
                    title TEXT, value TEXT, url TEXT, risk TEXT, confidence TEXT,
                    collected_at TEXT, review_status TEXT, analyst_notes TEXT
                )
                """
            )
            connection.execute(
                """
                CREATE TABLE request_logs (
                    source TEXT, source_type TEXT, url TEXT, method TEXT,
                    status_code INTEGER, allowed_by_policy INTEGER,
                    blocked_reason TEXT
                )
                """
            )
            finding = connection.execute(
                """
                SELECT 'neonjess' AS target, 'username' AS target_type,
                       'Example' AS source, 'web' AS source_type,
                       'Example' AS title, 'snippet' AS value,
                       'https://example.com/' AS url, 'info' AS risk,
                       'medium' AS confidence,
                       '2026-06-30T00:00:00+00:00' AS collected_at,
                       'reviewed' AS review_status,
                       'Looks relevant.' AS analyst_notes
                """
            ).fetchall()
            request_logs = connection.execute(
                """
                SELECT 'Example' AS source, 'web' AS source_type,
                       'https://example.com/' AS url, 'GET' AS method,
                       200 AS status_code, 1 AS allowed_by_policy,
                       NULL AS blocked_reason
                """
            ).fetchall()

            report = generate_markdown_report(finding, Path(temp_dir), request_logs)
            text = report.read_text(encoding="utf-8")

            self.assertIn("Request Audit", text)
            self.assertIn("Request audit events: 1", text)
            self.assertIn("Review status", text)
            self.assertIn("Looks relevant.", text)


if __name__ == "__main__":
    unittest.main()
