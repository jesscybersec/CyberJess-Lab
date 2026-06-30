# Product Direction

## Positioning

Neon Scraper should feel cyberpunk, slightly funny, and GitHub-publishable while
remaining serious about legality, consent, and defensive use.

Working tagline:

```text
NEON SCRAPER // PASSIVE WEB + TOR WATCH // LOCAL-FIRST
```

## Product Lane

Neon Scraper focuses on:

- passive scraping;
- public web sources;
- explicit source policies;
- local indexing;
- evidence preservation;
- Markdown reporting;
- future Tor access through an isolated allowlisted module.

## Desired Vibe

The tone can be playful without making the tool reckless:

- terminal-style status messages;
- neon/cyberpunk naming;
- funny but clear warnings;
- bilingual docs later;
- sample reports with fictional targets;
- no edgy claims about hacking, breaching, or bypassing.
- CLI-first workflow with a localhost web interface for review.

Example command mood:

```text
[neon] source policy loaded
[scraper] robots.txt says proceed
[vault] 12 findings indexed locally
[analyst] review required before conclusions
```

## Future Architecture Focus

```text
collectors/
|-- web/
|   |-- client.py
|   |-- robots.py
|   |-- extractor.py
|   |-- policy.py
|   `-- collector.py
|-- analysis/
|   `-- matchers.py
`-- tor/
    |-- client.py
    |-- validator.py
    |-- allowlist.py
    |-- blocklist.py
    |-- policy.py
    `-- collector.py
```

The web and Tor collectors should share concepts but not share risky runtime
state. Tor must remain separately configurable and disabled by default.
