import os

path = 'src/app/actions/horarios.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('import prisma from "@/lib/prisma";', 'import { prisma } from "@/lib/prisma";')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
