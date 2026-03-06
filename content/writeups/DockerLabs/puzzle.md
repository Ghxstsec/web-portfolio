---
title: "Write-up Puzzle DockerLabs"
description: "Guia completa de la enumeracion y la explotacion de la maquina puzzle de DockerLabs"
date: 2026-1-03
creator: "Pyth0nK1d"
rating: 5 
dificultad: "Media"
author: "Ghxstsec"
draft: false
type: "post"
---

Puzzle Write-up Docker Labs 🐧
==============================

![captionless image](https://miro.medium.com/v2/resize:fit:1072/format:webp/1*ri5P5IpftZPcJVZZTmWGrA.png)

Bueno, por aqui os dejo mi write-up de la maquina puzzle de Dockerlabs, de dificultad media

**RECONOCIMIENTO INICIAL**
--------------------------

Como en cualquier CTF, empezaremos con la enumeracion de puertos con nmap

```
nmap -p- -Pn -sCV -min-rate 5000 -T5 -oN targeted 172.17.0.2
```

Que nos da este resultado:

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*f3ua5yJxqSoZni1vU-jqUA.png)

Podemos ver muchas entradas en el robots.txt, pero no parece ser interesante del todo, ya que lo mas importante esta al final escondido del archivo robots.txt Parte de abajo del archivo robots.txt (http://172.17.0.2/robots.txt)

![Parte de abajo del archivo robots.txt (http://172.17.0.2/robots.txt)](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*bVcJ8xklqNX8dQ8JCqfxNQ.png)

**ACCESO INICIAL**
------------------

Pasamos la contraseña por crackstation

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*KtQ4ON1P0_fZSaLEaygtbA.png)

A parte, para ir ahorrando tiempo nos abriremos una pestaña de cyberchef, y nos iremos guardando en el input todas las piezas

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*8MwiejO_6Wi--rSm4eP36Q.png)

Volviendo con la contraseña, iniciaremos sesion con el usuario paco y la contraseña “rompecabezas”

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*yX57mB0ru__-XukZPFQEyA.png)![captionless image](https://miro.medium.com/v2/resize:fit:1242/format:webp/1*-PUy6XCLimrXfEpIith3Zw.png)

Nos enviara a un panel del usuario paco, podremos ver arriba a la izquierda una seccion llamada “Mi Perfil”, entramos:

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*wQ56BY9-o_3yfewAvnbI7w.png)

Una vez dentro de mi perfil, podremos ver que hay un parametro llamado username en la URL, lo cambiamos por admin

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*8OzmX7PMG8KABiu9e-KXxQ.png)![captionless image](https://miro.medium.com/v2/resize:fit:1216/format:webp/1*iTvztFnDHTi7krmNbd06nQ.png)

Podremos ver que cambiando el parametro admin podremos ver el panel de usuario de admin, y ha dejado una nota con su contraseña, so silly :p

iniciaremos sesion con el usuario admin y su contraseña

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*H9q7fK07y_g_1ur5nHcDsA.png)

Apuntamos la pieza 2 en cyberchef:

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*MBqXhfzisS9krX5IgI2alg.png)

Iremos a la zona admin:

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*g86JT_rv9AZOG63PD1Jtag.png)

Encontraremos un enigma oculto (?), simplemente se lo pasamos a gemini y que lo resuelva el :)

![captionless image](https://miro.medium.com/v2/resize:fit:932/format:webp/1*njokH0MGUhC9gt9QZKetsg.png)![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*OUca37Qkf0MjvVGB-0mAaA.png)

Podremos ver este resultado:

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*Co49IjDTQmdbt-s-ha98pQ.png)

Apuntamos la pieza 3 en cyberchef:

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*NVsdbuwv-PY6HrpypuD6-g.png)

Si en la web del enigma bajamos un poco nos encontramos con esto:

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*yajwvsL_XPylcuDavMA9tQ.png)

Por la respuesta al enigma asumimos que hay una SQLi en esta web, seguramente en el campo de escribir los filtros: probamos con un payload union select

```
')union select 1,2, schema_name from information_schema.schemata-- -
```

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*xUHKuHsGQDHt-WbZXeHd2A.png)

Veremos un nuevo apartado llamado “secreto maximo” con la cuarta y ultima pieza, la ponemos en cyberchef con el filtro from base64 y…

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*wSmZV_I_p3G1kv_a0-UNdw.png)

Suponiendo que son claves SSH, iniciaremos sesion en ssh con el usuario Pyth0nK1d:

![Comando de terminal de ssh](https://miro.medium.com/v2/resize:fit:1014/format:webp/1*cU9y7ot-z0xsaE1_5CsLCA.png)

Con la contraseña del usuario

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*RD0g2RL_EKTH0Pc0qdG-ag.png)

usaremos algunos comandos para enumerar la maquina, comprobaremos los archivos con permisos mal configurados con find y las capabilities

![captionless image](https://miro.medium.com/v2/resize:fit:1142/format:webp/1*AnHR85cUbeLX_pE51YW1eg.png)

Podremos ver que tenemos capabilities en el binario de python3, visitamos la pagina de GTFOBins ([https://gtfobins.github.io/gtfobins/python/](https://gtfobins.github.io/gtfobins/python/)) y escalaremos privilegios con el binario de python3

![captionless image](https://miro.medium.com/v2/resize:fit:904/format:webp/1*hRr7EK5kaElccv7U3S8_PA.png)![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*7Dy19sz5BHY23ebO_2iAHA.png)

y podremos ver las flags del directorio /home y /root :)

y hasta ahi este writeup, espero que os haya ayudado :D

¡Saludos!

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

