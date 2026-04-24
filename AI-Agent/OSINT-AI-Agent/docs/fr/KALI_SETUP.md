# Setup Kali

## Objectif

Cette configuration vise a maximiser la couverture OSINT tout en gardant un workflow auditable et decoupe par etapes.

## Outils recommandes

- `socialscan` pour des verifications precises de presence de usernames et emails
- `maigret` pour construire un dossier username sur un grand nombre de sites
- `phoneinfoga` pour l'OSINT sur numero de telephone et la generation de pivots
- `h8mail` pour l'enrichissement email et breach
- `ghunt` pour l'OSINT Google lorsque le besoin est legitime et le workflow authentifie
- `amass`, `bbot`, `theHarvester`, `spiderfoot` pour l'enrichissement technique et attack surface
- `awesome-osint` et `OSINT Framework` comme cartes de categories et hubs de selection
- les pages Start.me `OSINT Resources in Canada` et `OSINT4ALL` comme hubs externes de curation pour elargir la recherche

## Installation suggeree

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

Pour PhoneInfoga:

- installation binaire ou Docker: [PhoneInfoga install](https://sundowndev.github.io/phoneinfoga/getting-started/install/)

Pour SpiderFoot:

```bash
mkdir -p ~/tools
git clone https://github.com/smicallef/spiderfoot.git ~/tools/spiderfoot
cd ~/tools/spiderfoot
pip3 install -r requirements.txt
python3 ./sf.py --help
```

## Variables d'environnement attendues par l'agent

Pour que les wrappers infra fonctionnent proprement sur Kali, l'agent peut lire:

```bash
export OSINT_AGENT_AMASS_BINARY=amass
export OSINT_AGENT_BBOT_BINARY=bbot
export OSINT_AGENT_THEHARVESTER_BINARY=theHarvester
export OSINT_AGENT_SPIDERFOOT_PYTHON=python3
export OSINT_AGENT_SPIDERFOOT_SCRIPT="$HOME/tools/spiderfoot/sf.py"
```

Si tu preferes, tu peux aussi recopier ces valeurs dans ton `.env`.

## Verification rapide

```bash
amass enum -h
theHarvester -h
bbot --help
socialscan --help
maigret --help
h8mail -h
ghunt --help
python3 "$HOME/tools/spiderfoot/sf.py" --help
```

## Profils d'investigation

Le projet supporte actuellement ces profils:

- `default`: workflow equilibre
- `max_coverage`: force les familles de collecteurs pertinentes et ajoute des pivots de reference issus de `awesome-osint`, `OSINT Framework` et `OSINT4ALL`
- `canada_localization`: privilegie les pivots geolocalisation, registres, recherche publique et ressources canadiennes

Exemples:

```bash
python run.py example.com --target-type domain --profile max_coverage
python run.py "Jane Doe" --target-type person_name --profile canada_localization
```

Important:

- ces profils orientent la strategie de l'agent
- ils n'executent pas automatiquement tous les outils listes dans les hubs externes
- ils servent a elargir les pivots, forcer certains collecteurs et annoter le rapport final

## Strategie de couverture

Pour obtenir le maximum d'informations utiles, il faut separer la collecte par familles de pivots:

1. Username
2. Email
3. Telephone
4. Nom de personne
5. Entreprise / organisation
6. Domaine / infrastructure

Puis correler les resultats entre elles plutot que de dependre d'un seul outil.

## Melange open source le plus utile actuellement

En date du 23 avril 2026:

- `Maigret` reste l'un des meilleurs outils open source centres sur les dossiers username, et sa release la plus recente est `v0.6.0` du 10 avril 2026. Source: [Maigret releases](https://github.com/soxoj/maigret/releases)
- `GHunt` a pour release la plus recente `v2.2.0` du 6 juin 2025 et supporte l'export JSON pour les modules email. Sources: [GHunt README](https://github.com/mxrch/GHunt/blob/master/README.md), [GHunt releases](https://github.com/mxrch/GHunt/releases)
- `h8mail` affiche comme release GitHub la plus recente `2.5.6`, publiee le 25 juin 2025, et supporte la sortie JSON. Source: [h8mail releases](https://github.com/khast3x/h8mail/releases)
- `PhoneInfoga` est explicitement decrit comme stable mais non maintenu par son auteur, donc utile comme outil d'appoint telephone, mais pas comme source unique. Source: [PhoneInfoga README](https://github.com/sundowndev/phoneinfoga/blob/main/README.md)
- `socialscan` reste utile pour des verifications precises username/email, mais son repo public semble moins activement maintenu que Maigret. Source: [socialscan README](https://github.com/iojw/socialscan/blob/master/README.md)
- `Amass` est toujours activement maintenu, avec la release `v5.1.1` du 7 avril 2026, et la doc d'installation indique qu'il est installe par defaut sur Kali ou installable via `apt install amass`. Sources: [Amass releases](https://github.com/owasp-amass/amass/releases), [Amass installation guide](https://github.com/owasp-amass/amass/wiki/Installation-Guide)
- `theHarvester` indique dans sa doc d'installation que sur Kali recent il suffit de lancer `theHarvester -h`, et sa release GitHub visible la plus recente est `4.9.1`. Sources: [theHarvester installation wiki](https://github.com/laramies/theHarvester/wiki/Installation), [theHarvester releases](https://github.com/laramies/theHarvester/releases)
- `BBOT` est documente officiellement comme `Linux only`, installable via `pipx install bbot`, avec sorties JSON/TXT/CSV. Sources: [BBOT getting started](https://www.blacklanternsecurity.com/bbot/Stable/), [BBOT output docs](https://www.blacklanternsecurity.com/bbot/Stable/scanning/output/)
- `SpiderFoot` OSS reste utile pour des scans OSINT multi-modules avec CLI et JSON/CSV, mais la release OSS visible la plus recente reste `v4.0` du 7 avril 2022. Source: [SpiderFoot GitHub](https://github.com/smicallef/spiderfoot)

## Recommandation pratique

Si tu veux une analyse plus riche, le modele le plus efficace est:

- `socialscan` pour verifier l'existence rapidement
- `maigret` pour la correlation username large
- `h8mail` pour l'enrichissement email et breach
- `ghunt` pour les enrichissements Google quand c'est justifie
- `phoneinfoga` pour les pivots telephone
- `amass` / `bbot` / `theHarvester` pour les pivots infrastructure

Et il faut aussi traiter ces ressources comme couches de curation:

- `awesome-osint` pour detecter les categories encore non couvertes
- `OSINT Framework` pour marquer les outils selon passif/actif, installation locale, inscription, dork et URL manuelle
- `OSINT Resources in Canada` pour les cas axes geolocalisation et registres canadiens
- `OSINT4ALL` pour elargir les idees de pivots sur plusieurs domaines OSINT

## Prochaine etape d'ingenierie

La prochaine vraie montee en gamme pour ce depot est de stocker les sorties brutes par collecteur, de les normaliser dans un schema commun, puis de generer un rapport qui regroupe les resultats par:

- identifiants confirmes
- identifiants candidats
- artefacts de breach
- profils sociaux
- liens registre/entreprise
- artefacts d'infrastructure
