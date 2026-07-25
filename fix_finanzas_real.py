import os

path = 'src/app/actions/finanzas.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Let's replace the whole body of getFinanzasMensuales to use actual Sessions.
new_body = '''export async function getFinanzasMensuales(month: string) {
  try {
    // 1. Obtener todas las sesiones del mes (Agenda)
    const sessions = await prisma.session.findMany({
      include: {
        patient: true,
        therapist: true
      }
    });

    // Filtrar sesiones por mes y pagadas
    const monthSessions = sessions.filter(s => {
      let extra: any = {};
      try {
        if (s.notes) extra = JSON.parse(s.notes);
      } catch (e) {}

      // Extraer mes de la fecha guardada en notes, o usar s.date
      const sessionDateStr = extra.fecha || s.date.toISOString().split("T")[0];
      const sessionMonth = sessionDateStr.substring(0, 7); // YYYY-MM
      return sessionMonth === month && extra.pagado === true;
    });

    let ingresosBrutos = 0;
    
    // Terapeutas - agrupar por ID
    const terapeutasMap = new Map<string, any>();
    
    // 1. Ingresos y Nómina
    monthSessions.forEach(s => {
      const precioTotalStr = s.patient.precioTerapia || "0";
      let precioTotal = parseFloat(precioTotalStr);
      if (isNaN(precioTotal)) precioTotal = 0;

      ingresosBrutos += precioTotal;

      const tId = s.therapistId;
      if (!terapeutasMap.has(tId)) {
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

      const tData = terapeutasMap.get(tId);
      tData.sesiones += 1;
      tData.ingresoGenerado += precioTotal;
      
      // Calcular pago (porcentaje sobre TOTAL, como pidió el cliente)
      if (tData.tipoPago === "Porcentaje") {
        let comisionBruta = precioTotal * ((tData.porcentaje || 0) / 100);
        // Si retiene IVA, restarle a su honorario
        if (tData.retieneIVA) {
          // IVA inclusivo matemático de la comisión: Base = Comision / 1.16, IVA = Comision - Base
          // Si dice "Descontar IVA (16%) de su honorario", restamos el 16% o sacamos el inclusivo?
          // "Para calcular el pago a las terapeutas que cobran por Porcentaje, sobre el pago total del paciente"
          // "Alguna terapeutas, debe haber una opcion que se coloque un chanco para que aplique el cobro del IVA"
          const baseComision = comisionBruta / 1.16;
          tData.pago += baseComision; // Le pagamos el subtotal (quitando IVA)
        } else {
          tData.pago += comisionBruta;
        }
      }
    });

    // Agregar terapeutas de salario base (que tal vez no tuvieron sesiones pero igual cobran)
    const todosTerapeutas = await prisma.user.findMany({ where: { role: "Terapeuta" } });
    todosTerapeutas.forEach(t => {
      if (t.tipoPago === "Salario Base") {
        if (!terapeutasMap.has(t.id)) {
          terapeutasMap.set(t.id, {
            id: t.id,
            nombre: t.name,
            especialidad: t.especialidad,
            sesiones: 0,
            ingresoGenerado: 0,
            pago: t.salarioBase || 0,
            tipoPago: t.tipoPago,
            porcentaje: t.porcentaje,
            salarioBase: t.salarioBase,
            retieneIVA: t.retieneIVA
          });
        } else {
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
      datos: {
        ingresosBrutos, // Esto es el dinero total que entró
        totalNomina,
        totalGastosOperativos,
        utilidadBruta,
        utilidadNeta,
        margenUtilidad,
        iva: ivaTotal // Se mostrará como impuesto a restar
      },
      terapeutas: terapeutasData,
      gastos
    };
  } catch (error: any) {
    console.error("Error obteniendo finanzas:", error);
    return { success: false, error: error?.message || "Error desconocido" };
  }
}'''

# Replace the old function
start_idx = content.find('export async function getFinanzasMensuales')
end_idx = content.find('export async function addGastoOperativo')

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + new_body + '\n\n' + content[end_idx:]

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
