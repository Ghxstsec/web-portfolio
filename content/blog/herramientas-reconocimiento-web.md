---
title: "Herramientas Esenciales para Reconocimiento Web"
description: "Recopilación de herramientas para enumeración web: fuzzing, crawling, extracción de endpoints y detección de tecnologías."
date: 2026-06-08
categoria: "Herramientas"
author: "Ghxstsec"
draft: false
type: "post"
---

## Fuzzing y Descubrimiento de Rutas

### Gobuster

```bash
# Fuzzing de directorios
gobuster dir -u http://target.com -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt

# Fuzzing de subdominios
gobuster vhost -u target.com -w subdomains.txt

# Fuzzing con extensiones
gobuster dir -u http://target.com -w words.txt -x php,txt,html,asp
```

### ffuf

```bash
# Fuzzing básico de directorios
ffuf -u http://target.com/FUZZ -w wordlist.txt

# Fuzzing con extensiones
ffuf -u http://target.com/FUZZ -w wordlist.txt -e .php,.txt,.html

# Fuzzing de parámetros GET
ffuf -u http://target.com/page.php?FUZZ=test -w params.txt

# Fuzzing de subdominios
ffuf -u http://FUZZ.target.com -w subdomains.txt -H "Host: FUZZ.target.com"
```

## Crawling y Extracción de Endpoints

### Katana

```bash
# Crawling básico
katana -u http://target.com

# Crawling con extracción de endpoints JS
katana -u http://target.com -jc

# Crawling con depth y subdomains
katana -u http://target.com -d 3 -subs
```

### gospider

```bash
# Crawling básico
gospider -s http://target.com

# Crawling con subdominios y retraso
gospider -s http://target.com --subs -t 3 -d 2
```

## Detección de Tecnologías

### WhatWeb

```bash
# Detección básica
whatweb http://target.com

# Detección agresiva (--aggressive)
whatweb -a 3 http://target.com
```

### Wappalyzer CLI

```bash
# Detección de tecnologías
wappalyzer http://target.com
```

## Endpoints y Secretos

### Nuclei

```bash
# Escaneo básico de templates
nuclei -u http://target.com

# Escaneo con templates específicos
nuclei -u http://target.com -t ~/nuclei-templates/http/

# Escaneo de techs y vulnerabilidades
nuclei -u http://target.com -as -etags "dos,fuzz"
```

## Proxy / Intercepción

### Caido / Burp Suite

- **Caido**: Alternativa moderna a Burp, liviana en navegador.
- **Burp Suite**: Clásico para interceptar y modificar tráfico HTTP/S.

Usos comunes:
- Interceptar requests y modificarlas en tiempo real.
- Repetir requests modificadas (Repeater).
- Fuzzing de parámetros (Intruder).
