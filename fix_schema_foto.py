import os

path = 'prisma/schema.prisma'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

target = '''  observacionesAdmin    String?
  precioTerapia         String?
  metodoPago            String?'''

replacement = '''  observacionesAdmin    String?
  precioTerapia         String?
  metodoPago            String?
  foto                  String?'''

content = content.replace(target, replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
