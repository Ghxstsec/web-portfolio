---
title: "Write-up maquina Profetas DockerLabs"
description: "Guía completa paso a paso (Writeup) para vulnerar la máquina Profetas de DockerLabs. Aprende cómo explotar una vulnerabilidad XXE (XML External Entity) para leer archivos sensibles, extraer la clave id_rsa de Jeremías y escalar privilegios hasta ser Root."
date: 2026-03-05
author: "Ghxstsec"
creator: "mikisbd"
rating: 4.2 
dificultad: "Medio"
draft: false
type: "post"
---

Write-up máquina Profetas DockerLabs
====================================

Por aquí os dejo mi write-up para esta máquina de DockerLabs

Una vez desplegada la máquina con el script automático, comenzamos con la auditoria:

Enumeración
-----------

Como siempre, empezamos con un escaneo de puertos con nmap, el comando que uso yo es:

```
sudo nmap -p- -Pn -n -sCV -min-rate 5000 -T5 -oN targeted -v 172.17.0.2
```

> te explico un poco los parametros de el comando por aqui:
> 
> **sudo**: para ejecutarlo como administrador, en caso de que haga falta.
> 
> **-p**-: para escanear todo el rango de puertos: 1–65535
> 
> **-Pn**: Omitir el ping inicial, en caso de firewall
> 
> **-n**: no hacer resolucion DNS
> 
> **-sCV**: escaneo con scripts basicos de reconocimiento, tanto servicios como las versiones de los servicios
> 
> **-min-rate 5000**: marcar la cantidad de paquetes minima
> 
> **-T5**: basicamente a que velocidad quieres que vaya el escaneo, mayor el numero, mayor el ruido causado
> 
> **-oN**: exportar el escaneo a un archivo en formato normal
> 
> **targeted**: nombre del archivo al que exportar
> 
> **-v**: verbose
> 
> **<IP>**: La IP a la que quieres hacer el escaneo

![Resultado del escaneo de nmap](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*IAJzOhyVCN--28EX8RQkOA.png)

Podemos ver SSH, que en esta máquina es bastante importante, lo veremos más adelante.

Vamos con la web:

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*sumOtJdK2lfCzXeIjD3I3Q.png)

En la descripción de la máquina en DockerLabs podremos ver el flujo de vulnerabilidades usado en esta máquina, así que sabemos que habrá una **SQLi**

![captionless image](https://miro.medium.com/v2/resize:fit:920/format:webp/1*h_IH-IjJEom4fjt4D54hiA.png)

El payload usado es usar el usuario listado en la imagen de encima, junto con cualquier password.

![Primera web](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*UCk1r9QM5JJSB7J6fOPwCA.png)

¿Okay? Bueno, podremos ver que tenemos un botón que simplemente actualiza unos “servicios” con nombres de profetas. Vamos a ver el código fuente:

![captionless image](https://miro.medium.com/v2/resize:fit:1270/format:webp/1*mBhBDYL9K3NnO5HZDs_GDA.png)

Si bajamos abajo del todo del código fuente nos podemos encontrar una cadena de base 64, en la web se ve que está en color negro, acompañado con el fondo, así que no se ve a simple vista, pero lo puedes subrayar, y se empezaría a ver, vamos a decodificar la cadena de base 64

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*3kErZ6s49z8go3uuHoQjTA.png)

hmmm, interesante, o sea podemos deducir que los profetas listados en la web, usan la misma contraseña que su usuario, o su nombre, sin el prefijo de “srv-”

bueno, si pulsamos cerrar sesión podemos ver que nos lleva directamente a este portal de inicio de sesión:

![captionless image](https://miro.medium.com/v2/resize:fit:1160/format:webp/1*rXPGhcIDgfIJt4wgH61g9Q.png)

Podemos ver un usuario en la parte baja del formulario: notadmin, así que probaremos a inventar un email, como ejemplo uso: **notadmin@notadmin.com**

![captionless image](https://miro.medium.com/v2/resize:fit:1164/format:webp/1*2KWzwX9wxcdYqnTgSqz9BQ.png)

Pero si probamos con otro usuario podemos ver que el código de error cambia completamente:

![captionless image](https://miro.medium.com/v2/resize:fit:1132/format:webp/1*qpesnj7BdmYmn6wpRABZgA.png)

Así que vamos con el usuario **notadmin@notadmin.com**

¿Os acordáis del SQLi? Si sabes lo básico sabrás que puedes usar casi el mismo payload pero en la contraseña, que sería este payload:

![captionless image](https://miro.medium.com/v2/resize:fit:200/format:webp/1*1HO5M48kvdpaZnYL-TR35Q.png)

(No lo puedo poner por texto, ya que médium se cae)

Así que probamos con el usuario anteriormente encontrado y con el payload anterior nombrado:

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*MXs5xT-IKDQUEu4QF07yYw.png)

¿Facilillo no?

Bueno, vamos al portal2

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*SlHBj_FD-zE5OV4NIi37uA.png)

pues se usa **XML**, pues vamos a por un XXE no? (XML External Entity)

Le pido a Gemini que me haga un payload para esta vulnerabilidad

![(Lo siento mucho, pues si pongo este codigo en un bloque de codigo, cae medium por alguna razon.)](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*rgq3kdgZ39MqRPKh8akDTg.png)![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*WAHjyGfXb2ReUm_n_UAU3g.png)

¿Os acordáis de la cadena de base 64? Los usuarios usan la misma contraseña que su nombre de usuario.

Podemos ver que tenemos los usuarios **Jeremías y ezequiel** a nivel de sistema, creamos nuestra wordlists para la fuerza bruta con hydra:

```
jeremias
ezequiel
```
![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*6fylpdsXL_qfCbslVBKvOQ.png)

Entramos por SSH y tendremos el user flag (Se puede compartir, ya que la plataforma de DockerLabs no tiene ningún sistema definido de flags)

![captionless image](https://miro.medium.com/v2/resize:fit:1310/format:webp/1*Fh3pcvrTEU4PU7xLWCDBXw.png)

Podemos ver que tenemos un archivo **.pyc (Python, Bytecode), El único problema de estos archivos es que están compilados, entonces están ofuscados, pero hay herramientas para desobfuscarlos:**

[GitHub - zrax/pycdc: C++ python bytecode disassembler and decompiler
--------------------------------------------------------------------

### C++ python bytecode disassembler and decompiler. Contribute to zrax/pycdc development by creating an account on GitHub.

github.com](https://github.com/zrax/pycdc?source=post_page-----8ad0a852297c---------------------------------------)

Tendrás que compilarlo con CMake, una vez compilado su uso será así:

```
./pycdc/pycdas ezequiel.pyc
```

Nos devolverá un código bastante largo, pero al final podremos ver algo interesante:

![captionless image](https://miro.medium.com/v2/resize:fit:1076/format:webp/1*Y7QXiHqNT2oowEx_AmA5hg.png)

parece la contraseña, pero bueno, para que no os calentéis la cabeza, resulta que es juntando las dos cadenas de texto

```
234r3fsd2-34fsdrr32
```

El nombre del archivo nos dirá a qué usuario deberíamos probar de iniciar sesión, así que probamos con SSH:

![captionless image](https://miro.medium.com/v2/resize:fit:1314/format:webp/1*OCF-1qBCpdKl_-z-1MOL9w.png)

Si vemos el archivo “acces0.txt” podemos ver esto:

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*Px6xNwlaYLxKRsbjUgCxWw.png)

¿Pero como lo podemos leer? Ejecutamos **sudo -l para verlo:**

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*3W0y38OgUQu44ONfBjDLiA.png)

¿Què és croc?

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*s2e2cRv7e9gsWNhz0gm2Ww.png)

Desde aquí podrás instalar la herramienta croc:

[GitHub - schollz/croc: Easily and securely send things from one computer to another :package:
---------------------------------------------------------------------------------------------

### Easily and securely send things from one computer to another :crocodile: :package: - GitHub - schollz/croc: Easily and…

github.com](https://github.com/schollz/croc?source=post_page-----8ad0a852297c---------------------------------------)

lo ejecutaremos en la máquina remota:

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*a8JFuPctrnHgHZeDjbD-Hw.png)

Así tendremos alojado el archivo en la máquina remota, y desde nuestra máquina local haremos esto:

![captionless image](https://miro.medium.com/v2/resize:fit:1220/format:webp/1*Wbx7MHL2ujAEYfD8cNlikA.png)

veremos el archivo:

![captionless image](https://miro.medium.com/v2/resize:fit:708/format:webp/1*graZD4J4OxXVIO04fG0_lA.png)

Así que iniciaremos sesión como root:

![captionless image](https://miro.medium.com/v2/resize:fit:778/format:webp/1*BOEJ1AhY4RHHrE4ERRG9Ag.png)

Y hasta ahí llegaría la máquina de hoy, espero que os haya encantado, si os ha gustado podéis seguirme tanto por aquí como en mis otras redes sociales para enteraros de todos los recursos que explique :)
```
👋 Sobre el autor

¡Hola! Soy Ghxstsec, un entusiasta de la ciberseguridad y pentester. Me dedico a documentar mi viaje por el complejo mundo de la seguridad ofensiva.

Actualmente, poseo las certificaciones eJPTv2 y eCPPTv3. Mi objetivo es intentar ayudar a sobrellevar la brecha entre el aprendizaje teórico y la práctica, al tiempo que comparto mis experiencias sinceras con la comunidad. Cuando no estoy en una maratón de exámenes de 24 horas, me puedes encontrar haciendo ejercicios en Try Hack Me o investigando los últimos artículos sobre ciberseguridad.

✉️ Conéctate conmigo:

LinkedIn: [LinkedIn](https://www.linkedin.com/in/joel-morillas-aka-ghxstsec-16a988260/)
GitHub: [GitHub](https://github.com/Ghxstsec)
Twitter/X: [Twitter](https://x.com/Louikizz)
Try Hack Me: [THM](https://tryhackme.com/p/Ghxstsec)

¡Muchas gracias por leer todo el artículo! ¡Te deseo mucha suerte en tus próximos logros! 😊
