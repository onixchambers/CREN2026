import os

path = 'src/app/dashboard/asistencia/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Asistencia type
old_type = '''  subtotal: string;
  total: string;
  obs: string;
};'''
new_type = '''  subtotal: string;
  total: string;
  obs: string;
  creadoPor?: string;
};'''
content = content.replace(old_type, new_type)

# 2. Add creadoPor in handleGuardar
old_guardar = '''      total: `$${tot.toFixed(2)}`,
      obs: formData.observaciones || "—"
    };'''
new_guardar = '''      total: `$${tot.toFixed(2)}`,
      obs: formData.observaciones || "—",
      creadoPor: userName
    };'''
content = content.replace(old_guardar, new_guardar)

# 3. Add creadoPor in saveEdit
old_edit = '''          total: `$${tot.toFixed(2)}`,
          obs: editForm.obs || "—"
        };'''
new_edit = '''          total: `$${tot.toFixed(2)}`,
          obs: editForm.obs || "—",
          creadoPor: a.creadoPor || userName
        };'''
content = content.replace(old_edit, new_edit)

# 4. Update asistenciasFiltradas
old_filter = '''  const asistenciasFiltradas = asistencias.filter(a => {
    if (userRole.toUpperCase() === "TERAPEUTA") {
      const isMine = pacientes.some(p => p.paciente === a.paciente && p.medicoTratante?.trim().toLowerCase() === userName.trim().toLowerCase());
      if (!isMine) return false;
    }'''

new_filter = '''  const asistenciasFiltradas = asistencias.filter(a => {
    if (userRole.toUpperCase() === "TERAPEUTA") {
      if (a.creadoPor) {
        if (a.creadoPor !== userName) return false;
      } else {
        const isMine = pacientes.some(p => p.paciente === a.paciente && p.medicoTratante?.trim().toLowerCase() === userName.trim().toLowerCase());
        if (!isMine) return false;
      }
    }'''
content = content.replace(old_filter, new_filter)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
