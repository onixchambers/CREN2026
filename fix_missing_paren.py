import os

path = 'src/app/dashboard/asistencia/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace(') : (\n                    <tr>', ')) : (\n                    <tr>')

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
print("Replaced missing parenthesis")
