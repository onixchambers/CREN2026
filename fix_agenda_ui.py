import os

path = 'src/app/dashboard/agenda/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

# Add numeroSesiones to formData
if 'numeroSesiones: 1' not in c:
    c = c.replace('frecuencia: "semanal", estado: "Ocupado"', 'frecuencia: "semanal", numeroSesiones: 1, estado: "Ocupado"')

# Add input in the UI
ui_target = """                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Frecuencia</label>
                    <select name="frecuencia" value={formData.frecuencia} onChange={handleInputChange} className="w-full text-slate-900 font-medium border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-[#2980b9]">
                      <option value="diario">Diario</option>
                      <option value="semanal">Semanal</option>
                      <option value="quincenal">Quincenal</option>
                      <option value="mensual">Mensual</option>
                      <option value="unica">Única / Ocasional</option>
                    </select>
                  </div>"""

ui_repl = """                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Frecuencia</label>
                    <select name="frecuencia" value={formData.frecuencia} onChange={handleInputChange} className="w-full text-slate-900 font-medium border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-[#2980b9]">
                      <option value="diario">Diario</option>
                      <option value="semanal">Semanal</option>
                      <option value="quincenal">Quincenal</option>
                      <option value="mensual">Mensual</option>
                      <option value="unica">Única / Ocasional</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Número de Sesiones</label>
                    <input required type="number" min="1" max="100" name="numeroSesiones" value={formData.numeroSesiones} onChange={handleInputChange} className="w-full text-slate-900 font-medium border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-[#2980b9]" />
                  </div>"""

if 'name="numeroSesiones"' not in c:
    c = c.replace(ui_target, ui_repl)

# Include numeroSesiones in nuevaCitaObj
target_obj = """        tipoServicio: formData.tipoServicio,
        frecuencia: formData.frecuencia,
        estado: formData.estado,"""
repl_obj = """        tipoServicio: formData.tipoServicio,
        frecuencia: formData.frecuencia,
        numeroSesiones: formData.numeroSesiones,
        estado: formData.estado,"""
if 'numeroSesiones: formData.numeroSesiones' not in c:
    c = c.replace(target_obj, repl_obj)


with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
print("Updated agenda UI")
