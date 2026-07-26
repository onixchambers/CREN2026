import os

path = 'src/app/dashboard/asistencia/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

import re

# We need to import useRouter
if 'import { useRouter } from "next/navigation";' not in c:
    c = c.replace('import { useSession } from "next-auth/react";', 'import { useSession } from "next-auth/react";\nimport { useRouter } from "next/navigation";')

# And initialize it inside the component
if 'const router = useRouter();' not in c:
    c = c.replace('const { data: session } = useSession();', 'const { data: session } = useSession();\n    const router = useRouter();')

# Add router.refresh() in useEffect
target_effect = """    useEffect(() => {
      async function loadData() {"""
      
repl_effect = """    useEffect(() => {
      router.refresh(); // FORZAR AL ROUTER A DESCARTAR LA CACHÉ
      async function loadData() {"""

if 'router.refresh();' not in c:
    c = c.replace(target_effect, repl_effect)

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
print("Added router.refresh to Asistencia")
