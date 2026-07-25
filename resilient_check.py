import os
path = 'src/app/dashboard/configuracion/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "u.usuario.toLowerCase() === 'onixchambers'",
    "u.usuario?.trim().toLowerCase() === 'onixchambers'"
)
content = content.replace(
    "u.usuario.toLowerCase() !== 'onixchambers'",
    "u.usuario?.trim().toLowerCase() !== 'onixchambers'"
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
