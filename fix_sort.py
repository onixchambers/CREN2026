import os
path = 'src/app/dashboard/configuracion/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    '{usuarios.map((u) => (',
    '{[...usuarios].sort((a, b) => {\n                if (a.rol === \'Admin\' && b.rol !== \'Admin\') return -1;\n                if (a.rol !== \'Admin\' && b.rol === \'Admin\') return 1;\n                return 0;\n              }).map((u) => ('
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
