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
    monthSessions.forEach(s => {
      let extra: any = {};
      try {
        if (s.notes) extra = JSON.parse(s.notes);
      } catch (e) {}

      const montoPaid = parseFloat(extra.montoPago || extra.costoSesion || extra.total || s.patient?.precioTerapia || "0");
      const precioTotal = isNaN(montoPaid) ? 0 : montoPaid;

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
          retieneIVA: s.therapist?.retieneIVA || false
        });
      }

      if (tId) {
        const tData = terapeutasMap.get(tId);
        tData.sesiones += 1;
        tData.ingresoGenerado += precioTotal;
        
        // Calcular pago (porcentaje sobre el pago del paciente registrado en Honorarios)
        if (tData.tipoPago === "Porcentaje") {
          let comisionBruta = precioTotal * ((tData.porcentaje || 0) / 100);
          if (tData.retieneIVA) {
            const baseComision = comisionBruta / 1.16;
            tData.pago += baseComision;
          } else {
            tData.pago += comisionBruta;
          }
        }
      }
    });

    // Agregar TODOS los terapeutas al reporte aunque no tengan sesiones
    const todosTerapeutas = await prisma.user.findMany({ where: { role: "Terapeuta" } });
    todosTerapeutas.forEach(t => {
        if (!terapeutasMap.has(t.id)) {
          terapeutasMap.set(t.id, {
            id: t.id,
            nombre: t.name,
            especialidad: t.especialidad,
            sesiones: 0,
            ingresoGenerado: 0,
            pago: t.tipoPago === "Salario Base" ? (t.salarioBase || 0) : 0,
            tipoPago: t.tipoPago,
            porcentaje: t.porcentaje,
            salarioBase: t.salarioBase,
            retieneIVA: t.retieneIVA
          });
        } else {
          if (t.tipoPago === "Salario Base") {
            const tData = terapeutasMap.get(t.id);
            tData.pago = t.salarioBase || 0; // Salario base fijo, independiente de sesiones
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

    // 3. Cálculos Finales
    // Según la regla matemática: Base = Precio / 1.16. IVA = Precio - Base.
    // Solo se cobra IVA si la terapia lo causa. Asumiremos que el IVA aplica a los ingresos
    // generados por terapeutas que tienen "retieneIVA" = true.
    let ivaTotal = 0;
    terapeutasData.forEach(t => {
      if (t.retieneIVA) {
        // Ingreso generado por este terapeuta ya incluye el IVA
        const ingresoGenerado = t.ingresoGenerado;
        const subtotal = ingresoGenerado / 1.16;
        ivaTotal += (ingresoGenerado - subtotal);
      }
    });

    // El Subtotal real para la clínica (descontando el IVA cobrado y guardado para pagar al SAT)
    const ingresosSubtotal = ingresosBrutos - ivaTotal;

    const utilidadBruta = ingresosSubtotal - totalNomina;
    const utilidadNeta = utilidadBruta - totalGastosOperativos;
    const margenUtilidad = ingresosSubtotal > 0 ? (utilidadNeta / ingresosSubtotal) * 100 : 0;

    return {
      success: true,
      data: {
        ingresosBrutos,
        nomina: totalNomina,
        gastosOperativos: totalGastosOperativos,
        gastosList: gastos,
        ivaHonorarios: ivaTotal,
        utilidadNeta: utilidadNeta,
        terapeutas: terapeutasData,
        utilidadBruta,
        margenUtilidad
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
