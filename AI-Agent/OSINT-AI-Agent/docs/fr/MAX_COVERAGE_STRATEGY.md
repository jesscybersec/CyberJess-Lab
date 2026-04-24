# Strategie couverture maximale

## Objectif

Utiliser un maximum d'outils OSINT pertinents sans transformer le workflow en empilement ingouvernable de scripts fragiles.

## Principe

Il ne faut pas traiter "plus d'outils" comme une seule liste plate.

Il faut plutot structurer le projet autour de:

1. Type de cible
2. Famille de pivots
3. Niveau OPSEC
4. Normalisation des sorties
5. Revue analyste

## Hubs de sources utilises pour ce projet

Le depot doit utiliser les hubs suivants comme entrees de curation:

- `awesome-osint`: couverture tres large en categories et gros index d'outils/ressources
- `OSINT Framework`: framework oriente ressources gratuites avec navigation par categories et marqueurs utiles
- la page Start.me `OSINT Resources in Canada`: hub oriente localisation Canada
- la page Start.me `OSINT4ALL`: hub OSINT large multi-themes

## Pourquoi ces sources comptent

En date du 23 avril 2026:

- `awesome-osint` couvre de nombreuses categories utiles: username, people investigations, email search, phone research, company research, domain/IP research, geospatial, image/video, etc. Source: [awesome-osint](https://github.com/jivoi/awesome-osint)
- `OSINT Framework` met l'accent sur les ressources gratuites ou partiellement gratuites et utilise des marqueurs pratiques comme installation locale, Google dork, inscription requise, ou URL a modifier manuellement. Sources: [OSINT Framework site](https://osintframework.com/), [GitHub README](https://github.com/lockfale/osint-framework/blob/master/README.md)
- Les pages Start.me que tu as donnees doivent etre traitees comme des hubs de curation regionaux/thematiques dans le projet, meme si leur contenu complet n'etait pas lisible automatiquement dans cet environnement. Sources: [OSINT Resources in Canada](https://start.me/p/aLe0vp/osint-resources-in-canada), [OSINT4ALL](https://start.me/p/L1rEYQ/osint4all)

## Blocs de couverture

### Identite

- username
- alias
- email
- telephone
- nom de personne

### Social

- reseaux sociaux grand public
- communautes de niche
- plateformes developpeurs
- forums et discussions publiques

### Entreprise

- entreprises
- registres d'entreprise
- filings publics
- mentions fournisseurs/partenaires

### Infrastructure

- domaines
- sous-domaines
- IPs
- URLs
- depots et code expose

### Media et geospatial

- images
- video
- cartes
- indices de geolocalisation
- registres publics lies a un lieu

## Approche d'ingenierie

Le projet doit maintenir trois couches:

1. `collector tools`
2. `resource hubs`
3. `profiles`

Les collector tools sont les binaires ou APIs qu'on appelle directement.

Les resource hubs sont des pages de curation qu'on utilise pour choisir les prochains pivots.

Les profiles definissent quelles categories activer pour un type d'enquete donne.

## Prochaines etapes recommandees

1. Etendre le registre `config/osint_sources_registry.yaml`
2. Ajouter une selection des collecteurs pilotee par profils
3. Normaliser les sorties dans des groupes confirmes, candidats et references
4. Ajouter des sections de rapport bilingues par famille de pivots
5. Ajouter un profil Canada dedie aux cas axes localisation

