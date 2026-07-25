import os

path = 'src/app/dashboard/asistencia/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Asistencia type
old_type = '''  creadoPor?: string;
};'''
new_type = '''  creadoPor?: string;
  terapeuta?: string;
};'''
content = content.replace(old_type, new_type)

# 2. Add state
old_state = '''  const [availableAreas, setAvailableAreas] = useState<string[]>(["Psicología", "Lenguaje", "Fisioterapia"]);'''
new_state = '''  const [availableAreas, setAvailableAreas] = useState<string[]>(["Psicología", "Lenguaje", "Fisioterapia"]);
  const [terapeutas, setTerapeutas] = useState<string[]>([]);'''
content = content.replace(old_state, new_state)

# 3. Add terapeuta to formData
old_form = '''    fecha: hoy,
    area: "",
    tipoSesion: "",'''
new_form = '''    fecha: hoy,
    terapeuta: "",
    area: "",
    tipoSesion: "",'''
content = content.replace(old_form, new_form)

# 4. Update handleLimpiarForm
old_limpiar = '''      fecha: hoy,
      area: (availableAreas.length === 1 && userRole.toUpperCase() === "TERAPEUTA") ? availableAreas[0] : "",
      tipoSesion: "",'''
new_limpiar = '''      fecha: hoy,
      terapeuta: userRole.toUpperCase() === "TERAPEUTA" ? userName : "",
      area: (availableAreas.length === 1 && userRole.toUpperCase() === "TERAPEUTA") ? availableAreas[0] : "",
      tipoSesion: "",'''
content = content.replace(old_limpiar, new_limpiar)

# 5. Load terapeutas
old_load = '''      const tRes = await getTerapeutasFull();
      if (tRes.success && tRes.data) {
        if (userRole.toUpperCase() === "TERAPEUTA") {'''
new_load = '''      const tRes = await getTerapeutasFull();
      if (tRes.success && tRes.data) {
        const allTeras = tRes.data.map((t: any) => t.name).filter(Boolean);
        if (userRole.toUpperCase() === "TERAPEUTA") {
          setTerapeutas([userName]);
          setFormData(prev => ({ ...prev, terapeuta: userName }));'''
content = content.replace(old_load, new_load)

old_load_admin = '''        } else {
          const allEsp = new Set<string>();'''
new_load_admin = '''        } else {
          setTerapeutas(allTeras);
          const allEsp = new Set<string>();'''
content = content.replace(old_load_admin, new_load_admin)

# 6. Add terapeuta dropdown to Row 1
old_row1 = '''            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">FECHA</label>
                <DateInput name="fecha" value={formData.fecha} onChange={handleChange} className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900" />
              </div>'''
new_row1 = '''            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">FECHA</label>
                <DateInput name="fecha" value={formData.fecha} onChange={handleChange} className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">TERAPEUTA</label>
                <select name="terapeuta" value={formData.terapeuta} onChange={handleChange} className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900" disabled={userRole.toUpperCase() === "TERAPEUTA"}>
                  {userRole.toUpperCase() !== "TERAPEUTA" && <option value="">Seleccionar...</option>}
                  {terapeutas.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>'''
content = content.replace(old_row1, new_row1)

# 7. Add validation to handleGuardar
old_val = '''    if (!formData.pacienteNombre || !formData.area || !formData.estadoAsistencia || !formData.tipoSesion) {
      alert("Por favor completa los campos principales (Paciente, Área, Tipo de Sesión, Estado).");'''
new_val = '''    if (!formData.pacienteNombre || !formData.area || !formData.estadoAsistencia || !formData.tipoSesion || !formData.terapeuta) {
      alert("Por favor completa los campos principales (Paciente, Terapeuta, Área, Tipo de Sesión, Estado).");'''
content = content.replace(old_val, new_val)

# 8. Save terapeuta in nuevaAsistencia
old_guardar = '''      creadoPor: userName
    };'''
new_guardar = '''      creadoPor: userName,
      terapeuta: formData.terapeuta
    };'''
content = content.replace(old_guardar, new_guardar)

# 9. Update edit form
old_edit_state = '''      fact: a.fact === "Sí",
      subtotal: a.subtotal.replace('$', ''),
      obs: a.obs
    });'''
new_edit_state = '''      fact: a.fact === "Sí",
      subtotal: a.subtotal.replace('$', ''),
      obs: a.obs,
      terapeuta: a.terapeuta || ""
    });'''
content = content.replace(old_edit_state, new_edit_state)

old_edit_save = '''          creadoPor: a.creadoPor || userName
        };'''
new_edit_save = '''          creadoPor: a.creadoPor || userName,
          terapeuta: editForm.terapeuta || a.terapeuta
        };'''
content = content.replace(old_edit_save, new_edit_save)

# 10. Edit Modal UI (add terapeuta dropdown)
old_edit_modal = '''              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fecha</label>'''
new_edit_modal = '''              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Terapeuta</label>
                  <select name="terapeuta" value={editForm.terapeuta} onChange={handleEditChange} className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900" disabled={userRole.toUpperCase() === "TERAPEUTA"}>
                    {userRole.toUpperCase() !== "TERAPEUTA" && <option value="">Seleccionar...</option>}
                    {terapeutas.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fecha</label>'''
content = content.replace(old_edit_modal, new_edit_modal)

# 11. Add to Table Headers
old_th = '''                <th className="px-2 py-3 border-b border-[#0e2f44]">FECHA</th>
                <th className="px-2 py-3 border-b border-[#0e2f44]">ÁREA</th>'''
new_th = '''                <th className="px-2 py-3 border-b border-[#0e2f44]">FECHA</th>
                <th className="px-2 py-3 border-b border-[#0e2f44]">TERAPEUTA</th>
                <th className="px-2 py-3 border-b border-[#0e2f44]">ÁREA</th>'''
content = content.replace(old_th, new_th)

# 12. Add to Table Rows
old_tr = '''                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-2 py-3 text-slate-500 font-medium">{formatDateStr(a.fecha)}</td>
                    <td className="px-2 py-3 text-slate-500">{a.area}</td>'''
new_tr = '''                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-2 py-3 text-slate-500 font-medium">{formatDateStr(a.fecha)}</td>
                    <td className="px-2 py-3 text-slate-500">{a.terapeuta || "—"}</td>
                    <td className="px-2 py-3 text-slate-500">{a.area}</td>'''
content = content.replace(old_tr, new_tr)

# 13. Update filtering to use a.terapeuta instead of a.creadoPor for Terapeutas
old_filter = '''  const asistenciasFiltradas = asistencias.filter(a => {
    if (userRole.toUpperCase() === "TERAPEUTA") {
      if (a.creadoPor) {
        if (a.creadoPor !== userName) return false;
      } else {
        const isMine = pacientes.some(p => p.paciente === a.paciente && p.medicoTratante?.trim().toLowerCase() === userName.trim().toLowerCase());
        if (!isMine) return false;
      }
    }'''

new_filter = '''  const asistenciasFiltradas = asistencias.filter(a => {
    if (userRole.toUpperCase() === "TERAPEUTA") {
      if (a.terapeuta) {
        if (a.terapeuta !== userName) return false;
      } else if (a.creadoPor) {
        if (a.creadoPor !== userName) return false;
      } else {
        const isMine = pacientes.some(p => p.paciente === a.paciente && p.medicoTratante?.trim().toLowerCase() === userName.trim().toLowerCase());
        if (!isMine) return false;
      }
    }'''
content = content.replace(old_filter, new_filter)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
