"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createPatient(data: any) {
  try {
    const patient = await prisma.patient.create({
      data: {
        name: data.nombre,
        fechaNacimiento: data.fechaNacimiento || null,
        sexo: data.sexo || null,
        fechaIngreso: data.fechaIngreso || null,
        estatus: data.estatus || "Activo",
        origen: data.origen || "Google",
        medicoTratante: data.medicoTratante || null,
        escuela: data.escuela || null,
        
        madreNombre: data.madreNombre || null,
        padreNombre: data.padreNombre || null,
        otrosNombre: data.otrosNombre || null,
        madreContacto: data.madreContacto || null,
        padreContacto: data.padreContacto || null,
        otrosContacto: data.otrosContacto || null,
        
        principalMadre: data.principalMadre || false,
        principalPadre: data.principalPadre || false,
        principalOtros: data.principalOtros || false,
        correoPrincipal: data.correoPrincipal || null,
        
        alergias: data.alergias || false,
        crisis: data.crisis || false,
        convulsiones: data.convulsiones || false,
        sensibilidad: data.sensibilidad || false,
        riesgoFuga: data.riesgoFuga || false,
        noSepara: data.noSepara || false,
        otrasAlertas: data.otrasAlertas || false,
        
        reglamentoFirmado: data.reglamentoFirmado || false,
        consentimientoFirmado: data.consentimientoFirmado || false,
        
        observacionesAdmin: data.observacionesAdmin || null,
        
        // Calcular edad basada en fecha de nacimiento si no viene calculada
        age: data.fechaNacimiento ? calculateAge(data.fechaNacimiento) : null
      }
    });

    revalidatePath("/dashboard/ficha");
    revalidatePath("/dashboard/pacientes");
    
    return { success: true, data: patient };
  } catch (error: any) {
    console.error("Error creating patient:", error);
    return { success: false, error: "Error de DB: " + (error?.message || String(error)) };
  }
}

export async function getPatients() {
  try {
    const patients = await prisma.patient.findMany({
      orderBy: { createdAt: "desc" }
    });
    return { success: true, data: patients };
  } catch (error) {
    console.error("Error fetching patients:", error);
    return { success: false, error: "Error al cargar los pacientes." };
  }
}

// Helper para calcular edad
function calculateAge(birthDateString: string) {
  const birth = new Date(birthDateString);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}
