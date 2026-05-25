# Instructions - Publication de walkthroughs CTF

Ce document décrit comment demander la publication d'un walkthrough CTF dans ce dépôt GitHub, selon le format utilisé pour les rooms TryHackMe `root-me` et `bounty-hacker`.

L'objectif est d'obtenir une publication propre, bilingue, lisible sur GitHub, avec un style cyberpunk/fun, tout en évitant de publier des flags sensibles en clair.

---

## Demande type à envoyer à Codex

Utiliser une demande de ce style :

```text
Je voudrais publier un nouveau walkthrough CTF sur mon GitHub.
Tout est localement dans :
F:\Code\Github\CyberJess-Lab-main-fix\ctf\thm\<nom-de-la-room>

Peux-tu fusionner les fichiers Markdown, créer le même format que mes autres walkthroughs CTF, et produire une version bilingue anglais/français dans le même style cyberpunk?

Le walkthrough doit être verbose, clair, drôle, et un peu narratif.
Garde les flags redacted.
Ajoute le logo de la room s'il existe dans le dossier.
```

Adapter `<nom-de-la-room>` au dossier réel.

Exemple :

```text
F:\Code\Github\CyberJess-Lab-main-fix\ctf\thm\bounty-hacker
```

---

## Structure attendue du dossier

Pour une room TryHackMe, le dossier devrait ressembler à ceci :

```text
ctf/thm/<room-slug>/
├── README.md
├── <RoomName>-EN.md
├── <RoomName>-FR.md
├── <RoomName>-Notes.md
└── <room-logo>.png
```

Notes :

- `README.md` sert de page d'entrée principale sur GitHub.
- `<RoomName>-EN.md` contient le walkthrough complet en anglais.
- `<RoomName>-FR.md` contient le walkthrough complet en français.
- `<RoomName>-Notes.md` conserve les notes brutes originales.
- Le logo est optionnel, mais recommandé si une image est disponible.
- Éviter les fichiers index redondants comme `<RoomName>.md` si le `README.md` remplit déjà ce rôle.

---

## Format du README

Le `README.md` doit contenir :

- Un titre clair : `# TryHackMe - <Room Name>`
- Le logo centré, si disponible.
- Le lien vers la room TryHackMe.
- Un court bloc `diff` avec une phrase cyberpunk qui résume l'attaque.
- Une section langues avec les liens EN/FR.
- Une overview concise.
- Une liste d'objectifs.
- Une section repository contents.
- Un attack path numéroté.
- Des références.

Exemple de logo centré :

```html
<p align="center">
  <img src="./bounty-hacker-logo.png" alt="Bounty Hacker logo" width="240">
</p>
```

Règles pour le logo :

- Utiliser un chemin relatif avec `./`.
- Garder une largeur raisonnable, autour de `240`.
- Éviter les logos énormes qui prennent tout l'écran.
- Si l'aperçu local affiche le HTML en texte brut, vérifier sur GitHub : GitHub rend correctement ce HTML.

---

## Format des walkthroughs EN et FR

Les fichiers EN et FR doivent être complets et suivre la même structure.

Structure recommandée :

```text
# <Room Name> - Walkthrough

Lien TryHackMe
Logo centré
Bloc diff d'ambiance

## Information / Informations
## Reconnaissance
## Enumeration
## Exploitation ou Credential Attack
## User Flag
## Privilege Escalation
## Root Flag
## Final Thoughts / Conclusion
## References / Références
```

Le contenu doit :

- Expliquer les commandes utilisées.
- Montrer les résultats importants.
- Interpréter les résultats.
- Ajouter des petits commentaires drôles, mais pas au détriment de la clarté.
- Rester pédagogique pour quelqu'un qui apprend.
- Garder un style cyberpunk, terminal, CTF, mais pas trop lourd.
- Inclure les mêmes étapes dans les deux langues.

---

## Style d'écriture

Le style attendu :

- Verbose, mais utile.
- Drôle, mais pas confus.
- Pédagogique.
- Bilingue EN/FR.
- Cyberpunk léger : néons, terminal, shell, hacking lab, etc.
- Pas de blagues qui rendent les étapes techniques difficiles à suivre.
- Pas de sur-promesse : on explique ce qui a été fait, pas une histoire inventée qui change l'attaque.

Exemples de phrases acceptables :

```text
The target basically handed us a username and a wordlist.
```

```text
GTFOBins becomes the cyberpunk spellbook.
```

```text
Le premier shell n'est pas la fin. C'est le hall d'entrée.
```

---

## Règles de sécurité pour les flags

Ne jamais publier les vrais flags dans les walkthroughs finaux.

Dans les fichiers suivants, remplacer les flags par :

```text
THM{REDACTED}
```

ou :

```text
<REDACTED>
```

Cette règle s'applique à :

- `README.md`
- `<RoomName>-EN.md`
- `<RoomName>-FR.md`
- `<RoomName>-Notes.md`
- Tout autre fichier Markdown publié

Avant de commit, rechercher les flags :

```powershell
Select-String -Path *.md -Pattern 'THM\{|flag\{|HTB\{|picoCTF\{'
```

Si un vrai flag apparaît, le masquer avant de push.

---

## Workflow technique à suivre

1. Inspecter le dossier de la room.
2. Lire les notes existantes.
3. Lire un walkthrough déjà publié pour imiter le format.
4. Créer ou mettre à jour :
   - `README.md`
   - `<RoomName>-EN.md`
   - `<RoomName>-FR.md`
   - `<RoomName>-Notes.md`
5. Supprimer les fichiers redondants si le README les remplace.
6. Redacter les flags.
7. Vérifier les liens relatifs.
8. Vérifier que le logo existe et s'affiche avec un chemin relatif.
9. Vérifier le diff Git.
10. Commit.
11. Push vers GitHub.

Commandes utiles :

```powershell
git status --short
git diff --stat
git diff
git add ctf/thm/<room-slug>
git commit -m "Add <Room Name> THM walkthrough"
git push origin main
```

Pour une modification après publication :

```powershell
git add ctf/thm/<room-slug>/<file>
git commit -m "Update <Room Name> walkthrough"
git push origin main
```

---

## Checklist avant commit

Avant de commit, vérifier :

- Le dossier contient un `README.md`.
- Les versions EN et FR existent.
- Les notes brutes existent si elles étaient fournies.
- Le logo est présent si référencé.
- Le logo n'est pas trop grand.
- Aucun vrai flag n'est en clair.
- Aucun fichier index inutile ne fait doublon.
- Les liens Markdown fonctionnent.
- Le ton correspond aux autres walkthroughs.
- Le diff ne contient pas de changements hors sujet.

---

## Exemple de message de commit

Pour une nouvelle room :

```text
Add Bounty Hacker THM walkthrough
```

Pour une correction visuelle :

```text
Reduce Bounty Hacker logo size
```

Pour supprimer un fichier inutile :

```text
Remove redundant Bounty Hacker index file
```

---

## Est-ce que cela peut devenir un skill?

Oui. Ce workflow est un très bon candidat pour devenir un skill Codex.

Un skill serait utile parce que cette tâche est répétable :

- lire un dossier de notes CTF;
- reconnaître les fichiers existants;
- produire un README standard;
- produire les versions EN/FR;
- appliquer le style CyberJess;
- redacter les flags;
- préparer un commit propre;
- pousser vers GitHub si demandé.

Nom de skill recommandé :

```text
ctf-writeup-publisher
```

Description possible :

```text
Publier des walkthroughs CTF dans le style CyberJess Lab. Utiliser quand l'utilisateur demande de transformer des notes CTF locales en walkthrough GitHub bilingue EN/FR, avec README, style cyberpunk, redaction des flags, logo, vérification Git, commit et push.
```

Structure possible du skill :

```text
ctf-writeup-publisher/
└── SKILL.md
```

Le skill n'a pas besoin de scripts au départ. Un `SKILL.md` bien écrit suffit, parce que le workflow est surtout rédactionnel et Git.

Si le workflow devient plus fréquent, on pourrait ajouter plus tard :

- un template `README.md`;
- un template `RoomName-EN.md`;
- un template `RoomName-FR.md`;
- un petit script de vérification des flags non redacted;
- un script de vérification des liens locaux.

---

## Prompt court pour déclencher le futur skill

Si ce workflow devient un skill, une demande courte pourrait suffire :

```text
Utilise le skill ctf-writeup-publisher pour publier cette room :
F:\Code\Github\CyberJess-Lab-main-fix\ctf\thm\<room-slug>
```

Ou :

```text
Publie ce walkthrough CTF dans le style CyberJess bilingue EN/FR, avec flags redacted et logo centré.
```

