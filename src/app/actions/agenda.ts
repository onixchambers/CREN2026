"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getAgenda() {
  try {
    const sessions = await prisma.session.findMany({
      include: {
        patient: true,
        therapist: true
      }
    });

    const citas = sessions.map(s => {
      let extra = {};
      try {
        if (s.notes) extra = JSON.parse(s.notes);
      } catch (e) {}

      return {
        id: s.id,
        paciente: s.patient?.name || "Desconocido",
        terapeuta: s.therapist?.name || "Desconocido",
        fecha: (extra as any).fecha || s.date.toISOString().split("T")[0],
        hora: (extra as any).hora || "09:00",
        tipoServicio: (extra as any).tipoServicio || "individual",
        frecuencia: (extra as any).frecuencia || "semanal",
        estado: (extra as any).estado || s.status,
        pagado: (extra as any).pagado || false,
        metodoPago: (extra as any).metodoPago || ""
      };
    });

    return { success: true, data: citas };
  } catch (error) {
    console.error("Error obteniendo agenda:", error);
    return { success: false, error: "Error al cargar la agenda." };
  }
}

export async function addCita(data: any) {
  try {
    const hourNum = parseInt((data.hora || "09:00").split(":")[0]);
    if (isNaN(hourNum) || hourNum < 7 || hourNum > 22) {
      return { success: false, error: "Las citas solo pueden agendarse entre las 07:00 AM y las 10:00 PM." };
    }

    let patientId = "";
    if (data.estado === "Ocupado" || data.estado === "No Disponible" || !data.paciente || data.paciente.trim() === "" || data.paciente === "No Disponible") {
      if (data.estado === "Ocupado") data.estado = "No Disponible";
      data.paciente = "No Disponible";
      
      let patient = await prisma.patient.findFirst({ where: { name: "No Disponible" } });
      if (!patient) {
        patient = await prisma.patient.findFirst();
      }
      if (!patient) {
        patient = await prisma.patient.create({
          data: {
            name: "No Disponible",
            codigoPaciente: `ND-${Date.now()}`,
            telefono: "0000000000",
            estatus: "Activo"
          }
        });
      }
      patientId = patient.id;
    } else {
      const patient = await prisma.patient.findFirst({ where: { name: data.paciente } });
      if (!patient) return { success: false, error: "Paciente no encontrado en DB." };

      if (patient.estatus && patient.estatus.toLowerCase() === "desactivo") {
        return { success: false, error: "El paciente está Desactivo. Para agendarle citas, primero debes cambiar su estado a Activo en el Directorio de Pacientes." };
      }
      patientId = patient.id;
    }

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

      // Verificar si ya está ocupado en ese horario
      const existingSession = await prisma.session.findFirst({
        where: {
          therapistId: therapistId,
          date: jsDate
        }
      });

      if (existingSession) {
        let existingNotes: any = {};
        try { if (existingSession.notes) existingNotes = JSON.parse(existingSession.notes); } catch (e) {}
        if (existingNotes.estado === "Ocupado" || existingNotes.estado === "No Disponible") {
          return { success: false, error: `El terapeuta ${data.terapeuta} se encuentra No Disponible en la fecha ${finalDateStr} a las ${data.hora}.` };
        }
      }
      
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
          patientId: patientId,
          therapistId: therapistId,
          date: jsDate,
          status: data.estado,
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
}

export async function updateCita(id: string, data: any) {
  try {
    const session = await prisma.session.findUnique({ where: { id } });
    if (!session) return { success: false, error: "Cita no encontrada." };

    let extra = {};
    try {
      if (session.notes) extra = JSON.parse(session.notes);
    } catch (e) {}

    const updatedExtra = { ...extra, ...data };
    
    // Si cambia estado
    let dbStatus = session.status;
    if (data.estado) dbStatus = data.estado;

    await prisma.session.update({
      where: { id },
      data: {
        status: dbStatus,
        notes: JSON.stringify(updatedExtra)
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Error actualizando cita:", error);
    return { success: false, error: "Error al actualizar la cita." };
  }
}

export async function deleteCita(id: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "No autenticado." };
    }

    await prisma.session.delete({ where: { id } });
    revalidatePath("/dashboard/agenda");
    return { success: true };
  } catch (error) {
    console.error("Error eliminando cita:", error);
    return { success: false, error: "Error al eliminar la cita." };
  }
}
