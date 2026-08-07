"use server";

import { prisma } from "@/lib/prisma";
import { unstable_noStore as noStore } from "next/cache";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadFileToGoogleDrive } from "@/lib/googleDrive";
import { generateClinicalNotePdfBase64 } from "@/lib/pdfGenerator";
import { generateUniqueDisplayId } from "@/lib/displayId";

async function verifyTherapistPatientPermission() {
  const session = await getServerSession(authOptions);
  const userRole = ((session?.user as any)?.role || "").toUpperCase();
  if (userRole === "TERAPEUTA") {
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

    const displayId = await generateUniqueDisplayId(prisma);

    const patient = await prisma.patient.create({
      data: {
        displayId,
        name: data.nombre,
        fechaNacimiento: data.fechaNacimiento || null,
        sexo: data.sexo || null,
        fechaIngreso: data.fechaIngreso || null,
        estatus: data.estatus || "Activo",
        origen: data.origen || "Google",
        medicoTratante: data.medicoTratante || null,
        escuela: data.escuela || null,
        phone: data.pacienteContacto || data.phone || null,
        
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
      let asistenciasDetailed: Record<string, { asistencias: number, total: number }> = {};
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
      let latestTotalSesiones = 0;
      for (const s of p.sessions) {
        let extraName = "";
        let parsedNotes: any = null;
        if (s.notes) {
          try {
            parsedNotes = JSON.parse(s.notes);
            extraName = parsedNotes.terapeuta || "";
          } catch (e) {}
        }

        const therapistName = extraName || s.therapist?.name || "General";

        if (s.therapist?.name) sessionTherapists.push(s.therapist.name);
        if (extraName) sessionTherapists.push(extraName);

        // Inicializar el conteo detallado para este terapeuta
        if (therapistName) {
          if (!asistenciasDetailed[therapistName]) asistenciasDetailed[therapistName] = { asistencias: 0, total: 0 };
          asistenciasDetailed[therapistName].total++; // Incrementar por cada cita agendada
        }

        if (parsedNotes) {
          const sesNum = parseInt(parsedNotes.sesiones || parsedNotes.numeroSesiones || "0");
          if (sesNum > 0) {
            latestTotalSesiones = sesNum;
            if (therapistName) {
              asistenciasDetailed[therapistName].total = Math.max(asistenciasDetailed[therapistName].total, sesNum);
            }
          }

          const est = (parsedNotes.estadoAsistencia || "").toLowerCase();
          const isAttended = est === "asistio" || est === "cancelo sin anticipacion" || s.status === "COMPLETED";
          if (isAttended) {
            asistenciasCount++;
            if (therapistName) {
              asistenciasDetailed[therapistName].asistencias++;
            }
          }

          const tipo = (parsedNotes.tipoSesion || parsedNotes.tipoServicio || parsedNotes.serviceType || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const area = (parsedNotes.area || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const obs = (parsedNotes.obs || parsedNotes.observaciones || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          if (tipo.includes("valorac") || area.includes("valorac") || obs.includes("valorac") || tipo.includes("evaluac")) {
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

          if (parsedNotes.metodoPago && parsedNotes.metodoPago !== "SÍ" && parsedNotes.metodoPago !== "No") {
            lastMetodoPago = parsedNotes.metodoPago;
          } else if (parsedNotes.metodoPago2) {
            lastMetodoPago = `Mixto (${parsedNotes.metodoPago || 'P1'}: $${parsedNotes.montoPago || 0}, ${parsedNotes.metodoPago2}: $${parsedNotes.montoPago2 || 0})`;
          }
        } else {
          // Citas agendadas desde la Agenda sin notas avanzadas todavía
          if (s.status === "COMPLETED" || s.status === "SCHEDULED") {
            asistenciasCount++;
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

      // Si tiene sesiones/asistencias pero valoracionesCount es 0, asegurar al menos 1 valoración (la sesión inicial)
      const finalValoracionesCount = (valoracionesCount === 0 && (asistenciasCount > 0 || p.sessions.length > 0))
        ? 1
        : valoracionesCount;

      // Calcular denominador total de sesiones (ej. 3 para 1/3, 2/3, 3/3): máximo entre asistencias, total agendado y paquete guardado
      const dbSavedSesiones = parseInt((p as any).totalSesiones || (p as any).sesiones || "0") || 0;
      const calcTotalSesiones = Math.max(
        asistenciasCount,
        p.sessions.length,
        latestTotalSesiones,
        dbSavedSesiones,
        1
      );
      const totalSesionesStr = calcTotalSesiones.toString();

      return {
        ...p,
        medicoTratante: effectiveMedicoTratante || p.medicoTratante || "General",
        asistenciasDetailed,
        sessionTherapists: uniqueTherapists,
        asistencias: asistenciasCount,
        valoraciones: finalValoracionesCount,
        sesiones: totalSesionesStr,
        totalSesiones: totalSesionesStr,
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
        phone: data.pacienteContacto || data.phone || null,
        
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

export async function updatePatientStatus(id: string, estatus: string, motivo?: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "No autenticado." };
    }

    const patient = await prisma.patient.findUnique({ where: { id } });
    let newObs = patient?.observacionesAdmin || "";
    if (motivo && motivo.trim()) {
      const fechaHoy = new Date().toISOString().split("T")[0];
      const entry = `[MOTIVO DE BAJA - ${fechaHoy}]: ${motivo.trim()}`;
      newObs = newObs ? `${newObs}\n${entry}` : entry;
    }

    const updated = await prisma.patient.update({
      where: { id },
      data: {
        estatus: estatus || "Activo",
        observacionesAdmin: newObs
      }
    });

    revalidatePath("/dashboard/pacientes");
    revalidatePath("/dashboard");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error updating patient status:", error);
    return { success: false, error: error?.message || "Error al actualizar estado del paciente." };
  }
}

export async function getPatientDocuments(patientId: string) {
  try {
    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) return { success: false, error: "Paciente no encontrado." };
    let docs: any[] = [];
    if (patient.notes) {
      try {
        const parsed = JSON.parse(patient.notes);
        if (Array.isArray(parsed.documents)) docs = parsed.documents;
      } catch(e) {}
    }
    return { success: true, data: docs };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function savePatientDocument(patientId: string, docData: any) {
  try {
    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) return { success: false, error: "Paciente no encontrado." };

    let existingNotes: any = {};
    let docs: any[] = [];
    if (patient.notes) {
      try {
        existingNotes = JSON.parse(patient.notes);
        if (Array.isArray(existingNotes.documents)) docs = existingNotes.documents;
      } catch(e) {
        existingNotes = { raw: patient.notes };
      }
    }

    const rawDocName = (docData.terapeuta || "LOURDES RINCÓN").trim();
    const isDocNonTherapist = ["administrador", "admin", "contador", "invitado", "general"].some(kw => rawDocName.toLowerCase().includes(kw));
    const displayDocName = isDocNonTherapist ? rawDocName.replace(/^lic\.\s*/i, "") : (rawDocName.toLowerCase().startsWith("lic.") ? rawDocName : `Lic. ${rawDocName}`);

    let subfolder = "Nota Clínica";
    const tipoLower = (docData.tipo || "").toLowerCase();
    if (tipoLower.includes("consentimiento")) {
      subfolder = "Registros de Consentimiento Firmado";
    } else if (tipoLower.includes("informe") || tipoLower.includes("visita escolar")) {
      subfolder = "Informes";
    }

    // Ruta en formato Webhook para crear las subcarpetas correctas en Google Drive
    const subfolderPath = `${displayDocName}/${subfolder}`;
    const driveFolder = `Google Drive / ${displayDocName} / ${subfolder}`;

    const now = new Date();
    const docId = docData.id || "DOC-" + Math.floor(1000 + Math.random() * 9000);
    const docDate = docData.fecha || now.toISOString().split("T")[0];
    const docTime = docData.hora || now.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
    const docType = docData.tipo || "Registro de Evolución";

    // Generar el PDF oficial en base64 para subirlo a Google Drive
    let driveLink = docData.driveLink || "";
    try {
      const htmlBase64 = generateClinicalNotePdfBase64(patient.name, {
        fecha: docDate,
        hora: docTime,
        tipo: docType,
        terapeuta: displayDocName,
        contenido: docData.contenido || {}
      });
      const fileBuffer = Buffer.from(htmlBase64, "base64");
      const cleanPatientName = (patient.name || "Paciente").replace(/\s+/g, "_");
      const cleanDocType = docType.replace(/\s+/g, "_");
      const fileName = `${cleanDocType}_${cleanPatientName}_${docDate.replace(/-/g, "")}.pdf`;

      const driveRes = await uploadFileToGoogleDrive(fileBuffer, fileName, "application/pdf", subfolderPath);
      if (driveRes.success && driveRes.webViewLink) {
        driveLink = driveRes.webViewLink;
      }
    } catch (driveErr) {
      console.warn("Subida a Google Drive de nota clínica falló:", driveErr);
    }

    if (docData.id) {
      docs = docs.map(d => d.id === docData.id ? { ...d, ...docData, driveFolder, driveLink, updatedAt: new Date().toISOString() } : d);
    } else {
      const newDoc = {
        id: docId,
        fecha: docDate,
        hora: docTime,
        tipo: docType,
        terapeuta: displayDocName,
        driveFolder: driveFolder,
        driveLink: driveLink,
        contenido: docData.contenido || {},
        createdAt: now.toISOString()
      };
      docs.unshift(newDoc);
    }

    existingNotes.documents = docs;
    await prisma.patient.update({
      where: { id: patientId },
      data: { notes: JSON.stringify(existingNotes) }
    });

    revalidatePath("/dashboard/pacientes");
    return { success: true, data: docs };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deletePatientDocument(patientId: string, docId: string) {
  try {
    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) return { success: false, error: "Paciente no encontrado." };

    let existingNotes: any = {};
    let docs: any[] = [];
    if (patient.notes) {
      try {
        existingNotes = JSON.parse(patient.notes);
        if (Array.isArray(existingNotes.documents)) docs = existingNotes.documents;
      } catch(e) {}
    }

    docs = docs.filter(d => d.id !== docId);
    existingNotes.documents = docs;

    await prisma.patient.update({
      where: { id: patientId },
      data: { notes: JSON.stringify(existingNotes) }
    });

    revalidatePath("/dashboard/pacientes");
    return { success: true, data: docs };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function checkDuplicatePatient(data: { name?: string; phone?: string }) {
  try {
    const name = (data.name || "").trim().toLowerCase();
    const phone = (data.phone || "").trim().replace(/\D/g, "");
    if (!name && !phone) return { success: true, duplicates: [] };

    const allPatients = await prisma.patient.findMany({
      select: { id: true, displayId: true, name: true, phone: true, estatus: true, fechaNacimiento: true }
    });

    const duplicates = allPatients.filter(p => {
      const pName = (p.name || "").trim().toLowerCase();
      const pPhone = (p.phone || "").trim().replace(/\D/g, "");
      const sameName = name && (pName === name || (name.length > 4 && pName.includes(name)));
      const samePhone = phone && phone.length >= 7 && pPhone && pPhone.endsWith(phone.slice(-7));
      return sameName || samePhone;
    });

    return { success: true, duplicates };
  } catch (error: any) {
    console.error("Error checking duplicate patient:", error);
    return { success: false, error: error.message };
  }
}

export async function findPotentialDuplicates() {
  try {
    const all = await prisma.patient.findMany({
      include: {
        sessions: true,
        payments: true
      },
      orderBy: { createdAt: "desc" }
    });

    const groupsMap = new Map<string, any[]>();

    for (const p of all) {
      const normName = (p.name || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");

      const cleanPhone = (p.phone || "").replace(/\D/g, "");

      let foundKey = "";
      for (const [key, list] of groupsMap.entries()) {
        const ref = list[0];
        const refNorm = (ref.name || "")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]/g, "");
        const refPhone = (ref.phone || "").replace(/\D/g, "");

        if (normName && refNorm && normName === refNorm) {
          foundKey = key;
          break;
        }
        if (cleanPhone && cleanPhone.length >= 7 && refPhone && refPhone.endsWith(cleanPhone.slice(-7))) {
          foundKey = key;
          break;
        }
      }

      if (foundKey) {
        groupsMap.get(foundKey)!.push(p);
      } else {
        const newKey = normName || cleanPhone || p.id;
        groupsMap.set(newKey, [p]);
      }
    }

    const duplicateGroups = Array.from(groupsMap.values()).filter(group => group.length > 1);

    return { success: true, data: duplicateGroups };
  } catch (error: any) {
    console.error("Error finding potential duplicates:", error);
    return { success: false, error: error.message };
  }
}

export async function mergeDuplicatePatients(primaryId: string, secondaryIds: string[]) {
  try {
    if (!primaryId || !secondaryIds || secondaryIds.length === 0) {
      return { success: false, error: "Selecciona el paciente principal y al menos un duplicado a fusionar." };
    }

    const primary = await prisma.patient.findUnique({ where: { id: primaryId } });
    if (!primary) return { success: false, error: "Paciente principal no encontrado." };

    await prisma.session.updateMany({
      where: { patientId: { in: secondaryIds } },
      data: { patientId: primaryId }
    });

    await prisma.payment.updateMany({
      where: { patientId: { in: secondaryIds } },
      data: { patientId: primaryId }
    });

    const secondaries = await prisma.patient.findMany({
      where: { id: { in: secondaryIds } }
    });

    let primaryNotesObj: any = {};
    if (primary.notes) {
      try { primaryNotesObj = JSON.parse(primary.notes); } catch (e) {}
    }
    let primaryDocs = Array.isArray(primaryNotesObj.documents) ? primaryNotesObj.documents : [];

    for (const sec of secondaries) {
      if (sec.notes) {
        try {
          const secObj = JSON.parse(sec.notes);
          if (Array.isArray(secObj.documents)) {
            primaryDocs = [...primaryDocs, ...secObj.documents];
          }
        } catch (e) {}
      }
    }

    primaryNotesObj.documents = primaryDocs;
    await prisma.patient.update({
      where: { id: primaryId },
      data: { notes: JSON.stringify(primaryNotesObj) }
    });

    await prisma.patient.deleteMany({
      where: { id: { in: secondaryIds } }
    });

    revalidatePath("/dashboard/pacientes");
    revalidatePath("/dashboard/agenda");
    revalidatePath("/dashboard/asistencia");
    revalidatePath("/dashboard/finanzas");

    return { success: true, message: `Se fusionaron ${secondaryIds.length} registro(s) duplicados exitosamente en el paciente principal.` };
  } catch (error: any) {
    console.error("Error merging patients:", error);
    return { success: false, error: "Error al fusionar pacientes: " + (error?.message || String(error)) };
  }
}

