"use server";

import { prisma } from "@/lib/prisma";

export async function getFinanzasMensuales(month: string) {
  try {
    const pacientes = await prisma.patient.findMany({
      where: { estatus: "Activo" }
    });
    
    let ingresosBrutos = 0;
    // En un sistema real, leerías de las sesiones/citas reales marcadas como 'pagadas' o 'completadas'.
    // Por ahora sumamos los precios de las terapias de pacientes activos si existen.
    pacientes.forEach(p => {
      const precio = parseFloat(p.precioTerapia || "0");
      if (!isNaN(precio) && precio > 0) {
        ingresosBrutos += (precio * 4); // Asumiendo 4 terapias mensuales (debe ser dinámico después)
      }
    });

    const terapeutas = await prisma.user.findMany({
      where: { role: "THERAPIST" }
    });

    const terapeutasData = terapeutas.map(t => {
      const sesiones = 0; // Sin sesiones reales aún
      const ingresoGenerado = 0;
      
      let pago = 0;
      if (t.tipoPago === "Salario Base") {
        pago = t.salarioBase || 0;
      } else {
        pago = ingresoGenerado * ((t.porcentaje || 0) / 100);
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
    
    const gastos = gastosData;
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
