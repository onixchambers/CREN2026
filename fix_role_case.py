import os

files = [
    'src/app/dashboard/layout.tsx',
    'src/app/dashboard/preregistros/page.tsx',
    'src/app/dashboard/asistencia/page.tsx',
    'src/app/dashboard/informes/page.tsx',
    'src/app/dashboard/horarios/page.tsx',
]

for file_path in files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace all instances of userRole === "TERAPEUTA"
    content = content.replace('userRole === "TERAPEUTA"', 'userRole.toUpperCase() === "TERAPEUTA"')
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Updated all role checks to be case insensitive.")
