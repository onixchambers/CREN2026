"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { unstable_noStore as noStore } from "next/cache";

export async function saveAsistenciaDB(data: any) {
  try {
    const pacienteStr = data.paciente || data.pacienteNombre;
    // Buscar paciente
    const patient = await prisma.patient.findFirst({ where: { name: pacienteStr } });
    if (!patient) return { success: false, error: "Paciente no encontrado." };

    // Buscar terapeuta asignado o especificado
    const allUsers = await prisma.user.findMany();
    let therapistId = "";
    const targetTherapist = (data.terapeuta || patient.medicoTratante || "").trim().toLowerCase();

    const match = allUsers.find(u => (u.name || "").trim().toLowerCase() === targetTherapist);
    if (match) {
      therapistId = match.id;
    } else if (patient.medicoTratante) {
      const medMatch = allUsers.find(u => (u.name || "").trim().toLowerCase() === patient.medicoTratante.trim().toLowerCase());
      if (medMatch) therapistId = medMatch.id;
      else if (allUsers.length > 0) therapistId = allUsers[0].id;
    } else if (allUsers.length > 0) {
      therapistId = allUsers[0].id;
    }
    
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

    // Calcular paquete actual
    let paqueteActual = 1;
    const sesionesInt = parseInt(data.sesiones || data.numeroSesiones || "1");
    if (sesionesInt > 1) {
      // Buscar sesion anterior con el mismo paquete
      const pastSessions = [...existingSessions].sort((a, b) => b.date.getTime() - a.date.getTime());
      for (const s of pastSessions) {
        if (!s.notes) continue;
        try {
          const e = JSON.parse(s.notes);
          if (e.asistenciaGuardada && parseInt(e.sesiones) === sesionesInt && (e.fecha !== data.fecha)) {
            if (e.paqueteActual && e.paqueteActual < sesionesInt) {
              paqueteActual = e.paqueteActual + 1;
              break;
            }
          }
        } catch(err) {}
      }
    }

    // Calcular saldo
    let saldo = 0;
    const montoP = parseFloat(data.montoPago || "0");
    const costoS = parseFloat(data.costoSesion || data.precioTerapia || "0");
    if (costoS > 0 || montoP > 0) {
      saldo = montoP - costoS;
    }

    // Datos financieros a guardar
    const estadoVal = data.estado || data.estadoAsistencia || "";
    const extra = {
      asistenciaGuardada: true,
      paqueteActual: paqueteActual,
      saldo: saldo,
      montoPago: data.montoPago || "",
      costoSesion: data.costoSesion || data.precioTerapia || "",
      fecha: data.fecha,
      area: data.area,
      tipoSesion: data.tipoSesion,
      estadoAsistencia: estadoVal,
      estado: estadoVal,
      sesiones: data.sesiones || data.numeroSesiones,
      metodoPago: (data.metodoPago && data.metodoPago !== "SÍ" && data.metodoPago !== "No") ? data.metodoPago : (data.metodoPagoFinal || data.metodoPago1 || "Efectivo"),
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
    revalidatePath("/dashboard/agenda");
    revalidatePath("/dashboard/pacientes");
    revalidatePath("/dashboard/finanzas");
    revalidatePath("/dashboard/honorarios");
    revalidatePath("/dashboard/estado-resultados");
    return { success: true };
  } catch (error: any) {
    console.error("Error guardando asistencia:", error);
    return { success: false, error: error.message };
  }
}


export async function getAsistenciasDB(_ts?: string) {
  noStore();
  try {
    const sessions = await prisma.session.findMany({
      include: { patient: true, therapist: true },
      orderBy: { date: 'asc' }
    });

    const patientAttendanceMap: { [patientKey: string]: any[] } = {};

    for (const s of sessions) {
      if (!s.notes) continue;
      try {
        const extra = JSON.parse(s.notes);
        if (extra.asistenciaGuardada) {
          const patientKey = s.patientId || s.patient?.name || "unknown";
          if (!patientAttendanceMap[patientKey]) {
            patientAttendanceMap[patientKey] = [];
          }
          patientAttendanceMap[patientKey].push({ s, extra });
        }
      } catch (e) {}
    }

    const asistencias: any[] = [];
    Object.values(patientAttendanceMap).forEach(records => {
      records.sort((a, b) => new Date(a.s.date).getTime() - new Date(b.s.date).getTime());
      
      records.forEach((rec, index) => {
        const { s, extra } = rec;
        const sessionNum = index + 1;
        const patientSessions = sessions.filter(x => (s.patientId && x.patientId === s.patientId) || (s.patient?.name && x.patient?.name === s.patient?.name));
        const totalFromNotes = parseInt(extra.sesiones || extra.numeroSesiones || "1");
        const totalCount = Math.max(totalFromNotes, patientSessions.length);
        const displaySesiones = totalCount > 1 ? `${sessionNum}/${totalCount}` : `${sessionNum}`;

        let metodoPagoStr = (extra.metodoPago && extra.metodoPago !== "SÍ" && extra.metodoPago !== "No") ? extra.metodoPago : (extra.metodoPago2 ? `Mixto (${extra.metodoPago || 'P1'}: $${extra.montoPago || 0}, ${extra.metodoPago2}: $${extra.montoPago2 || 0})` : (extra.metodoPago1 || "Efectivo"));

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
          sesiones: displaySesiones,
          pago: extra.pago || "SÍ",
          metodoPago: metodoPagoStr,
          fact: extra.solicitaFactura ? "Sí" : "No",
          subtotal: extra.subtotal != null ? "$" + Number(extra.subtotal).toFixed(2) : "$0.00",
          total: extra.total != null ? "$" + Number(extra.total).toFixed(2) : "$0.00",
          saldo: extra.saldo != null ? Number(extra.saldo) : 0,
          obs: extra.obs || "-",
          creadoPor: extra.creadoPor || "-",
          terapeuta: s.therapist?.name || "-"
        });
      });
    });

    asistencias.sort((a, b) => {
      const timeA = new Date(a.fecha).getTime();
      const timeB = new Date(b.fecha).getTime();
      if (timeB !== timeA) return timeB - timeA;
      return (b.id || "").localeCompare(a.id || "");
    });

    return { success: true, data: asistencias };
  } catch (error: any) {
    console.error("Error getAsistenciasDB:", error);
    return { success: false, error: error.message };
  }
}
