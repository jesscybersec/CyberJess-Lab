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

## Utilisation

1. Ouvre `index.html` (idéalement servi en HTTPS ou via `localhost`, requis par les
   navigateurs pour la géolocalisation et les service workers).
2. Installe l'app sur l'écran d'accueil ("Ajouter à l'écran d'accueil") pour l'ouvrir
   comme une vraie app, sans passer par le navigateur.
3. Avant de partir hors-couverture, ajoute tes caches dans l'onglet **Ajouter**
   (à la main ou via ta position GPS actuelle), ou importe un fichier `.json`
   préparé à l'avance dans l'onglet **Données**. Tu peux aussi lancer un
   **scénario préenregistré** (voir ci-dessous).
4. Une fois sur le terrain, va dans **Caches**, choisis une cache et appuie sur
   **📡 Pointer** : l'onglet **Radar** affiche alors la distance et la direction
   à suivre.
5. Marque les caches trouvées, et exporte régulièrement tes données en JSON pour
   les sauvegarder ou les partager avec un autre appareil (par câble, Bluetooth,
   carte SD... aucun réseau requis).

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
│   ├── db.js             # persistance localStorage
│   ├── scenarios.js      # scénarios préenregistrés (enfants/adultes x facile/moyen/difficile)
│   └── app.js            # logique de l'app (GPS, boussole, scénarios, CRUD, import/export)
└── icons/icon.svg
```

## Limites connues

- La boussole (orientation de l'appareil) demande une permission utilisateur sur
  iOS/Safari — un bouton "Activer la boussole" apparaît si nécessaire. Sans
  capteur d'orientation, le radar affiche le cap par rapport au nord géographique.
- La précision GPS dépend du matériel et de l'environnement (couverture arborée,
  canyons urbains, etc.), comme pour toute app de géocaching classique.
