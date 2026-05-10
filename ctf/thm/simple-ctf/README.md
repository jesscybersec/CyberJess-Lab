# 🧬 TryHackMe - Simple CTF

🔗 **TryHackMe Room:** [Simple CTF](https://tryhackme.com/room/easyctf)

```diff
> scan deeper • read the CMS trail • let sudo vim open root
```

---

## 🌐 Languages

- 🇬🇧 **English:** [SimpleCTF-EN.md](SimpleCTF-EN.md)
- 🇫🇷 **Français:** [SimpleCTF-FR.md](SimpleCTF-FR.md)

---

> "The obvious ports start the story. The hidden SSH port ends it."

---

## 🧠 Overview

**Simple CTF** is a beginner-friendly TryHackMe room focused on service enumeration, web application discovery, CMS Made Simple exploitation, password cracking, SSH access, and Linux privilege escalation through a misconfigured `sudo` rule.

The attack path starts with port scanning and web enumeration. The `/simple` directory reveals CMS Made Simple, which is vulnerable to an unauthenticated SQL injection. The dumped hash cracks to a valid SSH password for `mitch`, and privilege escalation is completed with passwordless `sudo` access to `vim`.

---

## 🎯 Objectives

- 🔎 Enumerate exposed services beyond the first 1000 ports
- 🌐 Discover the CMS Made Simple web application
- 🧪 Exploit CVE-2019-9053 to recover credentials
- 🔐 Crack the CMS password hash
- 🐚 SSH into the target as `mitch`
- 🚩 Retrieve `user.txt`
- ⬆️ Abuse passwordless `sudo vim`
- 👑 Retrieve `root.txt`

---

## 📁 Repository Contents

- 📘 [English walkthrough](SimpleCTF-EN.md)
- 📙 [French walkthrough](SimpleCTF-FR.md)
- 📝 [Original notes](Notes.md)
- 🖼️ [Screenshots](screenshots/)

---

## 🧭 Attack Path

1. Scan the target and identify FTP, HTTP, and SSH on port `2222`.
2. Enumerate the web server and find `/simple`.
3. Identify CMS Made Simple and exploit its SQL injection vulnerability.
4. Crack the recovered password hash and obtain `mitch:secret`.
5. Log in through SSH on port `2222`.
6. Read the user flag from `/home/mitch/user.txt`.
7. Check `sudo -l` and find passwordless `vim`.
8. Spawn a root shell from `vim` and read `/root/root.txt`.

👉 **Insight:**
This room rewards complete enumeration. The SSH service is not on the default port, and the privilege escalation path is hidden in a very small `sudo -l` result.

---

## 🔗 References

- [TryHackMe - Simple CTF](https://tryhackme.com/room/easyctf)
- [Exploit-DB - CMS Made Simple <= 2.2.9 SQL Injection](https://www.exploit-db.com/exploits/46635)
- [CVE-2019-9053](https://nvd.nist.gov/vuln/detail/CVE-2019-9053)
- [GTFOBins - Vim](https://gtfobins.github.io/gtfobins/vim/)
