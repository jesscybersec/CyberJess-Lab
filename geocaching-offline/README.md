# 📡 GeoCache // Offline

Une application de géocaching qui fonctionne **sans aucune onde cellulaire** :
pas de 4G/5G, pas de data, pas de Wi-Fi requis une fois installée.

## Comment ça marche sans réseau ?

- **Position** : le GPS du téléphone reçoit les signaux de satellites, indépendamment
  du réseau cellulaire. Il fonctionne en zone blanche, et même en mode avion sur la
  plupart des appareils si le GPS reste activé séparément.
- **Pas de carte en ligne** : au lieu de charger des tuiles de carte (qui demandent
  une connexion internet), l'app affiche un **radar/boussole** calculé localement :
  distance et cap vers la cache sélectionnée.
- **Stockage local uniquement** : les caches (nom, description, indice, coordonnées)
  sont sauvegardées dans le `localStorage` du navigateur, sur l'appareil. Rien n'est
  envoyé à un serveur.
- **Service worker** : une fois la page ouverte une première fois (avec ou sans
  réseau), tous les fichiers de l'app sont mis en cache. Elle continue de fonctionner
  ensuite même sans connexion du tout.

## Un design qui s'adapte à l'aventure

L'app a une identité visuelle "explorateur/boussole" par défaut (fond sombre,
accents laiton, boussole façon instrument de précision), mais **chaque
scénario a sa propre ambiance** : couleurs et texture de fond changent selon
l'aventure. Dès l'onglet **Scénarios**, chaque carte affiche déjà sa propre
couleur et son propre motif (paillettes pour le jardin enchanté, vagues pour
les pirates, feuillage pour la forêt, papier vieilli pour la balade
vintage, lignes caviardées pour l'espionnage, circuits imprimés pour le
Protocole Fantôme). Dès qu'une cache de ce scénario est ciblée sur le
**Radar**, la couleur d'accent, le fond animé et la flèche du radar adoptent
cette ambiance pour toute l'app.

Un trajet créé en mode **Maître du jeu** peut lui aussi choisir une ambiance
visuelle parmi ces mêmes thèmes (champ "Ambiance visuelle" à la création).

Petit bonus : marquer une cache comme trouvée déclenche une courte
animation de célébration à l'écran.

## Scénarios préenregistrés (multi-appareils, sans réseau)

L'onglet **🎬 Scénarios** propose 6 parcours prêts à l'emploi, filtrables par
public et par difficulté :

| Scénario | Public | Difficulté | Étapes |
|---|---|---|---|
| Le Trésor du Jardin Enchanté | Enfants (5-8 ans) | Facile | 4 |
| Mission Pirates au Parc | Enfants (8-11 ans) | Moyen | 5 |
| L'Énigme de la Forêt Mystérieuse | Enfants/ados (11-14 ans) | Difficile | 5 |
| Balade Rétro du Vieux Quartier | Adultes | Facile | 4 |
| Chasse à l'Espion | Adultes | Moyen | 5 |
| Protocole Fantôme — Signal Zéro | Adultes | Difficile | 6 |

**Comment ça fonctionne sans aucun échange réseau entre les appareils :**
chaque scénario est défini par une suite de **cap + distance** relatifs
(ex. "70 m au cap 130°"), et non par des coordonnées GPS fixes. Au moment de
lancer un scénario, l'appareil demande un **point de départ** (ta position
GPS actuelle, ou une latitude/longitude saisie à la main). À partir de ce
point, l'app calcule mathématiquement (formule géodésique) les coordonnées
réelles de chaque étape.

Concrètement : si plusieurs personnes se retrouvent au même endroit physique
et lancent chacune le même scénario avec ce même point de départ sur leur
appareil, elles obtiennent **exactement les mêmes caches**, sans qu'aucune
donnée n'ait besoin de circuler entre les téléphones — ni réseau cellulaire,
ni Wi-Fi, ni Bluetooth.

Un scénario lancé peut être réinitialisé (bouton **↺ Réinitialiser**) pour
le relancer depuis un autre point de départ, et de nouveaux scénarios
peuvent être ajoutés simplement en complétant le tableau `SCENARIOS` dans
`js/scenarios.js`.

## Mode Maître du jeu (créer son propre trajet)

L'onglet **🎓 Maître du jeu** permet à une personne organisatrice de créer un
trajet sur mesure en le parcourant réellement, plutôt que d'utiliser un
scénario préenregistré :

1. Remplis le formulaire "Nouveau trajet" (nom, introduction, public,
   difficulté, lieu) et appuie sur **"▶️ Démarrer l'enregistrement"**.
2. Déplace-toi jusqu'au premier checkpoint réel, remplis son nom, sa
   description, son indice et — en option — l'**objet virtuel à scanner**
   (voir plus bas), puis appuie sur **"📍 Ajouter ce checkpoint ici"** : sa
   position GPS exacte est enregistrée.
3. Répète pour chaque checkpoint du trajet.
4. Appuie sur **"✅ Terminer le trajet"** : il apparaît dans **📓 Mes trajets**,
   au même endroit que les scénarios préenregistrés (mêmes actions : Lancer,
   Voir sur le radar, Réinitialiser).

**Contrairement aux scénarios préenregistrés** (définis par cap + distance
depuis un point de départ choisi au moment de jouer), un trajet créé en mode
maître du jeu enregistre des **coordonnées GPS absolues**, puisqu'il
correspond à un parcours réellement marché. Résultat : pas besoin de point
de départ commun pour le rejouer ailleurs. Pour le partager avec les
joueurs :

- Appuie sur **"⬇️ Exporter"** sur la carte du trajet : ça télécharge un
  fichier `.json`.
- Transfère ce fichier aux appareils des joueurs par câble, Bluetooth,
  AirDrop, carte SD ou clé USB (aucun réseau requis).
- Sur chaque appareil joueur, dans l'onglet Maître du jeu, utilise
  **"⬆️ Importer un trajet"** puis appuie sur **"🚀 Lancer"** : le parcours
  est rejoué à l'identique, coordonnée par coordonnée.

## Scan caméra (indice sous forme d'objet virtuel)

Quand un checkpoint (scénario, trajet personnalisé ou cache manuelle) a un
**objet virtuel** assigné, l'onglet **📡 Radar** affiche un bouton
**"📷 Scanner la zone"** une fois que tu es à moins de 30 mètres. En
l'appuyant :

- La caméra arrière s'ouvre en plein écran.
- Un objet qui "ne devrait pas être dans la réalité" (une orbe, un fantôme,
  une soucoupe, une clé dorée...) flotte en surimpression du flux caméra,
  avec un léger effet de profondeur qui réagit aux mouvements du téléphone.
- Une fois repéré, appuie sur **"✅ J'ai trouvé l'objet !"** pour marquer le
  checkpoint comme trouvé.

**Important à savoir sur cette réalité augmentée légère** : l'objet flotte
par-dessus l'image de la caméra avec une parallaxe basée sur l'orientation
du téléphone — il ne reste pas "ancré" à un endroit précis du décor si tu
tournes complètement autour (ce qui demanderait un suivi spatial de type
SLAM/WebXR, peu fiable hors-ligne et beaucoup plus lourd à développer). Le
tout fonctionne 100% sur l'appareil, sans réseau ni bibliothèque externe.
Si la caméra n'est pas disponible (permission refusée, appareil sans
caméra), un message s'affiche et le bouton "J'ai trouvé l'objet !" reste
utilisable pour ne pas bloquer la partie.

Pour choisir un objet virtuel sur une cache : le champ **"Objet virtuel à
scanner"** est disponible aussi bien dans le formulaire **➕ Ajouter** que
dans le formulaire de checkpoint du mode Maître du jeu.

## Installation sur un téléphone

**Point important** : comme toute application web, elle doit être ouverte
**une première fois avec une connexion** (Wi-Fi ou données mobiles) pour être
téléchargée et installée. Ensuite seulement, elle fonctionne sans aucun
réseau. Il n'y a pas de compte à créer, pas d'app store : tout se passe dans
le navigateur.

Trois façons d'obtenir un lien à ouvrir sur le téléphone :

- **Hébergée en ligne** (le plus simple à partager à un groupe) : si le
  dépôt est publié via GitHub Pages, ouvre simplement l'URL fournie
  (ex. `https://<utilisateur>.github.io/CyberJess-Lab/geocaching-offline/`).
- **Serveur local sur ton ordinateur** : lance le serveur local (voir
  [Développement local](#développement-local)), puis sur le téléphone
  (connecté au **même Wi-Fi** que l'ordinateur), ouvre
  `http://<adresse-IP-locale-de-l-ordinateur>:8080` — trouve cette adresse
  IP avec `ipconfig` (Windows) ou `ifconfig`/`ip a` (Mac/Linux).
- **Fichiers copiés directement sur le téléphone** : possible avec certaines
  apps (ex. un navigateur qui sait ouvrir des fichiers locaux), mais la
  géolocalisation et le mode hors-ligne ne fonctionnent de façon fiable que
  servis en `http://` ou `https://` — à éviter si possible.

### Sur Android (Chrome)

1. Ouvre le lien de l'app dans **Chrome**.
2. Appuie sur le menu **⋮** (trois points, en haut à droite).
3. Choisis **"Installer l'application"** ou **"Ajouter à l'écran d'accueil"**.
4. Confirme. Une icône GeoCache apparaît sur l'écran d'accueil du téléphone.
5. Ouvre l'app depuis cette icône (pas depuis Chrome) : elle s'affiche en
   plein écran, comme une vraie application.
6. À la première ouverture, autorise l'accès à la **position** quand le
   téléphone le demande — c'est indispensable pour le radar.

### Sur iPhone / iPad (Safari)

1. Ouvre le lien **dans Safari** (l'ajout à l'écran d'accueil ne fonctionne
   qu'avec Safari, pas avec Chrome ou un autre navigateur sur iOS).
2. Appuie sur le bouton **Partager** (le carré avec une flèche vers le haut).
3. Choisis **"Sur l'écran d'accueil"**.
4. Confirme le nom, puis appuie sur **"Ajouter"** en haut à droite.
5. Ouvre l'app depuis l'icône ajoutée à l'écran d'accueil.
6. Autorise l'accès à la position quand demandé.
7. Dans l'onglet **📡 Radar**, un bouton **"Activer la boussole"** peut
   apparaître : appuie dessus et autorise l'accès aux capteurs de
   mouvement — c'est une permission spécifique à iOS, sans quoi la flèche
   ne s'oriente pas.

### Préparer l'app avant de partir hors-couverture

Avant de quitter le réseau (Wi-Fi ou données), fais ceci **une seule fois**,
connecté :

1. Ouvre l'app installée et navigue dans chaque onglet une fois
   (Radar, Scénarios, Caches, Ajouter, Données) pour que le service worker
   mette bien tous les fichiers en cache.
2. Vérifie que le voyant en haut de l'écran passe au vert avec
   **"Position acquise"** — ça confirme que le GPS fonctionne.
3. Si tu comptes utiliser le scan caméra, ouvre une fois l'onglet Radar et
   lance un scan pour autoriser l'accès à la caméra — sinon le navigateur
   redemandera la permission au premier scan sur le terrain, ce qui
   fonctionne aussi hors-ligne mais autant l'avoir déjà accordée.
4. Si tu utilises un scénario préenregistré ou des caches personnalisées,
   prépare-les maintenant (voir ci-dessus) : ensuite, tu peux passer en
   mode avion (GPS activé) ou partir en zone blanche sans problème.

## Utilisation pas à pas

### Lancer un scénario préenregistré (jeu à un ou plusieurs joueurs)

1. Ouvre l'onglet **🎬 Scénarios**.
2. Filtre par public (Enfants / Adultes) et par difficulté si besoin.
3. Choisis un scénario, lis son introduction, puis appuie sur
   **"🚀 Lancer ici"**.
4. Place-toi (et place les autres joueurs, s'il y en a) au **point de départ
   physique** choisi pour le jeu — un endroit facile à retrouver (une
   entrée de parc, un arbre précis, etc.).
5. Appuie sur **"📍 Utiliser ma position GPS actuelle"**, puis sur
   **"Confirmer le départ"**.
6. L'app bascule automatiquement sur l'onglet **Radar** et affiche la
   première étape : suis la flèche verte et la distance indiquée.
7. Une fois arrivé sur une étape, va dans **Caches**, lis l'indice, puis
   appuie sur **"✅ Marquer trouvée"**. Reviens dans **Scénarios** et
   appuie sur **"📡 Voir sur le radar"** pour être redirigé vers la
   prochaine étape non trouvée.
8. **Pour jouer à plusieurs appareils sans réseau** : chaque joueur répète
   les étapes 1 à 5 en démarrant **exactement au même endroit physique**
   (voir l'explication du mécanisme plus haut).
9. À la fin (ou pour recommencer ailleurs), appuie sur
   **"↺ Réinitialiser"** sur la carte du scénario pour supprimer ses
   caches et pouvoir le relancer depuis un autre point de départ.

### Créer ses propres caches

1. Ouvre l'onglet **➕ Ajouter**.
2. Remplis le nom, une description, un indice (optionnel), la difficulté
   et le terrain.
3. Pour les coordonnées : soit tape-les directement, soit rends-toi à
   l'endroit voulu et appuie sur **"📍 Utiliser ma position GPS actuelle"**.
4. Appuie sur **"Enregistrer la cache"** — elle apparaît dans l'onglet
   **Caches**.

### Gérer ses caches

Dans l'onglet **🗂️ Caches**, chaque cache est listée avec sa distance par
rapport à ta position actuelle (les plus proches en premier) :

- **📡 Pointer** : l'affiche comme cible dans l'onglet Radar.
- **✅ Marquer trouvée / ↩️ Marquer non trouvée** : suit ta progression.
- **✏️ Modifier** : réouvre le formulaire pré-rempli.
- **🗑️ Supprimer** : la retire définitivement.

### Sauvegarder ou partager sans réseau

Dans l'onglet **💾 Données** :

- **⬇️ Exporter** : télécharge toutes les caches dans un fichier `.json`,
  à garder comme sauvegarde ou à transférer à un autre appareil (câble,
  Bluetooth, carte SD, clé USB — aucun réseau nécessaire).
- **⬆️ Importer** : recharge un fichier `.json` précédemment exporté.
- **🗑️ Tout effacer** : supprime toutes les caches enregistrées sur
  l'appareil.

## Dépannage

- **"GPS indisponible"** : vérifie que la localisation est activée dans les
  réglages du téléphone et que la permission a bien été accordée au
  navigateur/à l'app installée.
- **La flèche du radar ne s'oriente pas correctement** : sur iPhone, va dans
  l'onglet Radar et appuie sur "Activer la boussole" si le bouton est
  visible ; éloigne-toi des objets métalliques ou d'une voiture. Sans
  capteur d'orientation disponible, le radar affiche le cap par rapport au
  nord géographique — utilisable quand même avec une vraie boussole ou en
  se repérant au soleil.
- **Impossible d'ajouter l'app à l'écran d'accueil sur iPhone** : elle doit
  être ouverte avec Safari, pas un autre navigateur.
- **L'app semble "figée" après une mise à jour du contenu** : rouvre-la une
  fois connectée au réseau pour que le service worker récupère la nouvelle
  version.
- **Le bouton "Scanner la zone" n'apparaît pas** : il ne s'affiche que si le
  checkpoint ciblé a un objet virtuel assigné et que tu es à moins de 30 m
  (la distance restante est affichée en attendant).
- **"Caméra indisponible"** : vérifie que la permission caméra a été
  accordée au navigateur/à l'app dans les réglages du téléphone. En
  attendant, le bouton "J'ai trouvé l'objet !" reste utilisable pour ne pas
  bloquer la partie.

## Développement local

Comme la géolocalisation et les service workers exigent un contexte sécurisé,
sers le dossier en local plutôt que d'ouvrir le fichier directement :

```bash
cd geocaching-offline
python3 -m http.server 8080
# puis ouvrir http://localhost:8080
```

## Structure

```
geocaching-offline/
├── index.html            # UI (radar, liste des caches, formulaire, données)
├── manifest.json         # PWA installable
├── service-worker.js     # cache-first, fonctionne 100% hors-ligne
├── css/style.css
├── js/
│   ├── geo.js            # distance/cap (haversine, bearing) + destinationPoint (cap+distance -> lat/lon)
│   ├── db.js             # persistance localStorage (caches + trajets personnalisés)
│   ├── scenarios.js      # scénarios préenregistrés (enfants/adultes x facile/moyen/difficile)
│   ├── ar-objects.js     # bibliothèque d'objets virtuels pour le scan caméra
│   └── app.js            # logique de l'app (GPS, boussole, scénarios, mode MJ, scan AR, CRUD, import/export)
└── icons/icon.svg
```

## Limites connues

- La précision GPS dépend du matériel et de l'environnement (couverture arborée,
  canyons urbains, etc.), comme pour toute app de géocaching classique.
