import os
from datetime import datetime, timedelta

path = 'src/app/dashboard/asistencia/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Change default filter to 30 days
old_filtro = '''  // Filtros de tabla
  const hoy = new Date().toISOString().split("T")[0];
  const [filtroDesde, setFiltroDesde] = useState(hoy);
  const [filtroHasta, setFiltroHasta] = useState(hoy);'''

new_filtro = '''  // Filtros de tabla
  const hoy = new Date().toISOString().split("T")[0];
  const hace30Dias = new Date();
  hace30Dias.setDate(hace30Dias.getDate() - 30);
  const hace30DiasStr = hace30Dias.toISOString().split("T")[0];
  const [filtroDesde, setFiltroDesde] = useState(hace30DiasStr);
  const [filtroHasta, setFiltroHasta] = useState(hoy);'''

content = content.replace(old_filtro, new_filtro)

# 2. Remove the validPatients filter
old_filter = '''        let validPatients = res.data;
        if (userRole.toUpperCase() === "TERAPEUTA") {
          validPatients = validPatients.filter((p: any) => p.medicoTratante?.trim().toLowerCase() === userName.trim().toLowerCase());
        }
        // Map to expected format'''

new_filter = '''        let validPatients = res.data;
        // Todos pueden ver todos los pacientes (solicitud del usuario)
        // Map to expected format'''

content = content.replace(old_filter, new_filter)

# 3. Remove the isMine filter in asistenciasFiltradas
old_is_mine = '''    if (userRole.toUpperCase() === "TERAPEUTA") {
      // Solo mostrar si el paciente está en la lista asignada a este terapeuta
      const isMine = pacientes.some(p => p.paciente === a.paciente);
      if (!isMine) return false;
    }'''

new_is_mine = '''    // Ahora todos pueden ver todos los registros locales'''

content = content.replace(old_is_mine, new_is_mine)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
