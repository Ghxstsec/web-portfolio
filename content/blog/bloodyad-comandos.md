---
title: "Usage y comandos basicos de BloodyAD"
description: "Guía técnica con una recopilación organizada de comandos de BloodyAD, explicados por categorías para facilitar su consulta en laboratorios, estudio de Active Directory y auditorías autorizadas. Incluye sintaxis general, enumeración, gestión de cuentas, modificación de atributos, permisos, delegación y restauración de objetos, todo presentado de forma clara y lista para publicar en una web técnica."
date: 2026-06-14
categoria: "Herramientas"
author: "Ghxstsec"
draft: false
type: "post"
---

# BloodyAD: comandos, función y contexto de uso

## Sintaxis general:

Formato base habitual:

```bash
bloodyAD --host <dc> -d <dominio> -u <usuario> -p <password> <acción>
```

Variantes de autenticación y formato:

```bash
bloodyAD --host <dc> -d <dominio> -u <usuario> -k <acción>
```

```bash
bloodyAD --host <dc> -d <dominio> -u <usuario> -p :<hash> <acción>
```

```bash
bloodyAD --host <dc> -d <dominio> -u <usuario> -p <secreto> -f rc4 <acción>
```

### Parámetros comunes

- `--host`: controlador de dominio o servidor objetivo.
- `-d`: nombre del dominio.
- `-u`: usuario.
- `-p`: contraseña o material alternativo compatible.
- `-k`: uso de Kerberos.
- `-f`: especifica formato del secreto o del material de autenticación cuando aplica.

## Lectura de objetos y atributos

### Obtener información de un objeto

```bash
bloodyAD --host $dc -d $domain -u $username -p $password get object $target_username
```

**Qué hace:** consulta un objeto del directorio y devuelve sus datos.

**Dónde aplicarlo:** verificación inicial de usuarios, grupos, equipos u otros objetos antes de cambios o análisis posteriores.

### Leer un atributo concreto de un objeto

```bash
bloodyAD --host $dc -d $domain -u $username -p $password get object $target_user --attr userPrincipalName
```

**Qué hace:** devuelve únicamente el atributo solicitado.

**Dónde aplicarlo:** validación rápida de propiedades específicas sin revisar toda la salida del objeto.

### Leer contraseña gestionada de gMSA

```bash
bloodyAD --host $dc -d $domain -u $username -p $password get object $target_username --attr msDS-ManagedPassword
```

**Qué hace:** consulta el atributo `msDS-ManagedPassword`.

**Dónde aplicarlo:** revisiones de acceso sobre cuentas de servicio administradas por grupo y análisis de exposición de atributos sensibles.

### Obtener el nivel funcional del bosque

```bash
bloodyAD --host $dc -d $domain -u $username -p $password get object 'DC=crash,DC=lab' --attr msDS-Behavior-Version
```

**Qué hace:** muestra el atributo `msDS-Behavior-Version`.

**Dónde aplicarlo:** inventario del entorno AD, compatibilidad técnica y contexto del laboratorio.

### Obtener la longitud mínima de contraseña

```bash
bloodyAD --host $dc -d $domain -u $username -p $password get object 'DC=crash,DC=lab' --attr minPwdLength
```

**Qué hace:** consulta `minPwdLength`.

**Dónde aplicarlo:** revisión de política de contraseñas y documentación de configuración del dominio.

### Consultar MachineAccountQuota

```bash
bloodyAD --host $dc -d $domain -u $username -p $password get object 'DC=dc,DC=dc' --attr ms-DS-MachineAccountQuota
```

**Qué hace:** devuelve el valor de `ms-DS-MachineAccountQuota`.

**Dónde aplicarlo:** auditorías de configuración base del dominio y análisis de creación de cuentas de equipo.

## Enumeración estructural

### Listar todos los usuarios

```bash
bloodyAD --host $dc -d $domain -u $username -p $password get children --otype useronly
```

**Qué hace:** enumera objetos de usuario.

**Dónde aplicarlo:** inventario de cuentas existentes y reconocimiento del directorio.

### Listar todos los equipos

```bash
bloodyAD --host $dc -d $domain -u $username -p $password get children --otype computer
```

**Qué hace:** enumera objetos de tipo equipo.

**Dónde aplicarlo:** mapeo de activos en el dominio y revisión de infraestructura.

### Listar contenedores

```bash
bloodyAD --host $dc -d $domain -u $username -p $password get children --otype container
```

**Qué hace:** enumera contenedores del directorio.

**Dónde aplicarlo:** análisis de estructura lógica de AD y localización de ramas relevantes.

### Listar relaciones de confianza

```bash
bloodyAD --host $dc -d $domain -u $username -p $password get children --otype trustedDomain
```

**Qué hace:** enumera objetos `trustedDomain`.

**Dónde aplicarlo:** documentación de trusts y topología entre dominios o bosques.

## Búsqueda LDAP

### Ver ayuda de búsquedas extendidas

```bash
bloodyAD --host $dc -d $domain -u $username -p $password get search -h
```

**Qué hace:** muestra las opciones del subcomando de búsqueda.

**Dónde aplicarlo:** preparación de consultas LDAP más específicas.

### Buscar cuentas con SPN

```bash
bloodyAD --host $dc -d $domain -u $username -p $password get search --filter '(&(samAccountType=805306368)(servicePrincipalName=*))' --attr sAMAccountName
```

**Qué hace:** busca objetos de cuenta con `servicePrincipalName` definido.

**Dónde aplicarlo:** clasificación de cuentas de servicio y enumeración temática del entorno.

### Buscar cuentas sin preautenticación Kerberos requerida

```bash
bloodyAD --host $dc -d $domain -u $username -p $password get search --filter '(&(userAccountControl:1.2.840.113556.1.4.803:=4194304)(!(UserAccountControl:1.2.840.113556.1.4.803:=2)))' --attr sAMAccountName
```

**Qué hace:** filtra objetos según flags concretos de `userAccountControl`.

**Dónde aplicarlo:** inventario de configuraciones especiales de autenticación.

### Búsqueda con controles extendidos

```bash
bloodyAD --host $dc -d $domain -u $username -p $password -k get search -c 1.2.840.113556.1.4.2064 -c 1.2.840.113556.1.4.2065
```

**Qué hace:** añade controles LDAP extra a la búsqueda.

**Dónde aplicarlo:** consultas especiales, incluyendo visualización de ciertos objetos eliminados o tombstoned.

## DNS integrado en AD

### Volcar registros DNS desde AD

```bash
bloodyAD --host $dc -d $domain -u $username -p $password get dnsDump
```

**Qué hace:** lista registros DNS accesibles desde el directorio.

**Dónde aplicarlo:** inventario de nombres, servicios y zonas integradas en AD.

### Buscar entradas wildcard en ADIDNS

```bash
bloodyAD --host $dc -d $domain -u $username -p $password get dnsDump | sed -n '/[^\n]*\*/,/^$/p'
```

**Qué hace:** filtra de la salida DNS posibles entradas wildcard.

**Dónde aplicarlo:** revisión de configuración DNS y análisis de comportamiento de resolución.

## Usuarios, grupos y cuentas de equipo

### Añadir un usuario a un grupo

```bash
bloodyAD --host $dc -d $domain -u $username -p $password add groupMember $group_name $member_to_add
```

**Qué hace:** agrega un miembro a un grupo.

**Dónde aplicarlo:** gestión de pertenencias, pruebas de delegación y validación de permisos sobre grupos.

### Cambiar la contraseña de una cuenta

```bash
bloodyAD --host $dc -d $domain -u $username -p $password set password $target_username $new_password
```

**Qué hace:** cambia la contraseña del usuario objetivo.

**Dónde aplicarlo:** ejercicios de administración controlada, validación de permisos o laboratorios.

### Crear una cuenta de equipo

```bash
bloodyAD --host $dc -d $domain -u $username -p $password add computer $computer_name $computer_password
```

**Qué hace:** crea un nuevo objeto de equipo.

**Dónde aplicarlo:** pruebas de creación de cuentas de equipo y validación de cuota o permisos asociados.

### Habilitar una cuenta deshabilitada

```bash
bloodyAD --host $dc -d $domain -u $username -p $password remove uac $target_username -f ACCOUNTDISABLE
```

**Qué hace:** elimina el flag `ACCOUNTDISABLE`.

**Dónde aplicarlo:** revisiones sobre estados de cuenta y capacidad de modificar `userAccountControl`.

## Escritura de atributos

### Modificar el UPN

```bash
bloodyAD --host $dc -d $domain -u $username -p $password set object $old_upn userPrincipalName -v $new_upn
```

**Qué hace:** cambia el atributo `userPrincipalName`.

**Dónde aplicarlo:** administración de identidad, pruebas de escritura sobre atributos y validación posterior.

### Verificar el UPN después del cambio

```bash
bloodyAD --host $dc -d $domain -u $username -p $password get object $target_user --attr userPrincipalName
```

**Qué hace:** consulta el valor actualizado de `userPrincipalName`.

**Dónde aplicarlo:** comprobación de cambios sobre atributos.

### Modificar el atributo `mail`

```bash
bloodyAD --host $dc -d $domain -u $username -p $password set object $target_user mail -v newmail@test.local
```

**Qué hace:** actualiza el valor de `mail`.

**Dónde aplicarlo:** pruebas de escritura delegada en atributos de usuario.

### Modificar `altSecurityIdentities`

```bash
bloodyAD --host $dc -d $domain -u $username -p $password set object $target_user altSecurityIdentities -v 'X509:<RFC822>user@test.local'
```

**Qué hace:** cambia el atributo `altSecurityIdentities`.

**Dónde aplicarlo:** laboratorios sobre mapeo de identidades y escenarios con certificados.

### Modificar `servicePrincipalName`

```bash
bloodyAD --host $dc -d $domain -u $username -p $password set object $target servicePrincipalName -v 'domain/meow'
```

**Qué hace:** escribe el atributo `servicePrincipalName`.

**Dónde aplicarlo:** pruebas sobre cuentas de servicio y escritura de atributos sensibles.

### Modificar MachineAccountQuota

```bash
bloodyAD --host $dc -d $domain -u $username -p $password set object 'DC=dc,DC=dc' ms-DS-MachineAccountQuota -v 10
```

**Qué hace:** cambia el valor global de `ms-DS-MachineAccountQuota`.

**Dónde aplicarlo:** laboratorios o revisiones administrativas sobre configuración del dominio.

## Permisos y control de objetos

### Conceder GenericAll

```bash
bloodyAD --host $dc -d $domain -u $username -p $password add genericAll $DN $target_username
```

**Qué hace:** añade control amplio sobre un objeto a un principal indicado.

**Dónde aplicarlo:** validación de delegación, pruebas ACL y análisis de impacto de permisos.

### Cambiar el owner de un objeto

```bash
bloodyAD --host $dc -d $domain -u $username -p $password set owner $target_group $target_username
```

**Qué hace:** cambia el propietario del objeto objetivo.

**Dónde aplicarlo:** estudios de ACL, herencia y control sobre objetos del directorio.

### Buscar atributos u objetos escribibles

```bash
bloodyAD --host $dc -d $domain -u $username -p $password get writable --detail
```

**Qué hace:** muestra qué elementos son modificables por el principal actual.

**Dónde aplicarlo:** auditorías de delegación, revisión de exposición por permisos y mapeo de capacidades efectivas.

### Buscar elementos eliminados o especiales en ese contexto

```bash
bloodyAD --host $dc -d $domain -u $username -p $password get writable --include-del
```

**Qué hace:** amplía la búsqueda incluyendo objetos eliminados o relacionados.

**Dónde aplicarlo:** análisis de visibilidad y revisión extendida sobre el directorio.

## Flags UAC, delegación y escenarios avanzados

### Añadir `TRUSTED_TO_AUTH_FOR_DELEGATION`

```bash
bloodyAD --host $dc -d $domain -u $username -p $password add uac $target_username -f TRUSTED_TO_AUTH_FOR_DELEGATION
```

**Qué hace:** añade ese flag a `userAccountControl`.

**Dónde aplicarlo:** laboratorios y análisis de configuración vinculada a delegación.

### Añadir RBCD

```bash
bloodyAD --host $dc -d $domain -u $username -p $password add rbcd 'DELEGATE_TO$' 'DELEGATE_FROM$'
```

**Qué hace:** configura delegación restringida basada en recursos.

**Dónde aplicarlo:** pruebas avanzadas de delegación en Active Directory.

### Añadir Shadow Credentials

```bash
bloodyAD --host $dc -d $domain -u $username -p $password add shadowCredentials $target
```

**Qué hace:** opera sobre la funcionalidad asociada a shadow credentials.

**Dónde aplicarlo:** laboratorios avanzados de autenticación y control de cuentas.

## Restauración y recuperación

### Restaurar un objeto eliminado

```bash
bloodyAD --host $dc -d $domain -u $username -p $password -k set restore $user_to_restore
```

**Qué hace:** intenta restaurar un objeto previamente eliminado.

**Dónde aplicarlo:** ejercicios de recuperación de objetos en AD o validación de permisos de restauración.

## Índice rápido por objetivo

### Inventario del dominio

- `get object 'DC=...,DC=...' --attr msDS-Behavior-Version`
- `get object 'DC=...,DC=...' --attr minPwdLength`
- `get object 'DC=...,DC=...' --attr ms-DS-MachineAccountQuota`
- `get children --otype useronly`
- `get children --otype computer`
- `get children --otype container`
- `get children --otype trustedDomain`
- `get dnsDump`

### Revisión de atributos y objetos

- `get object <objeto>`
- `get object <objeto> --attr <atributo>`
- `get search --filter '<filtro>' --attr <atributo>`
- `get search -c <control> -c <control>`
- `get writable --detail`
- `get writable --include-del`

### Gestión de cuentas y grupos

- `add groupMember <grupo> <miembro>`
- `set password <usuario> <password>`
- `add computer <equipo> <password>`
- `remove uac <usuario> -f ACCOUNTDISABLE`

### Cambios sobre identidad y configuración

- `set object <objeto> userPrincipalName -v <valor>`
- `set object <objeto> mail -v <valor>`
- `set object <objeto> altSecurityIdentities -v <valor>`
- `set object <objeto> servicePrincipalName -v <valor>`
- `set object 'DC=...,DC=...' ms-DS-MachineAccountQuota -v <valor>`

### ACL y delegación

- `add genericAll <objeto> <principal>`
- `set owner <objeto> <principal>`
- `add uac <usuario> -f TRUSTED_TO_AUTH_FOR_DELEGATION`
- `add rbcd <destino> <origen>`
- `add shadowCredentials <objetivo>`

### Recuperación

- `set restore <objeto>`

## Referencia breve de ejemplos adicionales públicos

Ejemplos documentados públicamente incluyen consultas del nivel funcional del bosque, longitud mínima de contraseña, cuota de equipos, listado de usuarios, equipos, contenedores, trusts, búsquedas LDAP por SPN y cuentas con configuraciones especiales de autenticación, además del volcado de DNS integrado en AD [web:99][page:1].
