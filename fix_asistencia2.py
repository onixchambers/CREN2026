import os

path = 'src/app/dashboard/asistencia/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update filter in asistenciasFiltradas
old_filter = '''  const asistenciasFiltradas = asistencias.filter(a => {
    // Ahora todos pueden ver todos los registros locales
    if (filtroEstado !== "Todos" && a.estado !== filtroEstado) return false;'''

new_filter = '''  const asistenciasFiltradas = asistencias.filter(a => {
    if (userRole.toUpperCase() === "TERAPEUTA") {
      const isMine = pacientes.some(p => p.paciente === a.paciente && p.medicoTratante?.trim().toLowerCase() === userName.trim().toLowerCase());
      if (!isMine) return false;
    }
    if (filtroEstado !== "Todos" && a.estado !== filtroEstado) return false;'''
content = content.replace(old_filter, new_filter)

# 2. Update validation in handleGuardar
old_val = '''    if (!formData.pacienteNombre || !formData.area || !formData.estadoAsistencia) {
      alert("Por favor completa los campos principales (Paciente, Área, Estado).");'''
new_val = '''    if (!formData.pacienteNombre || !formData.area || !formData.estadoAsistencia || !formData.tipoSesion) {
      alert("Por favor completa los campos principales (Paciente, Área, Tipo de Sesión, Estado).");'''
content = content.replace(old_val, new_val)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
