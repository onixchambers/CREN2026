"use server";

import { prisma } from "@/lib/prisma";

export async function registrarEntrada(terapeuta: string) {
  try {
    const hoy = new Date().toLocaleDateString("en-CA");
    
    // First, check if there's already an entry without an exit for today
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
        horaEntrada: new Date().toLocaleTimeString('en-US', { hour12: false })
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
    const hoy = new Date().toLocaleDateString("en-CA");
    
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
        horaSalida: new Date().toLocaleTimeString('en-US', { hour12: false })
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
    const hoy = new Date().toLocaleDateString("en-CA");
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
