import os

path = 'src/app/dashboard/asistencia/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Chunk 1
content = content.replace(
    'import { getPatients } from "@/app/actions/pacientes";',
    'import { getPatients } from "@/app/actions/pacientes";\nimport { getTerapeutasFull } from "@/app/actions/configuracion";'
)

# Chunk 2
content = content.replace(
    'const [filtroEstado, setFiltroEstado] = useState("Todos");',
    'const [filtroEstado, setFiltroEstado] = useState("Todos");\n  const [availableAreas, setAvailableAreas] = useState<string[]>(["Psicología", "Lenguaje", "Fisioterapia"]);'
)

# Chunk 3
old_load = '''      // Cargar asistencias
      const aData = localStorage.getItem("asistenciaData");'''
new_load = '''      // Cargar áreas
      const tRes = await getTerapeutasFull();
      if (tRes.success && tRes.data) {
        if (userRole.toUpperCase() === "TERAPEUTA") {
          const me = tRes.data.find((t: any) => t.name === userName);
          if (me && me.especialidad) {
            const espList = me.especialidad.split(',').map((s: string) => s.trim()).filter((s: string) => s);
            if (espList.length > 0) {
              setAvailableAreas(espList);
              if (espList.length === 1) {
                setFormData(prev => ({ ...prev, area: espList[0] }));
              }
            }
          }
        } else {
          const allEsp = new Set<string>();
          tRes.data.forEach((t: any) => {
            if (t.especialidad) {
              t.especialidad.split(',').forEach((s: string) => {
                const val = s.trim();
                if (val) allEsp.add(val);
              });
            }
          });
          allEsp.add("Psicología");
          allEsp.add("Lenguaje");
          allEsp.add("Fisioterapia");
          setAvailableAreas(Array.from(allEsp));
        }
      }

      // Cargar asistencias
      const aData = localStorage.getItem("asistenciaData");'''
content = content.replace(old_load, new_load)

# Chunk 4
old_select1 = '''                <select name="area" value={formData.area} onChange={handleChange} className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900">
                  <option value="">Seleccionar especialidad...</option>
                  <option value="Psicología">Psicología</option>
                  <option value="Lenguaje">Lenguaje</option>
                  <option value="Fisioterapia">Fisioterapia</option>
                </select>'''
new_select1 = '''                <select name="area" value={formData.area} onChange={handleChange} className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900">
                  <option value="">Seleccionar especialidad...</option>
                  {availableAreas.map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>'''
content = content.replace(old_select1, new_select1)

# Chunk 5
old_select2 = '''                  <select name="area" value={editForm.area} onChange={handleEditChange} className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900">
                    <option value="Psicología">Psicología</option>
                    <option value="Lenguaje">Lenguaje</option>
                    <option value="Fisioterapia">Fisioterapia</option>
                  </select>'''
new_select2 = '''                  <select name="area" value={editForm.area} onChange={handleEditChange} className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900">
                    <option value="">Seleccionar especialidad...</option>
                    {availableAreas.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>'''
content = content.replace(old_select2, new_select2)

# Chunk 6
old_limpiar = '''    setFormData({
      fecha: hoy,
      area: "",'''
new_limpiar = '''    setFormData({
      fecha: hoy,
      area: (availableAreas.length === 1 && userRole.toUpperCase() === "TERAPEUTA") ? availableAreas[0] : "",'''
content = content.replace(old_limpiar, new_limpiar)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
