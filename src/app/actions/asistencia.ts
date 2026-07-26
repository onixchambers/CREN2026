"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function saveAsistenciaDB(data: any) {
  try {
    const pacienteStr = data.paciente || data.pacienteNombre;
    // Buscar paciente
    const patient = await prisma.patient.findFirst({ where: { name: pacienteStr } });
    if (!patient) return { success: false, error: "Paciente no encontrado." };

    // Buscar terapeuta
    const allUsers = await prisma.user.findMany();
    let therapistId = "";
    const match = allUsers.find(u => (u.name || "").trim().toLowerCase() === (data.terapeuta || "").trim().toLowerCase());
    if (match) therapistId = match.id;
    else if (allUsers.length > 0) therapistId = allUsers[0].id;
    
    if (!therapistId) return { success: false, error: "Terapeuta no encontrado." };

    // Construir fecha base (00:00:00) local
    const jsDate = new Date(`${data.fecha}T00:00:00`);

    // Intentar buscar una cita existente de este paciente en este día
    // Para simplificar, buscamos todas y comparamos la fecha ignorando la hora
    const existingSessions = await prisma.session.findMany({
      where: {
        patientId: patient.id,
        therapistId: therapistId,
      }
    });

    let targetSession = null;
    for (const s of existingSessions) {
      if (s.date.toISOString().split("T")[0] === data.fecha) {
        targetSession = s;
        break;
      }
    }

    // Datos financieros a guardar
    const estadoVal = data.estado || data.estadoAsistencia || "";
    const extra = {
      asistenciaGuardada: true,
      fecha: data.fecha,
      area: data.area,
      tipoSesion: data.tipoSesion,
      estadoAsistencia: estadoVal,
      sesiones: data.sesiones || data.numeroSesiones,
      metodoPago: data.pago || data.metodoPago,
      solicitaFactura: data.fact === "Sí" || data.solicitaFactura === "Sí",
      subtotal: data.subtotal ? (typeof data.subtotal === 'string' ? parseFloat(data.subtotal.replace("$", "")) : data.subtotal) : 0,
      total: data.total ? (typeof data.total === 'string' ? parseFloat(data.total.replace("$", "")) : data.total) : 0,
      obs: data.obs,
      creadoPor: data.creadoPor,
      pagado: estadoVal === "Asistio" || estadoVal === "Cancelo sin anticipacion"
    };

    let finalNotes = "";
    if (targetSession) {
      let existingExtra = {};
      try {
        if (targetSession.notes) existingExtra = JSON.parse(targetSession.notes);
      } catch(e) {}
      finalNotes = JSON.stringify({ ...existingExtra, ...extra });

      await prisma.session.update({
        where: { id: targetSession.id },
        data: {
          status: estadoVal === "Asistio" ? "COMPLETED" : (estadoVal.includes("Cancelo") ? "CANCELLED" : targetSession.status),
          notes: finalNotes
        }
      });
    } else {
      finalNotes = JSON.stringify(extra);
      await prisma.session.create({
        data: {
          date: jsDate,
          status: estadoVal === "Asistio" ? "COMPLETED" : (estadoVal.includes("Cancelo") ? "CANCELLED" : "SCHEDULED"),
          notes: finalNotes,
          therapistId,
          patientId: patient.id
        }
      });
    }

    revalidatePath("/dashboard/asistencia");
    revalidatePath("/dashboard/finanzas");
    revalidatePath("/dashboard/honorarios");
    revalidatePath("/dashboard/estado-resultados");
    return { success: true };
  } catch (error: any) {
    console.error("Error guardando asistencia:", error);
    return { success: false, error: error.message };
  }
}
