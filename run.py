# -*- coding: utf-8 -*-
with open('src/app/dashboard/pacientes/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

find1 = 'className="px-2.5 py-1 border border-slate-300 rounded bg-white text-slate-700 disabled:opacity-50 hover:bg-slate-50 cursor-pointer font-bold"'
replace1 = 'className="px-2.5 py-1 border border-slate-300 rounded bg-white text-black disabled:opacity-50 hover:bg-slate-50 cursor-pointer font-bold"'
content = content.replace(find1, replace1)

find2 = 'className="px-2.5 py-1 text-slate-700 font-bold"'
replace2 = 'className="px-2.5 py-1 text-black font-bold"'
content = content.replace(find2, replace2)

with open('src/app/dashboard/pacientes/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated docs pagination colors")