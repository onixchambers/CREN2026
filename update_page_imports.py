import os

path = 'src/app/dashboard/asistencia/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

# Replace getAgenda with getAsistenciasDB
c = c.replace('import { getAgenda } from "@/app/actions/agenda";', 'import { getAsistenciasDB } from "@/app/actions/asistencia";\nimport { getAgenda } from "@/app/actions/agenda";')
c = c.replace('const agRes = await getAgenda();', 'const agRes = await getAsistenciasDB();')

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
print("Updated basic imports.")
