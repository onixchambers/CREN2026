import os

path = 'src/app/actions/finanzas.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('iva: ivaTotal // Se mostrará como impuesto a restar', 'ivaHonorarios: ivaTotal // Se mostrará como impuesto a restar')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
