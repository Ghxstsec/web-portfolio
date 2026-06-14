---
title: "Nmap Cheatsheet — Escaneo de Redes"
description: "Guía de referencia rápida con los comandos esenciales de Nmap para escaneo de puertos, detección de servicios, y enumeración de redes."
date: 2026-06-10
categoria: "Cheatsheet"
author: "Ghxstsec"
draft: false
type: "post"
---

## Escaneo Básico

```bash
# Escaneo rápido de puertos top 1000
nmap -sS -T4 <target>

# Escaneo completo (todos los puertos)
nmap -p- -T4 <target>

# Escaneo con detección de versión y OS
nmap -sV -O -T4 <target>
```

## Detección de Servicios

```bash
# Detección de versiones agresiva
nmap -sV --version-intensity 9 <target>

# Scripts NSE por defecto
nmap -sC <target>

# Escaneo completo: scripts + versiones + OS
nmap -sC -sV -O <target>
```

## Scripts NSE Útiles

```bash
# Enumeración HTTP
nmap --script http-enum <target>

# Enumeración SMB
nmap --script smb-enum-shares <target>

# Vulnerabilidades comunes
nmap --script vuln <target>

# Enumeración de usuarios FTP
nmap --script ftp-anon <target>
```

## Evasión de Firewalls

```bash
# Fragmentación de paquetes
nmap -f <target>

# Usar decoys (falsas IPs)
nmap -D RND:10 <target>

# Puerto fuente específico
nmap --source-port 53 <target>

# Escaneo lento (evita detección IDS)
nmap -T1 -sS <target>
```

## Salida y Formatos

```bash
# Salida normal
nmap -oN scan.txt <target>

# Salida en XML
nmap -oX scan.xml <target>

# Todos los formatos
nmap -oA scan <target>

# Salida grepeable
nmap -oG scan.gnmap <target>
```

## Escaneo de Red Local

```bash
# Descubrimiento de hosts activos
nmap -sn 192.168.1.0/24

# Ping sweep con ICMP
nmap -PE -PP -PM 192.168.1.0/24

# ARP scan (red local)
nmap -PR 192.168.1.0/24
```
