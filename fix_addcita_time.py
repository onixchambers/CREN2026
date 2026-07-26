import os

path = 'src/app/actions/agenda.ts'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

import re

# Remove time: data.hora, from prisma.session.create
c = re.sub(r'date: jsDate,\s*time: data\.hora,\s*status: data\.estado', 'date: jsDate,\n          status: data.estado', c)

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
print("Removed time field from prisma.session.create")
