import os

path = 'src/app/actions/pacientes.ts'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

if 'import { unstable_noStore as noStore }' not in c:
    c = c.replace('import { prisma } from "@/lib/prisma";', 'import { prisma } from "@/lib/prisma";\nimport { unstable_noStore as noStore } from "next/cache";')

if 'noStore();' not in c and 'export async function getPatients()' in c:
    c = c.replace('export async function getPatients() {\n  try {', 'export async function getPatients() {\n  noStore();\n  try {')

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
print("Updated pacientes.ts")
