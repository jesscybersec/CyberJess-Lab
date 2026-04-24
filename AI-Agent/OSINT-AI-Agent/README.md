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

### Francais

`OSINT AI Agent` est un projet d'investigation oriente Kali Linux, integre dans l'univers `CyberJess-Lab`.

L'objectif n'est pas de creer une boite noire completement autonome.  
L'objectif est de construire une chaine OSINT pilotee par etapes, qui reste:

- auditable
- explicable
- modulaire
- favorable a l'automatisation
- sous controle analyste

This project is inspired in part by the OWASP SocialOSINTAgent approach:

- [OWASP SocialOSINTAgent](https://owasp.org/www-project-social-osint-agent/)

---

## AGENT DESCRIPTION

### English

`OSINT AI Agent` is a bilingual, Kali-friendly OSINT project designed to orchestrate multiple open-source tools through a controlled investigation pipeline.

It helps collect, expand, correlate, and document findings related to:

- social media
- usernames and aliases
- person names
- phone numbers
- company and registry data
- domains and infrastructure exposure

The AI layer is used to structure the workflow, widen pivots, and help summarize results.  
It is not meant to replace analyst judgment.

### Francais

`OSINT AI Agent` est un projet OSINT bilingue, adapte a Kali Linux, concu pour orchestrer plusieurs outils open source dans une chaine d'investigation controlee.

Il aide a collecter, enrichir, correler et documenter des resultats lies a:

- reseaux sociaux
- usernames et alias
- noms de personnes
- numeros de telephone
- donnees d'entreprise et registres publics
- domaines et exposition d'infrastructure

La couche IA sert a structurer le workflow, elargir les pivots et aider a la synthese.  
Elle ne remplace pas la validation de l'analyste.

---

## MISSION PROFILE

### English

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

### Francais

Cet agent est concu pour soutenir des investigations portant sur:

- `username`
- `person_name`
- `email`
- `phone`
- `company`
- `organization`
- `domain`
- `subdomain`
- `ip`

Il vise a correler des signaux open source provenant de:

- plateformes sociales
- alias et fragments d'identite
- OSINT public lie au telephone
- sources d'entreprise et registres
- exposition technique et surface d'attaque
- pivots regionaux et axes Canada

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

### English

The agent currently favors a controlled chain rather than unrestricted autonomy.

Why this matters:

- easier to verify findings
- easier to explain methodology
- easier to publish responsibly
- easier to expand collector coverage over time

### Francais

L'agent privilegie actuellement une chaine controlee plutot qu'une autonomie sans garde-fous.

Pourquoi c'est important:

- plus simple a verifier
- plus simple a expliquer sur le plan methodologique
- plus simple a publier de maniere responsable
- plus simple a faire evoluer au fil du temps

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

### Couches de recherche supportees

- reconnaissance sur les reseaux sociaux
- pivoting sur usernames
- enrichissement identite
- pivots telephone et email
- pivots entreprise et registres
- recon domaine et surface externe
- hubs de reference pour elargir la strategie OSINT

### External curation sources considered by the agent

- [awesome-osint](https://github.com/jivoi/awesome-osint)
- [OSINT Framework](https://osintframework.com/)
- [OSINT Resources in Canada](https://start.me/p/aLe0vp/osint-resources-in-canada)
- [OSINT4ALL](https://start.me/p/L1rEYQ/osint4all)

Important:

- these hubs currently act as strategy layers and pivot references
- they do not yet auto-run every tool listed on those pages
- they influence profile behavior and investigation expansion

Important en francais:

- ces hubs servent actuellement de couche strategique et de reference de pivots
- ils ne lancent pas encore automatiquement tous les outils listes sur ces pages
- ils influencent le comportement des profils et l'elargissement de l'enquete

---

## INVESTIGATION PROFILES

```diff
+ default: balanced workflow
+ max_coverage: broad recon with expanded pivots
+ canada_localization: regional research and Canada-focused sources
```

### `default`

Standard controlled workflow for normal investigations.

Workflow controle standard pour les investigations normales.

### `max_coverage`

This profile:

- force-enables relevant collector families
- injects curated hub references
- adds broader pivot URLs for infrastructure, search, archive, and identity expansion

Ce profil:

- active de force les familles de collecteurs pertinentes
- injecte des hubs de reference curation
- ajoute des URLs de pivot plus larges pour l'infrastructure, la recherche, l'archive et l'expansion identite

### `canada_localization`

This profile:

- prioritizes Canada-related research pivots
- expands registry and geolocation search paths
- adds public-search references useful for Canadian investigations

Ce profil:

- priorise les pivots lies au Canada
- elargit les chemins de recherche sur registres et geolocalisation
- ajoute des references de recherche publique utiles pour des investigations canadiennes

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

SpiderFoot et PhoneInfoga restent supportes comme ajouts optionnels.

Setup references:

- [English Kali Setup](./docs/en/KALI_SETUP.md)
- [Guide Kali en francais](./docs/fr/KALI_SETUP.md)

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

- [English Project Overview](./docs/en/PROJECT_OVERVIEW.md)
- [Apercu du projet en francais](./docs/fr/PROJECT_OVERVIEW.md)
- [English Architecture](./docs/en/ARCHITECTURE.md)
- [Architecture en francais](./docs/fr/ARCHITECTURE.md)
- [English Max Coverage Strategy](./docs/en/MAX_COVERAGE_STRATEGY.md)
- [Strategie Max Coverage en francais](./docs/fr/MAX_COVERAGE_STRATEGY.md)
- [English Canada Localization](./docs/en/CANADA_LOCALIZATION.md)
- [Localisation Canada en francais](./docs/fr/CANADA_LOCALIZATION.md)

---

## RULES OF ENGAGEMENT

### English

This project is intended for:

- authorized investigations
- public-information research
- ethical OSINT workflows
- legitimate targets only

### Francais

Ce projet est destine a:

- des investigations autorisees
- de la recherche sur information publique
- des workflows OSINT ethiques
- des cibles legitimes uniquement

```diff
- no unauthorized targeting
- no illegal collection
- no blind trust in automated correlation
+ analyst validation remains mandatory
```
