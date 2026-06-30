# Security Policy

Neon Scraper is a defensive, local-first scraping tool. Please report security
issues responsibly and do not include real personal data, credentials, tokens,
or private investigation details in public issues.

## Supported Scope

Security reports are welcome for:

- unsafe default behavior;
- bypass-prone scraping logic;
- data leakage in reports or logs;
- path traversal or unsafe file handling;
- dependency or packaging risks;
- behavior that violates the stated passive-only model.

## Out Of Scope

- Requests to add credential use, login automation, CAPTCHA bypass, paywall
  bypass, exploit logic, stolen data download, or aggressive collection.
- Reports requiring interaction with illegal services.
- Reports containing employer-specific operational data or personal data that
  was not safely redacted.

## Safe Defaults

The project should remain:

- local-first;
- passive by default;
- source allowlist driven;
- robots.txt aware for public web sources;
- Tor-disabled by default;
- auditable through local request logs.

