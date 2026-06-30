# Neon Scraper

`NEON SCRAPER // PASSIVE WEB WATCH // LOCAL-FIRST`

Neon Scraper is a local-first passive exposure monitor. Give it targets you are authorized to monitor, give it explicit public web sources, and it quietly looks for mentions while keeping evidence, audit logs, and reports on your machine.

Think: small cyberpunk analyst console, not magic black box. The neon is for the vibe. The brakes are for staying out of trouble.

## What It Does

- Scrapes only configured public web sources.
- Respects `robots.txt`.
- Uses same-host controlled crawl depth.
- Enforces source allowlists and blocked paths.
- Searches for domains, usernames, emails, organizations, and source keywords.
- Stores findings in local SQLite.
- Stores request audit logs.
- Generates Markdown reports.
- Offers both CLI and localhost web UI.

## What It Does Not Do

- No authentication to third-party services.
- No CAPTCHA, paywall, anti-bot, or access-control bypass.
- No form submission.
- No JavaScript automation.
- No stolen dump downloading.
- No aggressive crawling.
- No Tor collection yet. Tor is planned as a future isolated module and remains disabled by default.

## Install

```bash
cd neon-scraper
python -m venv .venv
source .venv/bin/activate
pip install -e .
```

Optional passive DNS support:

```bash
pip install -e ".[dns]"
```

Development install:

```bash
pip install -e ".[dns,dev]"
python -B -m unittest discover -s tests
```

## First Boot

```bash
neon-scraper init
```

This creates local-only runtime files:

- `config.toml`
- `config/web_sources.toml`
- `data/osint.sqlite`
- `data/reports/`

These are ignored by Git. Your local findings stay local.

## Configure Sources

Before Neon Scraper can scrape anything, you must tell it **where it is allowed
to look**.

That is what `config/web_sources.toml` does.

This file is not a list of targets. It is a list of **approved public websites**
that Neon Scraper may visit. Your targets are the things you search for, such as
your username, email, domain, or organization. Sources are the places where the
tool is allowed to look for those targets.

Tiny neon example:

```text
target  = "neonjess"
source  = "https://example.com/"
mission = "look for neonjess on this approved public website"
```

Edit:

```bash
config/web_sources.toml
```

```toml
[[sources]]
name = "Example Website"
base_url = "https://example.com/"
enabled = true
seed_urls = ["https://example.com/"]
allowed_paths = ["/"]
blocked_patterns = ["/login", "/admin", "/account"]
keywords = ["example"]
notes = "Safe demonstration source."
```

Field guide:

| Field | What it means | Why it matters |
|---|---|---|
| `name` | Human-friendly source name | Appears in findings and reports |
| `base_url` | Root website for the source | Locks the source to one host |
| `enabled` | Turns the source on or off | Lets you park sources without deleting them |
| `seed_urls` | Starting pages for the crawl | The crawler begins here |
| `allowed_paths` | Paths Neon Scraper may fetch | Keeps crawling scoped and intentional |
| `blocked_patterns` | Paths Neon Scraper must never fetch | Blocks login/admin/account/payment areas |
| `keywords` | Extra terms to watch for on that source | Useful for brand/project mentions |
| `notes` | Your analyst notes about the source | Helps future-you remember why it exists |

How it works:

- `seed_urls` are the starting pages.
- `allowed_paths` define what can be fetched.
- `blocked_patterns` always win.
- `keywords` are optional extra terms to watch.
- `.onion` URLs are rejected by the web collector and reserved for the future Tor module.

Example behavior:

```text
seed_urls = ["https://example.com/"]
allowed_paths = ["/blog", "/about"]
blocked_patterns = ["/login"]
```

Allowed:

```text
https://example.com/blog/post-1
https://example.com/about/team
```

Blocked:

```text
https://example.com/login
https://example.com/admin
https://other-site.example/
```

That last one is blocked because Neon Scraper stays on the same host. No
side-quest crawling. The scraper is wearing a leash and tiny mirrored shades.

## Configure Tor Sources

Tor support is experimental, isolated, and disabled by default.

To use it later, all of these must be true:

- optional dependency installed with `pip install -e ".[tor]"`;
- Tor proxy running locally;
- `tor.enabled = true` in `config.toml`;
- scan launched with `--include-tor`;
- source present in `config/tor_allowlist.toml`;
- source uses a valid v3 `.onion` URL;
- source is public and requires no account, payment, CAPTCHA bypass, or
  interaction.

Example:

```toml
[[sources]]
name = "Example Public Onion Source"
base_url = "http://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.onion/"
enabled = false
seed_urls = ["http://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.onion/"]
allowed_paths = ["/"]
blocked_patterns = ["/login", "/account", "/cart", "/checkout"]
keywords = ["example"]
notes = "Disabled placeholder."
```

Tor stays off unless you very intentionally turn all the keys. This is not a
dark-web vacuum cleaner. It is a passive allowlisted monitor with a locked
toolbox.

## Run A CLI Scan

```bash
neon-scraper list-sources
neon-scraper scan --domain example.com --username neonjess --email test@example.com
```

Useful flags:

```bash
neon-scraper scan --username neonjess --no-dns
neon-scraper scan --domain example.com --no-web
```

## Review Findings

```bash
neon-scraper list-findings
neon-scraper search neonjess
neon-scraper review 1 --status reviewed --notes "Relevant public profile mention."
neon-scraper review 2 --status false_positive --notes "Different person."
neon-scraper review 3 --status watch --notes "Check again later."
```

Review statuses:

- `unreviewed`
- `reviewed`
- `false_positive`
- `watch`

## Request Audit

```bash
neon-scraper list-requests
```

The audit log records allowed and blocked requests, including policy and `robots.txt` decisions. Tiny black box? No thanks. We keep receipts.

## Generate Reports

```bash
neon-scraper report
```

Reports are written to:

```text
data/reports/
```

Reports include:

- executive summary;
- findings grouped by source type;
- risk and confidence;
- review status;
- request audit summary;
- legal and ethical notice.

## Use The Web Interface

```bash
neon-scraper web
```

Open:

```text
http://127.0.0.1:8765
```

The local web UI supports:

- dashboard;
- manual scan form;
- source review;
- finding search;
- review actions;
- request audit review;
- report generation.

It binds to localhost by default because this is an analyst console, not a billboard.

## How The Crawl Works

Default crawl controls live in `config.toml`:

```toml
[web]
max_depth = 1
max_pages_per_source = 10
respect_robots_txt = true
max_response_bytes = 1048576
```

The crawler:

- starts from `seed_urls`;
- follows same-host links only;
- removes URL fragments;
- checks every discovered URL against source policy;
- stops at `max_depth`;
- stops at `max_pages_per_source`;
- logs blocked discoveries.

## Matcher Engine

Neon Scraper currently detects:

- exact phrase mentions;
- email addresses;
- domains;
- usernames with basic boundary awareness;
- organization names;
- source-level keywords.

Evidence is stored as snippets plus content SHA-256, not full page bodies by default.

## Roadmap Snapshot

Current state:

- CLI complete for MVP workflows.
- Local web UI initial version complete.
- Controlled crawl initial version complete.
- Matchers initial version complete.
- Local search and review workflow initial version complete.
- Richer local web UI initial version complete.
- Experimental Tor module scaffold complete and disabled by default.

Next optimization targets:

- canonical URL and meta description extraction;
- better source editing and validation in the web UI;
- runtime limits per scan;
- export filters;
- optional Tor report hardening.

## Safety Docs

- [Legal and Ethical Use](docs/legal-and-ethical-use.md)
- [Roadmap](docs/roadmap.md)
- [Publishing Checklist](docs/publishing-checklist.md)
- [Security Policy](SECURITY.md)
