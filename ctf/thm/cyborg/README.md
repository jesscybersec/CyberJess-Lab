# TryHackMe - Cyborg

<p align="center">
  <img src="./screenshots/cyborg-logo.jpeg" alt="Cyborg logo" width="240">
</p>

🔗 **TryHackMe Room:** [Cyborg](https://tryhackme.com/room/cyborgt8)

```diff
> enumerate web paths • crack an APR1 hash • unlock Borg backup • SSH as alex • bend backup.sh into root
```

---

## 🌐 Languages

- 🇬🇧 **English:** [Cyborg-EN.md](Cyborg-EN.md)
- 🇫🇷 **Français:** [Cyborg-FR.md](Cyborg-FR.md)

---

> "A web server, a backup archive, and one shell script with too much trust. Classic cyberpunk maintenance incident."

---

## 🧠 Overview

**Cyborg** is a TryHackMe room built around web enumeration, password cracking, and backup archive analysis.

The target exposes SSH and an Apache web server. Directory brute forcing reveals an `/admin` area and an `/etc` directory. The web content leaks an Apache APR1 hash for `music_archive`, which cracks to a Borg backup passphrase. After mounting the Borg archive, we recover SSH credentials for `alex`, collect the user flag, and escalate through a sudo-allowed backup script.

The room is a good reminder that backup systems often contain the keys to the kingdom. Sometimes literally.

---

## 🎯 Objectives

- 🔎 Enumerate exposed services with Nmap
- 🧭 Discover hidden web paths
- 🔐 Crack an Apache MD5 APR1 hash
- 📦 Inspect and mount a Borg backup archive
- 🐚 Recover SSH credentials for `alex`
- 🚩 Retrieve `user.txt`
- ⬆️ Review sudo permissions
- 👑 Abuse `/etc/mp3backups/backup.sh` to gain root

---

## 📁 Repository Contents

- 📘 [English walkthrough](Cyborg-EN.md)
- 📙 [French walkthrough](Cyborg-FR.md)
- 📝 [Original notes](Cyborg-Notes.md)
- 🖼️ [Screenshots and logo](screenshots/)

---

## 🧭 Attack Path

1. Scan the target and identify SSH on `22` and Apache HTTP on `80`.
2. Use directory enumeration to find `/admin` and `/etc`.
3. Review `/admin` and download `archive.tar`.
4. Extract `/etc/squid/passwd` data from the exposed `/etc` path.
5. Identify the hash as Apache MD5 APR1.
6. Crack the hash and recover the password `squidward`.
7. Extract `archive.tar` and find a Borg repository named `final_archive`.
8. Use the cracked password as the Borg passphrase and mount the archive.
9. Read `note.txt` from the mounted backup and recover `alex:S3cretP@s3`.
10. SSH as `alex` and retrieve the user flag.
11. Run `sudo -l` and find `alex` can run `/etc/mp3backups/backup.sh` without a password.
12. Abuse the writable backup script to execute `/bin/bash` as root.
13. Retrieve the root flag.

👉 **Insight:**
The machine does not fall because of one dramatic exploit. It falls because multiple small leaks line up neatly: a web directory, a password hash, a backup archive, a note, and a permissive sudo rule.

---

## 🔗 References

- [TryHackMe - Cyborg](https://tryhackme.com/room/cyborgt8)
- [BorgBackup Documentation](https://borgbackup.readthedocs.io/)
- [Hashcat Example Hashes](https://hashcat.net/wiki/doku.php?id=example_hashes)
