import os

path = 'src/app/dashboard/asistencia/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the availableAreas logic
old_logic = '''        const tRes = await getTerapeutasFull();
        if (tRes.success && tRes.data) {
          setAvailableAreas(tRes.data.map((t: any) => t.area));
          setTerapeutas(tRes.data.map((t: any) => t.name));
        }'''

new_logic = '''        const tRes = await getTerapeutasFull();
        if (tRes.success && tRes.data) {
          const areas = Array.from(new Set(tRes.data.map((t: any) => t.area).filter(Boolean)));
          setAvailableAreas(areas.length > 0 ? areas : ["Psicología", "Lenguaje", "Fisioterapia", "Terapia Ocupacional"]);
          setTerapeutas(tRes.data.map((t: any) => t.name));
        }'''

content = content.replace(old_logic, new_logic)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed available areas dropdown!")
