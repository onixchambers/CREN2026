import os

path = 'src/app/dashboard/configuracion/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# I need to add especialidad to the default states
content = content.replace('{ id: Date.now(), usuario: "Administrador", rol: "Admin", contrasena: "admin2026" }', '{ id: Date.now(), usuario: "Administrador", rol: "Admin", contrasena: "admin2026", especialidad: "" }')
content = content.replace('{ id: Date.now(), usuario: "", rol: "Terapeuta", contrasena: "" }', '{ id: Date.now(), usuario: "", rol: "Terapeuta", contrasena: "", especialidad: "" }')

# Now add the UI
ui_block = '''                  </div>
                  
                  {u.rol === 'Terapeuta' && (
                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <label className="text-sm text-slate-500 w-24">Especialidades</label>
                    <select multiple value={u.especialidad ? u.especialidad.split(',') : []} className="flex-1 p-2 border border-slate-300 rounded text-xs text-slate-900 focus:border-blue-500 outline-none bg-white min-h-[80px]" onChange={(e) => {
                      const newU = [...usuarios];
                      const idx = newU.findIndex(x => x.id === u.id);
                      const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
                      newU[idx].especialidad = selected.join(',');
                      setUsuarios(newU);
                    }}>
                      <option value="Psicología">Psicología</option>
                      <option value="Lenguaje">Lenguaje</option>
                      <option value="Neurodesarrollo">Neurodesarrollo</option>
                      <option value="Fisioterapia">Fisioterapia</option>
                      <option value="Asesoría de crianza">Asesoría de crianza</option>
                      <option value="Rehabilitación">Rehabilitación</option>
                      <option value="Otro">Otro</option>
                    </select>
                    <div className="text-[10px] text-slate-400 max-w-[80px] leading-tight">Manten presionado Ctrl para seleccionar varios</div>
                  </div>
                  )}

                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">'''

content = content.replace('''                  </div>
                  
                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <label className="text-sm text-slate-500 w-20">Contraseña</label>''', ui_block + '''
                    <label className="text-sm text-slate-500 w-20">Contraseña</label>''')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
