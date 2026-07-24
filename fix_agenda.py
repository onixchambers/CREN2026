import os

path = 'src/app/dashboard/agenda/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('''<input \n                 \n                value={fechaSeleccionada}''', '''<DateInput \n                value={fechaSeleccionada}''')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
