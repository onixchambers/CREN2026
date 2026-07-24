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

import_statement = "import { DateInput } from \"@/components/DateInput\";\n"

for path in files_to_update:
    if not os.path.exists(path):
        continue
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if "DateInput" not in content:
        # Add import after other imports
        parts = content.split("import ")
        # Find last import
        last_import_idx = content.rfind("import ")
        if last_import_idx != -1:
            end_of_line = content.find("\n", last_import_idx)
            content = content[:end_of_line+1] + import_statement + content[end_of_line+1:]
        else:
            content = import_statement + content
            
    # Replace type="date" with DateInput. This is tricky because it's multiline sometimes.
    # Simple replacement if possible.
    content = content.replace('<input type="date"', '<DateInput')
    content = content.replace('<input required type="date"', '<DateInput required')
    # in agenda/page.tsx:
    content = content.replace('type="date"', '')
    # Actually wait, agenda/page.tsx had a multiline <input type="date"
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Replaced date inputs")
