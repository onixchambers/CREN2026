import os

path = 'src/app/actions/asistencia.ts'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('new Date(T00:00:00)', 'new Date(${data.fecha}T00:00:00)')

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
print("Fixed syntax error in date interpolation.")
