"use server";

import { prisma } from "@/lib/prisma";
import { unstable_noStore as noStore } from "next/cache";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function verifyTherapistPatientPermission() {
  const session = await getServerSession(authOptions);
  const userRole = ((session?.user as any)?.role || "").toUpperCase();
  if (userRole === "TERAPEUTA") {
    const s = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    const allow = s?.allowTherapistEdit ?? true;
    if (!allow) {
      return { allowed: false, error: "La administración no tiene habilitado el permiso para editar o borrar pacientes." };
    }
  }
  return { allowed: true };
}

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
        foto: data.foto || null,
        
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
  noStore();
  try {
    const patients = await prisma.patient.findMany({
      include: {
        sessions: {
          include: { therapist: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const mapped = patients.map(p => {
      const sessionTherapists = p.sessions
        .map(s => {
          let extraName = "";
          try {
            if (s.notes) {
              const extra = JSON.parse(s.notes);
              extraName = extra.terapeuta || "";
            }
          } catch(e) {}
          return [s.therapist?.name, extraName];
        })
        .flat()
        .filter(Boolean) as string[];

      return {
        ...p,
        sessionTherapists: Array.from(new Set(sessionTherapists))
      };
    });

    return { success: true, data: mapped };
  } catch (error) {
    console.error("Error fetching patients:", error);
    return { success: false, error: "Error al cargar los pacientes." };
  }
}

export async function updatePatientFast(id: string, data: any) {
  try {
    const perm = await verifyTherapistPatientPermission();
    if (!perm.allowed) return { success: false, error: perm.error };

    const updated = await prisma.patient.update({
      where: { id },
      data: {
        name: data.nombre,
        sexo: data.sexo,
        fechaNacimiento: data.fechaNacimiento,
        precioTerapia: data.precioTerapia,
        metodoPago: data.metodoPago,
        estatus: data.estatus || "Activo",
        // Calcular edad basada en fecha de nacimiento
        age: data.fechaNacimiento ? calculateAge(data.fechaNacimiento) : null
      }
    });

  revalidatePath("/dashboard/pacientes");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error updating patient:", error);
    return { success: false, error: "Error de DB: " + (error?.message || String(error)) };
  }
}

export async function updatePatient(id: string, data: any) {
  try {
    const perm = await verifyTherapistPatientPermission();
    if (!perm.allowed) return { success: false, error: perm.error };

    const updated = await prisma.patient.update({
      where: { id },
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
        foto: data.foto || null,
        
        // Calcular edad basada en fecha de nacimiento si no viene calculada
        age: data.fechaNacimiento ? calculateAge(data.fechaNacimiento) : null
      }
    });

    revalidatePath("/dashboard/pacientes");
    revalidatePath("/dashboard/preregistros");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error updating full patient:", error);
    return { success: false, error: "Error de DB: " + (error?.message || String(error)) };
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

export async function deletePatient(id: string) {
  try {
    const perm = await verifyTherapistPatientPermission();
    if (!perm.allowed) return { success: false, error: perm.error };

    await prisma.$transaction([
      prisma.session.deleteMany({ where: { patientId: id } }),
      prisma.payment.deleteMany({ where: { patientId: id } }),
      prisma.patient.delete({ where: { id } })
    ]);
    revalidatePath("/dashboard/pacientes");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting patient:", error);
    return { success: false, error: "Error de DB al borrar paciente: " + (error?.message || String(error)) };
  }
}
