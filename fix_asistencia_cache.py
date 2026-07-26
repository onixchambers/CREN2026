import os

path = 'src/app/actions/asistencia.ts'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('export async function getAsistenciasDB() {', 'export async function getAsistenciasDB(_ts?: string) {')

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)

path2 = 'src/app/dashboard/asistencia/page.tsx'
with open(path2, 'r', encoding='utf-8') as f:
    c2 = f.read()

c2 = c2.replace('const agRes = await getAsistenciasDB();', 'const agRes = await getAsistenciasDB(Date.now().toString());')

with open(path2, 'w', encoding='utf-8') as f:
    f.write(c2)

print("Added timestamp to getAsistenciasDB")
