---
title: "Write-up maquina dance-samba de DockerLabs"
description: "Guia completa paso a paso de como resolver la maquina dance-samba de la plataforma DockerLabs. A traves de enumeracion de FTP, envenenamiento de SSH y Missconfigurations en el binario Sudo"
date: 2026-03-06
creator: "d1se0"
rating: 4.6
dificultad: "medio"
author: "Ghxstsec"
draft: false
type: "post"
---

Writeup dockerlabs dance-samba
==============================

Primero encendemos la máquina:

![captionless image](https://miro.medium.com/v2/resize:fit:1284/format:webp/1*0CrS2K5xXbubVPQWaYkHRw.png)

Y como siempre empezaremos con la enumeración con NMAP

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*2htGECbcDSHfem174qqPrA.png)

Podemos ver un FTP y un Samba, vamos primero a por el FTP

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*wgVx-nNLY2XTKNCMus6YNw.png)

Podemos ver que muy seguramente tengamos un usuario que se llama “Macarena” y seguramente use la contraseña “donald”

Vamos a intentar acceder a Samba con esas credenciales, pero primero enumeramos los shares del Samba

```
nxc smb 172.17.0.2 -u 'macarena' -p 'donald'
```

![Samba shares](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*RDwGbQUVR4kbGGtoLS1fSg.png)![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*Jr0WZ7pI-VqK7fmvUwDfpA.png)

Aquí podremos ver el user.txt.


Aquí podremos ver el user.txt.

Pensando en como conseguir acceso a la máquina víctima, podemos ver que en samba hay una carpeta llamada .bash_history, entonces muy seguramente podremos incluir una carpeta .ssh y unas authorized_keys, creando acceso a la máquina con nuestra clave privada y al mismo tiempo persistencia

Así procedo:

Primero generamos unas keys:

```
ssh-keygen -f id_rsa
```

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*qNoxC9iPMwtAhX9nxIjdug.png)

cambiamos el nombre de id_rsa.pub a authorized_keys

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*NdKaWoHj03yWviVqGAk78A.png)

Iniciamos sesión en el samba víctima y creamos la carpeta .ssh

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*kDERs4szQKai00zTtLBIsQ.png)

Subimos nuestro archivo de authorized_keys

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*qQPMsMB2tA33Aoxk4P3bEg.png)

e iniciamos sesión:

```
ssh macarena@172.17.0.2 -i id_rsa
```

en este momento tocará enumerar la máquina, haciendo la búsqueda de archivos ocultos tipicos, por ejemplo en /opt o /tmp o otros directorios en /home, podemos encontrar esto en /home/secret:

![captionless image](https://miro.medium.com/v2/resize:fit:986/format:webp/1*vlbNZiN-w6Zb1oas9el_wA.png)

lo pasamos por cyberchef con el recipe “magic”

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*FNNgu5ss1qGKH0pkOZS1nA.png)

Así que tenemos la contraseña de macarena, vamos a ver él sudo -l que tiene para este usuario

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*CRbcOIJKa5pKxfOxVK6bUg.png)

Durante la enumeración anterior de la máquina víctima pudimos ver en el directorio /opt con un archivo un tanto raro dentro, vamos a revisarlo con sudo y el comando file

```
sudo -u root /usr/bin/file -f /opt/password.txt
```

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*eIQxzVcudtN7utE6W3k4UQ.png)

asi que asi terminaria esta maquina:

```
macarena@441ea389a49f:/opt$ su root
Password: 
su: Authentication failure
macarena@441ea389a49f:/opt$ su root
Password: 
root@441ea389a49f:/opt# ls
password.txt
root@441ea389a49f:/opt# cd /root
root@441ea389a49f:~# ls
root.txt  true_root.txt
root@441ea389a49f:~# cat root.txt 
It's not that easy, first root.
root@441ea389a49f:~# cat true_root.txt 
efb6984b9b0eb57451aca3f93c8ce6b7
root@441ea389a49f:~# 
```


Muchas gracias por llegar hasta aquí, y si me quieres conocer un poco más; abajo tienes mis enlaces de interés.

¡Saludos!


👋 Sobre el autor

¡Hola! Soy Ghxstsec, un entusiasta de la ciberseguridad y pentester. Me dedico a documentar mi viaje por el complejo mundo de la seguridad ofensiva.

Actualmente, poseo las certificaciones eJPTv2, eCPPTv3 y Google Cybersecurity Professional Certificate. Mi objetivo es intentar ayudar a sobrellevar la brecha entre el aprendizaje teórico y la práctica, al tiempo que comparto mis experiencias sinceras con la comunidad. Cuando no estoy en una maratón de exámenes de 24 horas, me puedes encontrar haciendo ejercicios en Try Hack Me o investigando los últimos artículos sobre ciberseguridad.

✉️ Conéctate conmigo:

LinkedIn: [LinkedIn](https://www.linkedin.com/in/joel-morillas-aka-ghxstsec-16a988260/)
GitHub: [GitHub](https://github.com/Ghxstsec)
Twitter/X: [Twitter](https://x.com/Louikizz)
Try Hack Me: [THM](https://tryhackme.com/p/Ghxstsec)

¡Muchas gracias por leer todo el artículo! ¡Te deseo mucha suerte en tus próximos logros! 😊

