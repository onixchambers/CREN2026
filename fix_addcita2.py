import os

path = 'src/app/actions/agenda.ts'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

start_str = 'export async function addCita(data: any) {'
end_str = 'return { success: false, error: "Error al guardar la cita." };\n  }\n}'

if start_str in c and end_str in c:
    start_idx = c.find(start_str)
    end_idx = c.find(end_str) + len(end_str)
    
    new_addCita = """export async function addCita(data: any) {
  try {
    const patient = await prisma.patient.findFirst({ where: { name: data.paciente } });
    if (!patient) return { success: false, error: "Paciente no encontrado en DB." };

    const allUsers = await prisma.user.findMany();
    let therapistId: string | undefined = undefined;
    
    const match = allUsers.find(u => (u.name || "").trim().toLowerCase() === (data.terapeuta || "").trim().toLowerCase());
    if (match) {
      therapistId = match.id;
    } else {
      const admin = allUsers.find(u => (u.role || "").toUpperCase() === "ADMIN");
      if (admin) {
        therapistId = admin.id;
      } else if (allUsers.length > 0) {
        therapistId = allUsers[0].id;
      }
    }

    if (!therapistId) return { success: false, error: "No hay terapeutas ni usuarios registrados en la base de datos." };

    const numSesiones = parseInt(data.numeroSesiones) || 1;
    const frecuencia = data.frecuencia || "unica";
    
    let currentDateStr = data.fecha;
    const createdCitas = [];

    for (let i = 0; i < numSesiones; i++) {
      let currentDate = new Date(`${currentDateStr}T12:00:00Z`);
      
      // Si cae domingo (0), empujarlo al Lunes (1)
      if (currentDate.getUTCDay() === 0) {
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
      }
      
      const finalDateStr = currentDate.toISOString().split('T')[0];
      const jsDate = new Date(`${finalDateStr}T${data.hora}:00`);
      
      const notesJson = JSON.stringify({
        fecha: finalDateStr,
        hora: data.hora,
        tipoServicio: data.tipoServicio,
        frecuencia: data.frecuencia,
        estado: data.estado,
        pagado: data.pagado || false,
        metodoPago: data.metodoPago || ""
      });

      const newSession = await prisma.session.create({
        data: {
          patientId: patient.id,
          therapistId: therapistId,
          date: jsDate,
          time: data.hora,
          status: data.estado || "Ocupado",
          notes: notesJson
        }
      });
      
      createdCitas.push({
        id: newSession.id,
        paciente: data.paciente,
        fecha: finalDateStr,
        hora: data.hora,
        terapeuta: data.terapeuta,
        tipoServicio: data.tipoServicio,
        frecuencia: data.frecuencia,
        estado: data.estado,
        pagado: data.pagado,
        metodoPago: data.metodoPago
      });
      
      // Calcular siguiente fecha
      if (frecuencia === "diario") {
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
      } else if (frecuencia === "semanal") {
        currentDate.setUTCDate(currentDate.getUTCDate() + 7);
      } else if (frecuencia === "quincenal") {
        currentDate.setUTCDate(currentDate.getUTCDate() + 14);
      } else if (frecuencia === "mensual") {
        currentDate.setUTCMonth(currentDate.getUTCMonth() + 1);
      } else {
        break; // unica
      }
      
      currentDateStr = currentDate.toISOString().split('T')[0];
    }

    revalidatePath("/dashboard/agenda");
    return { success: true, citas: createdCitas, id: createdCitas[0]?.id };
  } catch (error: any) {
    console.error("Error addCita:", error);
    return { success: false, error: error.message };
  }
}"""
    c = c[:start_idx] + new_addCita + c[end_idx:]
    print("Replaced addCita")
else:
    print("Could not find start or end block")

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
