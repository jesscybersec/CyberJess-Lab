# TryHackMe - Bounty Hacker

<p align="center">
  <img src="./bounty-hacker-logo.png" alt="Bounty Hacker logo" width="520">
</p>

🔗 **TryHackMe Room:** [Bounty Hacker](https://tryhackme.com/room/cowboyhacker)

```diff
> scan the ports • steal the space-cowboy grocery list • crack SSH • make tar confess root
```

---

## 🌐 Languages

- 🇬🇧 **English:** [BountyHacker-EN.md](BountyHacker-EN.md)
- 🇫🇷 **Français:** [BountyHacker-FR.md](BountyHacker-FR.md)

---

> "A tiny FTP leak, a dragon password list, and suddenly the moon pickup is everyone's problem."

---

## 🧠 Overview

**Bounty Hacker** is a beginner-friendly TryHackMe room with a delightfully dramatic space-western theme and a very practical attack path.

The box exposes FTP, SSH, and HTTP. Anonymous FTP access leaks two files: one containing a possible username hint and one containing a password list. With those clues, we brute-force SSH, log in as `lin`, grab the user flag, then escalate privileges through a `sudo` rule allowing `/bin/tar` as `root`.

The whole thing feels like a neon saloon where the bartender accidentally left the admin password list on the counter.

---

## 🎯 Objectives

- 🔎 Enumerate open services with Nmap
- 📂 Access anonymous FTP
- 🧾 Download and inspect `task.txt` and `locks.txt`
- 🔐 Use Hydra to find valid SSH credentials
- 🐚 Log in over SSH as `lin`
- 🚩 Retrieve `user.txt`
- ⬆️ Check sudo permissions with `sudo -l`
- 👑 Abuse `tar` via GTFOBins to read `root.txt`

---

## 📁 Repository Contents

- 📘 [English walkthrough](BountyHacker-EN.md)
- 📙 [French walkthrough](BountyHacker-FR.md)
- 📝 [Original notes](BountyHacker-Notes.md)
- 🖼️ [Room logo](bounty-hacker-logo.png)

---

## 🧭 Attack Path

1. Scan the target and identify FTP, SSH, and HTTP.
2. Log in to FTP anonymously.
3. Download `task.txt` and `locks.txt`.
4. Use `task.txt` to identify the likely user: `lin`.
5. Use `locks.txt` as the SSH password list.
6. Crack SSH credentials with Hydra.
7. Log in as `lin` and collect the user flag.
8. Run `sudo -l` and find that `lin` can run `/bin/tar` as `root`.
9. Use the GTFOBins `tar` sudo technique to spawn a root shell.
10. Read the root flag.

👉 **Insight:**
This room is a great reminder that "boring" files are often not boring at all. A task note and a password list are basically a treasure map wearing a fake mustache.

---

## 🔗 References

- [TryHackMe - Bounty Hacker](https://tryhackme.com/room/cowboyhacker)
- [GTFOBins - tar](https://gtfobins.github.io/gtfobins/tar/)
- [Hydra](https://github.com/vanhauser-thc/thc-hydra)
