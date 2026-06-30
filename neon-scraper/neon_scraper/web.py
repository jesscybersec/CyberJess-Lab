"""Local web interface for Neon Scraper."""

from __future__ import annotations

from datetime import UTC, datetime
from html import escape
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from types import SimpleNamespace
from urllib.parse import parse_qs, urlparse

from neon_scraper.analysis.deduplication import deduplicate_findings
from neon_scraper.collectors.web.policy import load_web_sources
from neon_scraper.config import Config
from neon_scraper.core.database import Database
from neon_scraper.core.models import Target
from neon_scraper.reporting.markdown import generate_markdown_report
from neon_scraper.runner import build_collectors, collect_request_logs
from neon_scraper.utils.validation import normalize_domain


def run_web_interface(config: Config, database: Database) -> None:
    database.initialize()
    handler = build_handler(config, database)
    server = ThreadingHTTPServer(
        (config.web.interface_host, config.web.interface_port),
        handler,
    )
    print(
        "[neon-web] Local interface online at "
        f"http://{config.web.interface_host}:{config.web.interface_port}"
    )
    server.serve_forever()


def build_handler(config: Config, database: Database):
    class NeonScraperHandler(BaseHTTPRequestHandler):
        def do_GET(self) -> None:
            route = urlparse(self.path).path
            if route == "/":
                self.respond(render_dashboard(config, database))
            elif route == "/sources":
                self.respond(render_sources(config))
            elif route == "/findings":
                params = parse_qs(urlparse(self.path).query)
                self.respond(render_findings(database, params=params))
            elif route == "/requests":
                self.respond(render_requests(database))
            elif route == "/runs":
                self.respond(render_runs(database))
            elif route == "/report":
                params = parse_qs(urlparse(self.path).query)
                self.respond(render_report_page(config, database, params=params))
            else:
                self.send_error(404, "Not found")

        def do_POST(self) -> None:
            route = urlparse(self.path).path
            if route == "/scan":
                body = self.read_form()
                message = run_scan_from_form(body, config, database)
                self.respond(render_dashboard(config, database, message=message))
            elif route == "/review":
                body = self.read_form()
                message = update_review_from_form(body, database)
                self.respond(render_findings(database, message=message))
            elif route == "/sources":
                body = self.read_form()
                message = save_source_from_form(body, config)
                self.respond(render_sources(config, message=message))
            elif route == "/report":
                report_path = generate_latest_report(config, database)
                self.respond(render_report_page(config, database, report_path=report_path))
            else:
                self.send_error(404, "Not found")

        def read_form(self) -> dict[str, list[str]]:
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length).decode("utf-8")
            return parse_qs(raw)

        def respond(self, html: str) -> None:
            encoded = html.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(encoded)))
            self.end_headers()
            self.wfile.write(encoded)

        def log_message(self, format: str, *args) -> None:
            return

    return NeonScraperHandler


def run_scan_from_form(
    form: dict[str, list[str]],
    config: Config,
    database: Database,
) -> str:
    targets = parse_targets(form)
    if not targets:
        return "No targets provided."

    args = SimpleNamespace(
        no_dns=bool(form.get("no_dns")),
        no_web=False,
        include_tor=False,
    )
    collectors = build_collectors(args, config, targets)
    if not collectors:
        return "No collectors are enabled."

    started_at = datetime.now(UTC).isoformat(timespec="seconds")
    run_id = database.create_run(started_at, note="Web UI scan")
    for target in targets:
        database.upsert_target(target, started_at)

    findings = []
    for target in targets:
        for collector in collectors:
            findings.extend(collector.collect(target))

    unique_findings = deduplicate_findings(findings)
    inserted = database.save_findings(run_id, unique_findings)
    request_log_count = database.save_request_logs(run_id, collect_request_logs(collectors))
    return (
        f"Run {run_id} complete: {len(unique_findings)} findings, "
        f"{inserted} new, {request_log_count} request events."
    )


def parse_targets(form: dict[str, list[str]]) -> list[Target]:
    targets: list[Target] = []
    for raw in split_lines(first(form, "domains")):
        targets.append(Target(value=normalize_domain(raw), target_type="domain"))
    for raw in split_lines(first(form, "emails")):
        targets.append(Target(value=raw.strip().lower(), target_type="email"))
    for raw in split_lines(first(form, "usernames")):
        targets.append(Target(value=raw.strip(), target_type="username"))
    for raw in split_lines(first(form, "organizations")):
        targets.append(Target(value=raw.strip(), target_type="organization"))
    return targets


def generate_latest_report(config: Config, database: Database) -> Path:
    run_id = database.latest_run_id()
    findings = database.findings_for_run(run_id)
    request_logs = database.request_logs_for_run(run_id)
    return generate_markdown_report(findings, config.app.reports_dir, request_logs)


def save_source_from_form(form: dict[str, list[str]], config: Config) -> str:
    name = first(form, "name").strip()
    base_url = first(form, "base_url").strip()
    if not name or not base_url:
        return "Source name and base URL are required."

    source = {
        "name": name,
        "base_url": base_url,
        "enabled": bool(form.get("enabled")),
        "seed_urls": split_lines(first(form, "seed_urls")) or [base_url],
        "allowed_paths": split_lines(first(form, "allowed_paths")) or ["/"],
        "blocked_patterns": split_lines(first(form, "blocked_patterns")),
        "keywords": split_lines(first(form, "keywords")),
        "notes": first(form, "notes").strip(),
    }
    sources = source_dicts_from_existing(config)
    sources.append(source)
    write_sources_file(config.web.sources_file, sources)
    return f"Source added: {name}"


def source_dicts_from_existing(config: Config) -> list[dict]:
    sources = []
    for source in load_web_sources(config.web.sources_file):
        sources.append(
            {
                "name": source.name,
                "base_url": source.base_url,
                "enabled": source.enabled,
                "seed_urls": list(source.seed_urls),
                "allowed_paths": list(source.allowed_paths),
                "blocked_patterns": list(source.blocked_patterns),
                "keywords": list(source.keywords),
                "notes": source.notes,
            }
        )
    return sources


def write_sources_file(path: Path, sources: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    blocks = []
    for source in sources:
        blocks.append(
            "\n".join(
                [
                    "[[sources]]",
                    f'name = "{toml_escape(source["name"])}"',
                    f'base_url = "{toml_escape(source["base_url"])}"',
                    f"enabled = {str(bool(source['enabled'])).lower()}",
                    f"seed_urls = {toml_list(source['seed_urls'])}",
                    f"allowed_paths = {toml_list(source['allowed_paths'])}",
                    f"blocked_patterns = {toml_list(source['blocked_patterns'])}",
                    f"keywords = {toml_list(source['keywords'])}",
                    f'notes = "{toml_escape(source["notes"])}"',
                ]
            )
        )
    path.write_text("\n\n".join(blocks) + "\n", encoding="utf-8")


def update_review_from_form(
    form: dict[str, list[str]],
    database: Database,
) -> str:
    finding_id = int(first(form, "finding_id"))
    status = first(form, "status")
    notes = first(form, "notes") or None
    if status not in {"unreviewed", "reviewed", "false_positive", "watch"}:
        return "Invalid review status."
    updated = database.update_finding_review(finding_id, status, notes)
    if not updated:
        return f"Finding not found: {finding_id}"
    return f"Finding {finding_id} marked as {status}."


def render_dashboard(
    config: Config,
    database: Database,
    message: str | None = None,
) -> str:
    findings = database.list_findings(limit=10)
    requests = database.request_logs_for_run()
    sources = load_web_sources(config.web.sources_file)
    body = [
        "<h1>Neon Scraper</h1>",
        "<p class='tag'>PASSIVE WEB + TOR WATCH // LOCAL-FIRST</p>",
        render_nav(),
        render_message(message),
        "<section><h2>New Scan</h2>",
        "<form method='post' action='/scan'>",
        textarea("domains", "Domains"),
        textarea("usernames", "Usernames"),
        textarea("emails", "Emails"),
        textarea("organizations", "Organizations"),
        "<label><input type='checkbox' name='no_dns'> Skip DNS</label>",
        "<button type='submit'>Run passive scan</button>",
        "</form></section>",
        "<section><h2>Status</h2>",
        f"<p>Sources: <strong>{len(sources)}</strong></p>",
        f"<p>Recent findings: <strong>{len(findings)}</strong></p>",
        f"<p>Request audit events: <strong>{len(requests)}</strong></p>",
        f"<p>Crawl depth: <strong>{config.web.max_depth}</strong></p>",
        f"<p>Max pages/source: <strong>{config.web.max_pages_per_source}</strong></p>",
        "</section>",
    ]
    return page("Neon Scraper", "\n".join(body))


def render_sources(config: Config, message: str | None = None) -> str:
    rows = []
    for source in load_web_sources(config.web.sources_file):
        state = "enabled" if source.enabled else "disabled"
        rows.append(
            "<tr>"
            f"<td>{escape(source.name)}</td>"
            f"<td>{escape(state)}</td>"
            f"<td>{escape(source.base_url)}</td>"
            f"<td>{len(source.seed_urls)}</td>"
            f"<td>{escape(', '.join(source.allowed_paths))}</td>"
            f"<td>{escape(', '.join(source.keywords) if source.keywords else '-')}</td>"
            "</tr>"
        )
    return page(
        "Sources",
        render_nav()
        + render_message(message)
        + render_source_form()
        + table(
            ["Name", "State", "Base URL", "Seeds", "Allowed paths", "Keywords"],
            rows,
        ),
    )


def render_findings(
    database: Database,
    params: dict[str, list[str]] | None = None,
    message: str | None = None,
) -> str:
    params = params or {}
    query = first(params, "q")
    review_status = first(params, "review_status")
    source_type = first(params, "source_type")
    risk = first(params, "risk")
    rows = []
    findings = database.filter_findings(
        query=query,
        review_status=review_status,
        source_type=source_type,
        risk=risk,
        limit=100,
    )
    for row in findings:
        rows.append(
            "<tr>"
            f"<td>{row['id']}</td>"
            f"<td>{escape(row['target'])}</td>"
            f"<td>{escape(row['source_type'])}</td>"
            f"<td>{escape(row['source'])}</td>"
            f"<td>{escape(row['risk'])}</td>"
            f"<td>{escape(row['review_status'])}</td>"
            f"<td>{escape(row['title'])}</td>"
            f"<td>{escape(row['value'])}</td>"
            "<td>"
            f"{review_form(row['id'], 'reviewed')}"
            f"{review_form(row['id'], 'watch')}"
            f"{review_form(row['id'], 'false_positive')}"
            "</td>"
            "</tr>"
        )
    search_form = (
        "<form method='get' action='/findings'>"
        f"<input name='q' value='{escape(query)}' placeholder='search findings'>"
        f"<input name='source_type' value='{escape(source_type)}' placeholder='source type'>"
        f"<input name='risk' value='{escape(risk)}' placeholder='risk'>"
        f"{select_review_status(review_status)}"
        "<button type='submit'>Search</button>"
        "</form>"
    )
    return page(
        "Findings",
        render_nav()
        + render_message(message)
        + search_form
        + table(
            ["ID", "Target", "Type", "Source", "Risk", "Review", "Title", "Value", "Actions"],
            rows,
        ),
    )


def render_requests(database: Database) -> str:
    rows = []
    for row in database.request_logs_for_run()[:100]:
        allowed = "allowed" if row["allowed_by_policy"] else "blocked"
        status = row["status_code"] if row["status_code"] is not None else "-"
        reason = row["blocked_reason"] or "-"
        rows.append(
            "<tr>"
            f"<td>{escape(allowed)}</td>"
            f"<td>{escape(row['source'])}</td>"
            f"<td>{escape(row['method'])}</td>"
            f"<td>{escape(row['url'])}</td>"
            f"<td>{escape(str(status))}</td>"
            f"<td>{escape(reason)}</td>"
            "</tr>"
        )
    return page("Request Audit", render_nav() + table(["Decision", "Source", "Method", "URL", "Status", "Reason"], rows))


def render_runs(database: Database) -> str:
    rows = []
    for row in database.list_runs(limit=50):
        rows.append(
            "<tr>"
            f"<td>{row['id']}</td>"
            f"<td>{escape(row['started_at'])}</td>"
            f"<td>{escape(row['note'] or '-')}</td>"
            f"<td>{row['finding_count']}</td>"
            f"<td>{row['request_count']}</td>"
            f"<td><a href='/report?run_id={row['id']}'>preview report</a></td>"
            "</tr>"
        )
    return page(
        "Runs",
        render_nav()
        + table(["ID", "Started", "Note", "Findings", "Requests", "Report"], rows),
    )


def render_report_page(
    config: Config,
    database: Database,
    report_path: Path | None = None,
    params: dict[str, list[str]] | None = None,
) -> str:
    reports = sorted(config.app.reports_dir.glob("*.md")) if config.app.reports_dir.exists() else []
    report_items = "".join(f"<li>{escape(str(path))}</li>" for path in reports[-10:])
    run_id = int(first(params or {}, "run_id") or database.latest_run_id() or 0)
    preview = render_report_preview(database, run_id) if run_id else "<p>No runs yet.</p>"
    body = [
        render_nav(),
        render_message(f"Generated report: {report_path}" if report_path else None),
        "<form method='post' action='/report'><button type='submit'>Generate latest report</button></form>",
        f"<h2>Preview Run {run_id}</h2>",
        preview,
        "<h2>Recent Reports</h2>",
        f"<ul>{report_items}</ul>",
    ]
    return page("Reports", "\n".join(body))


def render_report_preview(database: Database, run_id: int) -> str:
    findings = database.findings_for_run(run_id)
    if not findings:
        return "<p>No findings for this run.</p>"
    rows = []
    for finding in findings[:25]:
        rows.append(
            "<tr>"
            f"<td>{escape(finding['target'])}</td>"
            f"<td>{escape(finding['source_type'])}</td>"
            f"<td>{escape(finding['review_status'])}</td>"
            f"<td>{escape(finding['title'])}</td>"
            "</tr>"
        )
    return table(["Target", "Source Type", "Review", "Title"], rows)


def page(title: str, body: str) -> str:
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{escape(title)}</title>
  <style>
    body {{ margin: 0; font-family: Consolas, monospace; background: #101114; color: #e8f7f4; }}
    main {{ max-width: 1120px; margin: 0 auto; padding: 32px; }}
    a {{ color: #4de3c1; }}
    nav {{ display: flex; gap: 12px; flex-wrap: wrap; margin: 18px 0 28px; }}
    nav a, button {{ background: #1d2430; color: #e8f7f4; border: 1px solid #4de3c1; padding: 9px 12px; text-decoration: none; }}
    section {{ border-top: 1px solid #2f3a46; padding-top: 18px; margin-top: 18px; }}
    textarea {{ width: 100%; min-height: 64px; background: #171b22; color: #e8f7f4; border: 1px solid #3d4a57; margin: 6px 0 14px; }}
    label {{ display: block; margin-top: 10px; }}
    table {{ width: 100%; border-collapse: collapse; font-size: 14px; }}
    th, td {{ border-bottom: 1px solid #2f3a46; padding: 10px; vertical-align: top; }}
    th {{ color: #4de3c1; text-align: left; }}
    .tag {{ color: #ff4fd8; }}
    .message {{ border: 1px solid #4de3c1; padding: 12px; background: #13231f; }}
  </style>
</head>
<body><main>{body}</main></body>
</html>"""


def render_nav() -> str:
    return (
        "<nav>"
        "<a href='/'>Dashboard</a>"
        "<a href='/sources'>Sources</a>"
        "<a href='/findings'>Findings</a>"
        "<a href='/runs'>Runs</a>"
        "<a href='/requests'>Requests</a>"
        "<a href='/report'>Reports</a>"
        "</nav>"
    )


def table(headers: list[str], rows: list[str]) -> str:
    header = "".join(f"<th>{escape(item)}</th>" for item in headers)
    body = "".join(rows) if rows else f"<tr><td colspan='{len(headers)}'>No data yet.</td></tr>"
    return f"<table><thead><tr>{header}</tr></thead><tbody>{body}</tbody></table>"


def textarea(name: str, label: str) -> str:
    return (
        f"<label>{escape(label)}"
        f"<textarea name='{escape(name)}' placeholder='one per line'></textarea>"
        "</label>"
    )


def render_message(message: str | None) -> str:
    if not message:
        return ""
    return f"<p class='message'>{escape(message)}</p>"


def render_source_form() -> str:
    return (
        "<section><h2>Add Source</h2>"
        "<form method='post' action='/sources'>"
        "<label>Name<input name='name' placeholder='Example Website'></label>"
        "<label>Base URL<input name='base_url' placeholder='https://example.com/'></label>"
        "<label><input type='checkbox' name='enabled' checked> Enabled</label>"
        + textarea("seed_urls", "Seed URLs")
        + textarea("allowed_paths", "Allowed paths")
        + textarea("blocked_patterns", "Blocked patterns")
        + textarea("keywords", "Keywords")
        + textarea("notes", "Notes")
        + "<button type='submit'>Add source</button>"
        + "</form></section>"
    )


def select_review_status(selected: str) -> str:
    options = ["", "unreviewed", "reviewed", "false_positive", "watch"]
    html = ["<select name='review_status'>"]
    for option in options:
        label = option or "any review"
        selected_attr = " selected" if option == selected else ""
        html.append(
            f"<option value='{escape(option)}'{selected_attr}>{escape(label)}</option>"
        )
    html.append("</select>")
    return "".join(html)


def review_form(finding_id: int, status: str) -> str:
    return (
        "<form method='post' action='/review' style='display:inline'>"
        f"<input type='hidden' name='finding_id' value='{finding_id}'>"
        f"<input type='hidden' name='status' value='{escape(status)}'>"
        f"<button type='submit'>{escape(status)}</button>"
        "</form>"
    )


def first(form: dict[str, list[str]], key: str) -> str:
    values = form.get(key, [""])
    return values[0] if values else ""


def split_lines(value: str) -> list[str]:
    return [line.strip() for line in value.splitlines() if line.strip()]


def toml_list(values: list[str]) -> str:
    return "[" + ", ".join(f'"{toml_escape(value)}"' for value in values) + "]"


def toml_escape(value: str) -> str:
    return value.replace("\\", "\\\\").replace('"', '\\"')
