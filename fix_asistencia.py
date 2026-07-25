import os
import re

path = 'src/app/dashboard/asistencia/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add getAgenda import
content = content.replace('import { getPatients } from "@/app/actions/pacientes";', 'import { getPatients } from "@/app/actions/pacientes";\nimport { getAgenda } from "@/app/actions/agenda";')

# 2. Modify loadData in useEffect
old_load_data = '''        // Cargar ǭreas
        const tRes = await getTerapeutasFull();
        if (tRes.success && tRes.data) {
          setAvailableAreas(tRes.data.map((t: any) => t.area));
          setTerapeutas(tRes.data.map((t: any) => t.name));
        }
        
        // Cargar asistencias desde localStorage (mock)
        const aData = localStorage.getItem("asistenciaData");
        if (aData) setAsistencias(JSON.parse(aData));'''

new_load_data = '''        // Cargar ǭreas
        const tRes = await getTerapeutasFull();
        if (tRes.success && tRes.data) {
          setAvailableAreas(tRes.data.map((t: any) => t.area));
          setTerapeutas(tRes.data.map((t: any) => t.name));
        }
        
        // Cargar asistencias reales de la Agenda
        const agRes = await getAgenda();
        let agendaAsistencias = [];
        if (agRes.success && agRes.data) {
          agendaAsistencias = agRes.data.map((c: any) => ({
            id: c.id,
            fecha: c.fecha,
            area: "General", // Se puede mejorar
            paciente: c.paciente,
            sexo: "N/A", // Se podrǭ cruzar con validPatients
            edad: "N/A",
            terapeuta: c.terapeuta,
            tipoSesion: c.tipoServicio || "Individual",
            estado: c.estado,
            sesiones: c.frecuencia || "1/1",
            pago: c.pagado ? "Sǭ" : "No",
            fact: "No",
            subtotal: "",
            obs: c.metodoPago ? Mǭtodo:  : "Desde Agenda",
            creadoPor: c.terapeuta
          }));
        }

        // Cargar asistencias desde localStorage (mock/legacy)
        const aData = localStorage.getItem("asistenciaData");
        let localAsist = [];
        if (aData) localAsist = JSON.parse(aData);
        
        // Unir ambas fuentes, dando prioridad a las de la agenda para mostrar todas en la tabla
        setAsistencias([...agendaAsistencias, ...localAsist]);'''

# We need to handle the encoding issues from powershell output (ǭ)
# Actually, the python script will use normal strings
old_load_data = re.search(r'// Cargar áreas.*?if \(aData\) setAsistencias\(JSON\.parse\(aData\)\);', content, flags=re.DOTALL)
if old_load_data:
    new_load_data_str = '''// Cargar áreas
        const tRes = await getTerapeutasFull();
        if (tRes.success && tRes.data) {
          setAvailableAreas(tRes.data.map((t: any) => t.area));
          setTerapeutas(tRes.data.map((t: any) => t.name));
        }
        
        // Cargar asistencias reales de la Agenda
        const agRes = await getAgenda();
        let agendaAsistencias: any[] = [];
        if (agRes.success && agRes.data) {
          agendaAsistencias = agRes.data.map((c: any) => {
            // Find patient to get sex and age
            const p = validPatients.find((vp: any) => vp.name === c.paciente);
            return {
              id: c.id,
              fecha: c.fecha,
              area: "Terapia",
              paciente: c.paciente,
              sexo: p?.sexo || "N/A",
              edad: p?.age ? p.age.toString() : "N/A",
              terapeuta: c.terapeuta,
              tipoSesion: c.tipoServicio || "Individual",
              estado: c.estado,
              sesiones: c.frecuencia || "1/1",
              pago: c.pagado ? "Sí" : "No",
              fact: "No",
              subtotal: "",
              obs: c.metodoPago ? Método:  : "Desde Agenda",
              creadoPor: c.terapeuta
            };
          });
        }

        // Cargar asistencias desde localStorage (mock/legacy)
        const aData = localStorage.getItem("asistenciaData");
        let localAsist: any[] = [];
        if (aData) localAsist = JSON.parse(aData);
        
        setAsistencias([...agendaAsistencias, ...localAsist]);'''
    content = content.replace(old_load_data.group(0), new_load_data_str)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Added agenda syncing to Asistencia!")
