<h1 align="center">OSINT AI AGENT</h1>

<p align="center">
  <code>CYBERJESS // TERMINAL OPS // CONTROLLED OSINT WORKFLOW</code>
</p>

<p align="center">
  <code>KALI READY // SOCIAL + IDENTITY + INFRA + CANADA LOCALIZATION</code>
</p>

---

## BOOT SEQUENCE

```diff
+ status: online
+ mode: controlled pipeline
+ analyst review: required
+ reporting: bilingual
+ target classes: social / identity / company / infrastructure
```

`OSINT AI Agent` is a Kali Linux-oriented investigation project built inside the `CyberJess-Lab` universe.

The goal is not to create a fully autonomous black box.  
The goal is to create a step-driven OSINT workflow that stays:

- auditable
- explainable
- modular
- automation-friendly
- analyst-controlled

This project is inspired in part by the OWASP SocialOSINTAgent approach:

- [OWASP SocialOSINTAgent](https://owasp.org/www-project-social-osint-agent/)

---

## MISSION PROFILE

This agent is designed to support investigations involving:

- `username`
- `person_name`
- `email`
- `phone`
- `company`
- `organization`
- `domain`
- `subdomain`
- `ip`

It is meant to correlate open-source signals across:

- social platforms
- aliases and identity fragments
- public phone-related OSINT
- business and registry sources
- technical exposure and attack surface
- regional and Canada-specific pivots

---

## OPERATOR MODEL

```text
target input
   -> collector selection
   -> passive-first collection
   -> pivot expansion
   -> normalization
   -> analyst checkpoint
   -> markdown report
```

The agent currently favors a controlled chain rather than unrestricted autonomy.

Why this matters:

- easier to verify findings
- easier to explain methodology
- easier to publish responsibly
- easier to expand collector coverage over time

---

## ACTIVE LOADOUT

### Implemented collectors

- `socialscan`
- `maigret`
- `phoneinfoga`
- `h8mail`
- `amass`
- `bbot`
- `theHarvester`
- `spiderfoot`

### Supported research layers

- social reconnaissance
- username pivoting
- identity enrichment
- phone and email pivots
- company and registry pivots
- domain and external-surface recon
- curated hub references for wider OSINT strategy

### External curation sources considered by the agent

- [awesome-osint](https://github.com/jivoi/awesome-osint)
- [OSINT Framework](https://osintframework.com/)
- [OSINT Resources in Canada](https://start.me/p/aLe0vp/osint-resources-in-canada)
- [OSINT4ALL](https://start.me/p/L1rEYQ/osint4all)

Important:

- these hubs currently act as strategy layers and pivot references
- they do not yet auto-run every tool listed on those pages
- they influence profile behavior and investigation expansion

---

## INVESTIGATION PROFILES

```diff
+ default: balanced workflow
+ max_coverage: broad recon with expanded pivots
+ canada_localization: regional research and Canada-focused sources
```

### `default`

Standard controlled workflow for normal investigations.

### `max_coverage`

This profile:

- force-enables relevant collector families
- injects curated hub references
- adds broader pivot URLs for infrastructure, search, archive, and identity expansion

### `canada_localization`

This profile:

- prioritizes Canada-related research pivots
- expands registry and geolocation search paths
- adds public-search references useful for Canadian investigations

---

## QUICK LAUNCH

```bash
cd AI-Agent/OSINT-AI-Agent

python run.py example.com
python run.py cyberjess --target-type username
python run.py "+14155552671" --target-type phone

python run.py example.com --target-type domain --profile max_coverage
python run.py "Jane Doe" --target-type person_name --profile canada_localization
```

Generated reports follow the profile-based naming pattern:

```text
reports/
|-- example.com_max_coverage.md
|-- Jane_Doe_canada_localization.md
`-- Jane_Doe_default.md
```

---

## KALI MODE

```diff
+ recommended distro: Kali Linux
+ passive-first workflow: enabled
+ fallback behavior when tools are missing: safe
```

Recommended install baseline:

```bash
sudo apt update
sudo apt install -y pipx jq curl git python3-venv amass theharvester
pipx ensurepath

pipx install socialscan
pipx install maigret
pipx install h8mail
pipx install ghunt
pipx install bbot
```

SpiderFoot and PhoneInfoga remain supported as optional additions.

Setup references:

- [docs/en/KALI_SETUP.md](F:\Code\Github\CyberJess-Lab\AI-Agent\OSINT-AI-Agent\docs\en\KALI_SETUP.md)
- [docs/fr/KALI_SETUP.md](F:\Code\Github\CyberJess-Lab\AI-Agent\OSINT-AI-Agent\docs\fr\KALI_SETUP.md)

---

## FILESYSTEM MAP

```text
AI-Agent/
`-- OSINT-AI-Agent/
    |-- README.md
    |-- config/
    |   |-- osint_sources_registry.yaml
    |   `-- profiles/
    |-- docs/
    |   |-- en/
    |   `-- fr/
    |-- reports/
    |-- scripts/
    |-- src/
    `-- templates/
```

Key references:

- [docs/en/PROJECT_OVERVIEW.md](F:\Code\Github\CyberJess-Lab\AI-Agent\OSINT-AI-Agent\docs\en\PROJECT_OVERVIEW.md)
- [docs/fr/PROJECT_OVERVIEW.md](F:\Code\Github\CyberJess-Lab\AI-Agent\OSINT-AI-Agent\docs\fr\PROJECT_OVERVIEW.md)
- [docs/en/ARCHITECTURE.md](F:\Code\Github\CyberJess-Lab\AI-Agent\OSINT-AI-Agent\docs\en\ARCHITECTURE.md)
- [docs/fr/ARCHITECTURE.md](F:\Code\Github\CyberJess-Lab\AI-Agent\OSINT-AI-Agent\docs\fr\ARCHITECTURE.md)
- [docs/en/MAX_COVERAGE_STRATEGY.md](F:\Code\Github\CyberJess-Lab\AI-Agent\OSINT-AI-Agent\docs\en\MAX_COVERAGE_STRATEGY.md)
- [docs/fr/MAX_COVERAGE_STRATEGY.md](F:\Code\Github\CyberJess-Lab\AI-Agent\OSINT-AI-Agent\docs\fr\MAX_COVERAGE_STRATEGY.md)
- [docs/en/CANADA_LOCALIZATION.md](F:\Code\Github\CyberJess-Lab\AI-Agent\OSINT-AI-Agent\docs\en\CANADA_LOCALIZATION.md)
- [docs/fr/CANADA_LOCALIZATION.md](F:\Code\Github\CyberJess-Lab\AI-Agent\OSINT-AI-Agent\docs\fr\CANADA_LOCALIZATION.md)

---

## RULES OF ENGAGEMENT

This project is intended for:

- authorized investigations
- public-information research
- ethical OSINT workflows
- legitimate targets only

```diff
- no unauthorized targeting
- no illegal collection
- no blind trust in automated correlation
+ analyst validation remains mandatory
```
