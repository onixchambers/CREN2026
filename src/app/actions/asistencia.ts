"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { unstable_noStore as noStore } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function parseMoneyStr(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export async function saveAsistenciaDB(data: any) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = ((session?.user as any)?.role || "").toUpperCase();
    if (userRole === "TERAPEUTA") {
      const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
      const tz = settings?.timezone || 'America/Mexico_City';
      const d = new Date();
      d.setDate(d.getDate() - 5);
      const cutoffDateStr = d.toLocaleDateString("en-CA", { timeZone: tz });
      const targetDateStr = (data.fecha || "").substring(0, 10);
      
      if (targetDateStr < cutoffDateStr) {
        return { success: false, error: `No tienes permisos para registrar o modificar asistencias con más de 5 días de antigüedad (Fecha límite: ${cutoffDateStr}).` };
      }
      
      if (data.id && data.id.length > 10) {
        const existingSession = await prisma.session.findUnique({ where: { id: data.id } });
        if (existingSession) {
          let originalDateStr = existingSession.date.toISOString().split("T")[0];
          if (existingSession.notes) {
            try {
              const parsed = JSON.parse(existingSession.notes);
              if (parsed.fecha) originalDateStr = parsed.fecha;
            } catch (e) {}
          }
          if (originalDateStr < cutoffDateStr) {
            return { success: false, error: `No tienes permisos para modificar asistencias con más de 5 días de antigüedad (Fecha límite: ${cutoffDateStr}).` };
          }
        }
      }
    }

    const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    const tz = settings?.timezone || 'America/Mexico_City';

    const pacienteStr = data.paciente || data.pacienteNombre;
    // Buscar paciente
    const patient = await prisma.patient.findFirst({ where: { name: pacienteStr } });
    if (!patient) return { success: false, error: "Paciente no encontrado." };

    // Buscar terapeuta asignado o especificado
    let allUsers: any[] = [];
    try {
      allUsers = await prisma.user.findMany({ select: { id: true, name: true, role: true } });
    } catch (e) {
      allUsers = await prisma.user.findMany();
    }
    let therapistId = "";
    const targetTherapist = (data.terapeuta || patient.medicoTratante || "").trim().toLowerCase();

    const match = allUsers.find(u => (u.name || "").trim().toLowerCase() === targetTherapist);
    if (match) {
      therapistId = match.id;
    } else if (patient.medicoTratante) {
      const medName = (patient.medicoTratante || "").trim().toLowerCase();
      const medMatch = allUsers.find(u => (u.name || "").trim().toLowerCase() === medName);
      if (medMatch) therapistId = medMatch.id;
      else if (allUsers.length > 0) therapistId = allUsers[0].id;
    } else if (allUsers.length > 0) {
      therapistId = allUsers[0].id;
    }
    
    if (!therapistId) return { success: false, error: "Terapeuta no encontrado." };

    const horaVal = data.hora || "09:00";
    const jsDate = new Date(`${data.fecha}T${horaVal}:00`);

    // Intentar buscar una cita existente de este paciente en este día
    // Para simplificar, buscamos todas y comparamos la fecha ignorando la hora
    const existingSessions = await prisma.session.findMany({
      where: {
        patientId: patient.id,
        therapistId: therapistId,
      }
    });

    let targetSession = null;

    // Si viene un ID directo de la sesión (ej. desde el modal de edición)
    if (data.id && data.id.length > 10) {
      targetSession = await prisma.session.findUnique({
        where: { id: data.id }
      });
    }

    if (!targetSession && data.agendaId) {
      for (const s of existingSessions) {
        if (s.notes) {
          try {
             const extra = JSON.parse(s.notes);
             if (extra.agendaId === data.agendaId) {
                targetSession = s;
                break;
             }
          } catch(e) {}
        }
      }
    }
    
    // 3. Fallback por fecha y hora exacta
    if (!targetSession && data.hora) {
      for (const s of existingSessions) {
        let sFecha = "";
        let sHora = "";
        if (s.notes) {
          try {
            const extra = JSON.parse(s.notes);
            if (extra.fecha) sFecha = extra.fecha;
            if (extra.hora) sHora = extra.hora;
          } catch(e) {}
        }
        if (!sFecha) {
          sFecha = s.date.toISOString().split("T")[0];
        }
        if (!sHora) {
          sHora = s.date.toISOString().split("T")[1]?.substring(0, 5) || "";
        }

        if (sFecha === data.fecha && sHora === data.hora) {
          targetSession = s;
          break;
        }
      }
    }

    // 4. Fallback por fecha y hora exacta buscando en todas las sesiones del paciente (si cambió de terapeuta)
    if (!targetSession && data.hora) {
      const allPatientSessions = await prisma.session.findMany({
        where: { patientId: patient.id }
      });
      for (const s of allPatientSessions) {
        let sFecha = "";
        let sHora = "";
        if (s.notes) {
          try {
            const extra = JSON.parse(s.notes);
            if (extra.fecha) sFecha = extra.fecha;
            if (extra.hora) sHora = extra.hora;
          } catch(e) {}
        }
        if (!sFecha) {
          sFecha = s.date.toISOString().split("T")[0];
        }
        if (!sHora) {
          sHora = s.date.toISOString().split("T")[1]?.substring(0, 5) || "";
        }
        if (sFecha === data.fecha && sHora === data.hora) {
          targetSession = s;
          break;
        }
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

    // Calcular saldo acumulado previo del paciente (créditos a favor o adeudos anteriores)
    let saldoPrevio = 0;
    if (patient.id) {
      const pObj = await prisma.patient.findUnique({
        where: { id: patient.id },
        include: { sessions: true }
      });
      if (pObj) {
        let totalPag = 0;
        let totalCos = 0;
        for (const s of pObj.sessions) {
          if (targetSession && s.id === targetSession.id) continue;
          if (s.notes) {
            try {
              const n = JSON.parse(s.notes);
              const sDate = n.fecha || s.date.toISOString().split("T")[0];
              if (sDate <= "2026-06-30") continue; // Omite historial del 30 junio 2026 o anterior
              const m = parseFloat(n.montoPago || "0");
              const c = parseFloat(n.costoSesion || n.precioTerapia || "0");
              const est = (n.estadoAsistencia || "").toLowerCase();
              const isAttended = est === "asistio" || est === "cancelo sin anticipacion" || s.status === "COMPLETED";
              if (!isNaN(m) && m > 0) totalPag += m;
              if (!isNaN(c) && c > 0 && isAttended) totalCos += c;
            } catch(e) {}
          }
        }
        saldoPrevio = totalPag - totalCos;
      }
    }
        // Calcular saldo final incluyendo crédito previo (ej: +100 previo + 400 pago 1 + 300 pago 2 - 700 costo = 0.00)
    const p1 = parseMoneyStr(data.montoPago);
    const p2 = parseMoneyStr(data.montoPago2);
    let montoP = p1 + p2;

    if (montoP === 0 && data.metodoPagoFinal && data.metodoPagoFinal.includes("$")) {
      const matches = [...data.metodoPagoFinal.matchAll(/\$([\d.]+)/g)];
      let sum = 0;
      for (const m of matches) {
        sum += parseFloat(m[1]) || 0;
      }
      if (sum > 0) montoP = sum;
    }

    let targetCost = 0;
    const rawCostInput = data.costoSesion !== undefined ? data.costoSesion : data.precioTerapia;
    if (rawCostInput !== undefined && rawCostInput !== null && rawCostInput !== "") {
      targetCost = parseMoneyStr(rawCostInput);
    } else if (targetSession && targetSession.notes) {
      try {
        const extraExisting = JSON.parse(targetSession.notes);
        targetCost = parseMoneyStr(extraExisting.costoSesion || extraExisting.precioTerapia || extraExisting.total);
      } catch(e) {}
    } else {
      targetCost = parseMoneyStr(data.total || data.subtotal);
    }
    const costoS = targetCost;
    const totalInput = parseMoneyStr(data.total);
    const subtotalInput = parseMoneyStr(data.subtotal);
    
    // Si el costo de sesión (costoS) se definió explícitamente como 0, el total debe ser 0.
    const totalVal = (rawCostInput !== undefined && rawCostInput !== null && rawCostInput !== "" && targetCost === 0)
      ? 0
      : (totalInput > 0 ? totalInput : (montoP > 0 ? montoP : costoS));

    const solicitaFactura = (data.solicitaFactura === true || data.solicitaFactura === "true" || data.solicitaFactura === "Sí" || data.solicitaFactura === "Si" || data.solicitaFactura === "S" || data.fact === "Sí" || data.fact === "Si" || data.fact === "S" || data.fact === true);

    let subVal = totalVal;
    let ivaVal = 0;

    if (solicitaFactura && totalVal > 0) {
      ivaVal = totalVal * 0.16;
      subVal = totalVal - ivaVal;
    } else if (!solicitaFactura && subtotalInput > 0) {
      subVal = subtotalInput;
    }

    const estadoVal = data.estadoAsistencia || data.estado || "Asistio";
    const estNormVal = estadoVal.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const isAsistioVal = estNormVal === "asistio";
    const isCancelVal = estNormVal.includes("cancelo") || estNormVal.includes("recuperado");
    const isFreeCancel = (estNormVal.includes("con anticip") || estNormVal.includes("anticipad") || estNormVal.includes("centro") || estNormVal.includes("recuperado")) && !estNormVal.includes("sin anticip");

    if (isCancelVal) {
      montoP = 0;
    }

    const fuePagado = !isFreeCancel && !isCancelVal && (montoP > 0 || (totalVal > 0 && data.montoPago && parseMoneyStr(data.montoPago) > 0) || data.pago === "SÍ" || data.pago === "SI" || data.pagado === true);

    const isNoPagoVal = (montoP === 0 || isCancelVal);
    let metodoPagoStr = data.metodoPagoFinal || data.metodoPago || "Efectivo";
    if (isNoPagoVal) {
      metodoPagoStr = "Ninguno";
    } else {
      if (metodoPagoStr === "Ninguno") {
        metodoPagoStr = "Efectivo";
      }
      if (!metodoPagoStr.includes("$") && !metodoPagoStr.includes("\n") && (montoP > 0 || totalVal > 0)) {
        const amt = montoP > 0 ? montoP : totalVal;
        metodoPagoStr = `${metodoPagoStr} $${amt}`;
      }
    }

    const saldo = isFreeCancel ? 0 : (montoP - costoS);

    // Datos financieros a guardar
    const extra = {
      asistenciaGuardada: estadoVal !== "Agendado",
      agendaId: data.agendaId || "",
      paqueteActual: paqueteActual,
      saldo: isFreeCancel ? 0 : saldo,
      montoPago: montoP.toString(),
      costoSesion: costoS.toString(),
      fecha: data.fecha,
      hora: data.hora || "09:00",
      area: data.area || "",
      tipoSesion: data.tipoSesion || "Individual",
      estadoAsistencia: estadoVal,
      estado: estadoVal,
      sesiones: data.sesiones || data.numeroSesiones || "1",
      solicitaFactura: solicitaFactura,
      subtotal: subVal,
      iva: ivaVal,
      total: totalVal,
      fact: solicitaFactura ? "Sí" : "No",
      obs: data.obs || "—",
      creadoPor: data.creadoPor,
      pago: fuePagado ? "SÍ" : "NO",
      pagado: fuePagado,
      metodoPago: metodoPagoStr,
      metodoPago2: data.metodoPago2 || "",
      montoPago2: data.montoPago2 || "",
      frecuencia: data.frecuencia || "Única",
      horaRegistro: (() => {
        // Usar la hora agendada de la cita (de la session existente en agenda)
        if (targetSession && targetSession.notes) {
          try {
            const existingNotes = JSON.parse(targetSession.notes);
            if (existingNotes.hora) return existingNotes.hora;
          } catch(e) {}
        }
        // Si se pasa horaRegistro explícitamente, usarla
        if (data.horaRegistro) return data.horaRegistro;
        // Fallback: hora actual del sistema
        return new Date().toLocaleTimeString('es-MX', { hour12: false, timeZone: tz });
      })()
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
          date: jsDate,
          status: isAsistioVal ? "COMPLETED" : "CANCELLED",
          notes: finalNotes
        }
      });
    } else {
      finalNotes = JSON.stringify(extra);
      await prisma.session.create({
        data: {
          patientId: patient.id,
          therapistId: therapistId,
          date: jsDate,
          status: isAsistioVal ? "COMPLETED" : "CANCELLED",
          notes: finalNotes
        }
      });
    }

    revalidatePath("/dashboard/asistencia");
    return { success: true };
  } catch (error: any) {
    console.error("Error al guardar asistencia en BD:", error);
    return { success: false, error: error.message || "Error al guardar asistencia." };
  }
}

export async function getAsistenciasDB() {
  noStore();
  try {
    const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    const tz = settings?.timezone || 'America/Mexico_City';
    const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: tz });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sessions = await prisma.session.findMany({
      where: {
        date: {
          lte: tomorrow
        }
      },
      select: {
        id: true,
        date: true,
        status: true,
        notes: true,
        patientId: true,
        therapistId: true,
        patient: {
          select: {
            id: true,
            name: true,
            displayId: true,
            precioTerapia: true,
            medicoTratante: true,
            sexo: true,
            age: true
          }
        },
        therapist: {
          select: {
            name: true
          }
        }
      },
      orderBy: { date: "desc" },
      take: 400
    });

    const patientMap: { [key: string]: any[] } = {};

    sessions.forEach(s => {
      let extra: any = {};
      if (s.notes) {
        try { extra = JSON.parse(s.notes); } catch(e) {}
      }

      const estNorm = (extra.estadoAsistencia || extra.estado || s.status || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const isRegistered = extra.asistenciaGuardada === true || 
                           extra.pagado === "SÍ" || 
                           extra.pagado === "SI" || 
                           extra.pagado === true || 
                           Boolean(extra.metodoPago && extra.metodoPago.trim() !== "") || 
                           Boolean(extra.montoPago && extra.montoPago !== "0" && extra.montoPago !== "") || 
                           estNorm.includes("asistio") || 
                           estNorm.includes("cancelo") || 
                           s.status === "COMPLETED" || 
                           s.status === "CANCELLED";

      // Determinar si es una sesión agendada en el pasado o hoy (nunca futuras)
      let sFecha = extra.fecha;
      if (!sFecha) {
        try {
          sFecha = s.date.toLocaleDateString("en-CA", { timeZone: tz });
        } catch {
          sFecha = s.date.toISOString().split("T")[0];
        }
      }
      const isScheduledPastOrToday = sFecha <= todayStr;

      // Si no está registrada y no es una sesión del pasado/hoy, la descartamos
      if (!isRegistered && !isScheduledPastOrToday) return;

      const pKey = s.patientId || s.patient?.name || "desconocido";
      if (!patientMap[pKey]) patientMap[pKey] = [];
      patientMap[pKey].push({ s, extra });
    });

    const asistencias: any[] = [];

    Object.values(patientMap).forEach(records => {
      records.sort((a, b) => new Date(a.s.date).getTime() - new Date(b.s.date).getTime());

      // Encontrar el último índice de sesión activa (no agendada ni cancelación gratuita)
      let latestActiveIndex = -1;
      records.forEach((rec, index) => {
        const { s, extra } = rec;
        const estNorm = (extra.estadoAsistencia || extra.estado || s.status || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const mappedEstado = extra.estadoAsistencia || extra.estado || (s.status === "COMPLETED" ? "Asistio" : (s.status === "CANCELLED" ? "Cancelo el centro" : "Agendado"));
        const isAgendado = mappedEstado.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes("agendado");
        const isFreeCancel = !isAgendado && (estNorm.includes("con anticip") || estNorm.includes("anticipad") || estNorm.includes("centro") || estNorm.includes("recuperado")) && !estNorm.includes("sin anticip");
        if (!isAgendado && !isFreeCancel) {
          latestActiveIndex = index;
        }
      });
      const targetIndex = latestActiveIndex !== -1 ? latestActiveIndex : (records.length - 1);
      const startIndexInAsistencias = asistencias.length;

      let runningBalance = 0;

      records.forEach((rec, index) => {
        const { s, extra } = rec;
        const sessionNum = index + 1;
        const patientSessions = sessions.filter(x => (s.patientId && x.patientId === s.patientId) || (s.patient?.name && x.patient?.name === s.patient?.name));
        const totalFromNotes = parseInt(extra.sesiones || extra.numeroSesiones || "1");
        const totalCount = Math.max(totalFromNotes, patientSessions.length);
        const displaySesiones = totalCount > 1 ? `${sessionNum}/${totalCount}` : `${sessionNum}`;

        const estNorm = (extra.estadoAsistencia || extra.estado || s.status || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const mappedEstado = extra.estadoAsistencia || extra.estado || (s.status === "COMPLETED" ? "Asistio" : (s.status === "CANCELLED" ? "Cancelo el centro" : "Agendado"));
        const isAgendado = mappedEstado.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes("agendado");

        const isFreeCancel = !isAgendado && (estNorm.includes("con anticip") || estNorm.includes("anticipad") || estNorm.includes("centro") || estNorm.includes("recuperado")) && !estNorm.includes("sin anticip");

        let metodoPagoStr = isAgendado ? "Ninguno" : (extra.metodoPago || extra.metodoPagoFinal || extra.metodoPago1 || (isFreeCancel ? "Ninguno" : "Efectivo"));
        if (!isAgendado && isFreeCancel && (metodoPagoStr === "Efectivo" || !extra.metodoPago)) {
          metodoPagoStr = "Ninguno";
        }
        if (!isAgendado && extra.metodoPago2) {
          metodoPagoStr = `Mixto (${extra.metodoPago || extra.metodoPago1 || 'P1'}: $${extra.montoPago || 0}, ${extra.metodoPago2}: $${extra.montoPago2 || 0})`;
        }

        let montoP = isAgendado ? 0 : parseMoneyStr(extra.montoPago);
        let totalVal = isAgendado ? 0 : parseMoneyStr(extra.total || extra.subtotal);

        const defaultPrice = parseFloat((s.patient?.precioTerapia || "500").split("/")[0]) || 500;

        // Si es una sesión con costo (Asistió o Canceló S/A) y totalVal/montoP es 0 pero hay costoSesion o precioTerapia, recuperar valores
        if (!isFreeCancel && !isAgendado) {
          const costoS = parseMoneyStr(extra.costoSesion || extra.precioTerapia) || defaultPrice;
          if (costoS > 0) {
            if (totalVal === 0) totalVal = costoS;
            const isNinguno = (metodoPagoStr || "").toLowerCase().includes("ninguno");
            if (montoP === 0 && !isNinguno && (extra.pago === "SÍ" || extra.pago === "SI" || extra.pagado === true)) {
              montoP = costoS;
            }
          }
        }

        if (!isAgendado && !metodoPagoStr.includes("$") && (montoP > 0 || totalVal > 0)) {
          const amt = montoP > 0 ? montoP : totalVal;
          metodoPagoStr = `${metodoPagoStr} $${amt}`;
        }

        const costoS = (isFreeCancel || isAgendado) ? 0 : (parseMoneyStr(extra.costoSesion || extra.precioTerapia) || totalVal || defaultPrice);
        const sDate = extra.fecha || (s.date instanceof Date ? s.date.toISOString().split("T")[0] : String(s.date).split("T")[0]);
        const isBeforeCutoff = sDate && sDate <= "2026-06-30";

        const isNinguno = (metodoPagoStr || "").toLowerCase().includes("ninguno");
        const fuePagado = !isFreeCancel && !isAgendado && !isNinguno && (montoP > 0 || totalVal > 0 || extra.pago === "SÍ" || extra.pago === "SI" || extra.pagado === true);

        if (fuePagado && montoP === 0) {
          montoP = costoS;
        }

        const sessionSaldo = (isFreeCancel || isAgendado || isBeforeCutoff) ? 0 : (montoP - costoS);
        runningBalance += sessionSaldo;

        const solicitaFactura = !isAgendado && (extra.solicitaFactura === true || extra.solicitaFactura === "true" || extra.solicitaFactura === "Sí" || extra.solicitaFactura === "Si" || extra.solicitaFactura === "S" || extra.fact === "Sí" || extra.fact === "Si" || extra.fact === "S" || extra.fact === true);
        let subtotalVal = isAgendado ? 0 : parseMoneyStr(extra.subtotal);
        let ivaVal = isAgendado ? 0 : parseMoneyStr(extra.iva);

        if (solicitaFactura && totalVal > 0) {
          if (ivaVal === 0) ivaVal = totalVal * 0.16;
          if (subtotalVal === 0 || subtotalVal === totalVal) subtotalVal = totalVal - ivaVal;
        } else if (!solicitaFactura) {
          subtotalVal = totalVal;
          ivaVal = 0;
        }

        const horaFormatted = (extra.hora || extra.horaRegistro || (s.date ? new Date(s.date).toISOString().split("T")[1]?.substring(0, 5) : "") || "09:00").toString().trim().substring(0, 5);

        asistencias.push({
          id: s.id,
          fecha: extra.fecha || s.date.toISOString().split("T")[0],
          hora: horaFormatted,
          horaRegistro: extra.hora || extra.horaRegistro || "-",
          area: extra.area || s.patient?.medicoTratante || "-",
          paciente: s.patient?.name || extra.paciente || extra.pacienteNombre || "-",
          pacienteId: s.patient?.id || extra.pacienteId || "",
          displayId: s.patient?.displayId || extra.displayId || "",
          sexo: s.patient?.sexo || extra.sexo || extra.pacienteSexo || "-",
          edad: s.patient?.age?.toString() || extra.edad || extra.pacienteEdad || "-",
          tipoSesion: extra.tipoSesion || "Individual",
          estado: mappedEstado,
          sesiones: displaySesiones,
          frecuencia: extra.frecuencia || "Única",
          pago: fuePagado ? "SÍ" : "NO",
          metodoPago: metodoPagoStr,
          fact: solicitaFactura ? "Sí" : "No",
          subtotal: "$" + Number(subtotalVal).toFixed(2),
          iva: "$" + Number(ivaVal).toFixed(2),
          total: "$" + Number(totalVal).toFixed(2),
          saldo: 0,
          obs: extra.obs || "-",
          creadoPor: extra.creadoPor || "-",
          terapeuta: s.therapist?.name || extra.terapeuta || extra.terapeutaNombre || "-"
        });
      });

      if (asistencias.length > startIndexInAsistencias && targetIndex >= 0) {
        asistencias[startIndexInAsistencias + targetIndex].saldo = runningBalance;
      }
    });


    asistencias.sort((a, b) => {
      const timeA = new Date(a.fecha).getTime();
      const timeB = new Date(b.fecha).getTime();
      if (timeB !== timeA) return timeB - timeA;
      // Dentro del mismo día, ordenar por hora de cita descendente (más reciente arriba)
      const horaA = (a.horaRegistro || "00:00").replace(/[^0-9:]/g, "");
      const horaB = (b.horaRegistro || "00:00").replace(/[^0-9:]/g, "");
      return horaB.localeCompare(horaA);
    });

    return { success: true, data: asistencias };
  } catch (error: any) {
    console.error("Error getAsistenciasDB:", error);
    return { success: false, error: error.message };
  }
}

export async function getSessionByAgendaId(agendaId: string) {
  try {
    const session = await prisma.session.findFirst({
      where: { notes: { contains: `agendaId:${agendaId}` } }
    });
    return { success: true, data: session };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Actualiza SOLO el metodoPago de una sesión sin tocar ningún otro campo financiero
export async function updateMetodoPagoOnly(sessionId: string, nuevoMetodoPago: string) {
  try {
    const sessionUser = await getServerSession(authOptions);
    const userRole = ((sessionUser?.user as any)?.role || "").toUpperCase();
    if (userRole === "TERAPEUTA") {
      const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
      const tz = settings?.timezone || 'America/Mexico_City';
      const d = new Date();
      d.setDate(d.getDate() - 5);
      const cutoffDateStr = d.toLocaleDateString("en-CA", { timeZone: tz });

      const dbSession = await prisma.session.findUnique({ where: { id: sessionId } });
      if (dbSession) {
        let originalDateStr = dbSession.date.toISOString().split("T")[0];
        if (dbSession.notes) {
          try {
            const parsed = JSON.parse(dbSession.notes);
            if (parsed.fecha) originalDateStr = parsed.fecha;
          } catch (e) {}
        }
        if (originalDateStr < cutoffDateStr) {
          return { success: false, error: `No tienes permisos para modificar el método de pago de sesiones con más de 5 días de antigüedad (Fecha límite: ${cutoffDateStr}).` };
        }
      }
    }

    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) return { success: false, error: "Sesión no encontrada." };

    let extra: any = {};
    try { extra = JSON.parse(session.notes || "{}"); } catch(e) {}

    // Solo cambiamos el campo metodoPago, todo lo demás se conserva intacto
    extra.metodoPago = nuevoMetodoPago;

    await prisma.session.update({
      where: { id: sessionId },
      data: { notes: JSON.stringify(extra) }
    });

    revalidatePath("/dashboard/asistencia");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
