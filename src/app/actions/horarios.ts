"use server";

import { prisma } from "@/lib/prisma";

async function getNowInTimezone() {
  const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
  const tz = settings?.timezone || "America/Mexico_City";
  const now = new Date();
  
  const fecha = now.toLocaleDateString("en-CA", { timeZone: tz });
  const hora = now.toLocaleTimeString("en-GB", { timeZone: tz, hour12: false });
  return { fecha, hora, tz };
}

export async function registrarEntrada(terapeuta: string) {
  try {
    const { fecha: hoy, hora: horaActual } = await getNowInTimezone();
    
    // Check if there's already an entry without an exit for today
    const existente = await prisma.horario.findFirst({
      where: {
        terapeuta: terapeuta,
        fecha: hoy,
        horaSalida: null
      }
    });

    if (existente) {
      return { success: false, error: "Ya tienes una entrada activa registrada." };
    }

    const nuevoHorario = await prisma.horario.create({
      data: {
        terapeuta: terapeuta,
        fecha: hoy,
        horaEntrada: horaActual
      }
    });

    return { success: true, data: nuevoHorario };
  } catch (error) {
    console.error("Error registrando entrada:", error);
    return { success: false, error: "Error interno" };
  }
}

export async function registrarSalida(terapeuta: string) {
  try {
    const { fecha: hoy, hora: horaActual } = await getNowInTimezone();
    
    // Find active entry
    const activa = await prisma.horario.findFirst({
      where: {
        terapeuta: terapeuta,
        fecha: hoy,
        horaSalida: null
      }
    });

    if (!activa) {
      return { success: false, error: "Este terapeuta no tiene una entrada activa registrada." };
    }

    const actualizado = await prisma.horario.update({
      where: { id: activa.id },
      data: {
        horaSalida: horaActual
      }
    });

    return { success: true, data: actualizado };
  } catch (error) {
    console.error("Error registrando salida:", error);
    return { success: false, error: "Error interno" };
  }
}

export async function getHorariosHoy() {
  try {
    const { fecha: hoy } = await getNowInTimezone();
    const horarios = await prisma.horario.findMany({
      where: { fecha: hoy },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: horarios };
  } catch (error) {
    console.error("Error cargando horarios:", error);
    return { success: false, data: [] };
  }
}

export async function getHorariosByDate(fecha: string) {
  try {
    const horarios = await prisma.horario.findMany({
      where: { fecha: fecha },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: horarios };
  } catch (error) {
    console.error("Error cargando horarios:", error);
    return { success: false, data: [] };
  }
}
