"use server";

import { prisma } from "@/lib/prisma";
import { unstable_noStore as noStore } from "next/cache";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function verifyTherapistPatientPermission() {
  const session = await getServerSession(authOptions);
  const userRole = ((session?.user as any)?.role || "").toUpperCase();
  if (userRole === "TERAPEUTA" || userRole === "INVITADO") {
    const s = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    const allow = s?.allowTherapistEdit ?? true;
    if (!allow) {
      return { allowed: false, error: "La administración no tiene habilitado el permiso para editar o borrar en esta sección." };
    }
  }
  return { allowed: true };
}

export async function createPatient(data: any) {
  try {
    const patientName = (data.nombre || "").trim();
    if (!patientName) {
      return { success: false, error: "El nombre del paciente es obligatorio." };
    }

    // Prevención de duplicación: Si ya se creó un paciente con el mismo nombre en los últimos 30 segundos, retornar el existente
    const thirtySecsAgo = new Date(Date.now() - 30 * 1000);
    const existingRecent = await prisma.patient.findFirst({
      where: {
        name: patientName,
        createdAt: { gte: thirtySecsAgo }
      }
    });

    if (existingRecent) {
      console.log(`Deduplicación de paciente activa para '${patientName}'`);
      return { success: true, data: existingRecent, isDuplicatePrevented: true };
    }

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
      const sessionTherapists: string[] = [];
      let asistenciasCount = 0;
      let valoracionesCount = 0;
      let totalPagadoSum = 0;
      let totalCostoSum = 0;
      let lastPaymentDate = "";
      let lastPaymentAmount = 0;
      let lastMetodoPago = p.metodoPago || "Efectivo";
      const pricesSet = new Set<number>();

      // Si el paciente tiene precio configurado por defecto
      if (p.precioTerapia) {
        const baseP = parseFloat(p.precioTerapia);
        if (!isNaN(baseP) && baseP > 0) pricesSet.add(baseP);
      }

      // Procesar todas las sesiones registradas en Asistencia
      for (const s of p.sessions) {
        let extraName = "";
        let parsedNotes: any = null;
        if (s.notes) {
          try {
            parsedNotes = JSON.parse(s.notes);
            extraName = parsedNotes.terapeuta || "";
          } catch (e) {}
        }

        if (s.therapist?.name) sessionTherapists.push(s.therapist.name);
        if (extraName) sessionTherapists.push(extraName);

        if (parsedNotes) {
          const est = (parsedNotes.estadoAsistencia || "").toLowerCase();
          const isAttended = est === "asistio" || est === "cancelo sin anticipacion" || s.status === "COMPLETED";
          if (isAttended) {
            asistenciasCount++;
          }

          const tipo = (parsedNotes.tipoSesion || "").toLowerCase();
          const area = (parsedNotes.area || "").toLowerCase();
          if (tipo.includes("valoraci") || area.includes("valoraci")) {
            valoracionesCount++;
          }

          const costo = parseFloat(parsedNotes.costoSesion || parsedNotes.precioTerapia || "0");
          if (!isNaN(costo) && costo > 0) {
            pricesSet.add(costo);
            if (isAttended) totalCostoSum += costo;
          }

          const monto = parseFloat(parsedNotes.montoPago || "0");
          if (!isNaN(monto) && monto > 0) {
            totalPagadoSum += monto;
            lastPaymentAmount = monto;
            if (parsedNotes.fecha) {
              const parts = parsedNotes.fecha.split("-");
              lastPaymentDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : parsedNotes.fecha;
            }
          }

          if (parsedNotes.metodoPago) {
            lastMetodoPago = parsedNotes.metodoPago;
          }
        }
      }

      // Formatear precioTerapia: si hay varios montos (ej. 500 y 900) -> "500 / 900", de lo contrario "—"
      const sortedPrices = Array.from(pricesSet).sort((a, b) => a - b);
      const precioTerapiaDisplay = sortedPrices.length > 0 
        ? sortedPrices.map(pr => `${pr}`).join(" / ")
        : (p.precioTerapia && p.precioTerapia !== "500" ? p.precioTerapia : "—");

      const saldoCalculado = totalPagadoSum - totalCostoSum;

      // Si medicoTratante es vacio o un admin (ej. onixchambers), pero hay un terapeuta asignado en las sesiones (ej. Karla), asignar a ese terapeuta
      const uniqueTherapists = Array.from(new Set(sessionTherapists));
      let effectiveMedicoTratante = p.medicoTratante || "";
      if (uniqueTherapists.length > 0) {
        const primaryTherapist = uniqueTherapists[0];
        if (!effectiveMedicoTratante || effectiveMedicoTratante.toLowerCase().includes("admin") || effectiveMedicoTratante.toLowerCase().includes("onix")) {
          effectiveMedicoTratante = primaryTherapist;
        }
      }

      return {
        ...p,
        medicoTratante: effectiveMedicoTratante || p.medicoTratante || "General",
        sessionTherapists: uniqueTherapists,
        asistencias: asistenciasCount,
        valoraciones: valoracionesCount,
        totalPagado: totalPagadoSum.toFixed(2),
        totalCosto: totalCostoSum.toFixed(2),
        saldoCalculado: saldoCalculado.toFixed(2),
        precioTerapia: precioTerapiaDisplay,
        metodoPago: lastMetodoPago,
        ultima: lastPaymentAmount > 0 
          ? `$${lastPaymentAmount.toFixed(2)}${lastPaymentDate ? ` (${lastPaymentDate})` : ""}`
          : "—"
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

export async function updatePatientPhoto(id: string, foto: string) {
  try {
    const updated = await prisma.patient.update({
      where: { id },
      data: { foto }
    });
    revalidatePath("/dashboard/pacientes");
    revalidatePath("/dashboard/preregistros");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error updating patient photo:", error);
    return { success: false, error: "Error al actualizar foto de paciente: " + (error?.message || String(error)) };
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

export async function updatePatientStatus(id: string, estatus: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "No autenticado." };
    }

    const updated = await prisma.patient.update({
      where: { id },
      data: { estatus: estatus || "Activo" }
    });

    revalidatePath("/dashboard/pacientes");
    revalidatePath("/dashboard");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error updating patient status:", error);
    return { success: false, error: error?.message || "Error al actualizar estado del paciente." };
  }
}
