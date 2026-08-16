"use server";

import { prisma } from "@/lib/prisma";

function parseMoneyStr(val: any): number {
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  if (typeof val === "string") {
    const clean = val.replace(/[^0-9.-]+/g, "");
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function toIsoDateStr(dStr?: string): string {
  if (!dStr) return "";
  const clean = dStr.trim();
  if (clean.includes("/")) {
    const parts = clean.split("/");
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
      }
      if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
      }
    }
  }
  if (clean.includes("-")) {
    const parts = clean.split("-");
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
      }
      if (parts[2].length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
      }
    }
  }
  return clean;
}

export async function getFinanzasMensuales(month: string, fechaDesde?: string, fechaHasta?: string) {
  try {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "porcentajeValoracion" DOUBLE PRECISION DEFAULT 50;`);
    } catch (e) {}

    // 1. Obtener todas las sesiones de la base de datos
    let sessions: any[] = [];
    try {
      sessions = await prisma.session.findMany({
        include: {
          patient: true,
          therapist: true
        }
      });
    } catch (err: any) {
      sessions = await prisma.session.findMany({
        include: {
          patient: true,
          therapist: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              especialidad: true,
              tipoPago: true,
              porcentaje: true,
              salarioBase: true,
              retieneIVA: true,
            }
          }
        }
      });
    }

    const normDesde = toIsoDateStr(fechaDesde);
    const normHasta = toIsoDateStr(fechaHasta);

    // Filtrar sesiones por rango de fechas o mes de consulta
    const monthSessions = sessions.filter(s => {
      let extra: any = {};
      try {
        if (s.notes) extra = JSON.parse(s.notes);
      } catch (e) {}

      const sessionDateStr = toIsoDateStr(extra.fecha || s.date.toISOString().split("T")[0]);

      // Regla de corte global: del 30 de junio de 2026 o anterior todo se considera $0.00
      if (sessionDateStr && sessionDateStr <= "2026-06-30") return false;

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

      if (!isRegistered) return false;

      if (normDesde && normHasta) {
        return sessionDateStr >= normDesde && sessionDateStr <= normHasta;
      }

      const sessionMonth = sessionDateStr.substring(0, 7); // YYYY-MM
      return sessionMonth === month;
    });

    let ingresosBrutosBruto = 0;
    let totalCanceloSAoPendiente = 0;
    let totalCanceloSAoPendienteDeducible = 0;
    
    // Terapeutas - agrupar por ID
    const terapeutasMap = new Map<string, any>();
    
    // 1. Ingresos y Nómina
    const sysSettings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    const ivaPct = (sysSettings?.ivaRate !== undefined && sysSettings?.ivaRate !== null) ? sysSettings.ivaRate : 16;
    const ivaDec = ivaPct / 100;

    monthSessions.forEach(s => {
      let extra: any = {};
      try {
        if (s.notes) extra = JSON.parse(s.notes);
      } catch (e) {}

      const montoPaid = parseFloat(extra.total || extra.montoPago || extra.costoSesion || s.patient?.precioTerapia || "0");
      const precioTotal = isNaN(montoPaid) ? 0 : montoPaid;

      const estNormFin = (extra.estadoAsistencia || extra.estado || s.status || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const isFreeCancelFin = (estNormFin.includes("con anticip") || estNormFin.includes("anticipad") || estNormFin.includes("centro")) && !estNormFin.includes("sin anticip");

      let montoP = parseMoneyStr(extra.montoPago || extra.montoP);
      if (montoP === 0 && (extra.pago === "SÍ" || extra.pago === "SI" || extra.pagado === true)) {
        montoP = precioTotal;
      }

      // Deuda o Cancelo S/A de esta sesión específica (sin acumular saldos históricos)
      let deudaSesion = 0;
      if (!isFreeCancelFin) {
        if (estNormFin.includes("sin anticip")) {
          deudaSesion = precioTotal;
        } else {
          deudaSesion = Math.max(0, precioTotal - montoP);
        }
      }

      const cobrarCanceloSA = Boolean((s.therapist as any)?.cobrarCanceloSA);

      if (deudaSesion > 0) {
        totalCanceloSAoPendiente += deudaSesion;
        if (!cobrarCanceloSA) {
          totalCanceloSAoPendienteDeducible += deudaSesion;
        }
      }

      // Check if factura was requested in the attendance session
      const hasFactura = extra.solicitaFactura === true || extra.solicitaFactura === "Sí" || extra.solicitaFactura === "SI" || extra.factura === "Sí" || extra.fact === "Sí";

      let sessionIva = 0;
      if (extra.iva !== undefined && extra.iva !== null && extra.iva !== "" && extra.iva !== 0) {
        sessionIva = typeof extra.iva === 'string' ? parseFloat(extra.iva.replace("$", "").replace(",", "")) : Number(extra.iva);
      } else if (hasFactura) {
        sessionIva = precioTotal * ivaDec;
      }

      ingresosBrutosBruto += precioTotal;

      const tId = s.therapistId;
      if (tId && !terapeutasMap.has(tId)) {
        terapeutasMap.set(tId, {
          id: tId,
          nombre: s.therapist?.name || "Desconocido",
          especialidad: s.therapist?.especialidad || "General",
          sesiones: 0,
          ingresoGenerado: 0,
          pago: 0,
          tipoPago: s.therapist?.tipoPago || "Porcentaje",
          porcentaje: s.therapist?.porcentaje || 0,
          salarioBase: s.therapist?.salarioBase || 0,
          retieneIVA: s.therapist?.retieneIVA || false,
          cobrarCanceloSA: cobrarCanceloSA,
          ivaRetenido: 0,
          ivaPaciente: 0,
          tieneFacturasEnPeriodo: false,
          canceloSAoPendiente: 0
        });
      }

      if (tId) {
        const tData = terapeutasMap.get(tId);
        tData.sesiones += 1;
        tData.ingresoGenerado += precioTotal;
        if (deudaSesion > 0) {
          tData.canceloSAoPendiente += deudaSesion;
        }

        if (hasFactura || sessionIva > 0) {
          tData.tieneFacturasEnPeriodo = true;
          tData.ivaPaciente += sessionIva;
        }

        // Si la terapeuta tiene activada la opcion de cobrar sobre Cancelo S/A, se toma el precioTotal integro. Si no, se descuenta la deuda de esta sesión.
        const ingresoEfectivoSesion = tData.cobrarCanceloSA
          ? precioTotal
          : Math.max(0, precioTotal - deudaSesion);

        if (tData.tipoPago === "Porcentaje") {
          let comisionBase = ingresoEfectivoSesion * ((tData.porcentaje || 0) / 100);
          if (tData.retieneIVA) {
            const ivaDelTerapeuta = comisionBase * ivaDec;
            tData.pago += (comisionBase + ivaDelTerapeuta);
            tData.ivaRetenido += ivaDelTerapeuta;
          } else {
            tData.pago += comisionBase;
          }
        }
      }
    });

    const ingresosBrutosOriginal = ingresosBrutosBruto;
    const ingresosBrutos = Math.max(0, ingresosBrutosBruto - totalCanceloSAoPendienteDeducible);

    // Agregar TODOS los terapeutas al reporte aunque no tengan sesiones
    const todosTerapeutas = await prisma.user.findMany({ where: { role: "Terapeuta" } });
    todosTerapeutas.forEach(t => {
        // Calcular salario base acumulado en las quincenas (15 y 30) del rango de fechas
        let pagoSalarioBase = 0;
        if (t.tipoPago === "Salario Base" && t.salarioBase) {
          if (normDesde && normHasta) {
            const dStart = new Date(normDesde);
            const dEnd = new Date(normHasta);
            let cur = new Date(dStart.getFullYear(), dStart.getMonth(), 1);
            const endMonth = new Date(dEnd.getFullYear(), dEnd.getMonth(), 1);

            while (cur <= endMonth) {
              const y = cur.getFullYear();
              const m = (cur.getMonth() + 1).toString().padStart(2, '0');
              
              // 1ª Quincena (Día 15)
              const q1DateStr = `${y}-${m}-15`;
              if (q1DateStr >= normDesde && q1DateStr <= normHasta) {
                pagoSalarioBase += t.salarioBase / 2;
              }

              // 2ª Quincena (Día 30 o último día)
              const lastDay = new Date(y, cur.getMonth() + 1, 0).getDate();
              const q2DateStr = `${y}-${m}-${lastDay.toString().padStart(2, '0')}`;
              if (q2DateStr >= normDesde && q2DateStr <= normHasta) {
                pagoSalarioBase += t.salarioBase / 2;
              }

              cur.setMonth(cur.getMonth() + 1);
            }
          } else {
            pagoSalarioBase = t.salarioBase; // Pago mensual completo (50% el 15 y 50% el 30)
          }
        }

        if (!terapeutasMap.has(t.id)) {
          terapeutasMap.set(t.id, {
            id: t.id,
            nombre: t.name,
            especialidad: t.especialidad,
            sesiones: 0,
            ingresoGenerado: 0,
            pago: t.tipoPago === "Salario Base" ? pagoSalarioBase : 0,
            tipoPago: t.tipoPago,
            porcentaje: t.porcentaje,
            salarioBase: t.salarioBase,
            retieneIVA: t.retieneIVA,
            ivaRetenido: 0,
            ivaPaciente: 0,
            canceloSAoPendiente: 0
          });
        } else {
          if (t.tipoPago === "Salario Base") {
            const tData = terapeutasMap.get(t.id);
            tData.pago = pagoSalarioBase;
          }
        }
    });

    const terapeutasData = Array.from(terapeutasMap.values());
    const totalNomina = terapeutasData.reduce((acc, t) => acc + t.pago, 0);

    // 2. Gastos Operativos
    const gastosData = await prisma.operationalExpense.findMany({
      where: { month }
    });
    const gastos = gastosData;
    const totalGastosOperativos = gastos.reduce((acc, g) => acc + g.amount, 0);

    // 3. Cálculos Finales:
    let ivaTotal = 0;
    let totalIvaFacturas = 0;

    terapeutasData.forEach(t => {
      if (t.ivaRetenido && t.ivaRetenido > 0) {
        ivaTotal += t.ivaRetenido;
      }
    });

    monthSessions.forEach(s => {
      let extra: any = {};
      try {
        if (s.notes) extra = JSON.parse(s.notes);
      } catch (e) {}
      const hasFactura = extra.solicitaFactura === true || extra.solicitaFactura === "Sí" || extra.solicitaFactura === "SI" || extra.factura === "Sí" || extra.fact === "Sí";
      
      const tId = s.therapistId;
      const tData = tId ? terapeutasMap.get(tId) : null;
      const tRetieneIVA = tData ? tData.retieneIVA : false;
      const tPorcentaje = tData?.tipoPago === "Porcentaje" ? (tData.porcentaje || 0) / 100 : 0;
      
      const precioTotal = extra.total ? (typeof extra.total === 'string' ? parseFloat(extra.total.replace("$", "").replace(",", "")) : Number(extra.total)) : 0;

      let sIva = 0;
      if (extra.iva !== undefined && extra.iva !== null && extra.iva !== "" && extra.iva !== 0) {
        sIva = typeof extra.iva === 'string' ? parseFloat(extra.iva.replace("$", "").replace(",", "")) : Number(extra.iva);
      } else if (hasFactura) {
        const sub = typeof extra.subtotal === 'string' ? parseFloat(extra.subtotal.replace("$", "").replace(",", "")) : Number(extra.subtotal || 0);
        const tot = typeof extra.total === 'string' ? parseFloat(extra.total.replace("$", "").replace(",", "")) : Number(extra.total || 0);
        if (tot > sub && sub > 0) {
          sIva = tot - sub;
        } else {
          sIva = precioTotal * ivaDec;
        }
      }

      if (hasFactura || sIva > 0) {
        if (tRetieneIVA && tData?.tipoPago === "Porcentaje") {
           const comisionBase = precioTotal * tPorcentaje;
           const ivaRet = comisionBase * ivaDec;
           totalIvaFacturas += Math.max(0, sIva - ivaRet);
        } else {
           totalIvaFacturas += sIva;
        }
      }
    });

    const subtotalIngresos = ingresosBrutos - totalIvaFacturas;
    const utilidadNeta = ingresosBrutos - totalNomina - totalGastosOperativos;
    const utilidadBruta = ingresosBrutos - totalNomina;
    const margenUtilidad = ingresosBrutos > 0 ? (utilidadNeta / ingresosBrutos) * 100 : 0;

    return {
      success: true,
      data: {
        ingresosBrutos,
        ingresosBrutosOriginal,
        totalCanceloSAoPendiente,
        subtotalIngresos,
        totalIvaFacturas,
        nomina: totalNomina,
        gastosOperativos: totalGastosOperativos,
        gastosList: gastos,
        ivaHonorarios: ivaTotal,
        utilidadNeta: utilidadNeta,
        terapeutas: terapeutasData,
        utilidadBruta,
        margenUtilidad,
        ivaPct
      }
    };
  } catch (error: any) {
    console.error("Error obteniendo finanzas:", error);
    return { success: false, error: error?.message || "Error desconocido" };
  }
}

export async function addGastoOperativo(month: string, label: string, amount: number) {
  try {
    await prisma.operationalExpense.create({
      data: { month, label, amount }
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error al guardar el gasto" };
  }
}

export async function removeGastoOperativo(id: string) {
  try {
    await prisma.operationalExpense.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error al eliminar el gasto" };
  }
}
