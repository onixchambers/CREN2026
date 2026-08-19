"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateUniqueDisplayId } from "@/lib/displayId";
import { unstable_noStore as noStore } from "next/cache";
import { getSystemTimezone } from "@/app/actions/configuracion";
import { logAuditAction } from "@/app/actions/auditLog";

export async function getAgenda() {
  noStore();
  try {
    const tz = await getSystemTimezone();
    const sessions = await prisma.session.findMany({
      select: {
        id: true,
        date: true,
        status: true,
        notes: true,
        patientId: true,
        therapistId: true,
        patient: {
          select: {
            name: true
          }
        },
        therapist: {
          select: {
            name: true
          }
        }
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

      const estado = extra.estadoAsistencia || extra.estado || (s.status === "COMPLETED" ? "Asistio" : (s.status === "CANCELLED" ? "Cancelo el centro" : "Agendado"));

      const item = {
        id: s.id,
        paciente: s.patient?.name || "Desconocido",
        terapeuta: s.therapist?.name || "Desconocido",
        fecha,
        hora,
        area: extra.area || "",
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
    const session = await getServerSession(authOptions);
    const userRole = ((session?.user as any)?.role || "").toUpperCase();
    if (userRole === "TERAPEUTA") {
      const tz = await getSystemTimezone();
      const d = new Date();
      d.setDate(d.getDate() - 5);
      const cutoffDateStr = d.toLocaleDateString("en-CA", { timeZone: tz });
      const targetDateStr = (data.fecha || "").substring(0, 10);
      if (targetDateStr < cutoffDateStr) {
        return { success: false, error: `No tienes permisos para agregar citas con más de 5 días de antigüedad (Fecha límite: ${cutoffDateStr}).` };
      }
    }

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

      const existingSession = await prisma.session.findFirst({
        where: {
          therapistId: therapistId,
          date: jsDate
        }
      });
      if (existingSession) {
        const existingPatientId = existingSession.patientId;
        if (existingPatientId !== patientId) {
          return { success: false, error: `Ya hay una cita programada para la fecha ${finalDateStr} a las ${data.hora} con esta terapeuta. Intenta con otra hora.` };
        } else {
          let existingExtra = {};
          try {
            if (existingSession.notes) existingExtra = JSON.parse(existingSession.notes);
          } catch (e) {}

          const notesJson = JSON.stringify({
            ...existingExtra,
            fecha: finalDateStr,
            hora: data.hora,
            area: data.area || "",
            tipoServicio: data.tipoServicio,
            frecuencia: data.frecuencia,
            estado: data.estado,
            pagado: data.pagado || false,
            metodoPago: data.metodoPago || ""
          });

          const updatedSession = await prisma.session.update({
            where: { id: existingSession.id },
            data: {
              status: data.estado,
              notes: notesJson
            }
          });

          createdCitas.push({
            id: updatedSession.id,
            paciente: data.paciente,
            fecha: finalDateStr,
            hora: data.hora,
            terapeuta: data.terapeuta,
            area: data.area || "",
            tipoServicio: data.tipoServicio,
            frecuencia: data.frecuencia,
            estado: data.estado,
            pagado: data.pagado,
            metodoPago: data.metodoPago
          });

          if (frecuencia === "diario") {
            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
          } else if (frecuencia === "semanal") {
            currentDate.setUTCDate(currentDate.getUTCDate() + 7);
          } else if (frecuencia === "quincenal") {
            currentDate.setUTCDate(currentDate.getUTCDate() + 14);
          } else if (frecuencia === "mensual") {
            currentDate.setUTCMonth(currentDate.getUTCMonth() + 1);
          }
          currentDateStr = currentDate.toISOString().split('T')[0];
          continue;
        }
      }
      
      const notesJson = JSON.stringify({
        fecha: finalDateStr,
        hora: data.hora,
        area: data.area || "",
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
        area: data.area || "",
        tipoServicio: data.tipoServicio,
        frecuencia: data.frecuencia,
        estado: data.estado,
        pagado: data.pagado,
        metodoPago: data.metodoPago
      });
      
      if (frecuencia === "diario") {
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
      } else if (frecuencia === "semanal") {
        currentDate.setUTCDate(currentDate.getUTCDate() + 7);
      } else if (frecuencia === "quincenal") {
        currentDate.setUTCDate(currentDate.getUTCDate() + 14);
      } else if (frecuencia === "mensual") {
        currentDate.setUTCMonth(currentDate.getUTCMonth() + 1);
      } else {
        break;
      }
      
      currentDateStr = currentDate.toISOString().split('T')[0];
    }

    revalidatePath("/dashboard/agenda");
    revalidatePath("/dashboard/asistencia");
    
    await logAuditAction({
      action: "AGENDAR_CITA",
      details: `Se agendó/actualizó cita para el paciente "${data.paciente}" con el terapeuta "${data.terapeuta}" (${numSesiones} sesión/es, ${frecuencia}).`,
      target: data.paciente
    });

    return { success: true, citas: createdCitas, id: createdCitas[0]?.id };
  } catch (error: any) {
    console.error("Error agregando cita:", error);
    return { success: false, error: "Error al agendar la cita en la base de datos." };
  }
}

export async function updateCita(id: string, data: any) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = ((session?.user as any)?.role || "").toUpperCase();
    if (userRole === "TERAPEUTA") {
      const tz = await getSystemTimezone();
      const d = new Date();
      d.setDate(d.getDate() - 5);
      const cutoffDateStr = d.toLocaleDateString("en-CA", { timeZone: tz });

      const citaTarget = await prisma.session.findUnique({ where: { id } });
      if (citaTarget) {
        let originalDateStr = citaTarget.date.toISOString().split("T")[0];
        if (citaTarget.notes) {
          try {
            const parsed = JSON.parse(citaTarget.notes);
            if (parsed.fecha) originalDateStr = parsed.fecha;
          } catch (e) {}
        }
        if (originalDateStr < cutoffDateStr) {
          return { success: false, error: `No tienes permisos para modificar citas con más de 5 días de antigüedad (Fecha límite: ${cutoffDateStr}).` };
        }
        if (data.fecha) {
          const newDateStr = data.fecha.substring(0, 10);
          if (newDateStr < cutoffDateStr) {
            return { success: false, error: `No tienes permisos para mover citas a fechas con más de 5 días de antigüedad (Fecha límite: ${cutoffDateStr}).` };
          }
        }
      }
    }

    const citaTarget = await prisma.session.findUnique({ where: { id }, include: { patient: true } });
    const existingNotes = citaTarget?.notes ? (() => { try { return JSON.parse(citaTarget.notes); } catch { return {}; } })() : {};
    
    const updatedNotes = JSON.stringify({
      ...existingNotes,
      ...data
    });

    let newDate = citaTarget?.date;
    if (data.fecha || data.hora) {
      const f = data.fecha || existingNotes.fecha || citaTarget?.date.toISOString().split("T")[0];
      const h = data.hora || existingNotes.hora || "09:00";
      newDate = new Date(`${f}T${h}:00`);
    }

    await prisma.session.update({
      where: { id },
      data: {
        status: data.estado || citaTarget?.status,
        date: newDate,
        notes: updatedNotes
      }
    });

    revalidatePath("/dashboard/agenda");
    revalidatePath("/dashboard/asistencia");

    await logAuditAction({
      action: "ACTUALIZAR_CITA",
      details: `Se actualizó la cita del paciente "${citaTarget?.patient?.name || id}".`,
      target: citaTarget?.patient?.name || id
    });

    return { success: true };
  } catch (error) {
    console.error("Error actualizando cita:", error);
    return { success: false, error: "Error al actualizar la cita." };
  }
}

export async function deleteCita(id: string, deleteFuture: boolean = false) {
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
      
      const tz = await getSystemTimezone();
      const d = new Date();
      d.setDate(d.getDate() - 5);
      const cutoffDateStr = d.toLocaleDateString("en-CA", { timeZone: tz });
      let originalDateStr = cita?.date.toISOString().split("T")[0];
      if (cita?.notes) {
        try {
          const parsed = JSON.parse(cita.notes);
          if (parsed.fecha) originalDateStr = parsed.fecha;
        } catch (e) {}
      }
      if (originalDateStr && originalDateStr < cutoffDateStr) {
        return { success: false, error: `No tienes permisos para eliminar bloqueos con más de 5 días de antigüedad (Fecha límite: ${cutoffDateStr}).` };
      }
    }

    const citaTarget = await prisma.session.findUnique({ where: { id }, include: { patient: true } });

    if (citaTarget) {
      let fechaTarget = citaTarget.date.toISOString().split("T")[0];
      let horaTarget = "09:00";
      let frecuenciaTarget = "semanal";
      if (citaTarget.notes) {
        try {
          const parsed = JSON.parse(citaTarget.notes);
          if (parsed.fecha) fechaTarget = parsed.fecha;
          if (parsed.hora) horaTarget = parsed.hora;
          if (parsed.frecuencia) frecuenciaTarget = parsed.frecuencia;
        } catch (e) {}
      }

      if (deleteFuture) {
        const matchingSessions = await prisma.session.findMany({
          where: citaTarget.patientId ? { patientId: citaTarget.patientId } : { therapistId: citaTarget.therapistId }
        });

        const targetDate = new Date(`${fechaTarget}T12:00:00Z`);
        const targetDayOfWeek = targetDate.getUTCDay();
        const targetDayOfMonth = parseInt(fechaTarget.split("-")[2] || "1", 10);
        const freqLower = (frecuenciaTarget || "").toLowerCase();

        const idsToDelete = matchingSessions.filter(s => {
          let f = s.date.toISOString().split("T")[0];
          let h = "09:00";
          let sFreq = "";
          if (s.notes) {
            try {
              const p = JSON.parse(s.notes);
              if (p.fecha) f = p.fecha;
              if (p.hora) h = p.hora;
              if (p.frecuencia) sFreq = p.frecuencia;
            } catch (e) {}
          }

          // No borrar citas anteriores a la fecha seleccionada
          if (f < fechaTarget) return false;

          // Misma cita seleccionada
          if (s.id === id || (f === fechaTarget && h.substring(0, 2) === horaTarget.substring(0, 2))) {
            return true;
          }

          const sessionDate = new Date(`${f}T12:00:00Z`);
          const sessionDayOfWeek = sessionDate.getUTCDay();
          const sessionDayOfMonth = parseInt(f.split("-")[2] || "1", 10);
          const isSameTime = h.substring(0, 2) === horaTarget.substring(0, 2);
          const effectiveFreq = (freqLower || sFreq || "semanal").toLowerCase();

          if (effectiveFreq.includes("mensual")) {
            // Para citas mensuales: solo los mismos días del mes (ej. día 5) a la misma hora
            return sessionDayOfMonth === targetDayOfMonth && isSameTime;
          } else if (effectiveFreq.includes("semanal") || effectiveFreq.includes("quincenal")) {
            // Para citas semanales/quincenales: solo el mismo día de la semana (ej. Martes) a la misma hora
            return sessionDayOfWeek === targetDayOfWeek && isSameTime;
          } else if (effectiveFreq.includes("diario")) {
            // Para citas diarias: misma hora en días futuros
            return isSameTime;
          } else {
            // Fallback por defecto: mismo día de la semana a la misma hora
            return sessionDayOfWeek === targetDayOfWeek && isSameTime;
          }
        }).map(s => s.id);

        if (idsToDelete.length > 0) {
          await prisma.session.deleteMany({
            where: { id: { in: idsToDelete } }
          });
        }
      } else {
        const matchingSessions = await prisma.session.findMany({
          where: {
            patientId: citaTarget.patientId,
            therapistId: citaTarget.therapistId,
          }
        });

        const idsToDelete = matchingSessions.filter(s => {
          if (s.id === id) return true;
          let f = s.date.toISOString().split("T")[0];
          let h = "09:00";
          if (s.notes) {
            try {
              const p = JSON.parse(s.notes);
              if (p.fecha) f = p.fecha;
              if (p.hora) h = p.hora;
            } catch (e) {}
          }
          return f === fechaTarget && h.substring(0, 2) === horaTarget.substring(0, 2);
        }).map(s => s.id);

        if (idsToDelete.length > 0) {
          await prisma.session.deleteMany({
            where: { id: { in: idsToDelete } }
          });
        } else {
          await prisma.session.delete({ where: { id } }).catch(() => {});
        }
      }
    } else {
      await prisma.session.delete({ where: { id } }).catch(() => {});
    }

    revalidatePath("/dashboard/agenda");
    revalidatePath("/dashboard/asistencia");

    await logAuditAction({
      action: "ELIMINAR_CITA",
      details: `Se eliminó la cita del paciente "${citaTarget?.patient?.name || id}"${deleteFuture ? " (y citas futuras de su serie)" : ""}.`,
      target: citaTarget?.patient?.name || id
    });

    return { success: true };
  } catch (error) {
    console.error("Error eliminando cita:", error);
    return { success: false, error: "Error al eliminar la cita." };
  }
}
