# Legal And Ethical Use

Neon Scraper is designed for defensive, educational, and personal exposure
monitoring. It should be used only against identities, domains, usernames,
organizations, and public sources you are authorized to monitor.

## Allowed MVP Behavior

- Passive DNS queries for domains.
- Local indexing in SQLite.
- Local Markdown report generation.
- Public-source collection that does not require authentication.
- Respect for `robots.txt` where web crawling or scraping is applicable.
- Clear user-agent strings for automated HTTP requests.

## Disallowed Behavior

- No exploitation.
- No credential use.
- No authentication to third-party services.
- No CAPTCHA, paywall, anti-bot, or access-control bypass.
- No purchasing.
- No interaction with illegal services.
- No downloading stolen data dumps.
- No mass collection of personal data.
- No aggressive automation.

## Data Handling

The MVP stores results locally in SQLite. Reports are generated locally as
Markdown files. Avoid scanning third parties without authorization, and avoid
storing sensitive personal data that is not needed for defensive exposure
monitoring.

## Defensive Interpretation

Findings should be treated as leads, not final truth. Reports should preserve
source, timestamp, confidence, and risk level so false positives can be reviewed
manually.

## Phase 11 Tor Module Policy

The future Tor module must remain experimental, isolated, and disabled by
default. It may only access public `.onion` sources that are explicitly
allowlisted. It must not authenticate, purchase, interact, bypass restrictions,
download stolen dumps, or collect personal data at scale.

Required controls:

- `tor.enabled = false` by default;
- configurable Tor proxy;
- strict `.onion` URL validation;
- allowlist required;
- blocked category list required;
- `GET` and `HEAD` only;
- strict rate limiting;
- strict timeout;
- transparent user-agent;
- response size limits;
- no persistent cookies;
- no JavaScript automation;
- request decision logging;
- findings tagged with `source_type = "tor"`;
- reinforced legal notice in reports.
