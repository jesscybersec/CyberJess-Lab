# Architecture

## Vue d'ensemble

Le pipeline suit une sequence controlee avec points de verification explicites:

```text
Target Input
  -> Scope Validation
  -> Source Family Selection
  -> Collection
  -> Normalization
  -> Correlation
  -> Analyst Review
  -> Report Generation
```

## Detail des etapes

### 1. Target Input

Familles de cibles supportees:

- domain
- subdomain
- ip
- organization
- company
- email
- username
- person_name
- phone

### 2. Scope Validation

Avant la collecte, le pipeline verifie:

- le mode passif uniquement ou non
- les familles de sources autorisees
- les tags de dossier
- le dossier de sortie

### 3. Source Family Selection

Les collecteurs sont selectionnes selon le type de cible.

Exemples:

- domain -> Amass, BBOT, theHarvester, SpiderFoot
- username -> social, identity
- person_name -> social, identity, company_registry
- company -> company_registry, domain, social
- phone -> identity

### 4. Collection

Chaque collecteur est encapsule dans un module dedie et stocke ses artefacts bruts dans `data/raw/`.

### 5. Normalization

Toutes les sorties sont converties vers un schema partage:

- type d'observable
- valeur
- source
- horodatage
- confiance
- tags

### 6. Correlation

Le systeme dedoublonne et relie les resultats entre:

- usernames
- noms
- emails
- telephones
- entreprises
- domaines
- IPs
- profils sociaux

### 7. Analyst Review

Cette etape constitue une pause volontaire avant la publication finale.

### 8. Report Generation

Le rapport final doit supporter la sortie en francais et en anglais avec:

- resume executif
- journal de collecte
- constats principaux
- observables
- notes de confiance
- limites

## Principes de conception

- tracabilite des sources
- separation entre collecte et interpretation
- persistance des sorties intermediaires
- faible couplage entre wrappers d'outils
- generation de rapport reproductible


