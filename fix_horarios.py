import os

path = 'src/app/dashboard/horarios/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_select = '''            <select 
              className="w-full text-slate-900 font-medium p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
              value={terapeutaSeleccionado}
              onChange={e => setTerapeutaSeleccionado(e.target.value)}
            >
              <option value="">-- Seleccionar --</option>
              {terapeutasDisponibles.map((t, idx) => (
                <option key={idx} value={t}>{t}</option>
              ))}
            </select>'''

new_select = '''            <select 
              className="w-full text-slate-900 font-medium p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
              value={terapeutaSeleccionado}
              onChange={e => setTerapeutaSeleccionado(e.target.value)}
              disabled={userRole.toUpperCase() === "TERAPEUTA"}
            >
              {userRole.toUpperCase() !== "TERAPEUTA" && <option value="">-- Seleccionar --</option>}
              {terapeutasDisponibles.map((t, idx) => (
                <option key={idx} value={t}>{t}</option>
              ))}
            </select>'''

content = content.replace(old_select, new_select)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
