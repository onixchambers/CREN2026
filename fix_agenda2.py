import os
import re

path = 'src/app/dashboard/agenda/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'<input\s+value=\{fechaSeleccionada\}', '<DateInput value={fechaSeleccionada}', content)
content = re.sub(r'<input \n\s+value=\{fechaSeleccionada\}', '<DateInput \n                value={fechaSeleccionada}', content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
