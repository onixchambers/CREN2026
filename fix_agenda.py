import os

path = 'src/app/actions/agenda.ts'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

import re
if 'import { revalidatePath }' not in c:
    c = c.replace('import { prisma } from "@/lib/prisma";', 'import { prisma } from "@/lib/prisma";\nimport { revalidatePath } from "next/cache";')

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
print("Added revalidatePath to agenda.ts")
