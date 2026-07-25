import os

path = 'src/app/dashboard/asistencia/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('subtotal: "",', 'subtotal: "$0",')
content = content.replace('obs: c.metodoPago ? Método:  : "Desde Agenda",', 'obs: c.metodoPago ? `Método: ${c.metodoPago}` : "Desde Agenda",')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed syntax error")
