"use server";

import { prisma } from "@/lib/prisma";

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
    // Buscar patientId
    const patient = await prisma.patient.findFirst({ where: { name: data.paciente } });
    if (!patient) return { success: false, error: "Paciente no encontrado en DB." };

    // Buscar therapistId
    const therapist = await prisma.user.findFirst({ where: { name: data.terapeuta, role: "THERAPIST" } });
    const therapistId = therapist ? therapist.id : (await prisma.user.findFirst({ where: { role: "ADMIN" } }))?.id;

    if (!therapistId) return { success: false, error: "Terapeuta no encontrado." };

    // Construir fecha
    const jsDate = new Date(`${data.fecha}T${data.hora}:00`);

    const notesJson = JSON.stringify({
      fecha: data.fecha,
      hora: data.hora,
      tipoServicio: data.tipoServicio,
      frecuencia: data.frecuencia,
      estado: data.estado,
      pagado: data.pagado || false,
      metodoPago: data.metodoPago || ""
    });

    const newSession = await prisma.session.create({
      data: {
        date: jsDate,
        status: data.estado,
        notes: notesJson,
        patientId: patient.id,
        therapistId: therapistId
      }
    });

    return { success: true, id: newSession.id };
  } catch (error) {
    console.error("Error agregando cita:", error);
    return { success: false, error: "Error al guardar la cita." };
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
    await prisma.session.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("Error eliminando cita:", error);
    return { success: false, error: "Error al eliminar la cita." };
  }
}
