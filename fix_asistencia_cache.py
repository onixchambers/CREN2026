import os

path = 'src/app/actions/asistencia.ts'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

if 'import { unstable_noStore as noStore }' not in c:
    c = c.replace('import { revalidatePath } from "next/cache";', 'import { revalidatePath } from "next/cache";\nimport { unstable_noStore as noStore } from "next/cache";')

if 'noStore();' not in c and 'export async function getAsistenciasDB()' in c:
    c = c.replace('export async function getAsistenciasDB() {\n  try {', 'export async function getAsistenciasDB() {\n  noStore();\n  try {')

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
print("Updated asistencia.ts")
