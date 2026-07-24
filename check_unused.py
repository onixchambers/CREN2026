import os
import re

files_to_update = [
    'src/app/dashboard/agenda/page.tsx',
    'src/app/dashboard/asistencia/page.tsx',
    'src/app/dashboard/finanzas/page.tsx',
    'src/app/dashboard/informes/page.tsx',
    'src/app/dashboard/pacientes/page.tsx',
    'src/app/dashboard/preregistros/page.tsx'
]

for path in files_to_update:
    if not os.path.exists(path):
        continue
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if "import { DateInput }" in content and "<DateInput" not in content:
        print(f"UNUSED IMPORT in {path}")
    
    # Check if there are broken <input> that used to be dates
    if "<input \n" in content:
        print(f"BROKEN INPUT in {path}")
