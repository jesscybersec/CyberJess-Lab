"""SQLite persistence for Neon Scraper."""

from __future__ import annotations

from contextlib import closing
from pathlib import Path
import sqlite3

from neon_scraper.core.models import Finding, RequestLog, Target


SCHEMA = """
CREATE TABLE IF NOT EXISTS runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at TEXT NOT NULL,
    note TEXT
);

CREATE TABLE IF NOT EXISTS targets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    value TEXT NOT NULL,
    target_type TEXT NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE(value, target_type)
);

CREATE TABLE IF NOT EXISTS findings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id INTEGER,
    target TEXT NOT NULL,
    target_type TEXT NOT NULL,
    source TEXT NOT NULL,
    source_type TEXT NOT NULL,
    title TEXT NOT NULL,
    value TEXT NOT NULL,
    url TEXT,
    risk TEXT NOT NULL,
    confidence TEXT NOT NULL,
    collected_at TEXT NOT NULL,
    review_status TEXT NOT NULL DEFAULT 'unreviewed',
    analyst_notes TEXT,
    UNIQUE(target, target_type, source, title, value),
    FOREIGN KEY(run_id) REFERENCES runs(id)
);

CREATE TABLE IF NOT EXISTS tor_request_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id INTEGER,
    timestamp TEXT NOT NULL,
    onion_url_hash TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER,
    timeout INTEGER NOT NULL,
    allowed_by_policy INTEGER NOT NULL,
    blocked_reason TEXT,
    user_agent TEXT,
    FOREIGN KEY(run_id) REFERENCES runs(id)
);

CREATE TABLE IF NOT EXISTS request_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id INTEGER,
    timestamp TEXT NOT NULL,
    source TEXT NOT NULL,
    source_type TEXT NOT NULL,
    url TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER,
    allowed_by_policy INTEGER NOT NULL,
    blocked_reason TEXT,
    content_sha256 TEXT,
    FOREIGN KEY(run_id) REFERENCES runs(id)
);
"""


class Database:
    def __init__(self, path: Path) -> None:
        self.path = path

    def connect(self) -> sqlite3.Connection:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        connection = sqlite3.connect(self.path)
        connection.row_factory = sqlite3.Row
        return connection

    def initialize(self) -> None:
        with closing(self.connect()) as connection:
            with connection:
                connection.executescript(SCHEMA)
                ensure_column(
                    connection,
                    "findings",
                    "review_status",
                    "TEXT NOT NULL DEFAULT 'unreviewed'",
                )
                ensure_column(connection, "findings", "analyst_notes", "TEXT")

    def create_run(self, started_at: str, note: str | None = None) -> int:
        with closing(self.connect()) as connection:
            with connection:
                cursor = connection.execute(
                    "INSERT INTO runs (started_at, note) VALUES (?, ?)",
                    (started_at, note),
                )
                return int(cursor.lastrowid)

    def upsert_target(self, target: Target, created_at: str) -> None:
        with closing(self.connect()) as connection:
            with connection:
                connection.execute(
                    """
                    INSERT OR IGNORE INTO targets (value, target_type, created_at)
                    VALUES (?, ?, ?)
                    """,
                    (target.value, target.target_type, created_at),
                )

    def save_findings(self, run_id: int, findings: list[Finding]) -> int:
        inserted = 0
        with closing(self.connect()) as connection:
            with connection:
                for finding in findings:
                    cursor = connection.execute(
                        """
                        INSERT OR IGNORE INTO findings (
                            run_id, target, target_type, source, source_type,
                            title, value, url, risk, confidence, collected_at
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            run_id,
                            finding.target,
                            finding.target_type,
                            finding.source,
                            finding.source_type,
                            finding.title,
                            finding.value,
                            finding.url,
                            finding.risk,
                            finding.confidence,
                            finding.timestamp(),
                        ),
                    )
                    inserted += cursor.rowcount
        return inserted

    def save_request_logs(self, run_id: int, logs: list[RequestLog]) -> int:
        inserted = 0
        with closing(self.connect()) as connection:
            with connection:
                for log in logs:
                    cursor = connection.execute(
                        """
                        INSERT INTO request_logs (
                            run_id, timestamp, source, source_type, url, method,
                            status_code, allowed_by_policy, blocked_reason,
                            content_sha256
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            run_id,
                            log.timestamp,
                            log.source,
                            log.source_type,
                            log.url,
                            log.method,
                            log.status_code,
                            int(log.allowed_by_policy),
                            log.blocked_reason,
                            log.content_sha256,
                        ),
                    )
                    inserted += cursor.rowcount
        return inserted

    def request_logs_for_run(self, run_id: int | None = None) -> list[sqlite3.Row]:
        query = "SELECT * FROM request_logs"
        params: tuple[int, ...] = ()
        if run_id is not None:
            query += " WHERE run_id = ?"
            params = (run_id,)
        query += " ORDER BY timestamp DESC, id DESC"

        with closing(self.connect()) as connection:
            with connection:
                return list(connection.execute(query, params))

    def list_runs(self, limit: int = 25) -> list[sqlite3.Row]:
        with closing(self.connect()) as connection:
            with connection:
                return list(
                    connection.execute(
                        """
                        SELECT
                            runs.id,
                            runs.started_at,
                            runs.note,
                            COUNT(DISTINCT findings.id) AS finding_count,
                            COUNT(DISTINCT request_logs.id) AS request_count
                        FROM runs
                        LEFT JOIN findings ON findings.run_id = runs.id
                        LEFT JOIN request_logs ON request_logs.run_id = runs.id
                        GROUP BY runs.id
                        ORDER BY runs.id DESC
                        LIMIT ?
                        """,
                        (limit,),
                    )
                )

    def list_findings(self, limit: int = 50) -> list[sqlite3.Row]:
        with closing(self.connect()) as connection:
            with connection:
                return list(
                    connection.execute(
                        """
                        SELECT *
                        FROM findings
                        ORDER BY collected_at DESC, id DESC
                        LIMIT ?
                        """,
                        (limit,),
                    )
                )

    def filter_findings(
        self,
        query: str = "",
        review_status: str = "",
        source_type: str = "",
        risk: str = "",
        limit: int = 100,
    ) -> list[sqlite3.Row]:
        filters = []
        params: list[str | int] = []

        if query:
            search = f"%{query}%"
            filters.append(
                """
                (
                    target LIKE ?
                    OR source LIKE ?
                    OR title LIKE ?
                    OR value LIKE ?
                    OR url LIKE ?
                    OR analyst_notes LIKE ?
                )
                """
            )
            params.extend([search, search, search, search, search, search])
        if review_status:
            filters.append("review_status = ?")
            params.append(review_status)
        if source_type:
            filters.append("source_type = ?")
            params.append(source_type)
        if risk:
            filters.append("risk = ?")
            params.append(risk)

        where = f"WHERE {' AND '.join(filters)}" if filters else ""
        params.append(limit)

        with closing(self.connect()) as connection:
            with connection:
                return list(
                    connection.execute(
                        f"""
                        SELECT *
                        FROM findings
                        {where}
                        ORDER BY collected_at DESC, id DESC
                        LIMIT ?
                        """,
                        tuple(params),
                    )
                )

    def search_findings(self, query: str, limit: int = 50) -> list[sqlite3.Row]:
        search = f"%{query}%"
        with closing(self.connect()) as connection:
            with connection:
                return list(
                    connection.execute(
                        """
                        SELECT *
                        FROM findings
                        WHERE target LIKE ?
                           OR source LIKE ?
                           OR title LIKE ?
                           OR value LIKE ?
                           OR url LIKE ?
                           OR analyst_notes LIKE ?
                        ORDER BY collected_at DESC, id DESC
                        LIMIT ?
                        """,
                        (search, search, search, search, search, search, limit),
                    )
                )

    def update_finding_review(
        self,
        finding_id: int,
        review_status: str,
        analyst_notes: str | None = None,
    ) -> bool:
        with closing(self.connect()) as connection:
            with connection:
                cursor = connection.execute(
                    """
                    UPDATE findings
                    SET review_status = ?, analyst_notes = ?
                    WHERE id = ?
                    """,
                    (review_status, analyst_notes, finding_id),
                )
                return cursor.rowcount > 0

    def latest_run_id(self) -> int | None:
        with closing(self.connect()) as connection:
            with connection:
                row = connection.execute(
                    "SELECT id FROM runs ORDER BY id DESC LIMIT 1"
                ).fetchone()
        return int(row["id"]) if row else None

    def findings_for_run(self, run_id: int | None = None) -> list[sqlite3.Row]:
        query = "SELECT * FROM findings"
        params: tuple[int, ...] = ()
        if run_id is not None:
            query += " WHERE run_id = ?"
            params = (run_id,)
        query += " ORDER BY source_type, source, target_type, target, title"

        with closing(self.connect()) as connection:
            with connection:
                return list(connection.execute(query, params))


def ensure_column(
    connection: sqlite3.Connection,
    table_name: str,
    column_name: str,
    column_definition: str,
) -> None:
    columns = [
        row["name"]
        for row in connection.execute(f"PRAGMA table_info({table_name})").fetchall()
    ]
    if column_name not in columns:
        connection.execute(
            f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_definition}"
        )
