import os

path = 'src/app/dashboard/asistencia/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

target = """        let agendaAsistencias: any[] = [];
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
              subtotal: "$0",
              obs: c.metodoPago ? `Método: ${c.metodoPago}` : "Desde Agenda",
              creadoPor: c.terapeuta
            };
          });
        }"""
replacement = """        let agendaAsistencias: any[] = [];
        if (agRes.success && agRes.data) {
          agendaAsistencias = agRes.data.map((c: any) => {
            // Find patient to get sex and age
            const p = validPatients.find((vp: any) => vp.name === c.paciente);
            return {
              id: c.id,
              fecha: c.fecha,
              area: c.area || "-",
              paciente: c.paciente,
              sexo: p?.sexo || c.sexo,
              edad: p?.age ? p.age.toString() : c.edad,
              terapeuta: c.terapeuta,
              tipoSesion: c.tipoSesion || "-",
              estado: c.estado,
              sesiones: c.sesiones || "1",
              paqueteActual: c.paqueteActual || 1,
              pago: c.pago || "-",
              fact: c.fact || "No",
              subtotal: c.subtotal || "$0.00",
              total: c.total || "$0.00",
              saldo: c.saldo || 0,
              obs: c.obs || "-",
              creadoPor: c.creadoPor || "-"
            };
          });
        }"""
if target in c:
    c = c.replace(target, replacement)
    print("Replaced data mapping")
else:
    print("Target not found")
with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
