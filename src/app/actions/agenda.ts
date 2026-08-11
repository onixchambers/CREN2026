"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateUniqueDisplayId } from "@/lib/displayId";
import { unstable_noStore as noStore } from "next/cache";
import { getSystemTimezone } from "@/app/actions/configuracion";

export async function getAgenda() {
  noStore();
  try {
    const tz = await getSystemTimezone();
    const sessions = await prisma.session.findMany({
      include: {
        patient: true,
        therapist: true
      }
    });

    const seenMap = new Map<string, any>();

    for (const s of sessions) {
      let extra: any = {};
      try {
        if (s.notes) extra = JSON.parse(s.notes);
      } catch (e) {}

      let fecha = extra.fecha;
      if (!fecha) {
        try {
          fecha = s.date.toLocaleDateString("en-CA", { timeZone: tz });
        } catch {
          fecha = s.date.toISOString().split("T")[0];
        }
      }
      const hora = extra.hora || "09:00";
      const key = `${s.patientId}_${s.therapistId}_${fecha}_${hora}`;

      const estado = extra.estadoAsistencia || extra.estado || (s.status === "COMPLETED" ? "Asistio" : (s.status === "CANCELLED" ? "Cancelo sin anticipacion" : "Agendado"));

      const item = {
        id: s.id,
        paciente: s.patient?.name || "Desconocido",
        terapeuta: s.therapist?.name || "Desconocido",
        fecha,
        hora,
        tipoServicio: extra.tipoServicio || "individual",
        frecuencia: extra.frecuencia || "semanal",
        estado,
        pagado: extra.pagado || false,
        metodoPago: extra.metodoPago || ""
      };

      if (!seenMap.has(key)) {
        seenMap.set(key, item);
      } else {
        const prev = seenMap.get(key);
        if (item.estado === "Asistio" || item.estado.includes("Cancelo")) {
          seenMap.set(key, item);
        }
      }
    }

    return { success: true, data: Array.from(seenMap.values()) };
  } catch (error) {
    console.error("Error obteniendo agenda:", error);
    return { success: false, error: "Error al cargar la agenda." };
  }
}

export async function addCita(data: any) {
  try {
    const [h, m] = (data.hora || "09:00").split(":").map(Number);
    const totalMins = h * 60 + (m || 0);
    if (isNaN(totalMins) || totalMins < 420 || totalMins > 1320) {
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
        const displayId = await generateUniqueDisplayId(prisma);
        patient = await prisma.patient.create({
          data: {
            displayId,
            name: "No Disponible",
            codigoPaciente: `ND-${Date.now()}`,
            telefono: "0000000000",
            estatus: "Activo"
          }
        });
      }
      patientId = patient.id;
    } else {
      const pNameTrim = (data.paciente || "").trim();
      let patient = await prisma.patient.findFirst({
        where: {
          name: { equals: pNameTrim, mode: "insensitive" }
        }
      });
      if (!patient) {
        const allP = await prisma.patient.findMany();
        patient = allP.find(p => p.name.trim().toLowerCase() === pNameTrim.toLowerCase()) || null;
      }

      if (!patient) return { success: false, error: `El paciente "${data.paciente}" no fue encontrado en el Registro de Pacientes.` };

      if (patient.estatus && patient.estatus.toLowerCase() === "inactivo") {
        return { success: false, error: `El paciente "${patient.name}" se encuentra en estado INACTIVO. Para agendarle citas, primero cámbialo a ACTIVO en la pestaña de Pacientes.` };
      }
      patientId = patient.id;
      data.paciente = patient.name;
    }

    const allUsers = await prisma.user.findMany();
    let therapistId: string | undefined = undefined;
    
    const match = allUsers.find(u => (u.name || "").trim().toLowerCase() === (data.terapeuta || "").trim().toLowerCase());
    if (match) {
      therapistId = match.id;
      // Si la cita fue asignada a una terapeuta (ej. Karla), actualizar el medicoTratante del paciente en DB
      if (patientId) {
        try {
          await prisma.patient.update({
            where: { id: patientId },
            data: { medicoTratante: match.name }
          });
        } catch (e) {
          console.error("Error actualizando medicoTratante:", e);
        }
      }
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

      // Verificar si ya está ocupado ese horario por la misma terapeuta
      const existingSession = await prisma.session.findFirst({
        where: {
          therapistId: therapistId,
          date: jsDate
        }
      });

      if (existingSession) {
        // Allow if it's a different patient (same therapist+hour is a conflict, but same patient + same day = OK)
        const existingExtra: any = existingSession.notes ? (() => { try { return JSON.parse(existingSession.notes); } catch { return {}; } })() : {};
        const existingPatientId = existingSession.patientId;
        // Only block if it's a different patient occupying the same therapist slot at same hour
        if (existingPatientId !== patientId) {
          return { success: false, error: `Ya hay una cita programada para la fecha ${finalDateStr} a las ${data.hora} con esta terapeuta. Intenta con otra hora.` };
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
    
    await logAuditAction({
      action: "AGENDAR_CITA",
      details: `Se agendó cita para "${data.paciente}" en fecha ${data.fecha} a las ${data.hora} (Estado: ${data.estado || 'Agendado'}).`,
      target: data.paciente
    });

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

    await logAuditAction({
      action: "EDITAR_CITA",
      details: `Se actualizó la cita para "${data.paciente || (extra as any).paciente || id}" (Estado: ${data.estado || (extra as any).estado || dbStatus}).`,
      target: data.paciente || (extra as any).paciente || id
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

    const userRole = ((session.user as any)?.role || "").toUpperCase();
    if (userRole === "TERAPEUTA") {
      const cita = await prisma.session.findUnique({ where: { id } });
      if (cita?.status !== "Ocupado" && cita?.status !== "No Disponible") {
        return { success: false, error: "No tienes permisos para eliminar citas. Solo el administrador puede hacerlo." };
      }
    }

    const citaTarget = await prisma.session.findUnique({ where: { id }, include: { patient: true } });

    await prisma.session.delete({ where: { id } });
    revalidatePath("/dashboard/agenda");

    await logAuditAction({
      action: "ELIMINAR_CITA",
      details: `Se eliminó la cita del paciente "${citaTarget?.patient?.name || id}".`,
      target: citaTarget?.patient?.name || id
    });

    return { success: true };
  } catch (error) {
    console.error("Error eliminando cita:", error);
    return { success: false, error: "Error al eliminar la cita." };
  }
}
