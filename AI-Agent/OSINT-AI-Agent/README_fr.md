<h1 align="center">OSINT AI AGENT</h1>

<p align="center">
  <code>CYBERJESS // TERMINAL OPS // WORKFLOW OSINT CONTROLE</code>
</p>

<p align="center">
  <code>KALI READY // SOCIAL + IDENTITE + INFRA + LOCALISATION CANADA</code>
</p>

---

## Langues

- GB English: [README.md](./README.md)
- FR Francais: [README_fr.md](./README_fr.md)

---

## DEMARRAGE

```diff
+ statut: online
+ mode: pipeline controle
+ revue analyste: requise
+ rapports: bilingues
+ classes de cibles: social / identite / entreprise / infrastructure
```

`OSINT AI Agent` est un projet d'investigation oriente Kali Linux, integre dans l'univers `CyberJess-Lab`.

L'objectif n'est pas de creer une boite noire completement autonome.  
L'objectif est de construire une chaine OSINT pilotee par etapes, qui reste:

- auditable
- explicable
- modulaire
- favorable a l'automatisation
- sous controle analyste

Ce projet s'inspire en partie de l'approche OWASP SocialOSINTAgent:

- [OWASP SocialOSINTAgent](https://owasp.org/www-project-social-osint-agent/)

---

## DESCRIPTION DE L'AGENT

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

## PROFIL DE MISSION

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

## MODELE OPERATEUR

```text
entree cible
   -> selection des collecteurs
   -> collecte passive en priorite
   -> expansion des pivots
   -> normalisation
   -> checkpoint analyste
   -> rapport markdown
```

L'agent privilegie actuellement une chaine controlee plutot qu'une autonomie sans garde-fous.

Pourquoi c'est important:

- plus simple a verifier
- plus simple a expliquer sur le plan methodologique
- plus simple a publier de maniere responsable
- plus simple a faire evoluer au fil du temps

---

## CHARGE ACTIVE

### Collecteurs implementes

- `socialscan`
- `maigret`
- `phoneinfoga`
- `h8mail`
- `amass`
- `bbot`
- `theHarvester`
- `spiderfoot`

### Couches de recherche supportees

- reconnaissance sur les reseaux sociaux
- pivoting sur usernames
- enrichissement identite
- pivots telephone et email
- pivots entreprise et registres
- recon domaine et surface externe
- hubs de reference pour elargir la strategie OSINT

### Sources externes de curation considerees par l'agent

- [awesome-osint](https://github.com/jivoi/awesome-osint)
- [OSINT Framework](https://osintframework.com/)
- [OSINT Resources in Canada](https://start.me/p/aLe0vp/osint-resources-in-canada)
- [OSINT4ALL](https://start.me/p/L1rEYQ/osint4all)

Important:

- ces hubs servent actuellement de couche strategique et de reference de pivots
- ils ne lancent pas encore automatiquement tous les outils listes sur ces pages
- ils influencent le comportement des profils et l'elargissement de l'enquete

---

## PROFILS D'INVESTIGATION

```diff
+ default: workflow equilibre
+ max_coverage: recon large avec pivots elargis
+ canada_localization: recherche regionale et sources orientees Canada
```

### `default`

Workflow controle standard pour les investigations normales.

### `max_coverage`

Ce profil:

- active de force les familles de collecteurs pertinentes
- injecte des hubs de reference curation
- ajoute des URLs de pivot plus larges pour l'infrastructure, la recherche, l'archive et l'expansion identite

### `canada_localization`

Ce profil:

- priorise les pivots lies au Canada
- elargit les chemins de recherche sur registres et geolocalisation
- ajoute des references de recherche publique utiles pour des investigations canadiennes

---

## LANCEMENT RAPIDE

```bash
cd AI-Agent/OSINT-AI-Agent

python run.py example.com
python run.py cyberjess --target-type username
python run.py "+14155552671" --target-type phone

python run.py example.com --target-type domain --profile max_coverage
python run.py "Jane Doe" --target-type person_name --profile canada_localization
```

Les rapports generes suivent une convention de nommage basee sur le profil:

```text
reports/
|-- example.com_max_coverage.md
|-- Jane_Doe_canada_localization.md
`-- Jane_Doe_default.md
```

---

## MODE KALI

```diff
+ distribution recommandee: Kali Linux
+ workflow passif prioritaire: active
+ comportement de repli si outils absents: safe
```

Base d'installation recommandee:

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

SpiderFoot et PhoneInfoga restent supportes comme ajouts optionnels.

References de configuration:

- [Guide Kali en anglais](./docs/en/KALI_SETUP.md)
- [Guide Kali en francais](./docs/fr/KALI_SETUP.md)

---

## CARTE DU FICHIERSYSTEME

```text
AI-Agent/
`-- OSINT-AI-Agent/
    |-- README.md
    |-- README_fr.md
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

References cles:

- [Apercu du projet en anglais](./docs/en/PROJECT_OVERVIEW.md)
- [Apercu du projet en francais](./docs/fr/PROJECT_OVERVIEW.md)
- [Architecture en anglais](./docs/en/ARCHITECTURE.md)
- [Architecture en francais](./docs/fr/ARCHITECTURE.md)
- [Strategie Max Coverage en anglais](./docs/en/MAX_COVERAGE_STRATEGY.md)
- [Strategie Max Coverage en francais](./docs/fr/MAX_COVERAGE_STRATEGY.md)
- [Localisation Canada en anglais](./docs/en/CANADA_LOCALIZATION.md)
- [Localisation Canada en francais](./docs/fr/CANADA_LOCALIZATION.md)

---

## REGLES D'ENGAGEMENT

Ce projet est destine a:

- des investigations autorisees
- de la recherche sur information publique
- des workflows OSINT ethiques
- des cibles legitimes uniquement

```diff
- pas de ciblage non autorise
- pas de collecte illegale
- pas de confiance aveugle dans la correlation automatisee
+ validation analyste obligatoire
```
