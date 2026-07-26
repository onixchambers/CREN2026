import os

path = 'src/app/dashboard/agenda/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

import re

c = re.sub(r'if \(res\.success\) \{\s*setCitas\(\[\.\.\.citas, \{ id: res\.id, \.\.\.nuevaCitaObj \} as Cita\]\);',
           'if (res.success) { if (res.citas) { setCitas([...citas, ...res.citas]); } else { setCitas([...citas, { id: res.id, ...nuevaCitaObj } as Cita]); }', c)

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
print("Replaced handleSave success block")
