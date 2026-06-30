# Contributing

Thanks for helping improve Neon Scraper.

## Project Rules

- Keep collection passive.
- Do not add authentication to third-party services.
- Do not add CAPTCHA, paywall, anti-bot, or access-control bypass.
- Do not add stolen dump downloading.
- Prefer local-first storage and privacy-preserving output.
- Add tests for collector policy, parsing, storage, and reporting changes.

## Development

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dns,dev]"
python -B -m unittest discover -s tests
```

## Collector Expectations

Collectors should:

- use explicit source policies;
- apply timeouts and rate limits;
- preserve source, timestamp, confidence, and risk;
- log policy decisions where relevant;
- avoid storing full pages unless a future setting explicitly allows it.

