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
   préparé à l'avance dans l'onglet **Données**.
4. Une fois sur le terrain, va dans **Caches**, choisis une cache et appuie sur
   **📡 Pointer** : l'onglet **Radar** affiche alors la distance et la direction
   à suivre.
5. Marque les caches trouvées, et exporte régulièrement tes données en JSON pour
   les sauvegarder ou les partager avec un autre appareil (par câble, Bluetooth,
   carte SD... aucun réseau requis).

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
│   ├── geo.js            # distance (haversine) et cap (bearing)
│   ├── db.js             # persistance localStorage
│   └── app.js            # logique de l'app (GPS, boussole, CRUD, import/export)
└── icons/icon.svg
```

## Limites connues

- La boussole (orientation de l'appareil) demande une permission utilisateur sur
  iOS/Safari — un bouton "Activer la boussole" apparaît si nécessaire. Sans
  capteur d'orientation, le radar affiche le cap par rapport au nord géographique.
- La précision GPS dépend du matériel et de l'environnement (couverture arborée,
  canyons urbains, etc.), comme pour toute app de géocaching classique.
