import os

path = 'src/app/actions/configuracion.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('contrasena: u.password || "",', 'contrasena: u.password || "",\n        especialidad: u.especialidad || "",')
content = content.replace('password: user.contrasena,', 'password: user.contrasena,\n              especialidad: user.especialidad || "",')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
