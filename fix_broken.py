import os
import re

files = [
    'src/app/dashboard/asistencia/page.tsx',
    'src/app/dashboard/informes/page.tsx',
    'src/app/dashboard/pacientes/page.tsx',
    'src/app/dashboard/preregistros/page.tsx'
]

for path in files:
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Replace <input \n  followed by alue= and other attributes with <DateInput 
    content = re.sub(r'<input\s*\n\s*value=\{([^}]+)\}\s*\n\s*onChange', r'<DateInput value={\1} onChange', content)
    content = re.sub(r'<input\s*\n\s*name="fecha"', r'<DateInput name="fecha"', content)
    content = re.sub(r'<input\s*\n\s*name="fechaNacimiento"', r'<DateInput name="fechaNacimiento"', content)
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Fixed")
