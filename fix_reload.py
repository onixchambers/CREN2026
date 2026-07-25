import os
path = 'src/app/dashboard/configuracion/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('alert("¡Configuración guardada exitosamente!");', 'alert("¡Configuración guardada exitosamente!");\n          window.location.reload();')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
