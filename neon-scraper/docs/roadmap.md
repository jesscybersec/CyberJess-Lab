# Neon Scraper Roadmap

## Phase 1 - Project Structure And CLI

- Create a Python package with modular collectors.
- Add CLI commands for initialization, scans, reporting, and finding review.
- Keep configuration local and explicit.

## Phase 2 - SQLite, Models, And Logging

- Add SQLite schema for runs, targets, findings, and future Tor audit logs.
- Define reusable data models.
- Add structured logging defaults.

## Phase 3 - Passive DNS Starter Collector

- Collect `A`, `AAAA`, `MX`, `NS`, `TXT`, and DMARC-related records.
- Store normalized findings locally.
- Apply simple defensive risk hints for SPF and DMARC posture.

## Phase 4 - Public Web Scraper Foundation

- Add a policy-controlled HTTP client.
- Respect `robots.txt` where applicable.
- Add per-domain rate limits, timeout, size limits, and clear user-agent.
- Support `GET` and `HEAD` only.
- Status: initial implementation complete.

## Phase 5 - Source Policy And Allowlists

- Define source profiles for public websites.
- Add source allowlists and blocked URL patterns.
- Store policy decisions for auditing.
- Status: initial allowlist implementation complete.

## Phase 6 - Content Extraction And Evidence

- Extract page title, canonical URL, matched snippets, status code, and content
  hash.
- Avoid storing full pages by default.
- Preserve enough context for analyst review.
- Status: initial title, snippet, and SHA-256 capture complete.

## Phase 7 - Normalization And Deduplication

- Normalize findings from all collectors.
- Deduplicate by target, source, title, and value.
- Preserve timestamps and confidence.

## Phase 8 - Markdown Reporting

- Generate local Markdown reports.
- Include executive summary, source sections, findings, and recommendations.

## Phase 9 - Simple Risk Scoring

- Add transparent scoring rules.
- Keep scores explainable and override-friendly.

## Phase 10 - Tests, Demo Mode, And Publish Prep

- Add unit tests for config, validation, database, and reporting.
- Expand GitHub-ready documentation.
- Add synthetic fixtures for tutorials and screenshots.
- Ensure demo mode never uses real personal data.
- Status: initial publication docs complete.

## Phase 11 - Local Web Interface

- Add localhost-only dashboard.
- Support source review, finding review, request audit review, manual scans, and
  report generation.
- Keep the CLI and web UI backed by the same runner logic.
- Status: initial standard-library web interface complete.

## Phase 12 - Controlled Crawl Depth

- Add optional same-host link discovery.
- Keep depth low by default.
- Enforce allowlisted paths and blocked patterns on every discovered URL.
- Store crawl decisions in request logs.
- Add maximum pages per source and maximum runtime per scan.
- Status: initial same-host depth and page-limit crawl complete; maximum
  runtime per scan still pending.

## Phase 13 - Better Extraction And Matching

- Add email, username, domain, organization, and keyword matchers.
- Add canonical URL extraction.
- Add meta description extraction.
- Add configurable evidence snippet counts.
- Add optional content hashing without storing full bodies.
- Status: initial target-type and keyword matchers complete; canonical URL and
  meta extraction still pending.

## Phase 14 - Local Search And Review Workflow

- Add search across findings and request logs.
- Add reviewed/false-positive status.
- Add analyst notes.
- Add export filters.
- Status: initial finding search, review status, analyst notes, CLI review, and
  web review actions complete; export filters still pending.

## Phase 15 - Richer Web UI

- Add filters, scan history, source editor, report preview, and finding review
  status.
- Keep the interface local-first.
- Consider a richer framework only if the standard-library UI becomes limiting.
- Status: initial filters, scan history, report preview, review actions, and
  append-only source editor complete.

## Phase 16 - Experimental Passive Tor Module

Objective: add passive scraping of public, explicitly allowlisted `.onion`
sources.

Out of scope:

- stolen dumps;
- marketplaces;
- account-required forums;
- illegal content;
- technical bypass;
- aggressive automation.

Expected result: a Tor scraper that is disabled by default and only activates
through explicit configuration.
- Status: initial disabled-by-default Tor collector scaffold complete with v3
  `.onion` validation, allowlist policy, optional proxy client, and double
  opt-in via config plus `--include-tor`.

Planned package layout:

```text
neon_scraper/
└── collectors/
    └── tor/
        ├── __init__.py
        ├── base.py
        ├── client.py
        ├── validator.py
        ├── allowlist.py
        ├── blocklist.py
        ├── collector.py
        └── policy.py
```

Core controls:

- access only public `.onion` sites;
- no authentication;
- no purchase;
- no interaction;
- no CAPTCHA, paywall, anti-bot, or restriction bypass;
- no stolen dump download;
- no mass collection of personal data;
- strict rate limiting;
- strict timeout;
- clear user-agent;
- source allowlist;
- blocked category list;
- complete request logging;
- separate storage or `source_type = "tor"`;
- reinforced report warning.
