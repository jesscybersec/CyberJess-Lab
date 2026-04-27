# TryHackMe - RootMe

Beginner-friendly walkthrough for the **RootMe** CTF room on TryHackMe.

## Languages

- GB English: [RootMe-EN.md](RootMe-EN.md)
- FR Français: [RootMe-FR.md](RootMe-FR.md)

---

> "Find the upload, bend the filter, own the box."

---

## Overview

**RootMe** is a beginner CTF focused on classic web enumeration, file upload bypass, reverse shell execution, and Linux privilege escalation.

The attack path starts with HTTP enumeration, leads to an upload form under `/panel/`, then uses a `.php5` extension bypass to execute a PHP reverse shell from `/uploads/`. Privilege escalation is completed through a SUID-enabled `python2.7` binary.

## Objectives

- Enumerate exposed services and web directories
- Identify the upload panel
- Bypass the PHP upload filter
- Catch a reverse shell as `www-data`
- Retrieve `user.txt`
- Abuse SUID `python2.7` for privilege escalation
- Retrieve `root.txt`

## Repository Contents

- [English walkthrough](RootMe-EN.md)
- [French walkthrough](RootMe-FR.md)
- [Original notes](Notes.md)
- [Screenshots](screenshots/)

## Attack Path

1. Scan the target and identify SSH plus Apache HTTP.
2. Enumerate web directories and find `/panel/` and `/uploads/`.
3. Upload a PHP reverse shell using the `.php5` extension.
4. Trigger the uploaded shell from `/uploads/`.
5. Read the user flag.
6. Find SUID binaries and exploit `/usr/bin/python2.7`.
7. Read the root flag.

## References

- [TryHackMe - RootMe](https://tryhackme.com/room/rrootme)
- [GTFOBins - Python](https://gtfobins.github.io/gtfobins/python/)
- [HackTricks - Reverse Shells](https://book.hacktricks.wiki/en/generic-hacking/reverse-shells/linux.html)
