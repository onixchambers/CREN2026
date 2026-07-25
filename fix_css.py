import os
path = 'src/app/dashboard/configuracion/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    '<div className="flex items-center gap-2 flex-1 min-w-[200px]">\\n                    <label className="text-sm text-slate-500 w-24">Especialidades</label>',
    '<div className="flex items-start gap-2 flex-1 min-w-[200px]">\\n                    <label className="text-sm text-slate-500 w-24 mt-2">Especialidades</label>'
)
content = content.replace(
    'className="flex-1 p-2 border border-slate-300 rounded text-xs text-slate-900 focus:border-blue-500 outline-none bg-white min-h-[80px]"',
    'className="flex-1 p-2 border border-slate-300 rounded text-xs text-slate-900 focus:border-blue-500 outline-none bg-white h-24 custom-scrollbar"'
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
