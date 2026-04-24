# Vue d'ensemble du projet

## Vision

Construire un agent IA OSINT pense pour Kali Linux, capable d'orchestrer plusieurs outils open source dans un workflow controle, relisible et documente, puis de produire des rapports bilingues propres.

## Inspiration

Le projet s'inspire en partie du modele OWASP SocialOSINTAgent, notamment pour:

- l'agregation structuree de donnees
- l'analyse orientee reseaux sociaux
- la synthese assistee par IA
- la portabilite via Docker
- une collecte documentee et ethique

## Problemes vises

- Les resultats OSINT sont disperses entre plusieurs outils et formats
- Les pivots sociaux et identitaires sont souvent manuels
- L'OSINT technique et l'OSINT humain sont rarement unifies
- La production de rapport est souvent longue et heterogene

## Reponse du projet

L'agent suit une chaine par etapes:

1. Ingestion de la cible
2. Garde-fous de portee et de legalite
3. Selection des familles de sources
4. Collecte
5. Normalisation
6. Correlation
7. Revue analyste
8. Generation de rapports bilingues

## Portee

La portee ciblee inclut:

- domaines et sous-domaines
- IPs et exposition externe
- usernames et alias
- noms de personnes
- OSINT public autour des numeros de telephone
- noms d'entreprises et registres publics
- plateformes sociales et communautaires

## Public vise

- etudiants en cybersecurite
- analystes SOC
- threat hunters
- pentesters autorises
- praticiens OSINT

## Positionnement

Le projet se place entre:

- un framework de collecte OSINT
- un pipeline d'analyse assistee par IA
- un moteur de reporting bilingue

La couche IA doit aider a prioriser, synthetiser, correler et rediger. Elle ne doit pas remplacer le jugement humain ni les limites legales.


