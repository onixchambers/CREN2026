import os
file_path = 'src/app/dashboard/layout.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace("userRole === 'ADMIN'", "userRole.toUpperCase() === 'ADMIN'")
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
