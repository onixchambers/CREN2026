import os
path = 'src/app/dashboard/configuracion/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'bg-white h-24 custom-scrollbar',
    'bg-white h-24 min-h-[96px] overflow-y-auto custom-scrollbar'
)
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
