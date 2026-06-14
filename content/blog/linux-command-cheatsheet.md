---
title: "Linux Command Cheatsheet — Productividad en Terminal"
description: "Comandos esenciales de Linux para el día a día: permisos, procesos, red, búsquedas y gestión del sistema."
date: 2026-06-05
categoria: "Cheatsheet"
author: "Ghxstsec"
draft: false
type: "post"
---

## Permisos y Propiedad

```bash
# Cambiar permisos (modo octal)
chmod 755 archivo        # rwxr-xr-x
chmod 600 archivo        # rw-------
chmod +x archivo         # añadir ejecución

# Cambiar propietario
chown user:group archivo

# Permisos recursivos en directorio
chmod -R 750 directorio/

# Atributos extendidos (Linux)
chattr +i archivo        # inmutable (ni root lo borra)
lsattr archivo           # listar atributos
```

## Procesos

```bash
# Ver procesos en tiempo real
htop
top

# Buscar proceso por nombre
pgrep -a nginx

# Matar proceso por PID
kill -9 <PID>            # SIGKILL forzado
kill -15 <PID>           # SIGTERM graceful

# Matar por nombre
pkill -f "nombre"

# Prioridad (niceness)
nice -n -10 comando      # ejecutar con prioridad alta
renice -n -10 -p <PID>   # cambiar prioridad
```

## Red

```bash
# Puertos abiertos locales
ss -tlnp
netstat -tlnp

# Resolver nombre DNS
dig target.com
nslookup target.com

# Traza de ruta
traceroute target.com
mtr target.com            # traceroute + ping continuo

# Escuchar tráfico en puerto
nc -lvnp 4444            # listener TCP
nc -lvnp 4444 -u         # listener UDP
```

## Búsquedas

```bash
# Buscar archivos por nombre
find / -name "*.conf" 2>/dev/null

# Buscar archivos por tamaño
find / -size +100M 2>/dev/null

# Buscar texto en archivos
grep -rn "patron" /directorio/

# Buscar con regex
grep -E "^[0-9]{3}" archivo
```

## Compresión

```bash
# Tar + Gzip
tar -czvf archivo.tar.gz directorio/
tar -xzvf archivo.tar.gz

# Tar + Bzip2 (mejor compresión)
tar -cjvf archivo.tar.bz2 directorio/
tar -xjvf archivo.tar.bz2

# Zip
zip -r archivo.zip directorio/
unzip archivo.zip
```

## Sistema

```bash
# Disco
df -h                    # espacio en discos
du -sh *                 # tamaño de archivos/dirs

# Memoria
free -h

# Información del sistema
uname -a                 # kernel
lsb_release -a           # distro
lscpu                    # CPU
lsblk                    # dispositivos de bloque
```

## Tips de Productividad

```bash
# Historial con timestamp
history | tail -10

# Ejecutar último comando con sudo
sudo !!

# Sustitución en el comando anterior
!!:gs/error/warning/

# Repetir cada N segundos
watch -n 5 comando

# Ctrl+Z + bg: mandar proceso a background
Ctrl+Z
bg
disown -h                # desligar del terminal
```
