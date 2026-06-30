# Publishing Checklist

Use this checklist before publishing Neon Scraper on GitHub.

## Repository Hygiene

- Confirm `config.toml`, `data/`, local reports, and SQLite files are ignored.
- Confirm example configs contain only safe fictional/demo values.
- Run the full test suite.
- Verify both CLI and local web interface start successfully.
- Generate a demo report with fictional targets.
- Review docs for old project names or accidental private context.

## Safety Review

- Confirm web scraping is allowlist based.
- Confirm `robots.txt` is respected.
- Confirm rate limiting is enabled.
- Confirm Tor remains disabled by default.
- Confirm reports do not store full page content by default.
- Confirm no credentials, cookies, tokens, or real personal data are committed.

## Suggested First Release

- Version: `0.1.0`
- Scope: local-first web scraping foundation, passive DNS optional, SQLite,
  Markdown reporting, request audit logs.
- Explicitly mark Tor support as planned, not implemented.
