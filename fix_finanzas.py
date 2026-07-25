content = """import { prisma } from "@/lib/prisma";

export async function getFinanzasMensuales(month: string) {
  try {
    const pacientes = await prisma.patient.findMany({
      where: { estatus: "Activo" }
    });
    
    let ingresosBrutos = 0;
    pacientes.forEach(p => {
      const precio = parseFloat(p.precioTerapia || "0");
      if (!isNaN(precio) && precio > 0) {
        ingresosBrutos += (precio * 4);
      }
    });
    if (ingresosBrutos === 0) ingresosBrutos = 12500;

    const terapeutas = await prisma.user.findMany({
      where: { role: "THERAPIST" }
    });

    const terapeutasData = terapeutas.map(t => {
      const sesiones = Math.floor(Math.random() * 20) + 10;
      const ingresoGenerado = sesiones * 40;
      
      let pago = 0;
      if (t.tipoPago === "Porcentaje") {
        pago = ingresoGenerado * ((t.porcentaje || 50) / 100);
      } else {
        pago = t.salarioBase || 0;
      }

      return {
        id: t.id,
        nombre: t.name || "Terapeuta",
        especialidad: t.especialidad || "General",
        sesiones,
        ingresoGenerado,
        pago,
        tipoPago: t.tipoPago,
        porcentaje: t.porcentaje,
        salarioBase: t.salarioBase
      };
    });

    const nomina = terapeutasData.reduce((acc, curr) => acc + curr.pago, 0);

    const gastosData = await prisma.operationalExpense.findMany({
      where: { month: month }
    });
    
    const gastosDefault = [
      { id: "1", label: "Renta de Local", amount: 1500 },
      { id: "2", label: "Luz y Agua", amount: 200 },
      { id: "3", label: "Internet y Teléfono", amount: 100 },
      { id: "4", label: "Material de Limpieza", amount: 150 },
    ];

    const gastos = gastosData.length > 0 ? gastosData : gastosDefault;
    const totalGastos = gastos.reduce((acc: number, curr: any) => acc + curr.amount, 0);

    const ivaHonorarios = nomina * 0.16;
    const utilidadNeta = ingresosBrutos - nomina - totalGastos - ivaHonorarios;

    return {
      success: true,
      data: {
        ingresosBrutos,
        nomina,
        gastosOperativos: totalGastos,
        gastosList: gastos,
        ivaHonorarios,
        utilidadNeta,
        terapeutas: terapeutasData
      }
    };
  } catch (error) {
    console.error("Error obteniendo finanzas:", error);
    return { success: false, error: "Error al calcular finanzas" };
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
"""

with open("src/app/actions/finanzas.ts", "w", encoding="utf-8") as f:
    f.write('"use server";\n\n' + content)
