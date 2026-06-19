---
title: "Uso de Mimikatz con BetterSafetyKatz en un entorno con Windows Defender"
description: "Guía técnica sobre BetterSafetyKatz y Mimikatz orientada a laboratorios, estudio de Active Directory y auditorías autorizadas. Incluye compilación, ofuscación, exclusiones en Defender y ejecución desde una consola con privilegios de administrador, presentada de forma clara y lista para publicar."
date: 2026-06-14
categoria: "Herramientas"
author: "Ghxstsec"
draft: false
type: "post"
---


Aqui os dejo una manera que me ha funcionado en varios examenes de certificaciones para bypassear el uso de mimikatz usando BetterSafetyKatz teniendo acceso solo a una consola como administrador pero con Windows Defender por detras:


Primero, antes de subir todo lo necesario a la maquina victima compilaremos y obfuscaremos el binario de BetterSafetyKatz, aun que creemos una excepcion en el desktop no esta de mas obfuscarlo con ConfuserEX


Primero nos descargamos [BetterSafetyKatz](https://github.com/Flangvik/BetterSafetyKatz)


![Captionless image](/images/writeups/safetykatz/1.png)


Nos guardaremos todo como un zip, lo descomprimiremos, abrimos visual studio y lo compilaremos:


![Captionless image](/images/writeups/safetykatz/2.png)


Abriremos un proyecto o solucion y abriremos el .sln de BetterSafetyKatz


![Captionless image](/images/writeups/safetykatz/3.png)


Le daremos a compilar solucion y nos creara una carpeta en la root folder del user en el que estemos:


![Captionless image](/images/writeups/safetykatz/4.png)


Dentro tendemos el binario de SafetyKatz, ahora con [ConfuserEx](https://github.com/mkaring/ConfuserEx) nos lo obfuscaremos


![Captionless image](/images/writeups/safetykatz/5.png)


en los tres puntitos de cada opcion iremos marcando cada cosa, en Base Directory pondremos el directorio base de BetterSafetyKatz, en OutputDirectory se nos creara el directorio Confused, y en el "+" de en el medio a la derecha usaremos el ejecutable de safetykatz, en la seccion de settings:


![Captionless image](/images/writeups/safetykatz/6.png)


Iremos poniendo al binario de BetterSafetyKatz.exe las distintas reglas que queramos, podeis ir probando cada conjunto de ajustes para ver de que manera podeis bypassearlo mejor, esto es un poco orientativo, en este caso simulando la maquina victima yo me estare creando una excepcion a traves de powershell.


![Captionless image](/images/writeups/safetykatz/7.png)


Una vez en la pestana "Protect!" le daremos al boton "Protect!" 


Este proceso nos creara el binario obfuscado a nuestra manera el binario BetterSafetyKatz en la carpeta confused.


![Captionless image](/images/writeups/safetykatz/8.png)


Simulando un entorno de una maquina victima windows estare usando un supuesto escenario en el que nos hemos escalado una sola sesion de cmd como admin, ya que hay que ser admin para ejecutar mimikatz, asi que estare usando una cmd, pasando a una powershell, creando una excepcion en el desktop de mi user y subiendo los archivos necesarios desde un supuesto share compartido como el que te creas en XFreeRDP.


![Captionless image](/images/writeups/safetykatz/9.png)


este sera mi escenario, una cmd como un user con privs de admin. primero crearemos una excepcion en el desktop de este mismo user.


![Captionless image](/images/writeups/safetykatz/10.png)


Una vez con la exclusion creada, asumiendo que nos hicimos un share compartido en RDP, nos subiremos el [mimikatz_trunk.zip](https://github.com/gentilkiwi/mimikatz/releases/tag/2.2.0-20220919) 


![Captionless image](/images/writeups/safetykatz/11.png)


Lo pasaremos al escritorio de nuestro user:


![Captionless image](/images/writeups/safetykatz/12.png)


Tambien subiremos siguiendo el mismo metodo el BetterSafetyKatz obfuscado.


![Captionless image](/images/writeups/safetykatz/13.png)


Y con la shell de administrador nos estaremos ejecutando el binario de la siguiente manera:


![Captionless image](/images/writeups/safetykatz/14.png)


Y ahi estaria, mimikatz corriendo completamente funcional, en un windows 10 actual con solo una cmd de admin.


Hasta la proxima :p