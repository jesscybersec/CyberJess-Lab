# 🤖 TryHackMe - Skynet

🔗 **TryHackMe Room:** [Skynet](https://tryhackme.com/room/skynet)

```diff
> enumerate the network • loot the shares • wake the CMS • turn cron into judgment day
```

---

## 🌐 Languages

- 🇬🇧 **English:** [Skynet-EN.md](Skynet-EN.md)
- 🇫🇷 **Français:** [Skynet-FR.md](Skynet-FR.md)

---

> "The machines leaked a password. We simply listened politely."

---

## 🧠 Overview

**Skynet** is a Terminator-themed TryHackMe CTF where the compromise chain moves across multiple services: SMB enumeration, webmail access, credential reuse, hidden web content, Cuppa CMS file inclusion, reverse shell execution, and a cron-powered privilege escalation.

The fun part is that nothing happens in one dramatic explosion. The box drops little breadcrumbs: an anonymous SMB share, a password list, Miles Dyson's mailbox, a personal SMB share, a hidden CMS path, and finally a root-owned backup script that trusts filenames a little too much. Very cinematic. Very bad for the server.

---

## 🎯 Objectives

- 🔎 Enumerate exposed services
- 📁 Read the anonymous SMB share
- 🧬 Identify the `milesdyson` user
- 📬 Access SquirrelMail with recovered credentials
- 🔐 Reuse the SMB password on Miles Dyson's private share
- 🧭 Discover the hidden CMS endpoint
- 🧪 Exploit Cuppa CMS local/remote file inclusion
- 🐚 Catch a reverse shell as `www-data`
- 🚩 Retrieve `user.txt`
- ⬆️ Abuse a root cron backup job with tar checkpoint filenames
- 👑 Retrieve `root.txt`

---

## 📁 Repository Contents

- 📘 [English walkthrough](Skynet-EN.md)
- 📙 [French walkthrough](Skynet-FR.md)
- 📝 [Original notes](Notes.md)
- 🖼️ [Screenshots](screenshots/)

---

## 🧭 Attack Path

1. Scan the machine and identify SSH, HTTP, POP3, IMAP, and SMB.
2. Enumerate SMB and find the `anonymous` share plus the user `milesdyson`.
3. Download the anonymous logs and use the leaked password list against SquirrelMail.
4. Read Miles Dyson's mail and recover his SMB password.
5. Access the `milesdyson` SMB share and find `/45kra24zxs28v3yd`.
6. Enumerate the hidden path and discover the Cuppa CMS administrator panel.
7. Exploit Cuppa CMS `urlConfig` file inclusion to read `/etc/passwd`.
8. Host a PHP reverse shell and include it remotely through the vulnerable parameter.
9. Read the user flag as `www-data`.
10. Abuse the root cron backup job with tar wildcard checkpoint injection.
11. Escalate to root and read the root flag.

👉 **Insight:**
Skynet rewards patient cross-service enumeration. The machine does not hand over root through one shiny exploit; it makes you connect boring-looking clues until the whole system starts making extremely unfortunate decisions.

---

## 🔗 References

- [TryHackMe - Skynet](https://tryhackme.com/room/skynet)
- [Exploit-DB - Cuppa CMS File Inclusion](https://www.exploit-db.com/exploits/25971)
- [GTFOBins - tar](https://gtfobins.github.io/gtfobins/tar/)
- [HackTricks - Linux Privilege Escalation](https://book.hacktricks.wiki/en/linux-hardening/privilege-escalation/index.html)
