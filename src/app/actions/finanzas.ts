"use server";

import { prisma } from "@/lib/prisma";

export async function getFinanzasMensuales(month: string, fechaDesde?: string, fechaHasta?: string) {
  try {
    // 1. Obtener todas las sesiones de la base de datos
    const sessions = await prisma.session.findMany({
      include: {
        patient: true,
        therapist: true
      }
    });

    // Filtrar sesiones por rango de fechas o mes de consulta
    const monthSessions = sessions.filter(s => {
      let extra: any = {};
      try {
        if (s.notes) extra = JSON.parse(s.notes);
      } catch (e) {}

      const sessionDateStr = extra.fecha || s.date.toISOString().split("T")[0];

      if (fechaDesde && fechaHasta) {
        return sessionDateStr >= fechaDesde && sessionDateStr <= fechaHasta && (extra.pagado === true || extra.asistenciaGuardada === true);
      }

      const sessionMonth = sessionDateStr.substring(0, 7); // YYYY-MM
      return sessionMonth === month && (extra.pagado === true || extra.asistenciaGuardada === true);
    });

    let ingresosBrutos = 0;
    
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

      // Check if factura was requested in the attendance session
      const hasFactura = extra.solicitaFactura === true || extra.solicitaFactura === "Sí" || extra.solicitaFactura === "SI" || extra.factura === "Sí" || extra.fact === "Sí";

      let sessionIva = 0;
      if (extra.iva !== undefined && extra.iva !== null && extra.iva !== "" && extra.iva !== 0) {
        sessionIva = typeof extra.iva === 'string' ? parseFloat(extra.iva.replace("$", "").replace(",", "")) : Number(extra.iva);
      } else if (hasFactura) {
        sessionIva = precioTotal * ivaDec;
      }

      ingresosBrutos += precioTotal;

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
          ivaRetenido: 0,
          tieneFacturasEnPeriodo: false
        });
      }

      if (tId) {
        const tData = terapeutasMap.get(tId);
        tData.sesiones += 1;
        tData.ingresoGenerado += precioTotal;

        if (hasFactura || sessionIva > 0) {
          tData.tieneFacturasEnPeriodo = true;
          tData.ivaRetenido += sessionIva;
        }

        // Calcular pago
        if (tData.tipoPago === "Porcentaje") {
          let comisionBase = precioTotal * ((tData.porcentaje || 0) / 100); // 75
          if (tData.retieneIVA) {
            const ivaDelTerapeuta = comisionBase * ivaDec; // 12
            tData.pago += (comisionBase + ivaDelTerapeuta); // 87
            tData.ivaRetenido += ivaDelTerapeuta; // 12
          } else {
            tData.pago += comisionBase; // 75
          }
        }
      }
    });

    // Agregar TODOS los terapeutas al reporte aunque no tengan sesiones
    const todosTerapeutas = await prisma.user.findMany({ where: { role: "Terapeuta" } });
    todosTerapeutas.forEach(t => {
        // Calcular salario base acumulado en las quincenas (15 y 30) del rango de fechas
        let pagoSalarioBase = 0;
        if (t.tipoPago === "Salario Base" && t.salarioBase) {
          if (fechaDesde && fechaHasta) {
            const dStart = new Date(fechaDesde);
            const dEnd = new Date(fechaHasta);
            let cur = new Date(dStart.getFullYear(), dStart.getMonth(), 1);
            const endMonth = new Date(dEnd.getFullYear(), dEnd.getMonth(), 1);

            while (cur <= endMonth) {
              const y = cur.getFullYear();
              const m = (cur.getMonth() + 1).toString().padStart(2, '0');
              
              // 1ª Quincena (Día 15)
              const q1DateStr = `${y}-${m}-15`;
              if (q1DateStr >= fechaDesde && q1DateStr <= fechaHasta) {
                pagoSalarioBase += t.salarioBase / 2;
              }

              // 2ª Quincena (Día 30 o último día)
              const lastDay = new Date(y, cur.getMonth() + 1, 0).getDate();
              const q2DateStr = `${y}-${m}-${lastDay.toString().padStart(2, '0')}`;
              if (q2DateStr >= fechaDesde && q2DateStr <= fechaHasta) {
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
            ivaRetenido: 0
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
    // Regla exacta del usuario: Si sesión cuesta 400 y comision 50%: Terapeuta recibe 200, IVA retenido por CREN es 32 (16% de 200), Utilidad CREN = 400 - 200 - 32 = 168.
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

      if (hasFactura || (extra.iva && parseFloat(extra.iva) > 0)) {
        // If retieneIVA is true, the therapist took their cut (87) and we only pay IVA on CREN's remaining cut (63)
        if (tRetieneIVA && tData?.tipoPago === "Porcentaje") {
           const comisionBase = precioTotal * tPorcentaje;
           const comisionGross = comisionBase * (1 + ivaDec);
           const crenCut = precioTotal - comisionGross;
           totalIvaFacturas += (crenCut * ivaDec);
        } else {
           const sIva = extra.iva ? (typeof extra.iva === 'string' ? parseFloat(extra.iva.replace("$", "").replace(",", "")) : Number(extra.iva)) : (precioTotal * ivaDec);
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
