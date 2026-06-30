"""Command line interface for Neon Scraper."""

from __future__ import annotations

import argparse
from datetime import UTC, datetime
from pathlib import Path
import shutil

from neon_scraper.analysis.deduplication import deduplicate_findings
from neon_scraper.collectors.web.policy import load_web_sources
from neon_scraper.config import Config, load_config
from neon_scraper.core.database import Database
from neon_scraper.core.models import Target
from neon_scraper.reporting.markdown import generate_markdown_report
from neon_scraper.runner import build_collectors, collect_request_logs
from neon_scraper.utils.logging import configure_logging
from neon_scraper.utils.validation import normalize_domain
from neon_scraper.web import run_web_interface


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="neon-scraper",
        description="Local-first passive web and Tor-ready exposure scraper.",
    )
    parser.add_argument(
        "--config",
        type=Path,
        default=Path("config.toml"),
        help="Path to a TOML configuration file.",
    )

    subcommands = parser.add_subparsers(dest="command", required=True)

    subcommands.add_parser("init", help="Initialize local data directories.")

    scan = subcommands.add_parser("scan", help="Run passive collection.")
    scan.add_argument("--domain", action="append", default=[], help="Domain to check.")
    scan.add_argument("--email", action="append", default=[], help="Email target.")
    scan.add_argument("--username", action="append", default=[], help="Username target.")
    scan.add_argument(
        "--organization",
        action="append",
        default=[],
        help="Organization name target.",
    )
    scan.add_argument("--no-dns", action="store_true", help="Skip passive DNS checks.")
    scan.add_argument("--no-web", action="store_true", help="Skip public web scraping.")
    scan.add_argument(
        "--include-tor",
        action="store_true",
        help="Include the experimental Tor collector when tor.enabled is true.",
    )

    report = subcommands.add_parser("report", help="Generate a Markdown report.")
    report.add_argument("--run-id", type=int, help="Report a specific run ID.")

    list_findings = subcommands.add_parser(
        "list-findings",
        help="List recent findings.",
    )
    list_findings.add_argument("--limit", type=int, default=25)

    search = subcommands.add_parser("search", help="Search local findings.")
    search.add_argument("query", help="Search text.")
    search.add_argument("--limit", type=int, default=25)

    review = subcommands.add_parser("review", help="Mark a finding review status.")
    review.add_argument("finding_id", type=int, help="Finding ID to update.")
    review.add_argument(
        "--status",
        choices=["unreviewed", "reviewed", "false_positive", "watch"],
        required=True,
        help="Review status.",
    )
    review.add_argument("--notes", default="", help="Analyst notes.")

    list_requests = subcommands.add_parser(
        "list-requests",
        help="List recent web request audit events.",
    )
    list_requests.add_argument("--run-id", type=int, help="Filter by run ID.")

    subcommands.add_parser("list-sources", help="List configured web sources.")
    subcommands.add_parser("web", help="Start the local web interface.")

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    config = load_config(args.config)
    configure_logging(config.app.log_level)
    database = Database(config.app.database_path)

    if args.command == "init":
        handle_init(config, database)
    elif args.command == "scan":
        handle_scan(args, config, database)
    elif args.command == "report":
        handle_report(args, config, database)
    elif args.command == "list-findings":
        handle_list_findings(args, database)
    elif args.command == "list-requests":
        handle_list_requests(args, database)
    elif args.command == "list-sources":
        handle_list_sources(config)
    elif args.command == "web":
        run_web_interface(config, database)
    elif args.command == "search":
        handle_search(args, database)
    elif args.command == "review":
        handle_review(args, database)


def handle_init(config: Config, database: Database) -> None:
    config.app.data_dir.mkdir(parents=True, exist_ok=True)
    config.app.reports_dir.mkdir(parents=True, exist_ok=True)
    database.initialize()

    example_config = Path("config.example.toml")
    active_config = Path("config.toml")
    if example_config.exists() and not active_config.exists():
        shutil.copyfile(example_config, active_config)

    config_dir = Path("config")
    config_dir.mkdir(exist_ok=True)
    example_sources = config_dir / "web_sources.example.toml"
    active_sources = Path("config/web_sources.toml")
    if example_sources.exists() and not active_sources.exists():
        shutil.copyfile(example_sources, active_sources)

    for example_name, active_name in (
        ("tor_allowlist.example.toml", "tor_allowlist.toml"),
        ("tor_blocklist.example.toml", "tor_blocklist.toml"),
    ):
        example_path = config_dir / example_name
        active_path = config_dir / active_name
        if example_path.exists() and not active_path.exists():
            shutil.copyfile(example_path, active_path)

    print(f"[neon] Initialized Neon Scraper at {config.app.data_dir}")


def handle_scan(args: argparse.Namespace, config: Config, database: Database) -> None:
    targets = build_targets(args)
    collectors = build_collectors(args, config, targets)
    if not collectors:
        raise SystemExit("No collectors are enabled. Check config or scan flags.")

    database.initialize()
    started_at = datetime.now(UTC).isoformat(timespec="seconds")
    run_id = database.create_run(started_at, note="CLI scan")

    for target in targets:
        database.upsert_target(target, started_at)

    findings = []
    for target in targets:
        for collector in collectors:
            findings.extend(collector.collect(target))

    unique_findings = deduplicate_findings(findings)
    inserted = database.save_findings(run_id, unique_findings)
    request_logs = collect_request_logs(collectors)
    request_log_count = database.save_request_logs(run_id, request_logs)
    print(
        f"[vault] Run {run_id} completed. "
        f"Collected {len(unique_findings)} unique findings, inserted {inserted} new. "
        f"Logged {request_log_count} request events."
    )


def handle_report(
    args: argparse.Namespace,
    config: Config,
    database: Database,
) -> None:
    database.initialize()
    run_id = args.run_id if args.run_id else database.latest_run_id()
    findings = database.findings_for_run(run_id)
    request_logs = database.request_logs_for_run(run_id)
    report_path = generate_markdown_report(
        findings,
        config.app.reports_dir,
        request_logs=request_logs,
    )
    print(f"[report] Report written to {report_path}")


def handle_list_findings(args: argparse.Namespace, database: Database) -> None:
    database.initialize()
    rows = database.list_findings(limit=args.limit)
    if not rows:
        print("No findings yet.")
        return

    for row in rows:
        print(format_finding_row(row))


def handle_search(args: argparse.Namespace, database: Database) -> None:
    database.initialize()
    rows = database.search_findings(args.query, limit=args.limit)
    if not rows:
        print("No matching findings.")
        return

    for row in rows:
        print(format_finding_row(row))


def handle_review(args: argparse.Namespace, database: Database) -> None:
    database.initialize()
    updated = database.update_finding_review(
        args.finding_id,
        args.status,
        args.notes or None,
    )
    if not updated:
        raise SystemExit(f"Finding not found: {args.finding_id}")
    print(f"[analyst] Finding {args.finding_id} marked as {args.status}.")


def handle_list_requests(args: argparse.Namespace, database: Database) -> None:
    database.initialize()
    rows = database.request_logs_for_run(args.run_id)
    if not rows:
        print("No request logs yet.")
        return

    for row in rows:
        status = row["status_code"] if row["status_code"] is not None else "-"
        allowed = "allowed" if row["allowed_by_policy"] else "blocked"
        reason = row["blocked_reason"] or "-"
        print(
            f"[{allowed}] {row['source']} {row['method']} {row['url']} "
            f"status={status} reason={reason}"
        )


def format_finding_row(row) -> str:
    return (
        f"#{row['id']} [{row['risk']}/{row['review_status']}] {row['target']} "
        f"{row['source']}/{row['title']}: {row['value']}"
    )


def handle_list_sources(config: Config) -> None:
    sources = load_web_sources(config.web.sources_file)
    if not sources:
        print(f"No web sources configured at {config.web.sources_file}")
        return

    for source in sources:
        state = "enabled" if source.enabled else "disabled"
        print(
            f"[{state}] {source.name} base={source.base_url} "
            f"seeds={len(source.seed_urls)} "
            f"allowed_paths={','.join(source.allowed_paths)} "
            f"keywords={','.join(source.keywords) if source.keywords else '-'}"
        )


def build_targets(args: argparse.Namespace) -> list[Target]:
    targets: list[Target] = []

    for domain in args.domain:
        targets.append(Target(value=normalize_domain(domain), target_type="domain"))
    for email in args.email:
        targets.append(Target(value=email.strip().lower(), target_type="email"))
    for username in args.username:
        targets.append(Target(value=username.strip(), target_type="username"))
    for organization in args.organization:
        targets.append(Target(value=organization.strip(), target_type="organization"))

    if not targets:
        raise SystemExit(
            "No targets provided. Use --domain, --email, --username, or --organization."
        )
    return targets


if __name__ == "__main__":
    main()
