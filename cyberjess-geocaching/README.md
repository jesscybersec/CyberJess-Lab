# 📡 CyberJess Geocaching

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
scénario a sa propre ambiance**, parmi 13 thèmes disponibles : couleurs et
texture de fond changent selon l'aventure. Dès l'onglet **Scénarios**,
chaque carte affiche déjà sa propre couleur et son propre motif (paillettes
pour le jardin enchanté ou l'observatoire, vagues pour les pirates,
feuillage pour la forêt ou la jungle, papier vieilli pour la balade
vintage ou le marché gourmand, lignes caviardées pour l'espionnage ou le
musée disparu, circuits imprimés pour le Protocole Fantôme ou Zero Day...).
Dès qu'une cache de ce scénario est ciblée sur le **Radar**, la couleur
d'accent, le fond animé et la flèche du radar adoptent cette ambiance pour
toute l'app.

Un trajet créé en mode **Maître du jeu** peut lui aussi choisir une ambiance
visuelle parmi ces mêmes thèmes (champ "Ambiance visuelle" à la création).

Petit bonus : marquer une cache comme trouvée déclenche une courte
animation de célébration à l'écran.

## Scénarios préenregistrés (multi-appareils, sans réseau)

L'onglet **🎬 Scénarios** propose 12 parcours prêts à l'emploi (2 par
combinaison public/difficulté), filtrables par public et par difficulté :

| Scénario | Public | Difficulté | Étapes |
|---|---|---|---|
| Le Trésor du Jardin Enchanté | Enfants (5-8 ans) | Facile | 4 |
| Le Cirque Magique | Enfants (5-8 ans) | Facile | 4 |
| Mission Pirates au Parc | Enfants (8-11 ans) | Moyen | 5 |
| L'Expédition des Explorateurs Perdus | Enfants (8-11 ans) | Moyen | 5 |
| L'Énigme de la Forêt Mystérieuse | Enfants/ados (11-14 ans) | Difficile | 5 |
| Le Code Secret de l'Observatoire | Enfants/ados (11-14 ans) | Difficile | 5 |
| Balade Rétro du Vieux Quartier | Adultes | Facile | 4 |
| Promenade Gourmande du Marché | Adultes | Facile | 4 |
| Chasse à l'Espion | Adultes | Moyen | 5 |
| L'Énigme du Musée Disparu | Adultes | Moyen | 5 |
| Protocole Fantôme — Signal Zéro | Adultes | Difficile | 6 |
| Zero Day | Adultes | Difficile | 6 |

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
l'appuyant, la caméra arrière s'ouvre en plein écran et il faut vraiment
**chercher** l'objet en balayant les alentours avec le téléphone :

- Un objet qui "ne devrait pas être dans la réalité" (une orbe, un fantôme,
  une soucoupe, une clé dorée...) est caché à une direction aléatoire
  (un cap boussole) autour de toi. Il n'apparaît dans le flux caméra que
  lorsque le téléphone pointe à peu près dans cette direction.
- Tant qu'il n'est pas dans le champ, un indice à l'écran indique la
  direction où tourner (**⬅️ /➡️**) et une température (« tu chauffes »,
  « tu te réchauffes… », « c'est encore loin… ») pour guider la recherche
  sans la rendre frustrante.
- Une fois l'objet dans le champ, l'image se **fige comme une photo**
  (comme un instantané capturé) et le bouton **"✅ J'ai trouvé l'objet !"**
  se déverrouille — un message **"📸 Objet capturé !"** confirme qu'il n'y
  a plus qu'à appuyer sur ce bouton pour passer à la prochaine cache.
  Il reste grisé (🔒 Cherche encore l'objet…) tant que l'objet n'a pas été
  repéré, pour que ce soit une vraie recherche et pas juste une formalité,
  et une fois figée, l'image reste stable même si le téléphone bouge
  ensuite — pas besoin de rester parfaitement immobile en attendant
  d'appuyer sur le bouton.

**Important à savoir sur cette réalité augmentée légère** : cette recherche
repose sur le cap de la vraie boussole du téléphone — celle-ci a toujours
la priorité, même si le mode simulation est actif pour la position (donc
tourner physiquement le téléphone fonctionne normalement pendant une
partie simulée). Le curseur de cap du mode simulation ne sert de secours
que quand aucun capteur d'orientation réel n'est disponible du tout (par
exemple en testant sur un ordinateur sans capteur). Dans ce cas précis
(aucun capteur ni réel ni simulé), l'objet reste affiché au centre par
défaut et le bouton "trouvé" reste utilisable directement, pour ne jamais
bloquer la partie sur un appareil qui ne peut pas faire cette recherche.
L'objet n'est pas non plus "ancré" à un point precis du décor visuel (ce
qui demanderait un suivi spatial de type SLAM/WebXR, peu fiable hors-ligne
et beaucoup plus lourd à développer) : c'est une direction à trouver, pas
un point fixe dans l'image. Tout fonctionne 100% sur l'appareil, sans
réseau ni bibliothèque externe. Si la caméra elle-même n'est pas
disponible (permission refusée, appareil sans caméra), un message
s'affiche et le bouton "J'ai trouvé l'objet !" reste utilisable, puisqu'il
n'y a alors aucun moyen de chercher visuellement.

L'app garde séparément la dernière valeur de chaque source de cap possible
(boussole vraie `webkitCompassHeading` sur iOS, évènement marqué
`absolute: true`/`deviceorientationabsolute` sur Android/Chrome, et
orientation relative simple) au lieu de les mélanger dans une seule
variable partagée — les mélanger, c'est ce qui causait un blocage ou un
scintillement de l'objet sur certains téléphones qui envoient plusieurs de
ces signaux en même temps. À l'ouverture du scanner, l'app choisit **une
seule source pour toute la session de recherche** (en priorité : boussole
vraie, puis cap absolu, puis cap relatif) et n'en change que si cette
source précise s'arrête de répondre pendant plus d'une seconde — ce qui
évite à la fois le figement permanent sur une mauvaise lecture et le
clignotement causé par des sources concurrentes qui ne pointent pas dans
la même direction de référence. Un petit indicateur discret
(`🧭 143° → 🎯 210° (boussole)` ou `(boussole non calibrée)`) est affiché en
haut du scanner caméra pour diagnostiquer facilement un souci de boussole
sur un appareil donné si jamais l'objet reste introuvable ; si une erreur
inattendue survient dans le scanner, un message s'affiche aussi
automatiquement (au lieu de laisser l'écran figé sans explication) et le
bouton "trouvé" reste utilisable pour ne jamais bloquer la partie.

**Particularité iOS** : `webkitCompassHeading` peut valoir **-1** (une
valeur documentée par Apple) quand la boussole n'est pas encore calibrée,
et non `null` comme on pourrait s'y attendre — cette valeur est ignorée
explicitement, sinon elle se faisait passer pour une vraie lecture et
bloquait la recherche indéfiniment sur un cap sans aucun sens (impossible
à corriger même avec le cadran de simulation). Si la boussole d'un
téléphone n'a jamais été calibrée, il suffit généralement de la faire
"faire un 8" dans les airs, ou d'utiliser le cadran de simulation en
attendant.

La permission d'accès à la boussole (nécessaire sur iOS 13+) est demandée
automatiquement dès l'ouverture du scanner, en plus du petit bouton
**"Activer la boussole"** dans l'onglet Radar — donc pas besoin de l'avoir
repéré au préalable. La caméra et la recherche n'apparaissent qu'une fois
cette demande réglée (acceptée, refusée, ou expirée après 3 secondes) :
sur certaines configurations iOS (notamment une app **ajoutée à l'écran
d'accueil**), l'invite système peut ne jamais s'afficher du tout, donc
cette limite de 3 secondes garantit que le scanner ne reste jamais bloqué
indéfiniment à attendre une réponse qui ne viendra jamais — mais elle
garantit surtout que si l'invite système apparaît vraiment, elle est
répondue avant que les boutons du scanner (comme "trouvé") ne deviennent
utilisables, pour qu'une boîte de dialogue du système ne puisse jamais
intercepter un appui destiné à l'app. Et si le **mode simulation** est
actif sans qu'aucune vraie boussole ne réponde (permission refusée,
expirée, ou test sur un appareil sans capteur), un
petit cadran **"Tourner ⟲ / ⟳"** apparaît directement dans le scanner : il
permet de faire pivoter le cap simulé sans avoir à sortir du plein écran
pour aller toucher le curseur de l'onglet Radar (qui, lui, est caché
derrière le scanner tant qu'il est ouvert).

**Note technique** : sur certains navigateurs iOS (notamment Chrome pour
iOS), un flux caméra `<video>` en direct peut parfois intercepter les
appuis destinés aux boutons superposés par-dessus, même si l'affichage
semble correct (le bouton a l'air normal, ni grisé ni couvert par autre
chose) — c'est une particularité connue de WebKit. Les boutons du scanner
(trouvé, fermer, cadran de rotation) répondent donc à la fois au clic
classique et directement au toucher (`touchend`), pour rester utilisables
même si le navigateur avale l'évènement clic dérivé.

Pour choisir un objet virtuel sur une cache : le champ **"Objet virtuel à
scanner"** est disponible aussi bien dans le formulaire **➕ Ajouter** que
dans le formulaire de checkpoint du mode Maître du jeu.

## Quiz et tableau des scores

Quand une équipe trouve une cache **liée à un scénario ou à un trajet
personnalisé** (que ce soit via la liste des caches ou via le scan caméra),
1 ou 2 questions quiz s'affichent avant que la cache soit marquée trouvée :

- Les questions sont piochées dans une banque de **240 questions** (40 par
  combinaison public/difficulté) adaptée au **public et à la difficulté**
  de l'aventure — questions simples pour un scénario enfants facile,
  questions plus corsées (parfois à saveur cybersécurité, clin d'œil à
  l'esprit du labo) pour un scénario adultes difficile.
- L'app évite de reposer une question déjà utilisée pendant la même partie ;
  une fois la banque d'une case épuisée, elle recommence à piocher dedans.
- Chaque bonne réponse rapporte des points (5 en facile, 10 en moyen, 15 en
  difficile). Il est toujours possible d'appuyer sur **"Passer le quiz"**
  pour marquer la cache trouvée sans répondre.
- Les caches ajoutées manuellement (onglet **➕ Ajouter**, sans scénario
  associé) ne déclenchent pas de quiz — il n'y a pas de niveau à leur
  associer.

Comme les boutons du scanner caméra, les boutons du quiz (réponses,
"Question suivante", "Passer le quiz") répondent à la fois au clic
classique et directement au toucher (`touchend`), pour la même raison :
certains navigateurs iOS peuvent, dans de rares cas, avaler l'évènement
clic dérivé d'un appui tactile dans une fenêtre modale.

Le score cumulé est **visible uniquement dans l'onglet 🎓 Maître du jeu**,
sous la liste des trajets : les joueurs ne le voient nulle part ailleurs
dans l'app. Le bouton **"🗑️ Réinitialiser le score"** permet de repartir à
zéro une fois la partie terminée. Comme tout le reste, le score est propre
à l'appareil sur lequel il est suivi (pas de synchronisation réseau entre
plusieurs téléphones).

Pour enrichir la banque de questions, complète les tableaux du fichier
`js/quiz.js` (un tableau par combinaison public/difficulté).

## Sons et vibrations

Quatre petits signaux accompagnent le jeu, tous générés directement sur
l'appareil (aucun fichier audio téléchargé) :

- **Approche d'une cache** : un son + une vibration légère dès que tu entres
  dans la zone de scan (moins de 30 m) d'une cache liée à un objet virtuel.
- **Bonne réponse au quiz** : un son de victoire.
- **Mauvaise réponse au quiz** : un son d'échec.
- **Cache marquée trouvée** : un petit air de triomphe.

Ils se désactivent tous ensemble via **"🔊 Activer les sons et
vibrations"** dans l'onglet **💾 Données** (utile dans un lieu calme comme
une bibliothèque). Ce réglage est mémorisé sur l'appareil.

**Limite connue** : la vibration utilise l'API Vibration du navigateur,
qui n'est **pas supportée par Safari sur iPhone/iPad** (limitation
d'Apple, pas de contournement possible côté app) — les sons, eux,
fonctionnent sur toutes les plateformes.

## Mode simulation (tester sans se déplacer)

Un panneau **🧪 Simulation** est intégré directement dans l'onglet
**📡 Radar** (sous les coordonnées GPS), pour tester toute l'application —
scénarios, scan caméra, quiz — sans jamais changer d'onglet et sans avoir
à te déplacer physiquement. Une fois activé (bouton **"🧪 Activer la
simulation"**), il remplace ta position GPS et ton orientation réelles par
des valeurs que tu contrôles, directement sous le radar :

- **Position manuelle** : entre une latitude/longitude et appuie sur
  **"📍 Déplacer ici"**, ou reprends ta dernière position GPS réelle comme
  point de départ.
- **🎯 Aller à la cache ciblée** : téléporte directement la position
  simulée sur la cache actuellement pointée sur le radar — pratique pour
  tester le scan caméra (qui demande d'être à moins de 30 m) sans marcher.
- **Déplacement virtuel** : les 8 flèches directionnelles avancent la
  position simulée d'un pas choisi (5 à 100 m) dans la direction indiquée,
  en utilisant le même calcul géodésique que le reste de l'app — de quoi
  "marcher" vers une cache et voir la distance et le cap se mettre à jour
  en temps réel, sans quitter le radar.
- **Orientation simulée** : un curseur de cap (0-359°) contrôle la flèche
  du radar sans avoir besoin de faire pivoter le téléphone — et permet
  aussi de "tourner sur soi-même" virtuellement pour tester la recherche
  d'objet du scan caméra (voir la section précédente) depuis un bureau.

Un bandeau **"🧪 Mode simulation actif"** reste affiché en haut de l'app
tant que la simulation est active, pour ne pas la confondre avec une
vraie partie. Le bouton **"⏹️ Désactiver la simulation"** restaure
immédiatement le GPS et la boussole réels. Comme la simulation agit sur
la même position utilisée partout ailleurs dans l'app, les boutons
"Utiliser ma position GPS actuelle" (formulaire d'ajout, lancement de
scénario, checkpoint du mode Maître du jeu) utilisent aussi la position
simulée tant qu'elle est active.

**Important pour tester le scan caméra en simulation** : une vraie
lecture de boussole (via le bouton "Activer la boussole" ou dès qu'un
capteur d'orientation répond) garde **toujours la priorité** sur le
curseur/cadran de cap simulé, même en pleine simulation — c'est voulu
(voir la section "Scan caméra" plus haut), mais ça veut dire que si tu
n'as pas l'intention de tourner physiquement le téléphone, il vaut mieux
**ne pas activer la boussole** avant de tester : sinon le cadran de
simulation à l'intérieur du scanner n'aura aucun effet, puisque c'est la
vraie boussole qui garde la main sur la recherche.

## Installation sur un téléphone

**Point important** : comme toute application web, elle doit être ouverte
**une première fois avec une connexion** (Wi-Fi ou données mobiles) pour être
téléchargée et installée. Ensuite seulement, elle fonctionne sans aucun
réseau. Il n'y a pas de compte à créer, pas d'app store : tout se passe dans
le navigateur.

**Sur iPhone/iPad, utilise Safari** plutôt que Chrome ou un autre
navigateur : tous les navigateurs iOS reposent sur le même moteur WebKit
imposé par Apple, mais Safari est celui qui a le support le plus complet
et le mieux testé des fonctionnalités utilisées ici (capteurs
d'orientation, caméra, installation à l'écran d'accueil). D'autres
navigateurs iOS peuvent fonctionner, mais avec des limitations connues.

Trois façons d'obtenir un lien à ouvrir sur le téléphone :

- **Hébergée en ligne via GitHub Pages** (le plus simple, à faire une seule
  fois) — voir la section [Héberger l'app avec GitHub Pages](#héberger-lapp-avec-github-pages)
  ci-dessous.
- **Serveur local sur ton ordinateur** : lance le serveur local (voir
  [Développement local](#développement-local)), puis sur le téléphone
  (connecté au **même Wi-Fi** que l'ordinateur), ouvre
  `http://<adresse-IP-locale-de-l-ordinateur>:8080` — trouve cette adresse
  IP avec `ipconfig` (Windows) ou `ifconfig`/`ip a` (Mac/Linux).
- **Fichiers copiés directement sur le téléphone** : possible avec certaines
  apps (ex. un navigateur qui sait ouvrir des fichiers locaux), mais la
  géolocalisation et le mode hors-ligne ne fonctionnent de façon fiable que
  servis en `http://` ou `https://` — à éviter si possible.

### Héberger l'app avec GitHub Pages

C'est la façon la plus simple de donner un lien stable aux joueurs, sans
qu'ils aient besoin d'un ordinateur ni d'être sur le même Wi-Fi que
personne. GitHub Pages est gratuit et déjà activé sur ce dépôt.

**Lien de l'app une fois publiée :**
`https://jesscybersec.github.io/CyberJess-Lab/cyberjess-geocaching/`

Pour l'activer (ou le réactiver) toi-même sur le dépôt :

1. Va sur **https://github.com/jesscybersec/CyberJess-Lab** → onglet
   **Settings** du dépôt (pas les paramètres de ton compte personnel).
2. Dans le menu de gauche, section "Code and automation" → **Pages**.
3. Sous **Build and deployment** → **Source** : choisis **"Deploy from a
   branch"**.
4. **Branch** : `main`, dossier **`/ (root)`** → **Save**.
5. Attends 1-2 minutes que GitHub publie le site, puis ouvre le lien
   ci-dessus.

Comme la branche `main` contient tout le dépôt (pas seulement le dossier
de l'app), le lien publié couvre l'ensemble du contenu du dépôt — c'est
sans risque supplémentaire ici puisque le dépôt est déjà public, mais à
garder en tête si le dépôt devient privé un jour.

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
7. Une fois arrivé sur une étape, va dans **Caches** pour lire l'indice et
   appuyer sur **"✅ Marquer trouvée"** (ou termine le scan caméra si un
   objet virtuel est associé). L'onglet **Radar** affiche alors directement
   un bouton **"➡️ Cache suivante"** vers la prochaine étape non trouvée —
   plus besoin de repasser par l'onglet Scénarios pour enchaîner les
   étapes.
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
- **Après une mise à jour, un bouton ne réagit plus du tout (aucune erreur,
  juste rien ne se passe)** : c'est le signe classique d'un onglet resté
  ouvert depuis avant la mise à jour, qui continue de faire tourner
  l'ancien code en mémoire — le service worker installe la nouvelle
  version en arrière-plan, mais rien ne force l'onglet déjà ouvert à la
  charger tant qu'il n'est pas rechargé. Avec une connexion active, va
  dans **💾 Données** et appuie sur **"🔄 Vérifier les mises à jour"** :
  l'app se recharge automatiquement si une nouvelle version est trouvée.
  Si le bouton lui-même semble ne rien faire, ferme complètement l'onglet
  (ou l'app installée) et rouvre le lien à neuf.
- **Le bouton "Scanner la zone" n'apparaît pas** : il ne s'affiche que si le
  checkpoint ciblé a un objet virtuel assigné et que tu es à moins de 30 m
  (la distance restante est affichée en attendant).
- **"Caméra indisponible"** : vérifie que la permission caméra a été
  accordée au navigateur/à l'app dans les réglages du téléphone. En
  attendant, le bouton "J'ai trouvé l'objet !" reste utilisable pour ne pas
  bloquer la partie.
- **L'objet virtuel n'apparaît jamais dans le scan caméra, peu importe où
  je tourne le téléphone** : la vraie boussole du téléphone est toujours
  utilisée en priorité pour cette recherche, donc ce cas signale
  généralement que le navigateur n'a pas accès à l'orientation de
  l'appareil — vérifie que la permission boussole a bien été accordée
  (bouton "Activer la boussole" dans l'onglet Radar sur iPhone), ou
  qu'aucun bloqueur de capteurs n'est actif. Sans capteur d'orientation du
  tout, l'objet s'affiche au centre par défaut et le bouton "trouvé" reste
  utilisable directement. Regarde le petit texte `🧭 ...° → 🎯 ...°` en haut
  du scanner : s'il affiche "aucune donnée de boussole", le téléphone ne
  fournit tout simplement aucun cap ; s'il affiche un cap qui ne bouge pas
  du tout quand tu tournes physiquement l'appareil, redémarre le navigateur
  (certains navigateurs Android ne (ré)activent le magnétomètre qu'après un
  redémarrage complet une fois la permission accordée).

## Développement local

Comme la géolocalisation et les service workers exigent un contexte sécurisé,
sers le dossier en local plutôt que d'ouvrir le fichier directement :

```bash
cd cyberjess-geocaching
python3 -m http.server 8080
# puis ouvrir http://localhost:8080
```

## Structure

```
cyberjess-geocaching/
├── index.html            # UI (radar, liste des caches, formulaire, données)
├── manifest.json         # PWA installable
├── service-worker.js     # cache-first, fonctionne 100% hors-ligne
├── css/style.css
├── js/
│   ├── geo.js            # distance/cap (haversine, bearing) + destinationPoint (cap+distance -> lat/lon)
│   ├── db.js             # persistance localStorage (caches, trajets, score du quiz, préférences)
│   ├── scenarios.js      # scénarios préenregistrés (enfants/adultes x facile/moyen/difficile)
│   ├── ar-objects.js     # bibliothèque d'objets virtuels pour le scan caméra
│   ├── themes.js         # palettes visuelles par scénario/trajet
│   ├── quiz.js           # banque de questions quiz (par public + difficulté)
│   ├── audio.js          # effets sonores synthétisés (Web Audio API, aucun fichier audio)
│   └── app.js            # logique de l'app (GPS, boussole, scénarios, mode MJ, scan AR, quiz, simulation, sons, CRUD, import/export)
└── icons/icon.svg
```

## Limites connues

- La précision GPS dépend du matériel et de l'environnement (couverture arborée,
  canyons urbains, etc.), comme pour toute app de géocaching classique.
