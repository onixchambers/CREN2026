import os

path = 'src/app/dashboard/agenda/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'className="border border-slate-200 p-2 h-16 w-40 relative group"',
    'className="border border-slate-200 p-2 min-h-[110px] w-48 relative align-top"'
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated cell dimensions!")
