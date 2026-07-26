import os

path = 'src/app/dashboard/agenda/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

target = """      const res = await addCita(nuevaCitaObj);
      if (res.success) {
        setCitas([...citas, { id: res.id, ...nuevaCitaObj } as Cita]);"""

repl = """      const res = await addCita(nuevaCitaObj);
      if (res.success) {
        if (res.citas) {
          setCitas([...citas, ...res.citas]);
        } else {
          setCitas([...citas, { id: res.id, ...nuevaCitaObj } as Cita]);
        }"""

if target in c:
    c = c.replace(target, repl)
    print("Replaced handleSave success block")
else:
    print("Target not found")

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
