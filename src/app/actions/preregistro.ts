"use server";

import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { revalidatePath } from "next/cache";

export async function generatePreRegistrationToken(terapeutaName: string) {
  try {
    const token = crypto.randomUUID();
    const id = "prereg_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);

    const created = await (prisma as any).preRegistration.create({
      data: {
        id,
        token,
        name: "Borrador Paciente",
        medicoTratante: terapeutaName || "Administrador",
        status: "PENDING",
      },
    });

    return { success: true, token: created.token };
  } catch (error: any) {
    console.error("Error generating token:", error);
    return { success: false, error: error?.message || "Error al generar código QR" };
  }
}

export async function submitPreRegistration(formData: any, clientMetadata: { ip?: string; userAgent?: string }) {
  try {
    const {
      token,
      nombre,
      fechaNacimiento,
      sexo,
      fechaIngreso,
      origen,
      medicoTratante,
      escuela,
      madreNombre,
      madreContacto,
      principalMadre,
      padreNombre,
      padreContacto,
      principalPadre,
      otrosNombre,
      otrosContacto,
      principalOtros,
      correoPrincipal,
      alergias,
      crisis,
      convulsiones,
      sensibilidad,
      riesgoFuga,
      noSepara,
      otrasAlertas,
      signatureDataUrl,
    } = formData;

    if (!nombre || !nombre.trim()) {
      return { success: false, error: "El Nombre Completo del paciente es obligatorio." };
    }

    if (!signatureDataUrl) {
      return { success: false, error: "La firma digital del tutor/paciente es obligatoria." };
    }

    const timestamp = new Date().toISOString();
    const rawAuditPayload = `${nombre}|${fechaNacimiento}|${signatureDataUrl.slice(0, 100)}|${clientMetadata.ip || "0.0.0.0"}|${timestamp}`;
    const cryptoHash = crypto.createHash("sha256").update(rawAuditPayload).digest("hex");

    let existing = null;
    if (token) {
      existing = await (prisma as any).preRegistration.findUnique({ where: { token } });
    }

    const id = existing ? existing.id : "prereg_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
    const validToken = token || crypto.randomUUID();

    const dataPayload = {
      name: nombre.trim(),
      fechaNacimiento: fechaNacimiento || null,
      sexo: sexo || null,
      fechaIngreso: fechaIngreso || new Date().toISOString().split("T")[0],
      estatus: "Activo",
      origen: origen || "Google",
      medicoTratante: medicoTratante || "Administrador",
      escuela: escuela || null,
      madreNombre: madreNombre || null,
      madreContacto: madreContacto || null,
      principalMadre: !!principalMadre,
      padreNombre: padreNombre || null,
      padreContacto: padreContacto || null,
      principalPadre: !!principalPadre,
      otrosNombre: otrosNombre || null,
      otrosContacto: otrosContacto || null,
      principalOtros: !!principalOtros,
      correoPrincipal: correoPrincipal || null,
      alergias: !!alergias,
      crisis: !!crisis,
      convulsiones: !!convulsiones,
      sensibilidad: !!sensibilidad,
      riesgoFuga: !!riesgoFuga,
      noSepara: !!noSepara,
      otrasAlertas: !!otrasAlertas,
      signatureDataUrl: signatureDataUrl,
      ipAddress: clientMetadata.ip || "127.0.0.1",
      userAgent: clientMetadata.userAgent || "Mobile Device",
      cryptoHash: cryptoHash,
      status: "PENDING",
    };

    if (existing) {
      await (prisma as any).preRegistration.update({
        where: { id: existing.id },
        data: dataPayload,
      });
    } else {
      await (prisma as any).preRegistration.create({
        data: {
          id,
          token: validToken,
          ...dataPayload,
        },
      });
    }

    revalidatePath("/dashboard/pacientes");
    revalidatePath("/dashboard/preregistros");

    return {
      success: true,
      cryptoHash,
      signedAt: timestamp,
      message: "Registro y firma de consentimiento guardados con validez jurídica.",
    };
  } catch (error: any) {
    console.error("Error submitting pre-registration:", error);
    return { success: false, error: error?.message || "Error al procesar la firma." };
  }
}

export async function getPendingPreRegistrations() {
  try {
    const list = await (prisma as any).preRegistration.findMany({
      where: {
        status: "PENDING",
        AND: [
          { signatureDataUrl: { not: null } },
          { signatureDataUrl: { not: "" } },
        ],
      },
      orderBy: { updatedAt: "desc" },
    });
    return { success: true, data: list };
  } catch (error: any) {
    console.error("Error fetching pre-registrations:", error);
    return { success: false, error: "Error al consultar los registros." };
  }
}

export async function markPreRegistrationAsLoaded(id: string) {
  try {
    await (prisma as any).preRegistration.update({
      where: { id },
      data: { status: "LOADED" },
    });
    revalidatePath("/dashboard/pacientes");
    revalidatePath("/dashboard/preregistros");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating pre-registration status:", error);
    return { success: false, error: error?.message };
  }
}
