import os

path = 'src/app/actions/asistencia.ts'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

new_func = '''
export async function getAsistenciasDB() {
  try {
    const sessions = await prisma.session.findMany({
      include: { patient: true, therapist: true },
      orderBy: { date: 'desc' }
    });

    const asistencias = [];
    for (const s of sessions) {
      if (!s.notes) continue;
      try {
        const extra = JSON.parse(s.notes);
        if (extra.asistenciaGuardada) {
          asistencias.push({
            id: s.id,
            fecha: extra.fecha || s.date.toISOString().split("T")[0],
            area: extra.area || "-",
            paciente: s.patient?.name || "-",
            pacienteId: s.patient?.id || "",
            sexo: s.patient?.sexo || "-",
            edad: s.patient?.age?.toString() || "-",
            tipoSesion: extra.tipoSesion || "-",
            estado: extra.estadoAsistencia || s.status,
            sesiones: extra.sesiones || "1",
            paqueteActual: extra.paqueteActual || 1,
            pago: extra.metodoPago || "-",
            fact: extra.solicitaFactura ? "Sí" : "No",
            subtotal: extra.subtotal != null ? "$" + Number(extra.subtotal).toFixed(2) : ".00",
            total: extra.total != null ? "$" + Number(extra.total).toFixed(2) : ".00",
            saldo: extra.saldo != null ? extra.saldo : 0,
            obs: extra.obs || "-",
            creadoPor: extra.creadoPor || "-",
            terapeuta: s.therapist?.name || "-"
          });
        }
      } catch (e) {}
    }
    return { success: true, data: asistencias };
  } catch (error: any) {
    console.error("Error getAsistenciasDB:", error);
    return { success: false, error: error.message };
  }
}
'''
c += "\n" + new_func
with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
print("Added getAsistenciasDB")
